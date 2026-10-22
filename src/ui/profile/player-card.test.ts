import { describe, expect, it } from 'vitest';
import { buildVitrine } from '../../friends/api';
import type { Peer } from '../../net/duel-state';
import { headToHead } from '../../store/duels';
import { ART } from '../components/PixelTrophy';
import { friendInfo, peerInfo } from './PlayerCard';

/** Perfil que chega do rival na sala: dado de fora, cada campo tem que passar pela validação. */
const peer = (extra: Record<string, unknown>) =>
    ({
        id: 'x',
        name: 'Gary',
        avatar: 'assets/cards/6.gif',
        avatarGoogle: false,
        trainer: 'blue',
        title: 'Campeão',
        clubName: 'Rival FC',
        clubTag: 'RIV',
        clubColor: 0xe8423f,
        engine: 0,
        app: 'x',
        ...extra,
    }) as unknown as Peer;

describe('cartão do treinador do rival', () => {
    it('fica só com o que vale: treinador, avatar, vitrine e cartas', () => {
        const info = peerInfo(
            peer({
                trainer: '../../evil',
                avatar: 'javascript:alert(1)',
                name: 'G'.repeat(200),
                showcase: ['lixo', 'm:campeao:4'],
                cards: [{ speciesId: 999 }, 'lixo'],
            }),
        );
        expect(info.trainer).toBe('red');
        expect(info.avatar.src).toBe('assets/avatars/25.gif');
        expect(info.name.length).toBeLessThanOrEqual(40);
        expect(info.showcase).toHaveLength(1);
        expect(info.cards).toEqual([]);
        expect(info.other).toBe(true);
    });

    it('mantém o perfil de quem mandou tudo certo', () => {
        const info = peerInfo(peer({}), false);
        expect(info.trainer).toBe('blue');
        expect(info.clubTag).toBe('RIV');
        expect(info.other).toBe(false);
    });
});

describe('perfil do amigo', () => {
    const r = {
        code: 'VRDN4GRN',
        trainer: 'Davi',
        club: 'Viridian Verde',
        club_tag: 'VIR',
        club_color: 'verde',
        status: 'amigo' as const,
        since: '',
        room: null,
        room_at: null,
    };
    const hall = (date: number, perfect: boolean) => ({
        id: String(date),
        date,
        club: 'Viridian Verde',
        clubColor: 'verde' as const,
        formation: '2-2',
        titleNo: 1,
        perfect,
        scores: [
            [2, 0],
            [3, 1],
        ] as [number, number][],
        squad: [
            { speciesId: 1, shiny: false, name: 'Bulbasaur', ovr: 60, goals: 1, captain: false },
            { speciesId: 6, shiny: true, name: 'Charizard', ovr: 80, goals: 3, captain: true },
        ],
    });

    it('a vitrine que sobe é a que o amigo vê (números, 3 últimos títulos com o capitão e a final)', () => {
        const pub = { ...peer({}), id: undefined, engine: undefined, app: undefined };
        const v = buildVitrine(pub as never, {
            career: { matches: 10, wins: 7, losses: 3, shootoutWins: 0, goalsFor: 30, goalsAgainst: 12 },
            records: { cups: 4, titles: 4, perfect: 1, bestStreak: 2 },
            hall: [hall(4, true), hall(3, false), hall(2, false), hall(1, false)],
            dex: {},
            duels: [],
        });
        const info = friendInfo(r, JSON.parse(JSON.stringify(v)));
        expect(info.name).toBe('Davi');
        expect(info.trainer).toBe('blue');
        expect(info.friend?.numbers).toMatchObject({ matches: 10, wins: 7, goals: 30, titles: 4, perfect: 1 });
        expect(info.friend?.hall.map((h) => h.date)).toEqual([4, 3, 2]);
        expect(info.friend?.hall[0]).toMatchObject({ final: [3, 1], captain: 6, shiny: true, perfect: true });
        // não aparece "Adicionar amigo" (já é amigo)
        expect(info.id).toBeUndefined();
    });

    it('vitrine estranha não quebra nada; sem vitrine (versão antiga) fica só o nome', () => {
        const info = friendInfo(r, {
            numbers: { matches: -5, wins: 'x', goals: 1e99 },
            hall: [{ date: 1, captain: 999, final: ['a'] }, 'lixo', null],
            name: 'Impostor',
            avatar: 'javascript:alert(1)',
        });
        expect(info.name).toBe('Davi');
        expect(info.avatar.src).toBe('assets/avatars/25.gif');
        expect(info.friend?.numbers).toMatchObject({ matches: 0, wins: 0, goals: 1e7 });
        expect(info.friend?.hall).toEqual([
            { date: 1, club: '', color: '', final: [0, 0], perfect: false, captain: 25, shiny: false },
        ]);
        expect(friendInfo(r, null).friend?.numbers).toBeNull();
    });

    it('retrospecto: pelo código de amigo e, nos duelos de antes, pelo nome e clube', () => {
        const d = (result: 'win' | 'loss' | 'draw' | 'void', rival: string, rivalCode?: string) => ({
            id: Math.random().toString(),
            date: 0,
            mode: 'ready' as const,
            rival,
            rivalClub: 'Viridian Verde',
            rivalCode,
            score: [0, 0] as [number, number],
            shootout: null,
            result,
        });
        const duels = [
            d('win', 'Davi', 'VRDN4GRN'),
            d('win', 'Outro nome', 'VRDN4GRN'),
            d('loss', 'Davi'),
            d('void', 'Davi', 'VRDN4GRN'),
            d('draw', 'Davi', 'OUTROAMG'),
        ];
        expect(headToHead(duels, { code: 'VRDN4GRN', trainer: 'Davi', club: 'Viridian Verde' })).toEqual({
            win: 2,
            draw: 0,
            loss: 1,
        });
    });
});

describe('pedaço da sala de troféus no cartão', () => {
    it('as taças por metal vêm limpas (3 números inteiros)', () => {
        expect(peerInfo(peer({ cups: [2, -1, 'x', 9] })).cups).toEqual([2, 0, 0]);
        expect(peerInfo(peer({})).cups).toEqual([0, 0, 0]);
    });
    it('cada desenho de troféu tem todas as fileiras do mesmo tamanho', () => {
        for (const rows of Object.values(ART)) expect(new Set(rows.map((r) => r.length)).size).toBe(1);
    });
});
