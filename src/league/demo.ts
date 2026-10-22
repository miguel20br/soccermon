import { useCloud } from '../cloud/cloud';
import { buildCupOpponents } from '../engine/cup';
import { type DuelTeamRecipe, teamRecipe } from '../engine/duel-validate';
import { simulateLiga } from '../engine/league';
import { dailyDay, putDaily } from '../store/daily';
import { useGame } from '../store/game-store';
import { type DailyRow, type LeagueServer, type LigaOpen, type LigaRow, type LigaStatus, setLeagueServer } from './api';
import { eloAfter } from './rules';

/**
 * Servidor de mentira pro `?demo=dia` e `?demo=liga` (só no dev): dá pra ver as telas do ranking, da Liga e jogar
 * uma partida contra um fantasma sem Supabase. A partida da Liga roda o mesmo `simulateLiga` da Edge Function.
 * `&estado=feito` (dia): a Copa do Dia de hoje já jogada, com 3 vitórias.
 */
const row = (pos: number, trainer: string, club: string, color: string, extra: Partial<DailyRow>): DailyRow => ({
    pos,
    trainer,
    club,
    club_tag: club.slice(0, 3).toUpperCase(),
    club_color: color,
    wins: 4,
    champion: false,
    gf: 12,
    ga: 4,
    done: true,
    me: false,
    squad: [pos * 3, 25, 6 + pos, 94, 130],
    captain: pos % 5,
    ...extra,
});

const DAILY_ROWS: DailyRow[] = [
    row(1, 'Davi', 'Viridian Verde', 'verde', { champion: true, gf: 15, ga: 3 }),
    row(2, 'Ana Clara', 'Lavender Assombro', 'roxo', { champion: true, gf: 11, ga: 5 }),
    row(3, 'Miguel', 'Pallet FC', 'vermelho', { wins: 3, gf: 10, ga: 6, me: true }),
    row(4, 'Treinador', 'Cinnabar Chama Eterna Futebol', 'laranja', { wins: 2, gf: 7, ga: 7 }),
    row(5, 'Bia', 'Cerulean', 'azul', { wins: 1, gf: 3, ga: 2, done: false, squad: null, captain: null }),
];

const LIGA_ROWS: LigaRow[] = [
    {
        pos: 1,
        trainer: 'Davi',
        club: 'Viridian Verde',
        club_tag: 'VIR',
        club_color: 'verde',
        elo: 1432,
        games: 31,
        wins: 24,
        losses: 7,
        me: false,
    },
    {
        pos: 2,
        trainer: 'Ana Clara',
        club: 'Lavender',
        club_tag: 'LAV',
        club_color: 'roxo',
        elo: 1288,
        games: 18,
        wins: 12,
        losses: 6,
        me: false,
    },
    {
        pos: 3,
        trainer: 'Miguel',
        club: 'Pallet FC',
        club_tag: 'PAL',
        club_color: 'vermelho',
        elo: 1080,
        games: 6,
        wins: 4,
        losses: 2,
        me: true,
    },
    {
        pos: 4,
        trainer: 'Bia',
        club: 'Cerulean',
        club_tag: 'CER',
        club_color: 'azul',
        elo: 968,
        games: 9,
        wins: 3,
        losses: 6,
        me: false,
    },
];

export function startLeagueDemo(kind: 'dia' | 'liga', state: string | null) {
    const ghost = teamRecipe(buildCupOpponents('demo-liga')[3]);
    let mine: DuelTeamRecipe = teamRecipe(buildCupOpponents('demo-liga')[2]);
    mine = { ...mine, name: 'Pallet FC', color: 0xe8423f };
    let elo = 1080;
    let games = 6;
    let open: LigaOpen | null = null;
    const server: LeagueServer = {
        dailyBegin: async () => ({ day: dailyDay() }),
        dailyReport: async () => true,
        dailyRanking: async (_day, friends) =>
            friends
                ? DAILY_ROWS.filter((r) => r.me || ['Davi', 'Ana Clara'].includes(r.trainer)).map((r, i) => ({
                      ...r,
                      pos: i + 1,
                  }))
                : DAILY_ROWS,
        ligaStatus: async (day): Promise<LigaStatus> => ({
            season: day.slice(0, 7),
            elo,
            peak: elo,
            games,
            wins: 4,
            losses: games - 4,
            team: { team: mine, ovr: 71, updated_at: new Date().toISOString() },
        }),
        ligaRanking: async () => LIGA_ROWS.map((r) => (r.me ? { ...r, elo, games } : r)),
        liga: async <T>(action: string, body: Record<string, unknown>) => {
            if (action === 'inscrever') {
                mine = body.team as DuelTeamRecipe;
                return { ok: true, ovr: 72 } as T;
            }
            if (action === 'proxima') {
                open ??= {
                    id: 'demo-1',
                    seed: null,
                    started: false,
                    season: dailyDay().slice(0, 7),
                    myTeam: mine,
                    ghostTeam: { ...ghost, name: 'Viridian Verde', color: 0x2fa84f },
                    ghost: { trainer: 'Davi', club: 'Viridian Verde', tag: 'VIR', color: 'verde', ovr: 74 },
                    ghostElo: 1104,
                    eloBefore: elo,
                    engine: 0,
                };
                return open as T;
            }
            if (action === 'jogar' && open) {
                open = { ...open, seed: 'demo-seed-0001', started: true, myTeam: mine };
                return open as T;
            }
            if (action === 'resultado' && open) {
                const r = simulateLiga(open.myTeam, open.ghostTeam, open.seed!, (body.orders ?? []) as never);
                const won = r.winner === 0;
                const before = elo;
                elo = eloAfter(elo, open.ghostElo, won, games);
                games++;
                open = null;
                return { score: r.score, shootout: r.shootout, won, eloBefore: before, eloAfter: elo, games } as T;
            }
            return { error: 'falhou' };
        },
    };
    setLeagueServer(server);
    useCloud.setState({ user: { name: 'Miguel', avatar: null }, status: 'saved' });
    if (kind === 'dia' && state === 'feito') {
        useGame.setState({
            daily: putDaily(useGame.getState().daily, {
                day: dailyDay(),
                results: [
                    { score: [3, 1], shootout: null, won: true, opponent: 'Pewter Rochedo' },
                    { score: [2, 2], shootout: [4, 3], won: true, opponent: 'Cerulean Cascata' },
                    { score: [4, 0], shootout: null, won: true, opponent: 'Vermilion Voltagem' },
                    { score: [1, 2], shootout: null, won: false, opponent: 'Saffron Psíquico' },
                ],
                done: true,
                champion: false,
                ranked: true,
                reported: 4,
            }),
        });
    }
    useGame.getState().go(kind === 'dia' ? 'daily' : 'liga');
}
