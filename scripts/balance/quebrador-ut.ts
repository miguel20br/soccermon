/**
 * Robô "quebrador" do Time Ultimate (auditoria de 27/11/2026, depois do hotfix 0.9.53.4): joga saves de verdade com o
 * motor e a mesma regra do store (pacote, Pick, objetivos, passe, Evolução, compra, venda, Draft) em cinco perfis e mede
 * Fichas por dia, a nota do time no dia 1, 7 e 30 e o dia da 1ª carta 85+ e do 1º time 85+.
 *
 * Uso: scripts/pesado.sh npx tsx scripts/balance/quebrador-ut.ts [--saves 2] [--dias 30] [--ciclo 15] [--reais 20]
 *      [--draft 40]   (só a conta do Draft: N campanhas com o time de maior nota, distribuição de vitórias)
 *
 * --ciclo: segundos por partida com o Pular (JOGAR → Pular → Continuar). --reais: partidas por dia que passam pelo
 * motor; acima disso o farmador já passou do teto do dia, e toda partida paga exatamente FICHAS_OVER_CAP (o resultado
 * não muda nada: objetivos e passe do dia já fecharam), então o robô só soma as Fichas. A Evolução só anda nas reais
 * (o farmador de verdade evolui ainda mais rápido: o número aqui é o piso).
 *
 * Política de compra (a de quem quer subir o time):
 * - todos: abre tudo, escolhe a opção de maior nota no Pick, resgata, vende repetida, escala as 5 melhores na vaga, faz
 *   Evolução/Treino nas cartas do Clube (a que termina com a maior nota) e compra Ouro que entra no time;
 * - ativo e farmadores: também compram a Bronze/Prata barata que evolui pra 85+ (Machop por 240 vira Machamp 95);
 * - colecionador: vende tudo o que não está no time e gasta as Fichas em Pacote Mini.
 * Ressalva: sem líderes, sem trocas/capitão no meio da partida; a química não entra na escolha do time.
 */

import { ENGINE_VERSION, FUTSAL_5 } from '../../src/engine/config';
import { cupRival } from '../../src/engine/cup';
import { species } from '../../src/engine/data';
import { FORMATIONS } from '../../src/engine/formations';
import { type PokemonInstance, slotRating, viewInstance } from '../../src/engine/instance';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { draftChoices, draftCost, draftEnter, draftMatch, draftPick } from '../../src/store/ultimate/draft';
import { evoPaths, evoPreview, newEvo } from '../../src/store/ultimate/evolutions';
import {
    EVO_ACTIVE_MAX,
    FICHAS_OVER_CAP,
    FICHAS_PACK_PRICE,
    type Level,
    MATCH_FICHAS_DAY_MAX,
    STARTERS,
    TEAM_SIZE,
} from '../../src/store/ultimate/rules';
import {
    buyCard,
    buyPack,
    canSell,
    cardPrice,
    choosePick,
    evolveCard,
    finishMatch,
    homeTeam,
    newUltimate,
    openPack,
    pickable,
    pickOptions,
    quickSell,
    redeem,
    sellRepeats,
    startEvo,
    teamAverage,
    teamStrength,
    type UltimateSave,
    ultimateRival,
    ultimateSeed,
} from '../../src/store/ultimate/ultimate';

const args = process.argv.slice(2);
const arg = (k: string, d: number) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const SAVES = arg('--saves', 2);
const DAYS = arg('--dias', 30);
const CYCLE_S = arg('--ciclo', 15);
const REAL = arg('--reais', 20);
const DRAFTS = arg('--draft', 0);
const DAY = 86_400_000;
/** Segunda 30/11/2026 (a 0.10.0), 10h de Brasília: o Natal (07/12) entra no meio do mês. */
const T0 = Date.UTC(2026, 10, 30, 13);

interface Profile {
    id: string;
    perDay: number;
    level: Level;
    evoBuy: boolean;
    seller: boolean;
    /** false = nunca compra Ouro (só a Bronze/Prata que evolui). */
    goldBuy?: boolean;
}
const FARM = Math.floor((8 * 3600) / CYCLE_S);
const PROFILES: Profile[] = [
    { id: 'típico (2/dia, Normal)', perDay: 2, level: 'normal', evoBuy: false, seller: false },
    { id: 'ativo (6/dia, Difícil)', perDay: 6, level: 'dificil', evoBuy: true, seller: false },
    { id: `farmador Pular Difícil (${FARM}/dia)`, perDay: FARM, level: 'dificil', evoBuy: true, seller: false },
    { id: `farmador Pular Fácil (${FARM}/dia)`, perDay: FARM, level: 'facil', evoBuy: true, seller: false },
    { id: 'colecionador vende tudo (4/dia)', perDay: 4, level: 'normal', evoBuy: false, seller: true },
    {
        id: `evolucionista: Pular Difícil, só compra Bronze/Prata que evolui (${FARM}/dia)`,
        perDay: FARM,
        level: 'dificil',
        evoBuy: true,
        seller: false,
        goldBuy: false,
    },
];

const ovr = (c: PokemonInstance) => viewInstance(c).overall;
const SLOTS = (u: UltimateSave) => FORMATIONS[u.team.formation].slots;

/** As 5 melhores na vaga (quem está em Evolução entra primeiro: só evolui jogando) + 2 no banco. */
function bestTeam(u: UltimateSave, evoFirst = true): UltimateSave {
    const slots = SLOTS(u);
    const at: (string | null)[] = slots.map(() => null);
    const free = [...u.cards];
    // quem está em Evolução entra primeiro, na vaga em que rende mais pro papel dele (o goleiro no gol, os outros na linha)
    for (const e of evoFirst ? u.evos : []) {
        const i = free.findIndex((c) => c.uid === e.uid);
        if (i < 0) continue;
        let slot = -1;
        let score = -1;
        slots.forEach((role, k) => {
            if (at[k] || (role === 'GK') !== (e.role === 'GK')) return;
            const s = slotRating(free[i], role);
            if (s > score) [slot, score] = [k, s];
        });
        if (slot >= 0) at[slot] = free.splice(i, 1)[0].uid;
    }
    slots.forEach((role, k) => {
        if (at[k]) return;
        let best = -1;
        let score = -1;
        free.forEach((c, i) => {
            const s = slotRating(c, role);
            if (s > score) [best, score] = [i, s];
        });
        if (best >= 0) at[k] = free.splice(best, 1)[0].uid;
    });
    const order = at.filter((x): x is string => !!x);
    free.sort((a, b) => ovr(b) - ovr(a));
    order.push(...free.slice(0, TEAM_SIZE - STARTERS).map((c) => c.uid));
    const starters = u.cards.filter((c) => order.slice(0, STARTERS).includes(c.uid));
    const captain = starters.length ? starters.reduce((b, c) => (ovr(c) > ovr(b) ? c : b)).uid : null;
    return { ...u, team: { ...u.team, order, captainUid: captain, cornerTakerUid: null } };
}

/** Abre tudo: Picks (a opção de maior nota), Mini, Grande, Evento; vende as repetidas; repete se encheu. */
function openAll(u: UltimateSave, now: number): UltimateSave {
    let cur = redeem(u);
    for (const p of [...cur.picks]) {
        const opts = pickOptions(cur, p, now).sort((a, b) => ovr(b) - ovr(a));
        const r = opts[0] && choosePick(cur, p.uid, opts[0].uid, now);
        if (r) cur = r.u;
    }
    for (let guard = 0; guard < 50; guard++) {
        let any = false;
        for (const kind of ['mini', 'big', 'evmini', 'evbig'] as const)
            for (;;) {
                const r = openPack(cur, now, kind);
                if (!r) break;
                cur = r.u;
                any = true;
            }
        cur = sellRepeats(cur);
        if (!any) break;
    }
    return cur;
}

/** A Evolução (ou Treino) que termina com a maior nota entre as cartas do Clube. */
function bestEvo(u: UltimateSave): { uid: string; path: number[]; final: number } | null {
    let best: { uid: string; path: number[]; final: number } | null = null;
    for (const c of u.cards) {
        if (u.evoDone.includes(c.uid) || u.evos.some((e) => e.uid === c.uid)) continue;
        for (const path of evoPaths(c, u.cards)) {
            const final = ovr(evoPreview(c, newEvo(c, path)));
            if (!best || final > best.final) best = { uid: c.uid, path, final };
        }
    }
    return best;
}

function spend(u0: UltimateSave, p: Profile, spent: { n: number }): UltimateSave {
    let u = u0;
    // evolui o que está pronto
    for (const e of [...u.evos]) {
        const r = evolveCard(u, e.uid);
        if (r) u = r.u;
    }
    if (p.seller) {
        u = quickSell(
            u,
            u.cards.filter((c) => canSell(u, c.uid)).map((c) => c.uid),
        );
        while (u.fichas >= FICHAS_PACK_PRICE) {
            const b = buyPack(u);
            if (!b) break;
            spent.n += FICHAS_PACK_PRICE;
            u = b;
        }
        return u;
    }
    const worst = () => {
        const s = bestTeam(u);
        const st = s.team.order.slice(0, STARTERS).flatMap((x) => s.cards.find((c) => c.uid === x) ?? []);
        return st.length < STARTERS ? 0 : Math.min(...st.map(ovr));
    };
    // a Bronze/Prata barata que evolui pra mais que o pior titular (o caminho de 240 Fichas pro 90+)
    if (p.evoBuy)
        while (u.evos.length < EVO_ACTIVE_MAX) {
            let pick: { id: number; final: number } | null = null;
            for (const id of [...pickable(u, 'bronze'), ...pickable(u, 'prata')]) {
                if (cardPrice(id) > u.fichas) continue;
                const inst = buyCard(u, id)?.card;
                if (!inst) continue;
                const final = Math.max(
                    ...evoPaths(inst, u.cards).map((path) => ovr(evoPreview(inst, newEvo(inst, path)))),
                );
                if (final > worst() && (!pick || final > pick.final)) pick = { id, final };
            }
            if (!pick) break;
            const r = buyCard(u, pick.id);
            if (!r) break;
            spent.n += cardPrice(pick.id);
            u = r.u;
            const paths = evoPaths(r.card, u.cards);
            const path = paths.reduce((b, x) =>
                ovr(evoPreview(r.card, newEvo(r.card, x))) > ovr(evoPreview(r.card, newEvo(r.card, b))) ? x : b,
            );
            u = startEvo(u, r.card.uid, path) ?? u;
        }
    // Evolução/Treino nas cartas do Clube
    while (u.evos.length < EVO_ACTIVE_MAX) {
        const e = bestEvo(u);
        if (!e || e.final <= worst()) break;
        const next = startEvo(u, e.uid, e.path);
        if (!next) break;
        u = next;
    }
    // Ouro que entra no time: a de maior nota que cabe nas Fichas
    for (; p.goldBuy !== false; ) {
        const w = worst();
        const gold = pickable(u, 'ouro')
            .filter((id) => cardPrice(id) <= u.fichas)
            .map((id) => ({ id, o: ovr(buyCard({ ...u, fichas: 1e9 }, id)!.card) }))
            .filter((x) => x.o > w)
            .sort((a, b) => b.o - a.o)[0];
        if (!gold) break;
        const r = buyCard(u, gold.id);
        if (!r) break;
        spent.n += cardPrice(gold.id);
        u = r.u;
    }
    return u;
}

function play(u0: UltimateSave, level: Level, now: number): UltimateSave {
    const u = bestTeam(u0);
    const home = homeTeam(u, 'Eu', 0);
    const rival = ultimateRival(u.salt, u.played, level, teamStrength(home));
    const live = { n: u.played, level, home, rival, orders: [], tick: 0, engine: ENGINE_VERSION };
    const m = runMatch(FUTSAL_5, home, cupRival(rival, true), `${ultimateSeed(u.salt, u.played)}-stage-0`, {
        snapshots: false,
    });
    return finishMatch({ ...u, live }, m, now);
}

/** Partida acima do teto do dia: paga FICHAS_OVER_CAP (qualquer resultado), sem motor. */
function flat(u: UltimateSave, now: number, day: string): UltimateSave {
    void now;
    return {
        ...u,
        fichas: u.fichas + FICHAS_OVER_CAP,
        matchFichas: { day, n: u.matchFichas.n + FICHAS_OVER_CAP },
        played: u.played + 1,
    };
}

/** Draft com o time de maior nota (o capitão e cada vaga: a opção de maior nota na vaga). */
function draftRun(u0: UltimateSave, now: number): { u: UltimateSave; wins: number } | null {
    let u = draftEnter(u0, u0.team.formation, now);
    if (!u) return null;
    for (let g = 0; g < 20; g++) {
        const opts = draftChoices(u);
        if (!opts.length) break;
        const best = opts.reduce((b, c) => (ovr(c) > ovr(b) ? c : b));
        u = draftPick(u, best.uid);
    }
    for (;;) {
        const m = draftMatch(u, 'Eu', 0);
        if (!m) break;
        const r = runMatch(FUTSAL_5, m.home, cupRival(m.rival, true), `${ultimateSeed(u.salt, m.n)}-stage-0`, {
            snapshots: false,
        });
        u = finishMatch({ ...u, live: { ...m, orders: [], tick: 0, engine: ENGINE_VERSION } }, r, now);
    }
    return { u, wins: u.draft.run?.games.filter((g) => g.won).length ?? 0 };
}

const dayKey = (now: number) => new Date(now - 3 * 3600_000).toISOString().slice(0, 10);

/**
 * --evo: quantas partidas no Difícil (com o Pular, a partida conta inteira) cada Bronze/Prata comprada leva até a forma
 * final, titular num time de 2 pacotes + o 1º Pick. Uma linha por espécie: partidas de cada passo, em cada save.
 */
if (args.includes('--evo')) {
    const IDS = [1, 4, 7, 60, 66, 74, 79, 88, 133, 147];
    console.log(`\nEvolução da Bronze/Prata comprada, Difícil, ${SAVES} saves (partidas por passo; o mínimo é 3)`);
    console.log('| Carta | Final | Passos | Partidas por save (passo 1 + passo 2) | Média |\n|---|---|---|---|---|');
    for (const id of IDS) {
        const per: string[] = [];
        const tot: number[] = [];
        let final = '';
        for (let s = 0; s < SAVES; s++) {
            let u = openAll(newUltimate(`ut-evo-${s}`, T0), T0);
            const r = buyCard({ ...u, fichas: 1e6 }, id);
            if (!r) break;
            u = r.u;
            const path = evoPaths(r.card).reduce((b, x) =>
                ovr(evoPreview(r.card, newEvo(r.card, x))) > ovr(evoPreview(r.card, newEvo(r.card, b))) ? x : b,
            );
            u = startEvo(u, r.card.uid, path) ?? u;
            const steps: number[] = [];
            let n = 0;
            for (let k = 0; k < 120 && !u.evoDone.includes(r.card.uid); k++) {
                u = play(u, 'dificil', T0 + k * 60_000);
                n++;
                const e = evolveCard(u, r.card.uid);
                if (e) {
                    u = e.u;
                    steps.push(n);
                    n = 0;
                    final = `${species(e.card.speciesId).name} ${ovr(e.card)}`;
                }
            }
            per.push(u.evoDone.includes(r.card.uid) ? steps.join(' + ') : `>120 (${steps.join(' + ')})`);
            tot.push(steps.reduce((a, b) => a + b, 0) + (u.evoDone.includes(r.card.uid) ? 0 : n));
        }
        const name = `${species(id).name} ${ovr(buyCard({ ...newUltimate('x'), fichas: 1e6 }, id)!.card)} (${cardPrice(id)} F)`;
        console.log(
            `| ${name} | ${final} | ${evoPaths({ speciesId: id, ability: '' })[0].length} | ${per.join(' / ')} | ${(tot.reduce((a, b) => a + b, 0) / tot.length).toFixed(1)} |`,
        );
    }
    process.exit(0);
}

if (DRAFTS) {
    const wins = [0, 0, 0, 0, 0];
    let u = { ...newUltimate('ut-draft-ev', T0), fichas: 1e9 };
    for (let i = 0; i < DRAFTS; i++) {
        const r = draftRun(u, T0 + i * 60_000);
        if (!r) break;
        wins[r.wins]++;
        u = { ...r.u, draft: { ...r.u.draft, run: null }, fichas: 1e9 };
    }
    console.log(`\nDraft: ${DRAFTS} campanhas, time de maior nota`);
    console.log('| Vitórias | 0 | 1 | 2 | 3 | 4 |\n|---|---|---|---|---|---|');
    console.log(`| Campanhas | ${wins.join(' | ')} |`);
    process.exit(0);
}

interface Row {
    fichasDia: number[];
    team: Record<number, number>;
    first85: number | null;
    card85: string;
    team85: number | null;
    matches: number;
}
console.log(`\nRobô quebrador: ${SAVES} saves, ${DAYS} dias desde 30/11/2026, Pular = ${CYCLE_S} s por partida`);
// --perfil 5: só um perfil (índice em PROFILES)
const ONLY = args.includes('--perfil') ? arg('--perfil', 0) : null;
for (const p of ONLY === null ? PROFILES : [PROFILES[ONLY]]) {
    const rows: Row[] = [];
    for (let s = 0; s < SAVES; s++) {
        let u = newUltimate(`ut-quebra-${s}`, T0);
        const spent = { n: 0 };
        const row: Row = { fichasDia: [], team: {}, first85: null, card85: '', team85: null, matches: 0 };
        for (let d = 0; d < DAYS; d++) {
            const now = T0 + d * DAY;
            const before = u.fichas + spent.n;
            u = openAll(u, now);
            u = spend(bestTeam(u), p, spent);
            // Draft grátis da semana (ativo e farmadores)
            if (p.evoBuy && draftCost(u, now) === 0) {
                const r = draftRun(u, now);
                if (r) u = { ...r.u, draft: { ...r.u.draft, run: null } };
            }
            for (let k = 0; k < p.perDay; k++) {
                const t = now + k * CYCLE_S * 1000;
                const capped = u.matchFichas.day === dayKey(t) && u.matchFichas.n >= MATCH_FICHAS_DAY_MAX;
                u = k < REAL || !capped ? play(u, p.level, t) : flat(u, t, dayKey(t));
                row.matches++;
                if (k < REAL && k % 3 === 2) u = spend(bestTeam(openAll(u, t)), p, spent);
            }
            u = spend(bestTeam(openAll(u, now + 12 * 3600_000)), p, spent);
            row.fichasDia.push(u.fichas + spent.n - before);
            // a nota do time que ele escalaria pra ganhar (sem as cartas em Evolução na frente)
            const t = bestTeam(u, false);
            const avg = teamAverage(homeTeam(t, 'Eu', 0));
            if ([1, 7, 14, 30].includes(d + 1)) row.team[d + 1] = avg;
            const c85 = u.cards.find((c) => ovr(c) >= 85);
            if (row.first85 === null && c85) {
                row.first85 = d + 1;
                row.card85 = `${species(c85.speciesId).name} ${ovr(c85)}${c85.special ? ` ${c85.special.kind}` : ''}${c85.evolved ? ` evo${c85.evolved}` : ''}`;
            }
            if (row.team85 === null && avg >= 85) row.team85 = d + 1;
        }
        rows.push(row);
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const fd = rows.map((r) => mean(r.fichasDia));
    const wk1 = rows.map((r) => mean(r.fichasDia.slice(0, 7)));
    const at = (k: number) => mean(rows.map((r) => r.team[k] ?? 0)).toFixed(1);
    const when = (k: 'first85' | 'team85') =>
        rows.map((r) => (r[k] === null ? `>${DAYS}` : `${r[k]}${k === 'first85' ? ` (${r.card85})` : ''}`)).join(' / ');
    console.log(
        `| ${p.id} | ${mean(fd).toFixed(0)} | ${mean(wk1).toFixed(0)} | ${at(1)} | ${at(7)} | ${at(14)} | ${at(30)} | ${when('first85')} | ${when('team85')} |`,
    );
}
console.log(
    '\n(colunas: perfil | Fichas/dia (mês) | Fichas/dia (1ª semana) | nota do time dia 1 | 7 | 14 | 30 | dia da 1ª carta 85+ | dia do 1º time 85+, um número por save)',
);
