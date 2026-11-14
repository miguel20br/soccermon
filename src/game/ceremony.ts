/**
 * Cerimônia do título na quadra (docs/planos/animacoes-novas.md, A1 e A2): o roteiro em ms, a câmera e as posições em
 * px do mundo. Puro (sem Phaser, fora a pintura dos torcedores): a MatchScene desenha, o teste confere tempo e lugar.
 *
 * - `taca` (todo título, só na Final vencida): o time pula no seu jeito, anda pro meio em meia-lua e o capitão ergue a
 *   taça, com a placa CAMPEÕES! no alto (~3 s).
 * - `invasao` (só o título da Rota): silêncio, explosão, a torcida e os selvagens invadem e cercam o time, o capitão
 *   vai pro alto e cai sentado, levanta e ergue a taça, foto com a placa no alto da tela (~10,5 s).
 */

export type CeremonyKind = 'taca' | 'invasao';

export interface CeremonyPlan {
    /** O time pula (cada um no seu jeito). */
    jump: number;
    /** Andam pro meio (meia-lua). */
    gather: number;
    /** A torcida entra (só na invasão) e chega no anel. */
    invade?: number;
    ring?: number;
    /** O capitão vai pro alto (3 subidas, a última cai sentado) e levanta. */
    toss?: number;
    getUp?: number;
    /** Junta força, ergue a taça. */
    charge: number;
    lift: number;
    /** A placa no alto (e, na invasão, a foto: todo mundo para). */
    photo: number;
    /** A tela segue (o FinalCard aparece). */
    end: number;
}

export const CHARGE_MS = 450;
export const WALK_MS = 700;
/** Cada subida do capitão jogado pro alto (sobe e desce). */
export const TOSS_MS = 480;
/** Os companheiros chegam junto do capitão pra jogar ele pro alto (e voltam pra meia-lua depois). */
export const HUDDLE_MS = 320;

export function ceremonyPlan(kind: CeremonyKind): CeremonyPlan {
    if (kind === 'taca') return { jump: 0, gather: 500, charge: 1250, lift: 1250 + CHARGE_MS, photo: 1900, end: 3000 };
    return {
        jump: 600,
        gather: 1500,
        invade: 1500,
        ring: 3500,
        toss: 5000,
        getUp: 5000 + TOSS_MS * 3 + 250,
        charge: 6700,
        lift: 6700 + CHARGE_MS,
        photo: 8200,
        end: 10500,
    };
}

/** Fim de jogo com cara (B2): a 1ª reação vem logo depois da faixa FIM DE JOGO entrar; cada um com um atraso. */
export const END_LEAD_MS = 200;
export const END_STAGGER_MS = 90;

export interface EndPose {
    anim: string;
    /** De frente pra câmera (0). */
    facing: number;
    /** Depois do apito (ms): o time não reage todo no mesmo quadro. */
    delay: number;
    /** Reduzir movimento: o último quadro, parado (sem pulo). */
    still: boolean;
}

/**
 * A reação no apito final de quem está no `slot` do time: quem ganhou pula (Hop; Reduzir movimento: a Pose, parada),
 * quem perdeu senta (Sit, do atlas extra) ou fica cabisbaixo (Hurt); empate, Idle. Sem a animação, Idle.
 */
export function endPose(
    team: 0 | 1,
    winner: 0 | 1 | null,
    slot: number,
    has: (anim: string) => boolean,
    reduce: boolean,
): EndPose {
    const wants = winner === null ? [] : winner === team ? (reduce ? ['Pose', 'Hop'] : ['Hop']) : ['Sit', 'Hurt'];
    return {
        anim: wants.find(has) ?? 'Idle',
        facing: 0,
        delay: END_LEAD_MS + slot * END_STAGGER_MS,
        still: reduce,
    };
}

/** Reduzir movimento: só a foto final, parada, por um instante (a invasão segura a placa 2 s). */
export const reducedHold = (kind: CeremonyKind) => (kind === 'invasao' ? 2000 : 1200);

export interface Pt {
    x: number;
    y: number;
}

/**
 * Meia-lua em volta do capitão: ele na frente (mais perto da câmera), os outros atrás em arco, de frente pra ele.
 * `n` = quantos além do capitão. Raio em px.
 */
export function halfMoon(center: Pt, n: number, r = 64): { captain: Pt; others: Pt[] } {
    const captain = { x: center.x, y: center.y + 22 };
    const others = Array.from({ length: n }, (_, i) => {
        // de 200° a 340° (o arco de cima, atrás dele): espalhados por igual
        const a = ((200 + (n === 1 ? 70 : (140 * i) / (n - 1))) * Math.PI) / 180;
        return { x: Math.round(center.x + Math.cos(a) * r), y: Math.round(center.y + Math.sin(a) * r * 0.5) };
    });
    return { captain, others };
}

/** Em volta do capitão, colados (os braços que jogam ele pro alto). */
export function huddle(captain: Pt, n: number): Pt[] {
    return Array.from({ length: n }, (_, i) => {
        const a = ((200 + (n === 1 ? 70 : (140 * i) / (n - 1))) * Math.PI) / 180;
        return { x: Math.round(captain.x + Math.cos(a) * 30), y: Math.round(captain.y + Math.sin(a) * 14) };
    });
}

/** Altura (px) do capitão jogado pro alto, `ms` desde a 1ª subida: 3 parábolas, a 3ª a mais alta (e ele cai). */
export function tossHeight(ms: number): number {
    const k = ms / TOSS_MS;
    if (k <= 0 || k >= 3) return 0;
    const n = Math.floor(k);
    const u = k - n;
    return 4 * [42, 50, 64][n] * u * (1 - u);
}

const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const easeOut = (u: number) => 1 - (1 - u) ** 3;

/**
 * A câmera da cerimônia no tempo `t`: zoom (antes do amortecimento da quadra grande) e quanto o centro sobe (px do
 * mundo; positivo = o time desce na tela, pra placa no alto não cobrir ninguém). Começa do zoom em que o jogo acabou
 * (`from`) e anda por curvas (nada de linha reta): empurra devagar no silêncio, abre pra torcida descendo, fecha no anel
 * e dá um soquinho quando a taça sobe.
 */
export function ceremonyCamera(kind: CeremonyKind, t: number, from = 1): { zoom: number; up: number } {
    const p = ceremonyPlan(kind);
    // [ms, zoom, up, curva]
    type Key = [number, number, number, (u: number) => number];
    const keys: Key[] =
        kind === 'taca'
            ? [
                  [0, from, 0, easeInOut],
                  [900, 1.55, 8, easeInOut],
                  [p.lift, 1.55, 8, easeInOut],
                  [p.lift + 140, 1.64, 10, easeOut],
                  [p.lift + 650, 1.5, 26, easeInOut],
              ]
            : [
                  [0, from, 0, easeInOut],
                  [p.jump, from + 0.1, 0, easeInOut],
                  [(p.invade ?? 0) + 200, from + 0.12, 0, easeInOut],
                  [(p.invade ?? 0) + 1300, 1, 0, easeInOut],
                  [p.ring ?? 0, 1.05, 4, easeInOut],
                  [(p.ring ?? 0) + 1000, 1.32, 10, easeInOut],
                  [p.toss ?? 0, 1.32, 16, easeInOut],
                  [p.charge, 1.38, 12, easeInOut],
                  [p.lift, 1.38, 12, easeInOut],
                  [p.lift + 140, 1.46, 14, easeOut],
                  [p.photo, 1.34, 30, easeInOut],
              ];
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i];
    const b = keys[i + 1];
    if (!b) return { zoom: a[1], up: a[2] };
    const u = b[3](Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))));
    return { zoom: a[1] + (b[1] - a[1]) * u, up: a[2] + (b[2] - a[2]) * u };
}

/** Sorteio pequeno e repetível (a mesma partida dá a mesma invasão: o clipe sai igual). */
function rng(seed: string) {
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

export type Hair = 'curto' | 'bone' | 'longo' | 'black' | 'careca';
export type FanExtra = 'bandeira' | 'cachecol' | null;
export type Shirt = 'clube' | 'branca' | 'listrada';

/** Como cada torcedor é: pele, cabelo, altura, camisa e o que leva na mão. */
export interface FanLook {
    skin: number;
    hair: Hair;
    hairColor: number;
    cap: number;
    short: boolean;
    shirt: Shirt;
    shorts: number;
    extra: FanExtra;
}

export interface Fan {
    from: Pt;
    to: Pt;
    /** Quando sai correndo (ms desde `invade`) e quanto leva até o anel. */
    delay: number;
    dur: number;
    look: FanLook;
    /** Pulo no anel: período (ms), fase (0..1) e altura (px); quem não pula acena com os braços. */
    period: number;
    phase: number;
    hop: number;
    jumps: boolean;
}

export const SKINS = ['#f3cfa6', '#e0ad7f', '#b9814f', '#86532f', '#5c3720'];
export const HAIRS = ['#2b1d14', '#5a3a1e', '#d6a84a', '#121212', '#9a4a22', '#cfcfd6'];
export const SHORTS = ['#2a2f55', '#3b5b8c', '#1b1e3a', '#e8e6f0'];
const HAIR_STYLES: Hair[] = ['curto', 'curto', 'bone', 'longo', 'black', 'careca'];

/**
 * A torcida que invade: `n` torcedores descendo das duas arquibancadas (em cima e embaixo da quadra) em ondas, até
 * uma multidão em volta do time (`center`): a maior parte atrás (em cima, o time fica na frente deles), uns dos lados e
 * poucos na frente, mais longe, pra ninguém cobrir o time. Nada dentro do anel.
 */
export function invasionFans(seed: string, center: Pt, n: number, size: { w: number; h: number }): Fan[] {
    const r = rng(seed);
    const back = Math.round(n * 0.5);
    const sides = Math.round(n * 0.28);
    return Array.from({ length: n }, (_, i) => {
        let a: number;
        let rx: number;
        let ry: number;
        if (i < back) {
            a = 195 + (150 * (i + r() * 0.8)) / back;
            rx = 112 + r() * 70;
            ry = 64 + r() * 30;
        } else if (i < back + sides) {
            const k = i - back;
            const left = k % 2 === 0;
            a = left ? 160 + r() * 35 : -15 + r() * 35;
            rx = 132 + r() * 50;
            ry = 70 + r() * 20;
        } else {
            a = 35 + r() * 110;
            rx = 128 + r() * 50;
            ry = 84 + r() * 16;
        }
        const rad = (a * Math.PI) / 180;
        const to = { x: Math.round(center.x + Math.cos(rad) * rx), y: Math.round(center.y + Math.sin(rad) * ry) };
        const top = to.y < center.y;
        const from = { x: Math.round(to.x + (r() - 0.5) * 220), y: top ? -16 - r() * 50 : size.h + 30 + r() * 50 };
        const style = HAIR_STYLES[Math.floor(r() * HAIR_STYLES.length)];
        const sr = r();
        const er = r();
        const look: FanLook = {
            skin: Math.floor(r() * SKINS.length),
            hair: style,
            hairColor: Math.floor(r() * HAIRS.length),
            cap: Math.floor(r() * 3),
            short: r() < 0.35,
            shirt: sr < 0.68 ? 'clube' : sr < 0.84 ? 'listrada' : 'branca',
            shorts: Math.floor(r() * SHORTS.length),
            extra: er < 0.14 ? 'bandeira' : er < 0.3 ? 'cachecol' : null,
        };
        return {
            from,
            to,
            delay: Math.floor(i % 10) * 70 + Math.floor(r() * 4) * 240 + r() * 160,
            dur: 1250 + r() * 600,
            look,
            period: 460 + r() * 220,
            phase: r(),
            hop: 6 + r() * 6,
            jumps: look.extra !== 'bandeira' && r() < 0.8,
        };
    });
}

/** Quadro do torcedor e quanto ele está no ar (px), `ms` desde que chegou (ou -1 se ainda corre). */
export type FanFrame = 'run0' | 'run1' | 'stand' | 'crouch' | 'up';
export function fanPose(f: Fan, ms: number, running: boolean): { frame: FanFrame; air: number } {
    if (running) return { frame: Math.floor((ms + f.phase * 400) / 110) % 2 ? 'run1' : 'run0', air: 0 };
    if (!f.jumps) return { frame: Math.floor((ms + f.phase * 600) / 300) % 2 ? 'up' : 'stand', air: 0 };
    const u = (ms / f.period + f.phase) % 1;
    // agacha (antecipação), sobe de braço pra cima, cai e agacha de novo (o amortecimento)
    if (u < 0.16 || u > 0.9) return { frame: 'crouch', air: 0 };
    const k = (u - 0.16) / 0.74;
    return { frame: 'up', air: 4 * f.hop * k * (1 - k) };
}

/** Os selvagens da Rota que invadem junto (Pidgey por cima, Rattata no chão, Oddish e o Psyduck atrasado). */
export const INVADERS: { id: number; fly: boolean; late: number }[] = [
    { id: 16, fly: true, late: 0 },
    { id: 19, fly: false, late: 150 },
    { id: 43, fly: false, late: 450 },
    { id: 54, fly: false, late: 1100 },
];

const css = (n: number) => `#${(n & 0xffffff).toString(16).padStart(6, '0')}`;
const shade = (n: number, k: number) =>
    (Math.round(((n >> 16) & 255) * k) << 16) | (Math.round(((n >> 8) & 255) * k) << 8) | Math.round((n & 255) * k);

/** Tamanho do torcedor em pixel de arte (com 1 px de contorno em volta); a cena desenha em 2x. */
export const FAN_W = 16;
export const FAN_H = 21;
export const FAN_FRAMES: FanFrame[] = ['run0', 'run1', 'stand', 'crouch', 'up'];
const INK = '#1b1e3a';

/**
 * Pinta um torcedor em pixel art: cabeça com cabelo (curto, boné, longo, black ou careca), olhos, camisa na cor do
 * clube (ou branca, ou listrada) com sombra de um lado, short, pernas e tênis; braços conforme o quadro; bandeira ou
 * cachecol pra alguns. Contorno escuro de 1 px (aparece em qualquer piso).
 */
export function paintFan(look: FanLook, frame: FanFrame, club: number): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = FAN_W;
    el.height = FAN_H;
    const c = el.getContext('2d')!;
    // grade interna 14 x 19, deslocada 1 px (o contorno)
    const px = (x: number, y: number, w: number, h: number, color: string) => {
        c.fillStyle = color;
        c.fillRect(x + 1, y + 1, w, h);
    };
    const skin = SKINS[look.skin];
    const hair = HAIRS[look.hairColor];
    const shirtMain = look.shirt === 'branca' ? 0xe8e6f0 : club;
    const shirt = css(shirtMain);
    const shirtDark = css(shade(shirtMain, 0.72));
    const shorts = SHORTS[look.shorts];
    const capColor = [css(club), '#e8e6f0', '#2a2f55'][look.cap];
    const crouch = frame === 'crouch';
    // baixinho e agachado descem o corpo 1 px (as pernas encolhem)
    const dy = (look.short ? 1 : 0) + (crouch ? 1 : 0);
    const X = 4; // a cabeça vai de X a X+4 (o corpo no meio da grade)
    // cabeça
    const hy = 3 + dy;
    px(X, hy, 5, 4, skin);
    px(X + 1, hy + 1, 1, 1, INK);
    px(X + 3, hy + 1, 1, 1, INK);
    if (frame === 'up' || crouch) px(X + 2, hy + 3, 1, 1, '#7a2b2b');
    // cabelo
    if (look.hair === 'curto') {
        px(X, hy - 1, 5, 1, hair);
        px(X, hy, 1, 1, hair);
        px(X + 4, hy, 1, 1, hair);
    } else if (look.hair === 'bone') {
        px(X, hy - 1, 5, 1, capColor);
        px(X - 1, hy, 6, 1, capColor);
    } else if (look.hair === 'longo') {
        px(X, hy - 1, 5, 1, hair);
        px(X, hy, 1, 4, hair);
        px(X + 4, hy, 1, 4, hair);
    } else if (look.hair === 'black') {
        px(X, hy - 2, 5, 1, hair);
        px(X - 1, hy - 1, 7, 1, hair);
        px(X - 1, hy, 1, 2, hair);
        px(X + 5, hy, 1, 2, hair);
    } else px(X + 1, hy - 1, 3, 1, skin);
    // camisa (sombra na direita), listra
    const sy = hy + 4;
    px(X, sy, 5, 5, shirt);
    px(X + 4, sy, 1, 5, shirtDark);
    if (look.shirt === 'listrada') px(X, sy + 2, 5, 1, '#e8e6f0');
    // short e pernas
    const ly = sy + 5;
    px(X, ly, 5, 2, shorts);
    const legH = 19 - (ly + 2);
    const leg = (x: number, h: number) => {
        px(x, ly + 2, 1, Math.max(1, h - 1), skin);
        px(x - (x < X + 2 ? 1 : 0), ly + 1 + h, 2, 1, INK);
    };
    if (frame === 'run0') {
        leg(X, legH);
        leg(X + 4, legH - 1);
    } else if (frame === 'run1') {
        leg(X, legH - 1);
        leg(X + 4, legH);
    } else if (crouch) {
        leg(X, legH);
        leg(X + 4, legH);
    } else {
        leg(X + 1, legH);
        leg(X + 3, legH);
    }
    // braços: manga na cor da camisa, mão na cor da pele
    const arm = (side: -1 | 1, pose: 'up' | 'down' | 'fwd' | 'out') => {
        const x = side < 0 ? X - 1 : X + 5;
        if (pose === 'up') {
            px(x, sy - 4, 1, 1, skin);
            px(x, sy - 3, 1, 4, side < 0 ? shirt : shirtDark);
        } else if (pose === 'fwd') {
            px(x, sy - 1, 1, 1, skin);
            px(x, sy, 1, 2, side < 0 ? shirt : shirtDark);
        } else if (pose === 'out') {
            px(x, sy + 1, 1, 2, side < 0 ? shirt : shirtDark);
            px(x + side, sy, 1, 1, skin);
        } else {
            px(x, sy, 1, 3, side < 0 ? shirt : shirtDark);
            px(x, sy + 3, 1, 1, skin);
        }
    };
    const flag = look.extra === 'bandeira';
    if (frame === 'up') {
        arm(-1, 'up');
        arm(1, 'up');
    } else if (frame === 'run0') {
        arm(-1, 'fwd');
        arm(1, flag ? 'up' : 'down');
    } else if (frame === 'run1') {
        arm(-1, 'down');
        arm(1, flag ? 'up' : 'fwd');
    } else if (crouch) {
        arm(-1, 'out');
        arm(1, flag ? 'up' : 'out');
    } else {
        arm(-1, 'down');
        arm(1, flag ? 'up' : 'down');
    }
    // bandeira: o mastro sai da mão direita levantada, o pano na cor do clube com uma faixa branca
    if (flag) {
        const hx = X + 5;
        const top = Math.max(0, sy - 9);
        px(hx, top, 1, sy - 4 - top, '#c9b28a');
        px(hx + 1, top, 3, 3, css(club));
        px(hx + 1, top + 1, 3, 1, '#e8e6f0');
    }
    // cachecol: esticado entre as mãos levantadas, ou no pescoço
    if (look.extra === 'cachecol') {
        if (frame === 'up') for (let k = 0; k < 7; k++) px(X - 1 + k, sy - 5, 1, 1, k % 2 ? '#e8e6f0' : css(club));
        else {
            for (let k = 0; k < 5; k++) px(X + k, sy, 1, 1, k % 2 ? '#e8e6f0' : css(club));
            px(X + 1, sy + 1, 1, 2, css(club));
        }
    }
    outline(c);
    return el;
}

/** Contorno de 1 px nos vizinhos transparentes do que foi pintado. */
function outline(c: CanvasRenderingContext2D) {
    const img = c.getImageData(0, 0, FAN_W, FAN_H);
    const d = img.data;
    const solid = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < FAN_W && y < FAN_H && d[(y * FAN_W + x) * 4 + 3] > 0;
    const marks: number[] = [];
    for (let y = 0; y < FAN_H; y++)
        for (let x = 0; x < FAN_W; x++)
            if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)))
                marks.push(x, y);
    c.fillStyle = INK;
    for (let i = 0; i < marks.length; i += 2) c.fillRect(marks[i], marks[i + 1], 1, 1);
}
