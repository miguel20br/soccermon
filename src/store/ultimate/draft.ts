import { bestFit, captainOptions, draftOptions } from '../../engine/draft';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import type { PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import type { TeamSetup } from '../../engine/state';
import { lineupAverage } from '../../ui/rating';
import { chemistry, chemTotal } from './chemistry';
import { periodKeys } from './objectives';
import {
    DRAFT_BENCH,
    DRAFT_FICHAS,
    DRAFT_GAMES,
    DRAFT_OPTIONS,
    DRAFT_PRIZES,
    LEVELS,
    type Level,
    STARTERS,
} from './rules';
import {
    cardOk,
    NO_MID_EVO,
    teamStrength,
    type UltimateLive,
    type UltimateMatch,
    type UltimateSave,
    ultimateRival,
} from './ultimate';

/**
 * Draft do Time Ultimate (o Draft do FC, números em `rules.ts`): paga a entrada, escolhe o capitão (1 de 5) e depois
 * uma vaga por vez, sempre 1 de 5 do pool inteiro do jogo (o sorteio da Copa, `draftOptions`), com a semente do save:
 * recarregar mostra as mesmas cartas. Pronto o time, 4 partidas contra a IA no fluxo das Batalhas (`UltimateLive` com
 * `draft`), do Fácil ao Mestre. Perdeu, acabou; o prêmio (pacotes) cai em Meus pacotes. O time nunca entra no Clube.
 */

export interface DraftGame {
    score: [number, number];
    shootout: [number, number] | null;
    rival: string;
    color: number;
    won: boolean;
}
export type DraftPrize = (typeof DRAFT_PRIZES)[number];
export interface DraftRun {
    /** Número da campanha (semeia as cartas e os rivais). */
    n: number;
    formation: FormationId;
    /** As 5 vagas da formação e as DRAFT_BENCH reservas; null = falta escolher. */
    team: (PokemonInstance | null)[];
    captainUid: string | null;
    games: DraftGame[];
    /** Pago no fim (perdeu ou venceu todas); null = em andamento. */
    prize: DraftPrize | null;
}
export interface UtDraft {
    /** Campanhas começadas (numera a próxima). */
    runs: number;
    /** Semana (segunda, Brasília) em que a entrada grátis já foi usada. */
    free: string;
    /** Mais vitórias numa campanha. */
    best: number;
    run: DraftRun | null;
}

export const newDraft = (): UtDraft => ({ runs: 0, free: '', best: 0, run: null });
export const DRAFT_SIZE = STARTERS + DRAFT_BENCH;
/** As partidas do Draft usam sementes longe das Batalhas (`ultimateSeed`). */
const SEED_BASE = 1_000_000;

/** Quanto custa entrar agora: a primeira da semana é grátis. */
export const draftCost = (u: Pick<UltimateSave, 'draft'>, now: number) =>
    u.draft.free === periodKeys(now).week ? DRAFT_FICHAS : 0;

/** Campanha em andamento (com prêmio pago, ela só espera o Fechar). */
export const draftActive = (u: Pick<UltimateSave, 'draft'>) => !!u.draft.run && !u.draft.run.prize;

/** Paga e começa uma campanha. null = já tem uma em andamento ou faltam Fichas. */
export function draftEnter(u: UltimateSave, formation: FormationId, now: number): UltimateSave | null {
    const cost = draftCost(u, now);
    if (draftActive(u) || u.fichas < cost || !(formation in FORMATIONS)) return null;
    return {
        ...u,
        fichas: u.fichas - cost,
        draft: {
            ...u.draft,
            runs: u.draft.runs + 1,
            free: cost ? u.draft.free : periodKeys(now).week,
            run: {
                n: u.draft.runs,
                formation,
                team: Array(DRAFT_SIZE).fill(null),
                captainUid: null,
                games: [],
                prize: null,
            },
        },
    };
}

/** A vaga da vez: -1 = o capitão; DRAFT_SIZE = time completo. */
export function draftSlot(run: DraftRun): number {
    if (!run.captainUid) return -1;
    const i = run.team.indexOf(null);
    return i < 0 ? DRAFT_SIZE : i;
}

/** A posição da vaga `i` (reserva = qualquer). */
export const draftRole = (run: DraftRun, i: number) =>
    i < STARTERS ? FORMATIONS[run.formation].slots[i] : ('ANY' as const);

/** As 5 cartas da vez (o capitão ou a vaga), sempre as mesmas pra mesma campanha e vaga. */
export function draftChoices(u: Pick<UltimateSave, 'salt' | 'draft'>): PokemonInstance[] {
    const run = u.draft.run;
    if (!run || run.prize) return [];
    const i = draftSlot(run);
    if (i >= DRAFT_SIZE) return [];
    const taken = new Set(run.team.flatMap((p) => (p ? [p.speciesId] : [])));
    const rng = new Rng(u.salt, `ut-draft-${run.n}-${i}`);
    const picks = taken.size;
    const cards =
        i < 0
            ? captainOptions(rng, taken, DRAFT_OPTIONS)
            : draftOptions(rng, Math.min(picks, 6), taken, DRAFT_OPTIONS, [], draftRole(run, i));
    return cards.map((c) => ({ ...c, uid: `utd${run.n}-${i}-${c.speciesId}`, shiny: false }));
}

/** Fica com a carta `uid` das 5 da vez: o capitão vai pra vaga da formação em que ele rende mais. */
export function draftPick(u: UltimateSave, uid: string): UltimateSave {
    const run = u.draft.run;
    const card = draftChoices(u).find((c) => c.uid === uid);
    if (!run || !card) return u;
    const team = [...run.team];
    const i = draftSlot(run);
    if (i < 0) team[bestFit([card], FORMATIONS[run.formation].slots).role] = card;
    else team[i] = card;
    return {
        ...u,
        draft: { ...u.draft, run: { ...run, team, captainUid: run.captainUid ?? card.uid } },
    };
}

/**
 * A pontuação do time durante a montagem: a média na vaga dos titulares escolhidos vezes a química (as sinergias do
 * UT, a mesma conta de `teamStrength`). Completo, dá a força do time na partida.
 */
export function draftScore(run: DraftRun): { avg: number; chem: number; dia: number; power: number } {
    const starters = run.team.slice(0, STARTERS);
    const roles = FORMATIONS[run.formation].slots;
    const filled = starters.flatMap((p, i) => (p ? [{ p, role: roles[i] }] : []));
    const bench = run.team.slice(STARTERS).flatMap((p) => p ?? []);
    const avg = lineupAverage(starters, run.formation);
    const ch = chemistry(
        filled.map((x) => x.p),
        filled.map((x) => x.role),
        [],
        bench,
    );
    return { avg, chem: ch.avg, dia: chemTotal(ch), power: avg * ch.avg };
}

/** O time da campanha pra partida (substituições só suas; ninguém evolui no meio, como nas Batalhas). */
export function draftHome(run: DraftRun, name: string, color: number): TeamSetup {
    const cards = (from: number, to: number) =>
        run.team.slice(from, to).flatMap((p) => (p ? [{ ...p, evo: NO_MID_EVO }] : []));
    return {
        name,
        lineup: cards(0, STARTERS),
        bench: cards(STARTERS, DRAFT_SIZE),
        tactic: 'balanced',
        color,
        formation: run.formation,
        captainUid: run.captainUid,
        manualSubs: true,
        corner: 'mixed',
        cornerTakerUid: null,
    };
}

/** O nível da partida `k` (0 a DRAFT_GAMES − 1): sobe a cada vitória, do Fácil ao Mestre. */
export const draftLevel = (k: number): Level => LEVELS[Math.min(k, LEVELS.length - 1)];

/** A próxima partida da campanha (os dois times prontos pro `ultimateStart`). null = time incompleto ou acabou. */
export function draftMatch(
    u: Pick<UltimateSave, 'salt' | 'draft'>,
    name: string,
    color: number,
): Omit<UltimateLive, 'orders' | 'tick' | 'engine'> | null {
    const run = u.draft.run;
    if (!run || run.prize || draftSlot(run) < DRAFT_SIZE || run.games.length >= DRAFT_GAMES) return null;
    const home = draftHome(run, name, color);
    const k = run.games.length;
    const n = SEED_BASE + run.n * DRAFT_GAMES + k;
    const level = draftLevel(k);
    return { n, level, home, rival: ultimateRival(u.salt, n, level, teamStrength(home)), draft: true };
}

/** Vitória: placar maior no tempo normal ou, empatado, nos pênaltis. */
export const draftWon = (m: UltimateMatch) =>
    m.score[0] > m.score[1] || (m.score[0] === m.score[1] && !!m.shootout && m.shootout[0] > m.shootout[1]);

/**
 * Apito final de uma partida do Draft (`finishMatch` desvia pra cá): guarda o jogo e, se perdeu ou venceu todas, paga
 * o prêmio em Meus pacotes. Não conta objetivos, passe, Evolução nem o placar das Batalhas: o time não é do Clube.
 */
export function draftFinish(u: UltimateSave, m: UltimateMatch): UltimateSave {
    const run = u.draft.run;
    if (!u.live || !run || run.prize) return { ...u, live: null };
    const won = draftWon(m);
    const games = [
        ...run.games,
        {
            score: [m.score[0], m.score[1]] as [number, number],
            shootout: m.shootout,
            rival: u.live.rival.name,
            color: u.live.rival.color,
            won,
        },
    ];
    const wins = games.filter((g) => g.won).length;
    const prize = !won || games.length >= DRAFT_GAMES ? DRAFT_PRIZES[wins] : null;
    return {
        ...u,
        live: null,
        fichas: u.fichas + (prize?.fichas ?? 0),
        extraPacks: u.extraPacks + (prize?.packs ?? 0),
        bigPacks: u.bigPacks + (prize?.big ?? 0),
        draft: { ...u.draft, best: Math.max(u.draft.best, wins), run: { ...run, games, prize } },
    };
}

/** Fecha a campanha que acabou (o prêmio já foi pago). */
export const draftClose = (u: UltimateSave): UltimateSave =>
    u.draft.run?.prize ? { ...u, draft: { ...u.draft, run: null } } : u;

// ------------------------------------------------------------------------------------------------ save

const num = (v: unknown, max = Number.MAX_SAFE_INTEGER) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const pair = (v: unknown): [number, number] | null =>
    Array.isArray(v) && v.length === 2 ? [num(v[0]), num(v[1])] : null;

function gameOf(g: unknown): DraftGame | null {
    if (!isObj(g)) return null;
    const score = pair(g.score);
    if (!score || typeof g.rival !== 'string') return null;
    return { score, shootout: pair(g.shootout), rival: g.rival, color: num(g.color), won: g.won === true };
}

function runOf(r: unknown): DraftRun | null {
    if (!isObj(r) || typeof r.formation !== 'string' || !(r.formation in FORMATIONS)) return null;
    if (!Array.isArray(r.team) || r.team.length !== DRAFT_SIZE) return null;
    const team = r.team.map((p) => (cardOk(p) ? p : null));
    const uids = team.flatMap((p) => (p ? [p.uid] : []));
    const captainUid = typeof r.captainUid === 'string' && uids.includes(r.captainUid) ? r.captainUid : null;
    // carta sem capitão (ou time estragado no meio) não tem como seguir: a campanha recomeça do zero
    if (!captainUid && uids.length) return null;
    const games = (Array.isArray(r.games) ? r.games.map(gameOf) : [])
        .filter((g): g is DraftGame => !!g)
        .slice(0, DRAFT_GAMES);
    const wins = games.filter((g) => g.won).length;
    const prize = isObj(r.prize) ? DRAFT_PRIZES[wins] : null;
    return {
        n: num(r.n),
        formation: r.formation as FormationId,
        team,
        captainUid,
        games,
        prize,
    };
}

/** O Draft como chega do save (sem o campo, de antes da 0.9.54, nasce vazio). */
export function draftOf(raw: unknown): UtDraft {
    if (!isObj(raw)) return newDraft();
    return {
        runs: num(raw.runs),
        free: typeof raw.free === 'string' ? raw.free : '',
        best: num(raw.best, DRAFT_GAMES),
        run: runOf(raw.run),
    };
}
