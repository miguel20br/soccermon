import { ENGINE_VERSION } from '../../engine/config';
import { CLUBS } from '../../engine/cup';
import { SPECIES } from '../../engine/data';
import { aiDraftTeam } from '../../engine/draft';
import { DEFAULT_FORMATION, FORMATIONS, type FormationId } from '../../engine/formations';
import { createInstance, DEFAULT_LEVEL, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { editionOf, ICONS } from '../../engine/specials';
import type { CornerPlan, MatchOrder, Tactic, TeamSetup } from '../../engine/state';
import { type Metal, metalOf } from '../../ui/rarity';
import { lineupAverage } from '../../ui/rating';
import {
    FICHAS,
    FLOOR_METAL,
    ICON_ODDS,
    LEVEL_GAP,
    LEVELS,
    type Level,
    METAL_ODDS,
    type Outcome,
    PACK_INTERVAL_MS,
    PACK_MAX,
    PACK_SIZE,
    REPEAT_POINTS,
    SHINY_ODDS,
    STARTERS,
    TEAM_SIZE,
} from './rules';

/**
 * Time Ultimate (docs/planos/ultimate-team.md, 0.9.31): a fatia do save e as regras puras (pacote, relógio de 12 h,
 * Fichas, rival). O store só chama estas funções; os números ficam em `rules.ts`. A partida é a do motor, sem mudar
 * nada (`ENGINE_VERSION` igual).
 */

export interface UltimateTeam {
    formation: FormationId;
    /** uids da coleção: os 5 primeiros são os titulares (na ordem das vagas), os 2 seguintes o banco. */
    order: string[];
    tactic: Tactic;
    captainUid: string | null;
    corner: CornerPlan;
    cornerTakerUid: string | null;
}

/** Partida em andamento: os dois times prontos, pra recarregar e voltar na mesma partida (mesma seed e ordens). */
export interface UltimateLive {
    n: number;
    level: Level;
    home: TeamSetup;
    rival: TeamSetup;
    orders: MatchOrder[];
    tick: number;
    /** `ENGINE_VERSION` de quando começou: motor novo no meio, a partida recomeça do 0 a 0. */
    engine: number;
}

/** A última partida, pro painel do prêmio (some no "Continuar"). */
export interface UltimateLast {
    score: [number, number];
    shootout: [number, number] | null;
    outcome: Outcome;
    level: Level;
    fichas: number;
    rival: string;
    seen: boolean;
}

export interface UltimateSave {
    /** 0 = a prévia antes da Temporada 1 (o reset vem na 0.9.33). */
    season: number;
    /** Semente dos pacotes e dos rivais deste save. */
    salt: string;
    /** A coleção da temporada. */
    cards: PokemonInstance[];
    fichas: number;
    /** Pontos de pacote (repetidas). Comprar carta com eles fica pra 0.9.32. */
    packPoints: number;
    /** Pacotes grátis guardados (0..PACK_MAX). */
    packs: number;
    /** De quando conta o relógio do próximo pacote (ms). Cheio, não conta. */
    packAt: number;
    /** Pacotes abertos (também numera a semente do próximo). */
    opened: number;
    team: UltimateTeam;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    live: UltimateLive | null;
    last: UltimateLast | null;
}

export const newUltimate = (salt = Math.floor(Math.random() * 1e9).toString(36), now = Date.now()): UltimateSave => ({
    season: 0,
    salt,
    cards: [],
    fichas: 0,
    packPoints: 0,
    packs: PACK_MAX,
    packAt: now,
    opened: 0,
    team: {
        formation: DEFAULT_FORMATION,
        order: [],
        tactic: 'balanced',
        captainUid: null,
        corner: 'mixed',
        cornerTakerUid: null,
    },
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    live: null,
    last: null,
});

const num = (v: unknown, max = Number.MAX_SAFE_INTEGER) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const cardOk = (c: unknown): c is PokemonInstance =>
    isObj(c) &&
    typeof c.uid === 'string' &&
    typeof c.speciesId === 'number' &&
    SPECIES.some((s) => s.id === c.speciesId) &&
    Array.isArray(c.moves);
const teamSetupOk = (t: unknown): t is TeamSetup =>
    isObj(t) && Array.isArray(t.lineup) && t.lineup.every(cardOk) && Array.isArray(t.bench);

/**
 * A fatia como ela chega do save (antigo, da nuvem, de um backup): sem a fatia nasce uma nova; campo estragado volta
 * pro padrão sem derrubar o resto.
 */
export function ultimateOf(raw: unknown): UltimateSave {
    if (!isObj(raw)) return newUltimate();
    const base = newUltimate(typeof raw.salt === 'string' && raw.salt ? raw.salt : undefined);
    const cards = Array.isArray(raw.cards) ? raw.cards.filter(cardOk) : [];
    const uids = new Set(cards.map((c) => c.uid));
    const t = isObj(raw.team) ? raw.team : {};
    const order = Array.isArray(t.order)
        ? [...new Set(t.order.filter((u): u is string => typeof u === 'string' && uids.has(u)))].slice(0, TEAM_SIZE)
        : [];
    const live = isObj(raw.live) ? raw.live : null;
    const last = isObj(raw.last) ? raw.last : null;
    return {
        ...base,
        season: num(raw.season),
        cards,
        fichas: num(raw.fichas),
        packPoints: num(raw.packPoints),
        packs: typeof raw.packs === 'number' ? num(raw.packs, PACK_MAX) : base.packs,
        packAt: typeof raw.packAt === 'number' && Number.isFinite(raw.packAt) ? raw.packAt : base.packAt,
        opened: num(raw.opened),
        team: {
            formation:
                typeof t.formation === 'string' && t.formation in FORMATIONS
                    ? (t.formation as FormationId)
                    : DEFAULT_FORMATION,
            order,
            tactic: (['balanced', 'offensive', 'defensive', 'counter'] as const).includes(t.tactic as Tactic)
                ? (t.tactic as Tactic)
                : 'balanced',
            captainUid: typeof t.captainUid === 'string' && order.includes(t.captainUid) ? t.captainUid : null,
            corner: (['area', 'short', 'mixed'] as const).includes(t.corner as CornerPlan)
                ? (t.corner as CornerPlan)
                : 'mixed',
            cornerTakerUid:
                typeof t.cornerTakerUid === 'string' && order.includes(t.cornerTakerUid) ? t.cornerTakerUid : null,
        },
        played: num(raw.played),
        wins: num(raw.wins),
        draws: num(raw.draws),
        losses: num(raw.losses),
        live:
            live &&
            live.engine === ENGINE_VERSION &&
            teamSetupOk(live.home) &&
            teamSetupOk(live.rival) &&
            LEVELS.includes(live.level as Level)
                ? {
                      n: num(live.n),
                      level: live.level as Level,
                      home: live.home,
                      rival: live.rival,
                      orders: Array.isArray(live.orders) ? (live.orders as MatchOrder[]) : [],
                      tick: num(live.tick),
                      engine: ENGINE_VERSION,
                  }
                : null,
        last:
            last && Array.isArray(last.score) && LEVELS.includes(last.level as Level)
                ? (last as unknown as UltimateLast)
                : null,
    };
}

/** Nuvem x aparelho: fica o lado que andou mais (pacotes abertos + partidas); empate, o lado que vale (`keep`). */
export function mergeUltimate(keep: unknown, other: unknown): UltimateSave {
    const k = ultimateOf(keep);
    const o = ultimateOf(other);
    return o.opened + o.played > k.opened + k.played ? o : k;
}

// ------------------------------------------------------------------------------------------- relógio dos pacotes

/**
 * Pacotes grátis até `now`: um a cada PACK_INTERVAL_MS, até PACK_MAX. Cheio, o relógio fica parado (recomeça quando
 * abrir um). Relógio do aparelho que voltou no tempo não tira pacote: só reinicia a contagem.
 */
export function refill(u: Pick<UltimateSave, 'packs' | 'packAt'>, now: number): { packs: number; packAt: number } {
    if (u.packs >= PACK_MAX || now < u.packAt) return { packs: Math.min(u.packs, PACK_MAX), packAt: now };
    const n = Math.floor((now - u.packAt) / PACK_INTERVAL_MS);
    const packs = Math.min(PACK_MAX, u.packs + n);
    return { packs, packAt: packs >= PACK_MAX ? now : u.packAt + n * PACK_INTERVAL_MS };
}

/** Quanto falta pro próximo pacote (ms); null = cheio. */
export function nextPackIn(u: Pick<UltimateSave, 'packs' | 'packAt'>, now: number): number | null {
    const r = refill(u, now);
    return r.packs >= PACK_MAX ? null : r.packAt + PACK_INTERVAL_MS - now;
}

// ------------------------------------------------------------------------------------------------------ pacote

const METALS: Metal[] = ['bronze', 'prata', 'ouro'];
const rank = (m: Metal) => METALS.indexOf(m);

/** Metal da espécie como ela sai no pacote (nível 50, sem edição). */
const speciesMetal = (id: number): Metal =>
    metalOf(
        viewInstance({
            uid: '',
            speciesId: id,
            level: DEFAULT_LEVEL,
            xp: 0,
            moves: [],
            ability: '',
            shiny: false,
            nickname: null,
            condition: 1,
        }).overall,
    );
let pools: Record<Metal, number[]> | null = null;
/** As espécies de cada metal (calculado uma vez). */
export function metalPools(): Record<Metal, number[]> {
    if (!pools) {
        const p: Record<Metal, number[]> = { bronze: [], prata: [], ouro: [] };
        for (const sp of SPECIES) p[speciesMetal(sp.id)].push(sp.id);
        pools = p;
    }
    return pools;
}

const rollMetal = (rng: Rng): Metal => {
    let r = rng.next();
    for (const m of METALS) {
        r -= METAL_ODDS[m];
        if (r < 0) return m;
    }
    return 'bronze';
};

/** Os metais do pacote: cada carta pela chance; sem nenhuma do piso, a última vira o piso. */
export function packMetals(rng: Rng): Metal[] {
    const metals = Array.from({ length: PACK_SIZE }, () => rollMetal(rng));
    if (!metals.some((m) => rank(m) >= rank(FLOOR_METAL))) metals[metals.length - 1] = FLOOR_METAL;
    return metals;
}

/**
 * As cartas de um Pacote Mini. Sem espécie repetida dentro do pacote; até o time ficar cheio (TEAM_SIZE cartas), nem
 * espécie que você já tem (os 2 primeiros pacotes sempre montam um time).
 */
export function rollPack(u: Pick<UltimateSave, 'salt' | 'opened' | 'cards'>): PokemonInstance[] {
    const rng = new Rng(u.salt, `ut-pack-${u.opened}`);
    const owned = new Set(u.cards.map((c) => c.speciesId));
    const avoidOwned = u.cards.length < TEAM_SIZE;
    const taken = new Set<number>();
    const iconIds = Object.keys(ICONS).map(Number);
    return packMetals(rng).map((metal, i) => {
        const free = (id: number) => !taken.has(id) && !(avoidOwned && owned.has(id));
        const pool = metalPools()[metal].filter(free);
        const icon = rng.chance(ICON_ODDS);
        const iconPool = icon ? iconIds.filter((id) => pool.includes(id)) : [];
        const from = iconPool.length
            ? iconPool
            : pool.length
              ? pool
              : metalPools()[metal].filter((id) => !taken.has(id));
        const id = rng.pick(from);
        taken.add(id);
        const inst = createInstance(id, rng);
        return {
            ...inst,
            uid: `ut${u.opened}-${i}-${id}`,
            shiny: rng.chance(SHINY_ODDS),
            ...(iconPool.length && { special: { kind: 'icone' as const, title: ICONS[id] } }),
        };
    });
}

/** Mesma espécie e mesma edição que uma carta da coleção. */
export const isRepeat = (cards: readonly PokemonInstance[], c: PokemonInstance) =>
    cards.some((o) => o.speciesId === c.speciesId && editionOf(o) === editionOf(c));

export interface PackOpen {
    cards: PokemonInstance[];
    /** Quantos pontos de pacote cada carta deu (0 = carta nova, entrou na coleção). */
    points: number[];
}

/**
 * Abre um pacote grátis (se tem). As novas entram na coleção e enchem as vagas vazias do time (nunca tiram ninguém);
 * repetida vira pontos de pacote. null = sem pacote.
 */
export function openPack(u: UltimateSave, now: number): { u: UltimateSave; pack: PackOpen } | null {
    const clock = refill(u, now);
    if (clock.packs < 1) return null;
    const cards = rollPack(u);
    const points = cards.map((c) => (isRepeat(u.cards, c) ? REPEAT_POINTS[metalOf(viewInstance(c).overall)] : 0));
    const fresh = cards.filter((_, i) => points[i] === 0);
    const order = [...u.team.order, ...fresh.map((c) => c.uid)].slice(0, TEAM_SIZE);
    return {
        u: {
            ...u,
            cards: [...u.cards, ...fresh],
            packPoints: u.packPoints + points.reduce((s, p) => s + p, 0),
            packs: clock.packs - 1,
            packAt: clock.packAt,
            opened: u.opened + 1,
            team: { ...u.team, order, captainUid: u.team.captainUid ?? order[0] ?? null },
        },
        pack: { cards, points },
    };
}

// ------------------------------------------------------------------------------------------------------- time

/** Posição na ordem do time de uma vaga da escalação (titular 0..4, banco 5..6). */
export const orderIndex = (zone: 'lineup' | 'bench', index: number) => (zone === 'lineup' ? index : STARTERS + index);

/**
 * Põe a carta `uid` na posição `i` do time. Se ela já está no time, as duas trocam de lugar; se vem da coleção, quem
 * estava ali volta pra coleção (e deixa de ser capitão/cobrador).
 */
export function setMember(team: UltimateTeam, i: number, uid: string): UltimateTeam {
    const order = [...team.order];
    const j = order.indexOf(uid);
    const out = order[i];
    if (j >= 0) [order[i], order[j]] = [order[j], order[i]];
    else if (i < order.length) order[i] = uid;
    else order.push(uid);
    const gone = j < 0 ? out : undefined;
    return {
        ...team,
        order: order.filter(Boolean),
        captainUid: team.captainUid === gone ? null : team.captainUid,
        cornerTakerUid: team.cornerTakerUid === gone ? null : team.cornerTakerUid,
    };
}

export const canPlay = (u: Pick<UltimateSave, 'team'>) => u.team.order.length >= STARTERS;

/** O seu time pra partida (as substituições são só suas). */
export function homeTeam(u: UltimateSave, name: string, color: number): TeamSetup {
    const by = new Map(u.cards.map((c) => [c.uid, c]));
    const pick = (uids: string[]) => uids.flatMap((x) => by.get(x) ?? []);
    return {
        name,
        lineup: pick(u.team.order.slice(0, STARTERS)),
        bench: pick(u.team.order.slice(STARTERS, TEAM_SIZE)),
        tactic: u.team.tactic,
        color,
        formation: u.team.formation,
        captainUid: u.team.captainUid,
        manualSubs: true,
        corner: u.team.corner,
        cornerTakerUid: u.team.cornerTakerUid,
    };
}

/** Média dos titulares na vaga (a mesma conta do "vs." da Escalação). */
export const teamAverage = (t: Pick<TeamSetup, 'lineup' | 'formation'>) => lineupAverage(t.lineup, t.formation);

/**
 * Rival da IA da partida `n`: um clube de ginásio (a mesma quadra, líder e uniforme da Copa) com o time cuja média
 * chega mais perto da sua + LEVEL_GAP do nível. O clube depende só de `n`; o nível muda a força.
 */
export function ultimateRival(salt: string, n: number, level: Level, myAvg: number): TeamSetup {
    const club = new Rng(salt, `ut-club-${n}`).pick(CLUBS);
    const target = myAvg + LEVEL_GAP[level];
    let best: ReturnType<typeof aiDraftTeam> | null = null;
    let bestGap = Infinity;
    for (const d of [-2, -1, 0, 1, 2, 3])
        for (const k of [0, 1]) {
            const team = aiDraftTeam(new Rng(salt, `ut-rival-${n}-${d}-${k}`), d, club.types, club.formation);
            const gap = Math.abs(lineupAverage(team.lineup, club.formation) - target);
            if (gap < bestGap) [best, bestGap] = [team, gap];
        }
    const t = best!;
    return {
        name: club.name,
        lineup: t.lineup,
        bench: t.bench,
        tactic: club.tactic,
        color: club.color,
        formation: club.formation,
        captainUid: t.captainUid,
    };
}

// ------------------------------------------------------------------------------------------------- resultado

/** Vitória, empate ou derrota pelo placar do tempo normal (os pênaltis são só a festa). */
export const outcomeOf = (score: readonly [number, number]): Outcome =>
    score[0] > score[1] ? 'win' : score[0] < score[1] ? 'loss' : 'draw';

export const fichasFor = (level: Level, outcome: Outcome) => FICHAS[level][outcome];

/** Apito final: paga as Fichas do nível e guarda o resultado pro painel do prêmio. Sem partida aberta, nada muda. */
export function finishMatch(
    u: UltimateSave,
    m: { score: readonly [number, number]; shootout: [number, number] | null },
): UltimateSave {
    if (!u.live) return u;
    const outcome = outcomeOf(m.score);
    const fichas = fichasFor(u.live.level, outcome);
    return {
        ...u,
        fichas: u.fichas + fichas,
        played: u.played + 1,
        wins: u.wins + (outcome === 'win' ? 1 : 0),
        draws: u.draws + (outcome === 'draw' ? 1 : 0),
        losses: u.losses + (outcome === 'loss' ? 1 : 0),
        live: null,
        last: {
            score: [m.score[0], m.score[1]],
            shootout: m.shootout,
            outcome,
            level: u.live.level,
            fichas,
            rival: u.live.rival.name,
            seen: false,
        },
    };
}
