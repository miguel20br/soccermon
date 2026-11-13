import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { installTexIdFix, roundTexId } from './texid-fix';

// os pedaços do shader do lote do Phaser que escolhem a textura pelo id interpolado
const require = createRequire(import.meta.url);
const phaser = (f: string) => require(`../../node_modules/phaser/src/renderer/webgl/shaders/${f}`) as string;
const getTexture = phaser('GetTexture-glsl.js');
const getTexRes = phaser('GetTexRes-glsl.js');

describe('sprite cortado no WebGL por software (id da textura interpolado)', () => {
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

    it('instalado no WebGL, reescreve só o fragment shader, uma vez', () => {
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
        const w = { WebGLRenderingContext: Ctx, WebGL2RenderingContext: undefined };
        installTexIdFix(w as never);
        installTexIdFix(w as never);
        const gl = new Ctx();
        const vert = 'void main(){ outTexDatum = inTexDatum; }';
        gl.shaderSource({ type: 0 }, vert);
        gl.shaderSource({ type: 1 }, getTexture);
        expect(seen[0]).toBe(vert);
        expect(seen[1]).toContain('if (floor(outTexDatum + 0.5) == 0.0)');
        expect(seen[1]).not.toContain('floor(floor(');
    });
});
