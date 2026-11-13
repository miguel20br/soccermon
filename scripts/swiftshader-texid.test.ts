import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { roundTexId, TEXID_FIX } from './swiftshader-texid.mjs';

// os pedaços do shader do lote do Phaser que escolhem a textura pelo id interpolado
const require = createRequire(import.meta.url);
const phaser = (f: string) => require(`../node_modules/phaser/src/renderer/webgl/shaders/${f}`) as string;
const getTexture = phaser('GetTexture-glsl.js');
const getTexRes = phaser('GetTexRes-glsl.js');

describe('sprite cortado no SwiftShader (id da textura interpolado)', () => {
    it('o Phaser ainda compara o id interpolado com == (se mudar, este conserto pode sair)', () => {
        expect(getTexture).toMatch(/outTexDatum == 0\.0/);
        expect(getTexRes).toMatch(/float texId = outTexDatum;/);
    });

    it('depois do conserto nenhuma comparação usa o id sem arredondar', () => {
        for (const src of [getTexture, getTexRes]) {
            const fixed = roundTexId(src);
            expect(fixed).toContain('floor(outTexDatum + 0.5)');
            expect(fixed.replaceAll('floor(outTexDatum + 0.5)', '')).not.toContain('outTexDatum');
        }
        expect(roundTexId('varying float outTexDatum;')).toBe('varying float outTexDatum;');
    });

    it('o script da página reescreve só o fragment shader', () => {
        const seen: string[] = [];
        class Ctx {
            FRAGMENT_SHADER = 1;
            SHADER_TYPE = 2;
            getShaderParameter(sh: { type: number }) {
                return sh.type;
            }
            shaderSource(_sh: unknown, src: string) {
                seen.push(src);
            }
        }
        const g = globalThis as unknown as { window?: unknown };
        const old = g.window;
        g.window = { WebGLRenderingContext: Ctx };
        try {
            new Function(TEXID_FIX)();
            const gl = new Ctx();
            gl.shaderSource({ type: 0 }, 'void main(){ outTexDatum = inTexDatum; }');
            gl.shaderSource({ type: 1 }, getTexture);
        } finally {
            g.window = old;
        }
        expect(seen[0]).toBe('void main(){ outTexDatum = inTexDatum; }');
        expect(seen[1]).toContain('if (floor(outTexDatum + 0.5) == 0.0)');
    });
});
