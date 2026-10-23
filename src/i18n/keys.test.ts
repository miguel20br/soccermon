import { describe, expect, it } from 'vitest';
import { en } from './en';
import { pt } from './pt';

/** Caminhos de todas as folhas de texto (os `as Record<string, string>` escapam do `typeof pt` do EN). */
function leaves(o: unknown, at = ''): string[] {
    if (typeof o !== 'object' || o === null) return [at];
    return Object.entries(o).flatMap(([k, v]) => leaves(v, at ? `${at}.${k}` : k));
}

describe('PT e EN com as mesmas chaves', () => {
    // o contrário pode: o EN tem mapas de tradução que o PT não precisa (common.club: nome em PT → nome em EN)
    it('todo texto do PT existe no EN', () => {
        const b = new Set(leaves(en));
        expect(leaves(pt).filter((k) => !b.has(k))).toEqual([]);
    });
});
