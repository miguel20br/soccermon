// Trajetória da bola e do goleiro tick a tick depois de uma defesa. Uso: npx tsx scripts/balance/gk-trace.ts <i> <tick>
import { FUTSAL_5 } from '../../src/engine/config';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import { baseTeams } from './lib';

const [i, tick] = process.argv.slice(2).map(Number);
const { A, B } = baseTeams(i);
const r = new LiveRunner(FUTSAL_5, A, B, `gk-${i}`);
const s = r.state;
let by = -1;
let n = 0;
while (!r.finished && n < 25) {
    r.step();
    if (by < 0) {
        const e = s.events.find((x) => x.type === 'save' && x.tick === tick);
        if (!e || e.type !== 'save') continue;
        by = e.by;
    }
    const g = s.players[by];
    const b = s.ball;
    const f = (x: number) => x.toFixed(2);
    console.log(
        `t${s.tick} gk ${f(g.pos.x)},${f(g.pos.y)} bola ${f(b.pos.x)},${f(b.pos.y)} v ${f(b.vel.x)},${f(b.vel.y)} dono ${b.owner}`,
    );
    n++;
}
