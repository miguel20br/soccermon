import Phaser from 'phaser';
import { MOVES } from '../../engine/data';
import { moveProfile } from '../../engine/moves';
import { atlasKey, createSpeciesAnims, footOrigin, preloadSpecies, resolveAnim } from '../animation-manager';
import { EventBus } from '../EventBus';
import { castMove, preloadMoveFx } from '../move-fx';

export const LAB_W = 720;
export const LAB_H = 300;
const SCALE = 2.4;
const USER_AT = { x: 220, y: 215 };
const TARGET_AT = { x: 500, y: 215 };

/**
 * Palco do laboratório de golpes (?lab=golpes): quem usa à esquerda, o alvo à direita, no piso da quadra.
 * A tela React manda 'lab:play' { moveId, userId, targetId, strong } e a cena carrega os sprites e toca o golpe
 * com a mesma animação da partida (src/game/move-fx.ts).
 */
export class MoveLabScene extends Phaser.Scene {
    private user: Phaser.GameObjects.Sprite | null = null;
    private target: Phaser.GameObjects.Sprite | null = null;
    private userId = 0;
    private targetId = 0;
    private request = 0;

    constructor() {
        super('MoveLab');
    }

    preload() {
        preloadMoveFx(this);
    }

    create() {
        const g = this.add.graphics().setDepth(-10);
        for (let i = 0; i < LAB_W / 24 + 1; i++)
            g.fillStyle(i % 2 ? 0xc68649 : 0xcf9358, 1).fillRect(i * 24, 0, 24, LAB_H);
        g.lineStyle(2, 0xffffff, 0.8).lineBetween(LAB_W / 2, 0, LAB_W / 2, LAB_H);
        g.strokeCircle(LAB_W / 2, LAB_H / 2 + 40, 60);
        for (const at of [USER_AT, TARGET_AT]) g.fillStyle(0x000000, 0.25).fillEllipse(at.x, at.y + 2, 44, 14);

        const onPlay = (req: { moveId: string; userId: number; targetId: number; strong: boolean }) =>
            void this.play(req);
        EventBus.on('lab:play', onPlay);
        this.sys.events.once('shutdown', () => EventBus.off('lab:play', onPlay));
        this.sys.events.once('destroy', () => EventBus.off('lab:play', onPlay));
        EventBus.emit('lab:ready');
        if (import.meta.env.DEV) (window as unknown as { __lab?: unknown }).__lab = this;
    }

    private loadSpecies(ids: number[]): Promise<void> {
        const missing = ids.filter((id) => !this.textures.exists(atlasKey(id)));
        if (!missing.length) {
            for (const id of ids) createSpeciesAnims(this, id);
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            for (const id of missing) preloadSpecies(this, id);
            this.load.once('complete', () => {
                for (const id of ids) if (this.textures.exists(atlasKey(id))) createSpeciesAnims(this, id);
                resolve();
            });
            this.load.start();
        });
    }

    private place(id: number, at: { x: number; y: number }, facing: number, current: Phaser.GameObjects.Sprite | null) {
        const anim = resolveAnim(id, 'Idle');
        const sprite = current ?? this.add.sprite(at.x, at.y, atlasKey(id)).setScale(SCALE).setDepth(at.y);
        sprite.setTexture(atlasKey(id)).setPosition(at.x, at.y).setScale(SCALE).setAlpha(1).clearTint();
        sprite.play(`${id}/${anim}/${facing}`).setOrigin(0.5, footOrigin(id, anim));
        return sprite;
    }

    private async play(req: { moveId: string; userId: number; targetId: number; strong: boolean }) {
        const ticket = ++this.request;
        await this.loadSpecies([req.userId, req.targetId]);
        if (ticket !== this.request || !this.sys.isActive()) return;
        // tira restos do golpe anterior (partículas soltas) para cada golpe começar limpo
        this.tweens.killAll();
        this.time.removeAllEvents();
        for (const obj of [...this.children.list]) {
            if (obj !== this.user && obj !== this.target && obj.type !== 'Graphics') obj.destroy();
            else if (obj.type === 'Graphics' && (obj as Phaser.GameObjects.Graphics).depth > -10) obj.destroy();
        }
        if (req.userId !== this.userId || !this.user) this.user = this.place(req.userId, USER_AT, 2, this.user);
        if (req.targetId !== this.targetId || !this.target) {
            this.target = this.place(req.targetId, TARGET_AT, 6, this.target);
        }
        this.userId = req.userId;
        this.targetId = req.targetId;
        this.user.setScale(SCALE).setPosition(USER_AT.x, USER_AT.y);
        this.target.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
        this.cameras.main.resetFX();

        const move = MOVES[req.moveId];
        if (!move) return;
        const kind = moveProfile(req.moveId).kind;
        // quem usa dá um passinho na direção do alvo (como na partida)
        this.tweens.add({ targets: this.user, x: USER_AT.x + 14, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
        const attack = resolveAnim(req.userId, 'Attack');
        this.user.play(`${req.userId}/${attack}/2`).setOrigin(0.5, footOrigin(req.userId, attack));
        this.user.once('animationcomplete', () => {
            const idle = resolveAnim(req.userId, 'Idle');
            this.user?.play(`${req.userId}/${idle}/2`).setOrigin(0.5, footOrigin(req.userId, idle));
        });
        // golpe de suporte (reforço, arrancada, cura) não tem alvo
        const selfMove = kind === 'buff' || kind === 'burst' || kind === 'heal' || kind === 'flavor';
        castMove({
            scene: this,
            user: this.user,
            target: selfMove ? null : this.target,
            moveId: req.moveId,
            moveType: move.type,
            kind,
            strong: req.strong,
            depth: 500,
            baseScale: SCALE,
        });
    }
}
