/**
 * Cut-in de dupla do combo de sinergia (docs/planos/pesquisas/sinergias-e-animacoes.md, item 1 das animações): o
 * retrato de quem passou entra numa faixa por cima do nome do combo e o de quem chutou numa faixa por baixo, de lados
 * opostos, e as duas se cruzam. Puro (sem Phaser): a cena e o teste leem daqui.
 */

/** Quanto o letreiro do combo (`Cinematics.drama`, sem `hold`) já fica na tela: o cut-in cabe dentro dele. */
export const COMBO_DRAMA_MS = 1250 + 330;

/** Altura da faixa de cada retrato (px do jogo, antes da escala da tela); o N3 usa 104. */
export const COMBO_BAND_H = 40;

export interface ComboCutIn {
    /** Duração de cada faixa (`superCutIn`). */
    ms: number;
    /** Quem passou entra do lado do próprio time; quem chutou, do outro (as faixas se cruzam). */
    passerFromRight: boolean;
    finisherFromRight: boolean;
}

/** `short`: Duelo ou velocidade alta (a versão curta, como o drible com nome). */
export function comboCutIn(team: 0 | 1, short: boolean): ComboCutIn {
    return { ms: short ? 700 : 1100, passerFromRight: team === 1, finisherFromRight: team === 0 };
}

/**
 * Onde ficam as duas faixas (centro, px da tela) em volta do letreiro (`box`: alto do nome e base da linha de baixo):
 * uma encostada em cima, a outra embaixo, com a faixa de cima dentro da tela. `half` = meia altura da faixa já na escala.
 */
export function comboBandsY(box: { top: number; bottom: number }, half: number) {
    const top = Math.max(half + 2, box.top - half + 4);
    return { top, bottom: Math.max(box.bottom + half - 2, top + 2 * half) };
}
