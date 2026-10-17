import { type DuelTeamRecipe, type SpecialLimit, teamFromRecipe, teamRecipe } from '../engine/duel-validate';
import type { MatchOrder, TeamSetup } from '../engine/state';
import type { PlaybackSpeed } from '../store/game-store';
import { type DuelMode, type DuelResult, ordersOf, type Shared, type StampedOrder, specialLimitOf } from './duel-state';
import { baseSeedOf, segmentSeeds } from './seal';

/**
 * Registro do duelo (docs/planos/multiplayer-revisao.md): tudo que a partida precisa pra ser refeita, num objeto que
 * dá pra salvar e mandar. Serve pra reproduzir uma dessincronização no PC, pro replay e, no ranqueado, de entrada do
 * servidor (que ressimula e confere).
 */
export interface RegistroDuelo {
    v: 1;
    engineVersion: number;
    app: string;
    room: string;
    game: number;
    mode: DuelMode;
    speed: PlaybackSpeed;
    /** Time pronto: limite de cartas especiais da sala (null = livre). */
    specialLimit: SpecialLimit;
    /** Receitas dos dois times como entraram em campo (host, convidado) e os uids de cada um (as ordens usam). */
    teams: [DuelTeamRecipe, DuelTeamRecipe];
    uids: [string[], string[]];
    /** Draft: seeds das rodadas e as escolhas (uids) de cada um, conferíveis com elas. */
    roundSeeds?: string[];
    picks?: [string[], string[]];
    /** Lacres (x[0]) e o que cada um abriu: rodadas e trechos. */
    commits: [string, string];
    roundReveals: [(string | null)[], (string | null)[]];
    reveals: [(string | null)[], (string | null)[]];
    /** Topo da corrente de quem salvou (refaz todos os segredos dele) e de que lado ele estava. */
    secret?: { side: 0 | 1; top: string };
    /** Ordens separadas por autor (time 0, time 1), com o tick carimbado e o `seq` de quem deu. */
    orders: [StampedOrder[], StampedOrder[]];
    /** Hash curto do snapshot no começo de cada trecho, dos dois lados (checagem de dessincronização). */
    segHash: [Record<number, string>, Record<number, string>];
    result?: DuelResult;
}

const pair = <T>(f: (r: 'host' | 'guest') => T): [T, T] => [f('host'), f('guest')];

export function buildRegistro(s: Shared, engineVersion: number, app: string, secret?: RegistroDuelo['secret']) {
    const teams = pair((r) => s.teams[r] as TeamSetup);
    return {
        v: 1,
        engineVersion,
        app,
        room: s.room,
        game: s.game,
        mode: s.mode,
        speed: s.speed,
        specialLimit: specialLimitOf(s),
        teams: [teamRecipe(teams[0]), teamRecipe(teams[1])],
        uids: [teams[0], teams[1]].map((t) => [...t.lineup, ...t.bench].map((p) => p.uid)) as [string[], string[]],
        roundSeeds: s.draft?.seeds,
        picks: s.draft ? pair((r) => s.draft!.picks[r].map((p) => p.uid)) : undefined,
        commits: pair((r) => s.commits[r] ?? ''),
        roundReveals: pair((r) => s.roundReveals[r]),
        reveals: pair((r) => s.reveals[r]),
        secret,
        orders: [s.log.filter((o) => o.team === 0), s.log.filter((o) => o.team === 1)],
        segHash: pair((r) => s.segHash[r]),
        result: s.result,
    } satisfies RegistroDuelo;
}

/** As entradas da partida a partir do registro: times com os mesmos uids, seed e ordens na ordem do motor. */
export async function registroInputs(
    r: RegistroDuelo,
): Promise<{ home: TeamSetup; away: TeamSetup; seed: string; segmentSeeds: string[]; orders: MatchOrder[] }> {
    const withUids = (recipe: DuelTeamRecipe, uids: string[]): TeamSetup => {
        const t = teamFromRecipe(recipe, '');
        const all = [...t.lineup, ...t.bench].map((p, i) => ({ ...p, uid: uids[i] ?? p.uid }));
        const at = (i: number | undefined) => (i !== undefined && i >= 0 ? (uids[i] ?? null) : null);
        return {
            ...t,
            lineup: all.slice(0, 5),
            bench: all.slice(5),
            captainUid: at(recipe.captain),
            cornerTakerUid: at(recipe.cornerTaker),
        };
    };
    return {
        home: withUids(r.teams[0], r.uids[0]),
        away: withUids(r.teams[1], r.uids[1]),
        seed: baseSeedOf(r.room, r.game),
        segmentSeeds: await segmentSeeds(r.room, r.reveals[0], r.reveals[1]),
        orders: ordersOf([...r.orders[0], ...r.orders[1]]),
    };
}
