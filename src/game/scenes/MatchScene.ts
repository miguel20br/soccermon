import Phaser from 'phaser';
import { FUTSAL_5 } from '../../engine/config';
import { MOVES, species } from '../../engine/data';
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
import { drawCourt, ensureBallTexture, GAME_H, GAME_W, PPM, toPx } from '../court';
import { EventBus } from '../EventBus';

export { GAME_H, GAME_W } from '../court';

export interface MatchSceneData {
    result: MatchResult;
    colors: [number, number];
    cries: CryStyle;
    speed: PlaybackSpeed;
}

const SPRITE_SCALE = 1.8;
const TICK_RATE = FUTSAL_5.tickRate;

const IMPORTANT = new Set([
    'shot',
    'goal',
    'save',
    'post',
    'penalty',
    'status',
    'move',
    'halftime',
    'fulltime',
    'kickoff',
]);

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
    sprite: Phaser.GameObjects.Sprite;
    shadow: Phaser.GameObjects.Ellipse;
    ring: Phaser.GameObjects.Ellipse;
    label: Phaser.GameObjects.Text;
    badge: Phaser.GameObjects.Text;
    currentKey: string;
    status: number;
    flags: number;
}

export class MatchScene extends Phaser.Scene {
    private md!: MatchSceneData;
    private snaps: MatchSnapshot[] = [];
    private matchEvents: MatchEvent[] = [];
    private eventCursor = 0;
    private playTick = 0;
    private lastEventTick = 0;
    private speed: PlaybackSpeed = 1;
    private players: PlayerView[] = [];
    private ball!: Phaser.GameObjects.Image;
    private ballGlow!: Phaser.GameObjects.Arc;
    private ballShadow!: Phaser.GameObjects.Ellipse;
    private battleBox!: BattleBox;
    private ended = false;
    private lastEmit = 0;
    private lastTrail = 0;
    private recentImportantTick = -Infinity;
    private importantTicks: number[] = [];
    private unbind?: () => void;

    constructor() {
        super('Match');
    }

    preload() {
        this.md = this.registry.get('matchData') as MatchSceneData;
        const ids = new Set([...this.md.result.roster, ...this.md.result.finalRoster].map((p) => p.speciesId));
        for (const id of ids) preloadSpecies(this, id);
        for (const fx of new Set(Object.values(FX_BY_TYPE))) {
            if (!this.textures.exists(`fx-${fx}`)) this.load.image(`fx-${fx}`, `assets/fx/${fx}.png`);
        }
    }

    create() {
        const { result } = this.md;
        this.snaps = result.snapshots;
        this.matchEvents = result.events;
        this.speed = this.md.speed;
        this.playTick = this.snaps[0]?.tick ?? 0;
        this.lastEventTick = this.matchEvents.at(-1)?.tick ?? 0;
        this.importantTicks = this.matchEvents.filter((e) => IMPORTANT.has(e.type)).map((e) => e.tick);

        drawCourt(this);
        ensureBallTexture(this);
        for (const p of result.roster) {
            createSpeciesAnims(this, p.speciesId);
            this.players.push(this.createPlayerView(p.speciesId, p.team, p.name, p.shiny));
        }
        for (const p of result.finalRoster) createSpeciesAnims(this, p.speciesId);

        this.ballShadow = this.add.ellipse(0, 0, 14, 6, 0x000000, 0.35);
        this.ballGlow = this.add.circle(0, 0, 13, 0xffffff, 0).setBlendMode(Phaser.BlendModes.ADD);
        this.ball = this.add.image(0, 0, 'ball');
        this.battleBox = new BattleBox(this, GAME_W / 2, GAME_H - 30, 560);

        EventBus.on('match:set-speed', this.onSpeed, this);
        EventBus.on('match:skip', this.onSkip, this);
        this.unbind = () => {
            EventBus.off('match:set-speed', this.onSpeed, this);
            EventBus.off('match:skip', this.onSkip, this);
        };
        this.sys.events.once('shutdown', () => this.unbind?.());
        this.sys.events.once('destroy', () => this.unbind?.());

        playSfx('whistle');
        this.applySnapshot(0, 0);
        EventBus.emit('current-scene-ready', this);
    }

    private onSpeed(speed: PlaybackSpeed) {
        this.speed = speed;
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

    // ------------------------------------------------------------------ jogadores
    private createPlayerView(speciesId: number, team: 0 | 1, name: string, shiny: boolean): PlayerView {
        const color = this.md.colors[team];
        const size = shadowSize(speciesId);
        const shadow = this.add.ellipse(0, 0, 14 + size * 6, 6 + size * 2, 0x000000, 0.3);
        const ring = this.add.ellipse(0, 0, 22 + size * 6, 9 + size * 2).setStrokeStyle(2.5, color, 0.95);
        const sprite = this.add.sprite(0, 0, atlasKey(speciesId)).setScale(SPRITE_SCALE).setOrigin(0.5, 0.78);
        const textStyle = {
            fontFamily: 'Galmuri11, monospace',
            fontSize: '10px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        };
        const label = this.add.text(0, 0, name, textStyle).setOrigin(0.5, 0).setResolution(2);
        const badge = this.add
            .text(0, 0, '', { ...textStyle, fontSize: '11px', fontStyle: 'bold' })
            .setOrigin(0.5, 1)
            .setResolution(2);
        const view: PlayerView = {
            speciesId,
            team,
            name,
            shiny,
            sprite,
            shadow,
            ring,
            label,
            badge,
            currentKey: '',
            status: -1,
            flags: -1,
        };
        this.refreshTint(view);
        return view;
    }

    private swapSpecies(view: PlayerView, speciesId: number, name: string, shiny: boolean) {
        view.speciesId = speciesId;
        view.name = name;
        view.shiny = shiny;
        view.sprite.setTexture(atlasKey(speciesId));
        view.label.setText(name);
        view.currentKey = '';
        view.status = -1;
    }

    private refreshTint(view: PlayerView) {
        const st = STATUS_VIEW[view.status];
        if (st && view.status !== 6) view.sprite.setTint(st.tint);
        else if (view.shiny) view.sprite.setTint(0xfff3b0);
        else view.sprite.clearTint();
    }

    /** Ícone de status sobre a cabeça + setinha de buff/debuff + anel brilhando quando há golpe carregado. */
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
        const factor = this.currentSpeedFactor();
        this.playTick += (delta / 1000) * TICK_RATE * factor;

        while (this.eventCursor < this.matchEvents.length && this.matchEvents[this.eventCursor].tick <= this.playTick) {
            this.handleEvent(this.matchEvents[this.eventCursor++], false);
        }

        const { index, t } = this.locate(this.playTick);
        this.applySnapshot(index, t, factor);
        this.battleBox.update(time, factor);

        if (time - this.lastEmit > 120) {
            this.lastEmit = time;
            this.emitTick(this.snaps[index]);
        }

        const lastSnap = this.snaps[this.snaps.length - 1].tick;
        if (this.playTick > Math.max(lastSnap, this.lastEventTick) + TICK_RATE * 1.5) this.finish();
    }

    private currentSpeedFactor(): number {
        if (this.speed !== 'highlights') return this.speed;
        // "só os lances": devagar perto de lances importantes, rápido no resto
        const ahead = this.importantTicks.find((t) => t >= this.playTick);
        const near =
            (ahead !== undefined && ahead - this.playTick < TICK_RATE * 2.5) ||
            this.playTick - this.recentImportantTick < TICK_RATE * 1.5;
        return near ? 1 : 10;
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
        for (let i = 0; i < this.players.length; i++) {
            const view = this.players[i];
            const o = i * SNAP_STRIDE;
            const x = a.p[o] + (b.p[o] - a.p[o]) * k;
            const y = a.p[o + 1] + (b.p[o + 1] - a.p[o + 1]) * k;
            const facing = near.p[o + 2];
            const action = near.p[o + 3];
            const px = toPx(x, y);
            view.sprite.setPosition(px.x, px.y);
            view.shadow.setPosition(px.x, px.y + 1).setDepth(px.y - 2);
            view.ring.setPosition(px.x, px.y + 1).setDepth(px.y - 1);
            view.sprite.setDepth(px.y);
            view.label.setPosition(px.x, px.y + 6).setDepth(5000);
            view.badge.setPosition(px.x, px.y - view.sprite.displayHeight * 0.78 - 2).setDepth(5001);
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
            view.sprite.anims.timeScale = pace * Math.min(factor, 4);
            // paralisia: tremidinha
            if (view.status === 1) view.sprite.x += Math.sin(this.time.now / 40) * 1.2;
        }
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
        EventBus.emit('match:tick', { minute: snap.minute, half: snap.half, score: snap.score, phase: snap.phase });
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
        }
        if (silent) return;
        const cries = this.md.cries;
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
            case 'save':
                playSfx('save');
                this.popText(e.by, 'DEFESA!', '#9be7ff');
                break;
            case 'post':
                playSfx('post');
                this.popText(e.shooter, 'TRAVE!', '#ffffff');
                break;
            case 'goal': {
                playSfx('goal');
                const scorer = this.players[e.by];
                if (scorer) playCry(scorer.speciesId, cries, 1.2);
                this.cameras.main.shake(350, 0.006);
                this.cameras.main.flash(250, 255, 255, 255);
                this.goalBanner(e.team);
                break;
            }
            case 'move': {
                const view = this.players[e.by];
                if (!view) break;
                const move = MOVES[e.moveId];
                const moveType = move?.type ?? species(view.speciesId).types[0];
                this.moveFx(e.by, moveType, e.target);
                playSfx('move');
                playCry(view.speciesId, cries, 0.6);
                this.battleBox.push(`${view.name} usou ${move?.name ?? e.moveId}!`);
                if (e.kind === 'flavor' && e.moveId === 'splash') this.battleBox.push('Mas nada aconteceu!');
                else if (e.target !== null && !e.hit) this.battleBox.push('Mas errou!');
                else if (e.effectiveness !== null && e.effectiveness >= 1.12) this.battleBox.push('É super efetivo!');
                else if (e.effectiveness !== null && e.effectiveness < 1) this.battleBox.push('Não é muito efetivo...');
                break;
            }
            case 'status': {
                playSfx('status');
                const view = this.players[e.target];
                if (view) {
                    this.battleBox.push(`${view.name} ${STATUS_PT[e.status] ?? '!'}`);
                    if (e.status !== 'flinch')
                        this.applyIndicators(view, STATUS_KIND_TO_CODE[e.status] ?? 0, view.flags);
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
            case 'penalty':
                playSfx(e.scored ? 'goal' : 'save');
                break;
        }
    }

    private popText(idx: number, text: string, color: string) {
        const view = this.players[idx];
        if (!view) return;
        const t = this.add
            .text(view.sprite.x, view.sprite.y - 52, text, {
                fontFamily: 'Galmuri11, monospace',
                fontSize: '14px',
                fontStyle: 'bold',
                color,
                stroke: '#000000',
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(6000)
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
        const ring = this.add.circle(x, y, 10).setStrokeStyle(4, color, 1).setDepth(6000);
        this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
        this.cameras.main.shake(120, 0.003);
    }

    private moveFx(by: number, moveType: string, target: number | null) {
        const from = this.players[by];
        const to = target !== null ? this.players[target] : null;
        const color = hexToNumber(TYPE_COLOR[moveType] ?? '#ffffff');
        const key = `fx-${FX_BY_TYPE[moveType] ?? 'impact'}`;
        const aura = this.add
            .circle(from.sprite.x, from.sprite.y - 14, 18, color, 0.5)
            .setDepth(from.sprite.depth + 1)
            .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: aura, scale: 2.4, alpha: 0, duration: 550, onComplete: () => aura.destroy() });
        if (!this.textures.exists(key)) return;
        const fx = this.add
            .image(from.sprite.x, from.sprite.y - 16, key)
            .setDepth(6000)
            .setScale(0.7)
            .setTint(color)
            .setBlendMode(Phaser.BlendModes.ADD);
        if (to) {
            this.tweens.add({
                targets: fx,
                x: to.sprite.x,
                y: to.sprite.y - 16,
                scale: 1,
                duration: 380,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    this.impact(fx.x, fx.y, moveType);
                    this.tweens.add({
                        targets: fx,
                        alpha: 0,
                        scale: 1.5,
                        duration: 250,
                        onComplete: () => fx.destroy(),
                    });
                },
            });
        } else {
            this.tweens.add({
                targets: fx,
                scale: 1.4,
                alpha: 0,
                y: fx.y - 24,
                duration: 650,
                onComplete: () => fx.destroy(),
            });
        }
    }

    private goalBanner(team: 0 | 1) {
        const color = Phaser.Display.Color.IntegerToColor(this.md.colors[team]).rgba;
        const t = this.add
            .text(GAME_W / 2, GAME_H / 2, 'GOL!', {
                fontFamily: 'Galmuri11, monospace',
                fontSize: '72px',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: color,
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
