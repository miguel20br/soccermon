import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ANCORAS from '../../data/gorro-ancoras.json';
import QUADROS from '../../data/gorro-quadros.json';
import { gorroAt } from './Gorro';
import { GORRO_COR, GORROS, type GorroTipo, gorroPos, gorroRects } from './gorro-pixel';

const anc = ANCORAS as Record<string, { t: GorroTipo; f?: 0 | 1; p: number[][] }>;
const quadros = QUADROS as Record<string, Record<string, number[][]>>;

describe('gorro de Natal em pixel', () => {
    it('cada desenho é uma matriz retangular só com cores da paleta', () => {
        for (const rows of Object.values(GORROS)) {
            expect(new Set(rows.map((r) => r.length)).size).toBe(1);
            for (const c of rows.join('')) expect(c === '.' || c in GORRO_COR).toBe(true);
        }
    });

    it('de lado a ponta cai pra trás; de costas é o espelho da frente', () => {
        const a = { t: 'longo' as const, p: Array.from({ length: 8 }, () => [20, 15]) };
        expect(gorroPos(a, 2).flip).toBe(true); // olhando pra direita, ponta pra esquerda
        expect(gorroPos(a, 6).flip).toBe(false);
        expect(gorroPos(a, 0).flip).toBe(!gorroPos(a, 4).flip);
        expect(gorroPos({ ...a, f: 1 }, 0).flip).toBe(true);
        // a base da aba (última linha) fica na linha da âncora
        expect(gorroPos(a, 0).y + GORROS.longo.length - 1).toBe(15);
        // espelhar não muda o tamanho do desenho
        expect(gorroRects('longo', true).w).toBe(gorroRects('longo', false).w);
    });

    it('toda espécie com âncora tem a cabeça seguida em cada quadro do Idle (rode scripts/build-gorro-quadros.ts)', () => {
        for (const [id, a] of Object.entries(anc)) {
            expect(a.p, id).toHaveLength(8);
            const sheet = JSON.parse(readFileSync(`public/assets/field/menu/${id}.json`, 'utf8')) as {
                anims: Record<string, { n: number; w: number; h: number }>;
            };
            for (const anim of ['Idle', 'Pose']) {
                const s = sheet.anims[anim];
                if (!s) continue;
                const o = quadros[id]?.[anim];
                expect(o, `${id} ${anim}`).toHaveLength(8);
                for (let d = 0; d < 8; d++) {
                    expect(o[d], `${id} ${anim} ${d}`).toHaveLength(s.n * 2);
                    for (let i = 0; i < s.n; i++) {
                        // o gorro nunca sai do quadro de vez (sem âncora perdida)
                        const p = gorroAt(Number(id), d, anim, i);
                        expect(p, `${id} ${anim} ${d} ${i}`).not.toBeNull();
                        if (!p) continue;
                        expect(
                            p.x + p.w > 0 && p.x < s.w && p.y + p.h > 0 && p.y < s.h,
                            `${id} ${anim} ${d} ${i}`,
                        ).toBe(true);
                    }
                }
            }
            // o quadro 0 do Idle é o da âncora revisada
            expect(quadros[id].Idle.every((r) => r[0] === 0 && r[1] === 0)).toBe(true);
        }
    });
});
