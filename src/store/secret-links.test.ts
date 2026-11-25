import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import type { MatchResult, PlayerSummary } from '../engine/runners/batch-runner';
import type { MatchEvent } from '../engine/state';
import { en } from '../i18n/en';
import { pt } from '../i18n/pt';
import { migrateSave, savePart, useGame } from './game-store';
import { medalById } from './medals';
import { mergeProfileUnlocks } from './missions';
import { DEFAULT_PROFILE } from './profile';
import {
    combosFoundOf,
    freshCombos,
    longReveal,
    matchSecrets,
    rivalSecrets,
    SECRET_LINKS,
    SECRET_TOTAL,
    secretOf,
    TEAM_SECRETS,
} from './secret-links';

const p = (idx: number, team: 0 | 1, speciesId: number) => ({ idx, team, speciesId }) as PlayerSummary;
const ev = (e: Record<string, unknown>) => ({ tick: 1, half: 1, minute: 1, ...e }) as MatchEvent;
const result = (roster: PlayerSummary[], events: MatchEvent[]) =>
    ({ roster, events }) as Pick<MatchResult, 'roster' | 'events'>;

describe('sinergias secretas: detecção (só tela)', () => {
    it('cada rivalidade liga com um de cada lado, em qualquer ordem', () => {
        const cases: [number, number, string][] = [
            [94, 33, 'aberturaRG'],
            [25, 39, 'aberturaYellow'],
            [25, 26, 'vermilion'],
            [52, 25, 'meowth'],
            [7, 7, 'clone'],
            [123, 127, 'classicoVersao'],
            [24, 28, 'classicoVersao'],
            [45, 69, 'classicoVersao'],
            [59, 37, 'classicoVersao'],
            [57, 53, 'classicoVersao'],
        ];
        for (const [a, b, id] of cases) {
            expect(secretOf(a, b)).toBe(id);
            expect(secretOf(b, a)).toBe(id);
        }
        // as famílias certas: Gengar x Nidorino é a abertura; Haunter ou Nidoking não
        expect(secretOf(93, 33)).toBeNull();
        expect(secretOf(94, 34)).toBeNull();
        expect(secretOf(1, 4)).toBeNull();
        // toda secreta tem nome, descrição e charada nos dois idiomas, sem emoji
        for (const s of SECRET_LINKS)
            for (const d of [pt, en]) {
                const txt = d.common.secretLink[s.id];
                for (const v of [txt.name, txt.desc, txt.riddle]) {
                    expect(v.length).toBeGreaterThan(3);
                    expect(v).not.toMatch(/\p{Extended_Pictographic}/u);
                }
            }
    });

    it('o "???" da escalação: as secretas entre os titulares dos dois times, sem repetir', () => {
        expect(rivalSecrets([25, 94, 1], [26, 33, 52])).toEqual(['aberturaRG', 'vermilion', 'meowth']);
        expect(rivalSecrets([1, 4], [7, 10])).toEqual([]);
        expect(rivalSecrets([150, 150], [150])).toEqual(['clone']);
    });

    it('acontece no lance entre os dois (1ª vez só), segue substituição e evolução, e não vale no mesmo time', () => {
        const roster = [p(0, 0, 25), p(1, 0, 94), p(2, 1, 26), p(3, 1, 60), p(4, 1, 25)];
        const tackle = ev({ type: 'tackle', by: 0, victim: 2, success: true });
        const again = ev({ type: 'interception', by: 2, from: 0 });
        const r = matchSecrets(result(roster, [ev({ type: 'pass', by: 0, to: 1 }), tackle, again]));
        expect(r.map((h) => h.id)).toEqual(['vermilion']);
        expect(r[0].event).toBe(tackle);
        // Pikachu x Pikachu do mesmo lado não é espelho; do outro lado é
        expect(matchSecrets(result(roster, [ev({ type: 'block', by: 0, shooter: 4 })])).map((h) => h.id)).toEqual([
            'clone',
        ]);
        expect(matchSecrets(result([p(0, 0, 25), p(1, 0, 26)], [ev({ type: 'tackle', by: 0, victim: 1 })]))).toEqual(
            [],
        );
        // Poliwhirl (60) sai e entra Nidorino (33): agora ele cruza com o Gengar
        const sub = ev({ type: 'sub', team: 1, outIdx: 3, inSpeciesId: 33 });
        const meet = ev({ type: 'save', by: 3, shooter: 1, caught: true });
        expect(matchSecrets(result(roster, [meet])).length).toBe(0);
        expect(matchSecrets(result(roster, [sub, meet])).map((h) => h.id)).toEqual(['aberturaRG']);
        // Gastly (92) que evolui pra Gengar no meio da partida também vale
        const evo = ev({ type: 'evolve', by: 1, into: 94 });
        const ros2 = [p(0, 0, 25), p(1, 0, 92), p(3, 1, 33)];
        expect(matchSecrets(result(ros2, [meet])).length).toBe(0);
        expect(matchSecrets(result(ros2, [evo, meet])).map((h) => h.id)).toEqual(['aberturaRG']);
    });

    it('as do mesmo time (fase 2): reveladas no combo ou no gol de dupla, com a secreta ligada no time de agora', () => {
        // Charmander (4) e Charizard (6): Mestre e Aprendiz
        const roster = [p(0, 0, 4), p(1, 0, 6), p(2, 0, 19), p(3, 1, 25), p(4, 1, 7)];
        const goal = ev({ type: 'goal', by: 0, assist: 1, team: 0, ownGoal: false });
        const r = matchSecrets(result(roster, [goal]));
        expect(r).toMatchObject([{ id: 'mestreAprendiz', a: 1, b: 0, species: [6, 4], team: true }]);
        expect(r[0].event).toBe(goal);
        // gol sem assistência, gol contra ou dupla que não é da secreta não revela
        expect(matchSecrets(result(roster, [ev({ type: 'goal', by: 0, assist: null, team: 0 })]))).toEqual([]);
        expect(matchSecrets(result(roster, [{ ...goal, ownGoal: true } as MatchEvent]))).toEqual([]);
        expect(matchSecrets(result(roster, [ev({ type: 'goal', by: 0, assist: 2, team: 0 })]))).toEqual([]);
        // combo de secreta revela também; o Charizard saindo antes desliga
        const combo = ev({ type: 'combo', by: 0, partner: 1, link: 'mestre4' });
        expect(matchSecrets(result(roster, [combo])).map((h) => h.id)).toEqual(['mestreAprendiz']);
        const sub = ev({ type: 'sub', team: 0, outIdx: 1, inSpeciesId: 20 });
        expect(matchSecrets(result(roster, [sub, goal]))).toEqual([]);
        // toda secreta do mesmo time tem nome, descrição e charada nos dois idiomas, sem emoji
        expect(TEAM_SECRETS).toHaveLength(21);
        for (const l of TEAM_SECRETS)
            for (const d of [pt, en]) {
                const txt = d.common.secretLink[l.secret!];
                for (const v of [txt.name, txt.desc, txt.riddle]) {
                    expect(v.length).toBeGreaterThan(3);
                    expect(v).not.toMatch(/\p{Extended_Pictographic}/u);
                }
            }
        // descoberta guardada no perfil como as rivalidades
        expect(freshCombos([], ['mestreAprendiz', 'rivalAzul'])).toEqual(['mestreAprendiz', 'rivalAzul']);
    });

    it('revelação longa só na 1ª vez de sempre (nem no replay)', () => {
        expect(longReveal('clone', [], false)).toBe(true);
        expect(longReveal('clone', undefined, false)).toBe(true);
        expect(longReveal('clone', ['clone'], false)).toBe(false);
        expect(longReveal('clone', [], true)).toBe(false);
    });
});

describe('sinergias secretas: profile.combosFound', () => {
    it('a partida guarda só as novas, e a 2ª vez não é descoberta de novo', () => {
        useGame.setState({ profile: { ...DEFAULT_PROFILE } });
        useGame.getState().discoverCombos(['vermilion', 'clone', 'vermilion', 'naoExiste']);
        expect(useGame.getState().combosFresh).toEqual(['vermilion', 'clone']);
        expect(useGame.getState().profile.combosFound).toEqual(['vermilion', 'clone']);
        useGame.getState().discoverCombos(['clone', 'meowth']);
        expect(useGame.getState().combosFresh).toEqual(['meowth']);
        useGame.getState().discoverCombos(['clone']);
        expect(useGame.getState().combosFresh).toEqual([]);
        expect(useGame.getState().profile.combosFound).toEqual(['vermilion', 'clone', 'meowth']);
        // vai no save (e na nuvem, que sobe o perfil inteiro)
        expect(savePart(useGame.getState()).profile.combosFound).toEqual(['vermilion', 'clone', 'meowth']);
        expect(freshCombos(['clone'], ['clone', 'meowth'])).toEqual(['meowth']);
    });

    it('save v6 de verdade migra sem o campo (nenhuma descoberta) e lista estragada é limpa', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const save = migrateSave(backup.save, backup.version);
            expect(combosFoundOf(save.profile)).toEqual([]);
            const dirty = migrateSave(
                { ...backup.save, profile: { ...backup.save.profile, combosFound: ['clone', 3, 'x', null] } },
                backup.version,
            );
            expect(dirty.profile.combosFound).toEqual(['clone']);
        }
        expect(combosFoundOf({ combosFound: 'lixo' })).toEqual([]);
    });

    it('nuvem e aparelho: descoberta em qualquer lado conta', () => {
        const local = { ...DEFAULT_PROFILE, combosFound: ['clone'] };
        expect(mergeProfileUnlocks(local, { combosFound: ['meowth'] }).combosFound).toEqual(['clone', 'meowth']);
        expect(mergeProfileUnlocks({ ...DEFAULT_PROFILE }, {}).combosFound).toBeUndefined();
    });

    it('medalha em degraus pelas descobertas', () => {
        const m = medalById('sinergias')!;
        expect(SECRET_TOTAL).toBe(SECRET_LINKS.length + 21);
        expect(m.steps.at(-1)).toBe(SECRET_TOTAL);
        expect(m.value({ combos: ['clone', 'x'] } as never)).toBe(1);
        expect(m.value({} as never)).toBe(0);
        expect(pt.profile.medals.names.sinergias).toBeTruthy();
        expect(en.profile.medals.names.sinergias).toBeTruthy();
    });
});
