/**
 * Histórico dos duelos amistosos: só no save de cada um (sem tabela no banco), do mais recente ao mais antigo.
 * "Ganhei do Fulano por 3x2" fica aqui e sobe pra nuvem junto com o resto do save.
 */
export interface DuelRecord {
    /** Sala + nº da partida (revanche é outra partida). */
    id: string;
    date: number;
    mode: 'ready' | 'disputa' | 'pacotes';
    /** Nome do treinador e do clube do rival. */
    rival: string;
    rivalClub: string;
    /** Placar do seu lado primeiro. */
    score: [number, number];
    shootout: [number, number] | null;
    result: 'win' | 'loss' | 'draw';
    /** Vitória ou derrota por W.O. */
    wo?: boolean;
}

export const MAX_DUELS = 30;

/** Duelo novo no topo (mesma partida não entra duas vezes). */
export const addDuel = (list: DuelRecord[], rec: DuelRecord): DuelRecord[] =>
    [rec, ...list.filter((d) => d.id !== rec.id)].slice(0, MAX_DUELS);

/** Junta o histórico da nuvem com o do aparelho: união pela partida, mais recentes primeiro. */
export function mergeDuels(a: DuelRecord[] = [], b: DuelRecord[] = []): DuelRecord[] {
    const byId = new Map<string, DuelRecord>();
    for (const d of [...a, ...b]) if (d && typeof d.id === 'string' && !byId.has(d.id)) byId.set(d.id, d);
    return [...byId.values()].sort((x, y) => y.date - x.date).slice(0, MAX_DUELS);
}
