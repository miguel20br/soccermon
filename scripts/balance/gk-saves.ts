// Geometria das defesas do goleiro: onde a bola fica no contato e no 1,5 s seguinte (não edita nada do repo).
// Uso: npx tsx scripts/balance/gk-saves.ts [N=300]
import { FUTSAL_5 } from '../../src/engine/config';
import { attackSign } from '../../src/engine/match';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import { baseTeams } from './lib';

const N = Number(process.argv[2] ?? 300);
const { length: L, width: W, goalWidth: GW } = FUTSAL_5.pitch;
const gy = W / 2;
const FOLLOW = 30;

type Kind = 'caught' | 'forward' | 'deflect' | 'rebound';
const tally: Record<string, Record<string, number>> = {};
const bump = (k: string, m: string) => {
    tally[k] ??= {};
    tally[k][m] = (tally[k][m] ?? 0) + 1;
};
const examples: string[] = [];
let corners = 0;
let goals = 0;

for (let i = 0; i < N; i++) {
    const { A, B } = baseTeams(i);
    const r = new LiveRunner(FUTSAL_5, A, B, `gk-${i}`);
    const s = r.state;
    let seen = 0;
    const deflects: number[] = [];
    while (!r.finished && s.tick < 20000) {
        r.step();
        const fresh = s.events.slice(seen);
        seen = s.events.length;
        for (const e of fresh) {
            if (e.type !== 'save') continue;
            const gk = s.players[e.by];
            const front = attackSign(gk.team);
            const lineX = gk.team === 0 ? 0 : L;
            const b = s.ball;
            const kind: Kind =
                b.owner === gk.idx
                    ? 'caught'
                    : b.lastTouch === e.shooter
                      ? 'rebound'
                      : b.vel.x * front < 0
                        ? 'deflect'
                        : 'forward';
            bump(kind, 'n');
            if (kind === 'deflect') deflects.push(e.tick);
            bump('all', 'n');
            const contact = { ...b.pos };
            const gk0 = { ...gk.pos };
            const rel0 = (b.pos.x - gk.pos.x) * front;
            if (rel0 < -0.05) bump(kind, 'contactBehind');
            if (Math.abs(b.pos.x - lineX) < 0.5) bump(kind, 'contactOnLine');
            // segue a bola rodando o próprio runner (defesa logo em seguida a outra fica de fora)
            const flags = new Set<string>();
            for (let t = 0; t < FOLLOW && !r.finished; t++) {
                if (t > 0) r.step();
                const own = b.owner;
                if (own !== null && own !== gk.idx) break;
                // posição do goleiro na tela: o render puxa o sprite até o contato (mergulho, DIVE_TAIL = 10)
                const k = t <= 10 ? 1 - (t / 10) ** 2 : 0;
                let ox = contact.x - gk.pos.x;
                let oy = contact.y - gk.pos.y;
                const l = Math.hypot(ox, oy);
                if (l > 1.8) {
                    ox *= 1.8 / l;
                    oy *= 1.8 / l;
                }
                const vx = gk.pos.x + ox * k;
                const vy = gk.pos.y + oy * k;
                if (own === gk.idx) {
                    // com a bola na mão: o render já põe na frente quando o goleiro está a < 6 m do gol
                    if ((b.pos.x - gk.pos.x) * front < 0 && Math.abs(gk.pos.x - lineX) >= 6) flags.add('heldBehindFar');
                    continue;
                }
                const rel = (b.pos.x - vx) * front;
                const lat = Math.abs(b.pos.y - vy);
                const toLine = Math.abs(b.pos.x - lineX);
                const inMouth = Math.abs(b.pos.y - gy) < GW / 2;
                const speed = Math.hypot(b.vel.x, b.vel.y);
                if (rel < -0.1 && lat < 0.7) flags.add('behindBody');
                // mesmo critério contra a posição do goleiro no motor (anel/sombra dele na tela)
                if ((b.pos.x - gk.pos.x) * front < -0.1 && Math.abs(b.pos.y - gk.pos.y) < 0.7)
                    flags.add('behindBodyMotor');
                // contra onde o goleiro estava na defesa (sem contar ele correndo atrás da bola depois)
                if ((b.pos.x - gk0.x) * front < -0.1 && Math.abs(b.pos.y - gk0.y) < 0.7)
                    flags.add('behindBodyNaDefesa');
                if (rel < -0.1 && inMouth) flags.add('behindInMouth');
                if (toLine < 0.6 && inMouth) flags.add('onGoalLine');
                if (speed < 1 && rel < 0 && inMouth) flags.add('stoppedBehind');
            }
            seen = s.events.length;
            for (const f of flags) {
                bump(kind, f);
                bump('all', f);
            }
            if (flags.size && examples.length < 12)
                examples.push(`seed gk-${i} tick ${e.tick} ${kind} [${[...flags].join(',')}] rel0=${rel0.toFixed(2)}`);
        }
    }
    const cornerTicks = s.events.filter((e) => e.type === 'corner').map((e) => e.tick);
    corners += cornerTicks.length;
    goals += s.score[0] + s.score[1];
    for (const t of deflects)
        bump('deflect', cornerTicks.some((c) => c >= t && c - t <= 60) ? 'virouEscanteio' : 'semEscanteio');
}
console.log(`partidas: ${N}  gols ${goals}  escanteios ${corners}`);
for (const [k, m] of Object.entries(tally)) {
    const n = m.n;
    const parts = Object.entries(m)
        .filter(([x]) => x !== 'n')
        .map(([x, c]) => `${x} ${c} (${((100 * c) / n).toFixed(1)}%)`);
    console.log(`${k.padEnd(8)} n=${n}  ${parts.join('  ')}`);
}
console.log(examples.join('\n'));
