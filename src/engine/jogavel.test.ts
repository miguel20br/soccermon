import { describe, expect, it } from 'vitest';
import { withConfig } from './config';
import { HumanDriver, type PlayInput } from './controllers/human-input';
import { eventsHash } from './determinism';
import { aiDraftTeam } from './draft';
import { goalXFor } from './match';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import type { MatchState, TeamSetup } from './state';
import { norm, sub, v } from './vec';

const CFG = withConfig({ halfSeconds: 40 });
const team = (seed: string, name: string): TeamSetup => ({
    name,
    ...aiDraftTeam(new Rng(seed, 'team'), 2, []),
    tactic: 'balanced',
    color: 0,
});
const home = team('jog-a', 'A');
const away = team('jog-b', 'B');

/** "Jogador" roteirizado: só lê o estado (como a pessoa olhando a tela), então a partida tem que se repetir igual. */
function script(s: MatchState, idx: number): PlayInput {
    const p = s.players[idx];
    const goal = v(goalXFor(s, 0), s.cfg.pitch.width / 2);
    const hasBall = s.ball.owner === idx;
    const dir = norm(sub(hasBall ? goal : s.ball.pos, p.pos));
    const pressed: PlayInput['pressed'] = [];
    if (hasBall && p.pos.x > 30) pressed.push('shoot');
    else if (hasBall && s.tick % 50 === 0) pressed.push('pass');
    else if (!hasBall && s.tick % 7 === 0) pressed.push('action');
    if (s.tick % 400 === 0) pressed.push('switch');
    return { dir, walk: false, pressed };
}

function play() {
    const live = new LiveRunner(CFG, home, away, 'jog');
    const driver = new HumanDriver(live, 0);
    const controlled = new Set<number>();
    while (!live.finished) {
        controlled.add(driver.controlled);
        driver.step(script(live.state, driver.controlled));
    }
    return { events: live.state.events, controlled };
}

describe('modo jogável (prévia)', () => {
    it('partida com o controle roteirizado é determinística e o controlado joga', () => {
        const a = play();
        const b = play();
        expect(eventsHash(a.events)).toBe(eventsHash(b.events));
        expect(a.controlled.size).toBeGreaterThan(1); // trocou de controlado (botão e passe recebido)
        const mine = a.events.filter((e) => (e.type === 'shot' || e.type === 'pass') && a.controlled.has(e.by));
        expect(mine.length).toBeGreaterThan(0);
        // o roteiro muda a partida: não é a mesma da IA pura
        expect(eventsHash(a.events)).not.toBe(
            eventsHash(runMatch(CFG, home, away, 'jog', { snapshots: false }).events),
        );
    });

    it('sem controle humano, o LiveRunner dá a partida da IA de sempre', () => {
        const live = new LiveRunner(CFG, home, away, 'jog');
        while (!live.finished) live.step();
        expect(eventsHash(live.state.events)).toBe(
            eventsHash(runMatch(CFG, home, away, 'jog', { snapshots: false }).events),
        );
    });
});
