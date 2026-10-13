import Phaser from 'phaser';
import { FUTSAL_5 } from '../../engine/config';
import { MOVES, species } from '../../engine/data';
import { ITEMS } from '../../engine/items';
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
import type { CryStyle, PlaybackSpeed } from '../../store/game-store';
import { hexToNumber, TYPE_COLOR } from '../../ui/type-colors';
import {
    animForAction,
    atlasKey,
    createSpeciesAnims,
    preloadSpecies,
    resolveAnim,
    shadowSize,
} from '../animation-manager';
import { playCry, playSfx } from '../audio';
import { BattleBox } from '../battle-box';
import { Cinematics, FOCUS_DEPTH } from '../cinematics';
import { drawCourt, ensureBallTexture, GAME_H, GAME_W, PPM, toPx } from '../court';
import { EventBus } from '../EventBus';

export { GAME_H, GAME_W } from '../court';

export interface MatchSceneData {
    result: MatchResult;
    colors: [number, number];
    cries: CryStyle;
    speed: PlaybackSpeed;
    cinematic: boolean;
    /** Espécies que podem entrar em campo (bancos inteiros): pré-carregadas para substituições. */
    extraSpecies?: number[];
}

type PenaltyEvent = Extract<MatchEvent, { type: 'penalty' }>;

const SPRITE_SCALE = 1.8;
const TICK_RATE = FUTSAL_5.tickRate;
/** Ticks antes de gol/trave/defesa em que a câmera lenta começa. */
const DRAMA_LEAD = 12;

const IMPORTANT = new Set([
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

/** Partícula do Showdown por tipo do golpe. */
const FX_BY_TYPE: Record<string, string> = {
    Fire: 'fireball',
    Water: 'waterwisp',
    Electric: 'lightning',
    Grass: 'leaf1',
    Ice: 'icicle',
    Fighting: 'fist',
    Poison: 'poisonwisp',
    Ground: 'mudwisp',
    Flying: 'feather',
    Psychic: 'mistball',
    Bug: 'web',
    Rock: 'rock1',
    Ghost: 'shadowball',
    Dragon: 'bluefireball',
    Normal: 'impact',
    Steel: 'sword',
    Fairy: 'heart',
    Dark: 'shadowball',
};

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
    currentKey: string;
    status: number;
    flags: number;
    /** Deslocamento temporário do sprite (investida do golpe). */
    lunge: { x: number; y: number };
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
    private battleBox!: BattleBox;
    private cine!: Cinematics;
    private ended = false;
    private lastEmit = 0;
    private lastTrail = 0;
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
        for (const fx of new Set(Object.values(FX_BY_TYPE))) {
            if (!this.textures.exists(`fx-${fx}`)) this.load.image(`fx-${fx}`, `assets/fx/${fx}.png`);
        }
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
        this.ballGlow = this.add.circle(0, 0, 13, 0xffffff, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.ball = this.add.image(0, 0, 'ball');
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
        this.unbind = () => {
            EventBus.off('match:seek-fulltime', this.onSeekFulltime, this);
            EventBus.off('match:set-speed', this.onSpeed, this);
            EventBus.off('match:skip', this.onSkip, this);
            EventBus.off('match:hold', this.onHold, this);
            EventBus.off('match:replace', this.onReplace, this);
            this.scale.off('resize', onResize);
        };
        this.sys.events.once('shutdown', () => this.unbind?.());
        this.sys.events.once('destroy', () => this.unbind?.());

        playSfx('whistle');
        this.applySnapshot(0, 0);
        EventBus.emit('current-scene-ready', this);
    }

    private allSpecies(): Set<number> {
        const { result, extraSpecies = [] } = this.md;
        return new Set([...result.roster, ...result.finalRoster].map((p) => p.speciesId).concat(extraSpecies));
    }

    private setTimeline(result: MatchResult) {
        this.snaps = result.snapshots;
        this.matchEvents = result.events;
        this.lastEventTick = this.matchEvents.at(-1)?.tick ?? 0;
        this.importantTicks = this.matchEvents.filter((e) => IMPORTANT.has(e.type)).map((e) => e.tick);
        this.dramaTicks = this.matchEvents.filter((e) => DRAMA.has(e.type)).map((e) => e.tick);
        this.penalties = this.matchEvents.filter((e): e is PenaltyEvent => e.type === 'penalty');
        this.fulltimeTick = this.matchEvents.find((e) => e.type === 'fulltime')?.tick ?? Number.POSITIVE_INFINITY;
        this.penaltyStage = this.penalties.map((_, i) => this.penaltyStage[i] ?? 0);
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

    /** (dev) Vai para 2 s antes do apito final, sem tocar os eventos pulados. */
    private onSeekFulltime() {
        if (!Number.isFinite(this.fulltimeTick)) return;
        this.playTick = this.fulltimeTick - TICK_RATE * 2;
        this.eventCursor = this.matchEvents.findIndex((e) => e.tick > this.playTick);
        if (this.eventCursor < 0) this.eventCursor = this.matchEvents.length;
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
        const sprite = this.add.sprite(0, 0, atlasKey(speciesId)).setScale(SPRITE_SCALE).setOrigin(0.5, 0.78);
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
            currentKey: '',
            status: -1,
            flags: -1,
            lunge: { x: 0, y: 0 },
        };
        this.refreshTint(view);
        return view;
    }

    private swapSpecies(view: PlayerView, speciesId: number, name: string, shiny: boolean) {
        view.speciesId = speciesId;
        view.name = name;
        view.shiny = shiny;
        view.captain = false;
        view.sprite.setTexture(atlasKey(speciesId));
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
        if (this.ended || !this.snaps.length) return;
        const factor = this.currentSpeedFactor(time);
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
        if (anim !== undefined && facing !== undefined) {
            const key = `${view.speciesId}/${resolveAnim(view.speciesId, anim)}/${facing}`;
            if (key !== view.currentKey) {
                view.sprite.play(key);
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
            onUpdate: () => {
                this.ball.rotation += 0.4;
                this.ballShadow.setPosition(this.ball.x + 2, this.ball.y + 6);
            },
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
        this.ball.setPosition(spot.x, spot.y - 4).setDepth(spot.y + 1);
        this.ballShadow.setPosition(spot.x + 2, spot.y + 2);
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
        for (let i = 0; i < this.players.length; i++) {
            const view = this.players[i];
            const o = i * SNAP_STRIDE;
            const x = a.p[o] + (b.p[o] - a.p[o]) * k;
            const y = a.p[o + 1] + (b.p[o + 1] - a.p[o + 1]) * k;
            const facing = near.p[o + 2];
            const action = near.p[o + 3];
            const px = toPx(x, y);
            // em destaque (holofote): acima do escurecimento
            const focused = this.cine.focused.has(i);
            const base = focused ? FOCUS_DEPTH + px.y / 100 : px.y;
            view.sprite.setPosition(px.x + view.lunge.x, px.y + view.lunge.y).setDepth(base);
            view.shadow.setPosition(px.x, px.y + 1).setDepth(base - 2);
            view.ring.setPosition(px.x, px.y + 1).setDepth(base - 1);
            const labelDepth = focused ? FOCUS_DEPTH + 60 : 5000;
            view.label.setPosition(px.x, px.y + 6).setDepth(labelDepth);
            view.badge.setPosition(px.x, px.y + 6 + view.label.height).setDepth(labelDepth + 1);
            if (focused) focusPos.set(i, px);
            this.applyIndicators(view, near.p[o + 4], near.p[o + 5]);

            const anim = resolveAnim(view.speciesId, animForAction(action));
            const key = `${view.speciesId}/${anim}/${facing}`;
            if (key !== view.currentKey) {
                view.sprite.play(key);
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
        this.ball.setPosition(bp.x, bp.y - 4).setDepth(bp.y + 1);
        this.ball.rotation += ((b.bx - a.bx) * PPM) / 30;
        this.ballShadow.setPosition(bp.x + 2, bp.y + 2).setDepth(bp.y - 3);
        this.updateBallFx(near.bfx, bp.x, bp.y - 4);
    }

    /** Chute com golpe: brilho e rastro na cor do tipo. */
    private updateBallFx(type: string, x: number, y: number) {
        if (!type) {
            this.ballGlow.setAlpha(0);
            return;
        }
        const color = hexToNumber(TYPE_COLOR[type] ?? '#ffffff');
        this.ballGlow
            .setPosition(x, y)
            .setFillStyle(color, 0.55)
            .setAlpha(1)
            .setDepth(this.ball.depth - 1);
        const now = this.time.now;
        if (now - this.lastTrail < 25) return;
        this.lastTrail = now;
        const dot = this.add
            .circle(x, y, 7, color, 0.8)
            .setDepth(this.ball.depth - 2)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: dot, scale: 0.1, alpha: 0, duration: 380, onComplete: () => dot.destroy() });
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
            const incoming = this.md.result.finalRoster[e.outIdx];
            this.swapSpecies(this.players[e.outIdx], incoming.speciesId, incoming.name, incoming.shiny);
            this.updateUiScale();
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
                if (scorer) playCry(scorer.speciesId, cries, 1.2);
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
                this.moveFx(e.by, moveType, e.target, cinematic);
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

    /** Animação do golpe: pulso no Pokémon, anéis de aura, explosão de partículas e projétil até o alvo. */
    private moveFx(by: number, moveType: string, target: number | null, strong: boolean) {
        const from = this.players[by];
        const to = target !== null ? this.players[target] : null;
        const color = hexToNumber(TYPE_COLOR[moveType] ?? '#ffffff');
        const key = `fx-${FX_BY_TYPE[moveType] ?? 'impact'}`;
        const depth = FOCUS_DEPTH + 70;
        const x = from.sprite.x;
        const y = from.sprite.y - 14;

        if (strong) {
            this.tweens.add({
                targets: from.sprite,
                scale: SPRITE_SCALE * 1.28,
                duration: 160,
                yoyo: true,
                ease: 'Quad.easeOut',
                onComplete: () => from.sprite.setScale(SPRITE_SCALE),
            });
        }
        const rings = strong ? 3 : 1;
        for (let i = 0; i < rings; i++) {
            const aura = this.add.circle(x, y, 16, color, 0.5).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
            this.tweens.add({
                targets: aura,
                scale: 2.6,
                alpha: 0,
                delay: i * 120,
                duration: 560,
                onComplete: () => aura.destroy(),
            });
        }
        if (!this.textures.exists(key)) return;
        if (strong) {
            // explosão radial de partículas do tipo
            for (let i = 0; i < 7; i++) {
                const ang = (i / 7) * Math.PI * 2;
                const p = this.add
                    .image(x, y, key)
                    .setDepth(depth)
                    .setScale(0.35)
                    .setTint(color)
                    .setBlendMode(Phaser.BlendModes.ADD);
                this.tweens.add({
                    targets: p,
                    x: x + Math.cos(ang) * 46,
                    y: y + Math.sin(ang) * 30,
                    alpha: 0,
                    scale: 0.6,
                    duration: 520,
                    ease: 'Cubic.easeOut',
                    onComplete: () => p.destroy(),
                });
            }
        }
        const fx = this.add
            .image(x, y - 2, key)
            .setDepth(depth + 1)
            .setScale(strong ? 0.9 : 0.7)
            .setTint(color)
            .setBlendMode(Phaser.BlendModes.ADD);
        if (to) {
            const trail = this.time.addEvent({
                delay: 30,
                repeat: 12,
                callback: () => {
                    const d = this.add
                        .circle(fx.x, fx.y, 6, color, 0.7)
                        .setDepth(depth)
                        .setBlendMode(Phaser.BlendModes.ADD);
                    this.tweens.add({ targets: d, alpha: 0, scale: 0.2, duration: 300, onComplete: () => d.destroy() });
                },
            });
            this.tweens.add({
                targets: fx,
                x: to.sprite.x,
                y: to.sprite.y - 16,
                scale: strong ? 1.3 : 1,
                duration: 380,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    trail.remove();
                    this.impact(fx.x, fx.y, moveType);
                    // alvo pisca em branco no impacto
                    to.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
                    this.time.delayedCall(130, () => {
                        to.sprite.setTintMode(Phaser.TintModes.MULTIPLY);
                        this.refreshTint(to);
                    });
                    this.tweens.add({
                        targets: fx,
                        alpha: 0,
                        scale: 1.8,
                        duration: 250,
                        onComplete: () => fx.destroy(),
                    });
                },
            });
        } else {
            this.tweens.add({
                targets: fx,
                scale: strong ? 1.8 : 1.4,
                alpha: 0,
                y: fx.y - 24,
                duration: 650,
                onComplete: () => fx.destroy(),
            });
        }
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
