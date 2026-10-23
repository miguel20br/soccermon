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
    /** Acréscimos de cada tempo, em minutos do relógio exibido (sorteados no `rng` da partida); sem = não tem. */
    stoppage?: { min: number; max: number };
    /**
     * Efeito do tipo do capitão no golpe máximo N3 (fase 1 de docs/planos/golpe-maximo-por-tipo.md), atrás de `?tipo=1`
     * até o Miguel jogar (ADR 0005). Sem = o N3 de força pura.
     */
    maxType?: boolean;
}

/**
 * Acréscimos (docs/planos/pressao-final.md): no fim de cada tempo, 1 a 3 minutos a mais do relógio exibido, sorteados
 * na hora em que o tempo normal acaba. O relógio fica parado no 20' (ou 40') e o placar mostra "+N'".
 */
export const STOPPAGE = { min: 1, max: 3 };

/**
 * Versão do motor: sobe a cada mudança que altera partidas já jogadas (mesma seed + mesmas ordens dando outro
 * jogo). Partida salva no meio com outra versão recomeça do 0 a 0, em vez de virar outro jogo ao retomar.
 * 1 = 0.8.4 (balanceamento geral). 2 = 0.8.5 (contas próprias: sin/cos/atan2/exp/log/pow do `dmath.ts`; escanteio).
 * 3 = 0.8.6 (carta que evolui ganha +2 por evolução; Duelo com o mesmo limiar de evolução nos dois lados; espalmada
 *     pra escanteio sai de lado; prancheta no meio da partida: ordem `lineup` na próxima bola parada).
 * 4 = 0.8.8 (fórmula A: Ala conta chute e Pivô conta velocidade; Dragonite segue Pivô; Eevee no duelo evolui
 *     pra forma da carta).
 * 5 = 0.8.8 (barra cheia de antes só evolui depois de ele fazer algo na partida: nada de evoluir no apito inicial).
 * 6 = 0.8.8 (edições em camadas: shiny +1 junto de outra edição, Evento leva MVP, MVP +1 por nível; sem teto além do 99 do atributo).
 * 7 = acréscimos de 1 a 3 minutos por tempo e Pressão final (quem perde nos últimos 3 minutos vai pra cima).
 * 8 = revisão dos golpes: 1 golpe de cada tipo próprio, sem 2 golpes iguais, Gengar com Sludge, Harden/Slam/Amnesia/
 *     Tri Attack/Explosion/paredes consertados e o Fly levando a bola 2 m (docs/planos/golpes-revisao.md).
 * 9 = formações que jogam diferente (IA: triângulos, lados, pivô parede, rodízio, jogo direto, bloco baixo) e
 *     vantagem tática de 1,5% (docs/planos/formacoes.md).
 * 10 = beira da quadra 2 (docs/planos/beira-da-quadra-2.md): troca e prancheta volantes (na hora), golpe máximo na hora
 *     certa e defesa máxima, sem gritos, goleiro-linha balanceado; golpe treinado (MT: +1 uso, x1,3
 *     de força, IA prioriza) e Mega Drain/BubbleBeam/Fissure mais fortes.
 * 11 = golpe máximo em 3 níveis com a nota do toque na batida (docs/planos/golpe-maximo-niveis.md).
 * 12 = chute N3 mira mais pro meio do gol (`AGENCY.maxAim`) e, com `maxType`, o efeito do tipo do capitão no N3
 *     (docs/planos/golpe-maximo-por-tipo.md).
 */
export const ENGINE_VERSION = 12;

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
    stoppage: STOPPAGE,
};

/**
 * Trecho da seed do duelo: 2 minutos do relógio exibido (no futsal 5: 18 s de jogo = 360 ticks). O relógio para
 * fora da fase `play`, então o trecho k vai do minuto 2k ao 2k+2 (o 1º tempo tem os trechos 0–9, o 2º os 10–19 e
 * os pênaltis são o 20). A tela acha o trecho pelo snapshot: `floor(minute / 2)`. Nos acréscimos o relógio fica no
 * 20' (40'), então os do 1º tempo caem no trecho 10 e os do 2º no 20, junto dos pênaltis.
 */
export const SEGMENT_MINUTES = 2;
export const segmentTicks = (cfg: MatchConfig) =>
    Math.round(((SEGMENT_MINUTES * cfg.halfSeconds) / cfg.displayHalfMinutes) * cfg.tickRate);

export function withConfig(overrides: Partial<MatchConfig>): MatchConfig {
    return { ...FUTSAL_5, ...overrides, pitch: { ...FUTSAL_5.pitch, ...overrides.pitch } };
}
