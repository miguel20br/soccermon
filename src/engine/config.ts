/**
 * Configuração paramétrica da partida. Futsal 5v5 é só um preset — 7v7/11v11 entram como novos presets.
 * Unidades: metros e segundos. O tempo simulado é comprimido: cada tempo dura `halfSeconds` de simulação,
 * exibido no relógio como `displayHalfMinutes`.
 */
export interface MatchConfig {
    preset: string;
    teamSize: number;
    benchSize: number;
    pitch: {
        length: number; // eixo x (gol da casa em x=0, gol visitante em x=length)
        width: number; // eixo y
        goalWidth: number;
        penaltyAreaDepth: number; // área do goleiro
        penaltyAreaWidth: number;
    };
    halfSeconds: number;
    displayHalfMinutes: number;
    tickRate: number; // ticks por segundo de simulação (fixo e determinístico)
    snapshotEvery: number; // grava um snapshot a cada N ticks (o render interpola)
    knockout: boolean; // empate vai para os pênaltis
    penaltyKicks: number;
    halftimeRecovery: number; // fôlego recuperado no intervalo
}

/**
 * Versão do motor: sobe a cada mudança que altera partidas já jogadas (mesma seed + mesmas ordens dando outro
 * jogo). Partida salva no meio com outra versão recomeça do 0 a 0, em vez de virar outro jogo ao retomar.
 * 1 = 0.8.4 (balanceamento geral). 2 = 0.8.5 (contas próprias: sin/cos/atan2/exp/log/pow do `dmath.ts`; escanteio).
 * 3 = 0.8.6 (carta que evolui ganha +2 por evolução; Duelo com o mesmo limiar de evolução nos dois lados; espalmada
 *     pra escanteio sai de lado; prancheta no meio da partida: ordem `lineup` na próxima bola parada).
 */
export const ENGINE_VERSION = 3;

export const FUTSAL_5: MatchConfig = {
    preset: 'futsal5',
    teamSize: 5,
    benchSize: 2,
    pitch: { length: 40, width: 20, goalWidth: 3, penaltyAreaDepth: 6, penaltyAreaWidth: 12 },
    halfSeconds: 180,
    displayHalfMinutes: 20,
    tickRate: 20,
    snapshotEvery: 2,
    knockout: true,
    penaltyKicks: 5,
    halftimeRecovery: 0.3,
};

/**
 * Trecho da seed do duelo: 2 minutos do relógio exibido (no futsal 5: 18 s de jogo = 360 ticks). O relógio para
 * fora da fase `play`, então o trecho k vai do minuto 2k ao 2k+2 (o 1º tempo tem os trechos 0–9, o 2º os 10–19 e
 * os pênaltis são o 20). A tela acha o trecho pelo snapshot: `floor(minute / 2)`.
 */
export const SEGMENT_MINUTES = 2;
export const segmentTicks = (cfg: MatchConfig) =>
    Math.round(((SEGMENT_MINUTES * cfg.halfSeconds) / cfg.displayHalfMinutes) * cfg.tickRate);

/** Trocas de tática por time na partida (validado no motor: a 4ª é ignorada). */
export const MAX_TACTIC_CHANGES = 3;

export function withConfig(overrides: Partial<MatchConfig>): MatchConfig {
    return { ...FUTSAL_5, ...overrides, pitch: { ...FUTSAL_5.pitch, ...overrides.pitch } };
}
