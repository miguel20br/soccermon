// % de partidas em que a hora certa do golpe máximo aparece pelo menos uma vez, por nível, por capitão (o botão só
// acende aí: capitão de linha com a bola na zona da vaga dele, ou rival na zona do goleiro capitão; `maxCue`).
// Uso: npx tsx scripts/balance/hora-certa.ts <partidas> <ids separados por vírgula>
// Time do jogador = time base do coach.ts com a espécie na vaga natural e capitã, sem trocas automáticas; ninguém
// toca no botão, então a barra fica no nível mais alto que chegou.
import { maxCharge } from '../../src/engine/agency';
import { inMaxZoneOf } from '../../src/engine/match';
import { LiveRunner } from '../../src/engine/runners/live-runner';
import { baseTeams, createInstance, FUTSAL_5, formationOf, insertSpecies, Rng, species, viewInstance } from './lib';

const N = Number(process.argv[2]) || 100;
const CAPS = (process.argv[3] ?? '6,59,149,143,144,9,25,94,150,68').split(',').map(Number);
for (const id of CAPS) {
    const hit = [0, 0, 0];
    const role: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
        const { A, B } = baseTeams(i);
        const r = insertSpecies(A, id, i);
        let team = r?.team;
        let inst = r?.inst;
        if (!r) {
            inst = createInstance(id, new Rng(`ins-${i}-${id}`));
            const nat = viewInstance(inst).naturalPosition;
            const slots = formationOf(A.formation).slots;
            let k = slots.indexOf(nat);
            if (k < 0) k = 4;
            const lineup = A.lineup.map((p, j) => (j === k ? inst! : p));
            const bench = A.bench.filter((p) => p.speciesId !== id);
            team = { ...A, lineup, bench };
        }
        team = { ...team!, captainUid: inst!.uid, manualSubs: true };
        const live = new LiveRunner(FUTSAL_5, team, B, `hc-${i}`);
        const s = live.state;
        const got = [false, false, false];
        while (!live.finished && s.tick < 200_000) {
            live.step();
            if (s.phase !== 'play' || s.ball.owner === null) continue;
            const owner = s.players[s.ball.owner];
            const cap = s.players.find((p) => p.team === 0 && p.captain);
            if (!cap) continue;
            const cue =
                cap.role === 'GK'
                    ? owner.team === 1 && inMaxZoneOf(s, owner, 'GK')
                    : owner === cap && inMaxZoneOf(s, cap);
            if (!cue) continue;
            const lv = maxCharge(s.events, 0, s.tick, 5).level;
            for (let l = 0; l < lv; l++) got[l] = true;
        }
        const cap0 = s.players.find((p) => p.team === 0 && p.captain);
        role[cap0?.role ?? 'none'] = (role[cap0?.role ?? 'none'] ?? 0) + 1;
        got.forEach((g, l) => (hit[l] += g ? 1 : 0));
    }
    console.log(
        `${id} ${species(id).name}`.padEnd(16),
        hit.map((h, l) => `N${l + 1} ${((100 * h) / N).toFixed(0)}%`).join('  '),
        JSON.stringify(role),
    );
}
