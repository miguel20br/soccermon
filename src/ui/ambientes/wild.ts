/**
 * Pokémon ambiente dos menus (`?lab=ambientes`): em cada lugar, 1 a 4 Pokémon sorteados de um pool que combina com o
 * lugar, cada um fazendo ações aleatórias com timer (andar, parar, olhar pros lados, dormir, pular, emote, perseguir
 * outro, fugir quando o time passa). Só tela: aqui pode `Math.random` (o motor determinístico é `src/engine`).
 * Coordenadas de 0 a 1 dentro da caixa da zona; `aspect` (largura/altura da caixa) deixa a velocidade e a direção
 * iguais na horizontal e na vertical.
 */
import { type Dex, hasSticker } from '../../store/profile';
import { TABS, type Tab } from './nav';

export type Mood = 'calm' | 'busy' | 'sleepy' | 'shy';
/** Uma vaga do sorteio: a zona do lugar, quem pode cair nela e a chance de a vaga existir (1 = sempre). */
export interface Slot {
    zone: string;
    ids: readonly number[];
    mood?: Mood;
    chance?: number;
}

/**
 * Os pools. Rota: selvagens de Kanto no mato, na água e no céu. Estádio: um dormindo na arquibancada, um gandula na
 * linha de fundo e torcedores/mascotes na beira. Lab, Arena e Sede: 1 ou 2 no chão, pra não ficarem vazios.
 */
export const POOLS: Record<Tab, readonly Slot[]> = {
    rota: [
        { zone: 'grass', ids: [16, 19, 10, 13, 29, 32, 43, 69, 56, 39, 52, 25, 27, 23, 37, 58, 46, 35, 84, 48] },
        { zone: 'grass', ids: [16, 19, 10, 13, 29, 32, 43, 69, 56, 39, 52, 25, 27, 23, 37, 58, 46, 35, 84, 48] },
        { zone: 'water', ids: [129, 72, 118, 60, 54, 86, 90, 116, 120, 98, 79, 7], mood: 'calm' },
        { zone: 'sky', ids: [21, 17, 12, 22, 18, 49, 15, 83], chance: 0.6 },
    ],
    estadio: [
        { zone: 'stand', ids: [143, 79, 39, 96, 133, 52, 74], mood: 'sleepy' },
        { zone: 'ball', ids: [58, 19, 133, 25, 50, 77, 128], mood: 'busy', chance: 0.85 },
        { zone: 'edge', ids: [25, 35, 122, 54, 113, 66, 104, 132, 36, 125] },
        { zone: 'edge', ids: [25, 35, 122, 54, 113, 66, 104, 132, 36, 125], chance: 0.5 },
    ],
    lab: [
        { zone: 'floor', ids: [1, 4, 7, 137, 81, 100, 132, 63], mood: 'busy' },
        { zone: 'floor', ids: [1, 4, 7, 137, 81, 100, 132, 63], mood: 'busy', chance: 0.5 },
    ],
    arena: [
        { zone: 'floor', ids: [66, 56, 106, 107, 57, 62, 68, 128, 115], mood: 'busy' },
        { zone: 'floor', ids: [66, 56, 106, 107, 57, 62, 68, 128, 115], mood: 'busy', chance: 0.5 },
    ],
    sede: [
        { zone: 'floor', ids: [52, 113, 58, 133, 35, 108, 143, 40], mood: 'busy' },
        { zone: 'floor', ids: [52, 113, 58, 133, 35, 108, 143, 40], mood: 'busy', chance: 0.5 },
    ],
};

/** Peso no sorteio de quem você já viu na Pokédex (fica pessoal); quem nunca apareceu pesa 1. */
export const SEEN_WEIGHT = 4;
/** Sprites ambiente montados ao mesmo tempo (a aba da tela e as vizinhas, que aparecem no arrasto). */
export const MAX_WILD = 8;

export interface Wild {
    key: string;
    id: number;
    zone: string;
    mood: Mood;
    /** Folha shiny (Pokémon do clube que já jogou shiny por você). */
    shiny?: boolean;
    /** Artilheiro do clube: os gols aparecem num balão quando tocam nele. */
    goals?: number;
}

type Rand = () => number;

/** Sorteio de um lugar: cada vaga (se a chance deixar) pega alguém do pool, sem repetir espécie no lugar. */
export function rollWild(tab: Tab, seen: (id: number) => boolean, rand: Rand = Math.random): Wild[] {
    const used = new Set<number>();
    const out: Wild[] = [];
    POOLS[tab].forEach((slot, i) => {
        if (rand() >= (slot.chance ?? 1)) return;
        const ids = slot.ids.filter((id) => !used.has(id));
        if (!ids.length) return;
        const w = ids.map((id) => (seen(id) ? SEEN_WEIGHT : 1));
        let r = rand() * w.reduce((a, b) => a + b, 0);
        let k = 0;
        while (k < ids.length - 1 && r >= w[k]) r -= w[k++];
        used.add(ids[k]);
        out.push({ key: `${tab}-${i}`, id: ids[k], zone: slot.zone, mood: slot.mood ?? 'calm' });
    });
    return out;
}

export function rollAll(seen: (id: number) => boolean, rand: Rand = Math.random): Record<Tab, Wild[]> {
    return Object.fromEntries(TABS.map((t) => [t, rollWild(t, seen, rand)])) as Record<Tab, Wild[]>;
}

/** Pokémon do clube na Sede: no máximo esse tanto (o celular mostra menos, `Sede.tsx`). */
export const CLUB_MAX = 6;

/**
 * Quem anda na Sede: os mais usados do jogador (Pokédex: mais partidas, desempate minutos), com o artilheiro (mais
 * gols) sempre na frente da fila, pra sobrar até no celular. Save sem partida = lista vazia (a Sede sorteia como antes).
 */
export function clubWild(dex: Dex, n = CLUB_MAX): Wild[] {
    const played = Object.entries(dex)
        .map(([id, e]) => ({ id: Number(id), e }))
        .filter(({ e }) => e.matches > 0);
    const used = [...played].sort((a, b) => b.e.matches - a.e.matches || b.e.minutes - a.e.minutes || a.id - b.id);
    const scorer = played
        .filter(({ e }) => e.goals > 0)
        .sort((a, b) => b.e.goals - a.e.goals || b.e.matches - a.e.matches || a.id - b.id)[0];
    const order = scorer ? [scorer, ...used.filter((x) => x !== scorer)] : used;
    return order.slice(0, n).map(({ id, e }) => ({
        key: `sede-${id}`,
        id,
        zone: 'floor',
        mood: 'busy',
        ...(hasSticker(e, 'shiny') && { shiny: true }),
        ...(scorer?.id === id && { goals: e.goals }),
    }));
}

/**
 * Quantos sprites cada aba monta: a da tela primeiro (todos), depois a vizinha da esquerda e a da direita até o
 * teto; as longe, nenhum (nem baixam a folha).
 */
export function wildQuota(tab: number, counts: readonly number[], max = MAX_WILD): number[] {
    const out = counts.map(() => 0);
    let left = max;
    for (const i of [tab, tab - 1, tab + 1]) {
        if (i < 0 || i >= counts.length) continue;
        out[i] = Math.min(counts[i], left);
        left -= out[i];
    }
    return out;
}

// ---------------------------------------------------------------------------------------------- ações

export type Act = 'idle' | 'walk' | 'look' | 'sleep' | 'hop' | 'emote' | 'chase' | 'flee' | 'fall';
/** `goal`: o balão com os gols do artilheiro (só no toque). */
export type Emote = 'heart' | 'note' | 'surprise' | 'question' | 'goal';
export interface Pt {
    x: number;
    y: number;
    /** Raio do susto (em alturas da caixa); sem raio, 0,16. */
    r?: number;
}
/** Retângulo em unidades da caixa da zona (0 a 1): esquerda, cima, direita, baixo. */
export type Box = readonly [l: number, t: number, r: number, b: number];
/**
 * Uma zona: onde dá pra pisar, a velocidade (alturas da caixa por segundo) e se voa ou fica sentado. O resto vem da
 * tela (`WildZone` mede): `bounds`, a parte da caixa que aparece (o corpo inteiro tem que caber nela); `blocks`, o
 * que fica na frente de todo mundo (botões, textos, a parede do túnel); `props`, o que só quem anda no chão
 * respeita (o pé dos móveis, as insígnias do mapa). Sem medida (testes, antes do 1º quadro), só o `ok` vale.
 */
export interface Area {
    aspect: number;
    ok: (x: number, y: number) => boolean;
    speed: number;
    fly?: boolean;
    still?: boolean;
    bounds?: Box;
    blocks?: Box[];
    props?: Box[];
    /** Os móveis inteiros (do alto do móvel até a base, com folga embaixo): quem anda nunca pisa dentro nem atrás de
     * um (o pé fica sempre na frente, então desenhar o Pokémon por cima do móvel é a profundidade certa). */
    furniture?: Box[];
    /** Zonas de chão com a mesma caixa na tela (o mato e a água do mapa, a linha de fundo e a beira da quadra) têm a
     * mesma chave: quem está numa não atravessa quem está na outra. */
    ground?: string;
    /** O espaço do balão (emote, Zzz) em cima da cabeça, em alturas da caixa: também tem que caber. */
    head?: number;
}
export interface Actor extends Wild {
    x: number;
    y: number;
    tx: number;
    ty: number;
    act: Act;
    /** ms até a próxima decisão. */
    left: number;
    /** Hora do relógio em que a ação começou (o pulo e o emote começam do 1º quadro). */
    t0: number;
    /** Direção PMD: 0 frente, 2 direita, 4 costas, 6 esquerda (e as diagonais no meio). */
    dir: number;
    emote?: Emote;
    prey?: string;
    /** O corpo (com o balão em cima) em volta do pé, em unidades da caixa: [-esq, -cima, dir, baixo]. Medido na tela. */
    body?: Box;
    /** Achou lugar livre na tela medida (senão fica escondido, em vez de aparecer atrás de um botão). */
    shown: boolean;
    /** O chão onde ele está (`Area.ground`). */
    ground?: string;
    /** Não cabe mais onde está: some com fade e só nessa hora (relógio da cena) muda de lugar. */
    moveAt?: number;
    /** Os próximos pontos da caminhada, depois de (tx, ty) (o desvio em volta de um móvel). */
    path?: [number, number][];
    /** Hora dos últimos toques (o 5º seguido derruba). */
    taps?: number[];
}

/** Toques seguidos que derrubam (o 5º em até 2 s) e quanto tempo ele fica no chão (a animação `wild-fall` do CSS). */
export const KO_TAPS = 5;
export const KO_WINDOW = 2000;
export const FALL_MS = 1900;

/** Quanto o Pokémon que precisa mudar de lugar fica escondido antes de reaparecer (o fade do `.wild.off`). */
export const HIDE_MS = 260;

const WEIGHTS: Record<Mood, Partial<Record<Act, number>>> = {
    calm: { walk: 4, idle: 3, look: 2, hop: 1, emote: 1, chase: 1, sleep: 0.5 },
    busy: { walk: 6, idle: 1, look: 1, hop: 2, emote: 1, chase: 2 },
    sleepy: { sleep: 8, idle: 2, look: 1, walk: 0.5, emote: 0.5 },
    shy: { walk: 3, idle: 2, look: 3, hop: 0.5, emote: 0.5 },
};
const EMOTES: Emote[] = ['heart', 'note', 'question', 'surprise'];
const between = (rand: Rand, a: number, b: number) => a + rand() * (b - a);

/** Direção PMD de um passo (dx, dy em unidades de altura, y pra baixo). */
export function dirOf(dx: number, dy: number): number {
    const k = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8; // 0 direita, 2 baixo, 4 esquerda, 6 cima
    return (2 - k + 8) % 8;
}

const hit = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const bodyAt = (body: Box, x: number, y: number): Box => [x + body[0], y + body[1], x + body[2], y + body[3]];

/**
 * Dá pra ficar em (x, y)? O pé num lugar que a zona deixa, longe da borda, e (com a tela medida) o corpo inteiro à
 * vista, fora dos botões e textos e, pra quem anda, fora do pé dos móveis.
 */
export function fits(area: Area, x: number, y: number, body?: Box): boolean {
    if (!(x > 0.02 && x < 0.98 && y > 0.02 && y < 0.98) || !(area.fly || area.ok(x, y))) return false;
    if (!body) return true;
    const b = bodyAt([body[0], body[1] - (area.head ?? 0), body[2], body[3]], x, y);
    const [l, t, r, bot] = area.bounds ?? [0, 0, 1, 1];
    if (b[0] < l || b[1] < t || b[2] > r || b[3] > bot) return false;
    if (area.blocks?.some((k) => hit(b, k))) return false;
    if (area.fly) return true;
    // o pé (na largura do corpo) fora de qualquer móvel: nada de ficar em cima nem atrás de um
    const foot: Box = [x + body[0], y - 0.01, x + body[2], y];
    return !area.props?.some((k) => hit(b, k)) && !area.furniture?.some((k) => hit(foot, k));
}

/** Dá pra andar reto de (x, y) a (tx, ty)? Confere o caminho a cada 0,02 altura da caixa. */
export function clear(area: Area, x: number, y: number, tx: number, ty: number, body?: Box): boolean {
    const n = Math.ceil(Math.hypot((tx - x) * area.aspect, ty - y) / 0.02);
    for (let i = 1; i <= n; i++) if (!fits(area, x + ((tx - x) * i) / n, y + ((ty - y) * i) / n, body)) return false;
    return true;
}

/**
 * O caminho de uma caminhada (pontos depois do de partida, o último é o destino), sem atravessar nada: quase sempre
 * com uma curva leve (um ponto no meio, um pouco pro lado, pra não andar feito régua), senão reto; se os dois batem
 * num móvel, o desvio por uma grade grossa do chão. `null` = não tem como chegar lá.
 */
export function planWalk(
    area: Area,
    x: number,
    y: number,
    tx: number,
    ty: number,
    body?: Box,
    rand: Rand = Math.random,
): [number, number][] | null {
    if (!fits(area, tx, ty, body)) return null;
    // a perpendicular do caminho (em alturas da caixa), pra entortar
    const dx = (tx - x) * area.aspect;
    const dy = ty - y;
    const d = Math.hypot(dx, dy) || 1;
    const off = (0.1 + rand() * 0.15) * (rand() < 0.5 ? 1 : -1) * d;
    const mx = (x + tx) / 2 + ((-dy / d) * off) / area.aspect;
    const my = (y + ty) / 2 + (dx / d) * off;
    if (clear(area, x, y, mx, my, body) && clear(area, mx, my, tx, ty, body))
        return [
            [mx, my],
            [tx, ty],
        ];
    if (clear(area, x, y, tx, ty, body)) return [[tx, ty]];
    return gridPath(area, x, y, tx, ty, body);
}

/** Linhas da grade do desvio (as colunas seguem o formato da caixa): 12 x ~20 casas, uma busca por caminhada. */
const GRID_ROWS = 12;

/**
 * Desvio pela grade: busca em largura entre os centros das casas livres (vizinhas ligadas só se der pra andar reto
 * de uma à outra) e depois corta caminho (de cada ponto, o mais longe que dá pra ver em linha reta).
 */
function gridPath(area: Area, x: number, y: number, tx: number, ty: number, body?: Box): [number, number][] | null {
    const rows = GRID_ROWS;
    const cols = Math.max(4, Math.round(rows * area.aspect));
    const at = (i: number): [number, number] => [((i % cols) + 0.5) / cols, (Math.floor(i / cols) + 0.5) / rows];
    const free = Array.from({ length: cols * rows }, (_, i) => fits(area, ...at(i), body));
    // as casas em volta de um ponto que ele alcança em linha reta
    const around = (px: number, py: number) => {
        const out: number[] = [];
        const [c0, r0] = [Math.floor(px * cols), Math.floor(py * rows)];
        for (let r = r0 - 1; r <= r0 + 1; r++)
            for (let c = c0 - 1; c <= c0 + 1; c++) {
                const i = r * cols + c;
                if (c >= 0 && c < cols && r >= 0 && r < rows && free[i] && clear(area, px, py, ...at(i), body))
                    out.push(i);
            }
        return out;
    };
    const goal = new Set(around(tx, ty));
    const prev = new Map<number, number>();
    const queue = around(x, y);
    for (const i of queue) prev.set(i, -1);
    for (let q = 0; q < queue.length; q++) {
        const i = queue[q];
        if (goal.has(i)) {
            const cells: [number, number][] = [[tx, ty]];
            for (let k = i; k >= 0; k = prev.get(k) ?? -1) cells.unshift(at(k));
            // corta caminho: de onde está, vai direto ao ponto mais adiante que ele enxerga
            const out: [number, number][] = [];
            let [cx, cy] = [x, y];
            for (let k = 0; k < cells.length; ) {
                let far = k;
                while (far + 1 < cells.length && clear(area, cx, cy, ...cells[far + 1], body)) far++;
                out.push(cells[far]);
                [cx, cy] = cells[far];
                k = far + 1;
            }
            return out;
        }
        const [c, r] = [i % cols, Math.floor(i / cols)];
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                const j = (r + dr) * cols + c + dc;
                if (c + dc < 0 || c + dc >= cols || r + dr < 0 || r + dr >= rows || prev.has(j) || !free[j]) continue;
                if (!clear(area, ...at(i), ...at(j), body)) continue;
                prev.set(j, i);
                queue.push(j);
            }
    }
    return null;
}

/** Quanto o corpo de `a` em (x, y) cobre o de `o` (0 a 1, pela área do menor). */
function cover(a: Actor, x: number, y: number, o: Actor): number {
    if (!a.body || !o.body) return 0;
    const p = bodyAt(a.body, x, y);
    const q = bodyAt(o.body, o.x, o.y);
    const w = Math.min(p[2], q[2]) - Math.max(p[0], q[0]);
    const h = Math.min(p[3], q[3]) - Math.max(p[1], q[1]);
    if (w <= 0 || h <= 0) return 0;
    return (w * h) / Math.min((p[2] - p[0]) * (p[3] - p[1]), (q[2] - q[0]) * (q[3] - q[1]));
}
/** Um em cima do outro a partir daqui (sprite dentro do sprite); menos que isso, um passa na frente do outro. */
export const CROWD = 0.3;
/** Quem está em (x, y) colado em `a` (da mesma zona, visível); `skip` = quem ele persegue ou quem o persegue. */
function crowd(a: Actor, x: number, y: number, all: readonly Actor[], skip?: string): Actor | undefined {
    return all.find(
        (o) =>
            o !== a &&
            (o.zone === a.zone || (!!a.ground && o.ground === a.ground)) &&
            o.shown &&
            o.key !== skip &&
            o.prey !== a.key &&
            cover(a, x, y, o) > CROWD,
    );
}

/** Um ponto válido perto de (x, y), a até `r` alturas, sem ficar colado em ninguém; `null` se não achar em 16 tentativas. */
function spotNear(a: Actor, all: readonly Actor[], area: Area, r: number, rand: Rand): [number, number] | null {
    for (let i = 0; i < 16; i++) {
        const t = rand() * Math.PI * 2;
        const d = r * (0.35 + 0.65 * rand());
        const nx = a.x + (Math.cos(t) * d) / area.aspect;
        const ny = a.y + Math.sin(t) * d;
        if (fits(area, nx, ny, a.body) && !crowd(a, nx, ny, all)) return [nx, ny];
    }
    return null;
}

/** Um lugar livre qualquer da zona (60 tentativas). */
function anySpot(a: Actor, all: readonly Actor[], area: Area, rand: Rand): [number, number] | null {
    for (let i = 0; i < 60; i++) {
        const nx = between(rand, 0.06, 0.94);
        const ny = between(rand, 0.06, 0.94);
        if (fits(area, nx, ny, a.body) && !crowd(a, nx, ny, all)) return [nx, ny];
    }
    return null;
}

export function spawn(w: Wild, area: Area, rand: Rand = Math.random, now = 0, all: readonly Actor[] = []): Actor {
    const a: Actor = { ...w, x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, act: 'idle', left: 0, t0: now, dir: 0, shown: false };
    const p = anySpot(a, all, area, rand);
    if (p) [a.x, a.y] = p;
    a.tx = a.x;
    a.ty = a.y;
    // sem medida da tela, aparece já; com medida, o 1º passo confere o lugar (corpo, botões) antes de mostrar
    a.shown = !!p && !area.bounds;
    a.dir = rand() < 0.5 ? 0 : 7;
    a.left = between(rand, 200, 1600); // cada um decide numa hora: ninguém sai andando junto
    if (area.fly) begin(a, 'walk', [], area, rand, now);
    else if (w.mood === 'sleepy') begin(a, 'sleep', [], area, rand, now);
    return a;
}

function begin(a: Actor, act: Act, all: Actor[], area: Area, rand: Rand, now: number) {
    a.act = act;
    a.t0 = now;
    a.emote = undefined;
    a.prey = undefined;
    a.path = undefined;
    if (act === 'walk') {
        if (area.fly) {
            const p = anySpot(a, [], area, rand);
            if (!p) return begin(a, 'idle', all, area, rand, now);
            [a.tx, a.ty] = p;
            a.left = 9000;
            return;
        }
        // um passeio de verdade (perto ou atravessando a sala), por um caminho que não bate em móvel
        for (let i = 0; i < 4; i++) {
            const p = spotNear(a, all, area, rand() < 0.4 ? 0.6 : 0.3, rand);
            const path = p && planWalk(area, a.x, a.y, p[0], p[1], a.body, rand);
            if (!path) continue;
            [a.tx, a.ty] = path[0];
            a.path = path.slice(1);
            a.left = 8000;
            return;
        }
        return begin(a, 'idle', all, area, rand, now);
    } else if (act === 'chase') {
        const prey = all.filter(
            (o) => o !== a && o.zone === a.zone && o.shown && o.act !== 'sleep' && o.act !== 'flee',
        );
        if (!prey.length) return begin(a, 'walk', all, area, rand, now);
        const p = prey[Math.floor(rand() * prey.length)];
        a.prey = p.key;
        a.left = between(rand, 2200, 3200);
        flee(p, a, area, now);
    } else if (act === 'sleep') {
        a.dir = 0;
        a.left = between(rand, 4000, 9000);
    } else if (act === 'hop') {
        a.left = 900;
    } else if (act === 'emote') {
        a.emote = EMOTES[Math.floor(rand() * EMOTES.length)];
        a.left = between(rand, 1400, 2000);
    } else if (act === 'look') {
        a.left = between(rand, 1400, 2400);
    } else if (act === 'fall') {
        a.dir = 0;
        a.tx = a.x;
        a.ty = a.y;
        a.left = FALL_MS;
    } else {
        a.left = between(rand, 1000, 2600);
    }
}

/** Foge de `from`: corre pro lado oposto até onde der pisar. */
function flee(a: Actor, from: Pt, area: Area, now: number) {
    a.path = undefined;
    a.act = 'flee';
    a.t0 = now;
    a.prey = undefined;
    a.emote = 'surprise';
    a.left = 1800;
    let dx = (a.x - from.x) * area.aspect;
    let dy = a.y - from.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    for (const turn of [0, 0.6, -0.6, 1.2, -1.2]) {
        const c = Math.cos(turn);
        const s = Math.sin(turn);
        const ux = dx * c - dy * s;
        const uy = dx * s + dy * c;
        for (const len of [0.35, 0.22, 0.12]) {
            const nx = a.x + (ux * len) / area.aspect;
            const ny = a.y + uy * len;
            if (clear(area, a.x, a.y, nx, ny, a.body)) {
                a.tx = nx;
                a.ty = ny;
                return;
            }
        }
    }
    a.tx = a.x;
    a.ty = a.y;
}

function choose(a: Actor, all: Actor[], area: Area, rand: Rand, now: number) {
    const w = { ...WEIGHTS[a.mood] };
    if (area.fly) {
        begin(a, 'walk', all, area, rand, now);
        return;
    }
    if (area.still) {
        w.idle = (w.idle ?? 0) + (w.walk ?? 0) + (w.chase ?? 0);
        w.walk = 0;
        w.chase = 0;
    }
    if (!all.some((o) => o !== a && o.zone === a.zone && o.shown && o.act !== 'sleep')) w.chase = 0;
    const acts = Object.keys(w) as Act[];
    let r = rand() * acts.reduce((s, k) => s + (w[k] ?? 0), 0);
    let pick = acts[acts.length - 1];
    for (const k of acts) {
        r -= w[k] ?? 0;
        if (r < 0) {
            pick = k;
            break;
        }
    }
    begin(a, pick, all, area, rand, now);
}

/**
 * Tocaram nele: pula com um coração ou uma nota (o artilheiro, com os gols, um pouco mais pra dar tempo de ler); quem
 * dormia acorda assustado. O 5º toque seguido (em até 2 s, contados em `at`, o relógio de verdade) derruba: cai de
 * costas, fica tonto um pouco no chão e levanta andando (o `step`). Caído, toque não faz nada.
 */
export function poke(a: Actor, now: number, rand: Rand = Math.random, at = now): 'hop' | 'woke' | 'fall' {
    if (a.act === 'fall') return 'fall';
    a.taps = [...(a.taps ?? []).filter((t) => at - t < KO_WINDOW), at];
    a.prey = undefined;
    a.path = undefined;
    a.tx = a.x;
    a.ty = a.y;
    a.dir = 0;
    a.t0 = now;
    if (a.taps.length >= KO_TAPS) {
        a.taps = [];
        a.act = 'fall';
        a.emote = undefined;
        a.left = FALL_MS;
        return 'fall';
    }
    const woke = a.act === 'sleep';
    a.act = 'hop';
    a.left = a.goals && !woke ? 2000 : 900;
    a.emote = woke ? 'surprise' : a.goals ? 'goal' : rand() < 0.5 ? 'heart' : 'note';
    return woke ? 'woke' : 'hop';
}

/** Depois de cair: levanta e sai andando (quem fica parado no lugar, só levanta). */
export function getUp(a: Actor, all: Actor[], area: Area, now: number, rand: Rand = Math.random) {
    begin(a, area.still ? 'idle' : 'walk', all, area, rand, now);
}

const LOOK = [2, 0, 6, 0];

/** Fim de uma caminhada (chegou ou deu de cara com alguém): para e respira, ou olha em volta, antes da próxima. */
function rest(a: Actor, rand: Rand, now: number) {
    a.act = rand() < 0.6 ? 'idle' : 'look';
    a.t0 = now;
    a.path = undefined;
    a.tx = a.x;
    a.ty = a.y;
    a.left = between(rand, 700, 2200);
}

/**
 * Um passo de todos (dt em ms, `now` = hora do relógio da cena). Mexe nos atores no lugar e devolve `true` se
 * alguma ação, direção ou emote mudou (aí a tela redesenha; a posição a tela escreve direto a cada quadro).
 * `threats`: por zona, quem assusta (o time passando): quem está perto foge, quem dorme acorda assustado.
 */
export function step(
    actors: Actor[],
    areas: Record<string, Area | undefined>,
    dt: number,
    now: number,
    threats: Record<string, Pt[] | undefined> = {},
    rand: Rand = Math.random,
): boolean {
    let changed = false;
    // o chão de cada um antes de alguém andar (quem anda primeiro já respeita quem vem depois na lista)
    for (const a of actors) a.ground = areas[a.zone]?.fly ? undefined : areas[a.zone]?.ground;
    for (const a of actors) {
        const area = areas[a.zone];
        if (!area) continue;
        const before = `${a.act}${a.dir}${a.emote}${a.t0}${a.shown}`;
        // com a tela medida: o lugar ainda serve? (a tela girou, apareceu um botão) Senão, outro lugar livre; sem
        // nenhum, fica escondido até abrir espaço
        // o sprite ainda não carregou: sem tamanho, sem lugar certo
        if (area.bounds && !a.body) a.shown = false;
        else if (area.bounds && !fits(area, a.x, a.y, a.body)) {
            // nada teleporta: quem estava à vista some com fade aqui e só depois reaparece no lugar novo
            if (a.shown) {
                a.shown = false;
                a.moveAt = now + HIDE_MS;
            } else if (a.moveAt === undefined || now >= a.moveAt) {
                const p = anySpot(a, actors, area, rand);
                a.moveAt = undefined;
                a.shown = !!p;
                if (p) {
                    [a.x, a.y] = p;
                    a.tx = a.x;
                    a.ty = a.y;
                    if (a.act === 'walk' || a.act === 'chase' || a.act === 'flee') a.left = 0;
                }
            }
        } else if (area.bounds) {
            a.shown = true;
            a.moveAt = undefined;
        }
        if (!a.shown) {
            if (`${a.act}${a.dir}${a.emote}${a.t0}${a.shown}` !== before) changed = true;
            continue;
        }
        for (const t of threats[a.zone] ?? []) {
            if (a.act === 'flee' || a.act === 'fall' || area.fly) break;
            if (Math.hypot((t.x - a.x) * area.aspect, t.y - a.y) > (t.r ?? 0.16)) continue;
            if (area.still) {
                if (a.emote !== 'surprise') begin(a, 'emote', actors, area, rand, now);
                a.emote = 'surprise';
            } else flee(a, t, area, now);
            break;
        }
        a.left -= dt;
        if (a.act === 'walk' || a.act === 'chase' || a.act === 'flee') {
            const p = a.act === 'chase' ? actors.find((o) => o.key === a.prey) : undefined;
            if (a.act === 'chase') {
                if (!p) a.left = 0;
                else {
                    a.tx = p.x;
                    a.ty = p.y;
                }
            }
            const k = a.act === 'flee' ? 2.2 : a.act === 'chase' ? 1.7 : 1;
            const len = (area.speed * k * dt) / 1000;
            const dx = (a.tx - a.x) * area.aspect;
            const dy = a.ty - a.y;
            const d = Math.hypot(dx, dy);
            if (d > 1e-4) a.dir = dirOf(dx, dy);
            const [nx, ny] = d <= len ? [a.tx, a.ty] : [a.x + (dx / d) * (len / area.aspect), a.y + (dy / d) * len];
            // alcançou quem perseguia: encosta (sem entrar no sprite dele) e solta um coração
            if (p && (d < 0.05 || cover(a, nx, ny, p) > CROWD / 2)) {
                begin(a, 'emote', actors, area, rand, now);
                a.emote = 'heart';
            } else {
                // não atravessa ninguém: se o passo entra no sprite de outro, para (afastar pode)
                const o = crowd(a, nx, ny, actors, a.prey);
                if (fits(area, nx, ny, a.body) && (!o || cover(a, nx, ny, o) < cover(a, a.x, a.y, o))) {
                    a.x = nx;
                    a.y = ny;
                    // chegou num ponto do caminho: segue pro próximo; no fim, para um pouco antes de decidir de novo
                    if (d <= len && a.act !== 'chase') {
                        const next = a.path?.shift();
                        if (next) [a.tx, a.ty] = next;
                        else if (a.act === 'walk' && !area.fly) rest(a, rand, now);
                        else a.left = 0;
                    }
                } else if (a.act === 'walk' && !area.fly) rest(a, rand, now);
                else a.left = 0;
            }
        } else if (a.act === 'look') {
            a.dir = LOOK[Math.floor(a.left / 600) & 3];
        }
        if (a.left <= 0) {
            if (a.act === 'fall') getUp(a, actors, area, now, rand);
            else choose(a, actors, area, rand, now);
        }
        if (`${a.act}${a.dir}${a.emote}${a.t0}${a.shown}` !== before) changed = true;
    }
    return changed;
}
