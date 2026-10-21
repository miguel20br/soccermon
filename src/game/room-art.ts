/**
 * Troféus pintados por código pra sala de troféus (cena do Phaser), no traço do Modern Interiors (contorno escuro da
 * cor, sombreado da esquerda pra direita): taça girada a partir de um perfil, medalhão, cinturão, pedestal e a
 * redoma de vidro. Cada um vira uma textura de canvas que a luz da cena ilumina.
 */
export type Metal = 'bronze' | 'prata' | 'ouro';

/** 5 tons por metal: contorno, sombra, base, luz, brilho. */
const TONES: Record<Metal | 'ghost', string[]> = {
    bronze: ['#4a2814', '#8d5226', '#c07a3e', '#e3a46a', '#f8d2a6'],
    prata: ['#3a3f4c', '#7c8496', '#b8bfcc', '#dfe4ec', '#ffffff'],
    ouro: ['#5a3c08', '#a8740e', '#e0aa22', '#f6d25a', '#fff4b8'],
    ghost: ['#2a3058', '#353d6c', '#3c4578', '#444e86', '#4c5790'],
};

/** Pinta uma linha horizontal de um corpo redondo: borda escura, sombra à direita, brilho à esquerda. */
function row(c: CanvasRenderingContext2D, cx: number, y: number, r: number, t: string[]) {
    const x0 = Math.round(cx - r);
    const w = Math.max(1, Math.round(r * 2));
    for (let i = 0; i < w; i++) {
        const k = i / Math.max(1, w - 1);
        c.fillStyle = i === 0 || i === w - 1 ? t[0] : k < 0.22 ? t[4] : k < 0.4 ? t[3] : k < 0.75 ? t[2] : t[1];
        c.fillRect(x0 + i, y, 1, 1);
    }
}

const canvas = (w: number, h: number) => {
    const el = document.createElement('canvas');
    el.width = w;
    el.height = h;
    const c = el.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    return { el, c };
};

/**
 * Taça (24 x 30): bojo, haste, base e duas alças. `big` = a da Liga (36 x 44), ou a escala. `band` = faixa no bojo
 * (a índigo da taça da Liga Índigo).
 */
export function paintCup(metal: Metal | 'ghost', big: boolean | number = false, band?: string) {
    const s = big === true ? 1.5 : big || 1;
    const W = Math.round(24 * s);
    const H = Math.round(30 * s);
    const { el, c } = canvas(W, H);
    const t = TONES[metal];
    const cx = W / 2;
    // perfil (raio por altura, de cima pra baixo), em px de taça pequena
    const prof = (y: number) => {
        const v = y / s;
        if (v < 2) return 8.5;
        if (v < 13) return 8.5 - (v - 2) * 0.32;
        if (v < 17) return 5 - (v - 13) * 0.9;
        if (v < 23) return 1.6;
        if (v < 25) return 3.5;
        return 6.5;
    };
    for (let y = 0; y < H; y++) row(c, cx, y, prof(y), t);
    // boca: linha escura e o fundo
    c.fillStyle = t[0];
    c.fillRect(Math.round(cx - 8.5 * s), 0, Math.round(17 * s), 1);
    c.fillStyle = t[1];
    c.fillRect(Math.round(cx - 7 * s), 1, Math.round(14 * s), Math.max(1, Math.round(s)));
    // alças
    c.fillStyle = t[0];
    for (const side of [-1, 1]) {
        const hx = Math.round(cx + side * 10 * s);
        c.fillRect(hx - (side > 0 ? 0 : Math.round(2 * s)), Math.round(3 * s), Math.round(2 * s), Math.round(7 * s));
        c.fillStyle = t[2];
        c.fillRect(hx - (side > 0 ? -1 : Math.round(2 * s) - 1), Math.round(4 * s), 1, Math.round(5 * s));
        c.fillStyle = t[0];
    }
    // faixa no bojo: contorno escuro, a cor e um brilho em cima
    if (band) {
        const y = Math.round(5 * s);
        const r = Math.round(prof(y) - 0.5);
        c.fillStyle = t[0];
        c.fillRect(Math.round(cx - r), y - 1, r * 2, Math.round(3 * s) + 2);
        c.fillStyle = band;
        c.fillRect(Math.round(cx - r) + 1, y, r * 2 - 2, Math.round(3 * s));
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.fillRect(Math.round(cx - r) + 1, y, r * 2 - 2, 1);
    }
    // base de madeira
    c.fillStyle = '#3a2214';
    c.fillRect(Math.round(cx - 7 * s), H - Math.round(3 * s), Math.round(14 * s), Math.round(3 * s));
    c.fillStyle = '#6a4228';
    c.fillRect(Math.round(cx - 6 * s), H - Math.round(3 * s), Math.round(12 * s), 1);
    return el;
}

/** Medalhão (18 x 26) com fita na cor do clube. */
export function paintMedal(metal: Metal | 'ghost', ribbon: string) {
    const { el, c } = canvas(18, 26);
    const t = TONES[metal];
    c.fillStyle = metal === 'ghost' ? t[1] : ribbon;
    c.fillRect(4, 0, 4, 10);
    c.fillRect(10, 0, 4, 10);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(7, 0, 1, 10);
    c.fillRect(13, 0, 1, 10);
    for (let y = 0; y < 16; y++) {
        const dy = y - 7.5;
        row(c, 9, 10 + y, Math.sqrt(Math.max(0, 64 - dy * dy)), t);
    }
    // estrela gravada
    c.fillStyle = t[1];
    c.fillRect(8, 15, 2, 6);
    c.fillRect(6, 17, 6, 2);
    return el;
}

/** Cinturão (40 x 14): couro e a placa de metal no meio. */
export function paintBelt(metal: Metal | 'ghost') {
    const { el, c } = canvas(40, 14);
    const t = TONES[metal];
    const leather = metal === 'ghost' ? t : ['#1e120c', '#3a2418', '#5a3824', '#6e4630', '#80543a'];
    c.fillStyle = leather[0];
    c.fillRect(0, 3, 40, 8);
    c.fillStyle = leather[2];
    c.fillRect(1, 4, 38, 6);
    c.fillStyle = leather[3];
    c.fillRect(1, 4, 38, 1);
    for (let y = 0; y < 14; y++) {
        const dy = y - 6.5;
        row(c, 20, y, Math.sqrt(Math.max(0, 49 - dy * dy)) * 1.3, t);
    }
    return el;
}

/** Pedestal de mármore (`w` x `h`) com tampo claro e sombra embaixo. */
export function paintPedestal(w: number, h: number) {
    const { el, c } = canvas(w, h);
    c.fillStyle = '#3c3a46';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#e9e5dc';
    c.fillRect(1, 1, w - 2, h - 2);
    c.fillStyle = '#fbf9f4';
    c.fillRect(1, 1, w - 2, 4);
    c.fillStyle = '#cfc9bd';
    c.fillRect(w - 5, 5, 4, h - 6);
    c.fillStyle = '#b9b2a4';
    c.fillRect(1, h - 4, w - 2, 3);
    // plaquinha dourada
    c.fillStyle = '#7a5a1a';
    c.fillRect(Math.round(w / 2) - 5, Math.round(h / 2), 10, 4);
    c.fillStyle = '#c9a24a';
    c.fillRect(Math.round(w / 2) - 4, Math.round(h / 2) + 1, 8, 2);
    return el;
}

/** Redoma de vidro (`w` x `h`): contorno claro e reflexos. */
export function paintGlass(w: number, h: number) {
    const { el, c } = canvas(w, h);
    c.fillStyle = 'rgba(190, 225, 245, 0.18)';
    c.fillRect(1, 1, w - 2, h - 1);
    c.fillStyle = 'rgba(235, 248, 255, 0.85)';
    c.fillRect(0, 0, w, 1);
    c.fillRect(0, 0, 1, h);
    c.fillRect(w - 1, 0, 1, h);
    c.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let i = 0; i < Math.min(w, h) / 2; i++) c.fillRect(3 + i, h - 6 - i * 2, 1, 2);
    c.fillRect(4, 3, 1, Math.round(h * 0.35));
    return el;
}

/** Faixa da torcida (64 x 18) na cor do clube, com franja. */
export function paintBanner(color: string) {
    const { el, c } = canvas(64, 20);
    c.fillStyle = '#1c1420';
    c.fillRect(0, 0, 64, 17);
    c.fillStyle = color;
    c.fillRect(1, 1, 62, 15);
    c.fillStyle = 'rgba(255,255,255,0.28)';
    c.fillRect(1, 1, 62, 2);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(1, 13, 62, 3);
    c.fillStyle = color;
    for (let x = 2; x < 62; x += 4) c.fillRect(x, 17, 2, 3);
    // escudo simples no meio
    c.fillStyle = '#f4f1e6';
    c.fillRect(28, 3, 8, 8);
    c.fillRect(29, 11, 6, 1);
    c.fillRect(30, 12, 4, 1);
    c.fillStyle = color;
    c.fillRect(30, 5, 4, 4);
    return el;
}

/** Quadro de veludo (44 x 30) com os broches das medalhas (cor = degrau). */
export function paintPins(tiers: number[]) {
    const { el, c } = canvas(44, 30);
    c.fillStyle = '#3a2214';
    c.fillRect(0, 0, 44, 30);
    c.fillStyle = '#6e2236';
    c.fillRect(2, 2, 40, 26);
    c.fillStyle = '#7e2a40';
    c.fillRect(2, 2, 40, 2);
    const pin = ['#4a1624', '#c07a3e', '#b8bfcc', '#e0aa22', '#a8f0f0'];
    tiers.slice(0, 20).forEach((tier, i) => {
        const x = 5 + (i % 5) * 7;
        const y = 6 + Math.floor(i / 5) * 5;
        c.fillStyle = pin[tier] ?? pin[0];
        c.fillRect(x, y, 4, 3);
        if (tier) {
            c.fillStyle = 'rgba(255,255,255,0.6)';
            c.fillRect(x, y, 1, 1);
        }
    });
    return el;
}

/** Polaroid (18 x 22): moldura branca e o fundo da foto (a foto do capitão vem por cima). */
export function paintPolaroid() {
    const { el, c } = canvas(18, 22);
    c.fillStyle = '#2a2030';
    c.fillRect(0, 0, 18, 22);
    c.fillStyle = '#f4f1e6';
    c.fillRect(1, 1, 16, 20);
    c.fillStyle = '#3a6ea8';
    c.fillRect(3, 3, 12, 12);
    c.fillStyle = '#d8342c';
    c.fillRect(8, 0, 2, 2);
    return el;
}
