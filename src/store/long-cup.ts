import { CUP_STAGES } from '../engine/cup';
import {
    buildCupMap,
    type CupMap,
    FINAL_MATCH,
    GROUP_GAMES,
    GROUP_START,
    LONG_MATCHES,
    type MapNode,
    nodeById,
} from '../engine/cup-map';
import { Rng } from '../engine/rng';
import type { TeamSetup } from '../engine/state';

/**
 * Copa longa (docs/planos/copa-longa.md): o que muda numa copa com `mode: 'longa'`. Sem `mode` é a Copa rápida de
 * sempre (e a Copa do Dia), e nada aqui mexe nela.
 */
export type CupMode = 'longa';

/** A Copa longa aparece na Home quando a 0.9.1 estiver pronta (até lá, só pelo `?demo=mapa`). */
export const LONG_CUP_LIVE = false;

/** Cartões amarelos: na Copa longa uma derrota fora da Final não elimina; a segunda é o vermelho. */
export const YELLOW_CARDS = 1;

/** Raridade (linha da `TIER_ODDS`) do reforço, do Mercado e do pacote pela partida: pior no começo, melhor no fim. */
export const LONG_ROUND = [1, 2, 3, 4, 5, 6, 6, 6];

interface ModeRun {
    mode?: CupMode;
    stage: number;
}
export const isLong = (run: { mode?: CupMode } | null | undefined) => run?.mode === 'longa';
/** Quantas partidas a copa tem. */
export const cupLength = (run: { mode?: CupMode }) => (isLong(run) ? LONG_MATCHES : CUP_STAGES.length);
/** A partida `stage` é a Final? (na longa toda rota tem as mesmas 8 partidas, então a 8ª é a Final) */
export const isFinalStage = (run: ModeRun, stage = run.stage) => stage === cupLength(run) - 1;
export const longRound = (stage: number) => LONG_ROUND[Math.min(stage, LONG_ROUND.length - 1)];

/** Campos da Copa longa no `RunState` (opcionais: copa antiga e Copa rápida não têm). */
export interface LongRunFields {
    mode?: CupMode;
    map?: CupMap;
    /** Casa em que você está (null = ainda não entrou no mapa). */
    at?: string | null;
    /** Casas por onde passou, em ordem. */
    path?: string[];
    /** Cartões amarelos já levados. */
    cards?: number;
    /** Partes da história já contadas (uma por região do mapa). */
    told?: string[];
    /** Quem está fora e por quantas partidas (lesão, Creche, treino puxado). Fica no banco e não entra. */
    out?: Record<string, number>;
    /** Evento da entrevista: o próximo rival entra mais fraco (−1) ou mais forte (+1). */
    rivalShift?: number;
    /** Eventos já vistos nesta copa (não repetem). */
    eventsSeen?: string[];
    /** Fase de grupos no Planalto: os 3 rivais do seu grupo, na ordem das rodadas. */
    group?: { rivals: TeamSetup[] } | null;
    /** Evento aberto (status 'event'). */
    event?: import('./long-events').LongEvent | null;
}

/** "Nova copa" no fim de uma copa: o mesmo modo (Rota começa outra Rota; Relâmpago e Copa do Dia, a Relâmpago). */
export const nextCupMode = (run: { mode?: CupMode; daily?: string }): CupMode | undefined =>
    run.daily ? undefined : run.mode;

/** Está fora (machucado ou na Creche)? */
export const isOut = (run: LongRunFields, uid: string) => (run.out?.[uid] ?? 0) > 0;
/** Depois de uma partida, cada um que estava fora tem uma partida a menos pra voltar. */
export function tickOut(out: Record<string, number> | undefined): Record<string, number> | undefined {
    if (!out) return out;
    const next = Object.fromEntries(Object.entries(out).flatMap(([u, n]) => (n > 1 ? [[u, n - 1]] : [])));
    return Object.keys(next).length ? next : undefined;
}

export const newLongFields = (seed: string): LongRunFields => ({
    mode: 'longa',
    map: buildCupMap(seed),
    at: null,
    path: [],
    cards: 0,
});

export const currentNode = (run: LongRunFields): MapNode | undefined =>
    run.map && run.at ? nodeById(run.map, run.at) : undefined;

/** A partida `stage` é da fase de grupos? */
export const isGroupStage = (stage: number) => stage >= GROUP_START && stage < FINAL_MATCH;
/** Pontos no grupo: vitória 3, vitória nos pênaltis 2, derrota nos pênaltis 1, derrota 0. */
export const groupPoints = (won: boolean, shootout: boolean) => (won ? (shootout ? 2 : 3) : shootout ? 1 : 0);

export interface GroupRow {
    name: string;
    color: number;
    you?: boolean;
    played: number;
    pts: number;
    gf: number;
    ga: number;
}
export interface GroupGame {
    a: number;
    b: number;
    score: [number, number];
    shootout: boolean;
    /** 0 = `a` ganhou, 1 = `b`. */
    winner: 0 | 1;
}

/** Os jogos entre os rivais do grupo, rodada a rodada (sorteio pela seed: placar plausível, empate vai pros pênaltis). */
export function groupOthers(seed: string): GroupGame[] {
    // rodada 1: B × C; rodada 2: A × C; rodada 3: A × B (A, B, C = os rivais na ordem em que você enfrenta)
    const pairs: [number, number][] = [
        [2, 3],
        [1, 3],
        [1, 2],
    ];
    return pairs.map(([a, b], md) => {
        const rng = new Rng(seed, `group-${md}`);
        const ga = rng.int(0, 5);
        const gb = rng.int(0, 5);
        const shootout = ga === gb;
        const winner: 0 | 1 = shootout ? (rng.chance(0.5) ? 0 : 1) : ga > gb ? 0 : 1;
        return { a, b, score: [ga, gb], shootout, winner };
    });
}

/**
 * Tabela do grupo agora: você (linha 0) e os 3 rivais. Os jogos dos outros aparecem rodada a rodada, junto com o seu.
 * Ordem: pontos, saldo, gols feitos (no empate geral você fica na frente).
 */
export function groupTable(
    run: {
        seed: string;
        teamName: string;
        group?: { rivals: TeamSetup[] } | null;
        results: { stage: number; score: [number, number]; won: boolean; shootout: unknown }[];
    },
    color: number,
): GroupRow[] {
    const rivals = run.group?.rivals ?? [];
    const rows: GroupRow[] = [
        { name: run.teamName, color, you: true, played: 0, pts: 0, gf: 0, ga: 0 },
        ...rivals.map((r) => ({ name: r.name, color: r.color, played: 0, pts: 0, gf: 0, ga: 0 })),
    ];
    const add = (i: number, gf: number, ga: number, won: boolean, so: boolean) => {
        const r = rows[i];
        if (!r) return;
        r.played++;
        r.gf += gf;
        r.ga += ga;
        r.pts += groupPoints(won, so);
    };
    const others = groupOthers(run.seed);
    for (let md = 0; md < GROUP_GAMES; md++) {
        const mine = run.results.find((x) => x.stage === GROUP_START + md);
        if (!mine) continue;
        const so = !!mine.shootout;
        add(0, mine.score[0], mine.score[1], mine.won, so);
        add(md + 1, mine.score[1], mine.score[0], !mine.won, so);
        const o = others[md];
        add(o.a, o.score[0], o.score[1], o.winner === 0, o.shootout);
        add(o.b, o.score[1], o.score[0], o.winner === 1, o.shootout);
    }
    return [...rows].sort(
        (x, y) => y.pts - x.pts || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || (y.you ? 1 : 0) - (x.you ? 1 : 0),
    );
}

/**
 * Cartão da derrota que acabou de acontecer: amarelo (a 1ª no mapa, volta pro mapa) ou vermelho (a 2ª no mapa, fora).
 * Cair no grupo ou perder a Final não é cartão.
 */
export function foulOf(run: {
    mode?: CupMode;
    status: string;
    stage: number;
    results: { won: boolean }[];
}): 'yellow' | 'red' | null {
    if (!isLong(run) || run.results.at(-1)?.won !== false) return null;
    if (run.status === 'map') return 'yellow';
    return run.status === 'eliminated' && run.stage < GROUP_START ? 'red' : null;
}

/** Passou do grupo? (os 2 primeiros vão pra Final; só faz sentido com as 3 rodadas jogadas) */
export const groupQualified = (rows: GroupRow[]) => rows.findIndex((r) => r.you) < 2;
