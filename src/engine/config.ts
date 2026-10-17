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
 * 1 = 0.8.4 (balanceamento geral). 2 = 0.8.5 (contas próprias: sin/cos/atan2/exp/log/pow do `dmath.ts`).
 */
export const ENGINE_VERSION = 2;

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

export function withConfig(overrides: Partial<MatchConfig>): MatchConfig {
    return { ...FUTSAL_5, ...overrides, pitch: { ...FUTSAL_5.pitch, ...overrides.pitch } };
}
