/**
 * QR code pequeno e próprio (sem dependência) pro link da sala do duelo: modo byte, correção M, versões 1 a 6 (até
 * 106 bytes, sobra pra qualquer link de sala) e máscara 0. É o mínimo da norma ISO 18004 que um leitor de celular
 * aceita; conferido com o zbarimg (src/ui/qr.test.ts guarda o resultado).
 * ponytail: só até a versão 6 (sem o bloco de versão da 7+); link maior que 106 bytes devolve null.
 */

/** [correção por bloco, blocos, dados por bloco] da correção M, versões 1–6. */
const EC_M: [number, number, number][] = [
    [10, 1, 16],
    [16, 1, 28],
    [26, 1, 44],
    [18, 2, 32],
    [24, 2, 43],
    [16, 4, 27],
];

// aritmética de GF(256) com o polinômio 0x11d
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

/** Bytes de correção Reed-Solomon de um bloco. */
function rsEncode(data: number[], ecLen: number): number[] {
    let gen = [1];
    for (let i = 0; i < ecLen; i++) {
        const next = new Array(gen.length + 1).fill(0);
        for (let j = 0; j < gen.length; j++) {
            next[j] ^= gen[j];
            next[j + 1] ^= mul(gen[j], EXP[i]);
        }
        gen = next;
    }
    const rem = new Array(ecLen).fill(0);
    for (const b of data) {
        const f = b ^ rem.shift();
        rem.push(0);
        for (let j = 0; j < ecLen; j++) rem[j] ^= mul(gen[j + 1], f);
    }
    return rem;
}

/** Matriz do QR (true = módulo escuro) ou null se o texto não couber. */
export function qrMatrix(text: string): boolean[][] | null {
    const bytes = [...new TextEncoder().encode(text)];
    const v = EC_M.findIndex(([, blocks, per]) => blocks * per - 2 >= bytes.length) + 1;
    if (!v) return null;
    const [ecLen, blocks, per] = EC_M[v - 1];
    const cap = blocks * per;

    // dados: modo byte (0100), tamanho em 8 bits, bytes, terminador e preenchimento
    const bits: number[] = [];
    const put = (val: number, n: number) => {
        for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };
    put(4, 4);
    put(bytes.length, 8);
    for (const b of bytes) put(b, 8);
    put(0, Math.min(4, cap * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const data: number[] = [];
    for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
    for (let pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad);

    // blocos intercalados: dados, depois a correção
    const dBlocks = Array.from({ length: blocks }, (_, i) => data.slice(i * per, (i + 1) * per));
    const eBlocks = dBlocks.map((b) => rsEncode(b, ecLen));
    const stream: number[] = [];
    for (let i = 0; i < per; i++) for (const b of dBlocks) stream.push(b[i]);
    for (let i = 0; i < ecLen; i++) for (const b of eBlocks) stream.push(b[i]);

    const size = 17 + 4 * v;
    const m: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
    const fixed: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (r: number, c: number, on: boolean) => {
        if (r < 0 || c < 0 || r >= size || c >= size) return;
        m[r][c] = on;
        fixed[r][c] = true;
    };
    // localizadores (com a borda branca) nos 3 cantos
    for (const [r0, c0] of [
        [0, 0],
        [0, size - 7],
        [size - 7, 0],
    ]) {
        for (let r = -1; r <= 7; r++)
            for (let c = -1; c <= 7; c++) {
                const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
                set(r0 + r, c0 + c, ring !== 2 && ring !== 4);
            }
    }
    // alinhamento (um só nas versões 2–6)
    if (v > 1) {
        const p = size - 7;
        for (let r = -2; r <= 2; r++)
            for (let c = -2; c <= 2; c++) set(p + r, p + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
    }
    // trilhas de tempo
    for (let i = 8; i < size - 8; i++) {
        set(6, i, i % 2 === 0);
        set(i, 6, i % 2 === 0);
    }
    // módulo escuro e a reserva do formato
    set(size - 8, 8, true);
    for (let i = 0; i < 9; i++) {
        if (!fixed[8][i]) set(8, i, false);
        if (!fixed[i][8]) set(i, 8, false);
    }
    for (let i = 0; i < 8; i++) {
        set(8, size - 1 - i, false);
        if (!fixed[size - 1 - i][8]) set(size - 1 - i, 8, false);
    }

    // dados em zigue-zague de baixo pra cima, de 2 em 2 colunas, com a máscara 0 ((r + c) % 2 == 0)
    let bit = 0;
    const total = stream.length * 8;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        const up = ((right + 1) & 2) === 0;
        for (let k = 0; k < size; k++) {
            const r = up ? size - 1 - k : k;
            for (const c of [right, right - 1]) {
                if (fixed[r][c]) continue;
                const on = bit < total ? ((stream[bit >> 3] >> (7 - (bit & 7))) & 1) === 1 : false;
                bit++;
                m[r][c] = on !== ((r + c) % 2 === 0);
            }
        }
    }

    // formato: correção M (00) + máscara 0, BCH(15,5) e a máscara 0x5412
    let fmt = 0;
    let rem = fmt;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    fmt = ((fmt << 10) | rem) ^ 0x5412;
    const fb = (i: number) => ((fmt >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) m[i][8] = fb(i);
    m[7][8] = fb(6);
    m[8][8] = fb(7);
    m[8][7] = fb(8);
    for (let i = 9; i < 15; i++) m[8][14 - i] = fb(i);
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = fb(i);
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = fb(i);
    return m;
}

/** O QR como um caminho SVG (um quadrado por módulo escuro), com 4 módulos de margem. */
export function qrPath(text: string): { size: number; d: string } | null {
    const m = qrMatrix(text);
    if (!m) return null;
    let d = '';
    m.forEach((row, r) => {
        row.forEach((on, c) => {
            if (on) d += `M${c + 4} ${r + 4}h1v1h-1z`;
        });
    });
    return { size: m.length + 8, d };
}
