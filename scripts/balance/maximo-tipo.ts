// Desfecho do chute do golpe máximo de linha por nível (docs/planos/golpe-maximo-por-tipo.md): gol, defesa, bloqueio,
// trave, pra fora. O robô toca sempre que acende (POL=n1) ou só com os 3 gomos (POL=n3); nota sorteada 40/40/20.
// MAXTIPO=1: com o efeito do tipo do capitão. Uso: npx tsx scripts/balance/maximo-tipo.ts <partidas> <out.json>
import { writeFileSync } from 'node:fs';
import { maxCharge } from '../../src/engine/agency';
import { withConfig } from '../../src/engine/config';
import { inMaxZoneOf } from '../../src/engine/match';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import type { MatchEvent } from '../../src/engine/state';
import { baseTeams, FUTSAL_5, Rng } from './lib';

const N = Number(process.argv[2]) || 200;
const OUT = process.argv[3] ?? 'maximo-tipo.json';
const CFG = process.env.MAXTIPO === '1' ? withConfig({ maxType: true }) : FUTSAL_5;
const MIN = process.env.POL === 'n3' ? 3 : 1;
type Res = 'goal' | 'save' | 'block' | 'post' | 'wide' | 'other';
const rows: { lv: number; res: Res }[] = [];
for (let i = 0; i < N; i++) {
    const { A, B } = baseTeams(i);
    const r = new LiveRunner(CFG, A, B, `coach-${i}`);
    const s = r.state;
    const g = new Rng(`coach-${i}`, 'grade');
    while (!r.finished && s.tick < 200000) {
        const cap = s.players.find((p) => p.team === 0 && p.captain);
        if (
            cap &&
            cap.role !== 'GK' &&
            s.phase === 'play' &&
            !s.teams[0].agency.max &&
            s.ball.owner === cap.idx &&
            inMaxZoneOf(s, cap)
        ) {
            const c = maxCharge(s.events, 0, s.tick, 5);
            if (c.level >= MIN) {
                const x = g.next();
                r.addOrder({ tick: s.tick, team: 0, kind: 'max', q: x < 0.4 ? 2 : x < 0.8 ? 1 : 0 });
            }
        }
        r.step();
    }
    const ev: MatchEvent[] = s.events;
    for (let k = 0; k < ev.length; k++) {
        const e = ev[k];
        if (e.type !== 'max' || e.team !== 0 || e.phase !== 'hit' || s.players[e.by].role === 'GK') continue;
        let res: Res = 'other';
        for (let j = k + 1; j < ev.length && ev[j].tick <= e.tick + 60 && res === 'other'; j++) {
            const x = ev[j];
            if (x.type === 'goal') res = 'goal';
            else if (x.type === 'save' && x.shooter === e.by) res = 'save';
            else if (x.type === 'block' && x.shooter === e.by) res = 'block';
            else if (x.type === 'post' && x.shooter === e.by) res = 'post';
            else if ((x.type === 'wide' && x.shooter === e.by) || x.type === 'goalkick' || x.type === 'corner')
                res = 'wide';
        }
        rows.push({ lv: e.level ?? 2, res });
    }
}
const agg = (lv: number) => {
    const r = rows.filter((x) => x.lv === lv);
    const c: Record<string, number> = {};
    for (const x of r) c[x.res] = (c[x.res] ?? 0) + 1;
    return { n: r.length, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / r.length).toFixed(3)])) };
};
const out = { N, byLevel: [1, 2, 3].map(agg) };
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
