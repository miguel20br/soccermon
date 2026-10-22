/**
 * Histórico dos duelos amistosos: só no save de cada um (sem tabela no banco), do mais recente ao mais antigo.
 * "Ganhei do Fulano por 3x2" fica aqui e sobe pra nuvem junto com o resto do save. Nunca alimenta ranking, Hall da
 * Fama, raridade ou recordes públicos: o save é escrito pelo próprio jogador.
 */
export interface DuelRecord {
    /** Sala + nº da partida (revanche é outra partida). */
    id: string;
    date: number;
    mode: 'ready' | 'disputa' | 'pacotes';
    /** Nome do treinador e do clube do rival. */
    rival: string;
    rivalClub: string;
    /** Código de amigo do rival (sala de antes da 0.8.9 não manda). */
    rivalCode?: string;
    /** Placar do seu lado primeiro. */
    score: [number, number];
    shootout: [number, number] | null;
    /** 'void' = anulada (as duas telas se separaram). */
    result: 'win' | 'loss' | 'draw' | 'void';
    /** Vitória ou derrota por W.O. */
    wo?: boolean;
    /**
     * Registro do duelo (src/net/record.ts): tudo pra refazer a partida (dessincronização, replay). Só os mais
     * recentes guardam (cabe na nuvem).
     */
    registro?: unknown;
}

export const MAX_DUELS = 30;
/** Quantos duelos guardam o registro completo. */
export const KEEP_REGISTROS = 3;

const trim = (list: DuelRecord[]) =>
    list.slice(0, MAX_DUELS).map((d, i) => (i < KEEP_REGISTROS || !d.registro ? d : { ...d, registro: undefined }));

/** Duelo novo no topo (mesma partida não entra duas vezes). */
export const addDuel = (list: DuelRecord[], rec: DuelRecord): DuelRecord[] =>
    trim([rec, ...list.filter((d) => d.id !== rec.id)]);

/** Junta o histórico da nuvem com o do aparelho: união pela partida, mais recentes primeiro. */
export function mergeDuels(a: DuelRecord[] = [], b: DuelRecord[] = []): DuelRecord[] {
    const byId = new Map<string, DuelRecord>();
    for (const d of [...a, ...b]) if (d && typeof d.id === 'string' && !byId.has(d.id)) byId.set(d.id, d);
    return trim([...byId.values()].sort((x, y) => y.date - x.date));
}

/**
 * Retrospecto contra um amigo: pelo código de amigo; duelo de antes do código, pelo nome do treinador e do clube.
 * Partida anulada não conta.
 */
export function headToHead(duels: DuelRecord[], rival: { code: string; trainer: string; club: string }) {
    const n = { win: 0, draw: 0, loss: 0 };
    for (const d of duels) {
        const vs = d.rivalCode ? d.rivalCode === rival.code : d.rival === rival.trainer && d.rivalClub === rival.club;
        if (vs && d.result !== 'void') n[d.result]++;
    }
    return n;
}

/** Vitórias no Duelo: o contador (o histórico guarda só os 30 últimos) ou o histórico, o que for maior. */
export const duelWins = (records: { duelWins?: number }, duels: DuelRecord[]) =>
    Math.max(records.duelWins ?? 0, duels.filter((d) => d.result === 'win').length);
