import { CUP_STAGES } from '../engine/cup';
import { buildCupMap, type CupMap, LONG_MATCHES, type MapNode, nodeById } from '../engine/cup-map';

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
    /** Evento aberto (status 'event'). */
    event?: import('./long-events').LongEvent | null;
}

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
