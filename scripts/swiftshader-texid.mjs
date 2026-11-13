/**
 * Sprite cortado nas capturas sem janela (SwiftShader). O lote do Phaser 4 desenha várias texturas de uma vez e o
 * fragment shader escolhe a textura comparando o varying `outTexDatum` com `==` (`GetTexture-glsl.js`,
 * `GetTexRes-glsl.js`). No SwiftShader a interpolação desse valor constante às vezes sai 0,99999994 em vez de 1: o
 * pixel cai no `else` (transparente) e some uma faixa do sprite, diferente a cada quadro (Zubat, Golbat, Pidgeotto no
 * drible; os telões do walkout). Na GPU de verdade não acontece. Arredondar o id antes de comparar resolve.
 *
 * Uso: `page.evaluateOnNewDocument(TEXID_FIX)` (puppeteer) ou `context.addInitScript(TEXID_FIX)` (Playwright).
 */

/** Troca cada uso de `outTexDatum` (menos a declaração) pelo id arredondado. */
export const roundTexId = (src) => src.replace(/(?<!varying float )\boutTexDatum\b/g, 'floor(outTexDatum + 0.5)');

/** Script de página: aplica `roundTexId` nos fragment shaders antes de compilar. */
export const TEXID_FIX = `(() => {
    const roundTexId = ${roundTexId.toString()};
    for (const P of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
        if (!P) continue;
        const shaderSource = P.shaderSource;
        P.shaderSource = function (sh, src) {
            if (src.includes('outTexDatum') && this.getShaderParameter(sh, this.SHADER_TYPE) === this.FRAGMENT_SHADER)
                src = roundTexId(src);
            return shaderSource.call(this, sh, src);
        };
    }
})();`;
