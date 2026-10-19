import type Phaser from 'phaser';
import { EventBus } from '../game/EventBus';

/**
 * Clipe 9:16 do replay pro TikTok/Reels: a cada quadro do Phaser, desenha num canvas 720x1280 o placar, a quadra
 * recortada seguindo a bola, a legenda do lance e "soccermon.com" discreto, e grava com o MediaRecorder em tempo real
 * (MP4 onde o navegador grava MP4: Safari e Chrome novo; senão WebM). Sem som: o ZzFX e os gritos tocam direto na
 * saída do navegador (o TikTok põe a música).
 */
export const CLIP_W = 720;
export const CLIP_H = 1280;
/** Teto do clipe (s), contando o cartão final. */
export const CLIP_MAX_S = 15;
/** Cartão final com o logo e o site (s). */
const END_CARD_S = 1.2;
/** ~2,5 Mbps: 15 s ≈ 4,7 MB. */
const BITRATE = 2_500_000;
const FPS = 30;

const FONT = 'Galmuri11, monospace';
const INK = '#0e1430';
/** Onde a quadra entra no quadro (o resto é placar em cima e legenda embaixo). */
const COURT = { x: 0, y: 236, w: CLIP_W, h: 900 };

export interface ClipOverlay {
    names: [string, string];
    colors: [number, number];
    /** Etiqueta em cima ("GOL DA COPA", "MELHORES MOMENTOS"). */
    tag: string;
    /** Legenda do lance ("GOL! Pikachu 38' · Thunderbolt"). */
    caption: string;
    site: string;
}

/** Formato que o navegador grava (null = sem MediaRecorder: o botão de exportar nem aparece). */
export function clipMime(): string | null {
    if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function')
        return null;
    const options = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm'];
    return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export const clipExt = (mime: string) => (mime.startsWith('video/mp4') ? 'mp4' : 'webm');

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number) {
    let s = size;
    do ctx.font = `700 ${s}px ${FONT}`;
    while (ctx.measureText(text).width > maxW && --s > 10);
}

function shadowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, d = 4) {
    ctx.fillStyle = INK;
    ctx.fillText(text, x + d * 0.8, y + d);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

type ReplayScene = Phaser.Scene & {
    ballOnScreen(): { x: number; y: number };
    setClipView(x: number, w: number): void;
};

export class ClipRecorder {
    readonly canvas = document.createElement('canvas');
    private readonly ctx: CanvasRenderingContext2D;
    private readonly bg: HTMLCanvasElement;
    private recorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private score: [number, number] = [0, 0];
    private minute = 0;
    private camX: number | null = null;
    private ending = false;
    private startedAt = 0;
    private capTimer = 0;
    private logo: HTMLImageElement | null = null;
    private done: Promise<Blob>;
    private resolve!: (b: Blob) => void;
    private reject!: (e: Error) => void;

    constructor(
        private readonly scene: ReplayScene,
        private readonly overlay: ClipOverlay,
        private readonly mime: string,
    ) {
        this.canvas.width = CLIP_W;
        this.canvas.height = CLIP_H;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.bg = this.drawBackground();
        this.done = new Promise((ok, fail) => {
            this.resolve = ok;
            this.reject = fail;
        });
        // o SVG do logo sem largura/altura não tem tamanho pro canvas: põe o tamanho dele (como o card do título)
        fetch('assets/ui/logo.svg')
            .then((r) => r.text())
            .then((svg) => {
                const img = new Image();
                img.onload = () => {
                    this.logo = img;
                };
                img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace('<svg ', '<svg width="1468" height="300" '))}`;
            })
            .catch(() => {});
    }

    /** Começa a gravar; o clipe acaba em `finish()` (fim do replay) ou no teto de 15 s. */
    start(): Promise<Blob> {
        const stream = this.canvas.captureStream(FPS);
        this.recorder = new MediaRecorder(stream, { mimeType: this.mime, videoBitsPerSecond: BITRATE });
        this.recorder.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
        this.recorder.onstop = () => {
            for (const track of stream.getTracks()) track.stop();
            if (this.chunks.length) this.resolve(new Blob(this.chunks, { type: this.mime.split(';')[0] }));
            else this.reject(new Error('clipe vazio'));
        };
        this.recorder.onerror = () => this.reject(new Error('falha ao gravar'));
        EventBus.on('match:tick', this.onTick, this);
        this.scene.game.events.on('postrender', this.draw, this);
        this.draw();
        this.recorder.start(500);
        this.startedAt = performance.now();
        this.capTimer = window.setTimeout(() => this.finish(), (CLIP_MAX_S - END_CARD_S) * 1000);
        return this.done;
    }

    /** Segundos gravados (pra barra de progresso). */
    get elapsed() {
        return this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0;
    }

    /** Fim do lance: segura o último quadro com o cartão final e fecha o arquivo. */
    finish() {
        if (this.ending || !this.recorder) return;
        this.ending = true;
        clearTimeout(this.capTimer);
        this.scene.game.events.off('postrender', this.draw, this);
        const t0 = performance.now();
        const tick = () => {
            const k = Math.min(1, (performance.now() - t0) / 350);
            this.drawEndCard(k);
            if (performance.now() - t0 < END_CARD_S * 1000) requestAnimationFrame(tick);
            else this.stop();
        };
        tick();
    }

    /** Para sem esperar (saiu da tela). */
    cancel() {
        this.ending = true;
        clearTimeout(this.capTimer);
        this.stop();
    }

    private stop() {
        EventBus.off('match:tick', this.onTick, this);
        this.scene.game?.events?.off('postrender', this.draw, this);
        if (this.recorder?.state === 'recording') this.recorder.stop();
    }

    private onTick(t: { score: [number, number]; minute: number }) {
        this.score = t.score;
        this.minute = t.minute;
    }

    private drawBackground() {
        const c = document.createElement('canvas');
        c.width = CLIP_W;
        c.height = CLIP_H;
        const g = c.getContext('2d') as CanvasRenderingContext2D;
        const grad = g.createRadialGradient(CLIP_W / 2, COURT.y + COURT.h / 2, 0, CLIP_W / 2, CLIP_H / 2, CLIP_H * 0.7);
        grad.addColorStop(0, '#2a3a7a');
        grad.addColorStop(1, '#070a18');
        g.fillStyle = grad;
        g.fillRect(0, 0, CLIP_W, CLIP_H);
        return c;
    }

    /** Um quadro: fundo, placar, quadra seguindo a bola, legenda e o site. */
    private draw() {
        const ctx = this.ctx;
        const src = this.scene.game.canvas;
        ctx.drawImage(this.bg, 0, 0);
        // quadra: recorte da altura toda, da largura que dá a proporção do quadro, centrado na bola (suave)
        const cropW = (src.height * COURT.w) / COURT.h;
        const kx = src.width / (this.scene.scale.width || src.width);
        const ball = this.scene.ballOnScreen();
        const target = Math.max(0, Math.min(src.width - cropW, ball.x * kx - cropW / 2));
        this.camX = this.camX === null ? target : this.camX + (target - this.camX) * 0.12;
        this.scene.setClipView(this.camX / kx, cropW / kx);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(src, this.camX, 0, cropW, src.height, COURT.x, COURT.y, COURT.w, COURT.h);
        ctx.fillStyle = INK;
        ctx.fillRect(0, COURT.y - 6, CLIP_W, 6);
        ctx.fillRect(0, COURT.y + COURT.h, CLIP_W, 6);
        this.drawHeader();
        this.drawFooter();
    }

    private drawHeader() {
        const ctx = this.ctx;
        const { names, colors, tag } = this.overlay;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        // etiqueta amarela
        fitFont(ctx, tag, 26, 520);
        const tw = ctx.measureText(tag).width + 36;
        ctx.fillStyle = '#ffcb05';
        ctx.beginPath();
        ctx.roundRect(CLIP_W / 2 - tw / 2, 34, tw, 40, 6);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.fillText(tag, CLIP_W / 2, 64);
        // placar: faixa na cor de cada time, nomes e o número grande no meio
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.roundRect(24, 92, CLIP_W - 48, 112, 10);
        ctx.fill();
        for (const side of [0, 1] as const) {
            ctx.fillStyle = hex(colors[side]);
            ctx.fillRect(side === 0 ? 24 : CLIP_W - 34, 92, 10, 112);
            fitFont(ctx, names[side], 30, 200);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(names[side], side === 0 ? 150 : CLIP_W - 150, 160);
        }
        ctx.font = `700 64px ${FONT}`;
        shadowText(ctx, `${this.score[0]}  ${this.score[1]}`, CLIP_W / 2, 172, '#ffffff', 3);
        ctx.font = `700 22px ${FONT}`;
        ctx.fillStyle = '#ffcb05';
        ctx.fillText(`${Math.floor(this.minute)}'`, CLIP_W / 2, 196);
    }

    private drawFooter() {
        const ctx = this.ctx;
        const y0 = COURT.y + COURT.h + 6;
        ctx.textAlign = 'center';
        fitFont(ctx, this.overlay.caption, 36, CLIP_W - 60);
        shadowText(ctx, this.overlay.caption, CLIP_W / 2, y0 + 58, '#ffffff', 4);
        ctx.font = `700 22px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText(this.overlay.site, CLIP_W / 2, CLIP_H - 26);
    }

    /** Último quadro escurecendo, com o logo e o site no meio. */
    private drawEndCard(k: number) {
        const ctx = this.ctx;
        this.draw();
        ctx.fillStyle = `rgba(7,10,24,${0.82 * k})`;
        ctx.fillRect(0, 0, CLIP_W, CLIP_H);
        ctx.globalAlpha = k;
        if (this.logo) {
            const w = 560;
            const h = (w * 300) / 1468;
            ctx.drawImage(this.logo, (CLIP_W - w) / 2, CLIP_H / 2 - h - 20, w, h);
        }
        ctx.textAlign = 'center';
        ctx.font = `700 44px ${FONT}`;
        shadowText(ctx, this.overlay.site, CLIP_W / 2, CLIP_H / 2 + 70, '#ffcb05', 4);
        ctx.globalAlpha = 1;
    }
}
