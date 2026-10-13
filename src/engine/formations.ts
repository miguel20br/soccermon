import type { Position } from './attributes';

export type FormationId = '1-2-1' | '2-2' | '3-1';
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
            [8, 4],
            [6, 10],
            [8, 16],
            [16, 10],
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
};

export const DEFAULT_FORMATION: FormationId = '1-2-1';
export const formationOf = (id: FormationId | undefined): Formation => FORMATIONS[id ?? DEFAULT_FORMATION];
