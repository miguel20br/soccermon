// Hora do golpe máximo por posição do capitão (beira-da-quadra-2.md): % das partidas em que, com a barra cheia, o
// capitão aparece com a bola na zona dele (a mesma conta do botão). Sem ordem nenhuma (a partida de sempre).
// Uso: npx tsx scripts/balance/maximo-zona.ts [partidas por capitão=100]
import { maxCharge } from '../../src/engine/agency';
import { inMaxZoneOf } from '../../src/engine/match';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import { baseTeams, FUTSAL_5 } from './lib';

const N = Number(process.argv[2]) || 100;
// 1-2-1: GK, FIXO, ALA, ALA, PIVO
const CAPS = [
    ['Pivô', 4],
    ['Ala', 2],
    ['Fixo', 1],
] as const;

console.log('| Capitão | barra cheia | com hora certa | horas certas/jogo | saiu de quadra antes |');
console.log('|---|---:|---:|---:|---:|');
for (const [name, slot] of CAPS) {
    let full = 0;
    let cue = 0;
    let cues = 0;
    let off = 0;
    for (let i = 0; i < N; i++) {
        const { A, B } = baseTeams(i);
        const runner = new LiveRunner(FUTSAL_5, { ...A, captainUid: A.lineup[slot].uid }, B, `zona-${i}`);
        const s = runner.state;
        let gotFull = false;
        let gotCue = false;
        let inCue = false;
        let wasOff = false;
        while (!runner.finished && s.tick < 200_000) {
            if (s.phase === 'play' && s.tick % 2 === 0) {
                if (!gotFull && maxCharge(s.events, 0, s.tick).charge >= 1) gotFull = true;
                const cap = s.players.find((p) => p.team === 0 && p.captain);
                if (gotFull && !cap) wasOff = true;
                const now = gotFull && !!cap && s.ball.owner === cap.idx && inMaxZoneOf(s, cap);
                if (now && !inCue) cues++;
                inCue = now;
                gotCue ||= now;
            }
            runner.step();
        }
        full += Number(gotFull);
        cue += Number(gotCue);
        off += Number(wasOff && !gotCue);
    }
    const pct = (x: number) => `${Math.round((x / N) * 100)}%`;
    console.log(`| ${name} | ${pct(full)} | ${pct(cue)} | ${(cues / N).toFixed(2)} | ${pct(off)} |`);
}
