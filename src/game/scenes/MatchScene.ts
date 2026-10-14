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
    FLAG_DEBUFF,
    type MatchEvent,
    type MatchSnapshot,
    SNAP_STRIDE,
} from '../../engine/state';
import { dir8 } from '../../engine/vec';
import type { CryStyle, PlaybackSpeed } from '../../store/game-store';
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
    /** Espécies que podem entrar em campo (bancos inteiros): pré-carregadas para substituições. */
    extraSpecies?: number[];
    /** Começa parada (tela de VERSUS); a partida só rola depois de 'match:resume'. */
    startPaused?: boolean;
    /** Retomando uma partida: começa deste tick (os eventos anteriores são aplicados sem animação). */
    startTick?: number;
}

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

const STATUS_PT: Record<string, string> = {
    par: 'foi paralisado!',
    slp: 'caiu no sono!',
    psn: 'foi envenenado!',
    brn: 'foi queimado!',
    frz: 'foi congelado!',
    confusion: 'ficou confuso!',
    infatuation: 'se apaixonou!',
    flinch: 'hesitou!',
};

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
    private ballColor = 0xffffff;
    private lastBall = { x: 0, y: 0 };
    private dives: DiveInfo[] = [];
    /** Deslocamento suavizado da bola em relação a quem conduz. */
    private dribble = { owner: -1, x: 0, y: 0, tick: 0 };
    /** Até quando (tempo real) a partida fica parada para a animação de evolução. */
    private holdReal = 0;
    private battleBox!: BattleBox;
    private cine!: Cinematics;
    private ended = false;
    private lastEmit = 0;
    private recentImportantTick = Number.NEGATIVE_INFINITY;
    private importantTicks: number[] = [];
    private dramaTicks: number[] = [];
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
        this.unbind = () => {
            EventBus.off('match:seek-fulltime', this.onSeekFulltime, this);
            EventBus.off('match:resume', this.onResume, this);
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
        this.penalties = this.matchEvents.filter((e): e is PenaltyEvent => e.type === 'penalty');
        this.dives = this.matchEvents.flatMap((e) => (e.type === 'save' ? [{ tick: e.tick, gk: e.by, at: null }] : []));
        this.fulltimeTick = this.matchEvents.find((e) => e.type === 'fulltime')?.tick ?? Number.POSITIVE_INFINITY;
        this.penaltyStage = this.penalties.map((_, i) => this.penaltyStage[i] ?? 0);
    }

    private paused = false;

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
            .setResolution(2);
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
        };
        this.refreshTint(view);
        return view;
    }

    /** Setinha do seu time: logo acima da cabeça (topo visível do sprite no Idle). */
    private placeArrow(view: PlayerView, x: number, y: number, depth: number) {
        if (!view.arrow) return;
        const h = view.sprite.frame.realHeight * view.sprite.scaleY;
        const head = y - (view.sprite.originY - headTop(view.speciesId)) * h;
        view.arrow.setPosition(x, head - 7).setDepth(depth);
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
        if (st && view.status !== 6) view.sprite.setTint(st.tint);
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
        this.refreshTint(view);
    }

    // ------------------------------------------------------------------ playback
    update(time: number, delta: number) {
        if (this.ended || !this.snaps.length || this.paused) return;
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
        view.badge.setPosition(px.x, px.y + 6 + view.label.height).setDepth(5001);
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
        this.battleBox.push('Disputa de pênaltis!');
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
        this.battleBox.push(`${this.players[pen.by]?.name ?? '?'} vai para a bola...`);
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
        for (let i = 0; i < this.players.length; i++) {
            const view = this.players[i];
            const o = i * SNAP_STRIDE;
            const x = a.p[o] + (b.p[o] - a.p[o]) * k;
            const y = a.p[o + 1] + (b.p[o + 1] - a.p[o + 1]) * k;
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
            view.shadow.setPosition(px.x, px.y + 1).setDepth(base - 2);
            view.ring.setPosition(px.x, px.y + 1).setDepth(base - 1);
            const labelDepth = focused ? FOCUS_DEPTH + 60 : 5000;
            view.label.setPosition(px.x, px.y + 6).setDepth(labelDepth);
            view.badge.setPosition(px.x, px.y + 6 + view.label.height).setDepth(labelDepth + 1);
            this.placeArrow(view, px.x, px.y, labelDepth - 1);
            if (focused) focusPos.set(i, px);
            this.applyIndicators(view, near.p[o + 4], near.p[o + 5]);

            const anim = resolveAnim(view.speciesId, dive ? 'Attack' : animForAction(action));
            const key = `${view.speciesId}/${anim}/${dive ? dive.facing : facing}`;
            if (key !== view.currentKey && !view.evolving) {
                view.sprite.play(key).setOrigin(0.5, footOrigin(view.speciesId, anim));
                view.currentKey = key;
            }
            const dx = (b.p[o] - a.p[o]) * PPM;
            const dy = (b.p[o + 1] - a.p[o + 1]) * PPM;
            const pxPerTick = Math.hypot(dx, dy) / Math.max(1, b.tick - a.tick);
            // a animação acompanha a velocidade real: Pokémon rápidos "pedalam" mais rápido
            const pace = action === Action.Run ? Phaser.Math.Clamp(pxPerTick / 2.5, 0.5, 2) : 1;
            view.sprite.anims.timeScale = pace * Phaser.Math.Clamp(factor, 0.3, 4);
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
        this.ball.setPosition(bp.x, bp.y - 4 - lift).setScale(1 + bz * 0.3);
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
                createSpeciesAnims(this, e.inSpeciesId);
                this.swapSpecies(view, e.inSpeciesId, e.in, e.inShiny);
                this.updateUiScale();
                if (!silent) {
                    // quem entra chega com uma "fumacinha" e a faixa mostra quem sai e quem entra
                    playSfx('whistle');
                    this.impact(view.sprite.x, view.sprite.y - 16, 'Normal');
                    view.sprite.setScale(SPRITE_SCALE * 0.2);
                    this.tweens.add({ targets: view.sprite, scale: SPRITE_SCALE, duration: 380, ease: 'Back.easeOut' });
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
                else this.evolveAnimation(view, e.from, e.into, newName);
            }
        }
        if (e.type === 'transform') {
            // Ditto vira a cópia; mantém o nome e o "capitão"
            const view = this.players[e.by];
            if (view) {
                const captain = view.captain;
                this.swapSpecies(view, e.into, view.name, this.players[e.target]?.shiny ?? false);
                view.captain = captain;
                if (captain) view.label.setText(`C·${view.name}`).setColor('#ffd447');
                createSpeciesAnims(this, e.into);
            }
        }
        if (silent) return;
        const cries = this.md.cries;
        const cinematic = this.md.cinematic;
        switch (e.type) {
            case 'kickoff':
            case 'halftime':
            case 'fulltime':
                playSfx('whistle');
                break;
            case 'pass':
                playSfx('kick');
                break;
            case 'shot':
                playSfx('shot');
                break;
            case 'save': {
                playSfx('save');
                const gk = this.players[e.by];
                if (gk) this.highlight('save', gk);
                if (cinematic && gk) {
                    this.cine.drama('QUE DEFESA!', {
                        color: '#9be7ff',
                        stroke: '#0b2a4a',
                        at: { x: gk.sprite.x, y: gk.sprite.y },
                        sub: gk.name,
                    });
                } else this.popText(e.by, 'DEFESA!', '#9be7ff');
                break;
            }
            case 'post': {
                playSfx('post');
                if (cinematic) {
                    this.cine.drama('NA TRAAAVE!', {
                        color: '#ffffff',
                        stroke: '#8a1c1c',
                        at: { x: this.ball.x, y: this.ball.y },
                    });
                } else this.popText(e.shooter, 'TRAVE!', '#ffffff');
                break;
            }
            case 'goal': {
                playSfx('goal');
                const scorer = this.players[e.by];
                if (scorer) {
                    playCry(scorer.speciesId, cries, 1.2);
                    this.highlight(e.ownGoal ? 'owngoal' : 'goal', scorer);
                }
                this.cameras.main.flash(250, 255, 255, 255);
                const color = Phaser.Display.Color.IntegerToColor(this.md.colors[e.team]).rgba;
                if (cinematic) {
                    this.cine.drama(e.ownGoal ? 'GOL CONTRA!' : 'GOOOOOL!', {
                        color: '#ffffff',
                        stroke: color,
                        at: { x: this.ball.x, y: this.ball.y },
                        sub: scorer ? scorer.name : undefined,
                    });
                } else {
                    this.cameras.main.shake(350, 0.006);
                    this.goalBanner(color);
                }
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
                if (!cinematic) this.battleBox.push(`${view.name} usou ${move?.name ?? e.moveId}!`);
                if (e.kind === 'flavor' && e.moveId === 'splash') this.battleBox.push('Mas nada aconteceu!');
                else if (e.target !== null && !e.hit) this.battleBox.push('Mas errou!');
                else if (e.effectiveness !== null && e.effectiveness >= 1.12) {
                    this.battleBox.push('É super efetivo!');
                    if (e.target !== null) this.popText(e.target, 'SUPER EFETIVO!', '#ffd447');
                } else if (e.effectiveness !== null && e.effectiveness < 1)
                    this.battleBox.push('Não é muito efetivo...');
                break;
            }
            case 'status': {
                playSfx('status');
                const view = this.players[e.target];
                if (view) {
                    this.battleBox.push(`${view.name} ${STATUS_PT[e.status] ?? '!'}`);
                    if (e.status !== 'flinch') {
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
                playSfx('status');
                playCry(e.into, cries, 0.8);
                this.impact(view.sprite.x, view.sprite.y - 16, 'Normal');
                view.sprite.setScale(SPRITE_SCALE * 0.2);
                this.tweens.add({ targets: view.sprite, scale: SPRITE_SCALE, duration: 420, ease: 'Back.easeOut' });
                const into = species(e.into).name;
                this.battleBox.push(`${view.name} se transformou em ${into}!`);
                if (cinematic) {
                    this.cine.drama('TRANSFORMAR!', {
                        color: '#d9a7ff',
                        stroke: '#2a0b4a',
                        at: { x: view.sprite.x, y: view.sprite.y },
                        sub: `${view.name} virou ${into}`,
                    });
                } else this.popText(e.by, `→ ${into}`, '#d9a7ff');
                break;
            }
            case 'combo': {
                const link = LINKS.find((l) => l.id === e.link);
                const a = this.players[e.partner];
                const b = this.players[e.by];
                playSfx('move');
                if (b) playCry(b.speciesId, cries, 0.8);
                this.popText(e.partner, 'COMBO!', '#ffd447');
                this.popText(e.by, 'COMBO!', '#ffd447');
                if (link && a && b) {
                    this.battleBox.push(`Combo ${link.name}: ${a.name} + ${b.name}!`);
                    if (cinematic) {
                        this.cine.drama(link.combo.toUpperCase(), {
                            color: '#ffd447',
                            stroke: '#4a2a00',
                            at: { x: b.sprite.x, y: b.sprite.y },
                            sub: `Combo ${link.name}: ${a.name} + ${b.name}`,
                        });
                    }
                }
                break;
            }
            case 'ability': {
                const view = this.players[e.by];
                this.popText(e.by, '★', '#ffd447');
                if (view) this.battleBox.push(`Habilidade de ${view.name} ativada!`);
                break;
            }
            case 'item': {
                const view = this.players[e.by];
                const item = ITEMS[e.item]?.name ?? e.item;
                this.popText(e.by, item, '#7dff8a');
                if (view) {
                    this.battleBox.push(
                        e.effect === 'crit'
                            ? `Chute crítico de ${view.name}!`
                            : `${item} de ${view.name} entrou em ação!`,
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
                    this.cine.drama(e.scored ? 'É GOL!' : 'PEGOU!', {
                        color: e.scored ? '#ffffff' : '#9be7ff',
                        stroke: '#000000',
                        sub: `${e.shootout[0]} x ${e.shootout[1]}`,
                    });
                }
                break;
        }
    }

    /**
     * "X está evoluindo!": a partida para, o Pokémon vira uma silhueta branca que alterna entre a forma
     * antiga e a nova cada vez mais rápido, um clarão, e aparece a forma nova (como nos jogos).
     */
    private evolveAnimation(view: PlayerView, from: number, into: number, newName: string) {
        const oldName = view.name;
        const facing = view.currentKey.split('/')[2] ?? '0';
        const total = 3000;
        this.holdReal = this.time.now + total + 600;
        view.evolving = true;
        playSfx('status');
        playCry(from, this.md.cries, 0.9);
        this.battleBox.push(`O quê? ${oldName} está evoluindo!`);
        if (this.md.cinematic) {
            this.cine.drama('EVOLUINDO!', {
                color: '#ffffff',
                stroke: '#5a3fb0',
                at: { x: view.sprite.x, y: view.sprite.y },
                sub: `${oldName} está evoluindo!`,
            });
        } else this.popText(this.players.indexOf(view), 'EVOLUINDO!', '#ffffff');

        const show = (id: number) => {
            const anim = resolveAnim(id, 'Idle');
            view.sprite.play(`${id}/${anim}/${facing}`).setOrigin(0.5, footOrigin(id, anim));
        };
        view.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        // alterna antiga/nova, cada vez mais rápido
        const steps = [380, 330, 280, 240, 200, 170, 140, 115, 95, 80, 65, 55, 50, 45, 45, 45];
        let at = 250;
        steps.forEach((dt, i) => {
            at += dt;
            this.time.delayedCall(at, () => {
                if (!view.evolving) return;
                show(i % 2 === 0 ? into : from);
                view.sprite.setScale(SPRITE_SCALE * (i % 2 === 0 ? 1.12 : 0.95));
            });
        });
        this.time.delayedCall(total, () => {
            if (!view.evolving) return;
            this.cameras.main.flash(380, 255, 255, 255);
            view.sprite.setTintMode(Phaser.TintModes.MULTIPLY).setScale(SPRITE_SCALE * 1.25);
            this.tweens.add({ targets: view.sprite, scale: SPRITE_SCALE, duration: 420, ease: 'Back.easeOut' });
            this.finishEvolution(view, into, newName);
            playCry(into, this.md.cries, 1.1);
            this.battleBox.push(`Parabéns! ${oldName} evoluiu para ${species(into).name}!`);
            const h: MatchHighlight = {
                kind: 'evolve',
                team: view.team,
                speciesId: into,
                shiny: view.shiny,
                name: newName,
                outSpeciesId: from,
                outName: oldName,
            };
            EventBus.emit('match:highlight', h);
        });
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
        this.cameras.main.shake(120, 0.003);
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
        });
    }

    private goalBanner(stroke: string) {
        const t = this.add
            .text(GAME_W / 2, GAME_H / 2, 'GOL!', {
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
