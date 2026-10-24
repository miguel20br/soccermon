/**
 * Caça a partida do curta POV (rápido, sem navegador): o mesmo time do `?demo=maximo&capitao=<id>&k=<k>` e a mesma
 * partida que a tela simula. Pra cada k, quando o botão acende (a regra da tela: `maxCueNear` com a folga) e em que
 * nível, e se soltar no 1º N3 aceso vira gol nosso logo depois.
 *   npx tsx trailer/curta-pov/cacar.ts <capitão> [k0] [n]
 */
import './sem-idb';
import { maxCharge } from '../../src/engine/agency';
import { FUTSAL_5 } from '../../src/engine/config';
import { cupRival } from '../../src/engine/cup';
import { createInstance } from '../../src/engine/instance';
import { Rng } from '../../src/engine/rng';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { playerTeam, useGame } from '../../src/store/game-store';
import { captainAt, MAX_CUE_EARLY, MAX_CUE_LATCH, maxCueNear, roleAt } from '../../src/ui/match-view';

const cap = Number(process.argv[2] ?? 149);
const k0 = Number(process.argv[3] ?? 0);
const n = Number(process.argv[4] ?? 20);

for (let k = k0; k < k0 + n; k++) {
    useGame.getState().newRun('Demo FC', `max${k}`);
    const base = useGame.getState().run!;
    const rng = new Rng(`max${k}`, 'demo');
    const lineup = [143, 68, 130, 18, cap].map((id) => createInstance(id, rng));
    const bench = [95, 25].map((id) => createInstance(id, rng));
    const run = {
        ...base,
        formation: '1-2-1' as const,
        picks: [...lineup, ...bench],
        lineup: lineup.map((p) => p.uid),
        bench: bench.map((p) => p.uid),
        captainUid: lineup[4].uid,
        draftRound: 7,
        status: 'lineup' as const,
    };
    const team = { ...playerTeam(run), manualSubs: true };
    const rival = cupRival(run.opponents[0], true);
    const seed = `${run.seed}-stage-0`;
    const m = runMatch(FUTSAL_5, team, rival, seed);
    const setups = [team, rival] as [typeof team, typeof rival];
    const end = m.events.at(-1)?.tick ?? 0;
    // acesos: cada trecho seguido de "aceso" (por nível); o N1 e o N2 esperam (só tela), o N3 solta
    const acesos: { nivel: number; de: number; ate: number }[] = [];
    for (let t = 0; t <= end; t++) {
        const c = captainAt(m, setups, 0, t).idx;
        if (c === null) continue;
        const lit = maxCueNear(m.snapshots, t - MAX_CUE_LATCH, t + MAX_CUE_EARLY, 0, c, roleAt(m, setups, c, t));
        if (!lit) continue;
        const lv = maxCharge(m.events, 0, t, 5).level;
        if (lv < 1) continue;
        const last = acesos.at(-1);
        if (last && last.ate >= t - 1 && last.nivel === lv) last.ate = t;
        else acesos.push({ nivel: lv, de: t, ate: t });
    }
    const n3 = acesos.find((a) => a.nivel >= 3);
    let fim = '';
    if (n3) {
        // soltar em cada tick da janela acesa: em quais vira gol nosso (e em quantos ticks)
        const oks: string[] = [];
        for (let at = n3.de; at <= Math.min(n3.ate, n3.de + 14); at++) {
            const r = runMatch(FUTSAL_5, team, rival, seed, { orders: [{ tick: at, team: 0, kind: 'max', q: 2 }] });
            const gol = r.events.find((e) => e.type === 'goal' && e.tick > at && e.tick < at + 120);
            if (gol?.type === 'goal' && gol.team === 0) oks.push(`${at - n3.de}:+${gol.tick - at}`);
        }
        fim = oks.length ? `gol soltando em +${oks.join(' +')} (janela ${n3.ate - n3.de})` : 'sem gol';
    }
    const seq = acesos.map((a) => `N${a.nivel}@${a.de}-${a.ate}`).join(" ");
    const bom = acesos.some((a) => a.nivel === 1) && acesos.some((a) => a.nivel === 2) && n3 && fim.startsWith('gol');
    console.log(`${bom ? '★' : ' '} cap ${cap} k ${k}: ${seq} | ${fim}`);
}
