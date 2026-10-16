import Phaser from 'phaser';
import { FUTSAL_5 } from '../../engine/config';
import { MOVES, species } from '../../engine/data';
import { ITEMS } from '../../engine/items';
import { LINKS } from '../../engine/links';
import { moveProfile } from '../../engine/moves';
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
    type TraitFx,
} from '../../engine/state';
import { dir8 } from '../../engine/vec';
import { dict, linkText, t as tr } from '../../i18n';
import type { CryStyle, NamesOnField, PlaybackSpeed } from '../../store/game-store';
import { hexToNumber, TYPE_COLOR } from '../../ui/type-colors';
import {
    animForAction,
    atlasKey,
    createSpeciesAnims,
    footOrigin,
    headTop,
    preloadSpecies,
    resolveAnim,
    shadowSize,
} from '../animation-manager';
import { playCry, playSfx } from '../audio';
import { BattleBox } from '../battle-box';
import { Cinematics, FOCUS_DEPTH } from '../cinematics';
import { drawCourt, ensureBallTexture, GAME_H, GAME_W, PPM, toPx } from '../court';
import { EventBus } from '../EventBus';
import { castMove, preloadMoveFx } from '../move-fx';

export { GAME_H, GAME_W } from '../court';

export interface MatchSceneData {
    result: MatchResult;
    colors: [number, number];
    cries: CryStyle;
    speed: PlaybackSpeed;
    cinematic: boolean;
    /** Nomes na quadra: todos, só do seu time (time 0) ou nenhum. Padrão: todos. */
    namesOnField?: NamesOnField;
    /** Reduzir movimento (já resolvido): câmera parada, sem tremida, clarão nem zoom. */
    reduceMotion?: boolean;
    /** Espécies que podem entrar em campo (bancos inteiros): pré-carregadas para substituições. */
    extraSpecies?: number[];
    /** Começa parada (tela de VERSUS); a partida só rola depois de 'match:resume'. */
    startPaused?: boolean;
    /** Retomando uma partida: começa deste tick (os eventos anteriores são aplicados sem animação). */
    startTick?: number;
    /** Final da copa: gol vale "explosão". */
    final?: boolean;
}

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
/** Catmull-Rom: passa por p1 (t=0) e p2 (t=1) usando os vizinhos para a curva. */
const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) =>
    0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);

/** Ticks antes de um gol em que a partida cai para no máximo 1x (o gol é assistido em qualquer velocidade). */
const GOAL_LEAD = 16;

type PenaltyEvent = Extract<MatchEvent, { type: 'penalty' }>;

const SPRITE_SCALE = 1.8;
const TICK_RATE = FUTSAL_5.tickRate;
/** Ticks antes de gol/trave/defesa em que a câmera lenta começa. */
const DRAMA_LEAD = 12;
/**
 * A bola fica numa camada acima de todos os Pokémon, nomes e do escurecimento dos golpes
 * (só a caixa de narração e os textos de drama ficam por cima): nunca some atrás de alguém.
 */
const BALL_DEPTH = FOCUS_DEPTH + 200;
/** Rastro da bola: quantos ticks de jogo para trás ele alcança. */
const TRAIL_TICKS = 5;
/** Mergulho do goleiro: começa alguns ticks antes do contato e volta depois. */
const DIVE_LEAD = 6;
const DIVE_TAIL = 10;
/** Alcance máximo do mergulho na tela (px). */
const DIVE_MAX = 1.8 * PPM;

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

/** Faixa de gol/defesa que a tela React mostra no canto do time. */
export interface MatchHighlight {
    kind: 'goal' | 'owngoal' | 'save' | 'sub' | 'evolve';
    team: 0 | 1;
    speciesId: number;
    shiny: boolean;
    name: string;
    /** Substituição: quem saiu. Evolução: a forma anterior. */
    outSpeciesId?: number;
    outName?: string;
}

interface DiveInfo {
    tick: number;
    gk: number;
    /** Ponto do contato na tela (calculado na 1ª vez). */
    at: { x: number; y: number } | null;
}

const IMPORTANT = new Set([
    'transform',
    'combo',
    'shot',
    'goal',
    'save',
    'post',
    'penalty',
    'status',
    'move',
    'item',
    'tactic',
    'halftime',
    'fulltime',
    'kickoff',
]);
const DRAMA = new Set(['goal', 'post', 'save']);

/** Status por código do snapshot: rótulo, cor do rótulo e tinta do sprite. */
const STATUS_VIEW: Record<number, { label: string; color: string; tint: number }> = {
    1: { label: 'PAR', color: '#ffe14d', tint: 0xfff07a },
    2: { label: 'Zzz', color: '#cfd8ff', tint: 0x9aa8c8 },
    3: { label: 'PSN', color: '#d48cff', tint: 0xd9a3ff },
    4: { label: 'BRN', color: '#ff8a5c', tint: 0xffa98a },
    5: { label: 'FRZ', color: '#a8ecff', tint: 0xbfefff },
    6: { label: '???', color: '#ffffff', tint: 0xffffff },
    7: { label: '♥', color: '#ff8fc8', tint: 0xffc6e3 },
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
    /** Em animação de evolução: a cena não troca a animação dele. */
    evolving: boolean;
    /** Entrando na quadra vindo da lateral (substituição): de onde, quando começa e quanto dura (tempo real). */
    enter: { from: { x: number; y: number }; start: number; dur: number } | null;
    /** Clones do Double Team (criados na primeira vez). */
    clones: Phaser.GameObjects.Sprite[];
    /** Piscando de carga (Solar Beam, Bide...). */
    glowing: boolean;
}

export class MatchScene extends Phaser.Scene {
    private md!: MatchSceneData;
    private snaps: MatchSnapshot[] = [];
    private matchEvents: MatchEvent[] = [];
    private eventCursor = 0;
    private playTick = 0;
    private lastEventTick = 0;
    /** Playback não passa deste tick enquanto a partida é resimulada (tática ao vivo). */
    private holdAt = Number.POSITIVE_INFINITY;
    private speed: PlaybackSpeed = 1;
    private players: PlayerView[] = [];
    private ball!: Phaser.GameObjects.Image;
    private ballGlow!: Phaser.GameObjects.Arc;
    private ballShadow!: Phaser.GameObjects.Ellipse;
    private trailG!: Phaser.GameObjects.Graphics;
    private trail: { x: number; y: number; tick: number }[] = [];
    private ballFree = false;
    /** Escala extra da bola no chute/quique (o "peso" do contato), animada por tween. */
    private ballPop = { v: 1 };
    private lastBz = 0;
    private ballColor = 0xffffff;
    private lastBall = { x: 0, y: 0 };
    private dives: DiveInfo[] = [];
    /** Deslocamento suavizado da bola em relação a quem conduz. */
    private dribble = { owner: -1, x: 0, y: 0, tick: 0 };
    /** Até quando (tempo real) a partida fica parada (evolução, substituição). */
    private holdReal = 0;
    private evoQueue: { view: PlayerView; from: number; into: number; newName: string }[] = [];
    private evoTimer?: Phaser.Time.TimerEvent;
    private battleBox!: BattleBox;
    private cine!: Cinematics;
    private ended = false;
    private lastEmit = 0;
    private recentImportantTick = Number.NEGATIVE_INFINITY;
    private importantTicks: number[] = [];
    private dramaTicks: number[] = [];
    private goalTicks: number[] = [];

    /** Disputa de pênaltis (acontece depois do último snapshot: a cena anima sozinha). */
    private penalties: PenaltyEvent[] = [];
    private fulltimeTick = Number.POSITIVE_INFINITY;
    private shootoutOn = false;
    private penaltyStage: number[] = [];
    private linePos = new Map<number, { x: number; y: number }>();
    private viewPos = new Map<number, { x: number; y: number }>();
    private uiScale = 1;
    private unbind?: () => void;

    constructor() {
        super('Match');
    }

    preload() {
        this.md = this.registry.get('matchData') as MatchSceneData;
        for (const id of this.allSpecies()) preloadSpecies(this, id);
        preloadMoveFx(this);
    }

    create() {
        const { result } = this.md;
        this.speed = this.md.speed;
        this.setTimeline(result);
        this.playTick = this.snaps[0]?.tick ?? 0;
        if (this.md.reduceMotion) this.steadyCamera();

        drawCourt(this);
        ensureBallTexture(this);
        for (const p of result.roster) {
            createSpeciesAnims(this, p.speciesId);
            this.players.push(this.createPlayerView(p.speciesId, p.team, p.name, p.shiny, p.captain));
        }
        for (const id of this.allSpecies()) createSpeciesAnims(this, id);

        this.ballShadow = this.add.ellipse(0, 0, 14, 6, 0x000000, 0.35);
        this.trailG = this.add.graphics();
        this.ballGlow = this.add.circle(0, 0, 13, 0xffffff, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.ball = this.add.image(0, 0, 'ball').setDepth(BALL_DEPTH);
        this.battleBox = new BattleBox(this, GAME_W / 2, GAME_H - 30, 560);
        this.cine = new Cinematics(this);

        const onResize = () => this.updateUiScale();
        this.scale.on('resize', onResize);
        this.updateUiScale();

        EventBus.on('match:set-speed', this.onSpeed, this);
        EventBus.on('match:skip', this.onSkip, this);
        EventBus.on('match:hold', this.onHold, this);
        EventBus.on('match:replace', this.onReplace, this);
        EventBus.on('match:seek-fulltime', this.onSeekFulltime, this);
        EventBus.on('match:resume', this.onResume, this);
        EventBus.on('match:evolution-done', this.onEvolutionDone, this);
        EventBus.on('match:inspect-close', this.onInspectClose, this);
        EventBus.on('match:inspect-request', this.onInspectRequest, this);
        this.unbind = () => {
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
        };
        this.sys.events.once('shutdown', () => this.unbind?.());
        this.sys.events.once('destroy', () => this.unbind?.());

        this.paused = !!this.md.startPaused;
        if (!this.paused) playSfx('whistle');
        this.applySnapshot(0, 0);
        if (this.md.startTick) this.seekTo(this.md.startTick);
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

    private allSpecies(): Set<number> {
        const { result, extraSpecies = [] } = this.md;
        return new Set([...result.roster, ...result.finalRoster].map((p) => p.speciesId).concat(extraSpecies));
    }

    /**
     * Formas evoluídas de quem está em jogo (evolução no meio da partida): carregam em segundo plano depois que
     * a quadra abre, para não atrasar o início. Uma evolução por jogador por partida, então basta o próximo estágio.
     */
    private preloadEvolutions() {
        const next = new Set<number>();
        for (const id of this.allSpecies()) {
            for (const e of species(id).evolvesTo) {
                if (e.id <= 151 && !this.textures.exists(atlasKey(e.id))) next.add(e.id);
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
        this.importantTicks = this.matchEvents.filter((e) => IMPORTANT.has(e.type)).map((e) => e.tick);
        this.dramaTicks = this.matchEvents.filter((e) => DRAMA.has(e.type)).map((e) => e.tick);
        this.goalTicks = this.matchEvents.filter((e) => e.type === 'goal').map((e) => e.tick);
        this.penalties = this.matchEvents.filter((e): e is PenaltyEvent => e.type === 'penalty');
        this.dives = this.matchEvents.flatMap((e) => (e.type === 'save' ? [{ tick: e.tick, gk: e.by, at: null }] : []));
        this.fulltimeTick = this.matchEvents.find((e) => e.type === 'fulltime')?.tick ?? Number.POSITIVE_INFINITY;
        this.penaltyStage = this.penalties.map((_, i) => this.penaltyStage[i] ?? 0);
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
        this.inspecting = true;
        EventBus.emit('match:inspect', { idx, tick: this.playTick });
    }

    private onResume() {
        if (!this.paused) return;
        this.paused = false;
        playSfx('whistle');
    }

    private onSpeed(speed: PlaybackSpeed) {
        this.speed = speed;
    }

    private onHold(tick: number) {
        this.holdAt = tick;
    }

    /** Nova versão da partida (tática mudada): o passado é idêntico, então o cursor de eventos continua válido. */
    private onReplace(result: MatchResult) {
        // a substituição do intervalo pode mudar com a nova tática: o finalRoster novo é o que vale
        this.md = { ...this.md, result };
        for (const p of result.finalRoster) {
            if (this.textures.exists(atlasKey(p.speciesId))) createSpeciesAnims(this, p.speciesId);
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

    /** Em telas pequenas o canvas encolhe: textos crescem no mundo para continuarem legíveis. */
    private updateUiScale() {
        const shown = this.scale.displaySize.width || GAME_W;
        this.uiScale = Math.max(1, (GAME_W / shown) * 0.72);
        this.cine.uiScale = this.uiScale;
        const s = Math.min(this.uiScale, 2.3);
        for (const v of this.players) {
            v.label.setFontSize(Math.round(10 * s));
            v.badge.setFontSize(Math.round(11 * s));
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
        const size = shadowSize(speciesId);
        const shadow = this.add.ellipse(0, 0, 14 + size * 6, 6 + size * 2, 0x000000, 0.3);
        const ring = this.add.ellipse(0, 0, 22 + size * 6, 9 + size * 2).setStrokeStyle(2.5, color, 0.95);
        const sprite = this.add
            .sprite(0, 0, atlasKey(speciesId))
            .setScale(SPRITE_SCALE)
            .setOrigin(0.5, footOrigin(speciesId, 'Idle'));
        // seu time (casa) ganha uma setinha vermelha discreta na cabeça
        const arrow =
            team === 0
                ? this.add.triangle(0, 0, 0, 0, 9, 0, 4.5, 6, 0xff3b3b).setStrokeStyle(1.5, 0x000000, 0.8)
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
            .setResolution(2)
            .setAlpha(this.showsName(team) ? 1 : 0);
        const badge = this.add
            .text(0, 0, '', { ...textStyle, fontSize: '11px', fontStyle: 'bold' })
            .setOrigin(0.5, 0)
            .setResolution(2);
        const view: PlayerView = {
            speciesId,
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
            evolving: false,
            enter: null,
            clones: [],
            glowing: false,
        };
        this.refreshTint(view);
        // tocar no Pokémon abre o painel dele (src/ui/components/PlayerInspect.tsx) e pausa a partida
        sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            if (this.ended || this.holdReal > this.time.now) return;
            this.inspecting = true;
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
        return mode === 'all' || (mode === 'mine' && team === 0);
    }

    /** Altura ocupada pelo nome (zero quando escondido): o status sobe para o lugar dele. */
    private nameHeight(view: PlayerView) {
        return view.label.alpha > 0 ? view.label.height : 0;
    }

    /** Setinha do seu time: logo acima da cabeça (topo visível do sprite no Idle). */
    private placeArrow(view: PlayerView, x: number, y: number, depth: number) {
        if (!view.arrow) return;
        const h = view.sprite.frame.realHeight * view.sprite.scaleY;
        const head = y - (view.sprite.originY - headTop(view.speciesId)) * h;
        view.arrow.setPosition(x, head - 7).setDepth(depth);
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

    private swapSpecies(view: PlayerView, speciesId: number, name: string, shiny: boolean) {
        view.speciesId = speciesId;
        view.name = name;
        view.shiny = shiny;
        view.captain = false;
        view.sprite.setTexture(atlasKey(speciesId)).setOrigin(0.5, footOrigin(speciesId, 'Idle'));
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
        else if (view.shiny) view.sprite.setTint(0xfff3b0);
        else view.sprite.clearTint();
    }

    /** Ícone de status + setinha de buff/debuff + anel brilhando quando há golpe carregado. */
    private applyIndicators(view: PlayerView, status: number, flags: number) {
        if (status === view.status && flags === view.flags) return;
        view.status = status;
        view.flags = flags;
        const st = STATUS_VIEW[status];
        const arrows = (flags & FLAG_BUFF ? '▲' : '') + (flags & FLAG_DEBUFF ? '▼' : '');
        view.badge.setText([st?.label, arrows].filter(Boolean).join(' '));
        view.badge.setColor(st ? st.color : flags & FLAG_BUFF ? '#7dff8a' : '#ff7a7a');
        view.ring.setStrokeStyle(
            flags & FLAG_CHARGED ? 4 : 2.5,
            flags & FLAG_CHARGED ? 0xffe14d : this.md.colors[view.team],
            0.95,
        );
        // Minimize: fica pequenininho
        if (!view.evolving) view.sprite.setScale(SPRITE_SCALE * (flags & FLAG_MINI ? 0.6 : 1));
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
        if (this.ended || !this.snaps.length || this.paused || this.inspecting) return;
        // evolução: a partida para enquanto o Pokémon evolui, como nos jogos
        const factor = time < this.holdReal ? 0 : this.currentSpeedFactor(time);
        this.playTick = Math.min(this.playTick + (delta / 1000) * TICK_RATE * factor, this.holdAt - 1e-3);

        while (this.eventCursor < this.matchEvents.length && this.matchEvents[this.eventCursor].tick <= this.playTick) {
            this.handleEvent(this.matchEvents[this.eventCursor++], false);
        }

        const { index, t } = this.locate(this.playTick);
        const inShootout = this.penalties.length > 0 && this.playTick >= this.fulltimeTick + TICK_RATE;
        if (inShootout) {
            if (!this.shootoutOn) this.startShootout();
            this.updateShootout(factor);
        } else {
            this.applySnapshot(index, t, factor);
        }
        this.updateBallMotion(inShootout);
        this.battleBox.update(time, Math.max(1, factor));
        this.cine.updatePins();
        this.updateZoneViews();

        if (time - this.lastEmit > 120) {
            this.lastEmit = time;
            this.emitTick(this.snaps[index]);
        }

        const lastSnap = this.snaps[this.snaps.length - 1].tick;
        if (this.playTick > Math.max(lastSnap, this.lastEventTick) + TICK_RATE * 1.5) this.finish();
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
            const resolved = resolveAnim(view.speciesId, anim);
            const key = `${view.speciesId}/${resolved}/${facing}`;
            if (key !== view.currentKey) {
                view.sprite.play(key).setOrigin(0.5, footOrigin(view.speciesId, resolved));
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
        const center = toPx(29.5, width / 2);
        cam.pan(center.x, center.y, 700, 'Sine.easeInOut', true);
        cam.zoomTo(1.35, 700, 'Sine.easeInOut', true);
        this.battleBox.push(tr('battle.shootout'));
    }

    private updateShootout(factor: number) {
        this.penalties.forEach((pen, i) => {
            if (this.penaltyStage[i] < 1 && this.playTick >= pen.tick - 48) {
                this.penaltyStage[i] = 1;
                this.preparePenalty(i, factor);
            }
            if (this.penaltyStage[i] < 2 && this.playTick >= pen.tick - 14) {
                this.penaltyStage[i] = 2;
                this.kickPenalty(pen, factor);
            }
        });
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
        let base: number;
        if (this.speed !== 'highlights') base = this.speed;
        else {
            // "só os lances": devagar perto de lances importantes, rápido no resto
            const ahead = this.importantTicks.find((t) => t >= this.playTick);
            const near =
                (ahead !== undefined && ahead - this.playTick < TICK_RATE * 2.5) ||
                this.playTick - this.recentImportantTick < TICK_RATE * 1.5;
            base = near ? 1 : 10;
        }
        // a disputa de pênaltis sempre em ritmo assistível, em qualquer velocidade
        if (this.penalties.length > 0 && this.playTick >= this.fulltimeTick) base = Math.min(base, 1.25);
        // gol chegando: cai para 1x mesmo em 8x (81% jogam em 8x e perdiam o lance)
        const goal = this.goalTicks.find((t) => t >= this.playTick);
        if (goal !== undefined && goal - this.playTick <= GOAL_LEAD) base = Math.min(base, 1);
        if (!this.md.cinematic) return base;
        // câmera lenta chegando no gol/trave/defesa
        const next = this.dramaTicks.find((t) => t >= this.playTick);
        let drama = 1;
        if (next !== undefined && next - this.playTick <= DRAMA_LEAD) {
            drama = 0.25 + 0.75 * ((next - this.playTick) / DRAMA_LEAD);
        }
        return base * Math.min(drama, this.cine.speedFactor(now));
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
        for (let i = 0; i < this.players.length; i++) {
            const view = this.players[i];
            const o = i * SNAP_STRIDE;
            const x = smooth ? catmull(prev.p[o], a.p[o], b.p[o], next.p[o], k) : a.p[o] + (b.p[o] - a.p[o]) * k;
            const y = smooth
                ? catmull(prev.p[o + 1], a.p[o + 1], b.p[o + 1], next.p[o + 1], k)
                : a.p[o + 1] + (b.p[o + 1] - a.p[o + 1]) * k;
            const { facing, action } = this.steadyPose(index + (k < 0.5 ? 0 : 1), o);
            const px = toPx(x, y);
            pxOf[i] = px;
            // em destaque (holofote): acima do escurecimento
            const focused = this.cine.focused.has(i);
            const base = focused ? FOCUS_DEPTH + px.y / 100 : px.y;
            const dive = this.diveOffset(i, px);
            if (dive) diveOf.set(i, dive);
            view.sprite
                .setPosition(px.x + view.lunge.x + (dive?.x ?? 0), px.y + view.lunge.y + (dive?.y ?? 0))
                .setDepth(base);
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
            view.shadow.setPosition(px.x, px.y + 1).setDepth(base - 2);
            view.ring.setPosition(px.x, px.y + 1).setDepth(base - 1);
            const labelDepth = focused ? FOCUS_DEPTH + 60 : 5000;
            view.label.setPosition(px.x, px.y + 6).setDepth(labelDepth);
            view.badge.setPosition(px.x, px.y + 6 + this.nameHeight(view)).setDepth(labelDepth + 1);
            this.placeArrow(view, px.x, px.y, labelDepth - 1);
            if (focused) focusPos.set(i, px);
            this.applyIndicators(view, near.p[o + 4], near.p[o + 5]);
            this.applyTraitPose(view, near.p[o + 5]);

            const anim = resolveAnim(view.speciesId, dive ? 'Attack' : animForAction(action));
            const key = `${view.speciesId}/${anim}/${dive ? dive.facing : facing}`;
            if (entering !== null) {
                const walk = resolveAnim(view.speciesId, 'Walk');
                const wkey = `${view.speciesId}/${walk}/${entering}`;
                if (wkey !== view.currentKey) {
                    view.sprite.play(wkey).setOrigin(0.5, footOrigin(view.speciesId, walk));
                    view.currentKey = wkey;
                }
            } else if (key !== view.currentKey && !view.evolving) {
                view.sprite.play(key).setOrigin(0.5, footOrigin(view.speciesId, anim));
                view.currentKey = key;
            }
            const dx = (b.p[o] - a.p[o]) * PPM;
            const dy = (b.p[o + 1] - a.p[o + 1]) * PPM;
            const pxPerTick = Math.hypot(dx, dy) / Math.max(1, b.tick - a.tick);
            // a animação acompanha a velocidade real: Pokémon rápidos "pedalam" mais rápido
            const pace = action === Action.Run ? Phaser.Math.Clamp(pxPerTick / 2.5, 0.5, 2) : 1;
            view.sprite.anims.timeScale = pace * Phaser.Math.Clamp(factor, 0.3, 4);
            // quem entra caminha no ritmo normal (a partida está parada) e o nome/anel só aparecem quando ele chega
            const arriving = entering !== null;
            if (arriving) view.sprite.anims.timeScale = 1;
            for (const o of [view.label, view.badge, view.ring, view.shadow, view.arrow]) o?.setVisible(!arriving);
            if (view.status === 1) view.sprite.x += Math.sin(this.time.now / 40) * 1.2; // paralisia: tremidinha
        }
        if (focusPos.size) this.cine.followSpots(focusPos);
        const bx = a.bx + (b.bx - a.bx) * k;
        const by = a.by + (b.by - a.by) * k;
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
            } else {
                const alpha = 1 - Math.exp(-Math.max(0, this.playTick - d.tick) / 1.5);
                d.x += (tx - d.x) * alpha;
                d.y += (ty - d.y) * alpha;
            }
            bp.x = c.x + d.x;
            bp.y = c.y + d.y;
        }
        d.owner = carrier;
        d.tick = this.playTick;
        // bola na mão do goleiro que acabou de mergulhar acompanha o mergulho
        const held = near.owner >= 0 ? diveOf.get(near.owner) : undefined;
        if (held) {
            bp.x += held.x;
            bp.y += held.y;
        }
        // bola cruzada: sobe (afasta da sombra) e cresce, como se viesse na direção da câmera
        const bz = Math.max(0, (a.bz ?? 0) + ((b.bz ?? 0) - (a.bz ?? 0)) * k);
        const lift = bz * PPM * 0.9;
        // quique: a bola que vinha no alto e toca o chão amassa um instante e solta poeira
        if (this.lastBz > 0.25 && bz < 0.03) this.kickPop(bp.x, bp.y, 0.75, 4);
        this.lastBz = bz;
        this.ball.setPosition(bp.x, bp.y - 4 - lift).setScale((1 + bz * 0.3) * this.ballPop.v);
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
    private diveOffset(i: number, px: { x: number; y: number }): { x: number; y: number; facing: number } | null {
        for (const d of this.dives) {
            if (d.gk !== i) continue;
            const dt = this.playTick - d.tick;
            if (dt < -DIVE_LEAD || dt > DIVE_TAIL) continue;
            d.at ??= this.ballPxAt(d.tick);
            const k = dt < 0 ? 1 - (-dt / DIVE_LEAD) ** 2 : 1 - (dt / DIVE_TAIL) ** 2;
            let ox = d.at.x - px.x;
            // o sprite fica com o pé no chão: mira um pouco abaixo da bola para o corpo cobrir ela
            let oy = d.at.y + 6 - px.y;
            const l = Math.hypot(ox, oy);
            if (l > DIVE_MAX) {
                ox *= DIVE_MAX / l;
                oy *= DIVE_MAX / l;
            }
            return { x: ox * k, y: oy * k, facing: dir8({ x: ox, y: oy }, 2) };
        }
        return null;
    }

    /** Giro proporcional ao que a bola andou de fato + rastro para mostrar a direção. */
    private updateBallMotion(shootout: boolean) {
        const { x, y } = this.ball;
        const dx = x - this.lastBall.x;
        const dy = y - this.lastBall.y;
        const moved = Math.hypot(dx, dy);
        if (moved < 60) this.ball.rotation += (dx >= 0 ? 1 : -1) * (moved / 8);
        this.lastBall = { x, y };

        const free = shootout || this.ballFree;
        const last = this.trail.at(-1);
        // bola dominada ou "teleporte" (saída depois do gol): sem rastro
        if (!free || (last && Math.hypot(x - last.x, y - last.y) > 90)) this.trail.length = 0;
        if (free && (!last || last.x !== x || last.y !== y)) this.trail.push({ x, y, tick: this.playTick });
        while (this.trail.length && this.playTick - this.trail[0].tick > TRAIL_TICKS) this.trail.shift();

        const g = this.trailG.clear();
        const n = this.trail.length;
        if (n < 2) return;
        g.setDepth(BALL_DEPTH - 2);
        for (let i = 1; i < n; i++) {
            const k = i / (n - 1);
            g.lineStyle(1.5 + 5 * k, this.ballColor, 0.08 + 0.42 * k);
            g.lineBetween(this.trail[i - 1].x, this.trail[i - 1].y, this.trail[i].x, this.trail[i].y);
        }
    }

    /** Chute com golpe: brilho na bola e rastro na cor do tipo. */
    private updateBallFx(type: string, x: number, y: number) {
        if (!type) {
            this.ballGlow.setAlpha(0);
            this.ballColor = 0xffffff;
            return;
        }
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
        this.ballColor = color;
        this.ballGlow
            .setPosition(x, y)
            .setFillStyle(color, 0.55)
            .setAlpha(1)
            .setDepth(this.ball.depth - 1);
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
        EventBus.emit('match:ended');
    }

    // ------------------------------------------------------------------ eventos
    private handleEvent(e: MatchEvent, silent: boolean) {
        EventBus.emit('match:event', e);
        if (IMPORTANT.has(e.type)) this.recentImportantTick = e.tick;
        if (e.type === 'sub') {
            const view = this.players[e.outIdx];
            if (view) {
                const at = { x: view.sprite.x, y: view.sprite.y };
                createSpeciesAnims(this, e.inSpeciesId);
                this.swapSpecies(view, e.inSpeciesId, e.in, e.inShiny);
                this.updateUiScale();
                if (!silent) {
                    // quem sai anda até a lateral (perto do banco do time); quem entra sai de lá e vai para a quadra
                    playSfx('whistle');
                    this.walkSub(view, e.outSpeciesId, at);
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
                const ready = this.textures.exists(atlasKey(e.into));
                if (ready) createSpeciesAnims(this, e.into);
                const newName = view.name === species(e.from).name ? species(e.into).name : view.name;
                // sem a forma nova carregada (rede lenta), troca direto sem a animação
                if (silent || !ready) this.finishEvolution(view, e.into, newName);
                // a tela cheia ("Parabéns!") é só do seu time; a do rival é na quadra, sem parar a partida
                else if (view.team === 1) this.evolveOnField(view, e.into, newName);
                else this.evolveAnimation(view, e.from, e.into, newName);
            }
        }
        // Ditto vira a cópia; ao vivo quem troca é a animação de Transformar (pisca em branco antes, ver abaixo)
        if (e.type === 'transform' && silent) this.becomeCopy(e.by, e.into, e.target);
        if (silent) return;
        // intervalo: a partida para e o técnico decide (tática, substituição) antes do 2º tempo
        if (e.type === 'halftime') {
            this.paused = true;
            EventBus.emit('match:halftime');
        }
        const cries = this.md.cries;
        const cinematic = this.md.cinematic;
        switch (e.type) {
            case 'kickoff':
            case 'halftime':
                // saída de bola e intervalo: o motor limpa as zonas do chão (setupKickoff)
                this.endZoneViews(e.tick);
                playSfx('whistle');
                break;
            case 'fulltime':
                playSfx('whistle');
                break;
            case 'pass':
                playSfx('kick');
                this.kickPop(this.ball.x, this.ball.y + 4, 1.25, 3);
                break;
            case 'shot':
                playSfx('shot');
                // chute: estalo maior, mais poeira e um toque na câmera quando é chute forte
                this.kickPop(this.ball.x, this.ball.y + 4, 1.45, 6);
                if (e.xg >= 0.25) this.punch('touch');
                break;
            case 'save': {
                playSfx('save');
                const gk = this.players[e.by];
                if (gk) this.highlight('save', gk);
                if (cinematic && gk) {
                    this.cine.drama(tr('battle.bigSave'), {
                        color: '#9be7ff',
                        stroke: '#0b2a4a',
                        at: { x: gk.sprite.x, y: gk.sprite.y },
                        sub: gk.name,
                    });
                } else this.popText(e.by, tr('battle.save'), '#9be7ff');
                break;
            }
            case 'post': {
                playSfx('post');
                if (cinematic) {
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
                playSfx('goal', e.team === 0 ? 2 ** ((e.score[0] - 1) / 12) : 0.9);
                const scorer = this.players[e.by];
                if (scorer) {
                    playCry(scorer.speciesId, cries, 1.2);
                    this.highlight(e.ownGoal ? 'owngoal' : 'goal', scorer);
                }
                this.punch(this.goalLevel(e));
                const color = Phaser.Display.Color.IntegerToColor(this.md.colors[e.team]).rgba;
                if (cinematic) {
                    this.cine.drama(e.ownGoal ? tr('battle.ownGoal') : tr('battle.goal'), {
                        color: '#ffffff',
                        stroke: color,
                        at: { x: this.ball.x, y: this.ball.y },
                        sub: scorer ? scorer.name : undefined,
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
                        duration: 140,
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
                    if (e.status !== 'flinch' && e.status !== 'seed') {
                        this.applyIndicators(view, STATUS_KIND_TO_CODE[e.status] ?? 0, view.flags);
                    }
                }
                break;
            }
            case 'knockback': {
                const view = this.players[e.target];
                const type = MOVES[e.moveId]?.type ?? 'Normal';
                if (view) this.impact(view.sprite.x, view.sprite.y - 16, type);
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
                                scaleX: SPRITE_SCALE * x,
                                scaleY: SPRITE_SCALE * y,
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
                    sp.setScale(SPRITE_SCALE * 0.2);
                    this.tweens.add({ targets: sp, scale: SPRITE_SCALE, duration: 420, ease: 'Back.easeOut' });
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
                this.popText(e.by, '★', '#ffd447');
                if (view) this.battleBox.push(tr('battle.ability', { x: view.name }));
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
            case 'tactic':
                playSfx('whistle');
                break;
            case 'penalty':
                playSfx(e.scored ? 'goal' : 'save');
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

    /** Substituição andando: a partida para enquanto quem sai vai até a lateral e quem entra vem de lá. */
    private walkSub(view: PlayerView, outSpecies: number, at: { x: number; y: number }) {
        const top = toPx(0, 0).y;
        const bench = { x: GAME_W / 2 + (view.team === 0 ? -70 : 70), y: top - 14 };
        const now = this.time.now;
        const outMs = 1100;
        const inMs = 1300;
        this.holdReal = Math.max(this.holdReal, now + outMs + inMs - 200);
        // fantasma de quem sai, andando até a lateral
        const walk = resolveAnim(outSpecies, 'Walk');
        const facing = dir8({ x: bench.x - at.x, y: bench.y - at.y }, 4);
        const ghost = this.add
            .sprite(at.x, at.y, atlasKey(outSpecies))
            .setScale(SPRITE_SCALE)
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
        view.enter = { from: bench, start: now + outMs - 200, dur: inMs };
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
        view.sprite.setScale(SPRITE_SCALE * 1.3);
        this.tweens.add({ targets: view.sprite, scale: SPRITE_SCALE, duration: 420, ease: 'Back.easeOut' });
        this.impact(view.sprite.x, view.sprite.y - 16, species(into).types[0]);
        this.battleBox.push(
            tr(view.team === 1 ? 'battle.evolvedRival' : 'battle.evolved', { x: oldName, y: species(into).name }),
        );
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

    private popText(idx: number, text: string, color: string) {
        const view = this.players[idx];
        if (!view) return;
        const s = Math.min(this.uiScale, 2);
        const t = this.add
            .text(view.sprite.x, view.sprite.y - 52, text, {
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
        this.tweens.add({
            targets: t,
            y: t.y - 22,
            alpha: 0,
            duration: 1100,
            ease: 'Cubic.easeOut',
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

    /** Aplica um nível de impacto: pausa curta (tempo real), tremida que decai e clarão. */
    private punch(level: ImpactLevel) {
        const fx = IMPACT[level];
        const cam = this.cameras.main;
        if (fx.stop) this.holdReal = Math.max(this.holdReal, this.time.now + fx.stop);
        if (fx.shake[0]) cam.shake(fx.shake[0], fx.shake[1]);
        if (fx.flash) cam.flash(fx.flash, 255, 255, 255);
    }

    /** Peso do gol: do rival = toque; seu = batida; virada, empate no fim ou gol na final = explosão. */
    private goalLevel(e: Extract<MatchEvent, { type: 'goal' }>): ImpactLevel {
        if (e.team !== 0) return 'touch';
        const [mine, theirs] = e.score;
        const late = e.minute >= 35;
        // virada: passou à frente depois de ter estado atrás em algum momento
        const wasBehind = this.matchEvents.some((g) => g.type === 'goal' && g.tick < e.tick && g.score[1] > g.score[0]);
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
            baseScale: SPRITE_SCALE,
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

    private goalBanner(stroke: string) {
        const t = this.add
            .text(GAME_W / 2, GAME_H / 2, tr('battle.goalBanner'), {
                fontFamily: 'Galmuri11, monospace',
                fontSize: '72px',
                fontStyle: 'bold',
                color: '#ffffff',
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
