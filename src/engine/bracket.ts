import { CLUBS } from './cup';
import { ROUTE_TEAMS } from './cup-map';
import { Rng } from './rng';

/**
 * Chave da Copa Relâmpago (docs/planos/campeonato.md): 16 clubes no mata-mata, você entre eles. Os seus 4 rivais são
 * os da copa (`buildCupOpponents`) e ficam nos lugares em que você cruzaria com eles; os outros 11 são clubes de
 * ginásio e times de treinador sorteados pela seed. Os jogos dos outros saem com placar (só a sua partida usa o motor),
 * e quem você enfrenta na fase seguinte sempre ganhou o jogo dele.
 */
export interface BracketTeam {
    name: string;
    color: number;
    you?: boolean;
}
export interface BracketMatch {
    a: BracketTeam;
    b: BracketTeam;
    /** Placar (a, b); sem placar = ainda não jogado (o seu jogo antes de acontecer). */
    score?: [number, number];
    /** 0 = `a` passou, 1 = `b` passou. */
    winner?: 0 | 1;
}

export interface CupResultLite {
    score: [number, number];
    won: boolean;
}

const pool = () => [
    ...CLUBS.map((c) => ({ name: c.name, color: c.color })),
    ...ROUTE_TEAMS.map((t) => ({ name: t.name, color: t.color })),
];

/** Placar plausível de futsal pra quem `w` (0/1) ganhou. */
function scoreFor(rng: Rng, w: 0 | 1): [number, number] {
    const win = rng.int(2, 6);
    const lose = rng.int(0, win - 1);
    return w === 0 ? [win, lose] : [lose, win];
}

export function relampagoBracket(
    seed: string,
    you: BracketTeam,
    opponents: readonly { name: string; color: number }[],
    results: readonly CupResultLite[],
): BracketMatch[][] {
    const rng = new Rng(seed, 'bracket');
    const opp = opponents.slice(0, 4).map((o) => ({ name: o.name, color: o.color }));
    const others = rng.shuffle(pool().filter((t) => !opp.some((o) => o.name === t.name))).slice(0, 11);
    // oitavas: você × rival 1 na chave 0; rival 2 na 1 (quartas com você), rival 3 na 2 (semi), a Liga na 4 (final)
    const seats: BracketTeam[] = [
        { ...you, you: true },
        opp[0],
        opp[1],
        others[0],
        opp[2],
        others[1],
        others[2],
        others[3],
    ];
    seats.push(opp[3], ...others.slice(4, 11));
    // quem tem que passar em cada chave pra cruzar com você (índice do time em `seats`)
    const must = new Set([opp[1]?.name, opp[2]?.name, opp[3]?.name]);
    const rounds: BracketMatch[][] = [];
    let alive = seats;
    for (let round = 0; round < 4; round++) {
        const games: BracketMatch[] = [];
        const next: BracketTeam[] = [];
        for (let i = 0; i < alive.length; i += 2) {
            const a = alive[i];
            const b = alive[i + 1];
            let match: BracketMatch;
            if (a.you || b.you) {
                const r = results[round];
                // o seu jogo: o placar de verdade (você é sempre o `a`)
                match = r ? { a, b, score: r.score, winner: r.won ? 0 : 1 } : { a, b };
            } else {
                const w: 0 | 1 = must.has(a.name) ? 0 : must.has(b.name) ? 1 : rng.chance(0.5) ? 0 : 1;
                match = { a, b, score: scoreFor(rng, w), winner: w };
            }
            games.push(match);
            next.push(match.winner === undefined ? (a.you ? a : b) : match.winner === 0 ? a : b);
        }
        rounds.push(games);
        alive = next;
    }
    return rounds;
}
