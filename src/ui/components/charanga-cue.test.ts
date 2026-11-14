import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import type { MatchEvent, TeamSetup } from '../../engine/state';
import { ICONS } from './MatchHud';
import { CharangaCue, charangaGoalAt } from './Sideline';

const goal = (tick: number, team: 0 | 1, score: [number, number]): MatchEvent =>
    ({ type: 'goal', tick, by: 0, assist: null, team, score, ownGoal: false }) as MatchEvent;
const setup = (sponsors?: string[]) => ({ sponsors }) as TeamSetup;
const both: [TeamSetup, TeamSetup] = [setup(['charanga']), setup()];

describe('aviso da Charanga de Pewter', () => {
    it('liga no gol que deixa o time dela perdendo (estava empatado), depois do "GOL!"', () => {
        const ev = [goal(100, 1, [0, 1])];
        expect(charangaGoalAt(ev, 110, both)).toBeNull();
        expect(charangaGoalAt(ev, 140, both)).toEqual({ team: 0, tick: 100 });
    });

    it('não liga sem a Charanga, no gol a favor, nem quando já perdia', () => {
        expect(charangaGoalAt([goal(100, 1, [0, 1])], 140, [setup(['silph']), setup()])).toBeNull();
        expect(charangaGoalAt([goal(100, 0, [1, 0])], 140, both)).toBeNull();
        expect(charangaGoalAt([goal(100, 1, [0, 2])], 140, both)).toBeNull();
        // empatou e voltou a perder: liga de novo
        expect(charangaGoalAt([goal(100, 0, [1, 1]), goal(300, 1, [1, 2])], 340, both)).toEqual({ team: 0, tick: 300 });
    });

    it('mostra "A CHARANGA ENTROU" com o bumbo, sem emoji', () => {
        const html = renderToStaticMarkup(
            createElement(CharangaCue, {
                events: [goal(100, 1, [0, 1])],
                tick: 140,
                setups: both,
                colors: [0xff0000, 0x0000ff],
            }),
        );
        expect(html).toContain('A CHARANGA ENTROU');
        expect(html).toContain(ICONS.drum);
        expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
    });
});
