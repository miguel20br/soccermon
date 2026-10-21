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
 * Identidade de cada formação em quadra (docs/planos/formacoes.md): o time JOGA diferente, não só com outro número.
 * Quase tudo é comportamento da IA (ai-controller.ts): onde cada um fica, que passe procura, quem corre depois do
 * passe, quem gira de lugar. `attrs`/`role` (multiplicam no `eff`, como a tática) ficam só pra acertar o equilíbrio.
 */
export interface FormationStyle {
    attrs?: Partial<Record<AttrKey, number>>;
    role?: Partial<Record<Position, Partial<Record<AttrKey, number>>>>;
    /** Deslocamentos que somam no TACTIC_SHIFT (linha com e sem a bola, pivô plantado, chute, pressão). */
    attack?: number;
    defend?: number;
    pivotHold?: number;
    shootBias?: number;
    pressBias?: number;
    /** Abertura das vagas em relação ao meio (1 = o desenho; <1 por dentro, >1 pelos lados), com e sem a bola. */
    width?: number;
    defWidth?: number;
    /** Quanto o time anda junto com a bola no comprimento (0,35 = o padrão). */
    follow?: number;
    /** Distância ideal do apoio ao portador (m; padrão 9) e bônus do apoio aberto na lateral. */
    supportDist?: number;
    supportWide?: number;
    /** Peso do passe pra frente (1 = padrão) e preferência por passe longo (+) ou curto (−), por metro. */
    fwdPass?: number;
    passLen?: number;
    /** Somado ao passe que vai pro Pivô; `longPivot`: a mais quando sai do nosso campo (bola longa, vertical). */
    pivotPass?: number;
    longPivot?: number;
    /** Somado ao valor de qualquer passe (contra o drible). */
    passBias?: number;
    /** Passe e corre: quem passa dispara em diagonal pra área por estes segundos. */
    giveGo?: number;
    /** Rodízio: a cada N segundos com a bola, os 4 da linha giram uma vaga (losango → ala → frente → ala). */
    rotate?: number;
    /** Pivô parede: vem buscar a bola no nosso campo, segura de costas e devolve pra quem chega de trás. */
    wallPivot?: boolean;
    /** Ultrapassagem: com a bola num lado, o de trás daquele lado passa por fora; e o passe rasteiro pra trás na área. */
    overlap?: boolean;
    cutback?: number;
    /** Até quantos metros do gol a IA aceita chutar (padrão 17). */
    shootRange?: number;
    /** Multiplica a chance da bomba de longe do Fixo. */
    longShot?: number;
    /** Vantagem tática: contra estas, o time todo joga com `COUNTER_FACTOR` em tudo. */
    counters?: FormationId[];
}

/** Vantagem tática: quem encaixa a formação contra a do rival (leve, pedido do Miguel: 1,5%). */
export const COUNTER_FACTOR = 1.015;

export const FORMATION_STYLES: Record<FormationId, FormationStyle> = {
    // triângulos curtos pelo meio: alas por dentro, apoio perto, passe curto, toca mais do que conduz
    '1-2-1': {
        width: 0.85,
        supportDist: 6.5,
        passLen: -0.012,
        fwdPass: 0.8,
        passBias: 0.04,
        attrs: { passing: 1.03, positioning: 1.02 },
    },
    // pelos lados em duplas: bem aberto, ultrapassagem do fixo, passe rasteiro pra trás na área; pressão alta
    '2-2': {
        counters: ['1-1-2'],
        width: 1.35,
        supportWide: 0.3,
        overlap: true,
        cutback: 0.15,
        defend: 0.5,
        pressBias: 0.01,
        attrs: { passing: 0.95, shooting: 0.95, tackling: 0.97 },
    },
    // os 3 de trás tocam de lado até achar a bola longa no pivô, que segura de costas e devolve pra quem chega
    '3-1': {
        counters: ['2-2'],
        width: 1.25,
        pivotHold: 2,
        fwdPass: 0.9,
        pivotPass: 0.3,
        longPivot: 0.35,
        wallPivot: true,
        attrs: { passing: 1.03, shooting: 1.03 },
        role: { PIVO: { shooting: 1.1, strength: 1.1 } },
    },
    // os 4 giram de vaga o tempo todo; passe e corre em diagonal
    '4-0': {
        counters: ['ferrolho'],
        rotate: 1.5,
        giveGo: 1,
        supportDist: 7,
        passBias: 0.05,
        attrs: { passing: 1.05, pace: 1.04, positioning: 1.03 },
    },
    // jogo direto: bola pra frente nos dois pivôs, chute cedo e de mais longe
    '1-1-2': {
        counters: ['4-0'],
        attack: 1.5,
        fwdPass: 1.8,
        passLen: 0.015,
        pivotPass: 0.12,
        shootBias: -0.015,
        shootRange: 19,
        attrs: { tackling: 0.97 },
    },
    // bloco baixo e fechado; recuperou, bola longa no pivô ou bomba do fixo
    ferrolho: {
        counters: ['3-1'],
        defend: -3,
        defWidth: 0.7,
        follow: 0.15,
        pivotHold: 3,
        longPivot: 0.4,
        fwdPass: 1.3,
        longShot: 1.6,
        attrs: { tackling: 1.04, goalkeeping: 1.05 },
    },
};

export const formationStyle = (id: FormationId): FormationStyle => FORMATION_STYLES[id];

/** A formação `mine` leva vantagem tática contra `theirs`? */
export const hasEdge = (mine: FormationId, theirs: FormationId): boolean =>
    !!FORMATION_STYLES[mine].counters?.includes(theirs);
