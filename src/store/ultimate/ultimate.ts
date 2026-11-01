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
import { countObjectives, newObjectives, type ObjectiveState, objectivesOf } from './objectives';
import {
    CUP_BRIDGE_DAY_MAX,
    EVO_ACTIVE_MAX,
    FICHAS,
    FICHAS_PACK_PRICE,
    FLOOR_METAL,
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
    PICK_PRICE,
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
    /** Objetivos que completaram nesta partida (o prêmio de cada um está em OBJECTIVES). */
    objectives?: string[];
}

export interface UltimateSave {
    /** 0 = a prévia antes da Temporada 1 (o reset vem na 0.9.33). */
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
    };
}

const progress = (u: UltimateSave) => u.opened + u.played + u.bought;
/** Nuvem x aparelho: fica o lado que andou mais (pacotes abertos + partidas + compras); empate, o que vale (`keep`). */
export function mergeUltimate(keep: unknown, other: unknown): UltimateSave {
    const k = ultimateOf(keep);
    const o = ultimateOf(other);
    return progress(o) > progress(k) ? o : k;
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

/** A espécie joga no gol (o goleiro está entre as posições dela no nível 50). */
export const isKeeperSpecies = (id: number) =>
    eligiblePositions(computeAttributes(species(id), DEFAULT_LEVEL), id).includes('GK');
const isKeeper = (c: PokemonInstance) => viewInstance(c).positions.includes('GK');

/**
 * As cartas de um Pacote Mini. Sem espécie repetida dentro do pacote; até o time ficar cheio (TEAM_SIZE cartas), nem
 * espécie que você já tem (os 2 primeiros pacotes sempre montam um time) e, sem goleiro na coleção, a 1ª carta é um
 * goleiro do metal sorteado (o time nunca começa com alguém de linha no gol).
 */
export function rollPack(u: Pick<UltimateSave, 'salt' | 'opened' | 'cards'>): PokemonInstance[] {
    const rng = new Rng(u.salt, `ut-pack-${u.opened}`);
    const owned = new Set(u.cards.map((c) => c.speciesId));
    const avoidOwned = u.cards.length < TEAM_SIZE;
    const needKeeper = avoidOwned && !u.cards.some(isKeeper);
    const taken = new Set<number>();
    const iconIds = Object.keys(ICONS).map(Number);
    return packMetals(rng).map((metal, i) => {
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

/** Pacotes pra abrir agora: os grátis do relógio + os ganhos. */
export const packsReady = (u: Pick<UltimateSave, 'packs' | 'packAt' | 'extraPacks'>, now: number) =>
    refill(u, now).packs + u.extraPacks;

/**
 * Abre um pacote (o grátis primeiro, pra o relógio voltar a contar; depois os ganhos). As novas entram na coleção e
 * enchem as vagas vazias do time, cada uma na vaga da posição dela (nunca tiram ninguém); repetida vira pontos de
 * pacote, e todo pacote aberto dá OPEN_POINTS. null = sem pacote.
 */
export function openPack(u: UltimateSave, now: number): { u: UltimateSave; pack: PackOpen } | null {
    const clock = refill(u, now);
    const free = clock.packs >= 1;
    if (!free && u.extraPacks < 1) return null;
    const cards = rollPack(u);
    const points = cards.map((c) => (isRepeat(u.cards, c) ? REPEAT_POINTS[metalOf(viewInstance(c).overall)] : 0));
    const fresh = cards.filter((_, i) => points[i] === 0);
    return {
        u: {
            ...addCards(u, fresh),
            packPoints: u.packPoints + OPEN_POINTS + points.reduce((s, p) => s + p, 0),
            packs: free ? clock.packs - 1 : clock.packs,
            packAt: clock.packAt,
            extraPacks: free ? u.extraPacks : u.extraPacks - 1,
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

/** Ponte da Copa: título da Copa = 1 Pacote Mini aqui, até CUP_BRIDGE_DAY_MAX por dia (Brasília). */
export function cupBridge(u: UltimateSave, now: number): UltimateSave {
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
    const fichas = fichasFor(u.live.level, outcome);
    const noGold = u.live.home.lineup.every((p) => metalOf(viewInstance(p).overall) !== 'ouro');
    const obj = countObjectives(u.objectives, { outcome, level: u.live.level, goals: m.score[0], noGold }, now);
    const players = [...(m.finalRoster ?? []), ...(m.subbedOut ?? [])];
    // craque do seu time (a mesma nota do MVP da partida)
    const mvp = players
        .filter((p) => p.team === 0)
        .reduce<(typeof players)[number] | null>((b, p) => (!b || mvpScore(p) > mvpScore(b) ? p : b), null);
    return {
        ...u,
        fichas: u.fichas + fichas + obj.completed.reduce((s, o) => s + o.fichas, 0),
        extraPacks: u.extraPacks + obj.completed.reduce((s, o) => s + o.packs, 0),
        objectives: obj.g,
        evos: countEvos(u.evos, players, mvp?.uid ?? null),
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
            objectives: obj.completed.map((o) => o.id),
        },
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
