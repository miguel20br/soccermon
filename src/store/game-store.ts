import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Position } from '../engine/attributes';
import { buildCupOpponents } from '../engine/cup';
import {
    FINAL_MATCH,
    GROUP_START,
    isMatchKind,
    longGroup,
    longOpponent,
    matchIndexOfRow,
    nextNodes,
} from '../engine/cup-map';
import { BENCH_SIZE, bestFit, captainOptions, DRAFT_PICKS, playerDraftOptions } from '../engine/draft';
import { EVO_THRESHOLD, evolutionTarget, evolveInstance, evoProgress } from '../engine/evolution';
import { DEFAULT_FORMATION, type FormationId, formationOf } from '../engine/formations';
import type { PokemonInstance } from '../engine/instance';
import { viewInstance } from '../engine/instance';
import { type MatchDigest, matchDigest, type PlayerLine, playerLines, teamTotals } from '../engine/match-stats';
import { everyoneIn, mvpScore } from '../engine/mvp';
import { type Reward, rewardOptions } from '../engine/rewards';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import {
    interestOf,
    packCards,
    rerollPrice,
    type ShopOffer,
    type ShopState,
    shopOffers,
    winEarnings,
} from '../engine/shop';
import {
    DESTAQUE_LEVEL_UP_RATING,
    DESTAQUE_MAX_LEVEL,
    mvpOpen,
    rollSpecial as roll,
    SPECIALS_LIVE,
    weeklyEventType,
} from '../engine/specials';
import { MAX_SPONSORS } from '../engine/sponsors';
import { teachMove } from '../engine/tm';
import { detectLang, type Lang } from '../i18n/lang';
import { type BinderCard, binderAdd, binderOf } from './binder';
import {
    type DailyEntry,
    dailyDay,
    dailyEventType,
    dailySeed,
    dailyStickerCard,
    isDailySeed,
    mergeDaily,
    putDaily,
} from './daily';
import { addDuel, type DuelRecord, duelWins, MAX_DUELS } from './duels';
import {
    type CupMode,
    cupLength,
    currentNode,
    groupQualified,
    groupTable,
    isFinalStage,
    isGroupStage,
    isLong,
    isOut,
    type LongRunFields,
    longRound,
    newLongFields,
    putsOutOnCourt,
    tickOut,
    YELLOW_CARDS,
} from './long-cup';
import { resolveEvent, rollEvent } from './long-events';
import { activeTitle, activeTrainer, matchView, newMissions, stageView } from './missions';
import { withSeenBaseline } from './news';
import {
    type Career,
    clubColorHex,
    DEFAULT_PROFILE,
    type Dex,
    type DexLine,
    EDITION_BIT,
    EMPTY_CAREER,
    EMPTY_ENTRY,
    editionBits,
    type HallEntry,
    MAX_HALL,
    type MoveDex,
    markOvr,
    markPlayed,
    markSeen,
    movesFound,
    type Profile,
    playedLine,
    recordEditions,
    recordMatchInCareer,
    recordMatchInDex,
    recordMovesSeen,
    recordTitleInDex,
    seenCount,
    tagFromName,
} from './profile';
import { screenTransition } from './screen-transition';

/** Edição especial só quando as cartas novas estão no jogo. */
const rollSpecial: typeof roll = (inst, ev) => (SPECIALS_LIVE ? roll(inst, ev) : inst);

import { ENGINE_VERSION } from '../engine/config';
import type { CornerPlan, MatchOrder, Tactic, TeamSetup } from '../engine/state';

export type Screen =
    | 'home'
    | 'draft'
    | 'lineup'
    | 'match'
    | 'result'
    | 'reward'
    | 'settings'
    | 'credits'
    | 'profile'
    | 'help'
    | 'duel'
    | 'daily'
    | 'liga'
    | 'liga-match'
    | 'collection'
    | 'trophies'
    | 'shop'
    | 'map'
    | 'treino'
    | 'event'
    | 'group';
export type CryStyle = 'legacy' | 'latest';
export type PlaybackSpeed = 1 | 2 | 4 | 8 | 'highlights';

/** Cor padrão do seu time (Vermelho). A cor de verdade vem do perfil: `clubColorHex(profile.clubColor)`. */
export const PLAYER_COLOR = 0xe8423f;
export const START_REROLLS = 2;

export interface StageResult {
    stage: number;
    opponent: string;
    score: [number, number];
    shootout: [number, number] | null;
    won: boolean;
    /** Craque do seu time que virou carta Destaque nesta partida. */
    destaqueUid?: string | null;
    /** Foi a Final (Copa longa tem 8 partidas: a 4ª não é a final). Partidas antigas: `stage === 3`. */
    final?: boolean;
    /** Resumo da partida para as estatísticas da copa (partidas antigas não têm). */
    stats?: StageStats;
    /**
     * O que basta pra rodar a partida de novo, igual (gol da copa em replay): seu time travado e as ordens do técnico;
     * o rival e a seed já estão no run. Só quando o seu time fez gol. Partidas antigas não têm; com outro
     * `ENGINE_VERSION` a partida sairia diferente, então o replay some.
     */
    replay?: { team: TeamSetup; orders: MatchOrder[]; engine: number };
}

/** Resumo de uma partida guardado no run (o MatchResult inteiro é grande demais para salvar). */
export interface StageStats {
    possession: [number, number];
    shots: [number, number];
    shotsOnTarget: [number, number];
    players: {
        uid: string;
        speciesId: number;
        /** Carta shiny (partidas antes da 0.8.8 não têm: ficam com o sprite normal). */
        shiny?: boolean;
        name: string;
        role: string;
        rating: number;
        minutes: number;
        distance: number;
        goals: number;
        assists: number;
        shots: number;
        passes: number;
        passesCompleted: number;
        tacklesWon: number;
        interceptions: number;
        saves: number;
        movesUsed: number;
    }[];
    /** Gols, golpes, evoluções e intervalo (partidas antes da 0.8.2 não têm). */
    digest?: MatchDigest;
}

/** O que o título trouxe de novo, calculado no apito final (antes de somar no perfil). */
export interface ChampMemo {
    titleNo: number;
    /** Nº da copa perfeita (null se não foi perfeita). */
    perfectNo: number | null;
    /** Espécies que bateram a melhor nota de partida delas nesta copa. */
    newBests: { speciesId: number; name: string; rating: number }[];
    /** Espécies que ganharam o primeiro título. */
    firstTitles: number[];
    /** O desfile do Hall da Fama já passou (só aparece uma vez). */
    paraded?: boolean;
}

export type RunStatus =
    | 'formation'
    | 'captain'
    | 'drafting'
    | 'lineup'
    | 'reward'
    | 'shop'
    | 'map'
    | 'treino'
    | 'event'
    | 'group'
    | 'eliminated'
    | 'champion';

/** Run do modo copa (roguelike). Separada do futuro CareerSave. */
export interface RunState extends LongRunFields {
    schemaVersion: 3;
    seed: string;
    teamName: string;
    status: RunStatus;
    formation: FormationId;
    /** Rodada do draft: 0 = capitão, 1..6 = vagas. */
    draftRound: number;
    /** Vaga escolhida na rodada atual (opções só aparecem depois dela). */
    draftSlot: SlotRef | null;
    options: PokemonInstance[];
    /** Rerolls restantes (servem no draft e nas recompensas) e quantos já foram gastos (entra na seed). */
    rerolls: number;
    rerollsUsed: number;
    picks: PokemonInstance[];
    /** uids nas vagas da formação; '' = vaga aberta durante o draft */
    lineup: string[];
    bench: string[];
    captainUid: string | null;
    tactic: Tactic;
    /** Instrução de escanteio (padrão: Variar) e quem cobra (padrão: automático). Saves antigos não têm. */
    cornerPlan?: CornerPlan;
    cornerTakerUid?: string | null;
    opponents: TeamSetup[];
    stage: number;
    results: StageResult[];
    rewards: Reward[];
    /**
     * Partida iniciada e ainda sem resultado: o time fica travado até o apito final
     * (sair no meio e voltar retoma a mesma partida, sem trocar escalação).
     */
    lockedTeam: TeamSetup | null;
    /** Tipo em evento quando a copa começou (cartas Evento desse tipo no draft). */
    eventType?: string | null;
    /**
     * Partida em andamento: ordens do técnico e até onde foi assistida. Sair e voltar retoma do mesmo ponto
     * com as mesmas ordens (antes dava para sair e tentar de novo até ganhar).
     */
    live?: LiveMatch | null;
    /** Começo e fim da copa (ms), para a duração na tela do título. */
    startedAt?: number;
    endedAt?: number;
    champ?: ChampMemo;
    /** Pokédex (vistos) e golpes descobertos quando a copa começou: o fim da copa mostra quanto cresceu. */
    startCounts?: { seen: number; moves: number };
    /** Rodada do draft em que o jogador tocou em "Monta pra mim" (sem = montou tudo na mão). */
    autoFrom?: number;
    /** Copa do Dia: o dia ('2026-10-19'). Sem = copa normal. */
    daily?: string;
    /** ₽ (Pokédólar) da copa: só existe dentro dela (docs/planos/copa-roguelike-plano.md). Copas antigas: 0. */
    money?: number;
    /** Patrocínios comprados (ids de src/engine/sponsors.ts), até 3. */
    sponsors?: string[];
    /** Mercado aberto (status 'shop'). */
    shop?: (ShopState & { pack?: PokemonInstance[] }) | null;
    /** Pacotes de tipo abertos na copa (entra na seed do próximo). */
    packs?: number;
}

/** O Mercado vem depois da recompensa de cada vitória, menos na Copa do Dia (e não há Mercado depois da final). */
export const hasShop = (run: Pick<RunState, 'daily' | 'mode'>) => !run.daily && !isLong(run);

export interface LiveMatch {
    stage: number;
    orders: MatchOrder[];
    tick: number;
    /** `ENGINE_VERSION` de quando a partida começou (sem = antes da 0.8.4). */
    engine?: number;
}

/** Partida em andamento desta fase, se ainda for do mesmo motor (senão recomeça do 0 a 0). */
export const liveOf = (run: { stage: number; live?: LiveMatch | null } | null | undefined): LiveMatch | null =>
    run?.live && run.live.stage === run.stage && run.live.engine === ENGINE_VERSION ? run.live : null;

export type NamesOnField = 'all' | 'mine' | 'none';
export type ArrowSize = 'small' | 'medium' | 'large';
export type ReduceMotion = 'system' | 'on' | 'off';
/** Velocidade a que a partida cai na chance de gol (0 = não cai). */
export type ChanceSpeed = 0 | 1 | 2 | 4;

export interface Settings {
    cries: CryStyle;
    /**
     * Escolheu o estilo dos gritos em Configurações. Sem isso vale o padrão, que virou o Novo ('latest') na 0.8.9:
     * o save antigo não separava "escolheu Gen 1" de "ficou no padrão", então o Gen 1 antigo conta como padrão.
     */
    criesChosen?: boolean;
    /** Volume geral (0..1); gritos e efeitos têm o próprio volume por cima dele. */
    volume: number;
    criesVolume: number;
    sfxVolume: number;
    crowdVolume: number;
    /** Grito de gol: o cry do capitão toca junto com a torcida no seu gol. */
    goalCry: boolean;
    /** Velocidade com que a partida começa. */
    speed: PlaybackSpeed;
    cinematic: boolean;
    /** Velocidade nas chances de gol (gol, trave, defesa), mesmo no 8x. */
    chanceSpeed: ChanceSpeed;
    /** Nomes dos Pokémon na quadra. */
    namesOnField: NamesOnField;
    /** Setinha na cabeça dos Pokémon do seu time. */
    arrowSize: ArrowSize;
    /** Menos tremida, flash e zoom ('system' segue o "reduzir movimento" do aparelho). */
    reduceMotion: ReduceMotion;
    /** Dicas do "Como jogar" nas telas. */
    tips: boolean;
    /** Pedir confirmação antes de sair de uma partida em andamento. */
    confirmLeave: boolean;
    /** Enviar estatísticas anônimas do jogo (sem conta, sem cookie). */
    stats: boolean;
    /** Idioma (o padrão segue o navegador). */
    lang: Lang;
    /** Experimento "beira da quadra" (agência do técnico na partida): desligado por padrão. */
    agency?: boolean;
    /** Vibração curta nos toques que pesam (Android; o iPhone não vibra pela web). Sem = ligada. */
    haptics?: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    // gritos modernos por padrão desde a 0.8.9 (o Gen 1 continua em Configurações)
    cries: 'latest',
    volume: 0.6,
    criesVolume: 1,
    sfxVolume: 1,
    crowdVolume: 1,
    goalCry: true,
    // quem nunca jogou começa em 1x pra ver a partida (decidido em 18/10/2026); a velocidade que a pessoa escolher na
    // partida ou em Configurações fica salva e vira a dela
    speed: 1,
    cinematic: true,
    chanceSpeed: 1,
    namesOnField: 'all',
    arrowSize: 'medium',
    reduceMotion: 'system',
    tips: true,
    confirmLeave: true,
    stats: true,
    lang: detectLang(),
    agency: false,
};

export interface Records {
    cups: number;
    titles: number;
    perfect: number;
    /** Copas longas jogadas e ganhas (também contam em `cups`/`titles`: um título é um título). */
    longCups?: number;
    longTitles?: number;
    /** Cartas Destaque conquistadas e Ícones escalados. */
    destaques?: number;
    icones?: number;
    /** Evoluções no meio da partida (do seu time). */
    evolucoes?: number;
    /** Títulos seguidos (copa perdida ou abandonada zera) e a melhor sequência. */
    streak?: number;
    bestStreak?: number;
    /** Vitórias no Duelo (o histórico guarda só os 30 últimos; a medalha Duelista conta por aqui). */
    duelWins?: number;
}

export type SlotRef = { zone: 'lineup' | 'bench'; index: number };

/** Estado do jogo (save + tela atual). */
export type GameState = GameStore;
export interface GameStore {
    screen: Screen;
    run: RunState | null;
    settings: Settings;
    records: Records;
    profile: Profile;
    /** Pokédex: espécies vistas/jogadas e a carreira de cada uma. */
    dex: Dex;
    /** Golpes descobertos (vistos em campo nas suas partidas). */
    moves: MoveDex;
    career: Career;
    /**
     * Já passou da entrada: começou a 1ª copa ou viu o passo a passo (o funil conta `onboarding_done` aqui). A 1ª
     * visita não abre mais o passo a passo: a Home e o "Nova copa" são o caminho, e as dicas aparecem no lugar.
     */
    onboarded: boolean;
    /** Passo a passo aberto agora (pedido na Ajuda). Não vai pro save. */
    tour: boolean;
    /**
     * Copas em andamento guardadas para depois (a mais recente primeiro). Nascem quando o save do aparelho e o
     * da conta têm copas diferentes: a escolhida continua e a outra fica aqui, nunca some sem aviso.
     */
    parkedRuns: RunState[];
    /** Hall da Fama: os títulos, do mais recente ao mais antigo. */
    hall: HallEntry[];
    /** Álbum de cartas: a melhor carta especial de cada espécie × edição, com quantas você tirou (binder.ts). */
    binder: BinderCard[];
    /** Duelos amistosos (só no save), do mais recente ao mais antigo. */
    duels: DuelRecord[];
    recordDuel(rec: DuelRecord): void;
    /** Copas do Dia jogadas (do dia mais recente ao mais antigo). */
    daily: DailyEntry[];
    /**
     * Começa a Copa do Dia de hoje (1 tentativa: a entrada do dia nasce agora, recarregar não dá outra). A copa em
     * andamento, se houver, vai pras copas guardadas. `ranked`: o servidor registrou a tentativa.
     */
    startDaily(ranked: boolean): void;
    /** O servidor já recebeu até a partida `n` da Copa do Dia de `day`. */
    markDailyReported(day: string, n: number): void;
    /** Duelo e Liga na Pokédex: quem jogou 1+ minuto pelo seu lado vira "jogou" (só isso), o rival fica "visto". */
    recordDuelDex(m: MatchResult, side: 0 | 1): void;
    /** Partida atual (não persistida — snapshots são grandes). */
    match: MatchResult | null;
    /** Missões cumpridas agora há pouco, na fila do aviso (não persistida: o aviso é só na hora). */
    unlockQueue: string[];
    /** O aviso do primeiro da fila já passou. */
    shiftUnlock(): void;
    go(screen: Screen): void;
    newRun(teamName?: string, seed?: string, daily?: string, mode?: CupMode): void;
    /** Copa longa: entra numa casa do mapa (partida, Mercado, Baú, Treino ou Evento). */
    enterNode(id: string): void;
    /** Treino da Copa longa: `evo` = enche a barra de evolução de `uid`; `rest` = +1 troca. */
    train(choice: 'evo' | 'rest', uid?: string): void;
    /** Copa longa: a parte `id` da história já foi contada. */
    tell(id: string): void;
    /** Rota Índigo, no Planalto: joga a próxima rodada do grupo (ou a Final). */
    playNext(): void;
    /** Evento "?" da Copa longa: aplica a escolha (com quem, qual carta, o novo capitão) e volta pro mapa. */
    chooseEvent(choice: string, target?: string, card?: number, captain?: string): void;
    abandonRun(): void;
    chooseFormation(id: FormationId): void;
    chooseSlot(slot: SlotRef): void;
    /** Capitão: precisa da vaga. Rodadas seguintes: usa a vaga escolhida. */
    pick(uid: string, slot?: SlotRef): void;
    reroll(): void;
    /**
     * "Monta pra mim": completa o draft daqui pra frente (formação atual, capitão e cada vaga com a carta de maior
     * nota nela, nas mesmas opções que o jogador veria) e vai pra escalação. `captainUid`: o capitão já escolhido.
     */
    autoDraft(captainUid?: string): void;
    swapSlots(a: SlotRef, b: SlotRef): void;
    setFormation(id: FormationId): void;
    setTactic(t: Tactic): void;
    setCorner(patch: { cornerPlan?: CornerPlan; cornerTakerUid?: string | null }): void;
    moveItem(fromUid: string, toUid: string): void;
    setMatch(m: MatchResult | null): void;
    lockMatch(team: TeamSetup): void;
    /** Guarda as ordens e o ponto da partida em andamento. */
    saveLive(patch: Partial<Omit<LiveMatch, 'stage'>>): void;
    recordResult(m: MatchResult): void;
    /** O desfile do Hall da Fama já passou nesta copa. */
    markParaded(): void;
    /**
     * Pega a recompensa. MT: `forgetSlot` é a vaga do golpe esquecido (ou o tamanho do moveset, se há vaga).
     * Item: se quem recebe já segura um, `passTo` é quem fica com o antigo (sem `passTo`, o antigo é descartado).
     */
    claimReward(index: number, targetUid: string, forgetSlot?: number, passTo?: string): void;
    skipReward(): void;
    rerollReward(): void;
    /**
     * Compra no Mercado (mesmos alvos da recompensa). Pacote: abre e as cartas ficam em `shop.pack` até `claimPack`.
     * Patrocínio com as 3 vagas cheias: `targetUid` = o id do Patrocínio que sai.
     */
    buyOffer(index: number, targetUid?: string, forgetSlot?: number, passTo?: string): void;
    /** Fica com a carta `index` do pacote aberto, no lugar do reserva `targetUid`. */
    claimPack(index: number, targetUid: string): void;
    /** Fecha o pacote aberto sem pegar nenhuma carta (já foi pago; o time fica como está). */
    skipPack(): void;
    rerollShop(): void;
    leaveShop(): void;
    advance(): void;
    updateSettings(patch: Partial<Settings>): void;
    updateProfile(patch: Partial<Profile>): void;
    setOnboarded(done: boolean): void;
    setTour(open: boolean): void;
    /** Retoma uma copa guardada; a atual, se estiver em andamento, vai para o lugar dela. */
    resumeParked(seed: string): void;
    /** Joga fora uma copa guardada (o jogador confirmou). */
    discardParked(seed: string): void;
}

/** Quantas copas guardadas cabem no save (passou disso, sai a mais antiga). */
export const MAX_PARKED = 3;

/** Tela em que a copa continua (Continuar na Home): a do status; partida e fim de partida voltam pra escalação. */
export function resumeScreenOf(status: RunStatus): Screen {
    if (status === 'formation' || status === 'captain' || status === 'drafting') return 'draft';
    if (
        status === 'reward' ||
        status === 'shop' ||
        status === 'map' ||
        status === 'treino' ||
        status === 'event' ||
        status === 'group'
    )
        return status;
    return 'lineup';
}

/** Copa ainda em jogo (não terminou em título nem em eliminação). */
export const isCupInProgress = (run: RunState | null | undefined): run is RunState =>
    !!run && run.status !== 'eliminated' && run.status !== 'champion';

const idbStorage: StateStorage = {
    getItem: async (name) => (await get(name)) ?? null,
    setItem: (name, value) => set(name, value),
    removeItem: (name) => del(name),
};

export const isDraftComplete = (run: RunState) => [...run.lineup, ...run.bench].every((u) => u !== '');
export const slotRole = (run: RunState, slot: SlotRef) =>
    slot.zone === 'bench' ? 'ANY' : formationOf(run.formation).slots[slot.index];

function rollCaptains(run: RunState): PokemonInstance[] {
    const rng = new Rng(run.seed, `captain-r${run.rerollsUsed}`);
    return captainOptions(rng, new Set()).map((o) => rollSpecial(o, run.eventType ?? null));
}

function rollOptions(run: RunState, slot: SlotRef): PokemonInstance[] {
    const taken = new Set(run.picks.map((p) => p.speciesId));
    const role = slotRole(run, slot);
    const rng = new Rng(run.seed, `draft-${run.draftRound}-${role}-r${run.rerollsUsed}`);
    // Copa longa: o time começa mais fraco (uma linha abaixo; o capitão continua raro) e cresce pelo mapa
    const round = isLong(run) ? Math.max(0, run.draftRound - 1) : run.draftRound;
    return playerDraftOptions(rng, round, taken, role).map((o) => rollSpecial(o, run.eventType ?? null));
}

/** Recompensas da fase; o reforço sorteado (não o contratado do adversário) pode vir com edição especial. */
function rollRewards(run: RunState, reroll: number): Reward[] {
    const extra = run.sponsors?.includes('cinnabar') ? 1 : 0;
    // Copa longa: sorteio pela casa do mapa e raridade pelo andar (o Baú vem uma linha acima)
    const node = currentNode(run);
    const long = isLong(run)
        ? {
              key: run.at ?? `m${run.stage}`,
              round: Math.min(6, longRound(run.stage) + (node?.kind === 'bau' ? 1 : 0)),
          }
        : undefined;
    const defeated = node?.kind === 'bau' ? undefined : defeatedOf(run);
    return rewardOptions(run.seed, run.stage, reroll, run.picks, defeated, extra, long).map((r) =>
        r.kind === 'pokemon' && !r.from ? { ...r, inst: rollSpecial(r.inst, run.eventType ?? null) } : r,
    );
}

/** A recompensa ou a compra entra no time (o mesmo caminho pra recompensa grátis e o Mercado). null = alvo inválido. */
function grant(
    run: RunState,
    reward: Exclude<Reward | ShopOffer, { kind: 'pack' | 'sponsor' }>,
    targetUid: string,
    forgetSlot?: number,
    passTo?: string,
): { picks: PokemonInstance[]; bench: string[] } | null {
    let picks = run.picks;
    let bench = run.bench;
    if (reward.kind === 'pokemon') {
        // nunca dois da mesma espécie (pacote e vitrine do Mercado podem trazer o mesmo Pokémon)
        if (run.picks.some((p) => p.speciesId === reward.inst.speciesId && p.uid !== targetUid)) return null;
        // reforço entra no banco no lugar do reserva escolhido (nunca o capitão);
        // o item do reserva que sai passa para o reforço
        const benchIdx = run.bench.indexOf(targetUid);
        if (benchIdx < 0 || targetUid === run.captainUid) return null;
        const leaving = run.picks.find((p) => p.uid === targetUid);
        const incoming = { ...reward.inst, item: reward.inst.item ?? leaving?.item ?? null };
        bench = run.bench.map((u, i) => (i === benchIdx ? incoming.uid : u));
        picks = [...run.picks.filter((p) => p.uid !== targetUid), incoming];
    } else if (reward.kind === 'tm') {
        // MT: o escolhido esquece um golpe (nunca a assinatura) e aprende o novo
        const target = run.picks.find((p) => p.uid === targetUid);
        const taught = target && forgetSlot !== undefined && teachMove(target, reward.move, forgetSlot);
        if (!taught) return null;
        picks = run.picks.map((p) => (p.uid === targetUid ? taught : p));
    } else {
        // o item antigo de quem recebe vai pra quem o jogador escolheu (se escolheu)
        const old = run.picks.find((p) => p.uid === targetUid)?.item ?? null;
        picks = run.picks.map((p) =>
            p.uid === targetUid
                ? { ...p, item: reward.item }
                : old && passTo && p.uid === passTo
                  ? { ...p, item: old }
                  : p,
        );
    }
    return { picks, bench };
}

/** Próxima fase: escalação. */
const toLineup = (run: RunState): RunState => ({ ...run, status: 'lineup', stage: run.stage + 1 });
/** Copa longa: de volta pro mapa (a próxima partida é a casa que você escolher). */
const toMap = (run: RunState): RunState => ({ ...run, status: 'map', shop: null, rewards: [] });
/**
 * Rota Índigo: depois do mapa (Treino da última linha) e entre as partidas do grupo, a tabela do grupo no Planalto.
 * Os rivais do grupo são sorteados na primeira vez (clubes de ginásio que você ainda não enfrentou).
 */
const toGroup = (run: RunState): RunState => ({
    ...run,
    status: 'group',
    shop: null,
    rewards: [],
    group: run.group ?? {
        rivals: longGroup(
            run.seed,
            run.opponents.filter(Boolean).map((o) => o.name),
        ),
    },
});
/** Volta pro lugar certo da Rota: o grupo (já chegou no Planalto) ou o mapa. */
const backToRoute = (run: RunState): { run: RunState; screen: Screen } =>
    run.group || (run.map && nextNodes(run.map, run.at ?? null).length === 0)
        ? { run: toGroup(run), screen: 'group' }
        : { run: toMap(run), screen: 'map' };

/** Vitrine do Mercado desta fase (a `reroll`-ésima troca). */
function rollShop(run: RunState, reroll: number): ShopOffer[] {
    return shopOffers({
        seed: run.seed,
        stage: run.stage,
        reroll,
        team: run.picks,
        sponsors: run.sponsors ?? [],
        eventType: run.eventType ?? null,
        captain: run.picks.find((p) => p.uid === run.captainUid) ?? null,
        ...(isLong(run) && { long: { key: run.at ?? `m${run.stage}`, round: longRound(run.stage) } }),
        matchesLeft: cupLength(run) - run.stage - 1,
    });
}

export function playerTeam(run: RunState, color = clubColorHex(useGame.getState().profile.clubColor)): TeamSetup {
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    return {
        name: run.teamName,
        lineup: run.lineup.map((u) => byUid.get(u)!),
        // quem está fora (Copa longa: lesão, Creche) não vai pro banco da partida, então não tem como entrar
        bench: run.bench.filter((u) => !isOut(run, u)).map((u) => byUid.get(u)!),
        tactic: run.tactic,
        color,
        ...(run.sponsors?.length && { sponsors: run.sponsors }),
        formation: run.formation,
        captainUid: run.captainUid,
        manualSubs: true,
        corner: run.cornerPlan ?? 'mixed',
        cornerTakerUid: run.cornerTakerUid ?? null,
    };
}

/** Time eliminado na fase atual (de onde dá para contratar um Pokémon). */
const defeatedOf = (run: RunState) => {
    const opp = run.opponents[run.stage];
    return opp ? { name: opp.name, players: [...opp.lineup, ...opp.bench] } : undefined;
};
/** Posição em que ele está escalado (titular), para a carta mostrar os números daquela vaga. */
export const lineupPosition = (run: RunState, uid: string): Position | undefined => {
    const i = run.lineup.indexOf(uid);
    return i >= 0 ? formationOf(run.formation).slots[i] : undefined;
};

/** Sequência de títulos depois de uma copa que acabou (ganha soma; perdida ou abandonada zera). */
export function streakAfter(r: Records, won: boolean): Pick<Records, 'streak' | 'bestStreak'> {
    const streak = won ? (r.streak ?? 0) + 1 : 0;
    return { streak, bestStreak: Math.max(r.bestStreak ?? 0, streak) };
}

export const isPerfectCup = (run: RunState) =>
    run.status === 'champion' && run.results.every((r) => r.won && r.score[1] === 0);

/** O que o título trouxe de novo, comparando com os recordes e a Pokédex de antes dele. */
export function champMemo(run: RunState, records: Records, dexBefore: Dex): ChampMemo {
    const best = new Map<number, { name: string; rating: number }>();
    for (const r of run.results)
        for (const p of r.stats?.players ?? []) {
            if (p.minutes < 1) continue;
            const cur = best.get(p.speciesId);
            if (!cur || p.rating > cur.rating) best.set(p.speciesId, { name: p.name, rating: p.rating });
        }
    const newBests = [...best]
        // recorde que vale festa: nota alta (7,5+) acima da melhor que ele já teve pelo seu time
        .filter(
            ([id, b]) =>
                b.rating >= 7.5 && (dexBefore[id]?.matches ?? 0) > 0 && b.rating > (dexBefore[id]?.bestRating ?? 0),
        )
        .map(([speciesId, b]) => ({ speciesId, ...b }))
        .sort((a, b) => b.rating - a.rating);
    return {
        titleNo: records.titles + 1,
        perfectNo: isPerfectCup(run) ? records.perfect + 1 : null,
        newBests,
        firstTitles: [...best.keys()].filter((id) => (dexBefore[id]?.titles ?? 0) === 0),
    };
}

/** Entrada do Hall da Fama: o elenco campeão com nota de carta e gols na copa. */
export function hallEntry(run: RunState, profile: Profile): HallEntry {
    const goals = new Map<string, number>();
    for (const r of run.results)
        for (const p of r.stats?.players ?? []) goals.set(p.uid, (goals.get(p.uid) ?? 0) + p.goals);
    const squad = [...run.lineup, ...run.bench]
        .map((uid) => run.picks.find((p) => p.uid === uid))
        .filter((p): p is PokemonInstance => !!p)
        .map((p) => {
            const v = viewInstance(p);
            return {
                speciesId: p.speciesId,
                shiny: p.shiny,
                name: v.displayName,
                ovr: v.overall,
                goals: goals.get(p.uid) ?? 0,
                captain: p.uid === run.captainUid,
            };
        });
    return {
        id: run.seed,
        date: run.endedAt ?? Date.now(),
        club: run.teamName,
        clubColor: profile.clubColor,
        formation: run.formation,
        titleNo: run.champ?.titleNo ?? 1,
        perfect: isPerfectCup(run),
        scores: run.results.map((r) => [r.score[0], r.score[1]]),
        squad,
        trainer: activeTrainer(profile),
        trainerTitle: activeTitle(profile),
        ...(run.mode && { mode: run.mode }),
    };
}

/** A Copa do Dia em andamento acabou (a copa saiu do lugar): a tentativa do dia fecha com o que tinha. */
function closeDaily(s: Pick<GameStore, 'run' | 'daily'>): DailyEntry[] {
    const day = s.run?.daily;
    if (!day || !isCupInProgress(s.run)) return s.daily;
    return s.daily.map((e) => (e.day === day ? { ...e, done: true } : e));
}

/** Copa do Dia depois de uma partida: placar no histórico do dia; acabou no título ou na eliminação. */
export function dailyAfter(list: DailyEntry[], run: RunState, day: string): DailyEntry[] {
    const cur = list.find((e) => e.day === day) ?? { day, results: [], done: false, champion: false };
    return putDaily(list, {
        ...cur,
        results: run.results.map((r) => ({
            score: [r.score[0], r.score[1]],
            shootout: r.shootout,
            won: r.won,
            opponent: r.opponent,
        })),
        done: !isCupInProgress(run),
        champion: run.status === 'champion',
    });
}

/** Lê `?seed=` da URL (desafio compartilhado). A seed da Copa do Dia não vale aqui (seria treino da tentativa). */
export function seedFromUrl(): string | null {
    try {
        const seed = new URLSearchParams(window.location.search).get('seed');
        return seed && /^[a-z0-9-]{1,32}$/i.test(seed) && !isDailySeed(seed) ? seed : null;
    } catch {
        return null;
    }
}

/** O que vai para o IndexedDB (e para a nuvem). */
export type PersistedSave = Pick<
    GameStore,
    | 'run'
    | 'settings'
    | 'records'
    | 'profile'
    | 'dex'
    | 'moves'
    | 'career'
    | 'onboarded'
    | 'parkedRuns'
    | 'hall'
    | 'duels'
    | 'daily'
    | 'binder'
>;

/** A parte do estado que é save (IndexedDB, nuvem, backup). */
export const savePart = (s: PersistedSave): PersistedSave => ({
    run: s.run,
    settings: s.settings,
    records: s.records,
    profile: s.profile,
    dex: s.dex,
    moves: s.moves,
    career: s.career,
    onboarded: s.onboarded,
    parkedRuns: s.parkedRuns,
    hall: s.hall,
    duels: s.duels,
    daily: s.daily,
    binder: s.binder,
});

/** Copa salva com formato aceitável (save importado ou da nuvem): senão é descartada, não trava o jogo. */
const runShapeOk = (r: unknown): r is RunState => {
    const o = r as Partial<RunState> | null;
    return (
        !!o &&
        typeof o === 'object' &&
        typeof o.seed === 'string' &&
        [o.picks, o.lineup, o.bench, o.opponents, o.results].every(Array.isArray)
    );
};

/** Estilo dos gritos: quem nunca escolheu em Configurações fica no padrão (o Novo). */
export function withCryDefault(settings: Settings): Settings {
    return settings.criesChosen ? settings : { ...settings, cries: DEFAULT_SETTINGS.cries };
}

/** Versão atual do save (a mesma do `persist`). */
export const SAVE_VERSION = 9;

/**
 * Álbum de edições pra quem já jogava (v9): o que dá pra saber do save. Quem jogou ganha a Normal (quase toda carta
 * é Normal); o Hall da Fama dá a Shiny; as copas guardadas dão a edição de cada carta que jogou (a Destaque só se
 * jogou depois de virar Destaque). `normal` = false (ao abrir o jogo): só as edições especiais, sem dar a Normal a quem
 * só jogou com carta especial.
 */
export function backfillEditions(
    dex: Dex,
    hall: HallEntry[],
    runs: (RunState | null | undefined)[],
    normal = true,
): Dex {
    const got: [number, number][] = normal ? Object.keys(dex).map((id) => [Number(id), EDITION_BIT.normal]) : [];
    for (const h of hall) for (const p of h.squad) if (p.shiny) got.push([p.speciesId, EDITION_BIT.shiny]);
    for (const r of runs) {
        if (!r) continue;
        for (const res of r.results)
            for (const line of res.stats?.players ?? []) {
                const card = r.picks.find((p) => p.uid === line.uid);
                if (!card || line.minutes < 1) continue;
                const starAt = r.results.find((x) => x.destaqueUid === card.uid)?.stage ?? Infinity;
                const asPlayed =
                    card.special?.kind === 'destaque' && res.stage <= starAt ? { ...card, special: null } : card;
                got.push([line.speciesId, editionBits(asPlayed)]);
            }
    }
    return recordEditions(dex, got);
}

/**
 * Linhas da partida pra Pokédex, com o lado `side` como time 0: quem evoluiu em campo jogou com as duas formas (a
 * linha já vem com a forma nova; a de antes entra com os minutos até a evolução e a nova fica só com o resto, sem
 * dobrar a passagem). Copa e Duelo passam por aqui.
 */
export function dexLines(m: MatchResult, side: 0 | 1 = 0, all: PlayerLine[] = playerLines(m)): DexLine[] {
    const lines = side === 0 ? all : all.map((l) => ({ ...l, team: (1 - l.team) as 0 | 1 }));
    const preEvo = m.events.flatMap((e) => {
        if (e.type !== 'evolve' || e.team !== side) return [];
        const line = lines.find((l) => l.team === 0 && l.uid === e.uid);
        const inAt = m.events.find((x) => x.type === 'sub' && x.inUid === e.uid)?.minute ?? 0;
        if (!line) return [];
        const minutes = Math.max(0, Math.min(line.minutes, Math.round(e.minute - inAt)));
        // evoluiu no apito inicial ou no último minuto: a forma que ficou segundos em quadra também jogou
        const evoForm = playedLine(line);
        return [
            {
                ...line,
                speciesId: e.from,
                minutes,
                rating: 0,
                stats: { ...line.stats, goals: 0, assists: 0 },
                evoForm,
            },
        ];
    });
    const rest = lines.map((l) => {
        const pre = l.team === 0 && preEvo.find((x) => x.uid === l.uid);
        return pre ? { ...l, minutes: l.minutes - pre.minutes, evoForm: pre.evoForm } : l;
    });
    return [...rest, ...preEvo];
}

/**
 * Quem evoluiu em quadra numa versão antiga ficou com só uma das formas como "jogou" na Pokédex: a carta evoluída
 * (`evolved`) das copas guardadas prova que a forma nova jogou, e as evoluções do resumo de cada partida provam que a
 * forma de antes também (ela jogou até evoluir), com a figurinha da carta. Só copas que estão no save (a atual e as
 * guardadas), não o Hall.
 */
export function markEvolvedPlayed(dex: Dex, runs: (RunState | null | undefined)[]): Dex {
    let out: Dex | null = null;
    const stickers: [number, number][] = [];
    // figurinha da carta como ela é (Destaque fica de fora: pode ter vindo depois da evolução)
    const bits = (p: PokemonInstance | undefined) =>
        p ? editionBits({ shiny: p.shiny, special: p.special?.kind === 'destaque' ? null : p.special }) : 0;
    const mark = (id: number, card: PokemonInstance | undefined) => {
        if (card) stickers.push([id, bits(card)]);
        if (((out ?? dex)[id]?.matches ?? 0) > 0) return;
        out ??= { ...dex };
        out[id] = { ...(out[id] ?? EMPTY_ENTRY), matches: 1 };
    };
    for (const r of runs) {
        for (const p of r?.picks ?? []) if (p.evolved) mark(p.speciesId, p);
        for (const res of r?.results ?? [])
            for (const e of res.stats?.digest?.evolutions ?? [])
                mark(
                    e.from,
                    r?.picks.find((p) => p.uid === e.uid),
                );
    }
    return recordEditions(out ?? dex, stickers);
}

/**
 * Recordes que o Hall da Fama já prova: juntar nuvem e aparelho pelo maior de cada número podia deixar 2 títulos no
 * Hall e 1 no Perfil (e a missão contando 2). Copas nunca ficam abaixo dos títulos.
 */
export function settleRecords(r: Records, hall: HallEntry[]): Records {
    const titles = Math.max(r.titles, hall.length);
    const perfect = Math.max(r.perfect, hall.filter((h) => h.perfect).length);
    const cups = Math.max(r.cups, titles);
    return titles === r.titles && perfect === r.perfect && cups === r.cups ? r : { ...r, titles, perfect, cups };
}

/**
 * Missões que o save já garante (sem aviso: é retroativo). Feitos de partida contam pelas partidas guardadas nas
 * copas do save (o resumo de cada uma); o resto sai de recordes, Pokédex, golpes, carreira e Hall da Fama.
 */
export function withUnlocks(saved: PersistedSave): PersistedSave {
    const records = settleRecords(saved.records, saved.hall);
    const save = records === saved.records ? saved : { ...saved, records };
    const runs = [save.run, ...save.parkedRuns];
    const fresh = newMissions(
        { ...save, runs, done: save.profile.missionsDone },
        runs.flatMap((r) => r?.results ?? []).map(stageView),
    );
    // selo NOVO: save de antes dele conta o que já tinha como visto (depois das missões retroativas)
    return withSeenBaseline(
        fresh.length
            ? { ...save, profile: { ...save.profile, missionsDone: [...save.profile.missionsDone, ...fresh] } }
            : save,
    );
}

/**
 * Atualiza um save antigo (ou importado de um arquivo) para o formato atual. Versões antigas tinham outro
 * formato de draft: descarta a run e mantém o resto. Na v5 a Pokédex nasce com o que dá para tirar da copa
 * em andamento, e quem já jogava não vê o passo a passo de boas-vindas de novo.
 */
export function migrateSave(old: Partial<PersistedSave>, version: number): PersistedSave {
    const settings = withCryDefault({ ...DEFAULT_SETTINGS, ...old.settings });
    const records = old.records ?? { cups: 0, titles: 0, perfect: 0 };
    const run = version < 3 || !old.run ? null : { ...old.run, lockedTeam: old.run.lockedTeam ?? null };
    const profile: Profile = {
        ...DEFAULT_PROFILE,
        ...(version < 5 && run ? { clubName: run.teamName, clubTag: tagFromName(run.teamName) } : {}),
        ...old.profile,
    };
    // v7: treinador e títulos (saves e nuvem antigos não têm; listas estragadas viram vazias)
    if (!Array.isArray(profile.missionsDone)) profile.missionsDone = [];
    if (!Array.isArray(profile.redeemedTitles)) profile.redeemedTitles = [];
    let dex: Dex = old.dex ?? {};
    if (version < 5 && run) {
        dex = markSeen(
            dex,
            run.picks.map((p) => p.speciesId),
        );
        for (const r of run.results) {
            const lines = (r.stats?.players ?? []).map((p) => ({
                team: 0 as const,
                speciesId: p.speciesId,
                minutes: p.minutes,
                rating: p.rating,
                stats: { goals: p.goals, assists: p.assists },
            }));
            dex = recordMatchInDex(dex, lines as unknown as PlayerLine[], r.won);
        }
        dex = markOvr(
            dex,
            run.picks.map((p): [number, number] => [p.speciesId, viewInstance(p).overall]),
        );
    }
    // v9: álbum de edições (retroativo)
    const hall = Array.isArray(old.hall) ? old.hall.slice(0, MAX_HALL) : [];
    const parkedRuns =
        version < 3 || !Array.isArray(old.parkedRuns)
            ? []
            : old.parkedRuns
                  .filter(runShapeOk)
                  .map((r) => ({ ...r, lockedTeam: r.lockedTeam ?? null }))
                  .slice(0, MAX_PARKED);
    if (version < 9) dex = backfillEditions(dex, hall, [run, ...parkedRuns]);
    return withUnlocks({
        run,
        settings,
        records,
        profile,
        dex,
        moves: old.moves ?? {},
        career: { ...EMPTY_CAREER, ...old.career },
        onboarded: old.onboarded ?? (version < 5 && (records.cups > 0 || !!run)),
        // campo opcional (saves e versões anteriores não têm): copas guardadas válidas, no máximo MAX_PARKED
        parkedRuns,
        // v6: Hall da Fama
        hall,
        // v8: histórico dos duelos amistosos
        duels: Array.isArray(old.duels)
            ? old.duels.filter((x) => x && typeof x.id === 'string').slice(0, MAX_DUELS)
            : [],
        // Copa do Dia (campo novo, opcional: saves antigos não têm)
        daily: mergeDaily(Array.isArray(old.daily) ? old.daily : []),
        // Álbum de cartas (opcional): o fichário da 0.8.8 vira álbum; save de antes dele nasce das copas e do Hall
        binder: binderOf({ ...old, run, parkedRuns, hall }),
    });
}

export const useGame = create<GameStore>()(
    persist(
        screenTransition((setState, getState) => {
            const updateRun = (patch: Partial<RunState>) => {
                const run = getState().run;
                if (run) setState({ run: { ...run, ...patch } });
            };
            /** Pokédex com estas espécies marcadas como vistas. */
            const seenDex = (list: { speciesId: number }[]) =>
                markSeen(
                    getState().dex,
                    list.map((p) => p.speciesId),
                );
            const ovrOf = (p: PokemonInstance): [number, number] => [p.speciesId, viewInstance(p).overall];
            /** O que muda no save quando chega carta nova (recompensa ou Mercado): Ícones, álbum e nota na Pokédex. */
            const gained = (run: RunState, picks: PokemonInstance[], from: 'recompensa' | 'mercado') => {
                const changed = picks.filter((p) => !run.picks.includes(p));
                const incoming = changed.filter((p) => !run.picks.some((o) => o.uid === p.uid));
                const { records } = getState();
                // Ícone que chega como reforço também conta nos Ícones escalados (como o do draft)
                const icons = incoming.filter((p) => p.special?.kind === 'icone').length;
                return {
                    ...(icons && { records: { ...records, icones: (records.icones ?? 0) + icons } }),
                    binder: binderAdd(getState().binder, incoming, { from, at: Date.now(), cup: run.seed }),
                    dex: markOvr(getState().dex, changed.map(ovrOf)),
                };
            };
            /** Saindo da recompensa: Mercado (com o ₽ da vitória) ou direto pra escalação da próxima fase. */
            const afterReward = (run: RunState): Partial<GameStore> => {
                const done = { ...run, rewards: [] };
                if (isLong(run)) return { ...backToRoute(done), match: null };
                const res = run.results.find((r) => r.stage === run.stage);
                if (!hasShop(run) || !res) return { run: toLineup(done), match: null, screen: 'lineup' };
                const sponsors = run.sponsors ?? [];
                const earned = winEarnings(res.score[0], res.score[1], run.money ?? 0, sponsors);
                const money = (run.money ?? 0) + earned.total;
                const shop = { stage: run.stage, rerolls: 0, offers: rollShop(done, 0), sold: [], earned };
                return {
                    run: { ...done, money, shop, status: 'shop' },
                    dex: seenDex(shop.offers.flatMap((o) => (o.kind === 'pokemon' ? [o.inst] : []))),
                    match: null,
                    screen: 'shop',
                };
            };
            return {
                screen: 'home',
                run: null,
                settings: DEFAULT_SETTINGS,
                records: { cups: 0, titles: 0, perfect: 0 },
                profile: { ...DEFAULT_PROFILE, seen: [] },
                dex: {},
                moves: {},
                career: EMPTY_CAREER,
                onboarded: false,
                tour: false,
                parkedRuns: [],
                hall: [],
                binder: [],
                duels: [],
                recordDuel: (rec) => {
                    const { duels, records } = getState();
                    // vitória nova (a mesma partida pode ser gravada de novo): conta uma vez só
                    const fresh = rec.result === 'win' && !duels.some((d) => d.id === rec.id && d.result === 'win');
                    setState({
                        duels: addDuel(duels, rec),
                        ...(fresh ? { records: { ...records, duelWins: duelWins(records, duels) + 1 } } : {}),
                    });
                },
                daily: [],
                startDaily: (ranked) => {
                    const s = getState();
                    const day = dailyDay();
                    if (s.daily.some((e) => e.day === day)) return;
                    // a copa em andamento não some: fica guardada (volta pela Home)
                    const parkedRuns =
                        isCupInProgress(s.run) && !s.run.daily
                            ? [s.run, ...s.parkedRuns].slice(0, MAX_PARKED)
                            : s.parkedRuns;
                    const daily = putDaily(closeDaily(s), { day, results: [], done: false, champion: false, ranked });
                    setState({ run: null, parkedRuns, daily });
                    getState().newRun(s.profile.clubName || 'Pallet FC', dailySeed(day), day);
                },
                markDailyReported: (day, n) =>
                    setState({ daily: getState().daily.map((e) => (e.day === day ? { ...e, reported: n } : e)) }),
                recordDuelDex: (m, side) => {
                    const lines = dexLines(m, side);
                    let dex = markPlayed(
                        getState().dex,
                        lines.filter(playedLine).map((l) => l.speciesId),
                    );
                    dex = markSeen(
                        dex,
                        lines.map((l) => l.speciesId),
                    );
                    setState({ dex });
                },
                match: null,
                unlockQueue: [],

                go: (screen) => setState({ screen }),

                newRun: (teamName = getState().profile.clubName || 'Pallet FC', seed, daily, mode) => {
                    const runSeed = seed ?? Math.floor(Math.random() * 1e9).toString(36);
                    const run: RunState = {
                        schemaVersion: 3,
                        seed: runSeed,
                        teamName,
                        status: 'formation',
                        formation: DEFAULT_FORMATION,
                        draftRound: 0,
                        draftSlot: null,
                        options: [],
                        rerolls: START_REROLLS,
                        rerollsUsed: 0,
                        picks: [],
                        lineup: ['', '', '', '', ''],
                        bench: Array(BENCH_SIZE).fill(''),
                        captainUid: null,
                        tactic: 'balanced',
                        opponents: mode ? [] : buildCupOpponents(runSeed),
                        stage: 0,
                        results: [],
                        rewards: [],
                        lockedTeam: null,
                        live: null,
                        eventType: daily ? dailyEventType(daily) : weeklyEventType(new Date()),
                        startedAt: Date.now(),
                        ...(daily && { daily }),
                        ...(mode && !daily && newLongFields(runSeed)),
                        startCounts: {
                            seen: seenCount(getState().dex),
                            moves: movesFound(getState().moves, getState().dex),
                        },
                    };
                    // começar outra por cima de uma copa em jogo é abandonar a atual: a sequência de títulos zera;
                    // trocar uma Copa do Dia no meio por outra copa encerra a tentativa do dia
                    const { records } = getState();
                    setState({
                        run,
                        match: null,
                        screen: 'draft',
                        // a 1ª copa é a entrada no jogo (era o fim do passo a passo de boas-vindas)
                        onboarded: true,
                        daily: closeDaily(getState()),
                        ...(isCupInProgress(getState().run) && {
                            records: { ...records, ...streakAfter(records, false) },
                        }),
                    });
                },

                abandonRun: () =>
                    setState({
                        daily: closeDaily(getState()),
                        run: null,
                        match: null,
                        screen: 'home',
                        records: { ...getState().records, ...streakAfter(getState().records, false) },
                    }),

                chooseFormation: (formation) => {
                    const run = getState().run;
                    if (run?.status !== 'formation') return;
                    const next: RunState = { ...run, formation, status: 'captain' };
                    next.options = rollCaptains(next);
                    setState({ run: next, dex: seenDex(next.options) });
                },

                chooseSlot: (slot) => {
                    const run = getState().run;
                    if (run?.status !== 'drafting' || run.draftSlot) return; // vaga travada até escolher
                    const zone = slot.zone === 'lineup' ? run.lineup : run.bench;
                    if (zone[slot.index] !== '') return;
                    const options = rollOptions(run, slot);
                    setState({ run: { ...run, draftSlot: slot, options }, dex: seenDex(options) });
                },

                pick: (uid, slotArg) => {
                    const run = getState().run;
                    if (!run || (run.status !== 'captain' && run.status !== 'drafting')) return;
                    const slot = run.status === 'captain' ? slotArg : run.draftSlot;
                    const choice = run.options.find((o) => o.uid === uid);
                    if (!slot || !choice) return;
                    const lineup = [...run.lineup];
                    const bench = [...run.bench];
                    const zone = slot.zone === 'lineup' ? lineup : bench;
                    if (zone[slot.index] !== '') return;
                    zone[slot.index] = choice.uid;
                    if (choice.special?.kind === 'icone') {
                        const records = getState().records;
                        setState({ records: { ...records, icones: (records.icones ?? 0) + 1 } });
                    }
                    const next: RunState = {
                        ...run,
                        picks: [...run.picks, choice],
                        lineup,
                        bench,
                        draftRound: run.draftRound + 1,
                        draftSlot: null,
                        options: [],
                        captainUid: run.status === 'captain' ? choice.uid : run.captainUid,
                        status: 'drafting',
                    };
                    const dex = markOvr(getState().dex, [ovrOf(choice)]);
                    const binder = binderAdd(getState().binder, [choice], {
                        from: 'draft',
                        at: Date.now(),
                        cup: run.seed,
                    });
                    if (isDraftComplete(next) || next.picks.length >= DRAFT_PICKS) {
                        // Copa longa: o time pronto vai pro mapa; a rápida, pra escalação da 1ª partida
                        next.status = isLong(next) ? 'map' : 'lineup';
                        setState({ run: next, screen: next.status, dex, binder });
                    } else {
                        setState({ run: next, dex, binder });
                    }
                },

                reroll: () => {
                    const run = getState().run;
                    if (!run || run.rerolls <= 0 || !run.options.length) return;
                    const next: RunState = { ...run, rerolls: run.rerolls - 1, rerollsUsed: run.rerollsUsed + 1 };
                    if (run.status === 'captain') next.options = rollCaptains(next);
                    else if (run.status === 'drafting' && run.draftSlot)
                        next.options = rollOptions(next, run.draftSlot);
                    else return;
                    setState({ run: next, dex: seenDex(next.options) });
                },

                autoDraft: (captainUid) => {
                    const run = getState().run;
                    if (!run || !['formation', 'captain', 'drafting'].includes(run.status)) return;
                    updateRun({ autoFrom: run.autoFrom ?? run.draftRound });
                    if (run.status === 'formation') getState().chooseFormation(run.formation);
                    // mesmo caminho da mão (vaga → opções → assinar): dex, recordes e estatísticas iguais
                    for (let guard = 0; guard <= DRAFT_PICKS; guard++) {
                        const r = getState().run;
                        if (r?.status === 'captain') {
                            const slots = r.lineup.map((_, index) => ({ zone: 'lineup' as const, index }));
                            const options = r.options.filter((o) => o.uid === captainUid);
                            const pool = options.length ? options : r.options;
                            const fit = bestFit(
                                pool,
                                slots.map((sl) => slotRole(r, sl)),
                            );
                            getState().pick(pool[fit.option].uid, slots[fit.role]);
                        } else if (r?.status === 'drafting') {
                            if (!r.draftSlot) {
                                const lineup = r.lineup.indexOf('');
                                getState().chooseSlot(
                                    lineup >= 0
                                        ? { zone: 'lineup', index: lineup }
                                        : { zone: 'bench', index: r.bench.indexOf('') },
                                );
                            }
                            const now = getState().run!;
                            if (!now.draftSlot || !now.options.length) return;
                            getState().pick(
                                now.options[bestFit(now.options, [slotRole(now, now.draftSlot)]).option].uid,
                            );
                        } else return;
                    }
                },

                swapSlots: (a, b) => {
                    const run = getState().run;
                    // Rota Índigo: quem está fora (lesão, Creche) não entra em quadra
                    if (!run || putsOutOnCourt(run, a, b)) return;
                    const lineup = [...run.lineup];
                    const bench = [...run.bench];
                    const zone = (r: SlotRef) => (r.zone === 'lineup' ? lineup : bench);
                    const tmp = zone(a)[a.index];
                    zone(a)[a.index] = zone(b)[b.index];
                    zone(b)[b.index] = tmp;
                    updateRun({ lineup, bench });
                },

                setFormation: (formation) => updateRun({ formation }),
                setTactic: (tactic) => updateRun({ tactic }),
                setCorner: (patch) => updateRun(patch),

                moveItem: (fromUid, toUid) => {
                    const run = getState().run;
                    if (!run || fromUid === toUid) return;
                    const from = run.picks.find((p) => p.uid === fromUid);
                    const to = run.picks.find((p) => p.uid === toUid);
                    if (!from?.item || !to) return;
                    const picks = run.picks.map((p) => {
                        if (p.uid === fromUid) return { ...p, item: to.item ?? null };
                        if (p.uid === toUid) return { ...p, item: from.item };
                        return p;
                    });
                    updateRun({ picks });
                },

                setMatch: (match) => setState({ match }),

                lockMatch: (team) => {
                    const run = getState().run;
                    // titular que está fora não joga: a escalação pede pra trocar antes (nada automático)
                    if (run?.status === 'lineup' && !run.lockedTeam && !run.lineup.some((u) => isOut(run, u))) {
                        const opp = run.opponents[run.stage];
                        setState({
                            run: {
                                ...run,
                                lockedTeam: team,
                                live: { stage: run.stage, orders: [], tick: 0, engine: ENGINE_VERSION },
                            },
                            dex: opp ? seenDex([...opp.lineup, ...opp.bench]) : getState().dex,
                        });
                    }
                },

                saveLive: (patch) => {
                    const run = getState().run;
                    if (run?.status !== 'lineup' || !run.lockedTeam) return;
                    const live = liveOf(run) ?? { stage: run.stage, orders: [], tick: 0, engine: ENGINE_VERSION };
                    updateRun({ live: { ...live, ...patch } });
                },

                recordResult: (m) => {
                    const { run, records, career, moves } = getState();
                    // só registra partidas da fase atual de uma run em escalação (evita resultado "fantasma")
                    if (run?.status !== 'lineup' || run.results.some((r) => r.stage === run.stage)) return;
                    const won = m.winner === 0;
                    // carta Destaque (só na vitória: na eliminação a copa acaba e a carta não teria onde jogar).
                    // O craque vira Destaque; se já é, sobe de nível jogando muito (nota 8+, até o 3); senão o
                    // prêmio vai pro melhor do time que ainda não tem edição. Ícone e Evento também levam: seguem
                    // com a edição e ganham o selo "MVP n" (o 2º e o 3º pedem nota 8+, como o Destaque).
                    const lines = playerLines(m);
                    const ranked = everyoneIn(m)
                        .filter((p) => p.team === 0 && mvpScore(p) > 0)
                        .sort((a, b) => mvpScore(b) - mvpScore(a))
                        .flatMap((p) => run.picks.filter((i) => i.uid === p.uid));
                    const star = ranked[0];
                    const starRating = lines.find((l) => l.team === 0 && l.uid === star?.uid)?.rating ?? 0;
                    const levelUp =
                        star?.special?.kind === 'destaque' &&
                        (star.special.level ?? 1) < DESTAQUE_MAX_LEVEL &&
                        starRating >= DESTAQUE_LEVEL_UP_RATING;
                    // Ícone/Evento sem selo leva como carta sem edição; com selo, só sobe sendo o craque com nota 8+
                    const mvpTaker = (p: PokemonInstance) =>
                        mvpOpen(p) && (!p.special?.level || (p === star && starRating >= DESTAQUE_LEVEL_UP_RATING));
                    const winner = levelUp ? star : ranked.find((p) => !p.special || mvpTaker(p));
                    const destaqueUid = won && SPECIALS_LIVE && winner ? winner.uid : null;
                    const destaqueLevel = levelUp ? (star.special?.level ?? 1) + 1 : 1;
                    // quem evoluiu no meio da partida continua evoluído pelo resto da copa
                    const evolved = new Map(
                        m.events.flatMap((e) => (e.type === 'evolve' && e.team === 0 ? [[e.uid, e] as const] : [])),
                    );
                    const picks = run.picks.map((p) => {
                        let out = p;
                        const evo = evolved.get(p.uid);
                        if (evo) out = { ...evolveInstance(out, evo.into, evo.role), evo: 0 };
                        else {
                            // barra de evolução da copa: soma o que ele fez nesta partida (quem ainda pode evoluir)
                            const line = lines.find((l) => l.team === 0 && l.uid === p.uid && l.minutes > 0);
                            if (line && evolutionTarget(p.speciesId, p.uid) !== null)
                                out = {
                                    ...out,
                                    evo: Math.round(evoProgress(p, line.stats, line.role as Position) * 10) / 10,
                                };
                        }
                        if (p.uid === destaqueUid)
                            out = {
                                ...out,
                                special:
                                    p.special?.kind === 'icone' || p.special?.kind === 'evento'
                                        ? { ...p.special, level: (p.special.level ?? 0) + 1 }
                                        : {
                                              kind: 'destaque' as const,
                                              ...(destaqueLevel > 1 && { level: destaqueLevel }),
                                          },
                            };
                        return out;
                    });
                    const totals = [teamTotals(lines, 0), teamTotals(lines, 1)];
                    const result: StageResult = {
                        stage: run.stage,
                        opponent: run.opponents[run.stage].name,
                        score: m.score,
                        shootout: m.shootout,
                        won,
                        destaqueUid,
                        stats: {
                            possession: [m.possession[0], m.possession[1]],
                            shots: [totals[0].shots, totals[1].shots],
                            shotsOnTarget: [totals[0].shotsOnTarget, totals[1].shotsOnTarget],
                            players: lines
                                .filter((l) => l.team === 0)
                                .map((l) => ({
                                    uid: l.uid,
                                    speciesId: l.speciesId,
                                    ...(l.shiny && { shiny: true }),
                                    name: l.name,
                                    role: l.role,
                                    rating: l.rating,
                                    minutes: l.minutes,
                                    distance: l.distance,
                                    goals: l.stats.goals,
                                    assists: l.stats.assists,
                                    shots: l.stats.shots,
                                    passes: l.stats.passes,
                                    passesCompleted: l.stats.passesCompleted,
                                    tacklesWon: l.stats.tacklesWon,
                                    interceptions: l.stats.interceptions,
                                    saves: l.stats.saves,
                                    movesUsed: l.stats.movesUsed,
                                })),
                            digest: matchDigest(m),
                        },
                    };
                    if (run.lockedTeam && result.stats?.digest?.goals.some((g) => g.team === 0 && !g.ownGoal))
                        result.replay = {
                            team: run.lockedTeam,
                            orders: liveOf(run)?.orders ?? [],
                            engine: ENGINE_VERSION,
                        };
                    const last = isFinalStage(run);
                    result.final = last;
                    // Rota Índigo: nas eliminatórias (mapa) a 1ª derrota é um cartão amarelo (volta pro mapa) e a 2ª, o
                    // vermelho; no grupo a derrota só dá menos pontos, e quem não fica entre os 2 primeiros sai na 3ª rodada
                    const longRun = isLong(run);
                    const yellow = !won && longRun && run.stage < GROUP_START && (run.cards ?? 0) < YELLOW_CARDS;
                    const inGroup = longRun && isGroupStage(run.stage);
                    const groupOut =
                        inGroup &&
                        run.stage === FINAL_MATCH - 1 &&
                        !groupQualified(groupTable({ ...run, results: [...run.results, result] }, 0));
                    const status: RunStatus = groupOut
                        ? 'eliminated'
                        : won
                          ? last
                              ? 'champion'
                              : 'reward'
                          : yellow
                            ? 'map'
                            : inGroup
                              ? 'group'
                              : 'eliminated';
                    const next: RunState = {
                        ...run,
                        picks,
                        results: [...run.results, result],
                        status,
                        lockedTeam: null,
                        live: null,
                        ...(yellow && { cards: (run.cards ?? 0) + 1 }),
                        ...(isLong(run) && { out: tickOut(run.out) }),
                        // na longa o ₽ da vitória entra na hora (os juros só quando você entra num Mercado)
                        ...(won &&
                            isLong(run) && {
                                money:
                                    (run.money ?? 0) + winEarnings(m.score[0], m.score[1], 0, run.sponsors ?? []).total,
                            }),
                    };
                    if (status === 'reward') next.rewards = rollRewards(next, 0);
                    // Pokédex: seu time (1+ minuto) "jogou", o rival e as recompensas ficam "vistos"
                    const forDex = dexLines(m, 0, lines);
                    let dex = recordMatchInDex(getState().dex, forDex, won);
                    // álbum: a edição de cada carta que jogou (como ela entrou: o Destaque desta partida conta na próxima)
                    dex = recordEditions(
                        dex,
                        forDex.flatMap((l) => {
                            const card = playedLine(l) && run.picks.find((p) => p.uid === l.uid);
                            return card ? [[l.speciesId, editionBits(card)] as [number, number]] : [];
                        }),
                    );
                    dex = markSeen(
                        dex,
                        [...evolved.values()].map((e) => e.into),
                    );
                    dex = markSeen(
                        dex,
                        next.rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst.speciesId] : [])),
                    );
                    dex = markOvr(dex, picks.filter((p) => evolved.has(p.uid) || p.uid === destaqueUid).map(ovrOf));
                    if (status === 'champion') {
                        const played = next.results.flatMap((r) => [
                            ...(r.stats?.players ?? []).filter((p) => p.minutes >= 1).map((p) => p.speciesId),
                            ...(r.stats?.digest?.evolutions ?? []).map((e) => e.from),
                        ]);
                        dex = recordTitleInDex(dex, played);
                    }
                    const ended = status === 'eliminated' || status === 'champion';
                    if (ended) next.endedAt = Date.now();
                    // fichário: a carta nova da evolução, o Destaque/MVP desta partida e, no título, o elenco campeão
                    const at = Date.now();
                    let binder = binderAdd(
                        getState().binder,
                        picks.filter((p) => evolved.has(p.uid)),
                        { from: 'evolucao', at, cup: run.seed },
                    );
                    binder = binderAdd(
                        binder,
                        picks.filter((p) => p.uid === destaqueUid && !evolved.has(p.uid)),
                        { from: 'draft', at, cup: run.seed },
                    );
                    if (status === 'champion')
                        binder = binderAdd(
                            binder,
                            [...next.lineup, ...next.bench].flatMap((uid) => picks.filter((p) => p.uid === uid)),
                            { from: 'draft', at, cup: run.seed, champ: true },
                        );
                    // Copa do Dia terminada: a figurinha do dia (o mesmo Pokémon pra todo mundo) vai pro Álbum
                    if (ended && run.daily)
                        binder = binderAdd(binder, [dailyStickerCard(run.daily)], {
                            from: 'diario',
                            at,
                            cup: run.seed,
                        });
                    let hall = getState().hall;
                    if (status === 'champion') {
                        next.champ = champMemo(next, records, getState().dex);
                        hall = [hallEntry(next, getState().profile), ...hall.filter((h) => h.id !== next.seed)].slice(
                            0,
                            MAX_HALL,
                        );
                    }
                    const withStar = {
                        ...records,
                        destaques: (records.destaques ?? 0) + (destaqueUid ? 1 : 0),
                        evolucoes: (records.evolucoes ?? 0) + evolved.size,
                    };
                    const saved = {
                        run: next,
                        hall,
                        binder,
                        dex,
                        moves: recordMovesSeen(moves, m),
                        career: recordMatchInCareer(career, m.score, won, !!m.shootout),
                        records: ended
                            ? {
                                  ...withStar,
                                  cups: records.cups + 1,
                                  titles: records.titles + (status === 'champion' ? 1 : 0),
                                  perfect: records.perfect + (isPerfectCup(next) ? 1 : 0),
                                  ...streakAfter(records, status === 'champion'),
                                  ...(isLong(run) && {
                                      longCups: (records.longCups ?? 0) + 1,
                                      longTitles: (records.longTitles ?? 0) + (status === 'champion' ? 1 : 0),
                                  }),
                              }
                            : withStar,
                    };
                    // missões: esta partida (com os titulares do apito inicial) e o save depois dela
                    const profile = getState().profile;
                    const dailyNext = run.daily ? dailyAfter(getState().daily, next, run.daily) : getState().daily;
                    const fresh = newMissions(
                        {
                            ...saved,
                            daily: dailyNext,
                            runs: [next, ...getState().parkedRuns],
                            done: profile.missionsDone,
                        },
                        [matchView(m, result.stats?.digest ?? matchDigest(m), run.lockedTeam, last)],
                    );
                    setState({
                        ...saved,
                        ...(run.daily && { daily: dailyNext }),
                        ...(fresh.length && {
                            profile: { ...profile, missionsDone: [...profile.missionsDone, ...fresh] },
                        }),
                        unlockQueue: [...getState().unlockQueue, ...fresh],
                    });
                },

                markParaded: () => {
                    const run = getState().run;
                    if (run?.champ && !run.champ.paraded) updateRun({ champ: { ...run.champ, paraded: true } });
                },

                claimReward: (index, targetUid, forgetSlot, passTo) => {
                    const run = getState().run;
                    const reward = run?.rewards[index];
                    if (run?.status !== 'reward' || !reward) return;
                    const got = grant(run, reward, targetUid, forgetSlot, passTo);
                    if (!got) return;
                    // em dois passos: a vitrine do Mercado marca os vistos em cima da Pokédex já com a carta nova
                    setState(gained(run, got.picks, 'recompensa'));
                    setState(afterReward({ ...run, ...got }));
                },

                skipReward: () => {
                    const run = getState().run;
                    if (run?.status !== 'reward') return;
                    setState(afterReward({ ...run, rerolls: run.rerolls + 1 }));
                },

                buyOffer: (index, targetUid, forgetSlot, passTo) => {
                    const run = getState().run;
                    const shop = run?.shop;
                    const offer = shop?.offers[index];
                    if (run?.status !== 'shop' || !shop || !offer || shop.sold.includes(index) || shop.pack) return;
                    const money = run.money ?? 0;
                    if (money < offer.price) return;
                    const sold = [...shop.sold, index];
                    const paid = { ...run, money: money - offer.price };
                    if (offer.kind === 'sponsor') {
                        let sponsors = run.sponsors ?? [];
                        if (sponsors.length >= MAX_SPONSORS) {
                            if (!targetUid || !sponsors.includes(targetUid)) return;
                            sponsors = sponsors.filter((id) => id !== targetUid);
                        }
                        setState({ run: { ...paid, sponsors: [...sponsors, offer.id], shop: { ...shop, sold } } });
                        return;
                    }
                    if (offer.kind === 'pack') {
                        const n = run.packs ?? 0;
                        const pack = packCards(
                            run.seed,
                            run.stage,
                            offer.type,
                            run.picks,
                            run.sponsors ?? [],
                            run.eventType ?? null,
                            n,
                        );
                        // pacote vazio (o time já tem todos do tipo): não cobra nem abre, senão o Mercado travava
                        if (!pack.length) return;
                        setState({
                            run: { ...paid, packs: n + 1, shop: { ...shop, sold, pack } },
                            dex: seenDex(pack),
                        });
                        return;
                    }
                    const got = grant(run, offer, targetUid ?? '', forgetSlot, passTo);
                    if (!got) return;
                    setState({
                        ...gained(run, got.picks, 'mercado'),
                        run: { ...paid, ...got, shop: { ...shop, sold } },
                    });
                },

                claimPack: (index, targetUid) => {
                    const run = getState().run;
                    const card = run?.shop?.pack?.[index];
                    if (run?.status !== 'shop' || !run.shop || !card) return;
                    const got = grant(run, { kind: 'pokemon', inst: card, from: null }, targetUid);
                    if (!got) return;
                    setState({
                        ...gained(run, got.picks, 'mercado'),
                        run: { ...run, ...got, shop: { ...run.shop, pack: undefined } },
                    });
                },

                skipPack: () => {
                    const run = getState().run;
                    if (run?.status !== 'shop' || !run.shop?.pack) return;
                    setState({ run: { ...run, shop: { ...run.shop, pack: undefined } } });
                },

                rerollShop: () => {
                    const run = getState().run;
                    const shop = run?.shop;
                    if (run?.status !== 'shop' || !shop || shop.pack) return;
                    const price = rerollPrice(shop.rerolls, run.sponsors);
                    if ((run.money ?? 0) < price) return;
                    const rerolls = shop.rerolls + 1;
                    const offers = rollShop(run, rerolls);
                    setState({
                        run: { ...run, money: (run.money ?? 0) - price, shop: { ...shop, rerolls, offers, sold: [] } },
                        dex: seenDex(offers.flatMap((o) => (o.kind === 'pokemon' ? [o.inst] : []))),
                    });
                },

                leaveShop: () => {
                    const run = getState().run;
                    if (run?.status !== 'shop' || run.shop?.pack) return;
                    if (isLong(run)) setState({ run: toMap(run), match: null, screen: 'map' });
                    else setState({ run: toLineup({ ...run, shop: null }), match: null, screen: 'lineup' });
                },

                enterNode: (id) => {
                    const run = getState().run;
                    if (run?.status !== 'map' || !run.map) return;
                    const node = nextNodes(run.map, run.at ?? null).find((n) => n.id === id);
                    if (!node) return;
                    const base: RunState = { ...run, at: id, path: [...(run.path ?? []), id] };
                    const mons = (list: readonly { speciesId: number }[]) => seenDex([...list]);
                    if (isMatchKind(node.kind)) {
                        // o rival é o mesmo da prévia do mapa (mesmo sorteio, mesmos já enfrentados)
                        const stage = matchIndexOfRow(node.row);
                        const faced = run.opponents.filter(Boolean).map((o) => o.name);
                        const opp = longOpponent(run.seed, stage, node.kind, faced, run.rivalShift ?? 0);
                        const opponents = [...run.opponents];
                        opponents[stage] = opp;
                        setState({
                            run: { ...base, stage, opponents, status: 'lineup', rivalShift: undefined },
                            screen: 'lineup',
                            dex: mons([...opp.lineup, ...opp.bench]),
                        });
                    } else if (node.kind === 'mercado') {
                        // os juros do que você guardou entram ao chegar no Mercado
                        const sponsors = run.sponsors ?? [];
                        const interest = interestOf(run.money ?? 0, sponsors);
                        const earned = { win: 0, goals: 0, clean: 0, bonus: 0, interest, total: interest };
                        const paid = { ...base, money: (run.money ?? 0) + interest };
                        const offers = rollShop(paid, 0);
                        setState({
                            run: {
                                ...paid,
                                status: 'shop',
                                shop: { stage: run.stage, rerolls: 0, offers, sold: [], earned },
                            },
                            screen: 'shop',
                            dex: mons(offers.flatMap((o) => (o.kind === 'pokemon' ? [o.inst] : []))),
                        });
                    } else if (node.kind === 'bau') {
                        const open: RunState = { ...base, status: 'reward' };
                        open.rewards = rollRewards(open, 0);
                        setState({
                            run: open,
                            screen: 'reward',
                            dex: mons(open.rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst] : []))),
                        });
                    } else if (node.kind === 'treino')
                        setState({ run: { ...base, status: 'treino' }, screen: 'treino' });
                    else {
                        const event = rollEvent(base);
                        setState({
                            run: { ...base, status: 'event', event },
                            screen: 'event',
                            dex: mons(event.cards ?? []),
                        });
                    }
                },

                chooseEvent: (choice, target, card, captain) => {
                    const run = getState().run;
                    if (run?.status !== 'event' || !run.event) return;
                    const next = resolveEvent(run, run.event, choice, target, card, captain);
                    if (!next) return;
                    const incoming = next.picks.filter((p) => !run.picks.some((o) => o.uid === p.uid));
                    setState({
                        ...(incoming.length && gained(run, next.picks, 'recompensa')),
                        run: {
                            ...toMap(next),
                            event: null,
                            eventsSeen: [...(run.eventsSeen ?? []), run.event.id],
                        },
                        screen: 'map',
                    });
                },

                tell: (id) => {
                    const run = getState().run;
                    if (run && !run.told?.includes(id)) setState({ run: { ...run, told: [...(run.told ?? []), id] } });
                },

                train: (choice, uid) => {
                    const run = getState().run;
                    if (run?.status !== 'treino') return;
                    if (choice === 'rest') {
                        setState(backToRoute({ ...run, rerolls: run.rerolls + 1 }));
                        return;
                    }
                    // treino de evolução: a barra enche metade (evoluir continua sendo na partida, com a animação dela)
                    const target = run.picks.find((p) => p.uid === uid);
                    if (!target || evolutionTarget(target.speciesId, target.uid) === null) return;
                    const evo = Math.min(EVO_THRESHOLD, (target.evo ?? 0) + EVO_THRESHOLD / 2);
                    const picks = run.picks.map((p) => (p.uid === uid ? { ...p, evo } : p));
                    setState(backToRoute({ ...run, picks }));
                },

                playNext: () => {
                    const run = getState().run;
                    if (run?.status !== 'group' || !run.group) return;
                    // próxima partida: a rodada do grupo, ou a Final contra a Liga Índigo
                    const stage = run.results.length;
                    if (stage < GROUP_START || stage > FINAL_MATCH) return;
                    const faced = run.opponents.filter(Boolean).map((o) => o.name);
                    const opp =
                        stage < FINAL_MATCH
                            ? run.group.rivals[stage - GROUP_START]
                            : longOpponent(run.seed, FINAL_MATCH, 'final', faced);
                    const opponents = [...run.opponents];
                    opponents[stage] = opp;
                    setState({
                        run: { ...run, stage, opponents, status: 'lineup' },
                        screen: 'lineup',
                        dex: seenDex([...opp.lineup, ...opp.bench]),
                    });
                },

                rerollReward: () => {
                    const run = getState().run;
                    if (run?.status !== 'reward' || run.rerolls <= 0) return;
                    const used = run.rerollsUsed + 1;
                    const rewards = rollRewards({ ...run, rerollsUsed: used }, used);
                    setState({
                        run: { ...run, rerolls: run.rerolls - 1, rerollsUsed: used, rewards },
                        dex: seenDex(rewards.flatMap((r) => (r.kind === 'pokemon' ? [r.inst] : []))),
                    });
                },

                advance: () => {
                    const run = getState().run;
                    if (run?.status === 'reward') setState({ screen: 'reward' });
                    else if (run?.status === 'shop') setState({ screen: 'shop' });
                    else if (run?.status === 'map') setState({ match: null, screen: 'map' });
                    else if (run?.status === 'group') setState({ match: null, screen: 'group' });
                    else setState({ match: null, screen: 'home' });
                },

                updateSettings: (patch) => setState({ settings: { ...getState().settings, ...patch } }),
                updateProfile: (patch) => setState({ profile: { ...getState().profile, ...patch } }),
                setOnboarded: (onboarded) => setState({ onboarded }),
                setTour: (tour) => setState({ tour }),
                shiftUnlock: () => setState({ unlockQueue: getState().unlockQueue.slice(1) }),

                resumeParked: (seed) => {
                    const { run, parkedRuns } = getState();
                    const target = parkedRuns.find((r) => r.seed === seed);
                    if (!target) return;
                    const rest = parkedRuns.filter((r) => r.seed !== seed);
                    // a copa atual não some: se ainda está em jogo, troca de lugar com a guardada
                    const next = isCupInProgress(run) ? [run, ...rest] : rest;
                    setState({ run: target, parkedRuns: next.slice(0, MAX_PARKED), match: null });
                },
                discardParked: (seed) => setState({ parkedRuns: getState().parkedRuns.filter((r) => r.seed !== seed) }),
            };
        }),
        {
            name: 'soccermon-save',
            // v4: cartas especiais (campo opcional `special`, `eventType` na run, recordes novos)
            // v5: perfil, Pokédex, golpes descobertos, carreira e configurações novas
            // v6: Hall da Fama e resumo dos eventos de cada partida
            // v7: treinador, títulos e desbloqueios (retroativos: títulos, copa perfeita, Pokédex, líderes vencidos)
            // v8: histórico dos duelos amistosos
            // v9: álbum de edições na Pokédex (`DexEntry.editions`, retroativo pelo Hall e pelas copas guardadas)
            version: SAVE_VERSION,
            storage: createJSONStorage(() => idbStorage),
            partialize: (s): PersistedSave => savePart(s),
            // versões antigas tinham outro formato de draft: descarta a run, mantém configurações
            migrate: (persisted, version) => {
                return migrateSave((persisted ?? {}) as Partial<PersistedSave>, version);
            },
            // missão nova (ou que virou retroativa) sai já ao abrir o jogo, sem esperar a próxima partida
            merge: (persisted, current) => {
                const saved = persisted as PersistedSave | undefined;
                const p = saved?.settings ? { ...saved, settings: withCryDefault(saved.settings) } : saved;
                if (!p?.profile) return { ...current, ...p };
                const runs = [p.run, ...(p.parkedRuns ?? [])];
                // figurinhas de edição das copas guardadas (quem jogou 1+ minuto) e do Hall: sempre, não só na v9
                const dex = backfillEditions(markEvolvedPlayed(p.dex ?? {}, runs), p.hall ?? [], runs, false);
                // álbum de cartas: o fichário da 0.8.8 vira álbum; o save de antes dele ganha as copas guardadas e o Hall
                const binder = binderOf(p);
                const next = withUnlocks({ ...p, dex, binder });
                // as que saíram agora ganham o aviso (na Home)
                const fresh = (next.profile.missionsDone ?? []).slice(p.profile.missionsDone?.length ?? 0);
                return { ...current, ...next, unlockQueue: [...current.unlockQueue, ...fresh] };
            },
        },
    ),
);
