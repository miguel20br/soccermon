import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../../engine/data';
import type { MatchEvent } from '../../engine/state';
import { EMOTES } from '../../net/duel-state';
import { emoteFace, RIVAL_EMOTE_GAP, RIVAL_EMOTE_MAX, rivalEmotes } from './emote-faces';

describe('emotes do Duelo', () => {
    it('todo emote de todo capitão tem rosto (a emoção que faltar cai numa parecida ou no normal)', () => {
        for (const sp of SPECIES)
            for (const k of EMOTES) expect(existsSync(`public/${emoteFace(sp.id, k)}`), `${sp.id} ${k}`).toBe(true);
        expect(emoteFace(25, 'golaco')).toBe('assets/portraits/25-joyous.png');
        // Machamp não tem nenhuma emoção: rosto normal
        expect(emoteFace(68, 'bravo')).toBe('assets/portraits/68.png');
    });
});

describe('líder rival da Copa reagindo aos gols', () => {
    const goal = (tick: number, team: 0 | 1, score: [number, number], ownGoal = false) =>
        ({ type: 'goal', tick, by: 0, assist: null, team, score, ownGoal }) as MatchEvent;
    const far = RIVAL_EMOTE_GAP + 1;

    it('gol dele, empate seu, virada sua e a virada dele com o "Vamooo!"', () => {
        const plan = rivalEmotes(
            [
                goal(100, 1, [0, 1]),
                goal(100 + far, 0, [1, 1]),
                goal(100 + 2 * far, 0, [2, 1]),
                goal(100 + 3 * far, 1, [2, 2]),
            ],
            1,
        );
        expect(plan.map((p) => p.kind)).toEqual(['golaco', 'bravo', 'choro', 'golaco']);
        // o emote vem depois do gol (o "GOL!" aparece antes)
        expect(plan[0].tick).toBeGreaterThan(100);
        const virada = rivalEmotes(
            [goal(100, 0, [1, 0]), goal(100 + far, 1, [1, 1]), goal(100 + 2 * far, 1, [1, 2])],
            1,
        );
        expect(virada.map((p) => p.kind)).toEqual(['ops', 'golaco', 'grito']);
    });

    it('não polui: espera entre um e outro (a virada fura) e no máximo 4 por partida', () => {
        const close = rivalEmotes([goal(100, 1, [0, 1]), goal(150, 1, [0, 2]), goal(200, 0, [1, 2])], 1);
        expect(close).toHaveLength(1);
        const virada = rivalEmotes([goal(100, 0, [1, 0]), goal(150, 1, [1, 1]), goal(200, 1, [1, 2])], 1);
        expect(virada.map((p) => p.kind)).toEqual(['ops', 'grito']);
        const many = rivalEmotes(
            Array.from({ length: 10 }, (_, i) => goal(i * far, 1, [0, i + 1])),
            1,
        );
        expect(many).toHaveLength(RIVAL_EMOTE_MAX);
    });

    it('a mesma partida dá sempre os mesmos emotes; gol contra é "Ops" e 2+ na frente é "Zzz"', () => {
        const ev = [goal(100, 0, [1, 0], true), goal(100 + far, 0, [2, 0])];
        expect(rivalEmotes(ev, 1)).toEqual(rivalEmotes(ev, 1));
        expect(rivalEmotes(ev, 1).map((p) => p.kind)).toEqual(['ops', 'zzz']);
    });
});
