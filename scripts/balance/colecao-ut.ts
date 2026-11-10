/**
 * Coleção do Time Ultimate na temporada (09/11/2026, pergunta do Miguel: "com só 151 Pokémon, não fica fácil rápido
 * demais?"). Irmão do semana-ut.ts, mas o robô GASTA: Pacote Mini quando ele dá mais espécie nova por Ficha, senão o
 * Pick do metal mais barato que ainda tem espécie faltando (o Pick nunca oferece espécie que você já tem); nunca
 * Escolher carta (o Pick é mais barato e também garante espécie nova). Abre tudo, fica com a opção de maior nota do
 * Pick, vende toda repetida. Acompanha a coleção por semana desde o começo da T1 (27/11, com o Natal).
 *
 * Economias (`ECONS`): "antes" = Fichas e pontos de pacote separados (Fichas: só Mini; pontos: Pick 10/25/60, +5 por
 * pacote aberto, repetida 1/3/8), "depois" = moeda única com o Pick ×6, e as alavancas (pacote aberto +15/+10, Mini 200).
 * As partidas do motor rodam uma vez por save e o placar se repete em todas as economias (o rival acompanha a força do
 * seu time, então o placar quase não depende da coleção; a comparação fica só na economia).
 *
 * Uso: scripts/pesado.sh npx tsx scripts/balance/colecao-ut.ts [--saves 8] [--semanas 26] [--econ antes,depois]
 *      [--placares placares.json] (guarda os placares do motor: a 2ª rodada com outras economias leva segundos)
 * Ressalva: não joga líder (Difícil) nem a Copa (ponte), não faz Evolução; o time é o que o pacote montou.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ENGINE_VERSION, FUTSAL_5 } from '../../src/engine/config';
import { cupRival } from '../../src/engine/cup';
import { viewInstance } from '../../src/engine/instance';
import { runMatch } from '../../src/engine/runners/batch-runner';
import { editionOf, ICONS } from '../../src/engine/specials';
import { OPEN_FICHAS, REPEAT_FICHAS, SEASONS } from '../../src/store/ultimate/rules';
import {
    buyPack,
    buyPick,
    choosePick,
    finishMatch,
    homeTeam,
    isKeeperSpecies,
    isRepeat,
    metalPools,
    newUltimate,
    openPack,
    packsReady,
    pickOptions,
    redeem,
    rollSeason,
    sellRepeats,
    teamStrength,
    type UltimateMatch,
    type UltimateSave,
    ultimateRival,
    ultimateSeed,
} from '../../src/store/ultimate/ultimate';
import type { Metal } from '../../src/ui/rarity';

const args = process.argv.slice(2);
const arg = (k: string, d: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SAVES = Number(arg('--saves', '8'));
const WEEKS = Number(arg('--semanas', '26'));
const DAY = 24 * 60 * 60 * 1000;
const T0 = SEASONS[0].start;

interface Econ {
    id: string;
    /** Pontos de pacote numa carteira à parte (a economia de antes). */
    split: boolean;
    /** Fichas por pacote aberto (moeda única). */
    open: number;
    mini: number;
    /** Preço do Pick (em pontos se `split`). */
    pick: Record<Metal, number>;
    smart?: boolean;
    /** Não compra nada (só o que vem de graça: relógio, objetivos, passe, evento). */
    none?: boolean;
}
const ECONS: Econ[] = [
    { id: 'antes', split: true, open: 0, mini: 150, pick: { bronze: 10, prata: 25, ouro: 60 } },
    { id: 'depois', split: false, open: 25, mini: 150, pick: { bronze: 60, prata: 150, ouro: 360 } },
    {
        id: 'depois-esperto',
        split: false,
        open: 25,
        mini: 150,
        pick: { bronze: 60, prata: 150, ouro: 360 },
        smart: true,
    },
    { id: 'aberto15', split: false, open: 15, mini: 150, pick: { bronze: 60, prata: 150, ouro: 360 } },
    { id: 'aberto10', split: false, open: 10, mini: 150, pick: { bronze: 60, prata: 150, ouro: 360 } },
    { id: 'mini200', split: false, open: 25, mini: 200, pick: { bronze: 60, prata: 150, ouro: 360 } },
    { id: 'aberto15+mini200', split: false, open: 15, mini: 200, pick: { bronze: 60, prata: 150, ouro: 360 } },
    { id: 'aberto10+mini300', split: false, open: 10, mini: 300, pick: { bronze: 60, prata: 150, ouro: 360 } },
    // a alavanca que pega o Pick (a compra que garante espécie nova)
    { id: 'pick12', split: false, open: 25, mini: 150, pick: { bronze: 120, prata: 300, ouro: 720 } },
    { id: 'pick20', split: false, open: 25, mini: 150, pick: { bronze: 200, prata: 500, ouro: 1200 } },
    { id: 'pick20+aberto10', split: false, open: 10, mini: 150, pick: { bronze: 200, prata: 500, ouro: 1200 } },
    { id: 'sem-compra', split: false, open: 25, mini: 150, pick: { bronze: 60, prata: 150, ouro: 360 }, none: true },
];
const want = arg('--econ', ECONS.map((e) => e.id).join(',')).split(',');

const METALS: Metal[] = ['bronze', 'prata', 'ouro'];
const POOLS = metalPools();
const ODDS: Record<Metal, number> = { bronze: 0.62, prata: 0.28, ouro: 0.1 };
const ICON_IDS = new Set(Object.keys(ICONS).map(Number));

/** Carteira do robô: as Fichas ficam no save; os pontos de antes, aqui. */
interface Bot {
    u: UltimateSave;
    pts: number;
}

const missing = (u: UltimateSave, m: Metal) => {
    const owned = new Set(u.cards.map((c) => c.speciesId));
    return POOLS[m].filter((id) => !owned.has(id)).length;
};

/** Desconta do que o jogo pagou por pacote aberto e venda o que a economia `e` paga diferente. */
function afterOpen(b: Bot, e: Econ) {
    b.u = { ...b.u, fichas: b.u.fichas - OPEN_FICHAS + (e.split ? 0 : e.open) };
    if (e.split) b.pts += OPEN_FICHAS / 5;
}
function sell(b: Bot, e: Econ) {
    const before = b.u.fichas;
    b.u = sellRepeats(b.u);
    if (e.split) {
        b.pts += (b.u.fichas - before) / 5;
        b.u = { ...b.u, fichas: before };
    }
}

function openAll(b: Bot, now: number, e: Econ) {
    for (;;) {
        for (const p of [...b.u.picks]) {
            const opts = pickOptions(b.u, p, now);
            // espécie nova primeiro (a repetida só sai quando não sobra nova), depois a nota
            const score = (c: (typeof opts)[number]) => (isRepeat(b.u.cards, c) ? 0 : 1000) + viewInstance(c).overall;
            const best = opts.reduce((x, y) => (score(y) > score(x) ? y : x), opts[0]);
            const r = best && choosePick(b.u, p.uid, best.uid, now);
            if (r) b.u = r.u;
        }
        let opened = 0;
        for (const kind of ['mini', 'big'] as const)
            for (;;) {
                const r = openPack(b.u, now, kind);
                if (!r) break;
                b.u = r.u;
                afterOpen(b, e);
                opened++;
            }
        sell(b, e);
        if (!opened || packsReady(b.u, now) + b.u.bigPacks + b.u.picks.length === 0) return;
    }
}

/** Espécies novas esperadas por Ficha líquida no Mini (o que volta: pacote aberto e venda das repetidas). */
function miniValue(u: UltimateSave, e: Econ) {
    let fresh = 0;
    let back = e.split ? 0 : e.open;
    for (const m of METALS) {
        const f = missing(u, m) / POOLS[m].length;
        fresh += 3 * ODDS[m] * f;
        if (!e.split) back += 3 * ODDS[m] * (1 - f) * REPEAT_FICHAS[m];
    }
    return fresh / Math.max(1, e.mini - back);
}

/**
 * O Pick mais barato com espécie nova no metal dele. `smart`: o robô sabe que o Pick sem espécie nova no metal abre
 * pros metais acima (com Bronze e Prata completos, o Pick Bronze dá Ouro nova pelo preço do Bronze).
 */
const pickMetal = (u: UltimateSave, smart: boolean) =>
    METALS.find((m) => (smart ? METALS.slice(METALS.indexOf(m)) : [m]).some((x) => missing(u, x)));

/** Gasta: compra, abre o que comprou e repete enquanto der. */
function spend(b: Bot, now: number, e: Econ) {
    while (!e.none) {
        const m = pickMetal(b.u, !!e.smart);
        const mini = miniValue(b.u, e);
        const pick = m ? 1 / e.pick[m] : 0;
        let bought = false;
        if (e.split) {
            // carteiras separadas: Fichas só compram Mini; pontos só o Pick
            if (b.u.fichas >= e.mini) {
                b.u = { ...buyPack({ ...b.u, fichas: 150 })!, fichas: b.u.fichas - e.mini };
                bought = true;
            }
            if (m && b.pts >= e.pick[m]) {
                b.u = { ...buyPick({ ...b.u, fichas: 360 }, m)!, fichas: b.u.fichas };
                b.pts -= e.pick[m];
                bought = true;
            }
        } else if (m && pick > mini) {
            if (b.u.fichas >= e.pick[m]) {
                b.u = { ...buyPick({ ...b.u, fichas: 360 }, m)!, fichas: b.u.fichas - e.pick[m] };
                bought = true;
            }
        } else if (b.u.fichas >= e.mini) {
            // Mini também depois da coleção completa: Shiny, Ícone e Evento
            b.u = { ...buyPack({ ...b.u, fichas: 150 })!, fichas: b.u.fichas - e.mini };
            bought = true;
        }
        if (!bought) return;
        openAll(b, now, e);
    }
}

/** Partidas do motor por save: rodam uma vez e repetem o placar nas outras economias. */
const CACHE = arg('--placares', '');
const scores = new Map<string, UltimateMatch[]>(
    CACHE && existsSync(CACHE) ? Object.entries(JSON.parse(readFileSync(CACHE, 'utf8'))) : [],
);
function play(b: Bot, now: number, key: string) {
    const u = b.u;
    const home = homeTeam(u, 'Eu', 0);
    const rival = ultimateRival(u.salt, u.played, 'normal', teamStrength(home));
    const live = { n: u.played, level: 'normal' as const, home, rival, orders: [], tick: 0, engine: ENGINE_VERSION };
    const list = scores.get(key) ?? [];
    scores.set(key, list);
    if (!list[u.played]) {
        const m = runMatch(FUTSAL_5, home, cupRival(rival, true), `${ultimateSeed(u.salt, u.played)}-stage-0`, {
            snapshots: false,
        });
        list[u.played] = { score: m.score, shootout: m.shootout };
    }
    b.u = redeem(finishMatch({ ...u, live }, list[u.played], now));
}

interface Snap {
    species: number;
    ouro: number;
    goldTeam: boolean;
    shiny: number;
    icon: number;
    event: number;
    fichas: number;
}
function snap(b: Bot): Snap {
    const sp = new Set(b.u.cards.map((c) => c.speciesId));
    const ouro = POOLS.ouro.filter((id) => sp.has(id));
    const of = (ed: string) => new Set(b.u.cards.filter((c) => editionOf(c) === ed).map((c) => c.speciesId)).size;
    return {
        species: sp.size,
        ouro: ouro.length,
        // 5 titulares Ouro: 5 espécies Ouro e uma delas joga no gol
        goldTeam: ouro.length >= 5 && ouro.some(isKeeperSpecies),
        shiny: of('shiny'),
        icon: of('icone'),
        event: of('evento'),
        fichas: b.u.fichas + b.pts * 5,
    };
}

const total = POOLS.bronze.length + POOLS.prata.length + POOLS.ouro.length;
console.log(
    `${SAVES} saves, ${WEEKS} semanas desde ${new Date(T0).toISOString().slice(0, 10)}; espécies ${total} (Bronze ${POOLS.bronze.length} · Prata ${POOLS.prata.length} · Ouro ${POOLS.ouro.length}, goleiros Ouro ${POOLS.ouro.filter(isKeeperSpecies).length}); Ícones ${ICON_IDS.size}`,
);

for (const perDay of [2, 4])
    for (const e of ECONS.filter((x) => want.includes(x.id))) {
        const weeks: Snap[][] = Array.from({ length: WEEKS }, () => []);
        for (let s = 0; s < SAVES; s++) {
            const b: Bot = { u: rollSeason(newUltimate(`ut-colecao-${s}`, T0 - DAY), T0).u, pts: 0 };
            for (let d = 0; d < WEEKS * 7; d++) {
                const now = T0 + d * DAY + 20 * 60 * 60 * 1000;
                openAll(b, now, e);
                for (let k = 0; k < perDay; k++) play(b, now + k * 60_000, `${perDay}-${s}`);
                openAll(b, now + perDay * 60_000, e);
                spend(b, now + perDay * 60_000, e);
                if (d % 7 === 6) weeks[Math.floor(d / 7)].push(snap(b));
            }
        }
        const avg = (w: Snap[], k: keyof Snap) => w.reduce((a, x) => a + Number(x[k]), 0) / w.length;
        const firstWeek = (ok: (x: Snap) => boolean) => {
            const ws = Array.from({ length: SAVES }, (_, s) => weeks.findIndex((w) => ok(w[s])) + 1);
            const done = ws.filter((x) => x > 0);
            return done.length
                ? `${(done.reduce((a, x) => a + x, 0) / done.length).toFixed(1)} (${Math.min(...done)}–${Math.max(...done)}; ${done.length}/${SAVES})`
                : `> ${WEEKS}`;
        };
        console.log(`\n## ${perDay} partidas por dia · ${e.id}`);
        console.log(
            `151: semana ${firstWeek((x) => x.species >= total)} · time Ouro: semana ${firstWeek((x) => x.goldTeam)}`,
        );
        console.log('| Semana | Espécies | Ouro | Shiny | Ícones | Evento | Fichas guardadas |');
        console.log('|---|---|---|---|---|---|---|');
        weeks.forEach((w, i) => {
            if (i < 4 || (i + 1) % 2 === 0 || i === WEEKS - 1)
                console.log(
                    `| ${i + 1} | ${avg(w, 'species').toFixed(0)} | ${avg(w, 'ouro').toFixed(1)} | ${avg(w, 'shiny').toFixed(1)} | ${avg(w, 'icon').toFixed(1)} | ${avg(w, 'event').toFixed(1)} | ${avg(w, 'fichas').toFixed(0)} |`,
                );
        });
        if (CACHE) writeFileSync(CACHE, JSON.stringify(Object.fromEntries(scores)));
    }
