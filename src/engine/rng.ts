/**
 * RNG determinístico (sfc32) com estado serializável. Nada no motor usa Math.random.
 * Cada subsistema (draft, partida, narração) recebe seu próprio stream derivado da seed da run.
 */
import { dcos, dln } from './dmath';

export class Rng {
    private a: number;
    private b: number;
    private c: number;
    private d: number;

    constructor(seed: number | string, stream = '') {
        const h = hashString(`${seed}:${stream}`);
        this.a = h[0];
        this.b = h[1];
        this.c = h[2];
        this.d = h[3];
        for (let i = 0; i < 15; i++) this.next();
    }

    /** Float em [0, 1). */
    next(): number {
        this.a |= 0;
        this.b |= 0;
        this.c |= 0;
        this.d |= 0;
        const t = (((this.a + this.b) | 0) + this.d) | 0;
        this.d = (this.d + 1) | 0;
        this.a = this.b ^ (this.b >>> 9);
        this.b = (this.c + (this.c << 3)) | 0;
        this.c = (this.c << 21) | (this.c >>> 11);
        this.c = (this.c + t) | 0;
        return (t >>> 0) / 4294967296;
    }

    range(min: number, max: number): number {
        return min + (max - min) * this.next();
    }

    int(min: number, maxInclusive: number): number {
        return min + Math.floor(this.next() * (maxInclusive - min + 1));
    }

    chance(p: number): boolean {
        return this.next() < p;
    }

    pick<T>(items: readonly T[]): T {
        return items[Math.floor(this.next() * items.length)];
    }

    /** Escolha ponderada; pesos ≤ 0 são ignorados. */
    weighted<T>(items: readonly T[], weight: (item: T) => number): T {
        const total = items.reduce((s, it) => s + Math.max(0, weight(it)), 0);
        let r = this.next() * total;
        for (const it of items) {
            r -= Math.max(0, weight(it));
            if (r < 0) return it;
        }
        return items[items.length - 1];
    }

    /** Normal padrão (Box–Muller). */
    gauss(): number {
        const u = Math.max(this.next(), 1e-12);
        const w = this.next();
        return Math.sqrt(-2 * dln(u)) * dcos(2 * Math.PI * w);
    }

    shuffle<T>(items: T[]): T[] {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }

    getState(): [number, number, number, number] {
        return [this.a, this.b, this.c, this.d];
    }

    static fromState(state: [number, number, number, number]): Rng {
        const r = new Rng(0);
        [r.a, r.b, r.c, r.d] = state;
        return r;
    }
}

/** cyrb128: hash de string → 4 inteiros de 32 bits. */
function hashString(str: string): [number, number, number, number] {
    let h1 = 1779033703;
    let h2 = 3144134277;
    let h3 = 1013904242;
    let h4 = 2773480762;
    for (let i = 0; i < str.length; i++) {
        const k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}
