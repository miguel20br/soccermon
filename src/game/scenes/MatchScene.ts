import Phaser from 'phaser';
import { AGENCY, fxTypeOf, maxCharge } from '../../engine/agency';
import { computeAttributes, type Position } from '../../engine/attributes';
import { FUTSAL_5 } from '../../engine/config';
import { ABILITIES, MOVES, species } from '../../engine/data';
import { ITEMS } from '../../engine/items';
import { LINKS } from '../../engine/links';
import { maxFxType } from '../../engine/match';
import { moveProfile } from '../../engine/moves';
import type { LeaderId } from '../../engine/rival-coach';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    Action,
    FLAG_BUFF,
    FLAG_CHARGED,
    FLAG_CHARGING,
    FLAG_CLONES,
    FLAG_DEBUFF,
    FLAG_DIG,
    FLAG_FLY,
    FLAG_GUARD,
    FLAG_MINI,
    FLAG_RAGE,
    type MatchEvent,
    type MatchSnapshot,
    SNAP_STRIDE,
    type TeamSetup,
    type TraitFx,
} from '../../engine/state';
import { dir8 } from '../../engine/vec';
import { dict, linkText, t as tr, typeName } from '../../i18n';
import type { ArrowSize, ChanceSpeed, CryStyle, NamesOnField, PlaybackSpeed } from '../../store/game-store';
import { bannerInk } from '../../store/profile';
import { readCount, writeCount } from '../../ui/local-count';
import {
    type BodyLean,
    ballSquashAt,
    bumpPose,
    DRIBBLE_LOSE,
    DRIBBLE_PUFFS,
    type DribblePose,
    diveDust,
    dribblePose,
    dribbleSlowAt,
    type FacingHold,
    type GoalReaction,
    goalReactionAt,
    goalReactions,
    halftimeEnd,
    holdFacing,
    keeperFacing,
    keeperRows,
    kickDepartures,
    kickHold,
    kickSquash,
    latestAt,
    MAX_CUE_EARLY,
    MAX_CUE_LATCH,
    maxCertain,
    maxCueNear,
    maxHitAhead,
    NAMED_DRIBBLE,
    type NamedDribble,
    namedDribblesOf,
    type RunBurst,
    runBurstPose,
    runBursts,
    runDustAt,
    SAVE_DIVE,
    SOLD_LEAN,
    type SoldDive,
    saveDivePose,
    soldDivePose,
    soldDives,
    strikeFrame,
    strikeLead,
    strikesNear,
    type Trap,
    trapPose,
    traps,
} from '../../ui/match-view';
import { MAX_BEAT, maxRing } from '../../ui/max-beat';
import { portraitSrc } from '../../ui/portrait';
import { lineAt, SHOWDOWN_MS, type ShowdownLine, showdownScript } from '../../ui/showdown-lines';
import { hexToNumber, TYPE_COLOR } from '../../ui/type-colors';
import {
    animForAction,
    animHit,
    animTiming,
    atlasKey,
    baseOf,
    bodyHeight,
    bodyShift,
    createExtraAnims,
    createSpeciesAnims,
    footOrigin,
    headTop,
    isShinySkin,
    preloadExtra,
    preloadSpecies,
    resolveAnim,
    shadowSize,
    skinOf,
    spriteBox,
} from '../animation-manager';
import { playCrowd, playCry, playGoalCry, playMax, playSample, playSfx } from '../audio';
import { trailParticle, typeBurst } from '../ball-trail';
import { BattleBox } from '../battle-box';
import {
    type CeremonyKind,
    type CeremonyPlan,
    ceremonyCamera,
    ceremonyPlan,
    endPose,
    FAN_FRAMES,
    type Fan,
    fanPose,
    HUDDLE_MS,
    halfMoon,
    huddle,
    INVADERS,
    invasionFans,
    type Pt,
    paintFan,
    reducedHold,
    TOSS_MS,
    tossHeight,
    WALK_MS,
} from '../ceremony';
import {
    type Box,
    CineRig,
    chroma,
    shockwave as cineShock,
    crack,
    crowdFlash,
    edgePoints,
    fitShot,
    impactFrame,
    inset,
    lightTrail,
    mangaPanels,
    type Panel,
    prewarmImpactFrame,
    type Shot,
    shotMid,
    speedLines,
    TypeFx,
    worldToScreen,
} from '../cine';
import { Cinematics, CROP_TEXT_SCALE, FOCUS_DEPTH } from '../cinematics';
import {
    drawBanner,
    drawBoards,
    drawCourt,
    ensureBallTexture,
    GAME_H,
    GAME_W,
    L,
    netRipple,
    PPM,
    W as PW,
    postShake,
    toPx,
} from '../court';
import { COURTS, WOOD } from '../court-themes';
import { EventBus } from '../EventBus';
import { blinkSchedule, evolutionView, RIVAL_EVO_MS } from '../evolution-view';
import { drawStars, drawStatusIcon, dust, effectWord, readableColor, shockwave } from '../hit-fx';
import {
    hurtSecondsAt,
    N1_FX_WORDS,
    type Reaction,
    reactionFor,
    showsWord,
    spanAt,
    WORD_RANK,
    WORD_TYPE,
} from '../hit-react';
import { firstFit, labelText, type Rect } from '../label-fit';
import { MAX_MOVE } from '../max-sfx';
import { chargeFx, drawProjectile, impactFx, MAX_CHARGE_MS, MAX_N12, releaseFx, typeBackdrop } from '../max-show';
import { castMove, preloadMoveFx } from '../move-fx';
import { duckMusic, musicDucked, unduckMusic } from '../music';
import { N3Story } from '../n3-story';
import { claimOverlay, PRIO_GOAL } from '../overlay-slot';
import { cutPortraitBg } from '../portrait-cut';
import { BASE_SPRITE_SCALE, gridShift, pixelFont, spriteScaleFor } from '../quality';
import { paintCup } from '../room-art';
import type { Quality } from '../sharp-canvas';
import { type Comemoracao, comemoracaoOf, GOAL_CELEB_MS, goalCelebPose } from '../walkout-plan';

export { GAME_H, GAME_W } from '../court';

export interface MatchSceneData {
    result: MatchResult;
    colors: [number, number];
    cries: CryStyle;
    speed: PlaybackSpeed;
    cinematic: boolean;
    /** Nomes na quadra: todos, só do seu time (time 0) ou nenhum. Padrão: todos. */
    namesOnField?: NamesOnField;
    /** Tamanho da setinha do seu time (Configurações). Padrão: média. */
    arrowSize?: ArrowSize;
    /** Velocidade nas chances de gol (Configurações; 0 = não cai). Padrão: 1x. */
    chanceSpeed?: ChanceSpeed;
    /** Reduzir movimento (já resolvido): câmera parada, sem tremida, clarão nem zoom. */
    reduceMotion?: boolean;
    /** Folhas (skinOf) que podem entrar em campo (bancos inteiros): pré-carregadas para substituições. */
    extraSpecies?: number[];
    /** Faixa da torcida de cada time (texto pronto; null = sem faixa). Copa: só a sua; Duelo: a de cada um. */
    banners?: [string | null, string | null];
    /** Placas dos Patrocínios da sua copa na beira de cima da quadra, na metade do rival (nome curto e cor da marca). */
    boards?: { text: string; color: number }[];
    /** Uniforme em quadra: cor secundária no disco embaixo do Pokémon (null = liso, só o anel na cor do time). */
    kits?: [{ color2: number } | null, { color2: number } | null];
    /** Duelo curto: toca N vezes mais rápido que a velocidade escolhida (a partida é a mesma). Padrão: 1. */
    pace?: number;
    /** Começa parada (tela de VERSUS); a partida só rola depois de 'match:resume'. */
    startPaused?: boolean;
    /** Retomando uma partida: começa deste tick (os eventos anteriores são aplicados sem animação). */
    startTick?: number;
    /** Final da copa: gol vale "explosão". */
    final?: boolean;
    /** Lado do jogador (setinha, torcida, evolução em tela cheia). Padrão: 0; no duelo o convidado é o 1. */
    mine?: 0 | 1;
    /**
     * Duelo ao vivo: tocar no Pokémon abre o painel sem pausar, e a evolução do rival segura a quadra o mesmo tempo
     * que a tela cheia segura a do outro lado (as duas telas seguem juntas).
     */
    duel?: boolean;
    /**
     * Beira da quadra (agência do técnico, experimento) na copa: a quadra para no pedido de tempo do seu time e antes
     * da disputa de pênaltis (pra escolher a ordem). No duelo nada para (as duas telas seguem juntas).
     */
    agency?: boolean;
    /**
     * Melhores momentos (src/ui/moments.ts): toca só esses trechos da partida, em sequência, com câmera lenta no
     * clímax. Nada para a quadra (intervalo, evolução em tela cheia, painel do jogador). Avisa 'replay:clip' (índice)
     * no começo de cada trecho e 'replay:done' no fim do último; 'replay:next' pula pro próximo.
     */
    replay?: { clips: ReplayClip[] };
    /** Quadra do ginásio do rival (Copa; src/game/court-themes.ts). Sem ela, a madeira de sempre. */
    court?: LeaderId;
    /** Os dois times como entraram: a carta de quem dribla dá nome ao drible (`namedDribblesOf`). Sem eles, nenhum. */
    setups?: [TeamSetup, TeamSetup];
    /**
     * Final da copa: se o seu time ganhar, a cerimônia na quadra depois do apito (`taca` em todo título, `invasao` no da
     * Rota). Avisa 'match:ceremony' (antes do 'match:ended') e 'match:ceremony-end'; 'match:ceremony-skip' pula pra foto.
     */
    ceremony?: CeremonyKind;
    /** Nome do seu time no letreiro da invasão. */
    teamName?: string;
}

/** Trecho do replay (ticks): toca [from, to] e fica em câmera lenta em [slowFrom, slowTo]. */
export interface ReplayClip {
    from: number;
    to: number;
    slowFrom: number;
    slowTo: number;
}

/** Velocidade da câmera lenta do replay no clímax (chute até o gol). */
const REPLAY_SLOW = 0.35;
/** Quadra mostrada com menos que isso de largura (celular em pé): nome colado em outro some em vez de descer. */
const COMPACT_W = 560;
/** Fade do nome que some/volta por estar colado em outro. */
const CROWD_FADE_MS = 180;
/** Modo fumaça (dev e prévias, nunca produção): `?vel=N` multiplica o ritmo da quadra (até 64x) pra fumaça andar rápido. */
const SMOKE_VEL = __SMOKE__
    ? Math.min(64, Math.max(1, Number(new URLSearchParams(location.search).get('vel')) || 1))
    : 1;

/** Janela do golpe máximo e período do goleiro-linha (pra aura na quadra). */
interface AgencySpan {
    idx: number;
    from: number;
    to: number;
}

/** Defesa seguida de escanteio até esse tanto de ticks depois: as duas faixas saem uma de cada vez. */
const CORNER_AFTER_SAVE_TICKS = 80;

/** Duelo: quanto a evolução do rival segura a quadra (a tela cheia do outro lado dura ~10 s). Copa: RIVAL_EVO_MS. */
const DUEL_EVO_HOLD_MS = 9500;

/**
 * Impacto, a régua única de "peso" dos lances (docs/planos/jogo-gostoso.md): todo efeito escolhe um nível em vez de
 * inventar tremida própria. Pausa (hit-stop, tempo real), tremida que decai e clarão crescem com a importância.
 */
export type ImpactLevel = 'whisper' | 'touch' | 'hit' | 'boom';
const IMPACT: Record<ImpactLevel, { stop: number; shake: [number, number]; flash: number }> = {
    whisper: { stop: 0, shake: [0, 0], flash: 0 },
    touch: { stop: 0, shake: [140, 0.003], flash: 0 },
    hit: { stop: 90, shake: [320, 0.007], flash: 180 },
    boom: { stop: 170, shake: [480, 0.012], flash: 260 },
};
/** Setinha do seu time: pequena era o tamanho antigo; o padrão (média) ficou um pouco maior. */
const ARROW_SCALE: Record<ArrowSize, number> = { small: 1, medium: 1.45, large: 2 };

/** Catmull-Rom: passa por p1 (t=0) e p2 (t=1) usando os vizinhos para a curva. */
const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) =>
    0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);

/** Ticks antes de um gol em que a partida cai para no máximo 1x (o gol é assistido em qualquer velocidade). */
const GOAL_LEAD = 16;

type PenaltyEvent = Extract<MatchEvent, { type: 'penalty' }>;

const TICK_RATE = FUTSAL_5.tickRate;
/** O bote de quem usa um golpe com alvo (ms até chegar nele): a reação do alvo espera ele (11/11: vinha antes). */
const MOVE_LUNGE_MS = 110;
/**
 * Câmera lenta do golpe máximo: a quadra cai pra essa velocidade `MAX_CUE_LEAD` ticks antes do botão acender e enquanto
 * ele está aceso (a hora certa dura ~0,4 s de jogo: assim fica ~1,5 s na tela).
 */
const MAX_CUE_SLOW = 0.25;
const MAX_CUE_LEAD = 12;
/**
 * Assim que o botão acende, a quadra quase para (bullet time) até o anel do QTE fechar (`maxRing`, mais a janela do
 * "bom"), em qualquer velocidade: dá pra ver e tocar mesmo no 8x. Antes do anel nascer, e no Duelo (as duas telas
 * seguram igual), por `MAX_CUE_HOLD_MS` real. Depois segue na câmera lenta de `MAX_CUE_SLOW` até a hora certa passar.
 */
const MAX_CUE_HOLD = 0.04;
const MAX_CUE_HOLD_MS = 2500;
/** Laranja do N2 (o `color-mix` de --yellow com 40% de --red do sideline.css). */
const MAX_N2_COLOR = 0xf6941c;
/** Dica "só o capitão solta" (A1): uma vez por aparelho (`local-count`). */
const MAX_CAP_HINT = 'soccermon-max-capitao';
/** O golpe saiu: a bola voa em câmera lenta até o desfecho (gol, defesa, trave, fora), em qualquer velocidade. */
const MAX_SHOT_SLOW = { n3: 0.2, other: 0.35, counter: 0.6 };
/** Ticks antes de gol/trave/defesa em que a câmera lenta começa. */
const DRAMA_LEAD = 12;
/**
 * A bola fica numa camada acima de todos os Pokémon, nomes e do escurecimento dos golpes
 * (só a caixa de narração e os textos de drama ficam por cima): nunca some atrás de alguém.
 */
const BALL_DEPTH = FOCUS_DEPTH + 200;
/** Reação do atingido (ícone, estrelinhas, palavra) e faixa do especial: acima do escurecimento, abaixo da bola. */
const REACT_DEPTH = BALL_DEPTH - 6;
/**
 * Onde cai o chute dentro do stinger (`max-stinger` v2, linha 10 a 150 BPM, `scripts/musica/pecas/especial-n3.mjs`):
 * ele começa atrasado o que a cena passa disso, pro 808, o bumbo e o prato baterem junto com o chute na tela.
 */
const N3_STINGER_KICK_MS = 1000;
/** Hit-stop no chute do N3 (ms reais): a câmera vai do close no capitão pro gol inteiro antes da bola sair. */
const N3_KICK_STOP_MS = 300;
/**
 * N3 na régua do Counter (Miguel, 04/11/2026; de linha e, desde a rodada do N1/N2, a bicuda N3 no chute comum): a quadra
 * congela no toque, em qualquer velocidade, e a cena dura `scene` ms reais (0,2 s a mais que a de antes, pro "X usou Y!"
 * ficar parado `bannerMs` legível; ele sai com a bola já saindo do pé). O close no capitão com a
 * bola no pé ocupa `fill` da faixa da tela entre o cut-in e a faixa (`closeY`, `closeH`; zoom de `closeMin` a
 * `closeMax`, holandês `dutch`, push-in `push`); o cut-in dos olhos só no começo (`cutInMs`, no alto, `cutInY`) e a
 * faixa embaixo dele (`bannerY`). No chute, o quadro de impacto (`impactMs`) e o chicote pro gol inteiro (`whipMs`); na
 * chegada, o soco na rede (`goalZoom`) e a câmera volta em `releaseMs`.
 */
const N3L = {
    scene: 1200,
    bannerMs: 1550,
    bannerY: 0.8,
    cutInMs: 560,
    cutInY: 0.15,
    closeY: 0.2,
    closeH: 0.5,
    fill: 0.72,
    closeMin: 2,
    closeMax: 3.4,
    dutch: 0.14,
    push: 1.14,
    impactMs: 200,
    whipMs: 260,
    goalZoom: 1.45,
    releaseMs: 900,
};
/** Depois da cena, quanto o stinger ainda toca (o SOC-CER-MON): a música volta do fundo no fim dele. */
const N3_STINGER_TAIL_MS = 1600;
/**
 * Bola do golpe máximo no ar, por nível (pedido do Miguel, 01/11: "a bola tem que ter uns efeitos especiais"): as
 * partículas do tipo a cada `every` ms (`n` por vez, espalhadas até `spread` px), o brilho (`glow`) e a grossura do
 * rastro (`trail`). N1 discreto, N3 forte.
 */
const MAX_BALL_FX = {
    1: { every: 26, n: 1, spread: 0, glow: 1.35, trail: 7 },
    2: { every: 18, n: 2, spread: 6, glow: 1.7, trail: 10 },
    3: { every: 12, n: 4, spread: 11, glow: 2.2, trail: 14 },
} as const;
/** Tremida no estouro do chute N1/N2 (ms, força, clarão branco em ms) e na chegada da bola, por nível. */
const MAX_KICK_SHAKE = { 1: [160, 0.005, 0], 2: [260, 0.009, 90] } as const;
const MAX_IMPACT_SHAKE = { 1: [200, 0.006], 2: [320, 0.011], 3: [560, 0.02] } as const;
/** Golpe máximo no ar: além do gol (rede e traves), quantos metros na frente dele ficam na tela (o mergulho do goleiro). */
const MAX_KEEP_FRONT = 3;
/** Rastro da bola: quantos ticks de jogo para trás ele alcança. */
const TRAIL_TICKS = 5;
/** Rastro do golpe máximo no ar (mais longo: a curva pro canto tem que aparecer). */
const MAX_TRAIL_TICKS = 16;
/**
 * Duelo da bicuda v3 (Miguel, 03/11/2026: "tem que parecer que ele revidou o chute com uma bicuda direta", "ângulos de
 * câmera mais ousados", "AINDA MAIS IMPRESSIONANTE"). O goleiro arma o chute `windup` ticks antes do contato e o tempo
 * para nele: a bola no pé, `lift` px no ar e `reach` m à frente dele, girando `spin` rad/s. A câmera (cine.ts): o contato
 * em close (`impactFill` da altura útil, até `impactMax`) com o COUNTER! parado até `panelsAt`, os painéis de mangá dali
 * até a 1ª fala, o close de
 * quem fala (`close`, zoom de `zMin` a `closeMax`) com push-in `push`, o grito do goleiro mais perto (`shoutClose`,
 * `shoutMax`) e a bicuda armada (`kickZoom`); ângulo holandês `dutch` (`dutchImpact`, `dutchShout`), chicote em `whipMs`.
 * No voo, a câmera lenta é `depart` nos `departTicks` da saída do pé, `slowFar` no meio e `slowNear` nos `nearM` m finais,
 * a câmera abre pra `flyZoom` com a bola `lead` da tela atrás do meio. O gol: `goalZoom` por `goalHold` ms. Pra dar
 * tempo de ler (Miguel, 03/11/2026): o quadro de impacto fica `impactFrameMs` (2 cores e negativo), GOOOOL! e BICUDA!
 * ficam `wordMs` cada (BICUDA! entra `bicudaWordAt` depois do gol, com o GOOOOL! já fora).
 */
const SD = {
    windup: 3,
    lift: 9,
    reach: 0.5,
    spin: 14,
    impactFill: 0.62,
    impactMax: 4.2,
    panelsAt: 2500,
    impactFrameMs: 320,
    wordMs: 2700,
    bicudaWordAt: 3200,
    close: 0.56,
    closeMax: 4.6,
    zMin: 1.8,
    shoutClose: 0.74,
    shoutMax: 5.6,
    kickZoom: 3.2,
    push: 1.09,
    dutch: 0.16,
    dutchImpact: 0.21,
    dutchShout: 0.25,
    whipMs: 200,
    depart: 0.13,
    departTicks: 3,
    slowFar: 0.85,
    slowNear: 0.17,
    nearM: 8,
    flyZoom: 1.6,
    lead: 0.2,
    goalZoom: 2.3,
    goalHold: 1150,
};

/** Bicuda N1/N2 (lançamento): a câmera lenta só na saída da bola. */
const MAX_BICUDA_SLOW_TICKS = 24;

/** Evolução que a tela React mostra grande no meio da tela. */
export interface MatchEvolution {
    team: 0 | 1;
    from: number;
    into: number;
    /** Nome antes e depois (apelido se tiver). */
    name: string;
    newName: string;
    shiny: boolean;
}

/**
 * Duelo da bicuda (motor 21): as falas que a tela React mostra (src/ui/components/ShowdownOverlay.tsx) por cima da
 * quadra enquanto o motor segura a partida. `tick` escolhe as falas; `ms` é a parada em 1x (a quadra roda em 1x nela, em
 * toda velocidade).
 */
export interface MatchShowdown {
    tick: number;
    ms: number;
    shooter: { speciesId: number; shiny: boolean; name: string; color: string };
    gk: { speciesId: number; shiny: boolean; name: string; color: string };
}

/** Faixa de gol/defesa que a tela React mostra no canto do time. */
export interface MatchHighlight {
    kind: 'goal' | 'owngoal' | 'save' | 'sub' | 'rivalEvolve' | 'tactic' | 'timeout' | 'flyGk' | 'max' | 'bicuda';
    team: 0 | 1;
    speciesId: number;
    shiny: boolean;
    name: string;
    /** Substituição: quem saiu. Evolução do rival: a forma anterior. */
    outSpeciesId?: number;
    outName?: string;
}

interface DiveInfo {
    tick: number;
    gk: number;
    /** Ponto do contato na tela (calculado na 1ª vez). */
    at: { x: number; y: number } | null;
    dusted: boolean;
}

const DRAMA = new Set(['goal', 'post', 'save', 'fulltime']);
/** Pênaltis: depois da cobrança que decide, quem bateu e o goleiro reagem sozinhos antes do time todo (ms). */
const END_AFTER_SHOOTOUT_MS = 600;

/** Golpe máximo por tipo: a receita de golpe (move-fx.ts) que anima o efeito de cada tipo no N3. */
const MAX_FX_RECIPE: Record<string, string> = {
    Normal: 'megapunch',
    Fire: 'fireblast',
    Water: 'surf',
    Electric: 'thunderbolt',
    Grass: 'vinewhip',
    Ice: 'blizzard',
    Fighting: 'doublekick',
    Poison: 'poisongas',
    Ground: 'earthquake',
    Flying: 'skyattack',
    Psychic: 'psychic',
    Bug: 'pinmissile',
    Rock: 'rockslide',
    Ghost: 'nightshade',
    Dragon: 'dragonrage',
    Fairy: 'lovelykiss',
};
/** O que o modo "Lances" mostra em 1x. */
const HIGHLIGHT = new Set([
    'shot',
    'goal',
    'save',
    'post',
    'penalty',
    'transform',
    'combo',
    'evolve',
    'corner',
    'aerial',
]);

/** Tinta do sprite por código de status do snapshot (o ícone desenhado fica em hit-fx.ts). */
const STATUS_VIEW: Record<number, { tint: number }> = {
    1: { tint: 0xfff07a },
    2: { tint: 0x9aa8c8 },
    3: { tint: 0xd9a3ff },
    4: { tint: 0xffa98a },
    5: { tint: 0xbfefff },
    6: { tint: 0xffffff },
    7: { tint: 0xffc6e3 },
};
const STATUS_KIND_TO_CODE: Record<string, number> = {
    par: 1,
    slp: 2,
    psn: 3,
    brn: 4,
    frz: 5,
    confusion: 6,
    infatuation: 7,
};

/**
 * Traços de golpe (evento 'trait'): texto que sobe da cabeça, cor e a linha da caixa de batalha.
 * `who` = nome de quem usou, `move` = nome do golpe, `n` = número do efeito (acertos, vítimas).
 */
const TRAIT_VIEW: Partial<
    Record<
        TraitFx,
        { pop: (n: number) => string; color: string; line?: (who: string, move: string, n: number) => string }
    >
> = {
    crit: { pop: () => tr('battle.pop.crit'), color: '#ffd447', line: (w) => tr('battle.line.crit', { w }) },
    focusBug: {
        pop: () => tr('battle.pop.focusBug'),
        color: '#c8c8c8',
        line: (w) => tr('battle.line.focusBug', { w }),
    },
    charge: {
        pop: () => tr('battle.pop.charge'),
        color: '#fff3a0',
        line: (w, m) => tr('battle.line.charge', { w, m }),
    },
    chargeLost: {
        pop: () => tr('battle.pop.chargeLost'),
        color: '#ff7a7a',
        line: (w, m) => tr('battle.line.chargeLost', { w, m }),
    },
    noRecharge: {
        pop: () => tr('battle.pop.noRecharge'),
        color: '#9be7ff',
        line: (w) => tr('battle.line.noRecharge', { w }),
    },
    fly: { pop: () => tr('battle.pop.fly'), color: '#bfe3ff', line: (w) => tr('battle.line.fly', { w }) },
    dig: { pop: () => tr('battle.pop.dig'), color: '#d9b07a', line: (w) => tr('battle.line.dig', { w }) },
    land: { pop: () => tr('battle.pop.land'), color: '#ffffff' },
    priority: {
        pop: () => tr('battle.pop.priority'),
        color: '#ffffff',
        line: (w) => tr('battle.line.priority', { w }),
    },
    area: { pop: (n) => (n > 1 ? tr('battle.pop.areaMany', { n }) : tr('battle.pop.area')), color: '#ffb05c' },
    pierce: {
        pop: () => tr('battle.pop.pierce'),
        color: '#ffd447',
        line: (w, m) => tr('battle.line.pierce', { w, m }),
    },
    lob: { pop: () => tr('battle.pop.lob'), color: '#fff7d6', line: (w) => tr('battle.line.lob', { w }) },
    blind: {
        pop: () => tr('battle.pop.blind'),
        color: '#e8d9a0',
        line: (w, m) => tr('battle.line.blind', { w, m }),
    },
    fixed: { pop: () => tr('battle.pop.fixed'), color: '#d9a7ff' },
    halfEnergy: {
        pop: () => tr('battle.pop.halfEnergy'),
        color: '#ff7a7a',
        line: (w) => tr('battle.line.halfEnergy', { w }),
    },
    throw: { pop: () => tr('battle.pop.throw'), color: '#ffb05c', line: (w) => tr('battle.line.throw', { w }) },
    trip: { pop: () => tr('battle.pop.trip'), color: '#ffb05c' },
    multi: {
        pop: (n) => tr('battle.pop.multi', { n }),
        color: '#ffffff',
        line: (w, _m, n) => tr('battle.line.multi', { w, n }),
    },
    rebound: { pop: () => tr('battle.pop.rebound'), color: '#fff3a0', line: (w) => tr('battle.line.rebound', { w }) },
    reach: { pop: () => tr('battle.pop.reach'), color: '#a8ffb0' },
    wrap: { pop: () => tr('battle.pop.wrap'), color: '#ffb05c', line: (w) => tr('battle.line.wrap', { w }) },
    clampHold: { pop: () => tr('battle.pop.clampHold'), color: '#9be7ff' },
    zone: { pop: () => tr('battle.pop.zone'), color: '#d8d8d8' },
    toxic: { pop: () => tr('battle.pop.toxic'), color: '#d48cff', line: () => tr('battle.line.toxic') },
    rageUp: { pop: (n) => tr('battle.pop.rageUp', { n }), color: '#ff5c5c' },
    bide: {
        pop: () => tr('battle.pop.bide'),
        color: '#ffffff',
        line: (w, _m, n) => (n ? tr('battle.line.bideStored', { w, n }) : tr('battle.line.bide', { w })),
    },
    clones: { pop: () => tr('battle.pop.clones'), color: '#d8e8ff', line: (w) => tr('battle.line.clones', { w }) },
    clone: { pop: () => tr('battle.pop.clone'), color: '#d8e8ff', line: (w) => tr('battle.line.clone', { w }) },
    mini: { pop: () => tr('battle.pop.mini'), color: '#ffd9f0' },
    guard: { pop: () => tr('battle.pop.guard'), color: '#9fc4e8' },
    curl: { pop: () => tr('battle.pop.curl'), color: '#ffd9a0' },
    wall: { pop: () => tr('battle.pop.wall'), color: '#c8f0ff', line: (w) => tr('battle.line.wall', { w }) },
    wallBlock: {
        pop: () => tr('battle.pop.wallBlock'),
        color: '#c8f0ff',
        line: (w) => tr('battle.line.wallBlock', { w }),
    },
    flee: { pop: () => tr('battle.pop.flee'), color: '#ff9a9a' },
    blowBall: { pop: () => tr('battle.pop.blowBall'), color: '#e0f7ff' },
    bulldoze: { pop: () => tr('battle.pop.bulldoze'), color: '#ffb05c' },
    typeCopy: { pop: () => tr('battle.pop.typeCopy'), color: '#d9a7ff' },
    teamHeal: { pop: () => tr('battle.pop.teamHeal'), color: '#7dff8a' },
    coins: { pop: () => tr('battle.pop.coins'), color: '#ffd447', line: () => tr('battle.line.coins') },
};

/** Zona desenhada no chão (fumaça, anel de fogo, muro): some quando o tempo dela acaba. */
interface ZoneView {
    from: number;
    to: number;
    obj: Phaser.GameObjects.Shape;
    /** 'wall' ou o golpe; x/y em metros, como vêm no evento (o muro que segura o chute é achado por eles). */
    kind: string;
    x: number;
    y: number;
}

interface PlayerView {
    speciesId: number;
    /** Folha do sprite em campo (espécie, ou a shiny de verdade: animation-manager `skinOf`). */
    skin: number;
    team: 0 | 1;
    name: string;
    shiny: boolean;
    captain: boolean;
    sprite: Phaser.GameObjects.Sprite;
    shadow: Phaser.GameObjects.Ellipse;
    ring: Phaser.GameObjects.Ellipse;
    label: Phaser.GameObjects.Text;
    badge: Phaser.GameObjects.Text;
    /** Setinha vermelha na cabeça dos jogadores do seu time. */
    arrow: Phaser.GameObjects.Triangle | null;
    currentKey: string;
    status: number;
    flags: number;
    /** Deslocamento temporário do sprite (investida do golpe). */
    lunge: { x: number; y: number };
    /**
     * Duelo da bicuda: a animação e o lado que a cena manda, no lugar dos do motor; `frame` = de que quadro ela começa e
     * `hold` = parada nele (o tempo congelado).
     */
    act: { anim: string; facing: number; frame?: number; hold?: boolean } | null;
    /** Duelo da bicuda: o corpo inteiro (sprite, sombra, anel) fora do lugar do motor (px): quem chutou fica no chute. */
    shift: { x: number; y: number };
    /** Em animação de evolução: a cena não troca a animação dele. */
    evolving: boolean;
    /** Entrando na quadra vindo da lateral (substituição): de onde, quando começa e quanto dura (tempo real). */
    enter: { from: { x: number; y: number }; start: number; dur: number } | null;
    /** Clones do Double Team (criados na primeira vez). */
    clones: Phaser.GameObjects.Sprite[];
    /** Piscando de carga (Solar Beam, Bide...). */
    glowing: boolean;
    /** Pose do capitão no "Vamooo!" (hora real em que começou; 0 = nenhuma). Só visual: o lance sempre vence. */
    pose: number;
    /** Nome aparecendo (1) ou escondido por estar colado em outro (0), com fade entre os dois (celular em pé). */
    crowd: number;
    /** No chão (tombo) ou tonto (estrelinhas), em ticks de jogo; `dir` = lado pro qual tomba. */
    down: { from: number; to: number; dir: number; tumble: boolean } | null;
    /** Trecho (ticks) do status atual, pro anel de contagem do ícone. */
    stSpan: { code: number; from: number; to: number } | null;
    /** Palavra de reação na tela agora (uma por vez; a de mais prioridade vence). */
    word: { obj: Phaser.GameObjects.Text; rank: number; at: number; text: string } | null;
    /** Inclinação do corpo (rad) que a cena pede (mergulho do goleiro); o tombo passa por cima. */
    tilt: number;
    /** Esticado no mergulho: volta ao tamanho normal quando acaba. */
    stretched: boolean;
    /** Goleiro na área: a direção mostrada e quando ela trocou (histerese, `holdFacing`). */
    faceHold: FacingHold | null;
}

/** Corpo inclinado (rad) e esticado (escala em x e y) num mergulho ou reação. */
type Lean = BodyLean;

/** Pose do capitão (emote "Vamooo!"): quanto dura e quanto dela é juntando força antes da pose (tempo real). */
const POSE_MS = 1600;
const POSE_CHARGE_MS = 450;

export class MatchScene extends Phaser.Scene {
    private md!: MatchSceneData;
    private snaps: MatchSnapshot[] = [];
    private matchEvents: MatchEvent[] = [];
    private eventCursor = 0;
    private playTick = 0;
    private lastEventTick = 0;
    /** Playback não passa deste tick enquanto a partida é resimulada (tática ao vivo). */
    private holdAt = Number.POSITIVE_INFINITY;
    /** Parada no apito do intervalo (tick dele) até o técnico mandar começar o 2º tempo. */
    private halftimeAt: number | null = null;
    /** Duelo: não passa do fim do último trecho aberto pelos dois (lacres). */
    private segHold = Number.POSITIVE_INFINITY;
    /** Duelo: correção do relógio do convidado (0,9–1,1; 0 = espera o host). */
    private rate = 1;
    private speed: PlaybackSpeed = 1;
    private get mine(): 0 | 1 {
        return this.md.mine ?? 0;
    }
    private players: PlayerView[] = [];
    private ball!: Phaser.GameObjects.Image;
    /** Ícones de status com anel de contagem e estrelinhas de tonto (redesenhados a cada quadro). */
    private reactG!: Phaser.GameObjects.Graphics;
    /** Chute do golpe máximo no ar: o impacto (gol, defesa, bloqueio, trave) solta a explosão do nível, na cor do tipo. */
    private maxImpact: { tick: number; type: string; level: 1 | 2 | 3 } | null = null;
    /**
     * Golpe máximo no ar, do chute ao desfecho (`until`, tick de segurança): a câmera fica no gol atacado (`team` ataca)
     * inteiro e pan e zoom dos outros lances não mexem nela (`lockMaxFrame`; a quadra grande lê em `camSubject`).
     */
    private maxFrame: { team: 0 | 1; until: number } | null = null;
    /** Pan e zoom de verdade da câmera (os da `cameras.main` passam pela trava do golpe máximo). */
    private rawPan!: (x: number, y: number, ms: number) => void;
    private rawZoom!: (zoom: number, ms: number) => void;
    /**
     * A carga do golpe máximo (N1/N2) e a cena do N3 seguram a quadra até o chute na tela (o timer do Phaser atrasa em
     * quadro lento e a bola saía antes do chute): solta no próprio callback do chute.
     */
    private maxHold = false;
    /** Golpe máximo no ar: câmera lenta até o desfecho e o brilho na bola (cor do tipo no N3). */
    private maxSlow: { until: number; factor: number; color: number; level: number; type: string } | null = null;
    /**
     * Duelo da bicuda: do lance (`tick`) até a bicuda (`kick`) a quadra roda em 1x cravado (a cutscene na tela é em tempo
     * real); da bicuda ao fim da comemoração (`until`), no máximo 1x.
     */
    private showdown: { tick: number; kick: number; until: number; gk: number } | null = null;
    /**
     * A cutscene está na tela: a cada quadro, quanto da parada já passou (`match:showdown-t`, ms em 1x); sai quando a
     * reprodução passa da bicuda, até pulando (`match:showdown-end`).
     */
    private showdownOpen = false;
    /** O duelo na quadra (`stageShowdown`): o instante congelado, as falas e as deixas que faltam (ms desde o lance). */
    private sdStage: {
        gk: PlayerView;
        shooter: PlayerView;
        gkFace: number;
        shooterFace: number;
        /** A bola parada no pé do goleiro (px, no chão) e pra onde vai a bicuda (unitário). */
        contact: { x: number; y: number };
        /** Onde as faíscas da bola nascem (a bola no ar). */
        spark: { x: number; y: number };
        dir: { x: number; y: number };
        /** O lado do goleiro (1: ele defende o gol da esquerda): o giro dos planos dele. */
        side: number;
        type: string;
        color: number;
        script: ShowdownLine[];
        line: number;
        ms: number;
        cues: { at: number; run: () => void }[];
        streams: { stop: () => void; rate: (ms: number) => void }[];
        crack: { fade: (ms: number) => void } | null;
        /** O goleiro treme segurando a energia (o grito e a bicuda armada). */
        strain: boolean;
        /** O tempo já parou (o contato passou): a bola fica no pé dele. */
        frozen: boolean;
    } | null = null;
    /** O lance do duelo (o contato): o goleiro arma o chute `SD.windup` ticks antes. */
    private sdSave: {
        tick: number;
        kick: number;
        gk: number;
        shooter: number;
        /** O chute de quem chutou (o N3 que o goleiro parou): ele fica ali, no fim do chute. */
        shotTick: number;
        armed: boolean;
    } | null = null;
    /** A bicuda no ar: a câmera vai junto com a bola até o gol (`team` ataca). */
    private sdFly: {
        team: 0 | 1;
        kick: number;
        until: number;
        dir: { x: number; y: number };
        gk: PlayerView;
        shooter: PlayerView | null;
        following: boolean;
        stream: { stop: () => void } | null;
        lines: { stop: () => void } | null;
        /** 0..1: o quanto a bola está voando rápido agora (o meio do campo), pras linhas e o rastro. */
        speed: number;
    } | null = null;
    /** A câmera de cinema do duelo (cine.ts) e as partículas por tipo. */
    private rig!: CineRig;
    private fx!: TypeFx;
    /** A borda da câmera volta quando o quadro dela couber de novo na quadra (senão daria um salto). */
    private sdBoundsPending = false;
    /** Onde começa a caixa das falas na tela (px do canvas), medido na caixa da tela React. */
    private sdBoxAt: number | null = null;
    /** Até quando (tempo real) a cena do especial N3 está na tela. */
    private n3SceneUntil = 0;
    /**
     * N3 do capitão de linha (`lineSuper`), da cena até a câmera voltar: a história do tipo (n3-story.ts), quem chutou, o
     * tipo, o fluxo do tipo na bola e as linhas de velocidade do voo. `home`: a câmera de cinema no plano da quadra
     * inteira (a quadra grande do celular segura o gol como sempre).
     */
    private n3: {
        story: N3Story;
        cap: PlayerView;
        type: string;
        color: number;
        until: number;
        flying: boolean;
        landed: boolean;
        home: boolean;
        dir: { x: number; y: number };
        aura: { stop: () => void } | null;
        stream: { stop: () => void } | null;
        lines: { stop: () => void } | null;
    } | null = null;
    /**
     * Golpe máximo N1/N2 e bicuda N1/N2 no ar (`maxShow`), do chute até a chegada: as partículas do tipo na bola, a
     * história do tipo em versão curta (N2 e bicuda) e até quando vale (`until`, tick).
     */
    private maxRun: {
        by: number;
        type: string;
        level: 1 | 2;
        bicuda: boolean;
        story: N3Story | null;
        stream: { stop: () => void } | null;
        at: number;
        until: number;
        landed: boolean;
        /** N2: a onda no chão (por onde a bola passou, px e hora), a faixa de quem cai. */
        wave: { x: number; y: number; t: number }[];
    } | null = null;
    private maxWaveG: Phaser.GameObjects.Graphics | null = null;
    private maxBallG: Phaser.GameObjects.Graphics | null = null;
    private maxBallPrev: { x: number; y: number } | null = null;
    /** Para onde o projétil anda na tela (px por quadro, suavizado): a cauda vai pro lado contrário. */
    private maxBallDir = { x: 0, y: 0 };
    /** Hora (`performance.now`) em que o botão do golpe máximo acendeu, pro bullet time. */
    private cueSince: number | null = null;
    private ballGlow!: Phaser.GameObjects.Arc;
    private ballShadow!: Phaser.GameObjects.Ellipse;
    private trailG!: Phaser.GameObjects.Graphics;
    private trail: { x: number; y: number; tick: number }[] = [];
    private ballFree = false;
    /** Escala extra da bola no chute/quique (o "peso" do contato), animada por tween. */
    private ballPop = { v: 1 };
    private lastBz = 0;
    private ballColor = 0xffffff;
    /** Tipo do golpe na bola agora ('' sem golpe) e quando saiu a última partícula do rastro. */
    private ballType = '';
    private lastTrailAt = 0;
    private lastBall = { x: 0, y: 0 };
    private dives: DiveInfo[] = [];
    /** Mergulhos vendidos; `side` (bola abaixo/acima dele na tela) sai na 1ª vez que aparece. */
    private sold: (SoldDive & { toBall: { x: number; y: number } | null; dusted: boolean })[] = [];
    /** Goleiro cabisbaixo depois do gol sofrido. */
    private reacts: GoalReaction[] = [];
    /** Gols (quem marcou e o tick): a comemoração no jeito da espécie (`goalCelebPose`). */
    private goalsBy: { by: number; tick: number }[] = [];
    /** Dribles com nome (só tela); a bola em px no carrinho sai na 1ª vez que aparece. */
    private ghostAt = 0;
    /** O "?" em cima de quem levou o drible e o tick do quadro anterior (a poeirinha sai ao cruzar o tick dela). */
    private huh: Phaser.GameObjects.Text | null = null;
    private trickTick = 0;
    /** 1 com a bola no pé de quem dribla, indo a 0 quando ela sai (o enfeite da bola vai junto). */
    private trickOwn = 1;
    private named: (NamedDribble & { toBall: { x: number; y: number } | null })[] = [];
    /** Squash & stretch fora do gol (só tela): arrancadas/freadas e dominadas por jogador, e os choques do desarme. */
    private runs: RunBurst[][] = [];
    private trapsBy: Trap[][] = [];
    private bumps: { tick: number; by: number; victim: number; dusted: boolean }[] = [];
    /** Bola amassando no impacto (chute forte, trave): quando (tempo real), quanto e em que eixo (rad). */
    private ballSquash = { at: -1e9, amp: 0, angle: 0 };
    /** Tick em que a bola sai do pé em cada passe e chute, por jogador (`kickDepartures`). */
    private departs = new Map<number, number[]>();
    /** Deslocamento suavizado da bola em relação a quem conduz. */
    private dribble = { owner: -1, x: 0, y: 0, tick: 0, cx: 0, cy: 0, travel: 0, reach: 1 };
    /** Drible (0..1) de cada espécie, para o tamanho dos toques de condução. */
    private dribbleSkill = new Map<number, number>();
    /** Até quando (tempo real) a partida fica parada (evolução, substituição). */
    private holdReal = 0;
    private evoQueue: { view: PlayerView; from: number; into: number; newName: string }[] = [];
    private evoTimer?: Phaser.Time.TimerEvent;
    private battleBox!: BattleBox;
    private cine!: Cinematics;
    private ended = false;
    private lastEmit = 0;
    private dramaTicks: number[] = [];
    private goalTicks: number[] = [];
    /** Os golpes máximos que saem na partida (os dois times): a câmera lenta chegando. */
    private maxHits: MatchEvent[] = [];
    private highlightTicks: number[] = [];

    /** Disputa de pênaltis (acontece depois do último snapshot: a cena anima sozinha). */
    private penalties: PenaltyEvent[] = [];
    private fulltimeTick = Number.POSITIVE_INFINITY;
    private shootoutOn = false;
    private penaltyStage: number[] = [];
    /** Já parou pra escolher a ordem dos pênaltis (uma vez por partida). */
    private penPicked = false;
    private flySpans: AgencySpan[] = [];
    private agencyG?: Phaser.GameObjects.Graphics;
    private linePos = new Map<number, { x: number; y: number }>();
    private viewPos = new Map<number, { x: number; y: number }>();
    private uiScale = 1;
    /** Resolução do canvas (sharp-canvas.ts; o governador de fps mexe nela). */
    private quality?: Quality;
    /** Escala do sprite (px do jogo): inteira em pixels do canvas quando dá (`spriteScaleFor`). */
    private ssNow = BASE_SPRITE_SCALE;
    /** Resolução dos nomes: 1 pixel do texto por pixel do canvas. */
    private textRes = 2;
    /** Objetos levados pro pixel inteiro neste quadro e a posição de antes (voltam depois do desenho). */
    private readonly snapped: { o: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text; x: number; y: number }[] = [];
    /** Quanto dos zooms dos lances vale (1 = tudo; a quadra grande do ?lab=hud já vem ampliada). */
    private zoomDamp = 1;
    /** Câmera da quadra grande: quem conduz (px do mundo, null com a bola solta) e pra que lado o time da bola ataca. */
    private camCarrier: { x: number; y: number } | null = null;
    private camAttack = 1;
    private readonly labelWidths = new Map<string, number>();
    private unbind?: () => void;
    /** O jogador tocou em "Esperar" no golpe máximo (Match.tsx, `maxWaitNext`): sem câmera lenta até a tela soltar. */
    private maxWait = false;
    private onMaxWait = (on: boolean) => {
        this.maxWait = on;
    };

    constructor() {
        super('Match');
    }

    preload() {
        this.md = this.registry.get('matchData') as MatchSceneData;
        for (const id of [...this.allSpecies(), ...this.ceremonySpecies()]) preloadSpecies(this, id);
        // o Sit de quem perdeu (fim de jogo): o atlas extra, como a Sala (~3 KB cada)
        for (const p of this.md.result.finalRoster) preloadExtra(this, skinOf(p.speciesId, p.shiny));
        preloadMoveFx(this);
        // retrato PMD dos capitães (e da forma evoluída) pra faixa do especial N3
        for (const p of [...this.md.result.roster, ...this.md.result.finalRoster]) {
            if (!p.captain) continue;
            for (const id of [p.speciesId, ...species(p.speciesId).evolvesTo.map((e) => e.id)]) {
                const key = `portrait-${id}`;
                if (id <= 151 && !this.textures.exists(key)) this.load.image(key, portraitSrc(id, ['determined']));
            }
        }
        // drible com nome: a faixa mostra o retrato de quem driblou (sem ele, a faixa do Persian saía sem rosto)
        const setups = this.md.setups;
        if (setups && !this.md.replay)
            for (const d of namedDribblesOf(this.md.result, setups)) {
                const ids = [this.md.result.roster[d.by]?.speciesId, this.md.result.finalRoster[d.by]?.speciesId];
                for (const id of ids) {
                    const key = `portrait-${id}`;
                    if (id && id <= 151 && !this.textures.exists(key))
                        this.load.image(key, portraitSrc(id, ['determined']));
                }
            }
        // duelo da bicuda: os rostos dos painéis de mangá (quem chutou com dor ou espantado, o goleiro decidido)
        const sd = this.md.result.events.find((x) => x.type === 'showdown');
        if (sd?.type === 'showdown')
            for (const [idx, faces] of [
                [sd.shooter, ['pain', 'surprised']],
                [sd.gk, ['determined', 'shouting']],
            ] as const) {
                const id = this.md.result.roster[idx]?.speciesId;
                if (id && id <= 151) this.load.image(`sdface-${id}`, portraitSrc(id, faces));
            }
    }

    create() {
        const { result } = this.md;
        this.speed = this.md.speed;
        this.setTimeline(result);
        this.playTick = this.snaps[0]?.tick ?? 0;
        if (this.md.reduceMotion) this.steadyCamera();
        const cam = this.cameras.main;
        // panorâmica no canto (escanteio, golpe na linha) não mostra o vazio fora da quadra
        cam.setBounds(0, 0, GAME_W, GAME_H);
        const zoomTo = cam.zoomTo.bind(cam);
        const pan = cam.pan.bind(cam);
        this.rawZoom = (zoom, ms) => zoomTo(1 + (zoom - 1) * this.zoomDamp, ms, 'Sine.easeInOut', true);
        this.rawPan = (x, y, ms) => pan(x, y, ms, 'Sine.easeInOut', true);
        // o golpe máximo no ar segura a câmera no gol: o resto (holofote, drama, golpe, volta pro meio) espera ele chegar
        // a cerimônia do título também manda na câmera (o drama do FIM DE JOGO não puxa ela de volta pro meio)
        cam.zoomTo = (zoom, ...rest) =>
            this.frameLocked() || this.cer ? cam : zoomTo(1 + (zoom - 1) * this.zoomDamp, ...rest);
        cam.pan = (x, y, ...rest) => (this.frameLocked() || this.cer ? cam : pan(x, y, ...rest));

        drawCourt(this, this.md.court ? COURTS[this.md.court] : undefined);
        for (const team of [0, 1] as const) {
            const text = this.md.banners?.[team];
            if (text) drawBanner(this, team, text, this.md.colors[team], bannerInk(this.md.colors[team]));
        }
        if (this.md.boards?.length) drawBoards(this, this.md.boards);
        ensureBallTexture(this);
        for (const p of result.roster) {
            createSpeciesAnims(this, skinOf(p.speciesId, p.shiny));
            this.players.push(this.createPlayerView(p.speciesId, p.team, p.name, p.shiny, p.captain));
        }
        for (const id of this.allSpecies()) createSpeciesAnims(this, id);
        for (const p of result.finalRoster) createExtraAnims(this, skinOf(p.speciesId, p.shiny));

        this.ballShadow = this.add.ellipse(0, 0, 14, 6, 0x000000, 0.35);
        this.trailG = this.add.graphics();
        this.ballGlow = this.add.circle(0, 0, 13, 0xffffff, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.ball = this.add.image(0, 0, 'ball').setDepth(BALL_DEPTH);
        this.reactG = this.add.graphics().setDepth(REACT_DEPTH);
        this.battleBox = new BattleBox(this, GAME_W / 2, GAME_H - 30, 560);
        this.cine = new Cinematics(this);
        this.rig = new CineRig(this, !!this.md.reduceMotion);
        this.cine.rig = this.rig;
        this.fx = new TypeFx(this);
        // o retrato sem fundo dos capitães e o filtro do quadro de impacto já prontos na abertura: feitos na hora do
        // golpe, cada um era um quadro de ~20 ms no meio do lance (o letreiro do N2 e a bicuda, o chute)
        for (const p of this.md.result.roster) if (p.captain) this.cutPortrait(`portrait-${p.speciesId}`);
        prewarmImpactFrame(this, !!this.md.reduceMotion);

        const onResize = () => this.updateUiScale();
        this.scale.on('resize', onResize);
        this.updateUiScale();
        this.quality = this.registry.get('quality') as Quality | undefined;
        this.game.events.on(Phaser.Core.Events.PRE_RENDER, this.pixelGrid, this);
        this.game.events.on(Phaser.Core.Events.POST_RENDER, this.unsnap, this);

        EventBus.on('match:set-speed', this.onSpeed, this);
        EventBus.on('match:skip', this.onSkip, this);
        EventBus.on('match:hold', this.onHold, this);
        EventBus.on('match:replace', this.onReplace, this);
        EventBus.on('match:seek-fulltime', this.onSeekFulltime, this);
        EventBus.on('match:resume', this.onResume, this);
        EventBus.on('match:evolution-done', this.onEvolutionDone, this);
        EventBus.on('match:inspect-close', this.onInspectClose, this);
        EventBus.on('match:inspect-request', this.onInspectRequest, this);
        EventBus.on('match:rate', this.onRate, this);
        EventBus.on('match:seek', this.onSeek, this);
        EventBus.on('match:seg-hold', this.onSegHold, this);
        EventBus.on('replay:next', this.nextClip, this);
        EventBus.on('match:captain-pose', this.onCaptainPose, this);
        this.maxWait = false;
        EventBus.on('match:max-wait', this.onMaxWait, this);
        this.unbind = () => {
            EventBus.off('match:max-wait', this.onMaxWait, this);
            EventBus.off('replay:next', this.nextClip, this);
            EventBus.off('match:captain-pose', this.onCaptainPose, this);
            EventBus.off('match:rate', this.onRate, this);
            EventBus.off('match:seek', this.onSeek, this);
            EventBus.off('match:seg-hold', this.onSegHold, this);
            EventBus.off('match:seek-fulltime', this.onSeekFulltime, this);
            EventBus.off('match:resume', this.onResume, this);
            EventBus.off('match:evolution-done', this.onEvolutionDone, this);
            EventBus.off('match:inspect-close', this.onInspectClose, this);
            EventBus.off('match:inspect-request', this.onInspectRequest, this);
            EventBus.off('match:set-speed', this.onSpeed, this);
            EventBus.off('match:skip', this.onSkip, this);
            EventBus.off('match:hold', this.onHold, this);
            EventBus.off('match:replace', this.onReplace, this);
            this.scale.off('resize', onResize);
            this.game.events.off(Phaser.Core.Events.PRE_RENDER, this.pixelGrid, this);
            this.game.events.off(Phaser.Core.Events.POST_RENDER, this.unsnap, this);
        };
        this.sys.events.once('shutdown', () => this.unbind?.());
        this.sys.events.once('destroy', () => this.unbind?.());

        this.paused = !!this.md.startPaused;
        if (!this.paused && !this.md.replay) playSample('apito');
        this.applySnapshot(0, 0);
        if (this.md.startTick) this.seekTo(this.md.startTick);
        const firstClip = this.md.replay?.clips[0];
        if (firstClip) {
            this.seekTo(firstClip.from);
            EventBus.emit('replay:clip', 0);
        }
        this.preloadEvolutions();
        // (dev) testes visuais disparam golpes direto: __soccermonFx('thunder', 0, 6)
        if (import.meta.env.DEV) {
            (window as unknown as { __soccermonFx?: unknown }).__soccermonFx = (
                id: string,
                by: number,
                t: number | null,
            ) => this.moveFx(by, id, MOVES[id]?.type ?? 'Normal', t, true);
        }
        EventBus.emit('current-scene-ready', this);
    }

    /** Folhas de sprite que a partida pode usar (escalações, bancos; shiny com a folha shiny). */
    private allSpecies(): Set<number> {
        const { result, extraSpecies = [] } = this.md;
        return new Set(
            [...result.roster, ...result.finalRoster].map((p) => skinOf(p.speciesId, p.shiny)).concat(extraSpecies),
        );
    }

    /**
     * Formas evoluídas de quem está em jogo (evolução no meio da partida): carregam em segundo plano depois que
     * a quadra abre, para não atrasar o início. Uma evolução por jogador por partida, então basta o próximo estágio.
     */
    private preloadEvolutions() {
        const next = new Set<number>();
        for (const skin of this.allSpecies()) {
            for (const e of species(baseOf(skin)).evolvesTo) {
                const into = skinOf(e.id, isShinySkin(skin));
                if (e.id <= 151 && !this.textures.exists(atlasKey(into))) next.add(into);
            }
        }
        if (!next.size) return;
        for (const id of next) preloadSpecies(this, id);
        this.load.once('complete', () => {
            for (const id of next) if (this.textures.exists(atlasKey(id))) createSpeciesAnims(this, id);
        });
        this.load.start();
    }

    private setTimeline(result: MatchResult) {
        this.snaps = result.snapshots;
        this.matchEvents = result.events;
        this.lastEventTick = this.matchEvents.at(-1)?.tick ?? 0;
        this.dramaTicks = this.matchEvents.filter((e) => DRAMA.has(e.type)).map((e) => e.tick);
        // gol, trave e defesa desaceleram igual: a câmera lenta não pode entregar que vai ser gol
        this.goalTicks = this.dramaTicks;
        this.highlightTicks = this.matchEvents.filter((e) => HIGHLIGHT.has(e.type)).map((e) => e.tick);
        this.maxHits = this.matchEvents.filter((e) => e.type === 'max' && e.phase === 'hit');
        this.departs = kickDepartures(this.matchEvents);
        this.penalties = this.matchEvents.filter((e): e is PenaltyEvent => e.type === 'penalty');
        // o lance do duelo da bicuda não tem mergulho: o goleiro arma a bicuda e para a bola no pé (`sdWindup`)
        const duel = this.matchEvents.find((e) => e.type === 'showdown');
        this.sdSave =
            duel?.type === 'showdown'
                ? {
                      tick: duel.tick,
                      kick: duel.kick,
                      gk: duel.gk,
                      shooter: duel.shooter,
                      shotTick: this.matchEvents.reduce(
                          (t, x) => (x.type === 'shot' && x.by === duel.shooter && x.tick <= duel.tick ? x.tick : t),
                          duel.tick,
                      ),
                      armed: false,
                  }
                : null;
        const noDive = duel && !this.md.replay ? duel.tick : -1;
        this.dives = this.matchEvents.flatMap((e) =>
            e.type === 'save' && e.tick !== noDive ? [{ tick: e.tick, gk: e.by, at: null, dusted: false }] : [],
        );
        this.sold = soldDives(this.snaps, this.matchEvents, FUTSAL_5.teamSize).map((d) => ({
            ...d,
            toBall: null,
            dusted: false,
        }));
        this.reacts = goalReactions(this.matchEvents, this.sold, (team, tick) => this.keeperAt(team, tick));
        this.goalsBy = this.matchEvents.flatMap((e) =>
            e.type === 'goal' && !e.ownGoal ? [{ by: e.by, tick: e.tick }] : [],
        );
        const n = result.roster.length;
        this.runs = Array.from({ length: n }, () => []);
        for (const b of runBursts(this.snaps, n)) this.runs[b.by].push(b);
        this.trapsBy = Array.from({ length: n }, () => []);
        for (const t of traps(this.snaps)) this.trapsBy[t.by].push(t);
        this.bumps = this.matchEvents.flatMap((e) =>
            e.type === 'tackle' && e.success ? [{ tick: e.tick, by: e.by, victim: e.victim, dusted: false }] : [],
        );
        // o replay tem a câmera lenta dele; a partida da copa e do duelo, os dribles com nome
        const setups = this.md.setups;
        this.named =
            setups && !this.md.replay ? namedDribblesOf(result, setups).map((d) => ({ ...d, toBall: null })) : [];
        this.fulltimeTick = this.matchEvents.find((e) => e.type === 'fulltime')?.tick ?? Number.POSITIVE_INFINITY;
        this.penaltyStage = this.penalties.map((_, i) => this.penaltyStage[i] ?? 0);
        this.agencySpans();
    }

    /** Aura do goleiro-linha (ligado até desligar). */
    private agencySpans() {
        this.flySpans = [];
        const openFly = new Map<number, AgencySpan>();
        for (const e of this.matchEvents) {
            if (e.type === 'flyGk') {
                const open = openFly.get(e.team);
                if (open) open.to = e.tick;
                openFly.delete(e.team);
                if (e.on && e.by >= 0) {
                    const span = { idx: e.by, from: e.tick, to: Number.POSITIVE_INFINITY };
                    openFly.set(e.team, span);
                    this.flySpans.push(span);
                }
            }
        }
        if ((this.flySpans.length || this.md.agency) && !this.agencyG)
            this.agencyG = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    }

    /**
     * O botão do golpe máximo do seu time está aceso agora ou vai acender já (`MAX_CUE_LEAD`; a conta é a da tela).
     * `lit`: o botão aceso agora (o bullet time); na Copa o de linha só acende com o chute certo (`maxCertain`).
     */
    private maxCueNow(ahead = MAX_CUE_LEAD, lit = false): boolean {
        if (!this.md.agency || this.md.replay || this.maxWait) return false;
        // no Duelo as duas telas andam juntas: as duas desaceleram quando o botão de QUALQUER capitão acende (a conta é
        // a mesma dos dois lados, só dos dados da partida), então ninguém fica pra trás
        const teams: (0 | 1)[] = this.md.duel ? [0, 1] : [this.mine as 0 | 1];
        return teams.some((team) => {
            const cap = this.players.findIndex((v) => v.team === team && v.captain);
            if (cap < 0) return false;
            const role = (this.md.result.roster[cap]?.role ?? 'PIVO') as Position;
            const c = maxCharge(this.matchEvents, team, this.playTick, 5);
            if (c.level < 1) return false;
            if (lit && !this.md.duel && role !== 'GK') return maxCertain(this.snaps, this.playTick, team, cap, role);
            return maxCueNear(
                this.snaps,
                this.matchEvents,
                Math.floor(this.playTick) - MAX_CUE_LATCH,
                Math.floor(this.playTick) + ahead,
                team,
                cap,
                role,
            );
        });
    }

    /**
     * Outro jogador seu chutou com a barra pronta: uma vez por aparelho, a dica em cima do capitão de que só ele solta o
     * golpe máximo (o botão não acende no chute dos outros).
     */
    private maxCaptainHint(by: number) {
        const shooter = this.players[by];
        if (!this.md.agency || this.md.replay || !shooter || shooter.team !== this.mine || shooter.captain) return;
        const ready = this.maxReady();
        if (!ready || readCount(MAX_CAP_HINT) !== null) return;
        writeCount(MAX_CAP_HINT, 1);
        this.popText(ready.idx, dict().match.agency.maxCaptainOnly, '#ffd447', 22, 3200);
    }

    /** Seu capitão com a barra pronta (N1+, o goleiro N3+; sem golpe no ar): quem é, o nível e a cor do nível. */
    private maxReady(): { idx: number; level: number; color: number } | null {
        const idx = this.players.findIndex((v) => v.team === this.mine && v.captain);
        const cap = this.players[idx];
        if (!cap) return null;
        const c = maxCharge(this.matchEvents, this.mine as 0 | 1, this.playTick, 5);
        if (c.level < 1) return null;
        const color =
            c.level >= 3
                ? hexToNumber(TYPE_COLOR[species(cap.speciesId).types[0]] ?? '#ffcb05')
                : c.level === 2
                  ? MAX_N2_COLOR
                  : 0xffcb05;
        return { idx, level: c.level, color };
    }

    /** Desenha as auras (a cada quadro, embaixo do jogador): amarela no goleiro-linha, a da barra pronta no capitão. */
    private drawAgency(pxOf: { x: number; y: number }[]) {
        const g = this.agencyG;
        if (!g) return;
        g.clear();
        const t = this.playTick;
        const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 90);
        for (const sp of this.flySpans) {
            const px = pxOf[sp.idx];
            if (!px || t < sp.from || t >= sp.to) continue;
            g.lineStyle(3, 0xffcb05, 0.55 + 0.4 * pulse).strokeEllipse(px.x, px.y + 1, 34, 13);
        }
        // A1: barra pronta (N1+) = aura no seu capitão, na cor do nível (N3 no tipo dele): só ele solta o golpe
        const ready = this.md.agency && !this.md.replay ? this.maxReady() : null;
        const px = ready && pxOf[ready.idx];
        if (ready && px) {
            const k = this.md.reduceMotion ? 1 : 0.75 + 0.25 * pulse;
            g.lineStyle(2 + ready.level, ready.color, 0.8 * k).strokeEllipse(px.x, px.y + 1, 40 + 4 * ready.level, 15);
            g.fillStyle(ready.color, 0.12 * k).fillEllipse(px.x, px.y - 14, 56, 70);
        }
        g.setDepth(1);
    }

    private paused = false;
    /** Painel de um jogador aberto (clicou nele): a partida espera. */
    private inspecting = false;

    private onInspectClose() {
        this.inspecting = false;
    }

    /** Painel do time (TeamPanel.tsx) pediu o painel de um jogador: pausa igual ao toque no sprite. */
    private onInspectRequest(idx: number) {
        if (this.ended || this.holdReal > this.time.now) return;
        this.inspecting = !this.md.duel;
        EventBus.emit('match:inspect', { idx, tick: this.playTick });
    }

    private onResume() {
        if (!this.paused) return;
        this.paused = false;
        // saindo do intervalo: o técnico já decidiu, então o 2º tempo começa armado (sem os ~2 s parados)
        if (this.halftimeAt !== null) {
            this.playTick = Math.max(this.playTick, halftimeEnd(this.snaps, this.halftimeAt));
            this.halftimeAt = null;
        }
        playSample('apito');
    }

    /**
     * Emote "Vamooo!" (Duelo, ?lab=emotes) ou o líder da Copa gritando: o capitão em quadra junta força (Charge) e faz
     * pose (Pose; quem não tem, pula). Só na tela e só parado ou andando: com a bola, chutando ou no carrinho, o lance
     * vence. Com "reduzir movimento", nada.
     */
    private onCaptainPose(idx: number) {
        const view = this.players[idx];
        if (this.md.reduceMotion || this.ended || !view || view.evolving || view.enter) return;
        view.pose = this.time.now;
    }

    private onSpeed(speed: PlaybackSpeed) {
        this.speed = speed;
    }

    private onRate(rate: number) {
        this.rate = Number.isFinite(rate) ? Math.max(0, rate) : 1;
    }

    /** Duelo: muito atrás do host, pula pro tick dele (os eventos do caminho valem, sem animação). */
    private onSeek(tick: number) {
        if (this.ended || this.paused || tick <= this.playTick) return;
        this.seekTo(Math.min(tick, this.holdAt - 1e-3, this.segHold - 1e-3));
    }

    private onSegHold(tick: number) {
        this.segHold = tick;
    }

    private onHold(tick: number) {
        this.holdAt = tick;
    }

    /** Nova versão da partida (tática mudada): o passado é idêntico, então o cursor de eventos continua válido. */
    private onReplace(result: MatchResult) {
        // a substituição do intervalo pode mudar com a nova tática: o finalRoster novo é o que vale
        this.md = { ...this.md, result };
        for (const p of result.finalRoster) {
            const skin = skinOf(p.speciesId, p.shiny);
            if (this.textures.exists(atlasKey(skin))) createSpeciesAnims(this, skin);
        }
        this.setTimeline(result);
        this.holdAt = Number.POSITIVE_INFINITY;
        // segurança: se algum evento novo ficou para trás do playback, pula para depois dele
        this.eventCursor = this.matchEvents.findIndex((e) => e.tick > this.playTick);
        if (this.eventCursor < 0) this.eventCursor = this.matchEvents.length;
    }

    /** (dev) Vai para 2 s antes do apito final. */
    private onSeekFulltime() {
        if (Number.isFinite(this.fulltimeTick)) this.seekTo(this.fulltimeTick - TICK_RATE * 2);
    }

    /** Pula para um tick: os eventos do caminho valem (placar, trocas, narração), mas sem animação. */
    private seekTo(tick: number) {
        this.playTick = Math.max(this.playTick, tick);
        while (this.eventCursor < this.matchEvents.length && this.matchEvents[this.eventCursor].tick <= this.playTick) {
            this.handleEvent(this.matchEvents[this.eventCursor++], true);
        }
        const { index, t } = this.locate(this.playTick);
        this.applySnapshot(index, t);
        this.emitTick(this.snaps[index]);
    }

    /** Pula para o fim: emite todos os eventos restantes de uma vez. */
    private onSkip() {
        const last = this.snaps.length - 1;
        this.playTick = Math.max(this.lastEventTick, this.snaps[last].tick) + 1;
        while (this.eventCursor < this.matchEvents.length) this.handleEvent(this.matchEvents[this.eventCursor++], true);
        this.applySnapshot(last, 0);
        this.emitTick(this.snaps[last]);
        this.finish();
    }

    /** Replay: trecho atual e o próximo (pula pra frente; voltar é remontar a cena). */
    private clip = 0;
    private nextClip() {
        const clips = this.md.replay?.clips;
        if (!clips || this.paused) return;
        if (this.clip + 1 >= clips.length) {
            this.paused = true;
            EventBus.emit('replay:done');
            return;
        }
        this.clip++;
        // o que segurava a quadra no trecho anterior não vale no próximo
        this.holdReal = 0;
        this.n3SceneUntil = 0;
        this.n3End();
        this.maxRunEnd();
        this.maxFrame = null;
        this.maxHold = false;
        this.seekTo(clips[this.clip].from);
        if (!this.md.reduceMotion) this.cameras.main.fadeIn(220, 7, 10, 24);
        EventBus.emit('replay:clip', this.clip);
    }

    /** Clipe 9:16: a faixa da tela que entra no vídeo (os textos presos vão pra dentro dela). */
    setClipView(x: number, w: number) {
        this.cine.crop = { x, w };
    }

    /** Bola na tela (px do canvas, com pan e zoom da câmera): o clipe 9:16 segue o lance. */
    ballOnScreen(): { x: number; y: number } {
        return this.onScreen(this.ball.x, this.ball.y);
    }

    /** Pra onde a câmera do lance (gol, golpe, Transformar) aponta, na tela: a quadra grande do ?lab=hud vai junto. */
    focusOnScreen(): { x: number; y: number } {
        // o duelo da bicuda e o close do N3: a câmera de cinema põe o lance no meio da tela
        if (this.rig?.active && !this.n3?.home) return { x: GAME_W / 2, y: GAME_H / 2 };
        if (this.cer) return this.onScreen(this.cer.center.x, this.cer.center.y);
        const d = this.cameras.main.panEffect.destination;
        return this.onScreen(d.x, d.y);
    }

    /** Quadra grande: quem conduz, na tela (null com a bola solta), e o lado do ataque do último time com a bola (1 = direita). */
    camSubject(): {
        carrier: { x: number; y: number } | null;
        attack: number;
        keep: { x0: number; x1: number } | null;
    } {
        const c = this.camCarrier;
        return { carrier: c ? this.onScreen(c.x, c.y) : null, attack: this.camAttack, keep: this.keepOnScreen() };
    }

    /**
     * Golpe máximo no ar: o trecho da quadra (px na tela) que a quadra grande não deixa sair da janela, o gol atacado
     * inteiro (rede e traves) e `MAX_KEEP_FRONT` m na frente dele, onde o goleiro mergulha.
     */
    private keepOnScreen(): { x0: number; x1: number } | null {
        // o duelo da bicuda: a janela do celular fica no meio da quadra, rápida (a câmera de cinema enquadra)
        if (this.rig?.active && !this.n3?.home) return { x0: GAME_W / 2, x1: GAME_W / 2 };
        if (!this.frameLocked()) return null;
        // o N3 de linha que já chegou segura o gol dele até a câmera de cinema soltar
        const team = this.maxFrame?.team ?? this.n3?.cap.team;
        if (team === undefined) return null;
        const right = team === 0;
        const a = toPx(right ? L - MAX_KEEP_FRONT : -1.3, 0).x;
        const b = toPx(right ? L + 1.3 : MAX_KEEP_FRONT, 0).x;
        return { x0: this.onScreen(a, 0).x, x1: this.onScreen(b, 0).x };
    }

    private frameLocked(): boolean {
        return (!!this.maxFrame && this.playTick <= this.maxFrame.until) || !!this.rig?.active;
    }

    /**
     * O golpe máximo saiu (N1/N2 no chute, N3 no fim da cena): a câmera fica com o gol atacado inteiro até a bola chegar
     * (`releaseMaxFrame`), um ponto só pra todo golpe máximo, bicuda inclusive. O Phaser volta pro zoom 1 (a quadra
     * inteira, deitado e no PC; o zoom no capitão e no lance cortava o gol, e até o zoom que enquadrava quem chuta e o gol
     * cortava na transição, com a câmera presa na borda da quadra) e os outros lances não mexem nela; na quadra grande do
     * celular a janela que anda segura o gol (`keepOnScreen`, court-follow.ts).
     */
    private lockMaxFrame(cap: PlayerView, tick: number, ms: number) {
        this.maxFrame = { team: cap.team as 0 | 1, until: tick + TICK_RATE * 3 };
        this.rawPan(GAME_W / 2, GAME_H / 2, ms);
        this.rawZoom(1, ms);
    }

    /** A bola chegou (gol, defesa, trave, bloqueio, fora): a câmera solta e volta pro meio (o drama do lance assume). */
    private releaseMaxFrame() {
        if (!this.maxFrame) return;
        this.maxFrame = null;
        this.cameraHome();
    }

    /** ?lab=hud: os zooms dos lances valem só `k` (a quadra já vem ampliada; somados, mostravam 2 ou 3 Pokémon). */
    setZoomDamp(k: number) {
        this.zoomDamp = k;
    }

    private onScreen(x: number, y: number): { x: number; y: number } {
        const cam = this.cameras.main;
        const z = cam.zoom || 1;
        return { x: (x - cam.midPoint.x) * z + cam.width / 2, y: (y - cam.midPoint.y) * z + cam.height / 2 };
    }

    /**
     * Pixel duro (antes de cada desenho): a escala do sprite que cai em pixel inteiro do canvas (muda com a tela e o
     * governador de fps), os nomes na resolução do canvas e sprite e nome com a borda no pixel inteiro (só com a
     * câmera sem giro nem tremida; sprite em escala quebrada, como no squash e no zoom dos lances, fica onde está e o
     * smoothPixelArt suaviza a borda). A posição volta depois do desenho (`unsnap`): nada da cena lê o valor mexido.
     */
    private pixelGrid() {
        const res = this.quality?.res ?? 0;
        if (!res) return;
        const ss = spriteScaleFor(res);
        if (ss !== this.ssNow) {
            this.ssNow = ss;
            for (const v of this.players)
                if (!v.evolving && !v.stretched) v.sprite.setScale(ss * (v.flags > 0 && v.flags & FLAG_MINI ? 0.6 : 1));
        }
        if (Math.abs(res - this.textRes) > 0.01) {
            this.textRes = res;
            for (const v of this.players) {
                v.label.setResolution(res);
                v.badge.setResolution(res);
            }
            this.updateUiScale();
        }
        const cam = this.cameras.main;
        if ((cam as unknown as { rotation: number }).rotation || cam.shakeEffect.isRunning) return;
        const z = cam.zoom;
        const sx = cam.useBounds ? cam.clampX(cam.scrollX) : cam.scrollX;
        const sy = cam.useBounds ? cam.clampY(cam.scrollY) : cam.scrollY;
        const ox = cam.width * cam.originX;
        const oy = cam.height * cam.originY;
        const whole = (n: number) => Math.abs(n - Math.round(n)) < 1e-3;
        const snap = (o: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text, flip: boolean) => {
            const left = o.x - (flip ? o.width - o.displayOriginX : o.displayOriginX) * o.scaleX;
            const top = o.y - o.displayOriginY * o.scaleY;
            this.snapped.push({ o, x: o.x, y: o.y });
            o.x += gridShift(left, sx, ox, cam.x, z, res);
            o.y += gridShift(top, sy, oy, cam.y, z, res);
        };
        for (const v of this.players) {
            const sp = v.sprite;
            if (sp.visible && !sp.rotation && whole(sp.scaleX * z * res) && whole(sp.scaleY * z * res))
                snap(sp, sp.flipX);
            if (!whole(z)) continue;
            for (const t of [v.label, v.badge]) if (t.visible && t.alpha > 0 && t.scaleX === 1) snap(t, false);
        }
    }

    private unsnap() {
        for (const s of this.snapped) s.o.setPosition(s.x, s.y);
        this.snapped.length = 0;
    }

    /** Em telas pequenas o canvas encolhe: textos crescem no mundo para continuarem legíveis. */
    private updateUiScale() {
        const shown = this.scale.displaySize.width || GAME_W;
        this.uiScale = Math.max(1, (GAME_W / shown) * 0.72);
        this.cine.uiScale = this.uiScale;
        const s = Math.min(this.uiScale, 2.3);
        // a Galmuri11 em múltiplo de 12 px do canvas: pixel da letra inteiro (antes 10-11 px do jogo, quebrado)
        const name = pixelFont(10 * s, this.textRes);
        const badge = pixelFont(11 * s, this.textRes);
        for (const v of this.players) {
            v.label.setFontSize(name.size).setStroke('#000000', name.stroke);
            v.badge.setFontSize(badge.size).setStroke('#000000', badge.stroke);
        }
        // caixa de batalha presa à base da tela (no celular cresce só um pouco)
        const bs = Math.min(this.uiScale, 1.3);
        this.cine.pin(this.battleBox.container, GAME_W / 2, GAME_H - 30 * bs, bs);
    }

    // ------------------------------------------------------------------ jogadores
    private createPlayerView(
        speciesId: number,
        team: 0 | 1,
        name: string,
        shiny: boolean,
        captain: boolean,
    ): PlayerView {
        const color = this.md.colors[team];
        const skin = this.loadedSkin(speciesId, shiny);
        const size = shadowSize(skin);
        const shadow = this.add.ellipse(0, 0, 14 + size * 6, 6 + size * 2, 0x000000, 0.3);
        const kit = this.md.kits?.[team];
        const ring = this.add.ellipse(0, 0, 22 + size * 6, 9 + size * 2).setStrokeStyle(2.5, color, 0.95);
        if (kit) ring.setFillStyle(kit.color2, 0.55);
        const sprite = this.add
            .sprite(0, 0, atlasKey(skin))
            .setScale(this.ssNow)
            .setOrigin(0.5, footOrigin(skin, 'Idle'));
        // seu time (casa) ganha uma setinha vermelha discreta na cabeça
        const arrow =
            team === this.mine
                ? this.add
                      .triangle(0, 0, 0, 0, 9, 0, 4.5, 6, 0xff3b3b)
                      .setStrokeStyle(1.5, 0x000000, 0.8)
                      .setScale(ARROW_SCALE[this.md.arrowSize ?? 'medium'])
                : null;
        const textStyle = {
            fontFamily: 'Galmuri11, monospace',
            fontSize: '10px',
            color: captain ? '#ffd447' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        };
        const label = this.add
            .text(0, 0, captain ? `C·${name}` : name, textStyle)
            .setOrigin(0.5, 0)
            .setResolution(this.textRes)
            .setAlpha(this.showsName(team) ? 1 : 0);
        const badge = this.add
            .text(0, 0, '', { ...textStyle, fontSize: '11px', fontStyle: 'bold' })
            .setOrigin(0.5, 0)
            .setResolution(this.textRes);
        const view: PlayerView = {
            speciesId,
            skin,
            team,
            name,
            shiny,
            captain,
            sprite,
            shadow,
            ring,
            label,
            badge,
            arrow,
            currentKey: '',
            status: -1,
            flags: -1,
            lunge: { x: 0, y: 0 },
            act: null,
            shift: { x: 0, y: 0 },
            evolving: false,
            enter: null,
            clones: [],
            glowing: false,
            pose: 0,
            crowd: 1,
            down: null,
            stSpan: null,
            word: null,
            tilt: 0,
            stretched: false,
            faceHold: null,
        };
        this.refreshTint(view);
        // tocar no Pokémon abre o painel dele (src/ui/components/PlayerInspect.tsx) e pausa a partida
        sprite.setInteractive({ useHandCursor: !this.md.replay }).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // o Phaser também conta o clique fora da quadra (escuta a janela): o toque num botão do painel por cima
            // dela (intervalo deitado, pedido de tempo) não pode abrir o Pokémon que está embaixo
            if (pointer.downElement !== this.game.canvas) return;
            if (this.ended || this.md.replay || this.holdReal > this.time.now) return;
            // no duelo a partida não para (o painel abre por cima)
            this.inspecting = !this.md.duel;
            EventBus.emit('match:inspect', { idx: this.players.indexOf(view), tick: this.playTick });
        });
        return view;
    }

    /**
     * Reduzir movimento: a câmera desta cena fica parada. Tremida, clarão, zoom e panorâmica de todo lugar
     * (golpes em move-fx.ts, holofote em cinematics.ts, pênaltis, Transformar) viram nada. Câmera lenta e
     * holofote continuam com "Efeitos cinematográficos".
     */
    private steadyCamera() {
        const cam = this.cameras.main;
        cam.shake = () => cam;
        cam.flash = () => cam;
        cam.zoomTo = () => cam;
        cam.pan = () => cam;
    }

    /** Nome acima do Pokémon conforme "Nomes na quadra" (o status e a setinha continuam). */
    private showsName(team: 0 | 1) {
        const mode = this.md.namesOnField ?? 'all';
        return mode === 'all' || (mode === 'mine' && team === this.mine);
    }

    /**
     * Nomes não se embolam. Celular em pé (quadra pequena na tela, decidido com o Miguel em 20/10): quando dois nomes
     * se encostam, o de menos prioridade some com fade (fica quem está com a bola, depois o seu time, depois o
     * capitão) e volta quando eles se afastam; o status sobe pro lugar do nome. Tela larga: o nome de baixo desce até
     * sair de cima do outro (fila dos pênaltis, saída de bola), e o status acompanha.
     */
    private declutterLabels(owner: number, dt: number) {
        const placed: Rect[] = [];
        if (this.scale.displaySize.width < COMPACT_W) {
            const rank = (v: PlayerView) =>
                (this.players.indexOf(v) === owner ? 0 : 4) + (v.team === this.mine ? 0 : 2) + (v.captain ? 0 : 1);
            const views = this.players
                .filter((v) => v.label.visible && this.showsName(v.team))
                .sort((a, b) => rank(a) - rank(b));
            const step = Math.min(1, dt / CROWD_FADE_MS);
            for (const v of views) {
                // inteiro primeiro; se cruzar, o curto; só some se o curto também cruzar
                const rects = [false, true].map((short) => {
                    const w = this.labelWidth(v, short);
                    const x0 = v.label.x - w / 2;
                    return { x0, x1: x0 + w, y0: v.label.y, y1: v.label.y + v.label.height };
                });
                const fit = firstFit(placed, rects);
                const crowded = fit < 0;
                this.setLabelText(v, fit !== 0);
                if (!crowded) placed.push(rects[fit]);
                const h = v.label.height;
                v.crowd = Phaser.Math.Clamp(v.crowd + (crowded ? -step : step), 0, 1);
                v.label.setAlpha(v.crowd);
                v.badge.y = v.label.y + h * v.crowd;
            }
            return;
        }
        for (const v of this.players) this.setLabelText(v, false);
        const views = this.players
            .filter((v) => v.label.visible && v.label.alpha > 0)
            .sort((a, b) => a.label.y - b.label.y);
        for (const v of views) {
            const w = v.label.width;
            const h = v.label.height;
            const x0 = v.label.x - w / 2;
            const x1 = x0 + w;
            let y = v.label.y;
            for (const r of placed) if (x0 < r.x1 && x1 > r.x0 && y < r.y1 && y + h > r.y0) y = r.y1;
            if (y !== v.label.y) {
                v.badge.y += y - v.label.y;
                v.label.y = y;
            }
            placed.push({ x0, x1, y0: y, y1: y + h });
        }
    }

    /** Largura do nome (inteiro ou curto) sem redesenhar o texto a cada quadro: mede uma vez por texto e tamanho. */
    private labelWidth(v: PlayerView, short: boolean) {
        const t = labelText(v.name, v.captain, short);
        const key = `${v.label.style.fontSize}|${t}`;
        let w = this.labelWidths.get(key);
        if (w === undefined) {
            const was = v.label.text;
            w = v.label.setText(t).width;
            v.label.setText(was);
            this.labelWidths.set(key, w);
        }
        return w;
    }

    private setLabelText(v: PlayerView, short: boolean) {
        const t = labelText(v.name, v.captain, short);
        if (v.label.text !== t) v.label.setText(t);
    }

    /** Altura ocupada pelo nome (zero quando escondido): o status sobe para o lugar dele. */
    private nameHeight(view: PlayerView) {
        return view.label.alpha > 0 ? view.label.height : 0;
    }

    /** Setinha do seu time: logo acima da cabeça (topo visível do sprite no Idle). */
    private placeArrow(view: PlayerView, x: number, y: number, depth: number) {
        if (!view.arrow) return;
        const h = view.sprite.frame.realHeight * view.sprite.scaleY;
        const head = y - (view.sprite.originY - headTop(view.skin)) * h;
        view.arrow.setPosition(x, head - 4 - 3 * view.arrow.scaleY).setDepth(depth);
    }

    /** Ditto (Transformar) vira a cópia de quem escolheu: mantém o nome e o "capitão". */
    private becomeCopy(idx: number, into: number, target: number) {
        const view = this.players[idx];
        if (!view) return;
        const captain = view.captain;
        createSpeciesAnims(this, into);
        this.swapSpecies(view, into, view.name, this.players[target]?.shiny ?? false);
        view.captain = captain;
        if (captain) view.label.setText(`C·${view.name}`).setColor('#ffd447');
    }

    /** Folha shiny se já carregou; senão a normal (a tinta amarelada marca o shiny). */
    private loadedSkin(speciesId: number, shiny: boolean) {
        const skin = skinOf(speciesId, shiny);
        return this.textures.exists(atlasKey(skin)) ? skin : speciesId;
    }

    private swapSpecies(view: PlayerView, speciesId: number, name: string, shiny: boolean) {
        view.speciesId = speciesId;
        view.skin = this.loadedSkin(speciesId, shiny);
        createSpeciesAnims(this, view.skin);
        view.name = name;
        view.shiny = shiny;
        view.captain = false;
        view.sprite.setTexture(atlasKey(view.skin)).setOrigin(0.5, footOrigin(view.skin, 'Idle'));
        view.label.setText(name).setColor('#ffffff');
        view.currentKey = '';
        view.status = -1;
    }

    private refreshTint(view: PlayerView) {
        const st = STATUS_VIEW[view.status];
        const flags = Math.max(0, view.flags);
        if (st && view.status !== 6) view.sprite.setTint(st.tint);
        // casco/concha/derretido: azulado; fúria: avermelhado
        else if (flags & FLAG_GUARD) view.sprite.setTint(0x9fc4e8);
        else if (flags & FLAG_RAGE) view.sprite.setTint(0xff8a8a);
        else if (view.shiny && !isShinySkin(view.skin)) view.sprite.setTint(0xfff3b0);
        else view.sprite.clearTint();
    }

    /** Ícone de status + setinha de buff/debuff + anel brilhando quando há golpe carregado. */
    private applyIndicators(view: PlayerView, status: number, flags: number) {
        if (status === view.status && flags === view.flags) return;
        view.status = status;
        view.flags = flags;
        // o status é o ícone desenhado com o anel de contagem (drawReactions); o rótulo fica só com as setinhas
        const arrows = (flags & FLAG_BUFF ? '▲' : '') + (flags & FLAG_DEBUFF ? '▼' : '');
        view.badge.setText(arrows);
        view.badge.setColor(flags & FLAG_BUFF ? '#7dff8a' : '#ff7a7a');
        view.ring.setStrokeStyle(
            flags & FLAG_CHARGED ? 4 : 2.5,
            flags & FLAG_CHARGED ? 0xffe14d : this.md.colors[view.team],
            0.95,
        );
        // Minimize: fica pequenininho
        if (!view.evolving) view.sprite.setScale(this.ssNow * (flags & FLAG_MINI ? 0.6 : 1));
        this.refreshTint(view);
    }

    /** Estado visível dos traços de golpe a cada quadro: voo, buraco, carga piscando e clones. */
    private applyTraitPose(view: PlayerView, flags: number) {
        const sp = view.sprite;
        if (flags & FLAG_FLY) {
            // no alto: o sprite sobe e a sombra encolhe
            sp.y -= 30;
            view.shadow.setScale(0.55);
        } else if (flags & FLAG_DIG) {
            // embaixo da terra: só um montinho andando
            sp.setAlpha(0.12);
            view.shadow.setScale(1.3);
        } else if (view.shadow.scaleX !== 1) view.shadow.setScale(1);
        if (flags & FLAG_CHARGING) {
            view.glowing = true;
            const on = Math.floor(this.time.now / 110) % 2 === 0;
            view.ring.setStrokeStyle(5, on ? 0xffffff : 0xffe14d, 1);
            sp.setTintMode(on ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY);
            if (on) sp.setTint(0xfff7c0);
            else this.refreshTint(view);
        } else if (view.glowing) {
            view.glowing = false;
            sp.setTintMode(Phaser.TintModes.MULTIPLY);
            this.refreshTint(view);
            view.ring.setStrokeStyle(2.5, this.md.colors[view.team], 0.95);
        }
        const wantClones = (flags & FLAG_CLONES) !== 0 && !(flags & (FLAG_FLY | FLAG_DIG));
        if (wantClones && !view.clones.length) {
            for (let k = 0; k < 2; k++) view.clones.push(this.add.sprite(sp.x, sp.y, sp.texture.key).setAlpha(0.4));
        }
        view.clones.forEach((c, k) => {
            c.setVisible(wantClones);
            if (!wantClones) return;
            const wobble = Math.sin(this.time.now / 160 + k * Math.PI) * 4;
            c.setTexture(sp.texture.key, sp.frame.name)
                .setOrigin(sp.originX, sp.originY)
                .setScale(sp.scaleX, sp.scaleY)
                .setPosition(sp.x + (k === 0 ? -16 : 16) + wobble, sp.y)
                .setDepth(sp.depth - 0.5);
        });
    }

    // ------------------------------------------------------------------ playback
    update(time: number, delta: number) {
        if (this.cer) this.ceremonyStep();
        if (this.ended || !this.snaps.length || this.paused || this.inspecting) return;
        const clip = this.md.replay?.clips[this.clip];
        if (clip && this.playTick >= clip.to) {
            this.nextClip();
            if (this.paused) return;
        }
        // evolução: a partida para enquanto o Pokémon evolui, como nos jogos
        const sd = this.showdown;
        const cutscene = !!sd && !this.md.replay && this.playTick >= sd.tick && this.playTick < sd.kick;
        const factor =
            !cutscene && (time < this.holdReal || this.maxHold)
                ? 0
                : this.currentSpeedFactor(time) * this.rate * (this.md.pace ?? 1) * SMOKE_VEL;
        this.playTick = Math.min(
            this.playTick + (delta / 1000) * TICK_RATE * factor,
            // as travas seguram, nunca voltam a partida (trava atrás da tela = para onde está)
            Math.max(this.playTick, this.holdAt - 1e-3),
            Math.max(this.playTick, this.segHold - 1e-3),
        );

        while (this.eventCursor < this.matchEvents.length && this.matchEvents[this.eventCursor].tick <= this.playTick) {
            this.handleEvent(this.matchEvents[this.eventCursor++], false);
        }
        // a cutscene anda no relógio da quadra (aparelho lento ou aba parada, ela espera junto)
        if (this.showdownOpen && this.showdown) {
            if (this.playTick >= this.showdown.kick) {
                this.showdownOpen = false;
                EventBus.emit('match:showdown-end');
                // pulou a bicuda (o chute passou sem a cena): desmonta o instante congelado
                if (this.sdStage) this.sdAbort();
            } else {
                const t = ((this.playTick - this.showdown.tick) / TICK_RATE) * 1000;
                EventBus.emit('match:showdown-t', t);
                this.stepShowdown(t);
            }
        }

        this.sdWindup();
        const { index, t } = this.locate(this.playTick);
        const inShootout = this.penalties.length > 0 && this.playTick >= this.fulltimeTick + TICK_RATE;
        if (inShootout) {
            if (!this.shootoutOn) this.startShootout();
            this.updateShootout(factor);
        } else {
            this.applySnapshot(index, t, factor);
        }
        this.holdShowdownBall(delta);
        this.updateBallMotion(inShootout);
        this.followShowdownBall(delta);
        this.drawMaxBall(time);
        this.n3Step();
        this.maxRunStep();
        this.battleBox.update(time, Math.max(1, factor));
        this.rig.apply();
        if (this.sdBoundsPending) this.sdBoundsBack();
        this.sdSettle();
        this.cine.updatePins();
        this.updateZoneViews();

        if (time - this.lastEmit > 120) {
            this.lastEmit = time;
            this.emitTick(this.snaps[index]);
        }

        const lastSnap = this.snaps[this.snaps.length - 1].tick;
        if (this.playTick > Math.max(lastSnap, this.lastEventTick) + TICK_RATE * 1.5) this.finish();
    }

    /**
     * Golpe máximo no ar: a bola vira o projétil do nível (`drawProjectile`: N1 brilho do tipo, N2 cometa do tipo, N3 o
     * projétil do tipo com cauda grossa e enfeite), até o desfecho.
     */
    private drawMaxBall(time: number) {
        const m = this.maxSlow;
        if (!m || this.playTick > m.until || !this.ballFree) {
            this.maxBallG?.clear();
            this.maxBallPrev = null;
            if (m && this.playTick > m.until) this.maxSlow = null;
            return;
        }
        if (!this.maxBallG)
            this.maxBallG = this.add
                .graphics()
                .setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(BALL_DEPTH - 1);
        const { x, y } = this.ball;
        const prev = this.maxBallPrev ?? { x, y };
        // direção suavizada (a bola parada na carga não tem cauda)
        const vx = x - prev.x;
        const vy = y - prev.y;
        this.maxBallPrev = { x, y };
        const g = this.maxBallG.clear();
        const dir = this.maxBallDir;
        dir.x += (vx - dir.x) * 0.35;
        dir.y += (vy - dir.y) * 0.35;
        drawProjectile(g, m.type, m.level as 1 | 2 | 3, x, y, dir.x, dir.y, time, !!this.md.reduceMotion);
    }
    // ------------------------------------------------------------------ disputa de pênaltis
    private ticksToMs(ticks: number, factor: number) {
        return ((ticks / TICK_RATE) * 1000) / Math.max(factor, 0.2);
    }

    /** Posiciona um jogador (em metros) e, opcionalmente, troca a animação. */
    private placeView(idx: number, x: number, y: number, facing?: number, anim?: string) {
        const view = this.players[idx];
        if (!view) return;
        this.viewPos.set(idx, { x, y });
        const px = toPx(x, y);
        view.sprite.setPosition(px.x, px.y).setDepth(px.y);
        view.shadow.setPosition(px.x, px.y + 1).setDepth(px.y - 2);
        view.ring.setPosition(px.x, px.y + 1).setDepth(px.y - 1);
        view.label.setPosition(px.x, px.y + 6).setDepth(5000);
        view.badge.setPosition(px.x, px.y + 6 + this.nameHeight(view)).setDepth(5001);
        this.placeArrow(view, px.x, px.y, 4999);
        if (anim !== undefined && facing !== undefined) {
            const resolved = resolveAnim(view.skin, anim);
            const key = `${view.skin}/${resolved}/${facing}`;
            if (key !== view.currentKey) {
                view.sprite.play(key).setOrigin(0.5, footOrigin(view.skin, resolved));
                view.currentKey = key;
            }
        }
    }

    private moveView(idx: number, to: { x: number; y: number }, facing: number, ms: number, endAnim = 'Idle') {
        const from = this.viewPos.get(idx) ?? to;
        const proxy = { x: from.x, y: from.y };
        this.placeView(idx, from.x, from.y, facing, 'Walk');
        this.tweens.add({
            targets: proxy,
            x: to.x,
            y: to.y,
            duration: ms,
            ease: 'Sine.easeInOut',
            onUpdate: () => this.placeView(idx, proxy.x, proxy.y),
            onComplete: () => this.placeView(idx, to.x, to.y, facing, endAnim),
        });
    }

    private moveBall(x: number, y: number, ms: number, onComplete?: () => void) {
        const target = toPx(x, y);
        this.tweens.add({
            targets: this.ball,
            x: target.x,
            y: target.y - 4,
            duration: ms,
            ease: 'Quad.easeOut',
            onUpdate: () => this.ballShadow.setPosition(this.ball.x + 2, this.ball.y + 6),
            onComplete,
        });
    }

    /** Times perfilados no meio da quadra, câmera aproximando do gol. */
    private startShootout() {
        this.shootoutOn = true;
        const { width } = FUTSAL_5.pitch;
        for (const team of [0, 1] as const) {
            const members = this.players.map((_, i) => i).filter((i) => this.players[i].team === team);
            members.forEach((idx, k) => {
                const pos = {
                    x: 20.5 + (team === 0 ? -1.4 : 1.4),
                    y: 3 + k * ((width - 6) / Math.max(1, members.length - 1)),
                };
                this.linePos.set(idx, pos);
                this.placeView(idx, pos.x, pos.y, 2, 'Idle');
            });
        }
        const spot = toPx(34, width / 2);
        this.ball.setPosition(spot.x, spot.y - 4).setScale(1);
        this.ballShadow
            .setPosition(spot.x + 2, spot.y + 2)
            .setScale(1)
            .setAlpha(0.35);
        this.ballGlow.setAlpha(0);
        const cam = this.cameras.main;
        // quadra grande do celular (zoomDamp < 1): a janela mostra só ~17 m, e centrar em 29,5 m deixava o gol (40 m)
        // fora da tela; lá o centro é a marca do pênalti, com o gol e quem bate à vista
        const center = toPx(this.zoomDamp < 1 ? 34 : 29.5, width / 2);
        cam.pan(center.x, center.y, 700, 'Sine.easeInOut', true);
        cam.zoomTo(1.35, 700, 'Sine.easeInOut', true);
        this.battleBox.push(tr('battle.shootout'));
    }

    private updateShootout(factor: number) {
        let gkIdx = -1;
        for (const [i, pen] of this.penalties.entries()) {
            if (this.penaltyStage[i] < 1 && this.playTick >= pen.tick - 48) {
                this.penaltyStage[i] = 1;
                this.preparePenalty(i, factor);
            }
            if (this.penaltyStage[i] < 2 && this.playTick >= pen.tick - 14) {
                this.penaltyStage[i] = 2;
                this.kickPenalty(pen, factor);
            }
            if (this.penaltyStage[i] >= 2) gkIdx = pen.gk;
        }
        // goleiro do último pênalti: o mergulho é o tween; o bote do Attack não leva o corpo além da bola
        const gk = this.players[gkIdx];
        const at = this.viewPos.get(gkIdx);
        if (gk && at && gk.currentKey.includes('/Attack/')) {
            const px = toPx(at.x, at.y);
            gk.sprite.setPosition(px.x, px.y);
            this.holdBody(gk);
        }
    }

    /**
     * Desconta do sprite o bote que o Attack do PMD dá dentro do próprio quadro (1 a 3 m). No mergulho do goleiro
     * ele levava o corpo além da bola, rumo a quem chutou, e a bola defendida parecia passar por trás dele.
     */
    private holdBody(view: PlayerView) {
        const s = bodyShift(view.sprite);
        view.sprite.x -= s.x * view.sprite.scaleX;
        view.sprite.y -= s.y * view.sprite.scaleY;
    }

    private preparePenalty(i: number, factor: number) {
        const pen = this.penalties[i];
        const prev = this.penalties[i - 1];
        const { width } = FUTSAL_5.pitch;
        if (prev) {
            for (const idx of [prev.by, prev.gk]) {
                const home = this.linePos.get(idx);
                if (home) this.moveView(idx, home, 2, this.ticksToMs(16, factor));
            }
        }
        this.moveView(pen.gk, { x: 39.5, y: width / 2 }, 6, this.ticksToMs(18, factor));
        this.moveView(pen.by, { x: 32.8, y: width / 2 }, 2, this.ticksToMs(26, factor));
        const spot = toPx(34, width / 2);
        this.tweens.killTweensOf(this.ball);
        this.ball.setPosition(spot.x, spot.y - 4);
        this.ballShadow.setPosition(spot.x + 2, spot.y + 2);
        this.battleBox.push(tr('battle.stepsUp', { x: this.players[pen.by]?.name ?? '?' }));
    }

    private kickPenalty(pen: PenaltyEvent, factor: number) {
        const { width } = FUTSAL_5.pitch;
        const mid = width / 2;
        const side = (pen.round + pen.by) % 2 === 0 ? 1 : -1;
        const dive = pen.scored ? -side : side;
        playSfx('shot');
        this.placeView(pen.by, 33.4, mid, 2, 'Attack');
        // goleiro mergulha para um lado
        const gk = this.viewPos.get(pen.gk) ?? { x: 39.5, y: mid };
        const proxy = { ...gk };
        this.placeView(pen.gk, gk.x, gk.y, dive > 0 ? 0 : 4, 'Attack');
        this.tweens.add({
            targets: proxy,
            y: mid + dive * 1.1,
            x: 39.3,
            duration: this.ticksToMs(8, factor),
            ease: 'Quad.easeOut',
            onUpdate: () => this.placeView(pen.gk, proxy.x, proxy.y),
        });
        if (pen.scored) {
            this.moveBall(40.6, mid + side * 1.1, this.ticksToMs(9, factor));
        } else {
            this.moveBall(39.3, mid + side * 1.0, this.ticksToMs(8, factor), () =>
                this.moveBall(36.5, mid + side * 3.5, this.ticksToMs(14, factor)),
            );
        }
    }

    private currentSpeedFactor(now: number): number {
        const clip = this.md.replay?.clips[this.clip];
        if (clip) {
            const slow = this.playTick >= clip.slowFrom && this.playTick <= clip.slowTo ? REPLAY_SLOW : 1;
            return Math.min(slow, this.cine.speedFactor(now));
        }
        const sd = this.showdown;
        const inShowdown = !!sd && this.playTick >= sd.tick && this.playTick < sd.until;
        if (sd && inShowdown && this.playTick < sd.kick) return 1;
        return inShowdown ? Math.min(1, this.speedFactorOf(now)) : this.speedFactorOf(now);
    }

    private speedFactorOf(now: number): number {
        let base: number;
        if (this.speed !== 'highlights') base = this.speed;
        else {
            // "só os lances": 1x perto de chute, gol, defesa, trave, pênalti, Transform, combo e evolução; o resto
            // passa a 16x. Antes também parava em todo golpe, status e saída de bola e a partida em Lances levava
            // ~270 s, mais devagar que em 4x (~100 s); agora ~120 s.
            const ahead = this.highlightTicks.find((t) => t >= this.playTick);
            let last: number | undefined;
            for (const t of this.highlightTicks) if (t <= this.playTick) last = t;
            const near =
                (ahead !== undefined && ahead - this.playTick < TICK_RATE * 1.5) ||
                (last !== undefined && this.playTick - last < TICK_RATE);
            base = near ? this.md.chanceSpeed || 1 : 16;
        }
        // a disputa de pênaltis sempre em ritmo assistível, em qualquer velocidade
        if (this.penalties.length > 0 && this.playTick >= this.fulltimeTick) base = Math.min(base, 1.25);
        // golpe máximo: o botão acendeu (bullet time e depois câmera lenta) e o chute no ar (até o desfecho), em
        // qualquer velocidade e mesmo com "não cair" nas chances
        // o bullet time começa quando o BOTÃO acende (a mesma conta da tela, `MAX_CUE_EARLY` antes da hora certa): o
        // toque nele arma o golpe antes do chute do capitão. Antes disso, só a câmera lenta chegando (`MAX_CUE_LEAD`)
        if (this.maxCueNow(MAX_CUE_EARLY, true)) {
            const t = performance.now();
            this.cueSince ??= t;
            // o anel desta hora (nasce no mesmo quadro ou logo depois do botão acender)
            const ring = maxRing();
            const hold =
                !this.md.duel && ring && ring.start >= this.cueSince - 300
                    ? t < ring.at + MAX_BEAT.goodMs
                    : t - this.cueSince < MAX_CUE_HOLD_MS;
            base = Math.min(base, hold ? MAX_CUE_HOLD : MAX_CUE_SLOW);
        } else {
            this.cueSince = null;
            // a câmera lenta chegando vale pro golpe do rival também (ele não tem botão: só o bullet time é seu)
            if (this.maxCueNow() || maxHitAhead(this.maxHits, this.playTick, MAX_CUE_LEAD))
                base = Math.min(base, MAX_CUE_SLOW);
        }
        // o golpe máximo no ar já vai na câmera lenta dele: a do drama chegando no gol e a dos textos (0,25) por cima
        // multiplicavam (o voo do N3 levava ~4 s, 1 tick a cada 0,6 s); ele manda sozinho até o desfecho
        if (this.maxSlow && this.playTick <= this.maxSlow.until) return Math.min(base, this.maxSlow.factor);
        // lance de gol chegando (gol, trave ou defesa): cai para 1x mesmo em 8x (81% jogam em 8x e perdiam o lance)
        // (Configurações: 1x, 2x, 4x ou não cair)
        const slow = this.md.chanceSpeed ?? 1;
        if (!slow) return base;
        const goal = this.goalTicks.find((t) => t >= this.playTick);
        if (goal !== undefined && goal - this.playTick <= GOAL_LEAD) base = Math.min(base, slow);
        if (!this.md.cinematic) return base;
        // câmera lenta chegando no gol/trave/defesa
        const next = this.dramaTicks.find((t) => t >= this.playTick);
        let drama = 1;
        if (next !== undefined && next - this.playTick <= DRAMA_LEAD) {
            drama = 0.25 + 0.75 * ((next - this.playTick) / DRAMA_LEAD);
        }
        // drible com nome: câmera lenta curta só na 1x (no duelo as duas telas seguem juntas; Reduzir movimento, nada).
        // Vale a mais lenta das câmeras lentas, sem multiplicar com a do gol
        const trick = this.md.duel || this.md.reduceMotion ? 1 : dribbleSlowAt(this.named, this.playTick, this.speed);
        return base * Math.min(drama, this.cine.speedFactor(now), trick);
    }

    private locate(tick: number): { index: number; t: number } {
        const s = this.snaps;
        if (tick <= s[0].tick) return { index: 0, t: 0 };
        if (tick >= s[s.length - 1].tick) return { index: s.length - 1, t: 0 };
        let lo = 0;
        let hi = s.length - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (s[mid].tick <= tick) lo = mid;
            else hi = mid;
        }
        const span = s[hi].tick - s[lo].tick || 1;
        return { index: lo, t: (tick - s[lo].tick) / span };
    }

    private applySnapshot(index: number, t: number, factor = 1) {
        const a = this.snaps[index];
        const b = this.snaps[Math.min(index + 1, this.snaps.length - 1)];
        // não interpola através de "teleportes" (saída de bola depois do gol)
        const lerpOk = b.phase === a.phase || b.phase === 'play';
        const k = lerpOk ? t : 0;
        const near = k < 0.5 ? a : b;
        const focusPos = new Map<number, { x: number; y: number }>();
        const diveOf = new Map<number, { x: number; y: number; facing: number }>();
        const pxOf: { x: number; y: number }[] = [];
        // curva suave (Catmull-Rom) entre os snapshots vizinhos: sem os "quinas" da reta a cada 2 ticks
        const prev = this.snaps[Math.max(0, index - 1)];
        const next = this.snaps[Math.min(index + 2, this.snaps.length - 1)];
        const smooth = lerpOk && prev.phase === a.phase && next.phase === b.phase;
        this.reactG.clear();
        const trick = this.trickNow();
        for (let i = 0; i < this.players.length; i++) {
            const view = this.players[i];
            const o = i * SNAP_STRIDE;
            const x = smooth ? catmull(prev.p[o], a.p[o], b.p[o], next.p[o], k) : a.p[o] + (b.p[o] - a.p[o]) * k;
            const y = smooth
                ? catmull(prev.p[o + 1], a.p[o + 1], b.p[o + 1], next.p[o + 1], k)
                : a.p[o + 1] + (b.p[o + 1] - a.p[o + 1]) * k;
            const pose = this.steadyPose(index + (k < 0.5 ? 0 : 1), o);
            const { action } = pose;
            let { facing } = pose;
            // goleiro na área: nunca virado pro próprio gol (no recuo pra linha ele anda de ré, olhando a bola)
            const front = view.team === 0 ? 1 : -1;
            const L = FUTSAL_5.pitch.length;
            if ((front > 0 ? x : L - x) < 6 && this.isKeeper(i)) {
                // e sem tremer entre duas direções: uma troca a cada 150 ms no máximo
                view.faceHold = holdFacing(
                    view.faceHold,
                    keeperFacing(facing, front, { x: near.bx - x, y: near.by - y }),
                    this.time.now,
                );
                facing = view.faceHold.facing;
            } else view.faceHold = null;
            // drible com nome: quem dribla sai do lugar (e gira, na roleta); quem ficou morde a finta
            const tricked = trick && !view.act ? trick : null;
            const tb = tricked?.d.by === i ? tricked.pose : null;
            const tm = tricked?.d.marker === i ? tricked.pose : null;
            if (tb?.face != null) facing = tb.face;
            if (tm?.markerFace != null) facing = tm.markerFace;
            const px = toPx(x, y);
            px.x += view.shift.x;
            px.y += view.shift.y;
            pxOf[i] = px;
            // em destaque (holofote): acima do escurecimento
            const focused = this.cine.focused.has(i);
            const base = focused ? FOCUS_DEPTH + px.y / 100 : px.y;
            // o duelo da bicuda manda na pose (o chute armado no contato): sem o mergulho
            const act = view.act;
            const dive = act ? null : this.diveOffset(i, px);
            if (dive) diveOf.set(i, dive);
            // gol sofrido: o goleiro fica cabisbaixo um instante (Hurt), de frente pro campo
            const react = act || dive ? null : this.goalReaction(i);
            // onde o corpo está na tela (bote, mergulho): a sombra, o anel e a setinha vão junto
            const body = {
                x: px.x + view.lunge.x + (dive?.x ?? 0) + (tb?.body.x ?? 0) + (tm?.markerBody.x ?? 0),
                y: px.y + view.lunge.y + (dive?.y ?? 0) + (tb?.body.y ?? 0) + (tm?.markerBody.y ?? 0),
            };
            // quem dribla passa na frente do marcador (os dois ficam um em cima do outro no carrinho)
            view.sprite.setPosition(body.x, body.y).setDepth(base + (tb ? 40 : 0));
            // entrando da lateral (substituição): anda até a posição; antes disso fica escondido
            let entering: number | null = null;
            if (view.enter) {
                const k = (this.time.now - view.enter.start) / view.enter.dur;
                if (k >= 1) view.enter = null;
                else {
                    const t = Phaser.Math.Easing.Sine.InOut(Math.max(0, k));
                    const ex = view.enter.from.x + (px.x - view.enter.from.x) * t;
                    const ey = view.enter.from.y + (px.y - view.enter.from.y) * t;
                    view.sprite
                        .setPosition(ex, ey)
                        .setDepth(ey)
                        .setAlpha(k < 0 ? 0 : 1);
                    entering = dir8({ x: px.x - view.enter.from.x, y: px.y - view.enter.from.y }, 0);
                }
            }
            if (!view.enter && view.sprite.alpha < 1) view.sprite.setAlpha(1);
            view.shadow.setPosition(body.x, body.y + 1).setDepth(base - 2);
            view.ring.setPosition(body.x, body.y + 1).setDepth(base - 1);
            // o close do N3 de linha: o nome e a setinha do capitão ficam atrás da cena (a faixa já diz quem é)
            const closeUp = this.n3?.cap === view && !this.n3.home;
            const labelDepth = focused && !closeUp ? FOCUS_DEPTH + 60 : 5000;
            // no drible com nome o nome vai junto do corpo (os dois saem do lugar e o nome ficava pra trás)
            const lx = tb || tm ? body.x : px.x;
            const ly = tb || tm ? body.y : px.y;
            view.label.setPosition(lx, ly + 6).setDepth(labelDepth);
            view.badge.setPosition(lx, ly + 6 + this.nameHeight(view)).setDepth(labelDepth + 1);
            this.placeArrow(view, body.x, body.y, labelDepth - 1);
            if (focused) focusPos.set(i, px);
            this.applyIndicators(view, near.p[o + 4], near.p[o + 5]);
            this.applyTraitPose(view, near.p[o + 5]);

            // pose do capitão: só parado ou andando, sem a bola (o lance vence e a pose acaba)
            const since = view.pose ? this.time.now - view.pose : -1;
            const calm = (action === Action.Idle || action === Action.Run) && a.owner !== i && b.owner !== i;
            if (since >= POSE_MS || (since >= 0 && !calm) || dive || react !== null) view.pose = 0;
            const posing = view.pose > 0 && entering === null;
            // gol: quem marcou comemora no jeito da espécie (pulo, giro ou pose), no mesmo tempo do Celebrate
            const celeb =
                action === Action.Celebrate && !act && !dive && react === null && !posing
                    ? this.goalCeleb(i, facing)
                    : null;
            if (celeb) facing = celeb.facing;
            // chute, passe e carrinho: a antecipação antes e o impacto no quadro em que a bola sai (`strikesNear`)
            // a defesa: o impacto do mergulho no tick em que a bola bate nele
            const strike =
                dive?.contact !== undefined && !act
                    ? (this.strikeAt(view, 'Attack', dive.facing, dive.contact, dive.contact + SAVE_DIVE.tail) ?? {
                          anim: resolveAnim(view.skin, 'Attack'),
                          facing: dive.facing,
                          frame: 0,
                      })
                    : act || dive || react !== null || posing || celeb || tm
                      ? null
                      : this.strikePose(view, o, index);
            const anim = resolveAnim(
                view.skin,
                strike
                    ? strike.anim
                    : act
                      ? act.anim
                      : dive
                        ? 'Attack'
                        : react !== null
                          ? 'Hurt'
                          : posing
                            ? since < POSE_CHARGE_MS
                                ? 'Charge'
                                : 'Pose'
                            : (celeb?.anim ?? animForAction(action)),
            );
            const shown = strike
                ? strike.facing
                : act
                  ? act.facing
                  : dive
                    ? dive.facing
                    : react !== null
                      ? keeperRows(front).low
                      : posing
                        ? 0
                        : facing;
            const key = `${view.skin}/${anim}/${shown}`;
            if (entering !== null) {
                const walk = resolveAnim(view.skin, 'Walk');
                const wkey = `${view.skin}/${walk}/${entering}`;
                if (wkey !== view.currentKey) {
                    view.sprite.play(wkey).setOrigin(0.5, footOrigin(view.skin, walk));
                    view.currentKey = wkey;
                }
            } else if (key !== view.currentKey && !view.evolving) {
                if (act?.frame !== undefined) view.sprite.play({ key, startFrame: act.frame });
                else view.sprite.play(key);
                if (act?.hold) view.sprite.anims.pause();
                view.sprite.setOrigin(0.5, footOrigin(view.skin, anim));
                view.currentKey = key;
            }
            if (strike && entering === null && !view.evolving) {
                // o quadro sai do tick (não do relógio): na câmera lenta, no 8x e voltando o replay, o impacto fica no toque
                const anims = view.sprite.anims;
                if (!anims.isPaused) anims.pause();
                const fr = anims.currentAnim?.frames[strike.frame];
                if (fr && anims.currentFrame !== fr) anims.setCurrentFrame(fr);
            }
            const bite = tm
                ? { tilt: tm.markerTilt, sx: tm.markerSx, sy: tm.markerSy }
                : tb
                  ? { tilt: tb.tilt, sx: tb.sx, sy: tb.sy }
                  : null;
            if (tb?.ghost && tricked) this.ghost(view, tricked.d.team);
            // comemoração do gol: o squash & stretch do jeito (agacha, estica); Reduzir movimento: sem
            const celebLean =
                celeb && !this.md.reduceMotion && (celeb.sx !== 1 || celeb.sy !== 1 || celeb.lift > 0)
                    ? { tilt: 0, sx: celeb.sx, sy: celeb.sy }
                    : null;
            this.leanBody(
                view,
                entering === null
                    ? (dive?.lean ?? bite ?? this.droop(react) ?? celebLean ?? this.moveLean(i, px, strike, factor))
                    : null,
            );
            if (dive && entering === null && !view.evolving) this.holdBody(view);
            // e o pulo dela sai do chão (a sombra fica)
            if (celebLean && entering === null && !view.evolving) view.sprite.y -= celeb?.lift ?? 0;
            const dx = (b.p[o] - a.p[o]) * PPM;
            const dy = (b.p[o + 1] - a.p[o + 1]) * PPM;
            const pxPerTick = Math.hypot(dx, dy) / Math.max(1, b.tick - a.tick);
            // a animação acompanha a velocidade real: Pokémon rápidos "pedalam" mais rápido
            const pace = action === Action.Run ? Phaser.Math.Clamp(pxPerTick / 2.5, 0.5, 2) : 1;
            view.sprite.anims.timeScale = pace * Phaser.Math.Clamp(factor, 0.3, 4);
            // quem entra caminha no ritmo normal (a partida está parada) e o nome/anel só aparecem quando ele chega
            const arriving = entering !== null;
            if (arriving || posing || (act && this.endOn)) view.sprite.anims.timeScale = 1;
            for (const o of [view.label, view.badge, view.ring, view.shadow, view.arrow]) o?.setVisible(!arriving);
            if (view.status === 1) view.sprite.x += Math.sin(this.time.now / 40) * 1.2; // paralisia: tremidinha
            if (!arriving) this.drawReaction(view, k < 0.5 ? index : Math.min(index + 1, this.snaps.length - 1), i);
        }
        // o duelo da bicuda: o tempo parado (ninguém mexe) e a quadra limpa, sem nome, anel nem setinha, até o gol
        if (this.sdStage || this.sdFly)
            for (const v of this.players) {
                if (this.sdStage) v.sprite.anims.timeScale = 0;
                for (const o of [v.label, v.badge, v.ring, v.arrow]) o?.setVisible(false);
            }
        this.drawHuh(trick);
        this.declutterLabels(a.owner, this.game.loop.delta);
        if (focusPos.size) this.cine.followSpots(focusPos);
        this.drawAgency(pxOf);
        // passe ou chute entre os dois snapshots: a bola fica no pé até sair (o impacto da pose cai nesse tick)
        const dep =
            a.owner >= 0 && b.owner !== a.owner
                ? this.departs.get(a.owner)?.find((t) => t > a.tick && t < b.tick)
                : undefined;
        const kb = dep === undefined || !lerpOk ? k : kickHold(a.tick, b.tick, dep, this.playTick);
        const bx = a.bx + (b.bx - a.bx) * kb;
        const by = a.by + (b.by - a.by) * kb;
        const bp = toPx(bx, by);
        // condução: a bola fica no pé de quem conduz, girando suave quando ele muda de direção
        // (no motor ela pula para a frente do jogador a cada tick, o que no 1x parecia "teleporte")
        const carrier = a.owner >= 0 && a.owner === b.owner ? a.owner : -1;
        const d = this.dribble;
        if (carrier >= 0 && pxOf[carrier]) {
            const c = pxOf[carrier];
            const tx = bp.x - c.x;
            const ty = bp.y - c.y;
            if (d.owner !== carrier) {
                d.x = tx;
                d.y = ty;
                d.travel = 0;
            } else {
                const alpha = 1 - Math.exp(-Math.max(0, this.playTick - d.tick) / 1.5);
                d.x += (tx - d.x) * alpha;
                d.y += (ty - d.y) * alpha;
                d.travel += Math.min(30, Math.hypot(c.x - d.cx, c.y - d.cy));
            }
            d.cx = c.x;
            d.cy = c.y;
            // goleiro com a bola na área: ela fica nas mãos, do lado da quadra (no motor fica no "pé", às vezes
            // virado para o gol, e parecia que a bola tinha passado dele)
            const o = carrier * SNAP_STRIDE;
            const gkX = b.p[o];
            const L = FUTSAL_5.pitch.length;
            if (Math.min(gkX, L - gkX) < 6 && this.isKeeper(carrier)) {
                const front = gkX < L / 2 ? 1 : -1;
                const hands = toPx(gkX + front * 0.35, b.p[o + 1]);
                bp.x = c.x + (hands.x - toPx(gkX, b.p[o + 1]).x);
                bp.y = c.y - 6;
                d.reach = 1;
            } else {
                const target = this.touchReach(carrier, a, b, d.travel);
                // mola amortecida: muda de toque/parada sem tranco
                d.reach += (target - d.reach) * (1 - Math.exp(-Math.max(0, this.playTick - d.tick) / 0.6));
                bp.x = c.x + d.x * d.reach;
                bp.y = c.y + d.y * d.reach;
            }
        }
        d.owner = carrier;
        d.tick = this.playTick;
        this.camCarrier = carrier >= 0 ? (pxOf[carrier] ?? null) : null;
        // o time 0 ataca pra direita o jogo todo (attackSign do motor)
        if (near.owner >= 0) this.camAttack = this.players[near.owner]?.team === 1 ? -1 : 1;
        // bola na mão do goleiro que acabou de mergulhar acompanha o mergulho
        const held = near.owner >= 0 ? diveOf.get(near.owner) : undefined;
        if (held) {
            bp.x += held.x;
            bp.y += held.y;
        }
        // drible com nome: a bola sai do pé (por cima, por baixo, em volta) e volta pro snapshot no fim
        // (a bola que saiu do pé dele, num passe ou chute logo depois, larga o enfeite em ~60 ms em vez de voar torta)
        const mine = trick && (a.owner === trick.d.by || b.owner === trick.d.by) ? 1 : 0;
        this.trickOwn += (mine - this.trickOwn) * Math.min(1, this.game.loop.delta / 60);
        const own = trick ? this.trickOwn : 0;
        if (trick) {
            bp.x += trick.pose.ball.x * own;
            bp.y += trick.pose.ball.y * own;
        }
        // bola cruzada: sobe (afasta da sombra) e cresce, como se viesse na direção da câmera
        const bz0 = Math.max(0, (a.bz ?? 0) + ((b.bz ?? 0) - (a.bz ?? 0)) * k);
        const bz = bz0 + ((trick?.pose.lift ?? 0) * own) / (PPM * 0.9);
        const lift = bz * PPM * 0.9;
        // quique: a bola que vinha no alto e toca o chão amassa um instante e solta poeira
        // (e achata em pé: o chapéu e a lambreta caindo, o cruzamento)
        if (this.lastBz > 0.25 && bz < 0.03) {
            this.kickPop(bp.x, bp.y, 0.75, 4);
            this.squashBall(0.4, Math.PI / 2);
        }
        this.lastBz = bz;
        // a bola do drible cresce pouco no alto (a lambreta virava uma bola gigante); a sombra encolhe pela altura toda
        // impacto (chute forte, trave): achata no eixo do impacto e volta esticando (o giro para nesse instante)
        const sq = this.ballSquashNow();
        const bs = (1 + bz0 * 0.3 + (bz - bz0) * 0.1) * this.ballPop.v;
        this.ball.setPosition(bp.x, bp.y - 4 - lift).setScale(bs * (1 + sq), bs * (1 - 0.7 * sq));
        this.ballShadow
            .setPosition(bp.x + 2, bp.y + 2)
            .setDepth(bp.y - 3)
            .setScale(1 / (1 + bz * 0.25))
            .setAlpha(0.35 / (1 + bz * 0.4));
        this.ballFree = near.owner < 0 && a.owner < 0;
        this.updateBallFx(near.bfx, bp.x, bp.y - 4 - lift);
    }

    /**
     * Direção e ação do jogador num snapshot, ignorando "piscadas" de um snapshot só (A→B→A), que faziam o
     * sprite virar e voltar ou alternar parado/correndo. Chute, carrinho etc. passam sempre (são curtos).
     */
    /** O toque na bola de quem está em `view` agora (animação, direção e quadro), ou null (`strikesNear`). */
    private strikePose(view: PlayerView, o: number, index: number) {
        for (const c of strikesNear(this.snaps, index, o, this.departs.get(o / SNAP_STRIDE))) {
            const s = this.strikeAt(view, animForAction(c.action), c.facing, c.contact, c.end);
            // ainda não começou: o toque de antes pode estar no fim
            if (s !== undefined) return s && { ...s, contact: c.contact, action: c.action };
        }
        return null;
    }

    /**
     * A animação de toque com o impacto no tick `contact` (o quadro sai do tick, não do relógio): undefined antes da
     * antecipação, null depois do fim (e de `end`, quando o motor larga a ação).
     */
    private strikeAt(view: PlayerView, want: string, facing: number, contact: number, end: number) {
        const anim = resolveAnim(view.skin, want);
        const { durations, hit } = animTiming(view.skin, anim);
        const ms = strikeLead(durations, hit) + ((this.playTick - contact) * 1000) / TICK_RATE;
        if (ms < 0) return undefined;
        const total = (durations.reduce((a, b) => a + b, 0) * 1000) / 60;
        if (ms >= total && this.playTick >= end) return null;
        return { anim, facing, frame: strikeFrame(durations, ms) };
    }

    private steadyPose(n: number, o: number): { facing: number; action: number } {
        const s = this.snaps;
        const cur = s[Math.min(n, s.length - 1)];
        const prev = s[n - 1];
        const next = s[n + 1];
        let facing = cur.p[o + 2];
        let action = cur.p[o + 3];
        if (prev && next) {
            if (prev.p[o + 2] === next.p[o + 2]) facing = prev.p[o + 2];
            const calm = (a: number) => a === Action.Idle || a === Action.Run;
            if (calm(action) && prev.p[o + 3] === next.p[o + 3] && calm(prev.p[o + 3])) action = prev.p[o + 3];
        }
        return { facing, action };
    }

    /** Posição da bola na tela num tick qualquer (interpolada). */
    private ballPxAt(tick: number) {
        const { index, t } = this.locate(tick);
        const a = this.snaps[index];
        const b = this.snaps[Math.min(index + 1, this.snaps.length - 1)];
        return toPx(a.bx + (b.bx - a.bx) * t, a.by + (b.by - a.by) * t);
    }

    /**
     * Mergulho do goleiro numa defesa: o sprite sai do lugar e chega na bola exatamente no contato,
     * em vez de a bola "passar" por ele e a defesa aparecer do nada.
     */
    private diveOffset(
        i: number,
        px: { x: number; y: number },
    ): { x: number; y: number; facing: number; lean?: Lean; contact?: number } | null {
        const reduce = !!this.md.reduceMotion;
        for (const d of this.dives) {
            if (d.gk !== i) continue;
            const dt = this.playTick - d.tick;
            // no contato: a mesma poeirinha do mergulho vendido (voltando o replay, de novo)
            const due = diveDust(d.dusted, this.playTick, d.tick, reduce);
            d.dusted = due.dusted;
            d.at ??= this.ballPxAt(d.tick);
            // o sprite fica com o pé no chão: mira um pouco abaixo da bola para o corpo cobrir ela
            const to = { x: d.at.x - px.x, y: d.at.y + 6 - px.y };
            const pose = saveDivePose(dt, to, this.players[i].team === 0 ? 1 : -1, reduce);
            if (!pose) continue;
            if (due.fire) this.diveDustAt(px.x + pose.x, px.y + pose.y);
            return { ...pose, facing: dir8(to, 2), lean: pose.k > 0 ? pose : undefined, contact: d.tick };
        }
        for (const d of this.sold) {
            if (d.gk !== i) continue;
            if (!d.toBall) {
                const ball = this.ballPxAt(d.goal);
                const at = this.playerPxAt(d.gk, d.tick);
                d.toBall = { x: ball.x - at.x, y: ball.y - at.y };
            }
            const pose = soldDivePose(d, this.playTick, this.players[i].team === 0 ? 1 : -1, d.toBall, reduce);
            if (!pose) continue;
            // no contato: poeirinha no pé (uma vez; voltando o replay, de novo)
            const due = diveDust(d.dusted, this.playTick, d.tick + SOLD_LEAN.rise, reduce);
            d.dusted = due.dusted;
            if (due.fire) this.diveDustAt(px.x + pose.x, px.y + pose.y);
            return { ...pose, lean: pose.k > 0 ? pose : undefined };
        }
        return null;
    }

    /** Rastro do driblador (roleta, elástico): uma cópia do quadro na cor do time a cada 45 ms, sumindo em 260 ms. */
    private ghost(view: PlayerView, team: 0 | 1) {
        const now = this.time.now;
        if (now - this.ghostAt < 45) return;
        this.ghostAt = now;
        const sp = view.sprite;
        const g = this.add
            .image(sp.x, sp.y, sp.texture.key, sp.frame.name)
            .setOrigin(sp.originX, sp.originY)
            .setScale(sp.scaleX, sp.scaleY)
            .setFlipX(sp.flipX)
            .setRotation(sp.rotation)
            .setTint(this.md.colors[team])
            .setAlpha(0.45)
            .setDepth(sp.depth - 0.5);
        this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    }

    /**
     * O drible com nome na tela agora (pose do `dribblePose`), ou null. Solta a poeirinha no pé ao passar pelo tick dela
     * (andando pra frente; voltando o replay, de novo) e põe o "?" em cima de quem ficou.
     */
    private trickNow() {
        const prev = this.trickTick;
        this.trickTick = this.playTick;
        for (const d of this.named) {
            if (Math.abs(this.playTick - d.tick) > 12) continue;
            if (!d.toBall) {
                const ball = this.ballPxAt(d.tick);
                const at = this.playerPxAt(d.by, d.tick);
                d.toBall = { x: ball.x - at.x, y: ball.y - at.y };
            }
            const at = this.playerPxAt(d.by, this.playTick);
            const mk = this.playerPxAt(d.marker, this.playTick);
            const toMarker = { x: mk.x - at.x, y: mk.y - at.y };
            const mv = this.players[d.marker];
            const head = mv
                ? (mv.sprite.originY - headTop(mv.skin)) * mv.sprite.frame.realHeight * mv.sprite.scaleY
                : 60;
            const pose = dribblePose(d, this.playTick, d.toBall, toMarker, !!this.md.reduceMotion, head);
            if (!pose) continue;
            const step = this.playTick - prev;
            if (step > 0 && step < 2) {
                for (const p of DRIBBLE_PUFFS[d.kind])
                    if (prev < d.tick + p && this.playTick >= d.tick + p)
                        dust(this, at.x + pose.body.x, at.y + pose.body.y + 1, 5, at.y + 1, 0.7);
                // quem levou o drible perde e amassa: a poeira no pé dele
                const lose = d.tick + DRIBBLE_LOSE[d.kind];
                if (prev < lose && this.playTick >= lose)
                    dust(this, mk.x + pose.markerBody.x, mk.y + pose.markerBody.y + 1, 6, mk.y + 1, 0.8);
            }
            return { d, pose };
        }
        return null;
    }

    /** O "?" de quem levou o drible: pula em cima da cabeça dele e some (tudo pelo tick da pose). */
    private drawHuh(trick: { d: NamedDribble; pose: DribblePose } | null) {
        const view = trick && trick.pose.huh > 0.01 ? this.players[trick.d.marker] : null;
        if (!view || !trick) {
            this.huh?.setVisible(false);
            return;
        }
        const s = Math.min(this.uiScale, 2);
        this.huh ??= this.add
            .text(0, 0, '?', {
                fontFamily: 'Galmuri11, monospace',
                fontSize: `${Math.round(16 * s)}px`,
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
            })
            .setOrigin(0.5, 1)
            .setResolution(2);
        const sp = view.sprite;
        const head = sp.y - (sp.originY - headTop(view.skin)) * sp.frame.realHeight * sp.scaleY;
        const k = trick.pose.huh;
        this.huh
            .setVisible(true)
            .setPosition(sp.x, head + 14 - 6 * Math.min(1, k))
            .setScale(Math.max(0.01, k))
            .setAlpha(Math.min(1, k * 1.5))
            .setAngle(8 * Math.sin(this.playTick * 1.3))
            .setDepth(REACT_DEPTH + 1);
    }

    /** Altura da faixa do drible (fração da tela): na metade oposta à de quem dribla. */
    private dribbleBannerY(worldY: number) {
        const v = this.cameras.main.worldView;
        return v.height > 0 && (worldY - v.y) / v.height > 0.5 ? 0.2 : 0.76;
    }

    /**
     * O ápice do drible com nome: a faixa grande com o nome (a do golpe máximo; o texto do gol ou da defesa que vem logo
     * depois espera ela sair), o vento e o "uuh" da torcida. Na 1x, sem Reduzir movimento e fora do duelo: hit-stop curto
     * e zoom no driblador (a câmera lenta vem de `dribbleSlowAt`). Golpe na tela ou câmera presa: só a faixa e o som.
     */
    private namedDribble(e: Extract<MatchEvent, { type: 'tackle' }>) {
        const d = this.named.find((x) => x.tick === e.tick && x.by === e.victim);
        const view = d && this.players[d.by];
        if (!d || !view) return;
        const N = NAMED_DRIBBLE;
        const reduce = !!this.md.reduceMotion;
        const big = this.speed === 1 && !reduce && !this.md.duel;
        this.cine.superBanner({
            portrait: this.cutPortrait(`portrait-${view.speciesId}`),
            move: dict().battle.dribble[d.kind],
            typeLabel: view.name,
            note: null,
            color: this.md.colors[d.team],
            typeInk: 0xffffff,
            fromRight: d.team === 1,
            reduce,
            depth: REACT_DEPTH + 2,
            top: true,
            holdMs: big ? N.bannerMs : 700,
            // longe do lance: embaixo (em cima a lambreta passava por trás dela e no celular o zoom cortava o nome), ou em
            // cima se o lance está na metade de baixo da tela (no celular em pé a faixa cobria o drible)
            y: this.dribbleBannerY(view.sprite.y),
            calm: { inMs: N.bannerInMs, outMs: N.bannerOutMs },
        });
        playSfx('whoosh');
        playCrowd('uuh', 0.7);
        if (!big || this.frameLocked() || this.cine.spotlightActive) return;
        this.holdReal = Math.max(this.holdReal, this.time.now + N.stopMs);
        this.cine.punchIn(view.sprite.x, view.sprite.y, N.zoom, N.stopMs + N.bannerMs);
    }

    /**
     * Poeirinha do mergulho no pé do goleiro: clara com contorno escuro (some no piso laranja sem ele) e por cima do nome
     * dele, que fica bem no pé (embaixo do nome e da bola ela não aparecia).
     */
    private diveDustAt(x: number, y: number) {
        dust(this, x, y + 1, 9, 5002, 1.4);
    }

    /** Reação ao gol sofrido em andamento pro jogador i (0 a 1), ou null. */
    private goalReaction(i: number): number | null {
        for (const r of this.reacts) {
            if (r.gk !== i) continue;
            const k = goalReactionAt(r, this.playTick);
            if (k !== null) return k;
        }
        return null;
    }

    /** Gol da Final: o tipo de quem marcou saindo do corpo durante a comemoração (dentro dos mesmos 2,5 s). */
    private celebAura(view: PlayerView) {
        const type = species(view.speciesId).types[0];
        this.time.addEvent({
            delay: 110,
            repeat: Math.floor(GOAL_CELEB_MS / 110) - 2,
            callback: () => {
                const sp = view.sprite;
                const a = Math.random() * Math.PI * 2;
                trailParticle(this, type, sp.x + Math.cos(a) * 9, sp.y - 12 + Math.sin(a) * 7, sp.depth + 1);
            },
        });
    }

    /** Comemoração do gol em andamento pro jogador i (o motor segura o Celebrate por 2,5 s), ou null. */
    private goalCeleb(i: number, facing: number): ReturnType<typeof goalCelebPose> | null {
        for (let g = this.goalsBy.length - 1; g >= 0; g--) {
            const { by, tick } = this.goalsBy[g];
            if (tick > this.playTick) continue;
            const ms = ((this.playTick - tick) / TICK_RATE) * 1000;
            if (ms > GOAL_CELEB_MS + 200) return null;
            if (by === i) return goalCelebPose(comemoracaoOf(this.players[i].speciesId), ms, facing);
        }
        return null;
    }

    /**
     * Squash & stretch fora do gol (o do mergulho levado pro resto, 12/11): choque do desarme, chute, dominada e
     * arrancada/freada, nessa ordem. A poeirinha do choque e da corrida sai uma vez (voltando o replay, de novo); a da
     * corrida, frequente, só até 2x (no 4x/8x ela piscaria).
     */
    private moveLean(
        i: number,
        px: { x: number; y: number },
        strike: { anim: string; contact?: number; action?: number } | null,
        factor: number,
    ): Lean | null {
        if (this.md.reduceMotion) return null;
        const t = this.playTick;
        for (const b of this.bumps) {
            if ((b.by !== i && b.victim !== i) || t - b.tick <= -1 || t - b.tick >= 6) continue;
            const other = this.playerPxAt(b.by === i ? b.victim : b.by, t);
            const pose = bumpPose(t - b.tick, px.x - other.x, false);
            if (b.by === i) {
                const due = diveDust(b.dusted, t, b.tick, false);
                b.dusted = due.dusted;
                if (due.fire)
                    dust(this, (px.x + other.x) / 2, (px.y + other.y) / 2 + 1, 7, Math.max(px.y, other.y) + 1);
            }
            if (pose) return pose;
        }
        if (strike?.action === Action.Shoot && strike.contact !== undefined) {
            const c = strike.contact;
            const pose = kickSquash(t - c, this.ballPxAt(c + 3).x - this.ballPxAt(c).x);
            if (pose) return pose;
        }
        const trap = latestAt(this.trapsBy[i] ?? [], t + 1);
        const caught = trap ? trapPose(t - trap.tick) : null;
        if (caught) return caught;
        const run = latestAt(this.runs[i] ?? [], t + 1);
        const pose = run ? runBurstPose(run, t) : null;
        if (!run || !pose) return null;
        const due = diveDust(run.dusted, t, run.tick, false);
        run.dusted = due.dusted;
        if (due.fire && factor <= 2.5) {
            const at = runDustAt(run);
            dust(this, px.x + at.x, px.y + at.y + 1, 3, px.y - 1, 0.55);
        }
        return pose;
    }

    /** Cabeça baixa na reação ao gol: amassa um pouco e volta (sem o Reduzir movimento). */
    private droop(k: number | null): Lean | null {
        if (k === null || this.md.reduceMotion) return null;
        const w = Math.sin(Math.PI * k);
        return { tilt: 0, sx: 1 + 0.04 * w, sy: 1 - 0.07 * w };
    }

    /** Inclina e estica o corpo (mergulho, reação) ou devolve ao normal; a rotação sai no drawReaction. */
    private leanBody(view: PlayerView, lean: Lean | null) {
        const sp = view.sprite;
        const base = this.ssNow * (view.flags > 0 && view.flags & FLAG_MINI ? 0.6 : 1);
        // a cabeça anda no máximo 18 px: o Onix (95 px de altura) inclinado 20° saía da quadra
        const h = Math.max(1, (sp.originY - headTop(view.skin)) * sp.frame.realHeight * base);
        const cap = Math.asin(Math.min(1, 18 / h));
        view.tilt = lean && !view.evolving ? Math.max(-cap, Math.min(cap, lean.tilt)) : 0;
        if (view.evolving) return;
        if (lean) {
            sp.setScale(base * lean.sx, base * lean.sy);
            view.stretched = true;
        } else if (view.stretched) {
            sp.setScale(base);
            view.stretched = false;
        }
    }

    /** Giro proporcional ao que a bola andou de fato + rastro para mostrar a direção. */
    private updateBallMotion(shootout: boolean) {
        const { x, y } = this.ball;
        const dx = x - this.lastBall.x;
        const dy = y - this.lastBall.y;
        const moved = Math.hypot(dx, dy);
        if (this.ballSquashNow() !== 0) this.ball.rotation = this.ballSquash.angle;
        else if (moved < 60) this.ball.rotation += (dx >= 0 ? 1 : -1) * (moved / 8);
        this.lastBall = { x, y };

        const free = shootout || this.ballFree;
        const last = this.trail.at(-1);
        // bola dominada ou "teleporte" (saída depois do gol): sem rastro
        if (!free || (last && Math.hypot(x - last.x, y - last.y) > 90)) this.trail.length = 0;
        if (free && (!last || last.x !== x || last.y !== y)) this.trail.push({ x, y, tick: this.playTick });
        // golpe máximo no ar: rastro longo e grosso na cor dele (a curva automática pro canto aparece nele)
        const max = this.maxSlow && this.playTick <= this.maxSlow.until ? this.maxSlow : null;
        const len = max ? MAX_TRAIL_TICKS : TRAIL_TICKS;
        while (this.trail.length && this.playTick - this.trail[0].tick > len) this.trail.shift();

        const g = this.trailG.clear();
        const n = this.trail.length;
        if (n < 2) return;
        g.setDepth(BALL_DEPTH - 2);
        const color = max && this.ballColor === 0xffffff ? max.color : this.ballColor;
        // a bicuda do duelo: o rastro de luz mais grosso do jogo (dá pra seguir a bola de gol a gol)
        if (this.sdFly && max) {
            lightTrail(g, this.trail, color, 18 + 16 * this.sdFly.speed);
            return;
        }
        // o N3 de linha: o rastro de luz forte na cor do tipo; a bicuda N1/N2, o do Counter em versão curta
        if (this.n3?.flying && max) {
            lightTrail(g, this.trail, color, 15);
            return;
        }
        if (this.maxRun?.bicuda && !this.maxRun.landed && max) {
            lightTrail(g, this.trail, color, MAX_N12.trail[this.maxRun.level]);
            return;
        }
        const w = max ? MAX_BALL_FX[max.level as 1 | 2 | 3].trail : 5;
        for (let i = 1; i < n; i++) {
            const k = i / (n - 1);
            g.lineStyle(1.5 + w * k, color, 0.08 + (max ? 0.6 : 0.42) * k);
            g.lineBetween(this.trail[i - 1].x, this.trail[i - 1].y, this.trail[i].x, this.trail[i].y);
        }
    }

    /** Chute com golpe: brilho na bola e rastro na cor do tipo; no golpe máximo, mais forte por nível. */
    private updateBallFx(bfx: string, x: number, y: number) {
        const max = this.maxSlow && this.playTick <= this.maxSlow.until && this.ballFree ? this.maxSlow : null;
        const type = bfx || (max?.type ?? '');
        const fx = max ? MAX_BALL_FX[max.level as 1 | 2 | 3] : null;
        if (!type) {
            this.ballGlow.setAlpha(0);
            this.ballColor = 0xffffff;
            this.ballType = '';
            return;
        }
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
        this.ballColor = color;
        this.ballType = type;
        // brilho pulsando + partícula do tipo a cada ~30 ms (fogo sobe, água pinga, elétrico faísca…)
        const pulse = 0.45 + 0.2 * Math.sin(this.time.now / 60);
        this.ballGlow
            .setPosition(x, y)
            .setFillStyle(color, pulse)
            .setScale((fx?.glow ?? 1.1) + 0.15 * Math.sin(this.time.now / 45))
            .setAlpha(1)
            .setDepth(this.ball.depth - 1);
        // o N3 de linha solta as partículas do tipo num fluxo só (TypeFx), não uma a uma
        if (
            this.time.now - this.lastTrailAt > (fx?.every ?? 30) &&
            this.ballFree &&
            !this.n3?.flying &&
            !this.maxRun?.stream
        ) {
            this.lastTrailAt = this.time.now;
            // golpe máximo: mais partículas, espalhadas em volta da bola (N1 discreto, N3 forte)
            for (let i = 0; i < (fx?.n ?? 1); i++) {
                const a = Math.random() * Math.PI * 2;
                const r = i ? Math.random() * (fx?.spread ?? 0) : 0;
                trailParticle(this, type, x + Math.cos(a) * r, y + Math.sin(a) * r, this.ball.depth - 2);
            }
        }
    }

    private emitTick(snap: MatchSnapshot) {
        EventBus.emit('match:tick', {
            tick: this.playTick,
            minute: snap.minute,
            half: snap.half,
            score: snap.score,
            phase: snap.phase,
        });
    }

    private finish() {
        if (this.ended) return;
        this.ended = true;
        const kind = this.md.ceremony;
        if (kind && !this.md.replay && this.md.result.winner === this.mine) {
            EventBus.emit('match:ceremony', kind);
            this.startCeremony(kind);
        }
        EventBus.emit('match:ended');
    }

    /** O time já reage ao resultado (o pulo e o sentar no ritmo normal, fora da câmera lenta da faixa). */
    private endOn = false;

    /**
     * Fim de jogo com cara (docs/planos/animacoes-novas.md, B2): cada um reage ao resultado (`endPose`) com um atraso,
     * dentro do tempo que a faixa já fica (o `finish` e o FinalCard não esperam). Pelo relógio da cena: segue depois do
     * apito e na disputa de pênaltis, que não passam pelo `applySnapshot`; a cerimônia do título manda no lugar dela.
     */
    private endReact(winner: 0 | 1 | null, lead: number) {
        const reduce = !!this.md.reduceMotion;
        for (const team of [0, 1] as const)
            this.players
                .filter((v) => v.team === team)
                .forEach((view, slot) => {
                    const pose = endPose(team, winner, slot, (a) => resolveAnim(view.skin, a) === a, reduce);
                    this.time.delayedCall(lead + pose.delay, () => {
                        if (this.cer || view.evolving || view.enter) return;
                        this.endOn = true;
                        const frame = pose.still ? animTiming(view.skin, pose.anim).durations.length - 1 : undefined;
                        view.act = { anim: pose.anim, facing: pose.facing, frame, hold: pose.still };
                        const key = `${view.skin}/${pose.anim}/${pose.facing}`;
                        view.sprite.play(frame === undefined ? key : { key, startFrame: frame });
                        if (pose.still) view.sprite.anims.pause();
                        view.sprite.setOrigin(0.5, footOrigin(view.skin, pose.anim)).setAngle(0);
                        view.sprite.anims.timeScale = 1;
                        view.currentKey = key;
                    });
                });
    }

    // ------------------------------------------------------------------ cerimônia do título (A1 e A2)
    private cer: {
        kind: CeremonyKind;
        plan: CeremonyPlan;
        t0: number;
        /** Hora da cena que vale (o toque pula pra foto: soma no relógio). */
        skip: number;
        fired: Set<string>;
        actors: {
            v: PlayerView;
            from: Pt;
            to: Pt;
            /** Colado no capitão quando ele vai pro alto (só a invasão). */
            hug: Pt;
            celeb: Comemoracao;
            captain: boolean;
            rival: boolean;
        }[];
        fans: { img: Phaser.GameObjects.Image; f: Fan; key: string; shadow: Phaser.GameObjects.Ellipse }[];
        wild: {
            sp: Phaser.GameObjects.Sprite;
            shadow: Phaser.GameObjects.Ellipse;
            from: Pt;
            to: Pt;
            fly: boolean;
            late: number;
            skin: number;
        }[];
        cup: Phaser.GameObjects.Image;
        rays: Phaser.GameObjects.Graphics | null;
        center: Pt;
        reduce: boolean;
        /** Câmera: o zoom em que o jogo acabou e o ponto atual (anda atrás do alvo, sem pulo). */
        camFrom: number;
        cam: { zoom: number; x: number; y: number };
        last: number;
        confetti: {
            o: Phaser.GameObjects.Rectangle;
            x: number;
            y: number;
            vx: number;
            vy: number;
            spin: number;
            ph: number;
        }[];
    } | null = null;

    /** Os selvagens da invasão (só a Final da Rota): as folhas entram com o resto, na carga da cena. */
    private ceremonySpecies(): number[] {
        return this.md.ceremony === 'invasao' ? INVADERS.map((w) => w.id) : [];
    }

    private startCeremony(kind: CeremonyKind) {
        const reduce = !!this.md.reduceMotion;
        const plan = ceremonyPlan(kind);
        const center = toPx(FUTSAL_5.pitch.length / 2, FUTSAL_5.pitch.width / 2);
        // de onde cada um está na tela agora (o fim do jogo ou a disputa de pênaltis)
        const posOf = (i: number): Pt => ({ x: this.players[i].sprite.x, y: this.players[i].sprite.y });
        const mine = this.players.map((v, i) => ({ v, i })).filter(({ v }) => v.team === this.mine);
        const cap = mine.find(({ v }) => v.captain) ?? mine[mine.length - 1];
        const rest = mine.filter((m) => m !== cap);
        const moon = halfMoon(center, rest.length);
        const hug = huddle(moon.captain, rest.length);
        const actors: NonNullable<typeof this.cer>['actors'] = [];
        for (const { v, i } of mine) {
            const k = v === cap.v ? -1 : rest.findIndex((m) => m.v === v);
            const to = k < 0 ? moon.captain : moon.others[k];
            actors.push({
                v,
                from: posOf(i),
                to,
                hug: k < 0 ? to : hug[k],
                celeb: comemoracaoOf(v.speciesId),
                captain: k < 0,
                rival: false,
            });
        }
        // o rival sai de cena pela lateral mais perto (a foto é do campeão) e some no caminho
        for (const [i, v] of this.players.entries()) {
            if (v.team === this.mine) continue;
            const from = posOf(i);
            const side = from.x < center.x ? -1 : 1;
            const to = { x: center.x + side * (GAME_W * 0.5 + 40), y: from.y + (from.y < center.y ? -30 : 30) };
            actors.push({ v, from, to, hug: to, celeb: 'pulo', captain: false, rival: true });
        }
        for (const v of this.players) {
            for (const o of [v.label, v.badge, v.ring, v.arrow]) o?.setVisible(false);
            v.lunge = { x: 0, y: 0 };
            v.shift = { x: 0, y: 0 };
            v.act = null;
            v.sprite.setAngle(0).setAlpha(1).setScale(this.ssNow);
            v.sprite.anims.timeScale = 1;
        }
        this.ball.setVisible(false);
        this.ballShadow.setVisible(false);
        // a quadra grande do celular (court-follow) segue quem tem a bola: agora, o meio da festa
        this.ball.setPosition(center.x, center.y);
        this.camCarrier = { x: center.x, y: center.y };
        this.camAttack = 0;
        // auras e reações paradas no último quadro do jogo saem da foto
        this.agencyG?.clear();
        this.reactG.clear();
        if (!this.textures.exists('cer-cup')) this.textures.addCanvas('cer-cup', paintCup('ouro'));
        const cup = this.add.image(0, 0, 'cer-cup').setOrigin(0.5, 1).setScale(2).setVisible(false);
        const club = this.md.colors[this.mine];
        const fans: NonNullable<typeof this.cer>['fans'] = [];
        const wild: NonNullable<typeof this.cer>['wild'] = [];
        if (kind === 'invasao') {
            const seed = String(this.md.result.seed);
            invasionFans(seed, center, 40, { w: GAME_W, h: GAME_H }).forEach((f, n) => {
                const key = `cer-fan-${club}-${n}`;
                for (const fr of FAN_FRAMES)
                    if (!this.textures.exists(`${key}-${fr}`))
                        this.textures.addCanvas(`${key}-${fr}`, paintFan(f.look, fr, club));
                const shadow = this.add.ellipse(f.from.x, f.from.y, 18, 5, 0x000000, 0.28).setVisible(false);
                const img = this.add
                    .image(f.from.x, f.from.y, `${key}-run0`)
                    .setOrigin(0.5, 1)
                    .setScale(2)
                    .setVisible(false);
                fans.push({ img, f, key, shadow });
            });
            // os selvagens chegam na multidão (atrás e dos lados do time), não no meio dele
            const spots = [
                { x: -128, y: -74 },
                { x: 150, y: -40 },
                { x: -158, y: 30 },
                { x: 132, y: 70 },
            ];
            INVADERS.forEach((w, k) => {
                const skin = skinOf(w.id, false);
                if (!this.textures.exists(atlasKey(skin))) return;
                createSpeciesAnims(this, skin);
                const to = { x: center.x + spots[k].x, y: center.y + spots[k].y };
                const from = { x: to.x + Math.sign(spots[k].x) * 260, y: spots[k].y < 0 ? -30 : GAME_H + 30 };
                const sp = this.add.sprite(from.x, from.y, atlasKey(skin)).setScale(this.ssNow).setVisible(false);
                const shadow = this.add.ellipse(from.x, from.y, 18, 6, 0x000000, 0.25).setVisible(false);
                wild.push({ sp, shadow, from, to, fly: w.fly, late: w.late, skin });
            });
        }
        const cam = this.cameras.main;
        // a cerimônia manda na câmera: os panos e zooms que ainda andavam (o drama do FIM DE JOGO) param aqui
        cam.panEffect.reset();
        cam.zoomEffect.reset();
        this.cer = {
            kind,
            plan,
            t0: this.time.now,
            // Reduzir movimento: só a foto final, parada (`reducedHold`)
            skip: reduce ? plan.end - reducedHold(kind) : 0,
            fired: new Set(reduce ? ['explode', 'land', 'flash'] : []),
            actors,
            fans,
            wild,
            cup,
            rays: reduce ? null : this.add.graphics().setVisible(false),
            center,
            reduce,
            camFrom: cam.zoom,
            cam: { zoom: cam.zoom, x: cam.midPoint.x, y: cam.midPoint.y },
            last: this.time.now,
            confetti: [],
        };
        this.input.on('pointerdown', this.ceremonySkip, this);
        EventBus.on('match:ceremony-skip', this.ceremonySkip, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off('match:ceremony-skip', this.ceremonySkip, this);
            this.input.off('pointerdown', this.ceremonySkip, this);
        });
        this.ceremonyStep();
    }

    /** Toque: pula pra foto (um piscar escuro de 250 ms, nada teleporta); já na foto, segue (o FinalCard). */
    private ceremonySkip() {
        const c = this.cer;
        if (!c || c.fired.has('end') || c.fired.has('skipping')) return;
        const now = this.time.now - c.t0 + c.skip;
        if (now >= c.plan.photo) {
            c.skip += c.plan.end - now;
            return;
        }
        c.fired.add('skipping');
        const cam = this.cameras.main;
        cam.fadeOut(110, 13, 16, 36);
        this.time.delayedCall(115, () => {
            const t = this.time.now - c.t0 + c.skip;
            if (t < c.plan.photo) c.skip += c.plan.photo - t;
            for (const k of ['explode', 'land', 'flash']) c.fired.add(k);
            // a câmera já no quadro da foto
            c.cam.zoom = 0;
            this.ceremonyStep();
            cam.fadeIn(160, 13, 16, 36);
            c.fired.delete('skipping');
        });
    }

    /** Um quadro da cerimônia: tudo sai da hora (o toque e o Reduzir movimento só adiantam o relógio). */
    private ceremonyStep() {
        const c = this.cer;
        if (!c) return;
        const t = this.time.now - c.t0 + c.skip;
        const dt = Math.min(50, this.time.now - c.last);
        c.last = this.time.now;
        const p = c.plan;
        const once = (key: string, at: number, fn: () => void) => {
            if (t >= at && !c.fired.has(key)) {
                c.fired.add(key);
                fn();
            }
        };
        const ease = Phaser.Math.Easing.Sine.InOut;
        const lerp = (a: Pt, b: Pt, k: number) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
        // a foto: tudo para no quadro dela (o confete continua caindo)
        const frozen = p.invade !== undefined && t >= p.photo;
        const tt = frozen ? p.photo : t;
        let capTop = 0;
        let capAt: Pt = c.center;
        let capLift = 0;
        for (const a of c.actors) {
            const { v } = a;
            const walkK = Phaser.Math.Clamp((tt - p.gather) / (a.rival ? WALK_MS * 1.8 : WALK_MS), 0, 1);
            let at = lerp(a.from, a.to, ease(walkK));
            const walking = walkK > 0 && walkK < 1;
            let anim = 'Idle';
            let facing = 0;
            let lift = 0;
            let alpha = 1;
            let sx = 1;
            let sy = 1;
            if (a.rival) {
                anim = walking ? 'Walk' : tt >= p.gather ? 'Idle' : 'Hurt';
                facing = walking ? dir8({ x: a.to.x - a.from.x, y: a.to.y - a.from.y }, 0) : 0;
                // some no caminho (a foto é do campeão)
                alpha = 1 - Phaser.Math.Easing.Quadratic.In(walkK);
            } else if (walking) {
                anim = 'Walk';
                facing = dir8({ x: a.to.x - a.from.x, y: a.to.y - a.from.y }, 0);
            } else if (tt < p.gather && tt >= p.jump) {
                const pose = goalCelebPose(a.celeb, tt - p.jump, 0);
                anim = pose.anim;
                facing = pose.facing;
                sx = pose.sx;
                sy = pose.sy;
            } else if (p.toss !== undefined && p.getUp !== undefined && tt >= p.toss - HUDDLE_MS) {
                // o capitão vai pro alto: os outros chegam junto, jogam e voltam pra meia-lua
                const inK = Phaser.Math.Clamp((tt - (p.toss - HUDDLE_MS)) / HUDDLE_MS, 0, 1);
                const outK = Phaser.Math.Clamp((tt - p.getUp) / HUDDLE_MS, 0, 1);
                if (!a.captain) at = lerp(lerp(a.to, a.hug, ease(inK)), a.to, ease(outK));
                const moving = (inK > 0 && inK < 1) || (outK > 0 && outK < 1);
                if (a.captain) {
                    const ms = tt - p.toss;
                    lift = tossHeight(ms);
                    if (ms >= 0 && tt < p.getUp) anim = ms < TOSS_MS * 3 ? 'Hurt' : 'Trip';
                    // amassa quando cai nos braços (e no chão, na 3ª) e estica subindo
                    const k = ms / TOSS_MS;
                    const near = Math.abs(k - Math.round(k));
                    if (ms > 0 && k < 3.3 && Math.round(k) >= 1 && near < 0.12) {
                        const q = 1 - near / 0.12;
                        sx = 1 + 0.14 * q;
                        sy = 1 - 0.14 * q;
                    } else if (lift > 4 && k % 1 < 0.4) sy = 1.06;
                    else if (tt >= p.lift) anim = 'Pose';
                    else if (tt >= p.charge) anim = 'Charge';
                } else if (moving) {
                    anim = 'Walk';
                    facing =
                        outK > 0
                            ? dir8({ x: a.to.x - a.hug.x, y: a.to.y - a.hug.y }, 0)
                            : dir8({ x: a.hug.x - a.to.x, y: a.hug.y - a.to.y }, 0);
                } else if (tt >= p.toss && tt < p.getUp) anim = 'Attack';
                else if (tt >= p.lift) anim = 'Hop';
            } else if (a.captain && tt >= p.gather) {
                if (tt >= p.lift) anim = 'Pose';
                else if (tt >= p.charge) anim = 'Charge';
            } else if (tt >= p.lift || (p.ring !== undefined && tt >= p.ring)) {
                anim = 'Hop';
            }
            if (!a.rival && !a.captain && !walking && anim !== 'Walk' && tt >= p.gather + WALK_MS) {
                // de frente pro capitão até ele erguer a taça; depois, pra câmera (a foto)
                const capt = c.actors.find((x) => x.captain);
                facing = tt < p.lift && capt ? dir8({ x: capt.to.x - at.x, y: capt.to.y - at.y }, 0) : 0;
            }
            v.sprite
                .setPosition(at.x, at.y - lift)
                .setDepth(at.y)
                .setAlpha(alpha)
                .setScale(this.ssNow * (c.reduce ? 1 : sx), this.ssNow * (c.reduce ? 1 : sy));
            v.shadow
                .setPosition(at.x, at.y + 1)
                .setDepth(at.y - 2)
                .setAlpha(alpha)
                .setScale(1 - Math.min(0.55, lift / 110));
            const resolved = resolveAnim(v.skin, anim);
            const key = `${v.skin}/${resolved}/${facing}`;
            if (key !== v.currentKey) {
                v.sprite.play(key).setOrigin(0.5, footOrigin(v.skin, resolved));
                v.currentKey = key;
                // Reduzir movimento e a foto: parados
                if (c.reduce || frozen) v.sprite.anims.pause();
            }
            if (a.captain) {
                capAt = at;
                capLift = lift;
                capTop = bodyHeight(v.skin) * this.ssNow;
            }
        }
        // a taça: sobe das mãos pra cima da cabeça (passa do ponto e assenta)
        const up = Phaser.Math.Clamp((tt - p.lift) / 360, 0, 1);
        c.cup
            .setVisible(tt >= p.lift)
            .setPosition(capAt.x, capAt.y - capLift - capTop * (0.45 + 0.5 * Phaser.Math.Easing.Back.Out(up)))
            .setDepth(capAt.y + 1);
        if (c.rays) {
            const on = tt >= p.lift;
            c.rays.setVisible(on);
            if (on) {
                // raios dourados atrás do capitão: crescem com a taça e giram devagar
                const grow = Phaser.Math.Easing.Back.Out(Phaser.Math.Clamp((t - p.lift) / 420, 0, 1));
                const R = 150 * grow;
                c.rays
                    .clear()
                    .setPosition(capAt.x, capAt.y - capTop * 0.9)
                    .setDepth(capAt.y - 60);
                c.rays.fillStyle(0xffc93c, 0.34);
                const spin = (t - p.lift) / 2600;
                for (let r = 0; r < 14; r++) {
                    const a0 = spin + (r / 14) * Math.PI * 2;
                    c.rays.fillTriangle(
                        0,
                        0,
                        Math.cos(a0) * R,
                        Math.sin(a0) * R,
                        Math.cos(a0 + 0.13) * R,
                        Math.sin(a0 + 0.13) * R,
                    );
                }
                c.rays.fillStyle(0xfff3c4, 0.28).fillCircle(0, 0, 26 * grow);
            }
        }
        // a torcida e os selvagens: descem correndo, desaceleram e pulam na multidão (cada um no seu ritmo)
        if (p.invade !== undefined) {
            for (const f of c.fans) {
                const run = (tt - p.invade - f.f.delay) / f.f.dur;
                const k = Phaser.Math.Clamp(run, 0, 1);
                const at = lerp(f.f.from, f.f.to, Phaser.Math.Easing.Quadratic.Out(k));
                const since = tt - p.invade - f.f.delay - f.f.dur;
                const pose = fanPose(f.f, since >= 0 ? since : tt, k < 1);
                const on = run > 0;
                f.img
                    .setTexture(`${f.key}-${pose.frame}`)
                    .setPosition(
                        Math.round(at.x),
                        Math.round(at.y - pose.air - (k < 1 ? Math.abs(Math.sin(tt / 70)) : 0)),
                    )
                    .setDepth(at.y - 1)
                    .setFlipX(k < 1 ? f.f.to.x < f.f.from.x : f.f.to.x > c.center.x)
                    .setVisible(on);
                f.shadow
                    .setPosition(at.x, at.y)
                    .setDepth(at.y - 2)
                    .setScale(1 - Math.min(0.5, pose.air / 24))
                    .setVisible(on);
            }
            for (const w of c.wild) {
                const k = Phaser.Math.Clamp((tt - p.invade - 300 - w.late) / 1700, 0, 1);
                const at = lerp(w.from, w.to, Phaser.Math.Easing.Sine.Out(k));
                const air = w.fly ? 34 + Math.sin(tt / 220) * 4 : 0;
                const facing = k >= 1 ? 0 : dir8({ x: w.to.x - w.from.x, y: w.to.y - w.from.y }, 0);
                const resolved = resolveAnim(w.skin, k >= 1 ? 'Hop' : 'Walk');
                const key = `${w.skin}/${resolved}/${facing}`;
                if (w.sp.anims.currentAnim?.key !== key) {
                    w.sp.play(key).setOrigin(0.5, footOrigin(w.skin, resolved));
                    if (c.reduce || frozen) w.sp.anims.pause();
                }
                const on = tt >= p.invade + 300 + w.late;
                w.sp
                    .setPosition(at.x, at.y - air)
                    .setDepth(at.y)
                    .setVisible(on);
                w.shadow
                    .setPosition(at.x, at.y)
                    .setDepth(at.y - 2)
                    .setScale(w.fly ? 0.7 : 1)
                    .setVisible(on);
            }
        }
        this.stepCeremonyCamera(c, t, dt);
        this.stepConfetti(c, dt);
        // as batidas (uma vez cada)
        const mineColor = this.md.colors[this.mine];
        const cap = c.actors.find((a) => a.captain);
        if (p.invade !== undefined) {
            once('explode', p.jump, () => {
                playCrowd('gol');
                if (cap) playCry(cap.v.speciesId, this.md.cries, 1.15);
                this.ceremonyFlashes(18, 900);
                this.confettiBurst(c, mineColor, 60);
            });
            once('land', (p.toss ?? 0) + TOSS_MS * 3 - 20, () => {
                playSfx('thud', 0.8);
                playCrowd('uuh');
                dust(this, capAt.x, capAt.y + 1, 10, capAt.y + 2, 1.3);
                if (!c.reduce) this.cameras.main.shake(140, 0.004);
            });
        }
        once('flash', p.lift, () => {
            playSfx('goal', 1.12);
            if (p.invade === undefined) playCrowd('gol');
            if (cap) playCry(cap.v.speciesId, this.md.cries, 1.2);
            // sem clarão na tela inteira (no PC era um retângulo branco piscando): o brilho fica na taça
            this.fx.burst('Flash', capAt.x, capAt.y - capLift - capTop * 0.95, 1, capAt.y + 2);
            this.ceremonyFlashes(14, 1200);
            this.confettiBurst(c, mineColor, p.invade === undefined ? 70 : 50);
        });
        once('photo', p.photo, () => {
            if (p.invade !== undefined) {
                // o clique da câmera da foto
                playSfx('select', 2.2);
                playSfx('save', 2.6);
                this.ceremonyFlashes(10, 400);
            }
            this.photoPlate(p.invade !== undefined ? tr('battle.rotaChamp') : tr('battle.cupChamp'), this.md.teamName);
        });
        once('end', p.end, () => EventBus.emit('match:ceremony-end'));
    }

    /**
     * A câmera da cerimônia (`ceremonyCamera`): o alvo anda pelas curvas do roteiro e a câmera vai atrás dele suave
     * (o toque que pula pra foto não dá tranco). No Reduzir movimento, direto no quadro.
     */
    private stepCeremonyCamera(c: NonNullable<typeof this.cer>, t: number, dt: number) {
        const cam = this.cameras.main;
        const want = ceremonyCamera(c.kind, c.reduce ? c.plan.end : t, c.camFrom);
        const zoom = 1 + (want.zoom - 1) * this.zoomDamp;
        const y = c.center.y - want.up;
        const snap = c.reduce || c.cam.zoom === 0;
        const k = snap ? 1 : 1 - Math.exp(-dt / 110);
        c.cam.zoom = snap ? zoom : c.cam.zoom + (zoom - c.cam.zoom) * k;
        c.cam.x += (c.center.x - c.cam.x) * k;
        c.cam.y += (y - c.cam.y) * k;
        cam.setZoom(c.cam.zoom);
        cam.centerOn(c.cam.x, c.cam.y);
    }

    /** Flashes da torcida na beira da parte da quadra que está na tela. */
    private ceremonyFlashes(n: number, ms: number) {
        if (this.md.reduceMotion) return;
        const v = this.cameras.main.worldView;
        const pts = Array.from({ length: n }, (_, i) => {
            const top = i % 2 === 0;
            return { x: v.x + v.width * ((i + 0.5) / n), y: top ? v.y + v.height * 0.08 : v.y + v.height * 0.94 };
        });
        crowdFlash(this.fx, this, pts, ms, 6000, false);
    }

    /**
     * Confete com física: dois canhões nos cantos de baixo atiram pra cima e pro meio; no alto o papel perde força,
     * cai balançando e girando (a largura vira com o giro, como papel de verdade). Cor do clube, dourado e branco.
     */
    private confettiBurst(c: NonNullable<typeof this.cer>, club: number, n: number) {
        if (c.reduce) return;
        const v = this.cameras.main.worldView;
        const light = Phaser.Display.Color.IntegerToColor(club).lighten(25).color;
        const colors = [club, 0xffd75e, 0xffffff, light, 0xffd75e];
        for (let i = 0; i < n; i++) {
            const left = i % 2 === 0;
            const x = left ? v.x + v.width * 0.04 : v.x + v.width * 0.96;
            const y = v.y + v.height * 1.02;
            const a = (left ? -1 : 1) * (0.18 + Math.random() * 0.42);
            const speed = (0.55 + Math.random() * 0.45) * (v.height / 330);
            const o = this.add.rectangle(x, y, 3, 5, colors[i % colors.length]).setDepth(6500);
            c.confetti.push({
                o,
                x,
                y,
                vx: Math.sin(-a) * speed * 0.9,
                vy: -Math.cos(a) * speed,
                spin: (Math.random() - 0.5) * 0.02,
                ph: Math.random() * Math.PI * 2,
            });
        }
    }

    private stepConfetti(c: NonNullable<typeof this.cer>, dt: number) {
        const bottom = this.cameras.main.worldView.bottom + 20;
        c.confetti = c.confetti.filter((q) => {
            // gravidade e arrasto do ar; caindo, o papel plana (velocidade máxima baixa) e balança pros lados
            q.vy += 0.0016 * dt;
            q.vx *= 0.985 ** (dt / 16);
            if (q.vy > 0.07) q.vy = 0.07 + (q.vy - 0.07) * 0.9 ** (dt / 16);
            q.ph += dt * 0.012;
            q.x += q.vx * dt + (q.vy > 0 ? Math.sin(q.ph) * 0.03 * dt : 0);
            q.y += q.vy * dt;
            q.o
                .setPosition(q.x, q.y)
                .setRotation(q.o.rotation + q.spin * dt)
                .setScale(Math.abs(Math.cos(q.ph * 0.8)) * 0.8 + 0.2, 1);
            if (q.y > bottom && q.vy > 0) {
                q.o.destroy();
                return false;
            }
            return true;
        });
    }

    /**
     * A placa do título no alto da tela (presa na tela, fora de cima do time): placa escura com a faixa na cor do clube
     * e sombra dura, o título em dourado e o nome do time embaixo. Desce do alto e assenta.
     */
    private photoPlate(title: string, sub?: string) {
        // a placa ocupa ~60% da largura que aparece (no celular em pé, só um pedaço da quadra): o texto já nasce no
        // tamanho final (escalar o texto pronto borrava)
        const shown = this.cine.crop ? this.cine.crop.w / CROP_TEXT_SCALE : GAME_W;
        const probe = this.add.text(0, 0, title, {
            fontFamily: 'Galmuri11, monospace',
            fontSize: '24px',
            fontStyle: 'bold',
        });
        const s = Phaser.Math.Clamp((0.6 * shown) / (probe.width + 28), 0.7, 2.4);
        probe.destroy();
        const text = (str: string, size: number, color: string) =>
            this.add
                .text(0, 0, str, {
                    fontFamily: 'Galmuri11, monospace',
                    fontSize: `${Math.round(size * s)}px`,
                    fontStyle: 'bold',
                    color,
                    stroke: '#0d1024',
                    strokeThickness: Math.round(4 * s),
                })
                .setOrigin(0.5, 0)
                .setResolution(2);
        const big = text(title, 24, '#ffd75e');
        const small = sub ? text(sub.toUpperCase(), 15, '#ffffff') : null;
        const pad = 14 * s;
        const w = Math.max(big.width, small?.width ?? 0) + pad * 2;
        const h = big.height + (small ? small.height : 0) + pad * 1.1;
        big.setY(pad * 0.5);
        small?.setY(pad * 0.5 + big.height - 2 * s);
        const club = this.md.colors[this.mine];
        const r = Math.round(6 * s);
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.85).fillRoundedRect(-w / 2, 4 * s, w, h, r);
        g.fillStyle(0x0d1024, 0.96).fillRoundedRect(-w / 2, 0, w, h, r);
        g.lineStyle(2 * s, 0xffd75e, 0.9).strokeRoundedRect(-w / 2 + s, s, w - 2 * s, h - 2 * s, r);
        g.fillStyle(club, 1).fillRect(-w / 2 + 8 * s, h - 5 * s, w - 16 * s, 3 * s);
        const inner = this.add.container(0, -h - 20, small ? [g, big, small] : [g, big]);
        const holder = this.add.container(0, 0, [inner]).setDepth(9800);
        // presa na tela, no alto (a câmera da foto deixa o time na metade de baixo)
        this.cine.pin(holder, GAME_W / 2, GAME_H * 0.03, 1);
        if (this.md.reduceMotion) inner.setY(0);
        else this.tweens.add({ targets: inner, y: 0, duration: 420, ease: 'Back.easeOut' });
    }

    // ------------------------------------------------------------------ eventos
    private handleEvent(e: MatchEvent, silent: boolean) {
        EventBus.emit('match:event', e);
        if (e.type === 'sub') {
            const view = this.players[e.outIdx];
            if (view) {
                const at = { x: view.sprite.x, y: view.sprite.y };
                createSpeciesAnims(this, skinOf(e.inSpeciesId, e.inShiny));
                this.swapSpecies(view, e.inSpeciesId, e.in, e.inShiny);
                this.updateUiScale();
                if (!silent) {
                    // quem sai anda até a lateral (perto do banco do time); quem entra sai de lá e vai para a quadra.
                    // Troca volante (bola rolando): o motor já põe quem entra na lateral e a partida não para
                    playSample('apito-curto');
                    this.walkSub(view, e.outSpeciesId, at, !!e.fly);
                    this.popText(e.outIdx, '⇅', '#7dff8a');
                    const h: MatchHighlight = {
                        kind: 'sub',
                        team: e.team,
                        speciesId: e.inSpeciesId,
                        shiny: e.inShiny,
                        name: e.in,
                        outSpeciesId: e.outSpeciesId,
                        outName: e.out,
                    };
                    EventBus.emit('match:highlight', h);
                }
            }
        }
        if (e.type === 'evolve') {
            const view = this.players[e.by];
            if (view) {
                const skin = this.loadedSkin(e.into, view.shiny);
                const ready = this.textures.exists(atlasKey(skin));
                if (ready) createSpeciesAnims(this, skin);
                const newName = view.name === species(e.from).name ? species(e.into).name : view.name;
                // a tela cheia ("Parabéns!") é só do seu time; a do rival é na quadra, curta e com faixa própria
                let how = evolutionView(view.team, this.mine, silent, ready);
                // replay: nada de tela cheia (não tem quem feche); a sua evolução sai na quadra, como a do rival
                if (how === 'mine' && this.md.replay) how = 'rival';
                if (how === 'rival') this.rivalEvolution(view, e.from, e.into, newName, ready);
                else if (how === 'mine') this.evolveAnimation(view, e.from, e.into, newName);
                else this.finishEvolution(view, e.into, newName);
            }
        }
        // Ditto vira a cópia; ao vivo quem troca é a animação de Transformar (pisca em branco antes, ver abaixo)
        if (e.type === 'transform' && silent) this.becomeCopy(e.by, e.into, e.target);
        if (e.type === 'showdown') this.startShowdown(e, silent);
        if (silent) return;
        // intervalo: a partida para e o técnico decide (tática, substituição) antes do 2º tempo
        if (e.type === 'halftime' && !this.md.replay) {
            this.paused = true;
            // em 8x a reprodução passa do apito no mesmo quadro: volta pro apito, senão a troca pedida no
            // intervalo (marcada no lance seguinte a ele) ficaria para trás da reprodução e seria pulada
            this.playTick = e.tick;
            this.halftimeAt = e.tick;
            EventBus.emit('match:halftime');
        }
        // beira da quadra (copa): o seu pedido de tempo para a quadra, e antes dos pênaltis você escolhe a ordem
        if (this.md.agency && !this.md.duel) {
            if (e.type === 'timeout' && e.team === this.mine) {
                this.paused = true;
                this.playTick = e.tick;
                EventBus.emit('match:timeout', e.tick);
            } else if (e.type === 'fulltime' && this.penalties.length && !this.penPicked) {
                this.penPicked = true;
                this.paused = true;
                this.playTick = e.tick;
                EventBus.emit('match:penalty-pick', e.tick);
            }
        }
        const cries = this.md.cries;
        const cinematic = this.md.cinematic;
        const reaction = reactionFor(e, this.reactCtx);
        if (reaction) {
            const show = () =>
                this.react(reaction, e.tick, showsWord(reaction, this.reactionsAt(e.tick), this.spritePos));
            // na cena do especial N3 quem caiu reage depois dela (a palavra cobria o capitão no close); no golpe com
            // alvo, depois do bote de quem atacou chegar nele (`MOVE_LUNGE_MS`): a reação vem depois do contato
            const lunge = e.type === 'move' && e.target !== null && e.target !== e.by ? MOVE_LUNGE_MS : 0;
            const wait = Math.max(this.n3SceneUntil - this.time.now, lunge);
            if (wait > 0) this.time.delayedCall(wait, show);
            else show();
        }
        // o chute N3 chegou (gol, defesa, bloqueio, trave): onda de choque do tipo onde a bola está
        // o golpe máximo chegou a um desfecho: a câmera lenta acaba logo depois (o tempo de ver a bola no gol/na mão)
        if (
            this.maxSlow &&
            (e.type === 'goal' || e.type === 'save' || e.type === 'block' || e.type === 'post' || e.type === 'wide')
        )
            this.maxSlow.until = Math.min(this.maxSlow.until, e.tick + 10);
        const landed = e.type === 'goal' || e.type === 'save' || e.type === 'block' || e.type === 'post';
        if (landed || e.type === 'wide') this.releaseMaxFrame();
        if (this.maxImpact && landed) {
            // a chegada do golpe: explosão do nível na cor do tipo e o tranco na câmera (o N3 com a onda de choque)
            const m = this.maxImpact;
            this.maxImpact = null;
            if (e.tick - m.tick <= TICK_RATE * 3) {
                const reduce = !!this.md.reduceMotion;
                impactFx(this, this.ball.x, this.ball.y, m.type, m.level, BALL_DEPTH - 3, reduce);
                if (m.level === 3) shockwave(this, this.ball.x, this.ball.y, m.type, BALL_DEPTH - 3, !reduce);
                const [ms, k] = MAX_IMPACT_SHAKE[m.level];
                // o N2 e a bicuda no gol: a rede estufa na cor do tipo (o N3 estufa na chegada de cinema)
                if (e.type === 'goal' && m.level < 3 && (m.level === 2 || this.maxRun?.bicuda))
                    netRipple(
                        this,
                        e.team === 0 ? 1 : 0,
                        this.ball.y,
                        hexToNumber(TYPE_COLOR[m.type] ?? '#ffffff'),
                        reduce,
                    );
                // o N3 de linha: a chegada de cinema (a tremida em curva vem da câmera dele)
                if (this.n3?.flying) this.n3Land(e.type === 'goal');
                else this.cameras.main.shake(ms, k);
                if (m.level === 3 && !reduce)
                    this.cine.hitTint(hexToNumber(TYPE_COLOR[m.type] ?? '#ffffff'), 260, 0.35, BALL_DEPTH - 4);
            }
        } else if (e.type === 'wide') {
            this.maxImpact = null;
            if (this.n3?.flying) this.n3Land(false, true);
        }
        // o N1/N2 no ar chegou: a chegada do tipo (fora: só para)
        if (landed || e.type === 'wide') this.maxRunLand(landed, e.type === 'goal');
        switch (e.type) {
            case 'kickoff':
            case 'halftime':
                // saída de bola e intervalo: o motor limpa as zonas do chão (setupKickoff)
                this.endZoneViews(e.tick);
                playSample('apito');
                break;
            case 'fulltime': {
                playSample('apito');
                // fim de jogo: faixa grande; vitória dá um toque, derrota fica no sussurro
                const [a, b] = this.snaps[this.locate(e.tick).index]?.score ?? [0, 0];
                this.cine.drama(tr('battle.fulltime'), {
                    color: '#ffffff',
                    stroke: '#000000',
                    sub: `${a} x ${b}`,
                });
                const winner = a > b ? 0 : b > a ? 1 : null;
                if (winner === this.mine) this.punch('touch');
                // debaixo da faixa o time reage (empatou: os pênaltis decidem, a reação vem depois da última cobrança)
                if (!this.penalties.length) this.endReact(winner, 0);
                break;
            }
            case 'pass':
                playSfx('kick');
                this.kickPop(this.ball.x, this.ball.y + 4, 1.25, 3);
                break;
            case 'shot':
                playSfx('shot');
                this.maxCaptainHint(e.by);
                // chute: estalo maior, mais poeira e um toque na câmera quando é chute forte
                this.kickPop(this.ball.x, this.ball.y + 4, 1.45, 6);
                if (e.xg >= 0.25) this.punch('touch');
                // chute forte (ou de golpe): a bola amassa no pé, no eixo pra onde ela vai
                if (e.xg >= 0.25 || e.moveId) {
                    const a = this.ballPxAt(e.tick);
                    const b = this.ballPxAt(e.tick + 3);
                    this.squashBall(0.34, Math.atan2(b.y - a.y, b.x - a.x));
                }
                break;
            case 'save': {
                // a bicuda do goleiro capitão sai no mesmo tick como 'save': a cena é dela (o caso 'max')
                if (
                    this.matchEvents.some(
                        (x) => x.type === 'max' && x.phase === 'hit' && x.by === e.by && x.tick === e.tick,
                    )
                )
                    break;
                playSfx('save');
                // a defesa que abre o duelo da bicuda: a cena é o COUNTER! dele (startShowdown; o replay não tem a cena)
                if (
                    !this.md.replay &&
                    this.matchEvents.some((x) => x.type === 'showdown' && x.tick === e.tick && x.gk === e.by)
                )
                    break;
                // a torcida é sua: "uuuh" quando o goleiro rival pega o seu chute
                if (this.players[e.by]?.team !== this.mine) playCrowd('uuh', 0.8);
                const gk = this.players[e.by];
                if (gk) this.highlight('save', gk);
                // agarrou x espalmou: dá pra ver o que aconteceu com a bola
                // golpe máximo defendido (nunca encaixa): espalmou pra escanteio ou na trave, com faísca na luva
                const how = gk
                    ? tr(
                          e.parry === 'corner'
                              ? 'battle.parryCorner'
                              : e.parry === 'post'
                                ? 'battle.parryPost'
                                : e.caught
                                  ? 'battle.caught'
                                  : 'battle.parried',
                          { x: gk.name },
                      )
                    : undefined;
                if (e.parry) this.parrySpark(this.ball.x, this.ball.y);
                // espalmou pra escanteio: a defesa sai mais cedo e a faixa do escanteio entra depois (uma de cada vez)
                const toCorner = this.matchEvents.some(
                    (c) => c.type === 'corner' && c.tick >= e.tick && c.tick - e.tick <= CORNER_AFTER_SAVE_TICKS,
                );
                if (cinematic && gk) {
                    this.cine.drama(tr('battle.bigSave'), {
                        color: '#9be7ff',
                        stroke: '#0b2a4a',
                        at: { x: gk.sprite.x, y: gk.sprite.y },
                        sub: how,
                        short: toCorner,
                    });
                } else this.popText(e.by, tr('battle.save'), '#9be7ff');
                if (gk) this.kickPop(this.ball.x, this.ball.y + 4, e.caught ? 0.8 : 1.35, e.caught ? 0 : 5);
                this.punch('touch');
                break;
            }
            case 'tackle': {
                // desarme certo: texto na cor do time de quem roubou, estalo e poeira na bola
                if (!e.success) {
                    this.namedDribble(e);
                    break;
                }
                const color = Phaser.Display.Color.IntegerToColor(this.md.colors[this.players[e.by]?.team ?? 0]).rgba;
                this.popText(e.by, tr('battle.tackleWon'), color);
                this.kickPop(this.ball.x, this.ball.y + 4, 1.2, 4);
                playSfx('kick', 0.8);
                break;
            }
            case 'interception': {
                this.popText(e.by, tr('battle.intercept'), '#c8f7c5');
                break;
            }
            case 'goalkick': {
                this.popText(e.by, tr('battle.goalKick'), '#ffffff');
                this.battleBox.push(tr('battle.goalKick'));
                break;
            }
            case 'corner': {
                // escanteio: apito curto e a faixa com quem cobra e a jogada (sem câmera lenta)
                playSample('apito-curto');
                const taker = this.players[e.by];
                const play = dict().common.cornerPlay[e.play];
                const show = () =>
                    this.cine.setPieceBanner(
                        tr('battle.corner'),
                        tr('battle.cornerSub', { x: taker?.name ?? '?', play }),
                        this.md.colors[e.team],
                    );
                // a defesa que mandou pra escanteio ainda está na tela: a faixa espera ela sair
                const wait = this.cine.dramaTextLeft();
                if (wait > 0) this.time.delayedCall(wait, show);
                else show();
                this.battleBox.push(tr('battle.cornerLine', { x: taker?.name ?? '?', play }));
                break;
            }
            case 'aerial': {
                // disputa do escanteio: "NO ALTO!" em quem ganhou lá em cima; na rasteira, só o que ele fez
                const color = Phaser.Display.Color.IntegerToColor(this.md.colors[e.team]).rgba;
                const what = dict().battle.aerial[e.kind];
                this.popText(e.by, e.high ? `${tr('battle.aerialHigh')} ${what}` : what, color);
                if (e.high) this.punch('touch');
                break;
            }
            case 'post': {
                playSfx('post');
                // a bola achata na trave (o gol é em pé na tela: o eixo é o x) e a trave treme
                this.squashBall(0.45, 0);
                postShake(this, this.ball.x < toPx(L / 2, 0).x ? 0 : 1, this.ball.y, !!this.md.reduceMotion);
                if (this.players[e.shooter]?.team === this.mine) playCrowd('uuh');
                // a espalmada na trave já está na tela ("espalmou na trave!"): a trave só estala
                const parried = this.matchEvents.some(
                    (x) => x.type === 'save' && x.parry === 'post' && x.tick <= e.tick && e.tick - x.tick <= 10,
                );
                if (parried) {
                    this.kickPop(this.ball.x, this.ball.y, 1.4, 6);
                    this.punch('touch');
                } else if (cinematic) {
                    this.cine.drama(tr('battle.bigPost'), {
                        color: '#ffffff',
                        stroke: '#8a1c1c',
                        at: { x: this.ball.x, y: this.ball.y },
                    });
                } else this.popText(e.shooter, tr('battle.post'), '#ffffff');
                break;
            }
            case 'goal': {
                // seu gol: sobe um semitom a cada gol no jogo (o 3º soa mais alto que o 1º)
                playSfx('goal', e.team === this.mine ? 2 ** ((e.score[this.mine] - 1) / 12) : 0.9);
                playCrowd(e.team === this.mine ? 'gol' : 'vaia');
                // a caixa de batalha não disputa a tela com o GOL (nem com os nomes embaixo)
                this.battleBox.clear(this.time.now, 1500);
                const scorer = this.players[e.by];
                // grito de gol: o capitão grita junto com a torcida (se não foi ele quem marcou: esse já gritou)
                const captain = this.players.find((v) => v.team === this.mine && v.captain);
                if (e.team === this.mine && captain && captain !== scorer) {
                    const id = captain.speciesId;
                    this.time.delayedCall(450, () => playGoalCry(id, cries));
                }
                if (scorer) {
                    playCry(scorer.speciesId, cries, 1.2);
                    this.highlight(e.ownGoal ? 'owngoal' : 'goal', scorer);
                }
                // gol da Final: a partícula do tipo de quem marcou sai do corpo enquanto ele comemora
                if (scorer && !e.ownGoal && this.md.final && !this.md.reduceMotion) this.celebAura(scorer);
                const sdGoal =
                    this.showdown?.gk === e.by && e.tick >= this.showdown.kick && e.tick < this.showdown.until;
                this.punch(sdGoal && !this.md.reduceMotion ? 'boom' : this.goalLevel(e));
                if (sdGoal && scorer) this.showdownGoal(scorer, cinematic);
                // gol de golpe: explosão do tipo no gol (o golaço de Flamethrower pega fogo)
                if (this.ballType) typeBurst(this, this.ballType, this.ball.x, this.ball.y, BALL_DEPTH + 1);
                const color = Phaser.Display.Color.IntegerToColor(this.md.colors[e.team]).rgba;
                if (cinematic) {
                    this.cine.drama(e.ownGoal ? tr('battle.ownGoal') : tr('battle.goal'), {
                        color: '#ffffff',
                        stroke: color,
                        // entre a bola na rede e quem marcou (é ele que comemora)
                        at:
                            scorer && !e.ownGoal
                                ? {
                                      x: (this.ball.x + scorer.sprite.x) / 2,
                                      y: (this.ball.y + scorer.sprite.y - 16) / 2,
                                  }
                                : { x: this.ball.x, y: this.ball.y },
                        sub: scorer ? scorer.name : undefined,
                        // o gol da bicuda do duelo: o GOOOOL! fica o bastante pra ler (o BICUDA! vem depois)
                        hold: sdGoal ? SD.wordMs : undefined,
                    });
                } else this.goalBanner(color);
                break;
            }
            case 'move': {
                const view = this.players[e.by];
                if (!view) break;
                const move = MOVES[e.moveId];
                const moveType = move?.type ?? species(view.speciesId).types[0];
                const color = hexToNumber(TYPE_COLOR[moveType] ?? '#ffffff');
                playSfx('move');
                playCry(view.speciesId, cries, 0.7);
                if (cinematic) {
                    const target = e.target !== null ? this.players[e.target] : null;
                    this.cine.spotlight({
                        focus: [
                            { idx: e.by, x: view.sprite.x, y: view.sprite.y },
                            ...(target && e.target !== null
                                ? [{ idx: e.target, x: target.sprite.x, y: target.sprite.y }]
                                : []),
                        ],
                        color,
                        moveName: move?.name ?? e.moveId,
                        userName: view.name,
                        userColor: this.md.colors[view.team],
                        targetName: target?.name,
                        targetColor: target ? this.md.colors[target.team] : undefined,
                        // "no chute" só para golpes de dano usados com a bola (viram finalização)
                        withBall: e.withBall && (e.kind === 'strike' || e.kind === 'blast'),
                        dim: this.n3?.flying ? 0.2 : undefined,
                    });
                }
                // investida: o atacante dá um passo na direção do alvo
                if (e.target !== null && this.players[e.target]) {
                    const t = this.players[e.target];
                    const dx = t.sprite.x - view.sprite.x;
                    const dy = t.sprite.y - view.sprite.y;
                    const d = Math.hypot(dx, dy) || 1;
                    this.tweens.add({
                        targets: view.lunge,
                        x: (dx / d) * 12,
                        y: (dy / d) * 12,
                        duration: MOVE_LUNGE_MS,
                        yoyo: true,
                        ease: 'Quad.easeOut',
                    });
                }
                this.moveFx(e.by, e.moveId, moveType, e.target, cinematic);
                // no modo cinematográfico a faixa já mostra o nome do golpe
                if (!cinematic) this.battleBox.push(tr('battle.used', { x: view.name, m: move?.name ?? e.moveId }));
                if (e.kind === 'flavor' && e.moveId === 'splash') this.battleBox.push(tr('battle.nothing'));
                else if (e.target !== null && !e.hit) this.battleBox.push(tr('battle.missed', { x: view.name }));
                else if (e.effectiveness !== null && e.effectiveness >= 1.12) {
                    this.battleBox.push(tr('battle.superEffective'));
                    if (e.target !== null) this.popText(e.target, tr('battle.superPop'), '#ffd447');
                    this.punch('touch');
                } else if (e.effectiveness !== null && e.effectiveness < 1)
                    this.battleBox.push(tr('battle.notVeryEffective'));
                break;
            }
            case 'status': {
                playSfx('status');
                const view = this.players[e.target];
                if (view) {
                    this.battleBox.push(
                        `${view.name} ${(dict().battle.status as Record<string, string>)[e.status] ?? '!'}`,
                    );
                    // o N1 do golpe máximo pegou quem bloqueou ou defendeu: a rajada do tipo de quem chutou nele
                    if (e.source === 'max' && !silent)
                        this.fx.burst(
                            this.maxSlow?.type ?? WORD_TYPE[e.status] ?? 'Normal',
                            view.sprite.x,
                            view.sprite.y - 14,
                            14,
                            REACT_DEPTH,
                        );
                    // N1 do golpe máximo (areia, teia, alto, mão dormente, preso, barra): a partícula do tipo
                    if (N1_FX_WORDS.has(e.status)) this.impact(view.sprite.x, view.sprite.y - 16, WORD_TYPE[e.status]);
                    else if (e.status !== 'flinch' && e.status !== 'seed') {
                        this.applyIndicators(view, STATUS_KIND_TO_CODE[e.status] ?? 0, view.flags);
                    }
                }
                break;
            }
            case 'knockback': {
                const view = this.players[e.target];
                const type = MOVES[e.moveId]?.type ?? 'Normal';
                if (!view) break;
                this.impact(view.sprite.x, view.sprite.y - 16, type);
                // a onda do N2 (e da bicuda N2) derrubando a linha: a rajada e o choque do tipo em quem cai
                const r = this.maxRun;
                if (r && r.by === e.by && !r.landed && !silent) {
                    const reduce = !!this.md.reduceMotion;
                    const c = hexToNumber(TYPE_COLOR[r.type] ?? '#ffffff');
                    this.fx.burst(r.type, view.sprite.x, view.sprite.y - 14, 18, REACT_DEPTH);
                    cineShock(this, view.sprite.x, view.sprite.y, c, 0.6, FOCUS_DEPTH - 45, reduce);
                    chroma(this, [view.sprite], 3, 200, reduce);
                }
                break;
            }
            case 'transform': {
                const view = this.players[e.by];
                if (!view) break;
                const into = species(e.into).name;
                const sp = view.sprite;
                const cam = this.cameras.main;
                playSfx('status');
                // Transformar, como nos jogos mas em versão "uau": zoom no Ditto, ele amassa e estica como gelatina,
                // pisca em branco acelerando e explode num anel roxo já como a cópia. A partida segura enquanto isso.
                // Os atrasos também deixam as posições do tick 0 serem aplicadas antes de a câmera mirar nele.
                const wobble = cinematic ? 640 : 0;
                if (cinematic) {
                    this.holdReal = Math.max(this.holdReal, this.time.now + 1900);
                    this.time.delayedCall(30, () => {
                        cam.pan(sp.x, sp.y - 14, 300, 'Sine.easeOut', true);
                        cam.zoomTo(1.5, 300, 'Sine.easeOut', true);
                    });
                    const squash = (x: number, y: number, at: number, ms: number) =>
                        this.time.delayedCall(at, () =>
                            this.tweens.add({
                                targets: sp,
                                scaleX: this.ssNow * x,
                                scaleY: this.ssNow * y,
                                duration: ms,
                                yoyo: true,
                                ease: 'Sine.easeInOut',
                            }),
                        );
                    squash(1.3, 0.72, 40, 150);
                    squash(0.78, 1.28, 340, 140);
                }
                const blinks = [150, 120, 100, 85, 70, 60, 50, 50];
                let at = wobble;
                blinks.forEach((ms, i) => {
                    at += ms;
                    this.time.delayedCall(at, () => {
                        if (i % 2 === 0) sp.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
                        else sp.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
                    });
                });
                this.time.delayedCall(at + 60, () => {
                    sp.setTintMode(Phaser.TintModes.MULTIPLY);
                    this.becomeCopy(e.by, e.into, e.target);
                    this.refreshTint(view);
                    playCry(e.into, cries, 0.8);
                    this.impact(sp.x, sp.y - 16, 'Psychic');
                    sp.setScale(this.ssNow * 0.2);
                    this.tweens.add({ targets: sp, scale: this.ssNow, duration: 420, ease: 'Back.easeOut' });
                    this.battleBox.push(tr('battle.transformed', { x: view.name, y: into }));
                    if (!cinematic) {
                        this.popText(e.by, `→ ${into}`, '#d9a7ff');
                        return;
                    }
                    // explosão: anel roxo duplo, clarão e faíscas de pixel saindo do Ditto
                    const cx = sp.x;
                    const cy = sp.y - 16;
                    const flash = this.add.circle(cx, cy, 26, 0xf3e6ff, 0.9).setDepth(FOCUS_DEPTH + 79);
                    this.tweens.add({
                        targets: flash,
                        scale: 2.2,
                        alpha: 0,
                        duration: 260,
                        onComplete: () => flash.destroy(),
                    });
                    for (const [delay, width] of [
                        [0, 6],
                        [90, 3],
                    ]) {
                        const ring = this.add
                            .circle(cx, cy, 14)
                            .setStrokeStyle(width, 0xb07cff, 1)
                            .setDepth(FOCUS_DEPTH + 80);
                        this.tweens.add({
                            targets: ring,
                            scale: 5,
                            alpha: 0,
                            delay,
                            duration: 560,
                            ease: 'Cubic.easeOut',
                            onComplete: () => ring.destroy(),
                        });
                    }
                    for (let k = 0; k < 14; k++) {
                        const ang = (k / 14) * Math.PI * 2;
                        const bit = this.add
                            .rectangle(cx, cy, 4, 4, k % 3 === 0 ? 0xffffff : 0xc89bff)
                            .setDepth(FOCUS_DEPTH + 81);
                        this.tweens.add({
                            targets: bit,
                            x: cx + Math.cos(ang) * 70,
                            y: cy + Math.sin(ang) * 46,
                            alpha: 0,
                            duration: 520,
                            ease: 'Quad.easeOut',
                            onComplete: () => bit.destroy(),
                        });
                    }
                    this.punch('hit');
                    this.cine.drama(tr('battle.transformBig'), {
                        color: '#d9a7ff',
                        stroke: '#2a0b4a',
                        at: { x: sp.x, y: sp.y },
                        sub: tr('battle.became', { x: view.name, y: into }),
                    });
                });
                break;
            }
            case 'combo': {
                const link = LINKS.find((l) => l.id === e.link);
                const a = this.players[e.partner];
                const b = this.players[e.by];
                playSfx('move');
                if (b) playCry(b.speciesId, cries, 0.8);
                this.popText(e.partner, tr('battle.comboPop'), '#ffd447');
                this.popText(e.by, tr('battle.comboPop'), '#ffd447');
                if (link && a && b) {
                    const text = linkText(link.id);
                    const names = { link: text.name, a: a.name, b: b.name };
                    this.battleBox.push(tr('battle.combo', names));
                    if (cinematic) {
                        this.cine.drama(text.combo.toUpperCase(), {
                            color: '#ffd447',
                            stroke: '#4a2a00',
                            at: { x: b.sprite.x, y: b.sprite.y },
                            sub: tr('battle.comboSub', names),
                        });
                    }
                }
                break;
            }
            case 'trait': {
                const view = this.players[e.by];
                const tv = TRAIT_VIEW[e.fx];
                const moveName = MOVES[e.moveId]?.name ?? e.moveId;
                // o texto sobe de quem sofreu (fugiu, curado) ou de quem usou
                const popAt = (e.fx === 'flee' || e.fx === 'teamHeal') && e.target !== null ? e.target : e.by;
                if (tv) this.popText(popAt, tv.pop(e.n ?? 0), tv.color);
                if (tv?.line && view) this.battleBox.push(tv.line(view.name, moveName, e.n ?? 0));
                const type = MOVES[e.moveId]?.type ?? 'Normal';
                const color = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
                if (e.fx === 'area' && e.x !== undefined && e.y !== undefined && e.r) {
                    // onda do golpe em área: anel que abre até o raio
                    const c = toPx(e.x, e.y);
                    const ring = this.add
                        .circle(c.x, c.y, 8)
                        .setStrokeStyle(4, color, 0.9)
                        .setDepth(c.y + 1);
                    this.tweens.add({
                        targets: ring,
                        scale: (e.r * PPM) / 8,
                        alpha: 0,
                        duration: 420,
                        ease: 'Cubic.easeOut',
                        onComplete: () => ring.destroy(),
                    });
                }
                if ((e.fx === 'zone' || e.fx === 'wall') && e.x !== undefined && e.y !== undefined && e.r && e.dur) {
                    this.addZoneView(e.tick, e.dur, e.x, e.y, e.r, e.fx === 'wall' ? 'wall' : e.moveId);
                }
                if (e.fx === 'wallBlock' && e.x !== undefined && e.y !== undefined) {
                    // o motor só gasta o muro que segurou o chute: fumaça, fogo e outros muros continuam
                    const { x, y } = e;
                    this.endZoneViews(
                        e.tick,
                        (z) => z.kind === 'wall' && Math.abs(z.x - x) < 0.02 && Math.abs(z.y - y) < 0.02,
                    );
                }
                if ((e.fx === 'fly' || e.fx === 'dig' || e.fx === 'land' || e.fx === 'bide') && view) {
                    this.impact(view.sprite.x, view.sprite.y - 8, type);
                }
                if (e.fx === 'crit' || e.fx === 'wallBlock' || e.fx === 'bide') this.punch('touch');
                break;
            }
            case 'decoy': {
                this.popText(e.by, tr('battle.substitutePop'), '#ffd9a0');
                this.battleBox.push(tr('battle.decoy', { x: this.players[e.by]?.name ?? '?' }));
                break;
            }
            case 'haze': {
                for (const i of e.cleared) this.popText(i, tr('battle.cleared'), '#d8e8ff');
                this.battleBox.push(tr('battle.haze'));
                break;
            }
            case 'teleport': {
                const view = this.players[e.by];
                if (view) {
                    this.impact(view.sprite.x, view.sprite.y - 16, 'Psychic');
                    this.battleBox.push(tr('battle.teleport', { x: view.name }));
                }
                break;
            }
            case 'ability': {
                const view = this.players[e.by];
                // nome da habilidade subindo em amarelo (como o item, em verde): dá pra ver o efeito disparar
                this.popText(e.by, ABILITIES[e.ability]?.name ?? '★', '#ffd447');
                if (view)
                    this.battleBox.push(tr(e.blocked ? 'battle.abilityBlock' : 'battle.ability', { x: view.name }));
                break;
            }
            case 'item': {
                const view = this.players[e.by];
                const item = ITEMS[e.item]?.name ?? e.item;
                this.popText(e.by, item, '#7dff8a');
                if (view) {
                    this.battleBox.push(
                        e.effect === 'crit'
                            ? tr('battle.itemCrit', { x: view.name })
                            : tr('battle.item', { item, x: view.name }),
                    );
                }
                break;
            }
            case 'tactic': {
                playSample('apito-curto', 0.7);
                // troca de tática: faixa no canto do time com o capitão (ou quem estiver em quadra) e a tática nova
                const face =
                    this.players.find((v) => v.team === e.team && v.captain) ??
                    this.players.find((v) => v.team === e.team);
                if (face) {
                    const h: MatchHighlight = {
                        kind: 'tactic',
                        team: e.team,
                        speciesId: face.speciesId,
                        shiny: face.shiny,
                        name: dict().common.tactic[e.tactic],
                    };
                    EventBus.emit('match:highlight', h);
                }
                break;
            }
            case 'timeout': {
                playSample('apito-curto');
                const face =
                    this.players.find((v) => v.team === e.team && v.captain) ??
                    this.players.find((v) => v.team === e.team);
                if (face)
                    EventBus.emit('match:highlight', {
                        kind: 'timeout',
                        team: e.team,
                        speciesId: face.speciesId,
                        shiny: face.shiny,
                        name: dict().match.agency.timeoutPanel.title,
                    } satisfies MatchHighlight);
                break;
            }
            case 'flyGk': {
                const gk = this.players[e.by];
                if (!gk) break;
                this.popText(e.by, dict().match.agency.flyGk.toUpperCase(), e.on ? '#ffd447' : '#a6aed6');
                if (e.on) this.highlight('flyGk', gk);
                break;
            }
            case 'max': {
                const cap = this.players[e.by];
                if (!cap) break;
                const a = dict().match.agency;
                // motor 17: o golpe máximo do goleiro capitão é a bicuda (devolve o chute do rival)
                const bicuda = this.md.result.roster[e.by]?.role === 'GK';
                if (e.phase === 'miss') {
                    // a bicuda com o toque fora: a defesa de sempre, a barra se foi
                    this.popText(e.by, a.maxMissShort, '#a6aed6');
                    break;
                }
                if (e.phase !== 'hit') break;
                const n3 = e.level === 3;
                // golpe máximo por tipo: a faixa grande leva o nome do efeito, na cor do tipo
                const fx = this.matchEvents.find(
                    (x) => x.type === 'maxFx' && x.step === 'shot' && x.tick === e.tick && x.by === e.by,
                );
                const fxType = fx?.type === 'maxFx' ? fx.fx : null;
                // o tipo das partículas, do projétil e da explosão: o do efeito (N3) ou o do golpe dele, senão o do capitão
                // (N1/N2: o tipo do golpe máximo dele, `maxFxType`, o mesmo do efeito do N1 em quem bloqueia ou defende)
                const shotType = fxType
                    ? fxTypeOf(fxType)
                    : maxFxType(e.moveId ? [e.moveId] : [], cap.speciesId, species(cap.speciesId).types);
                const level = (e.level ?? 1) as 1 | 2 | 3;
                // chute no gol (a bicuda N1/N2 de sempre é um lançamento): a câmera segura o gol e a chegada explode
                const isShot = this.matchEvents.some((x) => x.type === 'shot' && x.by === e.by && x.tick === e.tick);
                if (isShot) this.maxImpact = { tick: e.tick, type: shotType, level };
                // o fim do duelo da bicuda: a cutscene já foi a cena do especial, aqui é só o chute
                if (bicuda && this.showdown?.kick === e.tick) {
                    this.showdownKick(cap, e.tick);
                    break;
                }
                // o counter: a bicuda que devolve o golpe máximo do rival (Miguel, 01/11/2026)
                const saved = this.matchEvents.find((x) => x.type === 'save' && x.by === e.by && x.tick === e.tick);
                const counter =
                    bicuda &&
                    saved?.type === 'save' &&
                    this.matchEvents.some(
                        (x) =>
                            x.type === 'max' &&
                            x.phase === 'hit' &&
                            x.by === saved.shooter &&
                            x.tick <= e.tick &&
                            e.tick - x.tick <= TICK_RATE * 3,
                    );
                if (n3) {
                    // o N3 (de linha e a bicuda N3 no chute comum): a cena de cinema e a história do tipo (lineSuper)
                    if (counter && !cinematic) this.popText(e.by, tr('battle.counter'), '#7dffb0', -26, 1500);
                    this.lineSuper(cap, e.moveId ?? null, fxType, e.tick, e.q ?? 0, bicuda);
                } else
                    this.maxShow(cap, e.tick, level as 1 | 2, shotType, {
                        bicuda,
                        counter,
                        isShot,
                        q: e.q ?? 0,
                        moveId: e.moveId ?? null,
                    });
                // a bola voa em câmera lenta até o desfecho, com o rastro na cor do golpe (a curva aparece nele); a
                // bicuda N1/N2 é um lançamento: a câmera lenta dura só a saída
                this.maxSlow = {
                    until: e.tick + (bicuda && !n3 && !isShot ? MAX_BICUDA_SLOW_TICKS : TICK_RATE * 3),
                    // o counter N1/N2 cruza a quadra inteira: na câmera lenta do chute de perto levava ~4,5 s
                    factor: n3 ? MAX_SHOT_SLOW.n3 : bicuda && isShot ? MAX_SHOT_SLOW.counter : MAX_SHOT_SLOW.other,
                    level,
                    type: shotType,
                    // a cor do tipo em todo nível (o rastro e o projétil; o N1 era dourado)
                    color: hexToNumber(TYPE_COLOR[shotType] ?? '#ffd447'),
                };
                break;
            }
            case 'maxFx': {
                const by = this.players[e.by];
                if (!by) break;
                const name = dict().match.agency.maxFx[e.fx] ?? [e.fx, '!'];
                const type = fxTypeOf(e.fx);
                const color = TYPE_COLOR[type] ?? '#ffd447';
                // assinatura (fase 2): receita própria `sig:<efeito>` em vez da receita do tipo
                const sig = MAX_FX_RECIPE[e.fx] ? null : `sig:${e.fx}`;
                const cast = (moveId: string) =>
                    castMove({
                        scene: this,
                        user: by.sprite,
                        target:
                            e.target !== null && e.target !== e.by ? (this.players[e.target]?.sprite ?? null) : null,
                        moveId,
                        moveType: type,
                        kind: 'blast',
                        strong: true,
                        depth: FOCUS_DEPTH + 70,
                        baseScale: this.ssNow,
                    });
                if (e.step === 'shot') {
                    // a animação do tipo (receita de um golpe do tipo, de quem chutou até o goleiro) e o estouro na bola;
                    // no N3 de linha, no chute (o fim da cena), junto com a bola saindo
                    const wait = this.n3 && !this.n3.flying ? this.n3SceneUntil - this.time.now : 0;
                    const go = () => {
                        cast(sig ?? MAX_FX_RECIPE[e.fx]);
                        if (e.fx !== 'rest') typeBurst(this, type, this.ball.x, this.ball.y, BALL_DEPTH + 1);
                        // (o N3 de linha treme na câmera de cinema, em curva)
                        if (!this.n3 && (e.fx === 'Ground' || e.fx === 'hyperbeam' || e.fx === 'bodyslam'))
                            this.cameras.main.shake(260, 0.008);
                    };
                    if (wait > 0) this.time.delayedCall(wait, go);
                    else go();
                    // o nome do efeito vai na faixa do especial (lineSuper); o Snorlax no gol não tem o 'hit' do chute
                    // máximo: a faixa grande dele sai aqui
                    if (cinematic && e.fx === 'rest')
                        this.cine.drama(`${name[0].toUpperCase()}!`, {
                            color,
                            stroke: '#1a1030',
                            at: { x: by.sprite.x, y: by.sprite.y },
                            sub: by.name,
                            top: true,
                        });
                } else if (e.fx === 'metronome' || e.fx === 'transform') {
                    // Mew sorteia, Ditto copia: o dedo balançando / o espelho antes do efeito que saiu
                    cast(`sig:${e.fx}`);
                    this.popText(e.by, name[1], color, 22);
                } else if (e.target !== null && this.players[e.target]) {
                    // Normal e Terrestre derrubam (a reação diz DERRUBADO); Fogo e Elétrico já vêm no evento de status
                    if (!['Normal', 'Ground', 'Fire', 'Electric'].includes(e.fx))
                        this.popText(e.target, name[1], color);
                    const t = this.players[e.target];
                    this.impact(t.sprite.x, t.sprite.y - 16, e.fx);
                }
                break;
            }
            case 'penalty': {
                playSfx(e.scored ? 'goal' : 'save');
                // pênalti: comemora o seu e a defesa do seu goleiro, vaia o do rival, "uuuh" no seu perdido
                const mine = this.players[e.by]?.team === this.mine;
                playCrowd(e.scored ? (mine ? 'gol' : 'vaia') : mine ? 'uuh' : 'gol', 0.7);
                // a cobrança que decide a disputa pesa: explosão se você ganha, toque se perde
                const last = this.penalties.at(-1);
                if (last && last.tick === e.tick && last.by === e.by) {
                    this.punch(this.md.result.winner === 0 ? 'boom' : 'touch');
                    // quem bateu e o goleiro reagem primeiro; depois o time todo (fim de jogo com cara)
                    this.endReact(this.md.result.winner, END_AFTER_SHOOTOUT_MS);
                }
                if (this.shootoutOn) {
                    const mid = FUTSAL_5.pitch.width / 2;
                    const shooter = this.viewPos.get(e.by) ?? { x: 33.4, y: mid };
                    const keeper = this.viewPos.get(e.gk) ?? { x: 39.3, y: mid };
                    this.placeView(e.by, shooter.x, shooter.y, e.scored ? 0 : 2, e.scored ? 'Hop' : 'Hurt');
                    this.placeView(e.gk, keeper.x, keeper.y, 6, e.scored ? 'Hurt' : 'Hop');
                    if (e.scored) playCry(this.players[e.by]?.speciesId ?? 1, cries, 1);
                }
                if (cinematic) {
                    this.cine.drama(e.scored ? tr('battle.penGoal') : tr('battle.penSaved'), {
                        color: e.scored ? '#ffffff' : '#9be7ff',
                        stroke: '#000000',
                        sub: tr('battle.penScore', { a: e.shootout[0], b: e.shootout[1] }),
                    });
                }
                break;
            }
        }
    }

    /** Substituição andando: a partida para enquanto quem sai vai até a lateral e quem entra vem de lá. */
    private walkSub(view: PlayerView, outSpecies: number, at: { x: number; y: number }, fly = false) {
        const top = toPx(0, 0).y;
        const bench = { x: GAME_W / 2 + (view.team === 0 ? -70 : 70), y: top - 14 };
        const now = this.time.now;
        const outMs = 1100;
        const inMs = 1300;
        if (!fly) this.holdReal = Math.max(this.holdReal, now + outMs + inMs - 200);
        // fantasma de quem sai, andando até a lateral
        const walk = resolveAnim(outSpecies, 'Walk');
        const facing = dir8({ x: bench.x - at.x, y: bench.y - at.y }, 4);
        const ghost = this.add
            .sprite(at.x, at.y, atlasKey(outSpecies))
            .setScale(this.ssNow)
            .setDepth(at.y)
            .setOrigin(0.5, footOrigin(outSpecies, walk));
        ghost.play(`${outSpecies}/${walk}/${facing}`);
        this.tweens.add({
            targets: ghost,
            x: bench.x,
            y: bench.y,
            duration: outMs,
            ease: 'Sine.easeInOut',
            onUpdate: () => ghost.setDepth(ghost.y),
            onComplete: () =>
                this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() }),
        });
        if (!fly) view.enter = { from: bench, start: now + outMs - 200, dur: inMs };
    }

    /**
     * "X está evoluindo!": a partida para e a tela React mostra a evolução grande no meio da tela
     * (src/ui/components/EvolutionOverlay.tsx). Quando ela termina ('match:evolution-done'), o sprite troca.
     * Duas evoluções na mesma bola parada entram em fila.
     */
    private evolveAnimation(view: PlayerView, from: number, into: number, newName: string) {
        view.evolving = true;
        this.evoQueue.push({ view, from, into, newName });
        if (this.evoQueue.length === 1) this.showNextEvolution();
    }

    private showNextEvolution() {
        const next = this.evoQueue[0];
        if (!next) {
            this.holdReal = 0;
            return;
        }
        this.holdReal = Number.POSITIVE_INFINITY;
        const evo: MatchEvolution = {
            team: next.view.team,
            from: next.from,
            into: next.into,
            name: next.view.name,
            newName: next.newName,
            shiny: next.view.shiny,
        };
        this.battleBox.push(tr('battle.evolving', { x: next.view.name }));
        EventBus.emit('match:evolution', evo);
        // segurança: se a tela não responder, a partida segue sozinha
        this.evoTimer?.remove();
        this.evoTimer = this.time.delayedCall(20000, () => this.onEvolutionDone());
    }

    /** Troca para a forma nova na quadra: cresce, volta ao tamanho e solta o impacto do tipo. */
    private evolveOnField(view: PlayerView, into: number, newName: string) {
        const oldName = view.name;
        this.finishEvolution(view, into, newName);
        view.sprite.setScale(this.ssNow * 1.3);
        this.tweens.add({ targets: view.sprite, scale: this.ssNow, duration: 420, ease: 'Back.easeOut' });
        this.impact(view.sprite.x, view.sprite.y - 16, species(into).types[0]);
        this.battleBox.push(
            tr(view.team !== this.mine ? 'battle.evolvedRival' : 'battle.evolved', {
                x: oldName,
                y: species(into).name,
            }),
        );
    }

    /**
     * Evolução do rival: diferente da sua de propósito. Sem tela cheia: a quadra segura um instante (no duelo, o
     * tempo da tela cheia do outro lado), o Pokémon pisca em silhueta branca acelerando com um brilho na cor do time
     * dele e, na troca, sobe a faixa "RIVAL EVOLUIU!" no canto do rival. Reduzir movimento: troca direto, sem piscar.
     */
    private rivalEvolution(view: PlayerView, from: number, into: number, newName: string, ready: boolean) {
        const oldName = view.name;
        const hold = this.md.duel ? DUEL_EVO_HOLD_MS : RIVAL_EVO_MS;
        this.holdReal = Math.max(this.holdReal, this.time.now + hold);
        const reveal = () => {
            if (ready && !this.md.reduceMotion) this.evolveOnField(view, into, newName);
            else {
                this.finishEvolution(view, into, newName);
                const key = view.team !== this.mine ? 'battle.evolvedRival' : 'battle.evolved';
                this.battleBox.push(tr(key, { x: oldName, y: species(into).name }));
            }
            playCry(into, this.md.cries, 1);
            const h: MatchHighlight = {
                kind: 'rivalEvolve',
                team: view.team,
                speciesId: into,
                shiny: view.shiny,
                name: newName,
                outSpeciesId: from,
                outName: oldName,
            };
            EventBus.emit('match:highlight', h);
        };
        if (!ready || this.md.reduceMotion) {
            reveal();
            return;
        }
        playSfx('status');
        this.battleBox.push(tr(view.team !== this.mine ? 'battle.evolvingRival' : 'battle.evolving', { x: oldName }));
        view.evolving = true;
        // a forma nova aparece com a quadra ainda parada (e a câmera perto): no duelo ~2,6 s antes de ela voltar
        const morph = hold - (this.md.duel ? 2600 : 900);
        const sp = view.sprite;
        // câmera chega perto de quem está evoluindo (reduzir movimento já deixa a câmera parada) e volta depois
        if (this.md.cinematic) {
            const cam = this.cameras.main;
            this.time.delayedCall(30, () => {
                cam.pan(sp.x, sp.y - 14, 350, 'Sine.easeOut', true);
                cam.zoomTo(1.6, 350, 'Sine.easeOut', true);
            });
            this.time.delayedCall(hold, () => {
                cam.pan(GAME_W / 2, GAME_H / 2, 450, 'Sine.easeInOut', true);
                cam.zoomTo(1, 450, 'Sine.easeInOut', true);
            });
        }
        const glow = this.add
            .circle(sp.x, sp.y - 14, 22, this.md.colors[view.team], 0.55)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(sp.depth - 0.1);
        this.tweens.add({
            targets: glow,
            scale: 1.6,
            alpha: 0.2,
            duration: 380,
            yoyo: true,
            repeat: -1,
            onUpdate: () => glow.setPosition(sp.x, sp.y - 14).setDepth(sp.depth - 0.1),
        });
        let at = 0;
        blinkSchedule(morph).forEach((dt, i) => {
            at += dt;
            this.time.delayedCall(at, () => {
                if (i % 2 === 0) sp.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
                else sp.setTintMode(Phaser.TintModes.MULTIPLY).clearTint();
            });
        });
        this.time.delayedCall(morph, () => {
            this.tweens.killTweensOf(glow);
            glow.destroy();
            sp.setTintMode(Phaser.TintModes.MULTIPLY);
            reveal();
        });
    }

    private onEvolutionDone() {
        const done = this.evoQueue.shift();
        this.evoTimer?.remove();
        this.evoTimer = undefined;
        if (done) this.evolveOnField(done.view, done.into, done.newName);
        this.showNextEvolution();
    }

    private finishEvolution(view: PlayerView, into: number, newName: string) {
        view.evolving = false;
        const captain = view.captain;
        this.swapSpecies(view, into, newName, view.shiny);
        view.captain = captain;
        if (captain) view.label.setText(`C·${newName}`).setColor('#ffd447');
        this.refreshTint(view);
    }

    private highlight(kind: MatchHighlight['kind'], view: PlayerView) {
        const h: MatchHighlight = {
            kind,
            team: view.team,
            speciesId: view.speciesId,
            shiny: view.shiny,
            name: view.name,
        };
        EventBus.emit('match:highlight', h);
    }

    private zoneViews: ZoneView[] = [];

    /** Desenha a zona no chão; `kind` = 'wall' ou o golpe (smokescreen, firespin). */
    private addZoneView(tick: number, dur: number, x: number, y: number, r: number, kind: string) {
        const c = toPx(x, y);
        let obj: Phaser.GameObjects.Shape;
        if (kind === 'wall') {
            obj = this.add.rectangle(c.x, c.y, 6, r * 2 * PPM, 0xc8f0ff, 0.45).setStrokeStyle(2, 0xffffff, 0.8);
        } else if (kind === 'firespin') {
            obj = this.add.circle(c.x, c.y, r * PPM, 0xff6a2a, 0.22).setStrokeStyle(4, 0xffb05c, 0.9);
        } else {
            obj = this.add.circle(c.x, c.y, r * PPM, 0x9a9a9a, 0.38);
        }
        obj.setDepth(c.y - 40);
        this.zoneViews.push({ from: tick, to: tick + dur * TICK_RATE, obj, kind, x, y });
    }

    /** Encerra no `tick` as zonas desenhadas que já estavam no chão (todas, ou só as que `match` escolher). */
    private endZoneViews(tick: number, match: (z: ZoneView) => boolean = () => true) {
        for (const z of this.zoneViews) if (z.from <= tick && z.to > tick && match(z)) z.to = tick;
    }

    /** Zonas só aparecem no intervalo de tempo delas (funciona também voltando o replay). */
    private updateZoneViews() {
        if (!this.zoneViews.length) return;
        for (const z of this.zoneViews) z.obj.setVisible(this.playTick >= z.from && this.playTick < z.to);
        const done = this.zoneViews.filter((z) => z.to < this.playTick - TICK_RATE * 60);
        for (const z of done) z.obj.destroy();
        if (done.length) this.zoneViews = this.zoneViews.filter((z) => !done.includes(z));
    }

    /** Texto que sobe do jogador; `dy` põe mais alto (um segundo texto no mesmo lance) e entra com um pulo de 250 ms. */
    private popText(idx: number, text: string, color: string, dy = 0, ms = 1100) {
        const view = this.players[idx];
        if (!view) return;
        const s = Math.min(this.uiScale, 2);
        const t = this.add
            .text(view.sprite.x, view.sprite.y - 52 - dy * s, text, {
                fontFamily: 'Galmuri11, monospace',
                fontSize: `${Math.round(14 * s)}px`,
                fontStyle: 'bold',
                color,
                stroke: '#000000',
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(9000)
            .setResolution(2);
        // não corta na beira da quadra (o texto do nível é mais comprido)
        const v = this.cameras.main.worldView;
        const half = t.displayWidth / 2 + 4;
        if (v.width > 2 * half) t.x = Phaser.Math.Clamp(t.x, v.x + half, v.right - half);
        if (dy) {
            t.setScale(0.6);
            this.tweens.add({ targets: t, scale: 1, duration: 250, ease: 'Back.easeOut' });
        }
        this.tweens.add({
            targets: t,
            y: t.y - 22,
            alpha: 0,
            duration: ms,
            ease: ms > 1100 ? 'Quart.easeIn' : 'Cubic.easeOut',
            onComplete: () => t.destroy(),
        });
    }

    private impact(x: number, y: number, type: string) {
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
        const ring = this.add
            .circle(x, y, 10)
            .setStrokeStyle(4, color, 1)
            .setDepth(FOCUS_DEPTH + 80);
        this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
        this.punch('touch');
    }

    /**
     * Condução (só no desenho; no motor a bola fica a 0,45 m do pé): quanto mais rápido, mais longe a bola vai
     * entre os toques; quanto mais drible, toques mais curtos e frequentes (EA FC, Football Manager). A bola sai
     * do pé, rola à frente desacelerando e o pé alcança (curva sin(π·φ^0,6), sem ir e voltar como serra).
     * Marcador perto: toques curtos, bola protegida. Parado: no pé. Devolve o múltiplo dos 0,45 m do motor.
     */
    /** Está no gol agora? A mudança de prancheta (evento `lineup`) pode trocar o goleiro; a vaga 0 é sempre o gol. */
    /** O goleiro do time num tick (a escalação pode ter trocado). */
    private keeperAt(team: 0 | 1, tick: number): number {
        const r = this.md.result;
        let gk = r.roster.findIndex((p) => p.team === team && p.role === 'GK');
        for (const e of r.events) {
            if (e.tick > tick) break;
            if (e.type === 'lineup' && e.team === team) gk = e.idx[0];
        }
        return gk;
    }

    private isKeeper(idx: number): boolean {
        const r = this.md.result;
        let gk = r.roster[idx]?.role === 'GK';
        for (const e of r.events) {
            if (e.tick > this.playTick) break;
            if (e.type === 'lineup' && e.team === r.roster[idx]?.team) gk = e.idx[0] === idx;
        }
        return gk;
    }

    private touchReach(carrier: number, a: MatchSnapshot, b: MatchSnapshot, travelPx: number): number {
        const view = this.players[carrier];
        const o = carrier * SNAP_STRIDE;
        const speed = Math.hypot(b.p[o] - a.p[o], b.p[o + 1] - a.p[o + 1]) / (Math.max(1, b.tick - a.tick) / TICK_RATE);
        const u = Phaser.Math.Clamp(speed / 6, 0, 1);
        if (u < 0.15) return 0.35 / 0.45;
        let dr = this.dribbleSkill.get(view.speciesId);
        if (dr === undefined) {
            dr = Phaser.Math.Clamp(computeAttributes(species(view.speciesId), 50).dribble / 99, 0, 1);
            this.dribbleSkill.set(view.speciesId, dr);
        }
        const k = 1.3 - 0.6 * dr;
        // marcador a menos de 2 m: toque curto e bola colada
        let near = 99;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].team === view.team) continue;
            const q = i * SNAP_STRIDE;
            near = Math.min(near, Math.hypot(b.p[q] - b.p[o], b.p[q + 1] - b.p[o + 1]));
        }
        const press = Phaser.Math.Clamp((2 - near) / 1.5, 0, 1);
        const D = (0.8 + 1.8 * u * u) * k * (1 - 0.4 * press);
        const L = (0.12 + 0.9 * u * u * k) * (1 - 0.7 * press);
        const phi = (travelPx / PPM / D) % 1;
        return (0.35 + L * Math.sin(Math.PI * phi ** 0.6)) / 0.45;
    }

    /** Espalmada do golpe máximo: estrela branca e faíscas saindo da luva (o toque de ponta de dedo). */
    private parrySpark(x: number, y: number) {
        const reduce = !!this.md.reduceMotion;
        const star = this.add.star(x, y, 4, 3, 14, 0xffffff, 1).setDepth(BALL_DEPTH + 1);
        this.tweens.add({
            targets: star,
            scale: reduce ? 1 : 2.2,
            angle: reduce ? 0 : 45,
            alpha: 0,
            duration: 300,
            onComplete: () => star.destroy(),
        });
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const bit = this.add.rectangle(x, y, 3, 3, i % 2 ? 0x9be7ff : 0xffffff).setDepth(BALL_DEPTH + 1);
            this.tweens.add({
                targets: bit,
                x: x + Math.cos(a) * 26,
                y: y + Math.sin(a) * 18,
                alpha: 0,
                duration: 280,
                ease: 'Quad.easeOut',
                onComplete: () => bit.destroy(),
            });
        }
    }

    /** Quanto a bola está amassada agora (`ballSquashAt` × força; 0 = redonda). */
    private ballSquashNow() {
        const q = this.ballSquash;
        return q.amp ? q.amp * ballSquashAt(this.time.now - q.at) : 0;
    }

    /** A bola amassa no impacto (`amp`), no eixo `angle` (rad, tela). Reduzir movimento: nada. */
    private squashBall(amp: number, angle: number) {
        if (this.md.reduceMotion) return;
        this.ballSquash.at = this.time.now;
        this.ballSquash.amp = amp;
        this.ballSquash.angle = angle;
    }

    /** Contato com a bola: ela "estala" (cresce e volta) e levanta poeira no chão. */
    private kickPop(x: number, y: number, scale: number, dust: number) {
        this.tweens.killTweensOf(this.ballPop);
        this.ballPop.v = scale;
        this.tweens.add({ targets: this.ballPop, v: 1, duration: 160, ease: 'Quad.easeOut' });
        for (let i = 0; i < dust; i++) {
            const ang = (i / dust) * Math.PI * 2 + Math.random() * 0.6;
            const puff = this.add.circle(x, y, 1.5 + Math.random() * 1.5, 0xe8d8b8, 0.7).setDepth(y - 2);
            this.tweens.add({
                targets: puff,
                x: x + Math.cos(ang) * (8 + Math.random() * 6),
                y: y + Math.sin(ang) * 3.5,
                alpha: 0,
                scale: 1.8,
                duration: 260 + Math.random() * 120,
                ease: 'Quad.easeOut',
                onComplete: () => puff.destroy(),
            });
        }
    }

    private readonly reactCtx = {
        moveType: (id: string) => MOVES[id]?.type,
        hurtSeconds: (target: number, tick: number) => hurtSecondsAt(this.snaps, target, tick),
    };

    private readonly spritePos = (i: number) => this.players[i]?.sprite;

    /** As reações de todos os eventos do tick (golpe de área: a palavra sai uma vez só, `showsWord`). */
    private reactionsAt(tick: number): Reaction[] {
        const ev = this.matchEvents;
        let i = Math.min(this.eventCursor, ev.length) - 1;
        while (i > 0 && ev[i - 1].tick === tick) i--;
        const out: Reaction[] = [];
        for (; i >= 0 && i < ev.length && ev[i].tick === tick; i++) {
            const r = reactionFor(ev[i], this.reactCtx);
            if (r) out.push(r);
        }
        return out;
    }

    /**
     * Reação de quem foi atingido: empurrão pra trás, tombo ou tontura e a palavra do efeito na cor do tipo (`word`
     * false: outro do mesmo golpe de área já leva a palavra).
     */
    private react(r: Reaction, tick: number, word = true) {
        const view = this.players[r.target];
        if (!view || view.evolving) return;
        const sp = view.sprite;
        const by = r.by !== null && r.by !== r.target ? this.players[r.by] : null;
        // empurrão pra trás: afasta de quem causou (o deslocamento volta sozinho)
        if (by) {
            const dx = sp.x - by.sprite.x;
            const dy = sp.y - by.sprite.y;
            const d = Math.hypot(dx, dy) || 1;
            this.tweens.add({
                targets: view.lunge,
                x: (dx / d) * 10,
                y: (dy / d) * 6,
                duration: 90,
                yoyo: true,
                ease: 'Quad.easeOut',
            });
        }
        if (r.fall) {
            const secs = Math.max(0.6, hurtSecondsAt(this.snaps, r.target, tick));
            const dir = by && sp.x < by.sprite.x ? -1 : 1;
            const lying = view.down?.tumble && view.down.to > tick;
            // tonto (hesitou) no mesmo lance de um tombo: continua no chão
            if (lying && view.down && r.fall === 'dizzy')
                view.down.to = Math.max(view.down.to, tick + secs * TICK_RATE);
            else view.down = { from: tick, to: tick + secs * TICK_RATE, dir, tumble: r.fall === 'tumble' };
            if (r.fall === 'tumble') this.time.delayedCall(120, () => dust(this, sp.x, sp.y, 7, sp.depth - 1));
        }
        if (!word) return;
        // a palavra: uma por vez em cada um (o status vence o empurrão do mesmo golpe)
        const rank = WORD_RANK[r.word];
        const old = view.word;
        const fresh = old?.obj.active && this.time.now - old.at < 600;
        if (fresh && old && (old.rank > rank || old.text === r.word)) return;
        if (old?.obj.active) {
            this.tweens.killTweensOf(old.obj);
            old.obj.destroy();
        }
        const s = Math.min(this.uiScale, 2);
        const head = sp.y - (sp.originY - headTop(view.skin)) * sp.frame.realHeight * sp.scaleY;
        const text = (dict().battle.react as Record<string, string>)[r.word] ?? r.word.toUpperCase();
        const obj = effectWord(this, sp.x, head - 12 * s, text, readableColor(r.type), s, REACT_DEPTH + 1);
        view.word = { obj, rank, at: this.time.now, text: r.word };
    }

    /**
     * Reação a cada quadro: tombo (o sprite deita pro lado e levanta), estrelinhas girando em cima de quem está no chão
     * ou tonto e o ícone do status com o anel de contagem enquanto ele dura. Tudo vem do tick (o replay e o salto pra
     * trás mostram certo).
     */
    private drawReaction(view: PlayerView, n: number, i: number) {
        const sp = view.sprite;
        const s = Math.min(this.uiScale, 2.3);
        const h = sp.frame.realHeight * sp.scaleY;
        const head = sp.y - (sp.originY - headTop(view.skin)) * h;
        const d = view.down;
        const t = this.playTick;
        let rot = view.tilt;
        if (d && t >= d.from && t < d.to) {
            if (d.tumble) {
                // cai em 3 ticks, fica no chão e levanta nos 4 últimos
                const k = Math.min(1, (t - d.from) / 3, (d.to - t) / 4);
                rot = d.dir * 1.45 * Phaser.Math.Easing.Cubic.Out(k);
            }
            const lying = Math.abs(rot) / 1.45;
            const sx = sp.x + d.dir * h * 0.6 * lying;
            const sy = head + (sp.y - 8 - head) * lying - 5 * s;
            drawStars(this.reactG, sx, sy, s * 0.8, this.time.now);
        } else if (d && (t >= d.to || t < d.from)) view.down = null;
        if (sp.rotation !== rot) sp.setRotation(rot);
        const code = this.snaps[n]?.p[i * SNAP_STRIDE + 4] ?? 0;
        if (code <= 0) {
            view.stSpan = null;
            return;
        }
        let span = view.stSpan;
        if (!span || span.code !== code || t < span.from || t > span.to) {
            const found = spanAt(this.snaps, n, i, 4, code);
            span = view.stSpan = found ? { code, ...found } : null;
        }
        if (!span) return;
        const r = 9 * s;
        drawStatusIcon(
            this.reactG,
            code,
            sp.x + 8 * s + r,
            head - r * 0.3,
            r,
            (span.to - t) / Math.max(1, span.to - span.from),
        );
    }

    /**
     * Duelo da bicuda (motor 21): o goleiro parou o N3 no pé e o motor parou (no motor ele "tem a bola"; na tela, o tempo
     * congela no contato e ele devolve de primeira). Tudo na quadra (`stageShowdown`); a caixa das falas é da tela React
     * (`match:showdown`, ShowdownOverlay.tsx). Aqui também a janela de 1x e a música baixa. Pulando (silent) ou no
     * replay, só a janela.
     */
    private startShowdown(e: Extract<MatchEvent, { type: 'showdown' }>, silent: boolean) {
        const goal = this.matchEvents.find((x) => x.type === 'goal' && x.tick >= e.kick);
        const until = (goal?.tick ?? e.kick + TICK_RATE * 3) + AGENCY.showdown.goal * TICK_RATE;
        this.showdown = { tick: e.tick, kick: e.kick, until, gk: e.gk };
        const shooter = this.players[e.shooter];
        const gk = this.players[e.gk];
        if (silent || this.md.replay || !shooter || !gk) {
            // sem a cena (pulou, replay): o goleiro que tinha armado a bicuda volta pro motor
            if (gk?.act) this.sdAct(gk, null);
            if (shooter) {
                if (shooter.act) this.sdAct(shooter, null);
                shooter.shift.x = 0;
                shooter.shift.y = 0;
            }
            return;
        }
        const ms = ((e.kick - e.tick) / TICK_RATE) * 1000;
        // o N3 que o goleiro parou: a câmera e a bola agora são do duelo
        this.n3End();
        this.maxRunEnd();
        // o tipo do golpe que o goleiro parou (as faíscas dele brigam com as do goleiro na bola parada)
        const shotType = this.maxSlow?.type || this.ballType || species(shooter.speciesId).types[0];
        this.maxSlow = null;
        this.battleBox.clear(this.time.now, ms);
        duckMusic();
        const css = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
        const who = (v: PlayerView) => ({
            speciesId: v.speciesId,
            shiny: v.shiny,
            name: v.name,
            color: css(this.md.colors[v.team]),
        });
        this.showdownOpen = true;
        EventBus.emit('match:showdown', {
            tick: e.tick,
            ms,
            shooter: who(shooter),
            gk: who(gk),
        } satisfies MatchShowdown);
        this.stageShowdown(e, gk, shooter, ms, shotType);
    }

    /** Posição de alguém na tela num tick (o lugar do motor, sem a caminhada do duelo). */
    private playerPxAt(idx: number, tick: number) {
        const { index, t } = this.locate(tick);
        const a = this.snaps[index];
        const b = this.snaps[Math.min(index + 1, this.snaps.length - 1)];
        const o = idx * SNAP_STRIDE;
        return toPx(a.p[o] + (b.p[o] - a.p[o]) * t, a.p[o + 1] + (b.p[o + 1] - a.p[o + 1]) * t);
    }

    /**
     * A geometria do lance do duelo: o goleiro e quem chutou na hora do contato (px), pra onde vai a bicuda (a bola logo
     * depois do chute: o motor já escolheu o canto), a bola parada no pé (`contact` no chão, `spark` no ar) e o lado de
     * cada um.
     */
    private sdGeom(e: { tick: number; kick: number; gk: number; shooter: number }) {
        const g = this.playerPxAt(e.gk, e.tick);
        const s = this.playerPxAt(e.shooter, this.sdSave?.shotTick ?? e.tick);
        const k = this.ballPxAt(e.kick + 4);
        const l = Math.hypot(k.x - g.x, k.y - g.y) || 1;
        const dir = { x: (k.x - g.x) / l, y: (k.y - g.y) / l };
        const contact = { x: g.x + dir.x * SD.reach * PPM, y: g.y + dir.y * SD.reach * PPM };
        return {
            g,
            s,
            dir,
            contact,
            spark: { x: contact.x, y: contact.y - 4 - SD.lift },
            gkFace: dir8(dir, 2),
            shooterFace: dir8({ x: g.x - s.x, y: g.y - s.y }, 6),
        };
    }

    /**
     * Antes do contato: quem chutou fica onde chutou, no fim do chute (o motor leva ele correndo até o gol e os dois
     * ficavam um em cima do outro), e o goleiro arma a bicuda `SD.windup` ticks antes de a bola chegar. Até a bicuda.
     */
    private sdWindup() {
        const w = this.sdSave;
        if (!w || this.md.replay || this.playTick < w.shotTick || this.playTick >= w.kick) return;
        const shooter = this.players[w.shooter];
        if (shooter) {
            const at = this.playerPxAt(w.shooter, w.shotTick);
            const now = this.playerPxAt(w.shooter, Math.min(this.playTick, w.tick));
            shooter.shift.x = at.x - now.x;
            shooter.shift.y = at.y - now.y;
            if (!shooter.act && this.playTick >= w.shotTick + 1) {
                const g = this.playerPxAt(w.gk, w.tick);
                const shoot = resolveAnim(shooter.skin, 'Shoot');
                this.sdAct(
                    shooter,
                    'Shoot',
                    dir8({ x: g.x - at.x, y: g.y - at.y }, 6),
                    animHit(shooter.skin, shoot).hit,
                );
            }
        }
        if (w.armed || this.playTick < w.tick - SD.windup || this.playTick >= w.tick) return;
        w.armed = true;
        const gk = this.players[w.gk];
        if (gk) this.sdAct(gk, 'Shoot', this.sdGeom(w).gkFace, 0);
    }

    /** A área útil do duelo (px do canvas): a janela que aparece (no celular em pé, o meio) acima da caixa das falas. */
    private sdSafe(): Box {
        const c = this.cine.crop;
        const w = c ? Math.min(GAME_W, c.w) : GAME_W;
        return { x: (GAME_W - w) / 2, y: 0, w, h: this.sdBoxTop() };
    }

    /** Onde começa a caixa das falas (px do canvas), medida na tela React; antes de ela aparecer, a última medida. */
    private sdBoxTop(): number {
        const box = document.querySelector('.sd-dock');
        const c = this.game.canvas.getBoundingClientRect();
        if (box && c.height > 0)
            this.sdBoxAt = Math.min(GAME_H, ((box.getBoundingClientRect().top - c.top) / c.height) * GAME_H - 4);
        // no celular em pé a caixa fica embaixo da quadra; deitado e no PC, por cima do fim dela
        const guess = this.cine.crop && this.cine.crop.w < GAME_W - 1 ? GAME_H : GAME_H * 0.76;
        return Math.max(GAME_H * 0.5, this.sdBoxAt ?? guess);
    }

    /** O raio da tela em px do mundo (as linhas de velocidade do mesmo tamanho em qualquer zoom). */
    private sdReach() {
        return Math.hypot(GAME_W, GAME_H) / 2 / (this.rig.view.zoom || 1);
    }

    /** O corpo de alguém (mundo): o desenho do quadro de agora (asa e rabo inclusive). */
    private sdBody(v: PlayerView): Box {
        const b = spriteBox(v.sprite);
        // o goleiro com a bola parada no pé (e o brilho dela) é uma coisa só no quadro
        const st = this.sdStage;
        if (st?.gk !== v) return b;
        const r = 14;
        const x0 = Math.min(b.x, st.spark.x - r);
        const x1 = Math.max(b.x + b.w, st.spark.x + r);
        return { x: x0, y: b.y, w: x1 - x0, h: Math.max(b.h, st.spark.y + r - b.y) };
    }

    /** Onde uma caixa (mundo) cai na tela, com o plano `shot`. */
    private sdOnScreen(shot: Shot, b: Box) {
        const mid = shotMid(shot, GAME_W, GAME_H);
        const xs = [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x, b.y + b.h],
            [b.x + b.w, b.y + b.h],
        ].map(([x, y]) => worldToScreen(mid, shot.zoom, shot.rot, GAME_W, GAME_H, x, y));
        return {
            x0: Math.min(...xs.map((p) => p.x)),
            x1: Math.max(...xs.map((p) => p.x)),
            y0: Math.min(...xs.map((p) => p.y)),
            y1: Math.max(...xs.map((p) => p.y)),
        };
    }

    /**
     * Close de quem fala: o corpo em `fill` da altura útil, girado `rot`, no meio. Quem escuta nunca fica cortado na
     * borda, nem no fim do push-in (`push`): o plano anda até ele sair inteiro (quem fala vai pra beira do lado dele,
     * olhando pra fora do quadro: o contraplano), senão até ele entrar inteiro; não cabendo, quem fala em outro canto do
     * quadro e mais fechado (o Gyarados enorme do lado do Magikarp), e por fim o plano abre pros dois.
     */
    private sdClose(who: PlayerView, other: PlayerView, fill: number, max: number, rot: number, push: number): Shot {
        const view = this.sdSafe();
        const safe = inset(view, 0.07);
        const b = this.sdBody(who);
        const ob = this.sdBody(other);
        const x0 = view.x + 3;
        const x1 = view.x + view.w - 3;
        // o plano vale do começo ao fim do push-in (o zoom maior empurra quem está perto da borda pra fora dela)
        const ok = (shot: Shot) =>
            [1, push].every((z) => {
                const s = { ...shot, zoom: shot.zoom * z };
                const o = this.sdOnScreen(s, ob);
                const me = this.sdOnScreen(s, b);
                // a caixa das falas cobre, não corta: quem escuta vale na tela inteira; quem fala fica acima dela
                const inside = o.x0 >= x0 && o.x1 <= x1 && o.y0 >= 0 && o.y1 <= GAME_H;
                const out = o.x1 <= x0 || o.x0 >= x1 || o.y1 <= 0 || o.y0 >= GAME_H;
                return (inside || out) && me.x0 >= x0 && me.x1 <= x1 && me.y0 >= 0 && me.y1 <= view.y + view.h;
            });
        for (const k of [1, 1.25]) {
            const shot = fitShot([b], safe, { min: SD.zMin, max: max * k, fill: fill * k, rot, ay: 0.54 });
            const o = this.sdOnScreen(shot, ob);
            const left = o.x0 + o.x1 < x0 + x1;
            for (const d of [0, left ? x0 - o.x1 - 2 : x1 - o.x0 + 2, left ? x0 - o.x0 + 2 : x1 - o.x1 - 2]) {
                const moved = { ...shot, sx: shot.sx + d };
                if (ok(moved)) return moved;
            }
        }
        for (const k of [1.25, 1.5])
            for (const ay of [0.54, 0.3, 0.75])
                for (const ax of [0.5, 0.25, 0.75, 0.15, 0.85]) {
                    const shot = fitShot([b], safe, { min: SD.zMin, max: max * k, fill: fill * k, rot, ax, ay });
                    if (ok(shot)) return shot;
                }
        return fitShot([b, ob], safe, { min: 1.2, max, fill: 0.9, rot });
    }

    /**
     * O duelo na quadra, no relógio da quadra (`stepShowdown`). O tempo para no contato (o goleiro no quadro do chute, a
     * bola parada no pé dele, no ar, quem chutou no fim do chute dele) com o quadro de impacto, a onda, as linhas, a
     * rachadura e o COUNTER!; os painéis de mangá no encaro; cada fala em close de quem fala (a caixa é a da tela React);
     * no fim, a bicuda armada com o 2º COUNTER! e a bicuda de primeira (`showdownKick`).
     */
    private stageShowdown(
        e: Extract<MatchEvent, { type: 'showdown' }>,
        gk: PlayerView,
        shooter: PlayerView,
        ms: number,
        shotType: string,
    ) {
        const reduce = !!this.md.reduceMotion;
        const d = dict().showdown;
        const a = dict().match.agency;
        const geo = this.sdGeom(e);
        const { g, dir, contact, spark, gkFace, shooterFace } = geo;
        const type = species(gk.speciesId).types[0];
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
        const sColor = hexToNumber(TYPE_COLOR[shotType] ?? '#ffd447');
        const side = gk.team === 0 ? 1 : -1;
        const portrait = this.cutPortrait(`portrait-${gk.speciesId}`);
        const face = (v: PlayerView) =>
            this.cutPortrait(
                this.textures.exists(`sdface-${v.speciesId}`) ? `sdface-${v.speciesId}` : `portrait-${v.speciesId}`,
            ) ?? '';
        const banner = (typeLabel: string, note: { text: string; color: string } | null, holdMs: number) =>
            this.cine.superBanner({
                portrait,
                move: d.counter,
                typeLabel,
                note,
                color,
                typeInk: readableColor(type),
                fromRight: gk.team === 1,
                reduce,
                depth: REACT_DEPTH + 2,
                holdMs,
                y: 0.82,
            });
        const st: NonNullable<MatchScene['sdStage']> = {
            gk,
            shooter,
            gkFace,
            shooterFace,
            contact,
            spark,
            dir,
            side,
            type,
            color,
            script: showdownScript(shooter, gk, e.tick, d),
            line: -1,
            ms,
            cues: [],
            streams: [],
            crack: null,
            strain: false,
            frozen: false,
        };
        this.sdStage = st;
        const ballBox = { x: spark.x - 7, y: spark.y - 7, w: 14, h: 14 };
        const impact = () => {
            st.frozen = true;
            this.cine.duel([e.gk, e.shooter]);
            // o tempo para: o goleiro no quadro do chute (o do impacto), quem chutou no fim do dele
            const gs = animHit(gk.skin, resolveAnim(gk.skin, 'Shoot'));
            const ss = animHit(shooter.skin, resolveAnim(shooter.skin, 'Shoot'));
            this.sdAct(gk, 'Shoot', gkFace, gs.hit, true);
            this.sdAct(shooter, 'Shoot', shooterFace, Math.min(ss.frames - 1, ss.hit + 2), true);
            playMax('especial');
            playSfx('kick');
            // a câmera de cinema: corte seco no contato, torto, e aproximando devagar até os painéis
            this.cameras.main.setBackgroundColor((this.md.court ? COURTS[this.md.court] : WOOD).surround);
            this.rig.on();
            const shot = fitShot([this.sdBody(gk), ballBox], inset(this.sdSafe(), 0.08), {
                min: 2,
                max: SD.impactMax,
                fill: SD.impactFill,
                rot: side * SD.dutchImpact,
                ax: 0.5 - Math.sign(dir.x) * 0.12,
            });
            this.rig.cut(shot);
            this.rig.apply();
            this.rig.move({ zoom: shot.zoom * 1.12, rot: shot.rot * 1.15 }, SD.panelsAt, 'Sine.easeOut');
            impactFrame(this, color, SD.impactFrameMs, reduce);
            cineShock(this, contact.x, contact.y, color, 1.1, FOCUS_DEPTH - 45, reduce);
            speedLines(this, {
                at: spark,
                color,
                ms: 700,
                depth: FOCUS_DEPTH - 58,
                reach: () => this.sdReach(),
                reduce,
            });
            this.fx.burst(type, spark.x, spark.y, 26, BALL_DEPTH + 2);
            this.fx.burst(shotType, spark.x, spark.y, 16, BALL_DEPTH + 2);
            this.fx.burst('Dust', g.x - dir.x * 6, g.y, 10, FOCUS_DEPTH - 40);
            st.crack = crack(this, g.x - dir.x * 5, g.y + 1, color, 1, FOCUS_DEPTH - 52, reduce);
            chroma(this, [gk.sprite, shooter.sprite, this.ball], 3, 220, reduce);
            this.rig.shake(9, 750);
            crowdFlash(this.fx, this, edgePoints(this.rig, this.sdSafe(), 8), 650, FOCUS_DEPTH - 50, reduce);
            // parada e legível até os painéis (2,3 s entre a entrada e a saída)
            banner(d.back, null, SD.panelsAt - 60);
            // a bola parada solta faíscas do goleiro e, mais fracas, as do golpe que ela trazia
            st.streams.push(
                this.fx.stream(type, spark, 55, BALL_DEPTH + 1, 0.55),
                this.fx.stream(shotType, spark, 150, BALL_DEPTH + 1, 0.45),
            );
        };
        const panels = () => {
            // o encaro em mangá: o goleiro do lado dele, a bola no meio e quem chutou (a caixa das falas ainda não veio)
            const left = gk.team === 0;
            const list: Panel[] = [
                { face: face(gk), color, flip: !left },
                { ball: 'ball', color },
                { face: face(shooter), color: sColor, flip: left },
            ];
            if (!left) list.reverse();
            mangaPanels(this, this.rig, { ...this.sdSafe(), h: GAME_H }, list, SHOWDOWN_MS.talk - SD.panelsAt);
            this.rig.shake(4, 300);
        };
        const prep = () => {
            banner(
                `${a.bicuda} · ${a.maxFxBy.replace('{t}', typeName(type))}`,
                e.q === 2 ? { text: a.maxPerfect, color: '#7dffb0' } : null,
                SHOWDOWN_MS.exit - 350,
            );
            this.cine.superCutIn({
                portrait,
                color,
                fromRight: gk.team === 1,
                ms: SHOWDOWN_MS.exit,
                reduce,
                depth: REACT_DEPTH + 2,
            });
            // a bicuda armada: a bola entre as faixas, o goleiro atrás dela e o espaço pro gol na frente
            const safe = inset(this.sdSafe(), 0.06);
            const shot: Shot = {
                px: spark.x,
                py: spark.y,
                sx: safe.x + safe.w * (0.5 - Math.sign(dir.x) * 0.16),
                sy: Math.min(safe.y + safe.h * 0.7, GAME_H * 0.5),
                zoom: SD.kickZoom,
                rot: -side * 0.1,
            };
            const rest = SHOWDOWN_MS.exit - SD.whipMs - 40;
            this.rig.whip(shot, SD.whipMs, () => this.rig.move({ zoom: SD.kickZoom * 1.1 }, rest, 'Quad.easeIn'));
            this.rig.rumble(2.6);
            st.streams[0]?.rate(18);
        };
        // em ordem de hora (`stepShowdown` tira da frente): com a bicuda armada mais longa que o stinger, ela vinha depois
        st.cues = [
            { at: 0, run: impact },
            { at: SD.panelsAt, run: panels },
            { at: ms - SHOWDOWN_MS.exit, run: prep },
            // o stinger do especial sobe pra bater junto com a bicuda
            { at: ms - N3_STINGER_KICK_MS, run: () => playMax('stinger') },
        ].sort((x, y) => x.at - y.at);
    }

    /**
     * O duelo a `t` ms do lance: as deixas que chegaram e o plano da fala da vez (as mesmas da caixa). Quem fala em close
     * (plano e contraplano, holandês pro lado dele), a 3ª fala de 4 com os dois no quadro, o grito em close forte com o
     * goleiro tremendo; troca de quem fala é chicote, o mesmo falando de novo só aproxima, e todo plano faz push-in.
     */
    private stepShowdown(t: number) {
        const st = this.sdStage;
        if (!st) return;
        while (st.cues.length && st.cues[0].at <= t) st.cues.shift()?.run();
        const n = st.script.length;
        const i = lineAt(t, st.ms, n);
        if (i < 0 || i === st.line || !this.rig.active) return;
        const prev = st.line;
        st.line = i;
        // a rachadura do contato some na 1ª fala (o chão volta a ser chão)
        if (prev < 0) st.crack?.fade(1200);
        const { gk, shooter, side } = st;
        const last = i === n - 1;
        const shoutAt = st.ms - SHOWDOWN_MS.exit - SHOWDOWN_MS.shout;
        const hold = last ? SHOWDOWN_MS.shout : (shoutAt - SHOWDOWN_MS.talk) / (n - 1);
        const who = st.script[i].who === 'g' ? gk : shooter;
        const other = who === gk ? shooter : gk;
        let shot: Shot;
        if (last) {
            shot = this.sdClose(gk, shooter, SD.shoutClose, SD.shoutMax, side * SD.dutchShout, 1.16);
            st.strain = true;
            this.rig.rumble(1.4);
            st.streams[0]?.rate(28);
            // a energia do tipo subindo do corpo dele (aura) e um tranco na entrada do close
            const body = this.sdBody(gk);
            st.streams.push(
                this.fx.stream(st.type, { x: gk.sprite.x, y: gk.sprite.y }, 40, FOCUS_DEPTH + 61, 0.6, body),
            );
            this.rig.shake(5, 320);
        } else if (n === 4 && i === 2) {
            const boxes = [this.sdBody(gk), this.sdBody(shooter)];
            shot = fitShot(boxes, inset(this.sdSafe(), 0.07), { min: 1.3, max: 3.6, fill: 0.9, rot: side * 0.05 });
        } else {
            const rot = (who === gk ? 1 : -1) * side * SD.dutch;
            shot = this.sdClose(who, other, SD.close, SD.closeMax, rot, SD.push);
        }
        const push = () =>
            this.rig.move(
                { zoom: shot.zoom * (last ? 1.16 : SD.push), rot: shot.rot * 1.12 },
                hold - SD.whipMs,
                'Sine.easeInOut',
            );
        if (prev < 0) {
            this.rig.cut(shot);
            push();
        } else if (last && st.script[prev].who === 'g') this.rig.move(shot, 260, 'Back.easeOut', push);
        else if (st.script[prev].who === st.script[i].who) this.rig.move(shot, 300, 'Cubic.easeOut', push);
        else this.rig.whip(shot, SD.whipMs, push);
    }

    /**
     * O tempo voltou: quem chutou se encolhe com a bola passando e fica olhando ela ir (ele volta pro lugar do motor no
     * fim do duelo, com a quadra arrumando pra saída de bola).
     */
    private sdRunBack(v: PlayerView, dir: { x: number; y: number }) {
        this.sdAct(v, 'Hurt', dir8({ x: -dir.x, y: -dir.y }, 6));
        this.time.delayedCall(700, () => {
            if (v.act?.anim === 'Hurt') this.sdAct(v, 'Idle', dir8(dir, 2));
        });
    }

    /** O duelo acabou (a quadra arruma pra saída de bola): quem chutou volta pro lugar e pra animação do motor. */
    private sdSettle() {
        const w = this.sdSave;
        const v = w ? this.players[w.shooter] : undefined;
        if (!v || this.endOn || !this.showdown || this.playTick < this.showdown.until) return;
        if (!v.shift.x && !v.shift.y && !v.act) return;
        v.shift.x = 0;
        v.shift.y = 0;
        this.sdAct(v, null);
    }

    /** A animação que o duelo manda (null devolve pro motor), do quadro `frame` (parada nele com `hold`). */
    private sdAct(view: PlayerView, anim: string | null, facing = 0, frame?: number, hold = false) {
        view.act = anim ? { anim, facing, frame, hold } : null;
        view.currentKey = '';
    }

    /** O instante congelado: a bola parada no ar no pé do goleiro, girando e brilhando no tipo dele; no grito ele treme. */
    private holdShowdownBall(delta: number) {
        const st = this.sdStage;
        if (!st?.frozen) return;
        const now = this.time.now;
        const { x, y } = st.contact;
        this.ball.setPosition(st.spark.x, st.spark.y).setScale(1.1);
        this.ball.rotation += (delta / 1000) * SD.spin * (st.strain ? 2.2 : 1);
        this.lastBall = { x: this.ball.x, y: this.ball.y };
        this.ballShadow
            .setPosition(x + 2, y + 2)
            .setScale(0.75)
            .setAlpha(0.3);
        this.ballGlow
            .setPosition(st.spark.x, st.spark.y)
            .setFillStyle(st.color, 0.45 + 0.15 * Math.sin(now / 70))
            .setScale(1.5 + 0.25 * Math.sin(now / 45))
            .setAlpha(1)
            .setDepth(this.ball.depth - 1);
        if (st.strain && !this.md.reduceMotion) st.gk.sprite.x += Math.sin(now / 22) * 0.7;
    }

    /**
     * A bicuda do duelo, de primeira: o tempo volta (o goleiro termina o chute da pose do contato, quem chutou se encolhe),
     * o 2º quadro de impacto, a onda, as linhas e a torcida em flash; a bola sai do pé bem devagar com a câmera parada
     * nela, e aí a câmera abre e vai junto até o gol (`followShowdownBall`), com o rastro de luz e as partículas do tipo.
     */
    private showdownKick(gk: PlayerView, tick: number) {
        const reduce = !!this.md.reduceMotion;
        const st = this.sdStage;
        this.sdStage = null;
        this.cine.duelEnd();
        playMax('bicuda');
        playMax(MAX_MOVE[3]);
        if (musicDucked()) unduckMusic(false, true);
        const type = st?.type ?? species(gk.speciesId).types[0];
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
        const at = st?.spark ?? { x: this.ball.x, y: this.ball.y };
        releaseFx(this, at.x, at.y, type, 3, REACT_DEPTH + 1, reduce);
        this.kickPop(at.x, at.y, 2.8, 18);
        if (gk.act) {
            gk.act.hold = false;
            gk.sprite.anims.resume();
        }
        if (st) {
            this.sdRunBack(st.shooter, st.dir);
            for (const s of st.streams) s.stop();
        }
        this.rig.rumble(0);
        impactFrame(this, color, SD.impactFrameMs, reduce);
        cineShock(this, at.x, at.y + 4 + SD.lift, color, 1.6, FOCUS_DEPTH - 45, reduce);
        speedLines(this, { at, color, ms: 520, depth: FOCUS_DEPTH - 58, reach: () => this.sdReach(), reduce });
        this.fx.burst(type, at.x, at.y, 40, BALL_DEPTH + 2);
        this.fx.burst('Dust', gk.sprite.x, gk.sprite.y, 14, FOCUS_DEPTH - 40);
        chroma(this, [gk.sprite, this.ball], 4, 260, reduce);
        if (this.rig.active) {
            this.rig.shake(14, 1000);
            crowdFlash(this.fx, this, edgePoints(this.rig, this.sdSafe(), 10), 900, FOCUS_DEPTH - 50, reduce);
            this.rig.move({ zoom: this.rig.s.zoom * 0.9, rot: this.rig.s.rot * 0.4 }, 420, 'Sine.easeOut');
        }
        this.maxSlow = { until: tick + TICK_RATE * 3, factor: SD.depart, level: 3, type, color };
        // a chegada explode no tipo do goleiro (o 'max' marcou a do golpe dele)
        this.maxImpact = { tick, type, level: 3 };
        this.sdFly = {
            team: gk.team,
            kick: tick,
            until: tick + TICK_RATE * 3,
            dir: st?.dir ?? { x: gk.team === 0 ? 1 : -1, y: 0 },
            gk,
            shooter: st?.shooter ?? null,
            following: false,
            stream: this.fx.stream(type, this.ball, 24, BALL_DEPTH - 3, 0.8),
            lines: null,
            speed: 0,
        };
    }

    /**
     * A bicuda no ar: a câmera lenta bem devagar na saída do pé (`SD.depart`) e depois pesando conforme a bola chega no gol
     * (`slowFar` a `slowNear`); a câmera de cinema abre pra `flyZoom`, endireita e vai junto com a bola, com espaço pro gol
     * na frente e as linhas de velocidade. "Reduzir movimento": a quadra inteira num corte, parada.
     */
    private followShowdownBall(delta: number) {
        const f = this.sdFly;
        if (!f) return;
        if (this.playTick > f.until) {
            this.sdFly = null;
            f.stream?.stop();
            f.lines?.stop();
            this.sdRelease(0);
            return;
        }
        const since = this.playTick - f.kick;
        const goalX = toPx(f.team === 0 ? L : 0, 0).x;
        const k = Math.min(1, Math.abs(goalX - this.ball.x) / PPM / SD.nearM);
        const far = SD.slowNear + (SD.slowFar - SD.slowNear) * k * k;
        const ramp = Math.min(1, Math.max(0, (since - SD.departTicks) / 2));
        const factor = SD.depart + (far - SD.depart) * ramp;
        if (this.maxSlow) this.maxSlow.factor = factor;
        // o trecho rápido do meio: mais linha de velocidade e o rastro mais grosso (0 = câmera lenta, 1 = bola voando)
        f.speed = Math.max(0, (factor - SD.slowNear) / (SD.slowFar - SD.slowNear));
        // o tempo voltou de vez: o goleiro e quem chutou voltam pro motor
        if (since > 10 && f.gk.act) this.sdAct(f.gk, null);
        if (!this.rig.active) return;
        if (!f.following && since >= SD.departTicks) {
            f.following = true;
            const safe = this.sdSafe();
            if (this.md.reduceMotion)
                this.rig.cut({ px: GAME_W / 2, py: GAME_H / 2, sx: GAME_W / 2, sy: GAME_H / 2, zoom: 1, rot: 0 });
            else {
                this.rig.move(
                    {
                        zoom: SD.flyZoom,
                        rot: 0,
                        sx: safe.x + safe.w * (0.5 - Math.sign(f.dir.x) * SD.lead),
                        sy: safe.y + safe.h * 0.5,
                    },
                    700,
                    'Sine.easeInOut',
                );
                f.lines = speedLines(this, {
                    at: this.ball,
                    color: this.maxSlow?.color ?? 0xffffff,
                    ms: 1800,
                    depth: BALL_DEPTH - 4,
                    reach: () => this.sdReach(),
                    dir: f.dir,
                    n: 34,
                    power: () => f.speed,
                    reduce: false,
                });
            }
        }
        if (f.following && !this.md.reduceMotion) {
            // mola curta: alcança a bola na saída e depois anda junto
            const a = 1 - Math.exp(-delta / 90);
            this.rig.s.px += (this.ball.x - this.rig.s.px) * a;
            this.rig.s.py += (this.ball.y - this.rig.s.py) * a;
        }
    }

    /** Devolve a câmera pro jogo depois de `delay` ms: endireita, solta e volta pro meio (a borda volta quando couber). */
    private sdRelease(delay: number) {
        if (!this.rig.active) return;
        this.time.delayedCall(delay, () => {
            if (!this.rig.active) return;
            this.rig.move({ rot: 0 }, 260, 'Sine.easeInOut', () => {
                this.rig.off();
                this.sdBoundsPending = true;
                this.cameraHome();
            });
        });
    }

    /** Pulou a bicuda no meio do duelo: desmonta o instante congelado e devolve a câmera. */
    private sdAbort() {
        const st = this.sdStage;
        if (!st) return;
        this.sdStage = null;
        for (const s of st.streams) s.stop();
        st.crack?.fade(200);
        this.sdAct(st.gk, null);
        this.sdAct(st.shooter, null);
        st.shooter.shift.x = 0;
        st.shooter.shift.y = 0;
        this.cine.duelEnd();
        this.rig.rumble(0);
        if (!this.rig.active) return;
        this.rig.off();
        this.sdBoundsPending = true;
        this.cameraHome();
    }

    /** A câmera do duelo voltou pra dentro da quadra: a borda dela volta a valer (antes disso daria um salto). */
    private sdBoundsBack() {
        const cam = this.cameras.main;
        const v = cam.worldView;
        if (this.rig.active || v.x < -0.5 || v.y < -0.5 || v.right > GAME_W + 0.5 || v.bottom > GAME_H + 0.5) return;
        cam.setBounds(0, 0, GAME_W, GAME_H);
        this.sdBoundsPending = false;
    }

    /**
     * O gol do duelo, a comemoração mais longa do jogo (o motor segura `AGENCY.showdown.goal` s): a rede estufa e explode
     * (fios voando, a onda, o tipo do goleiro, o quadro de impacto e a torcida em flash), a câmera na rede por
     * `SD.goalHold` e depois de volta; por cima do gol de sempre, explosões do tipo e a 2ª faixa com o goleiro.
     */
    private showdownGoal(gk: PlayerView, cinematic: boolean) {
        const a = dict().showdown;
        const reduce = !!this.md.reduceMotion;
        const type = this.ballType || species(gk.speciesId).types[0];
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
        const { x, y } = this.ball;
        const f = this.sdFly;
        this.sdFly = null;
        f?.stream?.stop();
        f?.lines?.stop();
        netRipple(this, gk.team === 0 ? 1 : 0, y, color, reduce);
        impactFrame(this, color, SD.impactFrameMs, reduce, false);
        cineShock(this, x, y, color, 1.8, BALL_DEPTH - 1, reduce);
        this.fx.burst('Net', x, y, 30, BALL_DEPTH + 1);
        this.fx.burst(type, x, y, 40, BALL_DEPTH + 1);
        for (let k = 0; k < 4; k++)
            this.time.delayedCall(250 + k * 380, () =>
                typeBurst(this, type, x + (k % 2 ? 1 : -1) * 18 * (1 + k / 2), y + (k - 1.5) * 16, BALL_DEPTH + 1),
            );
        if (this.rig.active) {
            this.rig.shake(16, 900);
            crowdFlash(this.fx, this, edgePoints(this.rig, this.sdSafe(), 16), 1500, FOCUS_DEPTH - 50, reduce);
            const safe = this.sdSafe();
            this.rig.move(
                {
                    px: x,
                    py: y,
                    sx: safe.x + safe.w / 2,
                    sy: safe.y + safe.h * 0.5,
                    zoom: SD.goalZoom,
                    rot: (gk.team === 0 ? 1 : -1) * 0.08,
                },
                200,
                'Cubic.easeOut',
            );
            this.sdRelease(SD.goalHold);
        }
        this.time.delayedCall(SD.bicudaWordAt, () => {
            playCrowd('gol', 1);
            playGoalCry(gk.speciesId, this.md.cries);
            if (cinematic)
                this.cine.drama(a.goal, {
                    color: '#ffd447',
                    stroke: '#1a1030',
                    at: { x: gk.sprite.x, y: gk.sprite.y },
                    sub: `${gk.name} · ${a.goalSub}`,
                    top: true,
                    hold: SD.wordMs,
                });
            else this.goalBanner('#1a1030', a.goal, '#ffd447');
        });
    }

    /**
     * Golpe máximo N1/N2 e bicuda N1/N2 na escada (Miguel, 04/11/2026: "todos os golpes máximos e bicudas sobem o mesmo
     * tanto de produção"; N1 < N2 < N3 < Counter). A quadra para a carga de sempre (o N2 e a bicuda + `MAX_N12.closeMs`)
     * com a energia do tipo no pé. N1: sem corte, o estouro e as partículas do tipo, impacto pequeno. N2: close curto no
     * capitão, quadro de impacto no chute e a onda do tipo no voo (quem cai reage no `knockback`). Bicuda: o revide do
     * Counter em versão curta, close no pé do goleiro, quadro de impacto, rachadura e o rastro de luz do tipo dele até o
     * destino, com o DEVOLVEU!/BICUDA no letreiro. O letreiro fica parado `MAX_N12.tagMs` colado em quem chutou, sem
     * segurar a partida. Só tela: o motor já decidiu o lance. Reduzir movimento: o close entra e sai em corte seco.
     */
    private maxShow(
        cap: PlayerView,
        tick: number,
        level: 1 | 2,
        type: string,
        o: { bicuda: boolean; counter: boolean; isShot: boolean; q: number; moveId: string | null },
    ) {
        const a = dict().match.agency;
        const reduce = !!this.md.reduceMotion;
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
        const close = level === 2 || o.bicuda;
        const hold = MAX_CHARGE_MS[level] + (close ? MAX_N12.closeMs : 0);
        const cam = this.cameras.main;
        this.maxRunEnd();
        this.cine.dropTag();
        // o cartão do canto (e o aviso pro leitor de tela), como antes
        this.highlight(o.bicuda ? 'bicuda' : 'max', cap);
        this.maxHold = true;
        chargeFx(this, cap.sprite.x, cap.sprite.y, type, level, hold, REACT_DEPTH + 1, reduce);
        this.fx.burst(type, cap.sprite.x, cap.sprite.y - 10, close ? 10 : 6, REACT_DEPTH + 1);
        if (close) {
            // o close curto: corta no pé dele e vai chegando até o chute
            const z = o.bicuda ? MAX_N12.close.bicuda : MAX_N12.close[2];
            if (!reduce) this.cine.hitTint(0xffffff, 120, 0.45, FOCUS_DEPTH - 58);
            this.rawPan(cap.sprite.x, cap.sprite.y - 14, reduce ? 1 : 80);
            this.rawZoom(z, reduce ? 1 : 80);
            if (!reduce) this.time.delayedCall(80, () => this.maxHold && this.rawZoom(z * MAX_N12.push, hold - 80));
        } else if (o.isShot) this.lockMaxFrame(cap, tick, hold);
        // o cine sem a faixa de drama do N1/N2 (o letreiro é colado nele): a mesma câmera lenta de antes nos textos
        if (this.md.cinematic) this.cine.slowMotion(this.time.now, 0.25, 1100);
        this.time.delayedCall(hold, () => {
            this.maxHold = false;
            const foot = { x: cap.sprite.x, y: cap.sprite.y };
            // o som do golpe no chute (fim da carga), não no começo dela
            playMax(o.bicuda ? 'bicuda' : MAX_MOVE[level]);
            releaseFx(this, foot.x, foot.y, type, level, REACT_DEPTH + 1, reduce);
            const [ms, k, flash] = MAX_KICK_SHAKE[level];
            cam.shake(ms, k);
            if (flash && !close) cam.flash(flash, 255, 255, 255);
            // o chutão levanta poeira no pé (a bicuda mais)
            this.kickPop(foot.x, foot.y, o.bicuda ? 2.2 : 1.6 + level * 0.3, o.bicuda ? 12 : 6 + level * 3);
            this.fx.burst(type, foot.x, foot.y - 10, close ? 24 : 14, BALL_DEPTH + 1);
            if (close) {
                impactFrame(this, color, MAX_N12.impactMs, reduce, false);
                cineShock(this, foot.x, foot.y, color, o.bicuda ? 0.9 : 0.75, FOCUS_DEPTH - 45, reduce);
                chroma(this, [cap.sprite, this.ball], 3, 180, reduce);
                if (o.bicuda) {
                    const cr = crack(this, foot.x, foot.y + 1, color, 0.8, 3, reduce);
                    this.time.delayedCall(500, () => cr.fade(600));
                }
                // sai do close: no gol atacado (o chute) ou na quadra inteira (o lançamento)
                if (o.isShot) this.lockMaxFrame(cap, tick, reduce ? 1 : MAX_N12.whipMs);
                else if (reduce) {
                    this.rawPan(GAME_W / 2, GAME_H / 2, 1);
                    this.rawZoom(1, 1);
                } else this.cameraHome();
            }
            // o letreiro: DEVOLVEU! (o counter) / BICUDA! / o golpe, com o nível e a nota, parado em cima dele (depois
            // do close, com a câmera já no plano do voo)
            const lv = a.maxLevelShort.replace('{n}', String(level));
            const move = o.moveId ? MOVES[o.moveId]?.name : undefined;
            const tag = () =>
                this.cine.maxTag({
                    x: foot.x,
                    y: foot.y - 46,
                    feet: foot.y + 4,
                    dir: cap.team === 0 ? 1 : -1,
                    title: o.counter ? tr('battle.counter') : o.bicuda ? `${a.bicuda}!` : `${move ?? a.max}!`,
                    tag: `${o.counter ? `${a.bicuda} ` : ''}${lv} · ${typeName(type)}`,
                    note:
                        o.q === 2
                            ? { text: a.maxPerfect, color: '#7dffb0' }
                            : o.q === 1
                              ? { text: a.maxGood, color: '#9be7ff' }
                              : null,
                    who: close ? `${cap.name}${tr('match.castUsed')}` : undefined,
                    portrait: close ? this.cutPortrait(`portrait-${cap.speciesId}`) : null,
                    big: close,
                    color,
                    typeInk: readableColor(type),
                    hold: MAX_N12.tagMs,
                    reduce,
                    depth: REACT_DEPTH + 2,
                });
            if (close && !reduce) this.time.delayedCall(MAX_N12.whipMs, tag);
            else tag();
            // no ar: as partículas do tipo na bola e (N2, bicuda) a história do tipo em versão curta
            const sc = o.bicuda ? MAX_N12.story.bicuda : level === 2 ? MAX_N12.story[2] : 0;
            const st = MAX_N12.stream[o.bicuda ? 2 : level];
            const story = sc
                ? new N3Story({
                      scene: this,
                      fx: this.fx,
                      type,
                      sig: null,
                      depth: REACT_DEPTH + 1,
                      reduce,
                      goal: toPx(cap.team === 0 ? L : 0, PW / 2),
                      rivals: () => [],
                      scale: sc,
                  })
                : null;
            story?.launch(foot);
            this.maxRun = {
                by: this.players.indexOf(cap),
                type,
                level,
                bicuda: o.bicuda,
                story,
                stream: this.fx.stream(type, this.ball, st.every, BALL_DEPTH - 3, st.k),
                at: this.time.now,
                until: tick + (o.bicuda && !o.isShot ? MAX_BICUDA_SLOW_TICKS : TICK_RATE * 3),
                landed: false,
                wave: [],
            };
        });
    }

    /** Um quadro do N1/N2 no ar: a história anda com a bola; chegou no pé de alguém (o lançamento) ou passou, fecha. */
    private maxRunStep() {
        const r = this.maxRun;
        if (!r) return;
        if (!r.landed && (this.playTick > r.until || (!this.ballFree && this.time.now - r.at > 150)))
            this.maxRunLand(!this.ballFree);
        const ground = { x: this.ballShadow.x - 2, y: this.ballShadow.y - 2 };
        const alive = r.story?.step(this.ball, ground) ?? false;
        if (r.level === 2) this.drawMaxWave(r, ground);
        if (r.landed && !alive && !r.wave.length) this.maxRun = null;
    }

    /**
     * A onda do N2 no chão: a faixa da cor do tipo com as bordas brancas, da largura em que o motor derruba
     * (`AGENCY.knockR` de cada lado), sumindo atrás da bola, e a proa dela na frente: quem está dentro cai.
     */
    private drawMaxWave(r: NonNullable<MatchScene['maxRun']>, ground: { x: number; y: number }) {
        if (!this.maxWaveG) this.maxWaveG = this.add.graphics().setDepth(3);
        const g = this.maxWaveG.clear();
        const now = this.time.now;
        const life = 520;
        const last = r.wave.at(-1);
        if (!r.landed && (!last || Math.hypot(ground.x - last.x, ground.y - last.y) > 6))
            r.wave.push({ x: ground.x, y: ground.y, t: now });
        while (r.wave.length && now - r.wave[0].t > life) r.wave.shift();
        const pts = r.wave;
        if (pts.length < 2) return;
        const c = hexToNumber(TYPE_COLOR[r.type] ?? '#ffffff');
        const R = AGENCY.knockR * PPM;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1];
            const b = pts[i];
            const k = 1 - (now - b.t) / life;
            const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const px = (-(b.y - a.y) / d) * R;
            const py = ((b.x - a.x) / d) * R * 0.75;
            g.lineStyle(R * 1.5, c, 0.34 * k).lineBetween(a.x, a.y, b.x, b.y);
            // as bordas: sombra escura por baixo (aparece na quadra clara) e o branco por cima
            for (const [w, col, al] of [
                [7, 0x0d1024, 0.4],
                [3.5, 0xffffff, 0.95],
            ] as const) {
                g.lineStyle(w, col, al * k);
                g.lineBetween(a.x + px, a.y + py, b.x + px, b.y + py);
                g.lineBetween(a.x - px, a.y - py, b.x - px, b.y - py);
            }
        }
        if (r.landed) return;
        // a proa: a onda abrindo na frente da bola
        const a = pts[pts.length - 2];
        const b = pts[pts.length - 1];
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const ux = (b.x - a.x) / d;
        const uy = (b.y - a.y) / d;
        const f = this.md.reduceMotion ? 1 : 1 + 0.12 * Math.sin(now / 45);
        const tip = { x: ground.x + ux * R * 0.7 * f, y: ground.y + uy * R * 0.5 * f };
        const l = { x: ground.x - uy * R * f - ux * R * 0.3, y: ground.y + ux * R * 0.75 * f - uy * R * 0.3 };
        const rr = { x: ground.x + uy * R * f - ux * R * 0.3, y: ground.y - ux * R * 0.75 * f - uy * R * 0.3 };
        g.fillStyle(c, 0.45).fillTriangle(tip.x, tip.y, l.x, l.y, rr.x, rr.y);
        g.lineStyle(4, 0xffffff, 0.95)
            .beginPath()
            .moveTo(l.x, l.y)
            .lineTo(tip.x, tip.y)
            .lineTo(rr.x, rr.y)
            .strokePath();
    }

    /** A bola do N1/N2 chegou (`hit`: em alguém, no gol; senão saiu): a chegada do tipo e o fluxo para. */
    private maxRunLand(hit: boolean, goal = false) {
        const r = this.maxRun;
        if (!r || r.landed) return;
        r.landed = true;
        r.stream?.stop();
        r.stream = null;
        const { x, y } = this.ball;
        if (hit) this.fx.burst(r.type, x, y, r.level === 1 && !r.bicuda ? 16 : 26, BALL_DEPTH + 1);
        r.story?.land(x, y, goal && hit);
        if (!r.story) this.maxRun = null;
    }

    /** Desmonta o N1/N2 no ar agora (outro golpe, trocou o trecho do replay). */
    private maxRunEnd() {
        const r = this.maxRun;
        this.maxWaveG?.clear();
        if (!r) return;
        this.maxRun = null;
        r.stream?.stop();
        r.story?.stop();
    }

    /**
     * O N3 do capitão de linha na régua do Counter (Miguel, 04/11/2026: "todos os outros golpes máximos subam de nível de
     * produção"). A quadra congela (`N3L.scene`, tempo real, em toda velocidade) e a câmera de cinema corta pro capitão
     * em close, torto (holandês) e chegando, com a energia do tipo subindo dele; o cut-in dos olhos no começo e o "X usou
     * Y!" embaixo dele, parado e legível ~1,5 s. No chute: quadro de impacto, onda, linhas, rachadura, aberração, a
     * torcida em flash e o chicote pro gol inteiro; no voo, o rastro de luz, o tipo na bola, as linhas e a história do
     * tipo (n3-story.ts); na chegada, a explosão de cinema (`n3Land`). Só tela: o motor já decidiu o lance.
     */
    private lineSuper(
        cap: PlayerView,
        moveId: string | null,
        fxType: string | null,
        tick: number,
        q: number,
        bicuda = false,
    ) {
        const move = moveId ? MOVES[moveId] : undefined;
        const type = fxType ? fxTypeOf(fxType) : (move?.type ?? species(cap.speciesId).types[0]);
        const sig = !!fxType && fxType in AGENCY.maxSig;
        const idx = this.players.indexOf(cap);
        // Mew e Ditto: a assinatura é o sorteio / a cópia (o efeito que saiu é de um tipo)
        const pick = this.matchEvents.find(
            (x) =>
                x.type === 'maxFx' &&
                x.step === 'hit' &&
                x.tick === tick &&
                x.by === idx &&
                (x.fx === 'metronome' || x.fx === 'transform'),
        );
        const sigId = sig ? fxType : pick?.type === 'maxFx' ? pick.fx : null;
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffd447');
        const reduce = !!this.md.reduceMotion;
        const ms = N3L.scene;
        const now = this.time.now;
        const at = { x: cap.sprite.x, y: cap.sprite.y };
        const side = cap.team === 0 ? 1 : -1;
        this.n3End();
        this.maxRunEnd();
        const story = new N3Story({
            scene: this,
            fx: this.fx,
            type,
            sig: sigId,
            // embaixo da faixa (o "X usou Y!" fica legível) e da bola
            depth: REACT_DEPTH + 1,
            reduce,
            goal: toPx(cap.team === 0 ? L : 0, PW / 2),
            rivals: () =>
                this.players
                    .filter((v) => v.team !== cap.team && v.sprite.visible)
                    .map((v) => ({ x: v.sprite.x, y: v.sprite.y })),
        });
        story.charge({ x: at.x, y: at.y }, ms);
        const body = spriteBox(cap.sprite);
        const n3: NonNullable<MatchScene['n3']> = {
            story,
            cap,
            type,
            color,
            until: tick + TICK_RATE * 3,
            flying: false,
            landed: false,
            home: false,
            dir: { x: side, y: 0 },
            // a energia do tipo subindo do corpo dele a cena inteira
            aura: this.fx.stream(type, { x: at.x, y: at.y }, 34, FOCUS_DEPTH + 61, 0.65, body),
            stream: null,
            lines: null,
        };
        this.n3 = n3;
        // a câmera de cinema: corte seco no capitão, em close e torto pro lado do ataque, chegando até o chute
        this.cameras.main.setBackgroundColor((this.md.court ? COURTS[this.md.court] : WOOD).surround);
        if (!this.rig.active) this.rig.on();
        // ele e a bola no pé acima da faixa (a bola fica por cima de tudo e cortava o nome do golpe)
        const view = this.n3Safe();
        const above = { x: view.x + view.w * 0.08, y: GAME_H * N3L.closeY, w: view.w * 0.84, h: GAME_H * N3L.closeH };
        const ball = { x: this.ball.x - 9, y: this.ball.y - 9, w: 18, h: 18 };
        const shot = fitShot([body, ball], above, {
            min: reduce ? 1.6 : N3L.closeMin,
            max: N3L.closeMax,
            fill: N3L.fill,
            rot: side * N3L.dutch,
        });
        this.rig.cut(shot);
        this.rig.apply();
        this.rig.move({ zoom: shot.zoom * N3L.push, rot: shot.rot * 1.3 }, ms, 'Sine.easeIn');
        this.rig.rumble(1.2);
        this.time.delayedCall(ms * 0.55, () => this.n3 === n3 && !n3.flying && this.rig.rumble(2.6));
        // o chute no fim da cena
        const kick = () => {
            if (this.n3 !== n3) return;
            playMax(MAX_MOVE[3]);
            // a faixa explode de volta junto do impacto do stinger
            unduckMusic(false, true);
            const foot = { x: cap.sprite.x, y: cap.sprite.y };
            releaseFx(this, foot.x, foot.y, type, 3, REACT_DEPTH + 1, reduce);
            this.kickPop(foot.x, foot.y, 2.6, 16);
            n3.aura?.stop();
            n3.aura = null;
            this.rig.rumble(0);
            impactFrame(this, color, N3L.impactMs, reduce);
            cineShock(this, foot.x, foot.y, color, 1.4, FOCUS_DEPTH - 45, reduce);
            speedLines(this, {
                at: { x: foot.x, y: foot.y - 12 },
                color,
                ms: 460,
                depth: FOCUS_DEPTH - 58,
                reach: () => this.sdReach(),
                reduce,
            });
            this.fx.burst(type, foot.x, foot.y - 10, 36, BALL_DEPTH + 2);
            this.fx.burst('Dust', foot.x, foot.y, 12, FOCUS_DEPTH - 40);
            const cr = crack(this, foot.x, foot.y + 1, color, 1.2, 3, reduce);
            this.time.delayedCall(700, () => cr.fade(900));
            chroma(this, [cap.sprite, this.ball], 4, 240, reduce);
            this.rig.shake(13 + story.kickShake, 800);
            crowdFlash(this.fx, this, edgePoints(this.rig, this.n3Safe(), 10), 700, FOCUS_DEPTH - 50, reduce);
            story.launch(foot);
            // o chicote pro gol inteiro: a quadra toda (deitado e no PC); no celular em pé a janela segura o gol
            n3.home = true;
            this.rig.whip(
                { px: GAME_W / 2, py: GAME_H / 2, sx: GAME_W / 2, sy: GAME_H / 2, zoom: 1, rot: 0 },
                N3L.whipMs,
            );
            this.lockMaxFrame(cap, tick, N3_KICK_STOP_MS - 20);
            // hit-stop do chute: a bola espera a câmera chegar no gol
            this.time.delayedCall(N3_KICK_STOP_MS, () => {
                this.maxHold = false;
                if (this.n3 !== n3) return;
                n3.flying = true;
                n3.stream = this.fx.stream(type, this.ball, 22, BALL_DEPTH - 3, 0.85);
                n3.lines = speedLines(this, {
                    at: this.ball,
                    color,
                    ms: 6000,
                    depth: BALL_DEPTH - 4,
                    reach: () => this.sdReach(),
                    dir: n3.dir,
                    n: 22,
                    power: () => 0.55,
                    reduce,
                });
            });
        };
        // a música quase some e o stinger do especial sobe por cima na cena; no chute (o impacto dele) a faixa volta
        duckMusic(true);
        const lead = ms - N3_STINGER_KICK_MS;
        if (lead > 0) this.time.delayedCall(lead, () => playMax('stinger'));
        else playMax('stinger');
        this.time.delayedCall(ms + N3_STINGER_TAIL_MS, () => {
            if (musicDucked()) unduckMusic(false);
        });
        this.maxHold = true;
        this.n3SceneUntil = now + ms;
        playMax('especial');
        // congela: um clarão branco e a quadra some atrás da arte do tipo (cor, desenho do tipo andando, linhas e raios)
        if (!reduce) this.cine.hitTint(0xffffff, 180, 0.85, FOCUS_DEPTH - 58);
        this.cine.focused.add(idx);
        this.cine.superScene({ x: at.x, y: at.y - 16, color, ms, reduce });
        typeBackdrop(this, type, at.x, at.y, { w: GAME_W * 1.4, h: GAME_H * 1.4 }, ms, FOCUS_DEPTH - 59.5, reduce);
        chargeFx(this, at.x, at.y, type, 3, ms, FOCUS_DEPTH + 60, reduce);
        this.time.delayedCall(ms, () => {
            if (!this.cine.spotlightActive) this.cine.focused.delete(idx);
            kick();
        });
        this.battleBox.clear(now, ms + 1100);
        const a = dict().match.agency;
        const fxLabel = (sig ? a.maxSigBy : a.maxFxBy).replace('{t}', typeName(type));
        const typeLabel = bicuda ? `${a.bicuda} · ${fxLabel}` : fxLabel;
        const portrait = this.cutPortrait(`portrait-${cap.speciesId}`);
        // o cut-in dos olhos só no começo (no alto) e o "X usou Y!" embaixo dele, parado até a bola sair do pé
        this.cine.superCutIn({
            portrait,
            color,
            fromRight: cap.team === 1,
            ms: N3L.cutInMs,
            reduce,
            depth: REACT_DEPTH + 2,
            y: N3L.cutInY,
        });
        this.cine.superBanner({
            portrait,
            move: `${sig && fxType ? (a.maxFx[fxType]?.[0] ?? fxType) : (move?.name ?? a.max)}!`,
            who: `${cap.name}${tr('match.castUsed')}`,
            typeLabel,
            top: sig,
            note:
                q === 2
                    ? { text: a.maxPerfect, color: '#7dffb0' }
                    : q === 1
                      ? { text: a.maxGood, color: '#9be7ff' }
                      : null,
            color,
            typeInk: readableColor(type),
            fromRight: cap.team === 1,
            reduce,
            depth: REACT_DEPTH + 2,
            holdMs: N3L.bannerMs + 200,
            y: N3L.bannerY,
        });
    }

    /** A janela que aparece (px do canvas): no celular em pé, a faixa do meio; deitado e no PC, a quadra inteira. */
    private n3Safe(): Box {
        const c = this.cine.crop;
        const w = c ? Math.min(GAME_W, c.w) : GAME_W;
        return { x: (GAME_W - w) / 2, y: 0, w, h: GAME_H };
    }

    /** Um quadro do N3 de linha: a história do tipo anda com a bola (o Fantasma some com ela) e a câmera volta no fim. */
    private n3Step() {
        const n = this.n3;
        if (!n) return;
        if (n.flying) {
            const d = this.maxBallDir;
            const l = Math.hypot(d.x, d.y);
            if (l > 0.3) {
                n.dir.x = d.x / l;
                n.dir.y = d.y / l;
            }
            // o lance passou sem chegada na tela (pulou, saiu do trecho): fecha
            if (this.playTick > n.until) this.n3Land(false, true);
        }
        const alive = n.story.step(this.ball, { x: this.ballShadow.x - 2, y: this.ballShadow.y - 2 });
        if (n.flying) {
            const a = n.story.ballAlpha();
            this.ball.setAlpha(a);
            this.ballGlow.setAlpha(Math.min(this.ballGlow.alpha, a));
            this.ballShadow.setAlpha(this.ballShadow.alpha * a);
            this.maxBallG?.setVisible(a > 0.5);
        }
        if (!alive && n.landed && !n.home && !this.rig.active) this.n3 = null;
    }

    /**
     * A chegada do N3 de linha (gol, defesa, trave, bloqueio; `miss` = fora): quadro de impacto, onda, linhas, a rede
     * explodindo no gol, a torcida em flash, a tremida em curva e o soco da câmera na rede; depois a câmera volta.
     */
    private n3Land(goal: boolean, miss = false) {
        const n = this.n3;
        if (!n || n.landed) return;
        n.landed = true;
        n.flying = false;
        n.stream?.stop();
        n.lines?.stop();
        n.stream = null;
        n.lines = null;
        this.ball.setAlpha(1);
        this.maxBallG?.setVisible(true);
        const reduce = !!this.md.reduceMotion;
        const { x, y } = this.ball;
        if (!miss) {
            n.story.land(x, y, goal);
            impactFrame(this, n.color, N3L.impactMs, reduce, false);
            cineShock(this, x, y, n.color, 1.7, BALL_DEPTH - 1, reduce);
            speedLines(this, {
                at: { x, y },
                color: n.color,
                ms: 380,
                depth: BALL_DEPTH - 4,
                reach: () => this.sdReach(),
                reduce,
            });
            const gk = this.players.find((v, i) => v.team !== n.cap.team && this.md.result.roster[i]?.role === 'GK');
            chroma(this, [this.ball, ...(gk ? [gk.sprite] : [])], 4, 260, reduce);
            if (goal) {
                netRipple(this, n.cap.team === 0 ? 1 : 0, y, n.color, reduce);
                this.fx.burst('Net', x, y, 28, BALL_DEPTH + 1);
            }
        } else n.story.land(x, y, false);
        if (!this.rig.active) {
            n.home = false;
            return;
        }
        if (!miss) {
            this.rig.shake(goal ? 15 : 11, 900);
            crowdFlash(
                this.fx,
                this,
                edgePoints(this.rig, this.n3Safe(), goal ? 14 : 8),
                1100,
                FOCUS_DEPTH - 50,
                reduce,
            );
        }
        if (goal && !reduce) {
            n.home = false;
            const side = n.cap.team === 0 ? 1 : -1;
            this.rig.move(
                { px: x, py: y, sx: GAME_W / 2, sy: GAME_H / 2, zoom: N3L.goalZoom, rot: side * 0.06 },
                200,
                'Cubic.easeOut',
            );
        }
        this.time.delayedCall(goal ? N3L.releaseMs : 500, () => {
            if (this.n3 !== n || !this.rig.active || this.sdStage || this.sdFly) return;
            this.rig.move({ rot: 0 }, 260, 'Sine.easeInOut', () => {
                if (this.n3 !== n) return;
                this.rig.off();
                n.home = false;
                this.sdBoundsPending = true;
                this.cameraHome();
            });
        });
    }

    /** Desmonta o N3 de linha agora (outro lance pegou a câmera, trocou o trecho do replay). */
    private n3End() {
        const n = this.n3;
        if (!n) return;
        this.n3 = null;
        // desmontou antes do chute (o chute já não vem): a quadra não pode ficar congelada
        if (!n.home && !n.flying && !n.landed) this.maxHold = false;
        n.story.stop();
        n.aura?.stop();
        n.stream?.stop();
        n.lines?.stop();
        this.ball.setAlpha(1);
        this.maxBallG?.setVisible(true);
        if (this.rig.active) {
            this.rig.off();
            this.sdBoundsPending = true;
        }
    }

    /** Retrato PMD sem o fundo rosa pintado (src/game/portrait-cut.ts), feito uma vez por espécie. */
    private cutPortrait(key: string): string | null {
        const cut = `${key}-cut`;
        if (this.textures.exists(cut)) return cut;
        if (!this.textures.exists(key)) return null;
        const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
        const tex = this.textures.createCanvas(cut, src.width, src.height);
        if (!tex) return key;
        tex.context.drawImage(src, 0, 0);
        const img = tex.context.getImageData(0, 0, src.width, src.height);
        cutPortraitBg(img.data, src.width, src.height);
        tex.context.putImageData(img, 0, 0);
        tex.refresh();
        tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
        return cut;
    }

    private cameraHome() {
        const cam = this.cameras.main;
        cam.pan(GAME_W / 2, GAME_H / 2, 300, 'Sine.easeInOut', true);
        cam.zoomTo(1, 300, 'Sine.easeInOut', true);
    }

    /** Aplica um nível de impacto: pausa curta (tempo real), tremida que decai e clarão. */
    private punch(level: ImpactLevel) {
        const fx = IMPACT[level];
        const cam = this.cameras.main;
        if (fx.stop) this.holdReal = Math.max(this.holdReal, this.time.now + fx.stop);
        if (fx.shake[0]) cam.shake(fx.shake[0], fx.shake[1]);
        if (fx.flash && !this.md.reduceMotion) this.softFlash(fx.flash);
    }

    /**
     * Clarão do gol: véu branco de 30% que some rápido. O `cam.flash` pintava a quadra inteira de branco puro por um
     * quadro (no PC, um retângulo branco piscando no meio da tela).
     */
    private softFlash(ms: number) {
        const v = this.cameras.main.worldView;
        const r = this.add.rectangle(v.centerX, v.centerY, v.width * 1.6, v.height * 1.6, 0xffffff, 0.3).setDepth(9700);
        this.tweens.add({
            targets: r,
            alpha: 0,
            duration: ms * 1.4,
            ease: 'Quad.easeOut',
            onComplete: () => r.destroy(),
        });
    }

    /** Peso do gol: do rival = toque; seu = batida; virada, empate no fim ou gol na final = explosão. */
    private goalLevel(e: Extract<MatchEvent, { type: 'goal' }>): ImpactLevel {
        if (e.team !== this.mine) return 'touch';
        const mine = e.score[this.mine];
        const theirs = e.score[this.mine === 0 ? 1 : 0];
        const late = e.minute >= 35;
        // virada: passou à frente depois de ter estado atrás em algum momento
        const wasBehind = this.matchEvents.some(
            (g) => g.type === 'goal' && g.tick < e.tick && g.score[this.mine === 0 ? 1 : 0] > g.score[this.mine],
        );
        const turned = mine === theirs + 1 && wasBehind;
        if (this.md.final || turned || (late && mine >= theirs)) return 'boom';
        return 'hit';
    }

    /** Animação do golpe (src/game/move-fx.ts): estilo do golpe na cor e partícula do tipo. */
    private moveFx(by: number, moveId: string, moveType: string, target: number | null, strong: boolean) {
        const to = target !== null ? this.players[target] : null;
        castMove({
            scene: this,
            user: this.players[by].sprite,
            target: to?.sprite ?? null,
            moveId,
            moveType,
            kind: MOVES[moveId] ? moveProfile(moveId).kind : 'blast',
            strong,
            depth: FOCUS_DEPTH + 70,
            baseScale: this.ssNow,
            onHit: () => to && this.refreshTint(to),
            // a posição vem do motor a cada quadro: o golpe desloca pelo "lunge" (somado à posição)
            nudge: (who, dx, dy, ms) => {
                const v = who === 'user' ? this.players[by] : to;
                if (v)
                    this.tweens.add({
                        targets: v.lunge,
                        x: dx,
                        y: dy,
                        duration: ms / 2,
                        yoyo: true,
                        ease: 'Sine.easeOut',
                    });
            },
        });
    }

    private goalBanner(stroke: string, text = tr('battle.goalBanner'), color = '#ffffff') {
        claimOverlay('drama', PRIO_GOAL, 1700);
        const t = this.add
            .text(GAME_W / 2, GAME_H / 2, text, {
                fontFamily: 'Galmuri11, monospace',
                fontSize: '72px',
                fontStyle: 'bold',
                color,
                stroke,
                strokeThickness: 10,
            })
            .setOrigin(0.5)
            .setDepth(9000)
            .setScale(0.2)
            .setResolution(2);
        this.tweens.add({
            targets: t,
            scale: 1,
            duration: 380,
            ease: 'Back.easeOut',
            onComplete: () =>
                this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 400, onComplete: () => t.destroy() }),
        });
    }
}
