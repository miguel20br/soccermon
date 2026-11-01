import { computeAttributes, eligiblePositions } from '../../engine/attributes';
import { ENGINE_VERSION } from '../../engine/config';
import { CLUBS } from '../../engine/cup';
import { SPECIES, species } from '../../engine/data';
import { aiDraftTeam } from '../../engine/draft';
import { DEFAULT_FORMATION, FORMATIONS, type FormationId } from '../../engine/formations';
import { createInstance, DEFAULT_LEVEL, type PokemonInstance, slotRating, viewInstance } from '../../engine/instance';
import { mvpScore } from '../../engine/mvp';
import { Rng } from '../../engine/rng';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { editionOf, ICONS } from '../../engine/specials';
import type { CornerPlan, MatchOrder, Tactic, TeamSetup } from '../../engine/state';
import { type Metal, metalOf } from '../../ui/rarity';
import { lineupAverage } from '../../ui/rating';
import { dailyDay } from '../daily';
import type { RunState } from '../game-store';
import { countEvos, evoPaths, evoReady, evoStep, evoSteps, evosOf, newEvo, type UtEvo } from './evolutions';
import { countObjectives, eventAt, newObjectives, type ObjectiveState, objectivesOf } from './objectives';
import {
    BIG_FLOOR_N,
    BIG_PACK_SIZE,
    CUP_BRIDGE_DAY_MAX,
    EVO_ACTIVE_MAX,
    FICHAS,
    FICHAS_PACK_PRICE,
    FLOOR_METAL,
    GYM_FICHAS_MULT,
    GYM_FIRST_BIG,
    GYM_LEVEL,
    GYMS,
    ICON_ODDS,
    LEVEL_GAP,
    LEVELS,
    type Level,
    METAL_ODDS,
    OPEN_POINTS,
    type Outcome,
    PACK_INTERVAL_MS,
    PACK_MAX,
    PACK_SIZE,
    PASS_CARD,
    PASS_MARKS,
    PICK_PRICE,
    passReward,
    REPEAT_POINTS,
    SHINY_ODDS,
    STARTERS,
    TEAM_SIZE,
} from './rules';
import { gymOk, newPass, type PassState, passGain, passMarksOf, seasonN } from './season';

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
    /** Desafio de líder (GYMS): o id dele. */
    gym?: string;
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
    /** Objetivos que completaram nesta partida (o prêmio de cada um está em OBJECTIVES). */
    objectives?: string[];
    /** Desafio de líder; `badge` = a 1ª vitória contra ele nesta temporada (insígnia + Pacote Grande). */
    gym?: string;
    badge?: boolean;
    /** Pontos do passe que a partida deu e os marcos que ela alcançou. */
    pass?: number;
    marks?: number[];
    /** Enfeite do evento ganho nesta partida (todos os objetivos do evento). */
    ornament?: string;
}

/** O que fica de uma temporada que acabou (no Perfil, nunca zera). */
export interface UtSeasonRecord {
    season: number;
    played: number;
    wins: number;
    /** Marcos do passe alcançados; todos = o título de campeão da temporada. */
    marks: number;
    champion: boolean;
    /** A carta que mais jogou: a Lenda da temporada (só enfeite). */
    legend: PokemonInstance | null;
}
export interface UtLegacy {
    seasons: UtSeasonRecord[];
    /** Enfeites dos eventos completos (id do evento). */
    ornaments: string[];
}

export interface UltimateSave {
    /** A temporada deste save (SEASONS); 0 = a prévia antes da Temporada 1. Virou a temporada, zera (`rollSeason`). */
    season: number;
    /** Semente dos pacotes e dos rivais deste save. */
    salt: string;
    /** A coleção da temporada. */
    cards: PokemonInstance[];
    fichas: number;
    /** Pontos de pacote (cada pacote aberto + repetidas): compram a carta que você escolher. */
    packPoints: number;
    /** Pacotes grátis guardados (0..PACK_MAX). */
    packs: number;
    /** Pacotes ganhos (objetivos, título da Copa, Fichas): sem teto e sem relógio. */
    extraPacks: number;
    /** Pacotes Grandes ganhos (objetivos da semana, passe, líderes). */
    bigPacks: number;
    /** Cartas compradas com pontos (numera a semente da próxima). */
    bought: number;
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
    objectives: ObjectiveState;
    /** Evoluções e Treinos em andamento (até EVO_ACTIVE_MAX). */
    evos: UtEvo[];
    /** Cartas que já fizeram a Evolução ou o Treino até o fim (não começam outro). */
    evoDone: string[];
    /** Ponte da Copa: quantos títulos já pagaram pacote no dia `day`. */
    bridge: { day: string; n: number };
    /** Passe grátis da temporada. */
    pass: PassState;
    /** Partidas de cada carta nesta temporada (a mais jogada vira a Lenda). */
    plays: Record<string, number>;
    /** Líderes vencidos nesta temporada (as insígnias). */
    gyms: string[];
    /** O que fica das temporadas passadas: nunca zera. */
    legacy: UtLegacy;
}

export const newUltimate = (salt = Math.floor(Math.random() * 1e9).toString(36), now = Date.now()): UltimateSave => ({
    season: 0,
    salt,
    cards: [],
    fichas: 0,
    packPoints: 0,
    packs: PACK_MAX,
    packAt: now,
    extraPacks: 0,
    bigPacks: 0,
    bought: 0,
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
    objectives: newObjectives(now),
    evos: [],
    evoDone: [],
    bridge: { day: '', n: 0 },
    pass: newPass(),
    plays: {},
    gyms: [],
    legacy: { seasons: [], ornaments: [] },
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
        extraPacks: num(raw.extraPacks),
        bigPacks: num(raw.bigPacks),
        bought: num(raw.bought),
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
                      ...(typeof live.gym === 'string' && GYMS.some((g) => g.id === live.gym) && { gym: live.gym }),
                  }
                : null,
        last:
            last && Array.isArray(last.score) && LEVELS.includes(last.level as Level)
                ? (last as unknown as UltimateLast)
                : null,
        objectives: objectivesOf(raw.objectives, Date.now()),
        evos: evosOf(raw.evos, cards),
        evoDone: Array.isArray(raw.evoDone)
            ? raw.evoDone.filter((x): x is string => typeof x === 'string' && uids.has(x))
            : [],
        bridge:
            isObj(raw.bridge) && typeof raw.bridge.day === 'string'
                ? { day: raw.bridge.day, n: num(raw.bridge.n) }
                : base.bridge,
        pass:
            isObj(raw.pass) && typeof raw.pass.day === 'string'
                ? { day: raw.pass.day, today: num(raw.pass.today), pts: num(raw.pass.pts), marks: num(raw.pass.marks) }
                : base.pass,
        plays: isObj(raw.plays)
            ? Object.fromEntries(Object.entries(raw.plays).flatMap(([k, v]) => (uids.has(k) ? [[k, num(v)]] : [])))
            : {},
        gyms: Array.isArray(raw.gyms)
            ? raw.gyms.filter((g): g is string => typeof g === 'string' && GYMS.some((x) => x.id === g))
            : [],
        legacy: legacyOf(raw.legacy),
    };
}

const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
/** O legado do save: só as temporadas com número e a Lenda que for uma carta de verdade. */
function legacyOf(raw: unknown): UtLegacy {
    if (!isObj(raw)) return { seasons: [], ornaments: [] };
    const seasons = Array.isArray(raw.seasons)
        ? raw.seasons.flatMap((r): UtSeasonRecord[] =>
              isObj(r) && typeof r.season === 'number'
                  ? [
                        {
                            season: num(r.season),
                            played: num(r.played),
                            wins: num(r.wins),
                            marks: num(r.marks),
                            champion: r.champion === true,
                            legend: cardOk(r.legend) ? r.legend : null,
                        },
                    ]
                  : [],
          )
        : [];
    return { seasons, ornaments: [...new Set(strs(raw.ornaments))] };
}

/**
 * Legado dos dois lados junto: uma temporada por número (a dos dois que jogou mais; empate, a de `a`) e o enfeite não
 * se perde.
 */
function mergeLegacy(a: UtLegacy, b: UtLegacy): UtLegacy {
    const by = new Map<number, UtSeasonRecord>();
    for (const r of [...a.seasons, ...b.seasons]) {
        const cur = by.get(r.season);
        if (!cur || r.played > cur.played) by.set(r.season, r);
    }
    return {
        seasons: [...by.values()].sort((x, y) => x.season - y.season),
        ornaments: [...new Set([...a.ornaments, ...b.ornaments])],
    };
}

const progress = (u: UltimateSave) => u.opened + u.played + u.bought;
/**
 * Nuvem x aparelho: fica o lado da temporada mais nova e, na mesma, o que andou mais (pacotes abertos + partidas +
 * compras); empate, o que vale (`keep`). O legado (Perfil) dos dois lados fica junto.
 */
export function mergeUltimate(keep: unknown, other: unknown): UltimateSave {
    const k = ultimateOf(keep);
    const o = ultimateOf(other);
    const win = o.season > k.season || (o.season === k.season && progress(o) > progress(k)) ? o : k;
    const lose = win === o ? k : o;
    // o lado de uma temporada mais velha ainda não virou: a temporada que ele jogou entra no legado (senão sumia)
    const lost = lose.season < win.season ? seasonRecord(lose) : null;
    return {
        ...win,
        legacy: mergeLegacy(win.legacy, { ...lose.legacy, seasons: [...lose.legacy.seasons, ...(lost ? [lost] : [])] }),
    };
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

export type PackKind = 'mini' | 'big';

/**
 * Os metais do pacote: cada carta pela chance; com menos de `floorN` do piso (Mini 1, Grande BIG_FLOOR_N), as últimas
 * abaixo dele viram o piso.
 */
export function packMetals(rng: Rng, kind: PackKind = 'mini'): Metal[] {
    const [size, floorN] = kind === 'big' ? [BIG_PACK_SIZE, BIG_FLOOR_N] : [PACK_SIZE, 1];
    const metals = Array.from({ length: size }, () => rollMetal(rng));
    let short = floorN - metals.filter((m) => rank(m) >= rank(FLOOR_METAL)).length;
    for (let i = metals.length - 1; i >= 0 && short > 0; i--)
        if (rank(metals[i]) < rank(FLOOR_METAL)) {
            metals[i] = FLOOR_METAL;
            short--;
        }
    return metals;
}

/** A espécie joga no gol (o goleiro está entre as posições dela no nível 50). */
export const isKeeperSpecies = (id: number) =>
    eligiblePositions(computeAttributes(species(id), DEFAULT_LEVEL), id).includes('GK');
const isKeeper = (c: PokemonInstance) => viewInstance(c).positions.includes('GK');

/**
 * As cartas de um pacote (Mini ou Grande). Sem espécie repetida dentro do pacote; até o time ficar cheio (TEAM_SIZE
 * cartas), nem espécie que você já tem (os 2 primeiros pacotes sempre montam um time) e, sem goleiro na coleção, a 1ª
 * carta é um goleiro do metal sorteado (o time nunca começa com alguém de linha no gol). Durante um evento (`now`),
 * cada carta que não saiu Ícone pode sair Evento (pintada do tipo do evento).
 */
export function rollPack(
    u: Pick<UltimateSave, 'salt' | 'opened' | 'cards'>,
    kind: PackKind = 'mini',
    now?: number,
): PokemonInstance[] {
    const rng = new Rng(u.salt, `ut-${kind === 'big' ? 'big' : 'pack'}-${u.opened}`);
    const event = now === undefined ? null : eventAt(now);
    const owned = new Set(u.cards.map((c) => c.speciesId));
    const avoidOwned = u.cards.length < TEAM_SIZE;
    const needKeeper = avoidOwned && !u.cards.some(isKeeper);
    const taken = new Set<number>();
    const iconIds = Object.keys(ICONS).map(Number);
    return packMetals(rng, kind).map((metal, i) => {
        const free = (id: number) => !taken.has(id) && !(avoidOwned && owned.has(id));
        const open = metalPools()[metal].filter(free);
        const keepers = i === 0 && needKeeper ? open.filter(isKeeperSpecies) : [];
        const pool = keepers.length ? keepers : open;
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
        const shiny = rng.chance(SHINY_ODDS);
        // o sorteio do Evento só existe no evento (fora dele, o pacote é o mesmo de antes)
        const evento = !iconPool.length && !!event && rng.chance(event.cardOdds);
        return {
            ...inst,
            uid: `ut${u.opened}-${i}-${id}`,
            shiny,
            ...(iconPool.length && { special: { kind: 'icone' as const, title: ICONS[id] } }),
            ...(evento && { special: { kind: 'evento' as const, type: event.type } }),
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

/** Pacotes Mini pra abrir agora: os grátis do relógio + os ganhos. */
export const packsReady = (u: Pick<UltimateSave, 'packs' | 'packAt' | 'extraPacks'>, now: number) =>
    refill(u, now).packs + u.extraPacks;

/**
 * Abre um pacote. Mini: o grátis primeiro, pra o relógio voltar a contar; depois os ganhos. Grande: só os ganhos. As
 * novas entram na coleção e enchem as vagas vazias do time, cada uma na vaga da posição dela (nunca tiram ninguém);
 * repetida vira pontos de pacote, e todo pacote aberto dá OPEN_POINTS. null = sem pacote.
 */
export function openPack(
    u: UltimateSave,
    now: number,
    kind: PackKind = 'mini',
): { u: UltimateSave; pack: PackOpen } | null {
    const clock = refill(u, now);
    const big = kind === 'big';
    const free = !big && clock.packs >= 1;
    if (big ? u.bigPacks < 1 : !free && u.extraPacks < 1) return null;
    const cards = rollPack(u, kind, now);
    const points = cards.map((c) => (isRepeat(u.cards, c) ? REPEAT_POINTS[metalOf(viewInstance(c).overall)] : 0));
    const fresh = cards.filter((_, i) => points[i] === 0);
    return {
        u: {
            ...addCards(u, fresh),
            packPoints: u.packPoints + OPEN_POINTS + points.reduce((s, p) => s + p, 0),
            packs: free ? clock.packs - 1 : clock.packs,
            packAt: clock.packAt,
            extraPacks: free || big ? u.extraPacks : u.extraPacks - 1,
            bigPacks: big ? u.bigPacks - 1 : u.bigPacks,
            opened: u.opened + 1,
        },
        pack: { cards, points },
    };
}

/** Cartas novas na coleção, enchendo as vagas vazias do time pela posição. */
function addCards(u: UltimateSave, fresh: PokemonInstance[]): UltimateSave {
    const team = fillTeam(u.team, fresh);
    const all = [...u.cards, ...fresh];
    const best = (uids: string[]) =>
        uids.reduce<PokemonInstance | null>((b, uid) => {
            const c = all.find((x) => x.uid === uid);
            return c && (!b || viewInstance(c).overall > viewInstance(b).overall) ? c : b;
        }, null);
    const captainUid = team.captainUid ?? best(team.order.slice(0, STARTERS))?.uid ?? null;
    return { ...u, cards: [...u.cards, ...fresh], team: { ...team, captainUid } };
}

/**
 * Enche as vagas vazias do time com as cartas `fresh` (quem já está fica onde está): as vagas de titular abertas
 * recebem a distribuição de maior soma de notas na vaga (o gol só com quem joga no gol, se tiver um), e o banco as
 * melhores notas do que sobrar. Busca completa: chegam no máximo 3 cartas por vez (5 vagas, 3 cartas = 60 jeitos).
 */
export function fillTeam(team: UltimateTeam, fresh: readonly PokemonInstance[]): UltimateTeam {
    const have = team.order.length;
    if (have >= TEAM_SIZE || !fresh.length) return team;
    const slots = FORMATIONS[team.formation].slots;
    const open = Array.from(
        { length: Math.max(0, Math.min(STARTERS, have + fresh.length) - have) },
        (_, k) => have + k,
    );
    const keeperOnly = fresh.some(isKeeper);
    let best: PokemonInstance[] = [];
    let bestScore = -1;
    const walk = (used: PokemonInstance[], score: number) => {
        if (used.length === open.length) {
            if (score > bestScore) [best, bestScore] = [used, score];
            return;
        }
        const role = slots[open[used.length]];
        for (const c of fresh)
            if (!used.includes(c) && !(role === 'GK' && keeperOnly && !isKeeper(c)))
                walk([...used, c], score + slotRating(c, role));
    };
    walk([], 0);
    const bench = fresh
        .filter((c) => !best.includes(c))
        .sort((a, b) => viewInstance(b).overall - viewInstance(a).overall);
    return { ...team, order: [...team.order, ...[...best, ...bench].map((c) => c.uid)].slice(0, TEAM_SIZE) };
}

// --------------------------------------------------------------------------------------------- loja

/** As espécies que dá pra escolher com pontos naquele metal (a Normal que você ainda não tem). */
export const pickable = (u: Pick<UltimateSave, 'cards'>, metal: Metal) =>
    metalPools()[metal].filter((id) => !u.cards.some((c) => c.speciesId === id && editionOf(c) === null));

/**
 * Compra com pontos de pacote a carta da espécie escolhida: Normal (sem Shiny, sem Ícone e sem Evento), no metal
 * dela, com o preço do metal. null = sem pontos, espécie que você já tem ou que não existe.
 */
export function buyCard(u: UltimateSave, speciesId: number): { u: UltimateSave; card: PokemonInstance } | null {
    const metal = METALS.find((m) => metalPools()[m].includes(speciesId));
    if (!metal || u.packPoints < PICK_PRICE[metal] || !pickable(u, metal).includes(speciesId)) return null;
    const inst = createInstance(speciesId, new Rng(u.salt, `ut-buy-${u.bought}`));
    const card: PokemonInstance = { ...inst, uid: `utb${u.bought}-${speciesId}`, shiny: false };
    return {
        u: { ...addCards(u, [card]), packPoints: u.packPoints - PICK_PRICE[metal], bought: u.bought + 1 },
        card,
    };
}

/** Pacote Mini extra com Fichas. null = Fichas não bastam. */
export function buyPack(u: UltimateSave): UltimateSave | null {
    if (u.fichas < FICHAS_PACK_PRICE) return null;
    return { ...u, fichas: u.fichas - FICHAS_PACK_PRICE, extraPacks: u.extraPacks + 1 };
}

/**
 * Ponte da Copa: título da Copa = 1 Pacote Mini aqui, até CUP_BRIDGE_DAY_MAX por dia (Brasília). A temporada vira
 * antes de pagar: o pacote ganho no dia da temporada nova não pode ir pra save velho (a virada o apagaria).
 */
export function cupBridge(save: UltimateSave, now: number): UltimateSave {
    const u = rollSeason(save, now).u;
    const day = dailyDay(new Date(now));
    const n = u.bridge.day === day ? u.bridge.n : 0;
    if (n >= CUP_BRIDGE_DAY_MAX) return u;
    return { ...u, extraPacks: u.extraPacks + 1, bridge: { day, n: n + 1 } };
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

/**
 * Barra de evolução da partida no Time Ultimate: começa tão no negativo que nunca enche, então ninguém evolui no meio
 * da partida (evoluía e voltava à forma de antes no apito final: aqui quem evolui é a Evolução, com a carta). É só um
 * dado da carta na partida (`PokemonInstance.evo`): o motor e as outras partidas não mudam.
 */
export const NO_MID_EVO = -1e6;
const noMidEvo = (ps: PokemonInstance[]) => ps.map((p) => ({ ...p, evo: NO_MID_EVO }));

/** O seu time pra partida (as substituições são só suas; ninguém evolui no meio dela). */
export function homeTeam(u: UltimateSave, name: string, color: number): TeamSetup {
    const by = new Map(u.cards.map((c) => [c.uid, c]));
    const pick = (uids: string[]) => noMidEvo(uids.flatMap((x) => by.get(x) ?? []));
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
 * chega mais perto da sua + LEVEL_GAP do nível. O clube depende só de `n` (ou é o do líder, no desafio `gym`); o nível
 * muda a força.
 */
export function ultimateRival(salt: string, n: number, level: Level, myAvg: number, gym?: string): TeamSetup {
    const gymClub = gym && CLUBS.find((c) => c.name === GYMS.find((g) => g.id === gym)?.club);
    const club = gymClub || new Rng(salt, `ut-club-${n}`).pick(CLUBS);
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
        lineup: noMidEvo(t.lineup),
        bench: noMidEvo(t.bench),
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

/** Fichas da partida: as do nível, ou as do desafio de líder (GYM_FICHAS_MULT vezes as do Difícil). */
export const fichasFor = (level: Level, outcome: Outcome, gym = false) =>
    gym ? FICHAS[GYM_LEVEL][outcome] * GYM_FICHAS_MULT : FICHAS[level][outcome];

/** O desafio do líder `id` pode começar com o seu time titular de agora (a regra dele). */
export function gymReady(u: UltimateSave, id: string): boolean {
    const gym = GYMS.find((g) => g.id === id);
    if (!gym || !canPlay(u)) return false;
    const by = new Map(u.cards.map((c) => [c.uid, c]));
    return gymOk(
        gym.rule,
        u.team.order.slice(0, STARTERS).flatMap((x) => by.get(x) ?? []),
    );
}

/** O que o apito final lê da partida (a MatchResult inteira serve). */
export type UltimateMatch = { score: readonly [number, number]; shootout: [number, number] | null } & Partial<
    Pick<MatchResult, 'finalRoster' | 'subbedOut'>
>;

/**
 * Apito final: paga as Fichas do nível, conta os objetivos (que pagam Fichas e pacotes na hora) e as Evoluções, e
 * guarda o resultado pro painel do prêmio. Sem partida aberta, nada muda. `now` = relógio dos objetivos.
 */
export function finishMatch(u: UltimateSave, m: UltimateMatch, now: number): UltimateSave {
    if (!u.live) return u;
    const outcome = outcomeOf(m.score);
    const gym = u.live.gym;
    const fichas = fichasFor(u.live.level, outcome, !!gym);
    const noGold = u.live.home.lineup.every((p) => metalOf(viewInstance(p).overall) !== 'ouro');
    const obj = countObjectives(u.objectives, { outcome, level: u.live.level, goals: m.score[0], noGold }, now);
    const players = [...(m.finalRoster ?? []), ...(m.subbedOut ?? [])];
    // craque do seu time (a mesma nota do MVP da partida)
    const mvp = players
        .filter((p) => p.team === 0)
        .reduce<(typeof players)[number] | null>((b, p) => (!b || mvpScore(p) > mvpScore(b) ? p : b), null);
    const plays = { ...u.plays };
    for (const p of players)
        if (p.team === 0 && u.cards.some((c) => c.uid === p.uid)) plays[p.uid] = (plays[p.uid] ?? 0) + 1;
    const badge = !!gym && outcome === 'win' && !u.gyms.includes(gym);
    // enfeite do evento: todos os objetivos dele cumpridos
    const event = eventAt(now);
    const ornament =
        event && !u.legacy.ornaments.includes(event.id) && event.objectives.every((o) => obj.g.done.includes(o.id))
            ? event.id
            : undefined;
    const sum = (k: 'fichas' | 'packs' | 'big') => obj.completed.reduce((s, o) => s + o[k], 0);
    const paid: UltimateSave = {
        ...u,
        fichas: u.fichas + fichas + sum('fichas'),
        extraPacks: u.extraPacks + sum('packs'),
        bigPacks: u.bigPacks + sum('big') + (badge ? GYM_FIRST_BIG : 0),
        objectives: obj.g,
        evos: countEvos(u.evos, players, mvp?.uid ?? null),
        plays,
        gyms: badge ? [...u.gyms, gym] : u.gyms,
        legacy: ornament ? { ...u.legacy, ornaments: [...u.legacy.ornaments, ornament] } : u.legacy,
        played: u.played + 1,
        wins: u.wins + (outcome === 'win' ? 1 : 0),
        draws: u.draws + (outcome === 'draw' ? 1 : 0),
        losses: u.losses + (outcome === 'loss' ? 1 : 0),
        live: null,
    };
    const { pass, gained } = passGain(u.pass, outcome, !!gym, now);
    const before = u.pass.marks;
    const out = payPass({ ...paid, pass });
    return {
        ...out,
        last: {
            score: [m.score[0], m.score[1]],
            shootout: m.shootout,
            outcome,
            level: u.live.level,
            fichas,
            rival: u.live.rival.name,
            seen: false,
            objectives: obj.completed.map((o) => o.id),
            ...(gym && { gym, badge }),
            pass: gained,
            marks: Array.from({ length: out.pass.marks - before }, (_, i) => before + i + 1),
            ...(ornament && { ornament }),
        },
    };
}

// ----------------------------------------------------------------------------------------------- passe e temporada

/** uid da carta de abertura do passe da temporada. */
export const passCardUid = (season: number) => `utp${season}-${PASS_CARD}`;

/**
 * Paga os marcos do passe que os pontos alcançaram e ainda não pagaram: Fichas, pacotes e a carta de abertura (que
 * entra no marco 1 e sobe +2 em tudo nos marcos de crescer, a mesma conta do Treino).
 */
export function payPass(u: UltimateSave): UltimateSave {
    const reach = passMarksOf(u.pass.pts);
    let out = u;
    for (let k = u.pass.marks + 1; k <= reach; k++) {
        const r = passReward(k);
        out = {
            ...out,
            fichas: out.fichas + r.fichas,
            extraPacks: out.extraPacks + r.packs,
            bigPacks: out.bigPacks + r.big,
        };
        const uid = passCardUid(u.season);
        if (r.card === 'card' && !out.cards.some((c) => c.uid === uid)) {
            const inst = createInstance(PASS_CARD, new Rng(u.salt, `ut-pass-${u.season}`));
            out = addCards(out, [{ ...inst, uid, shiny: false }]);
        }
        if (r.card === 'grow')
            out = {
                ...out,
                cards: out.cards.map((c) => (c.uid === uid ? { ...c, evolved: (c.evolved ?? 0) + 1 } : c)),
            };
    }
    return { ...out, pass: { ...out.pass, marks: Math.max(u.pass.marks, reach) } };
}

/** A carta que mais jogou na temporada (empate: a de nota maior). */
export function mostPlayed(u: Pick<UltimateSave, 'cards' | 'plays'>): PokemonInstance | null {
    let best: PokemonInstance | null = null;
    for (const c of u.cards) {
        const n = u.plays[c.uid] ?? 0;
        if (!n) continue;
        const b = best ? (u.plays[best.uid] ?? 0) : -1;
        if (n > b || (n === b && best && viewInstance(c).overall > viewInstance(best).overall)) best = c;
    }
    return best;
}

/** O que fica da temporada que o save está jogando (null = a prévia, ou nenhuma partida nela). */
export const seasonRecord = (u: UltimateSave): UtSeasonRecord | null =>
    u.season >= 1 && u.played > 0
        ? {
              season: u.season,
              played: u.played,
              wins: u.wins,
              marks: u.pass.marks,
              champion: u.pass.marks >= PASS_MARKS,
              legend: mostPlayed(u),
          }
        : null;

/**
 * Virada da temporada no relógio `now`: o save de uma temporada anterior zera (time, cartas do modo, Fichas, pontos
 * de pacote, passe, insígnias, objetivos) e começa na temporada nova, com os 2 pacotes de boas-vindas. Fica o legado:
 * da temporada que acabou (se você jogou nela; a prévia não conta), a medalha, os marcos, o título de campeão (passe
 * completo) e a Lenda (a carta que mais jogou). Com partida aberta, espera o apito final. Relógio que voltou no tempo
 * não volta a temporada.
 */
export function rollSeason(u: UltimateSave, now: number): { u: UltimateSave; record: UtSeasonRecord | null } {
    const n = seasonN(now);
    if (n <= u.season || u.live) return { u, record: null };
    const record = seasonRecord(u);
    const fresh = newUltimate(`${u.salt}.${n}`, now);
    return {
        u: {
            ...fresh,
            season: n,
            legacy: { ...u.legacy, seasons: record ? [...u.legacy.seasons, record] : u.legacy.seasons },
        },
        record,
    };
}

// ------------------------------------------------------------------------------------------------ evoluções

/** Começa a Evolução (ou o Treino) da carta pelo caminho escolhido. null = não pode (cheio, já fez, caminho errado). */
export function startEvo(u: UltimateSave, uid: string, path: readonly number[]): UltimateSave | null {
    const card = u.cards.find((c) => c.uid === uid);
    if (!card || u.live || u.evos.length >= EVO_ACTIVE_MAX || u.evos.some((e) => e.uid === uid)) return null;
    if (u.evoDone.includes(uid) || !evoPaths(card).some((p) => p.join() === path.join())) return null;
    return { ...u, evos: [...u.evos, newEvo(card, [...path])] };
}

/** Desiste da Evolução (o que a carta já evoluiu fica). */
export const dropEvo = (u: UltimateSave, uid: string): UltimateSave => ({
    ...u,
    evos: u.evos.filter((e) => e.uid !== uid),
});

/**
 * Dá o passo pronto da Evolução: a carta evolui (ou sobe no Treino) no mesmo lugar da coleção e do time, com a mesma
 * edição. O último passo fecha a Evolução. null = nada pronto.
 */
export function evolveCard(
    u: UltimateSave,
    uid: string,
): { u: UltimateSave; from: PokemonInstance; card: PokemonInstance } | null {
    const e = u.evos.find((x) => x.uid === uid);
    const from = u.cards.find((c) => c.uid === uid);
    if (!e || !from || u.live || !evoReady(e)) return null;
    const card = evoStep(from, e);
    const next: UtEvo = { ...e, step: e.step + 1, prog: { played: 0, goals: 0, mvp: 0 } };
    const end = next.step >= evoSteps(next);
    return {
        u: {
            ...u,
            cards: u.cards.map((c) => (c.uid === uid ? card : c)),
            evos: end ? u.evos.filter((x) => x.uid !== uid) : u.evos.map((x) => (x.uid === uid ? next : x)),
            evoDone: end ? [...u.evoDone, uid] : u.evoDone,
        },
        from,
        card,
    };
}

/** A partida do Time Ultimate no formato de copa de 1 fase: a tela da partida é a mesma da Copa (como a da Liga). */
export function ultimateRun(s: { ultimate: UltimateSave }): RunState | null {
    const live = s.ultimate.live;
    if (!live) return null;
    const home = live.home;
    return {
        schemaVersion: 3,
        seed: ultimateSeed(s.ultimate.salt, live.n),
        teamName: home.name,
        status: 'lineup',
        formation: home.formation ?? DEFAULT_FORMATION,
        draftRound: 7,
        draftSlot: null,
        options: [],
        rerolls: 0,
        rerollsUsed: 0,
        picks: [...home.lineup, ...home.bench],
        lineup: home.lineup.map((p) => p.uid),
        bench: home.bench.map((p) => p.uid),
        captainUid: home.captainUid ?? null,
        tactic: home.tactic,
        cornerPlan: home.corner,
        cornerTakerUid: home.cornerTakerUid,
        opponents: [live.rival],
        stage: 0,
        results: [],
        rewards: [],
        lockedTeam: home,
        live: { stage: 0, orders: live.orders, tick: live.tick, engine: live.engine },
    };
}

/** Seed da partida `n` no motor. */
export const ultimateSeed = (salt: string, n: number) => `ut-${salt}-${n}`;
