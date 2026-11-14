/**
 * Sprite cortado no WebGL por software (SwiftShader: navegador sem GPU, GPU bloqueada, captura headless). O lote do
 * Phaser 4 desenha várias texturas de uma vez e o fragment shader escolhe a textura comparando o varying
 * `outTexDatum` com `==` (`GetTexture-glsl.js`, `GetTexRes-glsl.js`). No SwiftShader a interpolação desse valor
 * constante às vezes sai 0,99999994 em vez de 1: o pixel cai no `else` (transparente) e some uma faixa do sprite,
 * diferente a cada quadro. Desde que sombra e anel viraram textura (`flat-ellipse.ts`) o sprite costuma ser a 2ª
 * textura do lote. Arredondar o id antes de comparar resolve; na GPU não muda nada.
 *
 * Fica no WebGL da página (não no Phaser) pra valer pra todo jogo Phaser (partida, walkout, sala de troféus, labs)
 * sem trazer o Phaser pro bundle da Home.
 */

/** Troca cada uso de `outTexDatum` (menos a declaração) pelo id arredondado. */
export const roundTexId = (src: string) =>
    src.replace(/(?<!varying float )\boutTexDatum\b/g, 'floor(outTexDatum + 0.5)');

interface ShaderCtx {
    readonly FRAGMENT_SHADER: number;
    readonly SHADER_TYPE: number;
    getShaderParameter(shader: never, pname: number): unknown;
    shaderSource(shader: never, source: string): void;
}
type Ctor = { prototype: ShaderCtx } | undefined;

/** Instala uma vez, antes do primeiro jogo: os fragment shaders do Phaser já compilam com o id arredondado. */
export function installTexIdFix(w: { WebGLRenderingContext?: Ctor; WebGL2RenderingContext?: Ctor } = window as never) {
    for (const C of [w.WebGLRenderingContext, w.WebGL2RenderingContext]) {
        const P = C?.prototype as (ShaderCtx & { texIdFix?: true }) | undefined;
        if (!P || P.texIdFix) continue;
        const shaderSource = P.shaderSource;
        P.shaderSource = function (this: ShaderCtx, sh: never, src: string) {
            const frag =
                src.includes('outTexDatum') && this.getShaderParameter(sh, this.SHADER_TYPE) === this.FRAGMENT_SHADER;
            shaderSource.call(this, sh, frag ? roundTexId(src) : src);
        };
        P.texIdFix = true;
    }
}
