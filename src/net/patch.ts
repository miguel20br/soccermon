/**
 * Diferença entre dois estados JSON (o duelo manda só o que mudou: docs/planos/multiplayer.md, "Cota do Realtime").
 * Cada operação é `[caminho, valor]` (põe) ou `[caminho]` (tira). Objetos e listas que cresceram descem um nível;
 * lista que encolheu e qualquer outro valor vão inteiros. Aplicar a diferença no estado de antes (como chegou pela
 * rede, em JSON) dá o mesmo JSON do estado novo.
 */
export type PatchOp = [path: (string | number)[], value?: unknown];

type Obj = Record<string | number, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

export function diff(a: unknown, b: unknown, path: (string | number)[] = [], out: PatchOp[] = []): PatchOp[] {
    const arrays = Array.isArray(a) && Array.isArray(b);
    const deeper = arrays
        ? (b as unknown[]).length >= (a as unknown[]).length
        : isObj(a) && isObj(b) && !Array.isArray(a) && !Array.isArray(b);
    if (!deeper) {
        if (!same(a, b)) out.push([path, b]);
        return out;
    }
    const A = a as Obj;
    const B = b as Obj;
    const keys = arrays
        ? Array.from({ length: (b as unknown[]).length }, (_, i) => i)
        : [...new Set([...Object.keys(A), ...Object.keys(B)])];
    for (const k of keys) {
        // buraco na lista vira null no JSON (dos dois lados)
        const av = arrays && A[k] === undefined ? null : A[k];
        const bv = arrays && B[k] === undefined ? null : B[k];
        if (av === bv && (!arrays || Number(k) < (a as unknown[]).length)) continue;
        if (bv === undefined) {
            if (av !== undefined) out.push([[...path, k]]);
        } else if (av === undefined || av === null || bv === null) out.push([[...path, k], bv]);
        else diff(av, bv, [...path, k], out);
    }
    return out;
}

const BAD = new Set(['__proto__', 'constructor', 'prototype']);

/** Aplica sem mexer em `base` (copia só o caminho). Operação malformada devolve null (aí pede o estado inteiro). */
export function applyPatch<T>(base: T, ops: unknown): T | null {
    if (!isObj(base) || !Array.isArray(ops)) return null;
    let root = (Array.isArray(base) ? [...base] : { ...base }) as Obj;
    for (const op of ops) {
        if (!Array.isArray(op) || !Array.isArray(op[0]) || op.length > 2) return null;
        const path = op[0] as unknown[];
        if (path.some((k) => (typeof k !== 'string' && typeof k !== 'number') || BAD.has(String(k)))) return null;
        if (!path.length) {
            if (!isObj(op[1])) return null;
            root = op[1];
            continue;
        }
        let o = root;
        for (const k of path.slice(0, -1) as (string | number)[]) {
            const v = o[k];
            // o caminho não existe aqui: o estado de antes não é o mesmo de quem mandou
            if (!isObj(v)) return null;
            o[k] = Array.isArray(v) ? [...v] : { ...v };
            o = o[k] as Obj;
        }
        const last = path.at(-1) as string | number;
        if (op.length === 2) o[last] = op[1];
        else delete o[last];
    }
    return root as T;
}
