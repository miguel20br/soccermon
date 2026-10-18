import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { viewInstance } from '../engine/instance';
import { clubName, dict, fmt, getLang, type Lang, tn } from '../i18n';
import { isPerfectCup, type RunState, useGame } from '../store/game-store';
import { isGoldTrainer, type TrainerId, trainerSrc } from '../store/missions';
import { cardSprite } from './components/PokeCard';
import { Trophy } from './components/Trophy';
import { titleName, trainerLabel } from './profile/club';
import { SITE_URL } from './share';
import { aggregate } from './stats/CupStats';

/**
 * Card de imagem do título (estilo Spotify Wrapped/Strava): desenhado num <canvas> para ir junto do
 * Compartilhar ou ser baixado. Sem emoji: quadrados, selos e o "C" do capitão são desenhados.
 */
export type CardFormat = 'story' | 'square';

export interface ShareCardData {
    title: string;
    sub: string;
    teamName: string;
    color: string;
    perfect: string | null;
    games: { stage: string; score: string; pens: string | null; opponent: string; won: boolean }[];
    squad: { sprite: string; name: string; captain: boolean }[];
    scorer: { label: string; text: string; sprite: string } | null;
    /** Treinador campeão (só no formato Stories, ao lado da taça). */
    trainer: { sprite: string; name: string; title: string; gold: boolean } | null;
    site: string;
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Tudo o que vai no card, a partir do run (função pura: dá para testar sem canvas). */
export function shareCardData(
    run: RunState,
    color: number,
    lang: Lang = getLang(),
    trainer: { id: TrainerId; name: string; title: string } | null = null,
): ShareCardData {
    const d = dict(lang).result;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const top = aggregate(run.results).reduce<ReturnType<typeof aggregate>[number] | null>(
        (a, b) => (!a || b.goals > a.goals ? b : a),
        null,
    );
    const topPick = top && byUid.get(top.uid);
    return {
        title: d.champ.title,
        sub: d.hero.cupWon,
        teamName: run.teamName,
        color: hex(color),
        perfect: isPerfectCup(run) ? d.card.perfect : null,
        games: run.results.map((r) => ({
            stage: d.hero.stageShort[r.stage] ?? '',
            score: `${r.score[0]} x ${r.score[1]}`,
            pens: r.shootout ? fmt(d.card.pens, { a: r.shootout[0], b: r.shootout[1] }) : null,
            opponent: clubName(r.opponent, lang),
            won: r.won,
        })),
        squad: run.lineup
            .map((uid) => byUid.get(uid))
            .filter((p) => !!p)
            .map((p) => ({
                sprite: cardSprite(p),
                name: viewInstance(p).displayName,
                captain: p.uid === run.captainUid,
            })),
        scorer:
            top && top.goals > 0
                ? {
                      label: d.card.topScorer,
                      text: `${top.name} · ${tn('common.count.goals', top.goals, undefined, lang)}`,
                      sprite: cardSprite(topPick ?? { speciesId: top.speciesId, shiny: false }),
                  }
                : null,
        trainer: trainer && {
            sprite: trainerSrc(trainer.id),
            name: trainer.name,
            title: trainer.title,
            gold: isGoldTrainer(trainer.id),
        },
        site: SITE_URL.replace(/^https?:\/\//, ''),
    };
}

const INK = '#0e1430';
const GOLD = '#ffcb05';
const FONT = 'Galmuri11, monospace';

function loadImage(src: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.src = src;
    return img.decode().then(() => img);
}

/** O SVG vira imagem (logo sem tamanho próprio e a taça do componente React). */
const svgImage = (svg: string) => loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);

async function logoImage() {
    const svg = await (await fetch('assets/ui/logo.svg')).text();
    return svgImage(svg.replace('<svg ', '<svg width="1468" height="300" '));
}

function trophyImage(size: number) {
    const div = document.createElement('div');
    const root = createRoot(div);
    flushSync(() => root.render(createElement(Trophy, { size })));
    const svg = new XMLSerializer().serializeToString(div.firstChild as Node);
    root.unmount();
    return svgImage(svg);
}

/** Fonte no maior tamanho (até `size`) em que o texto cabe em `maxW`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number, bold = true) {
    let s = size;
    do ctx.font = `${bold ? 700 : 400} ${s}px ${FONT}`;
    while (ctx.measureText(text).width > maxW && --s > 10);
    return s;
}

/** Texto centrado com sombra dura (como as capas em docs/marketing). */
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, shadow = 0) {
    if (shadow) {
        ctx.fillStyle = INK;
        ctx.fillText(s, x + shadow * 0.8, y + shadow);
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, r = 18) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(x, y + 8, w, h, r);
    ctx.fill();
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.stroke();
}

/**
 * Sprite em pixel art na mesma escala inteira para todos (o tamanho relativo é o do jogo: Snorlax maior
 * que Mew), centrado e apoiado no chão.
 */
function sprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, bottom: number, k: number) {
    const iw = img.naturalWidth * k;
    const ih = img.naturalHeight * k;
    ctx.drawImage(img, Math.round(cx - iw / 2), Math.round(bottom - ih), iw, ih);
}

const isLight = (c: string) => {
    const n = Number.parseInt(c.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6;
};

/** Desenha o card (1080x1920 Stories ou 1080x1080 quadrado). */
export async function drawShareCard(data: ShareCardData, format: CardFormat): Promise<HTMLCanvasElement> {
    const sq = format === 'square';
    const W = 1080;
    const H = sq ? 1080 : 1920;
    await Promise.all([document.fonts.load(`700 40px ${FONT}`), document.fonts.load(`400 40px ${FONT}`)]).catch(
        () => {},
    );
    const [logo, trophy, sprites, scorerImg, trainerImg] = await Promise.all([
        logoImage(),
        trophyImage(400),
        Promise.all(data.squad.map((p) => loadImage(p.sprite))),
        data.scorer ? loadImage(data.scorer.sprite) : null,
        data.trainer && !sq ? loadImage(data.trainer.sprite).catch(() => null) : null,
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // fundo: noite azul com raios saindo da taça
    const cx = W / 2;
    const cy = sq ? 230 : 470;
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.75);
    bg.addColorStop(0, '#2a3a7a');
    bg.addColorStop(1, '#070a18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    const N = 28;
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 3000, a, a + ((Math.PI * 2) / N) * 0.46);
        ctx.fill();
    }

    // treinador dourado: moldura de ouro em volta do card
    if (data.trainer?.gold) {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#b8860b');
        g.addColorStop(0.35, '#ffd84a');
        g.addColorStop(0.5, '#fff6c8');
        g.addColorStop(0.65, '#ffd84a');
        g.addColorStop(1, '#b8860b');
        ctx.strokeStyle = g;
        ctx.lineWidth = 22;
        ctx.strokeRect(11, 11, W - 22, H - 22);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 246, 200, 0.7)';
        ctx.strokeRect(30, 30, W - 60, H - 60);
    }

    let y = sq ? 36 : 70;
    // logo
    const lw = sq ? 480 : 720;
    const lh = (lw * 300) / 1468;
    ctx.drawImage(logo, cx - lw / 2, y, lw, lh);
    y += lh + (sq ? 14 : 30);

    // taça e CAMPEÕES! (no quadrado, lado a lado)
    if (sq) {
        const ts = 150;
        const ts2 = fitFont(ctx, data.title, 96, W - ts - 160);
        const tw = ctx.measureText(data.title).width;
        const x0 = cx - (ts + 20 + tw) / 2;
        ctx.drawImage(trophy, x0, y, ts, ts);
        ctx.textAlign = 'left';
        text(ctx, data.title, x0 + ts + 20, y + ts / 2 + ts2 * 0.38, GOLD, 8);
        ctx.textAlign = 'center';
        y += ts + 14;
    } else {
        // com o selo da copa perfeita a taça encolhe para tudo caber
        const ts = data.perfect ? 280 : 380;
        ctx.drawImage(trophy, cx - ts / 2, y, ts, ts);
        // treinador campeão ao lado da taça (olhando para ela), com o nome e o título em cima
        if (trainerImg && data.trainer) {
            const k = data.perfect ? 2.5 : 3;
            const tx = cx - ts / 2 - 130;
            ctx.save();
            ctx.translate(tx * 2, 0);
            ctx.scale(-1, 1);
            if (data.trainer.gold) {
                ctx.shadowColor = 'rgba(255, 216, 74, 0.9)';
                ctx.shadowBlur = 40;
            }
            sprite(ctx, trainerImg, tx, y + ts + 0.1 * 80 * k, k);
            ctx.restore();
            const top = y + ts - 0.8 * 80 * k;
            fitFont(ctx, data.trainer.name, 36, 260);
            text(ctx, data.trainer.name, tx, top - 44, '#ffffff', 3);
            fitFont(ctx, data.trainer.title, 28, 260, false);
            text(ctx, data.trainer.title, tx, top - 8, GOLD, 3);
        }
        y += ts + 20;
        const s = fitFont(ctx, data.title, 136, W - 120);
        text(ctx, data.title, cx, y + s * 0.85, GOLD, 10);
        y += s + 24;
        fitFont(ctx, data.sub, 40, W - 160, false);
        text(ctx, data.sub, cx, y + 34, '#f4f1e6', 4);
        y += 70;
    }

    // nome do clube numa faixa na cor do clube
    const bh = sq ? 76 : 100;
    const ns = fitFont(ctx, data.teamName, sq ? 46 : 58, W - 260);
    const bw = Math.min(W - 120, ctx.measureText(data.teamName).width + (sq ? 100 : 140));
    box(ctx, cx - bw / 2, y, bw, bh, data.color, bh / 2);
    text(ctx, data.teamName, cx, y + bh / 2 + ns * 0.36, isLight(data.color) ? INK : '#ffffff');
    y += bh + (sq ? 24 : 36);

    // selo da copa perfeita
    if (data.perfect) {
        const ph = sq ? 50 : 64;
        const ps = fitFont(ctx, data.perfect, sq ? 28 : 34, W - 260);
        const pw = ctx.measureText(data.perfect).width + 80;
        box(ctx, cx - pw / 2, y, pw, ph, GOLD, ph / 2);
        text(ctx, data.perfect, cx, y + ph / 2 + ps * 0.36, INK);
        y += ph + (sq ? 22 : 40);
    }

    // os 4 jogos: quadrados verde/vermelho com placar e rival
    const gap = sq ? 16 : 20;
    const gs = sq ? 180 : 225;
    const gx0 = cx - (data.games.length * gs + (data.games.length - 1) * gap) / 2;
    data.games.forEach((g, i) => {
        const x = gx0 + i * (gs + gap);
        const mid = x + gs / 2;
        box(ctx, x, y, gs, gs, g.won ? '#2fa84f' : '#e8423f');
        fitFont(ctx, g.stage, sq ? 24 : 30, gs - 20, false);
        text(ctx, g.stage, mid, y + gs * 0.2, '#ffffff', 3);
        const ss = fitFont(ctx, g.score, sq ? 54 : 68, gs - 24);
        text(ctx, g.score, mid, y + gs * (g.pens ? 0.42 : 0.5) + ss * 0.3, '#ffffff', 5);
        if (g.pens) {
            fitFont(ctx, g.pens, sq ? 20 : 24, gs - 20, false);
            text(ctx, g.pens, mid, y + gs * 0.68, '#ffffff', 2);
        }
        fitFont(ctx, g.opponent, sq ? 22 : 26, gs - 20, false);
        text(ctx, g.opponent, mid, y + gs * 0.88, '#ffffff', 2);
    });
    y += gs + (sq ? 40 : 70);

    // time titular: sprites, nome e o C do capitão
    const cw = sq ? 190 : 200;
    const sh = sq ? 130 : 160;
    const sx0 = cx - (data.squad.length * cw) / 2;
    data.squad.forEach((p, i) => {
        const mid = sx0 + i * cw + cw / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(mid, y + sh - 4, cw * 0.3, sq ? 10 : 14, 0, 0, Math.PI * 2);
        ctx.fill();
        sprite(ctx, sprites[i], mid, y + sh, 2);
        const fs = fitFont(ctx, p.name, sq ? 24 : 30, cw - 10);
        text(ctx, p.name, mid, y + sh + fs + 10, '#ffffff', 3);
        if (p.captain) {
            const r = sq ? 18 : 22;
            const bx = mid + cw / 2 - r - 6;
            const by = y + r;
            ctx.fillStyle = INK;
            ctx.beginPath();
            ctx.arc(bx + 2, by + 4, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = GOLD;
            ctx.beginPath();
            ctx.arc(bx, by, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = INK;
            ctx.stroke();
            fitFont(ctx, 'C', r * 1.3, r * 2);
            text(ctx, 'C', bx, by + r * 0.45, INK);
        }
    });
    y += sh + (sq ? 56 : 110);

    // artilheiro
    if (data.scorer && scorerImg) {
        const iw = sq ? 90 : 180;
        const ih = sq ? 70 : 140;
        const ls = fitFont(ctx, data.scorer.label, sq ? 22 : 28, 600);
        const lw2 = ctx.measureText(data.scorer.label).width;
        const ts = fitFont(ctx, data.scorer.text, sq ? 30 : 40, W - iw - 220);
        const tw = Math.max(lw2, ctx.measureText(data.scorer.text).width);
        const x0 = cx - (iw + 20 + tw) / 2;
        sprite(ctx, scorerImg, x0 + iw / 2, y + ih, sq ? 1 : 2);
        ctx.textAlign = 'left';
        fitFont(ctx, data.scorer.label, ls, 600);
        text(ctx, data.scorer.label, x0 + iw + 20, y + ih / 2 - 6, GOLD, 3);
        fitFont(ctx, data.scorer.text, ts, W - iw - 220);
        text(ctx, data.scorer.text, x0 + iw + 20, y + ih / 2 + ts + 2, '#ffffff', 3);
        ctx.textAlign = 'center';
    }

    // rodapé
    fitFont(ctx, data.site, sq ? 40 : 56, W - 200);
    text(ctx, data.site, cx, H - (sq ? 34 : 70), '#ffffff', 5);
    return canvas;
}

/** PNG do card do título. */
export async function shareCardBlob(run: RunState, format: CardFormat, color: number): Promise<Blob> {
    const { profile, hall } = useGame.getState();
    const won = hall.find((h) => h.id === run.seed);
    const trainer = won?.trainer
        ? {
              id: won.trainer,
              name: trainerLabel(profile),
              title: won.trainerTitle ? titleName(won.trainerTitle) : '',
          }
        : null;
    const canvas = await drawShareCard(shareCardData(run, color, getLang(), trainer), format);
    return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('toBlob'))), 'image/png'));
}

/** Baixa o PNG (computador ou celular sem o menu de compartilhar com arquivo). */
export function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
