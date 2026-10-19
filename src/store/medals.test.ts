import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

// sem IndexedDB no Node: o save fica só na memória
vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { mergeSaves } from '../cloud/reconcile-plan';
import { againstLook, DEFAULT_LOOK, isUnlocked, lookOfCupClub, lookOfPeer, lookOfProfile } from './club-kit';
import { duelWins } from './duels';
import { migrateSave, SAVE_VERSION, useGame } from './game-store';
import {
    encodeShowcase,
    frameTier,
    MEDALS,
    type MedalView,
    medalById,
    medalProgress,
    medalTiers,
    parseShowcase,
    resolveShowcase,
    tierOf,
    toggleShowcase,
} from './medals';
import { missionById, PLATINUM, platinumItems } from './missions';
import {
    albumCount,
    clubColorHex,
    EDITION_BIT,
    EMPTY_CAREER,
    EMPTY_ENTRY,
    movesFound,
    playedCount,
    seenCount,
} from './profile';

const viewOf = (save: ReturnType<typeof migrateSave>): MedalView => ({
    records: save.records,
    dex: save.dex,
    moves: save.moves,
    career: save.career,
    hall: save.hall,
    runs: [save.run, ...save.parkedRuns],
    done: new Set(save.profile.missionsDone),
    duels: save.duels,
});
const fixture = (lang: string) => {
    const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
    return migrateSave(backup.save, backup.version);
};
const empty = (): MedalView => ({
    records: { cups: 0, titles: 0, perfect: 0 },
    dex: {},
    moves: {},
    career: EMPTY_CAREER,
    hall: [],
    runs: [],
    done: new Set(),
    duels: [],
});

describe('medalhas', () => {
    it('20 medalhas, ids únicos, degraus crescentes', () => {
        expect(MEDALS).toHaveLength(20);
        expect(new Set(MEDALS.map((m) => m.id)).size).toBe(20);
        for (const m of MEDALS) for (let i = 1; i < 4; i++) expect(m.steps[i]).toBeGreaterThan(m.steps[i - 1]);
    });

    it('degrau pela fronteira: abaixo do bronze 0, no número exato sobe', () => {
        const m = medalById('campeao')!;
        expect([0, 1, 4, 5, 24, 25, 99, 100, 500].map((v) => tierOf(m, v))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
    });

    it('retroativas: o save antigo (v6) já abre com medalhas, sem campo novo no save', () => {
        for (const lang of ['pt', 'en']) {
            const save = fixture(lang);
            const p = medalProgress(viewOf(save));
            const got = p.filter((x) => x.tier > 0);
            expect(got.length).toBeGreaterThan(3);
            // o número bate com o que o save guarda
            const campeao = p.find((x) => x.medal.id === 'campeao')!;
            expect(campeao.value).toBe(Math.max(save.records.titles, save.hall.length));
            expect(p.find((x) => x.medal.id === 'partidas')!.value).toBe(save.career.matches);
        }
    });

    it('save vazio: nenhuma medalha', () => {
        expect(medalProgress(empty()).every((p) => p.tier === 0)).toBe(true);
    });

    it('Duelista conta vitórias além das 30 do histórico (contador do save), uma vez por partida', () => {
        useGame.setState({ duels: [], records: { cups: 0, titles: 0, perfect: 0 } });
        const rec = (id: string, result: 'win' | 'loss') => ({
            id,
            date: Date.now(),
            mode: 'ready' as const,
            rival: 'R',
            rivalClub: 'RC',
            score: [1, 0] as [number, number],
            shootout: null,
            result,
        });
        for (let i = 0; i < 35; i++) useGame.getState().recordDuel(rec(`s-${i}`, 'win'));
        useGame.getState().recordDuel(rec('s-34', 'win')); // a mesma partida de novo (a sala grava uma vez; isto é o seguro)
        useGame.getState().recordDuel(rec('s-x', 'loss'));
        const g = useGame.getState();
        expect(g.duels.length).toBe(30);
        expect(g.records.duelWins).toBe(35);
        expect(duelWins(g.records, g.duels)).toBe(35);
    });
});

describe('vitrine', () => {
    const save = fixture('pt');
    const v = viewOf(save);
    const tiers = medalTiers(v);
    const earned = Object.entries(tiers).filter(([, t]) => t > 0);

    it('só entra o que já é seu; no máximo 3; a moldura é o melhor degrau', () => {
        const [a, b, c, d] = earned.map(([id]) => `m:${id}`);
        const items = resolveShowcase([a, 'm:naoexiste', 'c:colIniciais_falsa', b, 's:999', c, d], v);
        expect(items.length).toBeLessThanOrEqual(3);
        expect(items.every((it) => it.kind === 'm' && it.tier > 0)).toBe(true);
        expect(frameTier(items)).toBe(Math.max(...items.map((it) => (it.kind === 'm' ? it.tier : 0))));
        expect(resolveShowcase('lixo', v)).toEqual([]);
        expect(frameTier([])).toBe(0);
    });

    it('vai pro Duelo com o degrau e volta igual; lixo do rival é ignorado', () => {
        const items = resolveShowcase(
            earned.slice(0, 3).map(([id]) => `m:${id}`),
            v,
        );
        expect(parseShowcase(encodeShowcase(items))).toEqual(items);
        expect(
            parseShowcase(['m:campeao:9', 'm:x:2', 'c:nada', 's:0:holo', 's:25:arco', 42, 'c:colNidos', 's:25:holo']),
        ).toEqual([
            { kind: 'c', id: 'colNidos' },
            { kind: 's', speciesId: 25, seal: 'holo' },
        ]);
        expect(parseShowcase(['m:campeao:4', 's:25:holo'])).toEqual([
            { kind: 'm', id: 'campeao', tier: 4 },
            { kind: 's', speciesId: 25, seal: 'holo' },
        ]);
        expect(parseShowcase(null)).toEqual([]);
    });

    it('escolher: liga, desliga, e o 4º não entra', () => {
        let c = toggleShowcase(undefined, 'm:a');
        c = toggleShowcase(c, 'm:b');
        c = toggleShowcase(c, 'm:c');
        expect(toggleShowcase(c, 'm:d')).toEqual(['m:a', 'm:b', 'm:c']);
        expect(toggleShowcase(c, 'm:b')).toEqual(['m:a', 'm:c']);
    });
});

describe('escudo e uniforme', () => {
    it('save antigo (sem os campos) fica no padrão: escudo com pokébola, branco, liso', () => {
        const save = fixture('en');
        expect(save.profile.crestShape).toBeUndefined();
        const look = lookOfProfile(save.profile);
        expect(look).toEqual({ ...DEFAULT_LOOK, color: clubColorHex(save.profile.clubColor) });
    });

    it('escolha sobrevive a salvar e carregar; id estragado vira o padrão', () => {
        const profile = {
            crestShape: 'diamante',
            crestSymbol: 'coroa',
            clubColor2: 'amarelo',
            kitPattern: 'listras',
            showcase: ['m:campeao'],
        };
        const keep = migrateSave(JSON.parse(JSON.stringify({ profile })), SAVE_VERSION);
        expect(keep.profile).toMatchObject(profile);
        expect(lookOfProfile(keep.profile)).toMatchObject({
            shape: 'diamante',
            symbol: 'coroa',
            pattern: 'listras',
            color2: 0xf2c230,
        });
        const bad = lookOfProfile({
            ...keep.profile,
            crestShape: 'x',
            crestSymbol: 7 as never,
            kitPattern: '',
            clubColor2: 'nada',
        });
        expect(bad).toMatchObject({
            shape: 'escudo',
            symbol: 'pokebola',
            pattern: 'liso',
            color2: DEFAULT_LOOK.color2,
        });
    });

    it('nuvem: o perfil de um lado não apaga o escudo/vitrine escolhidos do outro', () => {
        const base = migrateSave({}, SAVE_VERSION);
        const phone = {
            ...base,
            profile: { ...base.profile, crestSymbol: 'chama', kitPattern: 'faixa', showcase: ['m:copas'] },
        };
        const merged = mergeSaves(base, phone, 'device');
        expect(merged.profile).toMatchObject({ crestSymbol: 'chama', kitPattern: 'faixa', showcase: ['m:copas'] });
        // o lado que vale ganha quando os dois escolheram
        const pc = { ...base, profile: { ...base.profile, crestSymbol: 'raio' } };
        expect(mergeSaves(pc, phone, 'device').profile.crestSymbol).toBe('raio');
    });

    it('rival com a mesma cor entra de reserva e liso; com cor diferente fica como é', () => {
        const mine = { ...DEFAULT_LOOK, color: 0xe8423f };
        const theirs = lookOfPeer({
            clubColor: 0xe8423f,
            color2: 0x2f6fde,
            kitPattern: 'listras',
            crestSymbol: 'raio',
        });
        const away = againstLook(mine, theirs);
        expect(away.color).not.toBe(0xe8423f);
        expect(away.pattern).toBe('liso');
        expect(away.symbol).toBe('raio');
        const blue = lookOfPeer({ clubColor: 0x2f6fde, kitPattern: 'meio' });
        expect(againstLook(mine, blue)).toBe(blue);
        // peer estragado não quebra
        expect(lookOfPeer({ clubColor: -5, color2: 'x', kitPattern: {}, crestShape: null })).toMatchObject({
            ...DEFAULT_LOOK,
        });
        expect(lookOfCupClub('Cinnabar Vulcão', 0xff0000).symbol).toBe('chama');
    });

    it('peças bloqueadas: coleção completa e degrau de medalha liberam', () => {
        expect(isUnlocked('pokebola', new Set(), {})).toBe(true);
        expect(isUnlocked('folha', new Set(), {})).toBe(false);
        expect(isUnlocked('folha', new Set(['colIniciais']), {})).toBe(true);
        expect(isUnlocked('coroa', new Set(), { campeao: 1 })).toBe(false);
        expect(isUnlocked('coroa', new Set(), { campeao: 2 })).toBe(true);
        expect(isUnlocked('meio', new Set(), { campeao: 1 })).toBe(true);
    });
});

describe('contadores: uma fonte só (tela, missão, medalha e platina contam igual)', () => {
    const mission = (id: string, v: MedalView) => missionById(id)?.count?.(v);
    const platinum = (v: MedalView) => Object.fromEntries(platinumItems(PLATINUM[0], v).map((i) => [i.id, i.n]));

    it('golpes: a Golpedex conta Transformar quando o Ditto jogou; missão, medalha e platina contam o mesmo', () => {
        const v = {
            ...empty(),
            dex: { 132: { ...EMPTY_ENTRY, matches: 2 } },
            moves: { tackle: 3, naoExiste: 1, outroFalso: 2 },
        };
        expect(movesFound(v.moves, v.dex)).toBe(2);
        expect(mission('supernerd', v)).toBe(2);
        expect(mission('golpes', v)).toBe(2);
        expect(medalById('movedex')?.value(v)).toBe(2);
        expect(platinum(v).moves).toBe(2);
    });

    it('vistos e jogaram: só espécies do jogo (a aba da Pokédex percorre os 151), igual em todo lugar', () => {
        const dex = { 16: { ...EMPTY_ENTRY, matches: 1 }, 17: { ...EMPTY_ENTRY }, 0: { ...EMPTY_ENTRY, matches: 1 } };
        const v = { ...empty(), dex };
        expect(seenCount(dex)).toBe(2);
        expect(playedCount(dex)).toBe(1);
        expect(mission('oak', v)).toBe(2);
        expect(mission('oakGold', v)).toBe(1);
        expect(medalById('pokedex')?.value(v)).toBe(2);
        expect(medalById('elenco')?.value(v)).toBe(1);
        expect(platinum(v).dex).toBe(1);
    });

    it('figurinhas: a medalha conta o álbum (o mesmo número da Pokédex e da platina)', () => {
        const dex = { 25: { ...EMPTY_ENTRY, matches: 1, editions: EDITION_BIT.normal | EDITION_BIT.shiny } };
        const v = { ...empty(), dex };
        expect(medalById('figurinhas')?.value(v)).toBe(albumCount(dex).got);
        expect(platinum(v).album).toBe(2);
    });
});
