import { CUP_STAGES } from '../engine/cup';
import {
    buildCupMap,
    CHALLENGE_SHIFT,
    type CupMap,
    FINAL_MATCH,
    GROUP_GAMES,
    GROUP_START,
    isMatchKind,
    LEGENDARY_BIRD,
    LONG_MATCHES,
    longOpponent,
    type MapNode,
    matchIndexOfRow,
    nodeById,
} from '../engine/cup-map';
import { Rng } from '../engine/rng';
import { winEarnings } from '../engine/shop';
import type { TeamSetup } from '../engine/state';

/**
 * Copa longa (docs/planos/copa-longa.md): o que muda numa copa com `mode: 'longa'`. Sem `mode` é a Copa rápida de
 * sempre (e a Copa do Dia), e nada aqui mexe nela.
 */
export type CupMode = 'longa';

/** A Copa longa aparece na Home quando a 0.9.1 estiver pronta (até lá, só pelo `?demo=mapa`). */
export const LONG_CUP_LIVE = true;

/** O ₽ que uma vitória na Rota rende na hora (os juros só entram ao abrir um Mercado). Resultado e store usam esta conta. */
export const longWinEarnings = (score: readonly number[], sponsors: readonly string[] = []) =>
    winEarnings(score[0], score[1], 0, sponsors);

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
    /** Por que cada um de `out` está fora (sem = save de antes: só "Fora"). Sobra de quem já voltou não importa. */
    outWhy?: Record<string, OutWhy>;
    /** Evento da entrevista: o próximo rival entra mais fraco (−1) ou mais forte (+1). */
    rivalShift?: number;
    /** Eventos já vistos nesta copa (não repetem). */
    eventsSeen?: string[];
    /** Fase de grupos no Planalto: os 3 rivais do seu grupo, na ordem das rodadas. */
    group?: { rivals: TeamSetup[] } | null;
    /** O que a última escolha de evento fez (a nota no mapa até a próxima casa). */
    eventNote?: { id: string; choice: string; target?: string; cost: number } | null;
    /** Evento aberto (status 'event'). */
    event?: import('./long-events').LongEvent | null;
    /** Desafio de evento pra próxima partida do mapa (Pássaro lendário, Equipe Rocket): rival +2 com prêmio próprio. */
    challenge?: Challenge | null;
    /** O desafio da partida de agora (até voltar pro mapa): o prêmio da vitória sai dele. */
    fight?: Challenge | null;
    /** Aposta do Blue na próxima partida: vitória por 2+ gols ganha esse ₽; senão perde. */
    bet?: number | null;
    /** Ovo da Creche: nasce no banco depois de `left` partidas. */
    egg?: { left: number; speciesId: number } | null;
}

export type Challenge = 'lendario' | 'rocket';
/** ₽ a mais por vencer a Equipe Rocket do assalto. */
export const ROCKET_BOUNTY = 8;

/** Rival da casa de partida (a prévia do mapa e a partida usam esta conta: o mesmo time). */
export function nodeOpponent(
    run: { seed: string; opponents: readonly (TeamSetup | null | undefined)[] } & Pick<
        LongRunFields,
        'rivalShift' | 'challenge'
    >,
    node: MapNode,
): TeamSetup {
    const faced = run.opponents.flatMap((o) => (o ? [o.name] : []));
    const ch = node.kind === 'final' ? null : run.challenge;
    return longOpponent(run.seed, matchIndexOfRow(node.row), node.kind, faced, {
        shift: (run.rivalShift ?? 0) + (ch ? CHALLENGE_SHIFT : 0),
        types: node.types,
        ...(ch === 'rocket' && { club: 'Equipe Rocket' }),
        ...(ch === 'lendario' && { boss: LEGENDARY_BIRD }),
    });
}

/** O ₽ a mais desta partida da Rota: prêmio "₽ em dobro", recompensa da Equipe Rocket e a aposta do Blue. */
export interface MatchBonus {
    prize?: number;
    rocket?: number;
    bet?: number;
}
export function longMatchBonus(
    run: LongRunFields & { sponsors?: string[] },
    score: readonly number[],
    won: boolean,
): MatchBonus {
    const out: MatchBonus = {};
    const node = currentNode(run);
    if (won && node?.kind === 'jogo' && node.prize === 'money' && !run.fight)
        out.prize = longWinEarnings(score, run.sponsors).total;
    if (won && run.fight === 'rocket') out.rocket = ROCKET_BOUNTY;
    if (run.bet) out.bet = won && score[0] - score[1] >= 2 ? run.bet : -run.bet;
    return out;
}
export const bonusTotal = (b: MatchBonus | undefined) => (b?.prize ?? 0) + (b?.rocket ?? 0) + (b?.bet ?? 0);

/** "Nova copa" no fim de uma copa: o mesmo modo (Rota começa outra Rota; Relâmpago e Copa do Dia, a Relâmpago). */
export const nextCupMode = (run: { mode?: CupMode; daily?: string }): CupMode | undefined =>
    run.daily ? undefined : run.mode;

/** Está fora (machucado ou na Creche)? */
export const isOut = (run: LongRunFields, uid: string) => (run.out?.[uid] ?? 0) > 0;

/** Motivo de estar fora: carrinho no treino, Creche ou treino puxado. */
export type OutWhy = 'lesao' | 'creche' | 'cansado';
/** Selo de quem está fora: o motivo e quantas partidas faltam pra voltar (null = está disponível). */
export const outOf = (run: LongRunFields, uid: string): { why: OutWhy | 'fora'; n: number } | null =>
    isOut(run, uid) ? { why: run.outWhy?.[uid] ?? 'fora', n: run.out![uid] } : null;

/**
 * Troca na escalação que põe em quadra alguém que está fora? (quem está fora fica no banco; tirar ele da quadra pode)
 * `a` e `b` são as duas vagas da troca.
 */
export function putsOutOnCourt(
    run: LongRunFields & { lineup: string[]; bench: string[] },
    a: { zone: 'lineup' | 'bench'; index: number },
    b: { zone: 'lineup' | 'bench'; index: number },
): boolean {
    const uidAt = (r: typeof a) => (r.zone === 'lineup' ? run.lineup : run.bench)[r.index];
    // quem vai pra quadra: o da vaga do banco, se a outra é da quadra
    if (a.zone === b.zone) return false;
    const fromBench = a.zone === 'bench' ? a : b;
    const u = uidAt(fromBench);
    return !!u && isOut(run, u);
}
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

/**
 * A partida que a barra da copa e o "Continuar" mostram ("Partida 4 de 8"). Na Rota a próxima a jogar é sempre a conta
 * das jogadas (`played` = `results.length`; o mapa e o grupo contam assim) e `stage` é a última em que você entrou: ela
 * só vale enquanto é a de agora (escalação) e no resultado e na recompensa dela (`onResult`, ou a recompensa aberta numa
 * casa de partida ou no grupo). Na Relâmpago, a fase (`stage`).
 */
export function cupMatchNow(
    run: { mode?: CupMode; status: string; stage: number; played?: number } & Pick<
        LongRunFields,
        'at' | 'map' | 'group'
    >,
    onResult = false,
): number {
    if (!isLong(run)) return run.stage;
    const ofMatch = run.status === 'reward' && (!!run.group || isMatchKind(currentNode(run)?.kind ?? 'bau'));
    return onResult || ofMatch ? run.stage : Math.min(run.played ?? run.stage, LONG_MATCHES - 1);
}

/** A partida `stage` é da fase de grupos? */
export const isGroupStage = (stage: number) => stage >= GROUP_START && stage < FINAL_MATCH;
/**
 * Cor da derrota na barrinha da copa: vermelho = eliminou (na Rota, só o 2º amarelo); amarelo = a derrota que a
 * Rota perdoa no mapa; neutro = derrota no grupo (não dá cartão).
 */
export const lossColor = (
    run: { mode?: CupMode; status: string; results: readonly { stage: number }[] },
    stage: number,
): 'red' | 'yellow' | 'plain' =>
    !isLong(run) || (run.status === 'eliminated' && stage === run.results.at(-1)?.stage)
        ? 'red'
        : isGroupStage(stage)
          ? 'plain'
          : 'yellow';

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
