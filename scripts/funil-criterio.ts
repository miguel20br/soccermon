/** Quem entra no funil do stats: sem maratona (> MAX_COPAS copas na sessão) e sem versão antiga (fora das 3 mais novas). */
export const MAX_COPAS = 20;
export const VERSOES_RECENTES = 3;

const num = (v: string) => v.split('.').map((x) => Number.parseInt(x, 10) || 0);
const cmp = (a: string, b: string) => {
    const [x, y] = [num(a), num(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++)
        if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
    return 0;
};

/** Versões que ficam: as `VERSOES_RECENTES` mais novas entre as vistas. */
export function versoesRecentes(vistas: string[]): Set<string> {
    return new Set([...new Set(vistas)].sort(cmp).slice(-VERSOES_RECENTES));
}

export const ehMaratona = (copas: number) => copas > MAX_COPAS;
export const ehVersaoAntiga = (versao: string | undefined, recentes: Set<string>) => !!versao && !recentes.has(versao);
