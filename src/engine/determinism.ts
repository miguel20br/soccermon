/**
 * Partidas fixas que têm que dar o mesmo resultado, bit a bit, no Node e em todo navegador (golden master do
 * duelo ao vivo). O teste `determinism.test.ts` guarda os hashes esperados; `npm run determinismo` roda isto no
 * Chromium, Firefox e WebKit. Mudou o motor de propósito: atualize os hashes e suba `ENGINE_VERSION`.
 */
import { maxCharge } from './agency';
import { FUTSAL_5, withConfig } from './config';
import { aiDraftTeam } from './draft';
import { createInstance } from './instance';
import { inMaxZoneOf } from './match';
import { Rng } from './rng';
import { type MatchResult, runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import type { MatchEvent, MatchOrder, TeamSetup } from './state';

/** FNV-1a de 32 bits sobre os códigos UTF-16 da string. */
function fnv1a(s: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Hash de tudo o que a partida produz. O `JSON.stringify` de número é exato pela especificação (menor decimal que
 * volta ao mesmo double), então diferença no último bit muda o hash.
 */
export function matchHash(r: MatchResult): string {
    const { score, shootout, winner, events, snapshots, finalRoster, possession, ticks } = r;
    return fnv1a(JSON.stringify({ score, shootout, winner, events, snapshots, finalRoster, possession, ticks }));
}

/** Hash só dos eventos (partida do LiveRunner, sem quadros). */
export const eventsHash = (events: readonly MatchEvent[]) => fnv1a(JSON.stringify(events));

function team(seed: string, name: string, tier: number, extra: Partial<TeamSetup> = {}): TeamSetup {
    const draft = aiDraftTeam(new Rng(seed, 'team'), tier, [], extra.formation);
    return { name, ...draft, tactic: 'balanced', color: 0, ...extra };
}

/** Roda as partidas fixas e devolve um hash por partida (na ordem). */
export function determinismHashes(): string[] {
    const subHome = team('det-sub-a', 'A', 1, { manualSubs: true });
    const subOrders: MatchOrder[] = [
        { tick: 900, team: 0, tactic: 'offensive' },
        { tick: 1500, team: 0, kind: 'sub', outUid: subHome.lineup[2].uid, inUid: subHome.bench[0].uid },
        { tick: 2600, team: 1, tactic: 'counter' },
    ];
    // prancheta no meio: goleiro vira pivô e muda a formação; depois uma troca e uma prancheta com quem saiu nela
    const lineHome = team('det-line-a', 'A', 2, { manualSubs: true });
    const u = lineHome.lineup.map((p) => p.uid);
    const lineOrders: MatchOrder[] = [
        { tick: 600, team: 0, kind: 'lineup', formation: '2-2', order: [u[4], u[1], u[2], u[3], u[0]] },
        { tick: 1300, team: 0, kind: 'sub', outUid: u[2], inUid: lineHome.bench[0].uid },
        { tick: 1310, team: 0, kind: 'lineup', formation: '3-1', order: [u[0], u[2], u[1], u[3], u[4]] },
    ];
    const games: [TeamSetup, TeamSetup, string, MatchOrder[]?][] = [
        [team('det-a', 'A', 0), team('det-b', 'B', 0), 'det-1'],
        [team('det-c', 'A', 2, { formation: '2-2' }), team('det-d', 'B', 3, { formation: 'ferrolho' }), 'det-2'],
        [team('det-e', 'A', 4, { tactic: 'offensive' }), team('det-f', 'B', 4, { tactic: 'defensive' }), 'det-3'],
        [subHome, team('det-sub-b', 'B', 1), 'det-orders', subOrders],
        [lineHome, team('det-line-b', 'B', 2), 'det-lineup', lineOrders],
    ];
    const hashes = games.map(([home, away, seed, orders]) =>
        matchHash(runMatch(FUTSAL_5, home, away, seed, { orders })),
    );
    // partida curtinha que termina empatada e vai pros pênaltis
    const short = runMatch(withConfig({ halfSeconds: 4 }), team('pk-a0', 'A', 0), team('pk-b0', 'B', 0), 'pk-0');
    hashes.push(matchHash(short));
    // beira da quadra: tempo, goleiro-linha, golpe máximo pedido algumas vezes e o rival com técnico IA
    const agOrders: MatchOrder[] = [
        { tick: 1000, team: 0, kind: 'timeout' },
        ...[3000, 3400, 3800, 4200, 4600].map((tick) => ({ tick, team: 0 as const, kind: 'max' as const })),
        { tick: 5000, team: 0, kind: 'flyGk', on: true },
    ];
    const agAway: TeamSetup = { ...team('det-ag-b', 'B', 2), coach: 'lance' };
    // capitão ala: o golpe máximo sai a ~17 m, fora da zona do pivô (zona por posição)
    const agHome = team('det-ag-a', 'A', 2, { manualSubs: true });
    hashes.push(
        matchHash(
            runMatch(FUTSAL_5, { ...agHome, captainUid: agHome.lineup[2].uid }, agAway, 'det-agency', {
                orders: agOrders,
            }),
        ),
    );
    // golpe máximo em 3 níveis com a nota do toque e o Lance sorteando a dele
    const lvOrders: MatchOrder[] = [1500, 2600, 3700, 4800].map((tick, k) => ({
        tick,
        team: 0,
        kind: 'max',
        q: (k % 3) as 0 | 1 | 2,
    }));
    hashes.push(
        matchHash(
            runMatch(FUTSAL_5, { ...agHome, captainUid: agHome.lineup[2].uid }, agAway, 'det-max3', {
                orders: lvOrders,
            }),
        ),
    );
    // golpe máximo por tipo (`maxType`): o N3 com o efeito do tipo do capitão, dos dois lados
    // (t5: o Psíquico do robô; t10: o Psíquico do capitão do Lance)
    hashes.push(eventsHash(maxTypeMatch('t5')), eventsHash(maxTypeMatch('t10')));
    // assinaturas (`maxSig`, motor 13 com ?assinatura=1): Mew sorteia o tipo no `rng`, Dragonite fura tudo e Ditto
    // copia o Metronome do Mew do capitão rival
    hashes.push(...[151, 149, 132].map((sp, k) => eventsHash(maxTypeMatch(['s2', 's3', 's9'][k], 4, sp))));
    // patrocínios de campo do motor 12 (Charanga liga e desliga a cada gol, Preparador, Clube Formador) dos dois lados
    const sp = ['charanga', 'preparador', 'formador'];
    hashes.push(
        matchHash(
            runMatch(
                FUTSAL_5,
                team('det-sp-a', 'A', 1, { manualSubs: true, sponsors: sp }),
                team('det-sp-b', 'B', 4, { sponsors: ['charanga'] }),
                'det-sponsors',
            ),
        ),
    );
    return hashes;
}

/**
 * Partida fixa com o efeito do tipo no N3: o técnico robô segura pro 3º gomo e toca na hora certa (como
 * scripts/balance/coach.ts, política n3); o rival é o Lance, que solta o dele sozinho. Devolve os eventos.
 */
export function maxTypeMatch(seed: string, capSlot = 4, sigSpecies?: number): MatchEvent[] {
    const base = team(`${seed}-a`, 'A', 3, { manualSubs: true });
    // com `sigSpecies`: esse capitão no lugar e as assinaturas ligadas (`maxSig`)
    const lineup = sigSpecies
        ? base.lineup.map((p, i) => (i === capSlot ? createInstance(sigSpecies, new Rng(seed, 'sig')) : p))
        : base.lineup;
    const home = { ...base, lineup };
    const away: TeamSetup = { ...team(`${seed}-b`, 'B', 3), coach: 'lance' };
    const live = new LiveRunner(
        withConfig({ maxType: true, maxSig: !!sigSpecies }),
        { ...home, captainUid: home.lineup[capSlot].uid },
        away,
        seed,
    );
    const s = live.state;
    while (!live.finished) {
        const cap = s.players.find((p) => p.team === 0 && p.captain);
        if (
            cap &&
            s.phase === 'play' &&
            !s.teams[0].agency.max &&
            s.ball.owner === cap.idx &&
            cap.role !== 'GK' &&
            inMaxZoneOf(s, cap) &&
            maxCharge(s.events, 0, s.tick).level >= 3
        )
            live.addOrder({ tick: s.tick, team: 0, kind: 'max', q: 2 });
        live.step();
    }
    return s.events;
}
