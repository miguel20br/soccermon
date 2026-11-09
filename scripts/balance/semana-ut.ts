/**
 * Economia do Time Ultimate por semana (moeda única, 09/11/2026): quanto um jogador ganha de Fichas e de onde
 * (partida, objetivos e passe, pacote aberto, venda rápida; os dois últimos eram os pontos de pacote). Saves de
 * verdade: partidas do motor no Normal (rival com o treinador que reage, como a tela), objetivos, passe, Resgatar,
 * abre tudo o que tem e vende todas as repetidas. Não compra nada (mede só o que entra).
 *
 * Uso: scripts/pesado.sh npx tsx scripts/balance/semana-ut.ts [--saves 10] [--semanas 4]
 * Perfis: típico = 2 partidas por dia (a conta do passe no plano); ativo = 4 por dia (~o teto do passe).
 * Ressalva: o robô não troca nem chama o capitão; não faz Evolução nem líder; sem evento (semanas de janeiro).
 */

import { ENGINE_VERSION, FUTSAL_5 } from '../../src/engine/config';
import { cupRival } from '../../src/engine/cup';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { OPEN_FICHAS } from '../../src/store/ultimate/rules';
import {
    choosePick,
    finishMatch,
    homeTeam,
    newUltimate,
    openPack,
    packsReady,
    pickOptions,
    redeem,
    sellRepeats,
    teamStrength,
    type UltimateSave,
    ultimateRival,
    ultimateSeed,
} from '../../src/store/ultimate/ultimate';

const args = process.argv.slice(2);
const arg = (k: string, d: number) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const SAVES = arg('--saves', 10);
const WEEKS = arg('--semanas', 4);
const DAY = 24 * 60 * 60 * 1000;
/** Segunda, 11/01/2027, meia-noite de Brasília: depois do Natal, semana cheia dos objetivos. */
const T0 = Date.UTC(2027, 0, 11, 3);

interface Week {
    matches: number;
    fichasMatch: number;
    fichasOther: number; // objetivos, passe, primeiros passos
    fichasOpen: number;
    fichasSell: number;
    packs: number;
    sold: number;
}
const blank = (): Week => ({
    matches: 0,
    fichasMatch: 0,
    fichasOther: 0,
    fichasOpen: 0,
    fichasSell: 0,
    packs: 0,
    sold: 0,
});

/** Abre tudo (Picks: a 1ª opção; Mini; Grande) e vende as repetidas. */
function openAll(u: UltimateSave, now: number, w: Week): UltimateSave {
    let cur = u;
    for (const p of [...cur.picks]) {
        const opt = pickOptions(cur, p, now)[0];
        const r = opt && choosePick(cur, p.uid, opt.uid, now);
        if (r) cur = r.u;
    }
    for (const kind of ['mini', 'big'] as const)
        for (;;) {
            const r = openPack(cur, now, kind);
            if (!r) break;
            cur = r.u;
            w.packs++;
            w.fichasOpen += OPEN_FICHAS;
        }
    const before = cur.fichas;
    const n = cur.pending.filter((p) => p.kind === 'card').length;
    cur = sellRepeats(cur);
    w.fichasSell += cur.fichas - before;
    w.sold += n;
    // Pendentes encheu no meio? abre o resto depois de vender
    return packsReady(cur, now) + cur.bigPacks > 0 && n ? openAll(cur, now, w) : cur;
}

function play(u: UltimateSave, now: number, w: Week): UltimateSave {
    const home = homeTeam(u, 'Eu', 0);
    const rival = ultimateRival(u.salt, u.played, 'normal', teamStrength(home));
    const live = { n: u.played, level: 'normal' as const, home, rival, orders: [], tick: 0, engine: ENGINE_VERSION };
    const m = runMatch(FUTSAL_5, home, cupRival(rival, true), `${ultimateSeed(u.salt, u.played)}-stage-0`, {
        snapshots: false,
    });
    const before = u.fichas;
    const out = finishMatch({ ...u, live }, m, now);
    w.matches++;
    w.fichasMatch += out.last?.fichas ?? 0;
    const paid = redeem(out);
    w.fichasOther += paid.fichas - before - (out.last?.fichas ?? 0);
    return paid;
}

for (const perDay of [2, 4]) {
    const weeks = Array.from({ length: WEEKS }, blank);
    for (let s = 0; s < SAVES; s++) {
        let u = newUltimate(`ut-semana-${s}`, T0);
        for (let d = 0; d < WEEKS * 7; d++) {
            const w = weeks[Math.floor(d / 7)];
            const now = T0 + d * DAY + 20 * 60 * 60 * 1000;
            u = openAll(u, now, w);
            for (let k = 0; k < perDay; k++) u = play(u, now + k * 60_000, w);
            u = openAll(u, now + perDay * 60_000, w);
        }
    }
    const f = (x: number) => (x / SAVES).toFixed(0);
    console.log(`\n${perDay} partidas por dia, Normal, ${SAVES} saves (médias por semana)`);
    console.log(
        '| Semana | Partidas | Pacotes abertos | Repetidas vendidas | Fichas: partida | objetivos e passe | pacote aberto | venda rápida | total |',
    );
    console.log('|---|---|---|---|---|---|---|---|---|');
    weeks.forEach((w, i) =>
        console.log(
            `| ${i + 1} | ${f(w.matches)} | ${f(w.packs)} | ${f(w.sold)} | ${f(w.fichasMatch)} | ${f(w.fichasOther)} | ${f(w.fichasOpen)} | ${f(w.fichasSell)} | ${f(w.fichasMatch + w.fichasOther + w.fichasOpen + w.fichasSell)} |`,
        ),
    );
}
