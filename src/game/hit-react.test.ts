import { describe, expect, it } from 'vitest';
import type { MatchEvent, MatchSnapshot } from '../engine/state';
import { Action, SNAP_STRIDE, STATUS_CODE } from '../engine/state';
import { en } from '../i18n/en';
import { pt } from '../i18n/pt';
import { trailKind } from './ball-trail';
import { DOWN_SECONDS, type ReactContext, reactionFor, statusNow, WORD_TYPE } from './hit-react';

const base = { tick: 10, half: 1 as const, minute: 1 };
const ctx = (hurt = 0.45): ReactContext => ({
    moveType: (id) => ({ thunderbolt: 'Electric', surf: 'Water', tackle: 'Normal', lowkick: 'Fighting' })[id],
    hurtSeconds: () => hurt,
});

describe('reação do atingido: efeito → palavra/ícone', () => {
    it('todo status do motor tem palavra (PT e EN, caixa alta, sem emoji), cor de tipo e o ícone do snapshot', () => {
        for (const kind of [...Object.keys(STATUS_CODE), 'flinch', 'seed']) {
            const e = { ...base, type: 'status', target: 2, status: kind, by: 7, source: 'thunderbolt' } as MatchEvent;
            const r = reactionFor(e, ctx());
            expect(r?.word).toBe(kind);
            expect(r?.type).toBe('Electric');
            expect(r?.icon).toBe(STATUS_CODE[kind] ?? 0);
            for (const d of [pt, en]) {
                const w = d.battle.react[kind];
                expect(w).toBe(w.toUpperCase());
                expect(w).not.toMatch(/\p{Extended_Pictographic}/u);
            }
            if (STATUS_CODE[kind]) expect(pt.battle.statusBy[kind]).toContain('{m}');
        }
        // fonte que não é golpe (habilidade, golpe máximo): a cor vem do efeito
        const burn = { ...base, type: 'status', target: 2, status: 'brn', by: 7, source: 'maxfx' } as MatchEvent;
        expect(reactionFor(burn, ctx())?.type).toBe('Fire');
        const flinch = { ...base, type: 'status', target: 2, status: 'flinch', by: 7, source: 'bite' } as MatchEvent;
        expect(reactionFor(flinch, ctx())?.fall).toBe('dizzy');
    });

    it('empurrão curto empurra (água molha); no chão por mais tempo vira tombo', () => {
        const kb = (moveId: string) => ({ ...base, type: 'knockback', target: 3, by: 1, moveId }) as MatchEvent;
        expect(reactionFor(kb('tackle'), ctx(0.45))).toMatchObject({ word: 'push', fall: null });
        expect(reactionFor(kb('surf'), ctx(0.45))).toMatchObject({ word: 'soak', type: 'Water' });
        expect(reactionFor(kb('tackle'), ctx(DOWN_SECONDS))).toMatchObject({ word: 'down', fall: 'tumble' });
    });

    it('rasteira, arremesso e o N3 Normal/Terrestre derrubam; o resto não reage aqui', () => {
        const trip = { ...base, type: 'trait', by: 1, fx: 'trip', moveId: 'lowkick', target: 4 } as MatchEvent;
        expect(reactionFor(trip, ctx())).toMatchObject({ target: 4, word: 'down', type: 'Fighting', fall: 'tumble' });
        const quake = { ...base, type: 'maxFx', by: 1, fx: 'Ground', step: 'hit', target: 5 } as MatchEvent;
        expect(reactionFor(quake, ctx())).toMatchObject({ target: 5, word: 'down', type: 'Ground' });
        const fury = { ...base, type: 'maxFx', by: 1, fx: 'Dragon', step: 'hit', target: 1 } as MatchEvent;
        expect(reactionFor(fury, ctx())).toBeNull();
        const crit = { ...base, type: 'trait', by: 1, fx: 'crit', moveId: 'slash', target: 4 } as MatchEvent;
        expect(reactionFor(crit, ctx())).toBeNull();
        expect(Object.keys(WORD_TYPE).sort()).toEqual(Object.keys(pt.battle.react).sort());
    });

    it('painel: status de agora, quem causou e quantos segundos faltam', () => {
        const snap = (tick: number, status: number, action = 0): MatchSnapshot => {
            const p = new Array(SNAP_STRIDE * 2).fill(0);
            p[SNAP_STRIDE + 3] = action;
            p[SNAP_STRIDE + 4] = status;
            return {
                tick,
                half: 1,
                minute: 0,
                phase: 'play',
                bx: 0,
                by: 0,
                bz: 0,
                owner: -1,
                bfx: '',
                score: [0, 0],
                p,
            };
        };
        // confuso do tick 10 ao 50 (2 s a 20 Hz)
        const snapshots = [0, 10, 20, 30, 40, 50, 60].map((t) => snap(t, t >= 10 && t < 50 ? 6 : 0, Action.Idle));
        const events = [
            { ...base, type: 'status', target: 1, status: 'confusion', by: 0, source: 'psychic' },
        ] as MatchEvent[];
        expect(statusNow({ snapshots, events }, 1, 20)).toEqual({ kind: 'confusion', source: 'psychic', left: 2 });
        expect(statusNow({ snapshots, events }, 1, 55)).toBeNull();
    });

    it('rastro da bola usa a partícula do tipo (o motor manda "Fire", com maiúscula)', () => {
        expect(trailKind('Fire')).toBe('fire');
        expect(trailKind('Electric')).toBe('electric');
        expect(trailKind('Fairy')).toBe('normal');
    });
});
