import type { AttrKey, Position } from './attributes';

export type FormationId = '1-2-1' | '2-2' | '3-1' | '4-0' | '1-1-2' | 'ferrolho';
type Pt = [number, number];

/**
 * Formações do futsal. Coordenadas relativas ao time num campo de 40×20 (x = profundidade rumo ao ataque).
 * `ui` = posição da vaga no mini-campo vertical das telas (%; ataque para cima).
 * O slot 4 é sempre o Pivô (quem dá a saída de bola).
 */
export interface Formation {
    id: FormationId;
    name: string;
    description: string;
    slots: Position[];
    attack: Pt[];
    defend: Pt[];
    kickoff: Pt[];
    ui: Pt[];
}

export const FORMATIONS: Record<FormationId, Formation> = {
    '1-2-1': {
        id: '1-2-1',
        name: 'Losango (1-2-1)',
        description: 'Equilíbrio clássico: um fixo, dois alas abertos e um pivô de referência.',
        slots: ['GK', 'FIXO', 'ALA', 'ALA', 'PIVO'],
        attack: [
            [1.2, 10],
            [14, 10],
            [24, 4],
            [24, 16],
            [32, 10],
        ],
        defend: [
            [1, 10],
            [7, 10],
            [12, 5],
            [12, 15],
            [18, 10],
        ],
        kickoff: [
            [1, 10],
            [8, 10],
            [14, 5],
            [14, 15],
            [18.5, 10],
        ],
        ui: [
            [50, 88],
            [50, 63],
            [20, 38],
            [80, 38],
            [50, 13],
        ],
    },
    '2-2': {
        id: '2-2',
        name: 'Quadrado (2-2)',
        description: 'Dois fixos protegendo atrás, ala e pivô na frente. Sólido e direto.',
        slots: ['GK', 'FIXO', 'FIXO', 'ALA', 'PIVO'],
        attack: [
            [1.2, 10],
            [15, 6],
            [15, 14],
            [28, 5],
            [31, 13],
        ],
        defend: [
            [1, 10],
            [7, 6],
            [7, 14],
            [15, 6],
            [17, 14],
        ],
        kickoff: [
            [1, 10],
            [9, 6],
            [9, 14],
            [15, 5],
            [18.5, 10],
        ],
        ui: [
            [50, 87],
            [27, 62],
            [73, 62],
            [27, 22],
            [73, 15],
        ],
    },
    '3-1': {
        id: '3-1',
        name: 'Linha de 3 (3-1)',
        description: 'Fixo e alas formam uma linha recuada; o pivô segura a bola sozinho lá na frente.',
        slots: ['GK', 'ALA', 'FIXO', 'ALA', 'PIVO'],
        attack: [
            [1.2, 10],
            [23, 3.5],
            [15, 10],
            [23, 16.5],
            [33, 10],
        ],
        defend: [
            [1, 10],
            [10, 4],
            [6, 10],
            [10, 16],
            [17, 10],
        ],
        kickoff: [
            [1, 10],
            [12, 4],
            [8, 10],
            [12, 16],
            [18.5, 10],
        ],
        ui: [
            [50, 87],
            [16, 57],
            [50, 64],
            [84, 57],
            [50, 15],
        ],
    },
    '4-0': {
        id: '4-0',
        name: 'Rodízio (4-0)',
        description:
            'Sem pivô: quatro na linha trocando de lugar o tempo todo. Muita posse e passe, pouca referência na área.',
        slots: ['GK', 'FIXO', 'ALA', 'ALA', 'ALA'],
        attack: [
            [1.2, 10],
            [16, 10],
            [25, 3.5],
            [25, 16.5],
            [30, 10],
        ],
        defend: [
            [1, 10],
            [7, 10],
            [10, 4],
            [10, 16],
            [15, 10],
        ],
        kickoff: [
            [1, 10],
            [8, 10],
            [13, 4],
            [13, 16],
            [18.5, 10],
        ],
        ui: [
            [50, 88],
            [50, 66],
            [16, 42],
            [84, 42],
            [50, 30],
        ],
    },
    '1-1-2': {
        id: '1-1-2',
        name: 'Dois pivôs (1-1-2)',
        description: 'Ataque pesado: dois pivôs dentro da área rival, um ala de ligação e um fixo segurando atrás.',
        slots: ['GK', 'FIXO', 'ALA', 'PIVO', 'PIVO'],
        attack: [
            [1.2, 10],
            [14, 10],
            [22, 10],
            [27, 5],
            [29, 14],
        ],
        defend: [
            [1, 10],
            [7, 10],
            [11, 12],
            [9, 5],
            [13.5, 14],
        ],
        kickoff: [
            [1, 10],
            [8, 10],
            [13, 10],
            [18.5, 10],
            [16, 15],
        ],
        ui: [
            [50, 88],
            [50, 66],
            [50, 44],
            [28, 16],
            [72, 16],
        ],
    },
    ferrolho: {
        id: 'ferrolho',
        name: 'Ferrolho (3 fixos)',
        description: 'Retranca de três fixos na frente do goleiro e um pivô sozinho para o contra-ataque.',
        // o fixo central (vaga 1) é quem sobe para armar e chutar de longe; os dois de lado seguram a linha
        slots: ['GK', 'FIXO', 'FIXO', 'FIXO', 'PIVO'],
        attack: [
            [1.2, 10],
            [17, 10],
            [23, 3],
            [23, 17],
            [31, 10],
        ],
        defend: [
            [1, 10],
            [11, 10],
            [10, 5],
            [10, 15],
            [18, 10],
        ],
        kickoff: [
            [1, 10],
            [9, 10],
            [8, 4],
            [8, 16],
            [18.5, 10],
        ],
        ui: [
            [50, 88],
            [50, 62],
            [16, 68],
            [84, 68],
            [50, 15],
        ],
    },
};

export const DEFAULT_FORMATION: FormationId = '1-2-1';
export const formationOf = (id: FormationId | undefined): Formation => FORMATIONS[id ?? DEFAULT_FORMATION];

/**
 * PROTÓTIPO (docs/planos/formacoes.md), desligado: identidade de cada formação em quadra.
 * `attrs` multiplica o atributo de todo o time no `eff` (como a tática); `role` só o da posição.
 * O resto mexe na IA: deslocamento (como TACTIC_SHIFT), passe pro pivô, passe × drible e a bomba do Fixo.
 * Com `FORMATION_STYLE.on = false` (padrão) a partida é a de sempre; só o calibrate liga (`--estilos`).
 */
export interface FormationStyle {
    attrs?: Partial<Record<AttrKey, number>>;
    role?: Partial<Record<Position, Partial<Record<AttrKey, number>>>>;
    attack?: number;
    defend?: number;
    pivotHold?: number;
    shootBias?: number;
    pressBias?: number;
    /** Somado ao valor do passe que vai pro Pivô. */
    pivotPass?: number;
    /** Somado ao valor de qualquer passe (contra o drible). */
    passBias?: number;
    /** Multiplica a chance da bomba de longe do Fixo. */
    longShot?: number;
    /** Pedra-papel-tesoura: contra estas, o time todo joga com `COUNTER_FACTOR` em tudo. */
    counters?: FormationId[];
}

/** Vantagem de quem encaixa a formação certa contra a do rival (mostrada no VERSUS e na Escalação). */
export const COUNTER_FACTOR = 1.03;

export const FORMATION_STYLE = { on: false };

export const FORMATION_STYLES: Record<FormationId, FormationStyle> = {
    // o coringa: um tico melhor em tudo que é jogo coletivo, sem vantagem nem desvantagem de confronto
    '1-2-1': { attrs: { passing: 1.02, positioning: 1.02 } },
    // pressão e contra-ataque: rouba mais, sai rápido no pivô; passe curto pior (time parado)
    '2-2': {
        counters: ['1-1-2'],
        attrs: { tackling: 1.03, passing: 0.95 },
        pressBias: 0.015,
        pivotHold: 1,
        pivotPass: 0.05,
    },
    // bola no pivô: ele vira o artilheiro; time marca pior lá atrás (linha de 3 aberta)
    '3-1': {
        counters: ['2-2'],
        role: { PIVO: { shooting: 1.1, strength: 1.1 } },
        attrs: { positioning: 0.96 },
        pivotHold: 1,
        pivotPass: 0.2,
    },
    // rodízio: posse, passe e velocidade; ninguém de referência na área (chute e força menores)
    '4-0': {
        counters: ['ferrolho'],
        attrs: { passing: 1.08, pace: 1.06, dribble: 1.03, shooting: 0.97, strength: 0.95 },
        passBias: 0.04,
    },
    // blitz: todo mundo chuta, ninguém volta
    '1-1-2': {
        counters: ['4-0'],
        attrs: { shooting: 1.06, strength: 1.05, tackling: 0.94, positioning: 0.95 },
        attack: 1.5,
        shootBias: -0.01,
    },
    // retranca: fecha a área e sai no pivô; ataca pouco e de longe
    ferrolho: {
        counters: ['3-1'],
        attrs: { tackling: 1.07, positioning: 1.07, goalkeeping: 1.08, shooting: 0.93, passing: 0.96 },
        defend: -1.5,
        pivotHold: 2.5,
        pivotPass: 0.1,
        longShot: 1.5,
    },
};

const NO_STYLE: FormationStyle = {};
export const formationStyle = (id: FormationId): FormationStyle =>
    FORMATION_STYLE.on ? FORMATION_STYLES[id] : NO_STYLE;
