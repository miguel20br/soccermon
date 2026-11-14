import Phaser from 'phaser';

/**
 * Elipse (sombra e anel do jogador, sombra da bola) como imagem de uma textura pintada uma vez no canvas 2D, na
 * resolução do canvas da partida (1 pixel da textura por pixel da tela). O `Ellipse` do Phaser refazia a malha em todo
 * quadro e, intercalado com os sprites na profundidade, partia o lote: 2 chamadas de desenho por jogador. Como
 * imagem, entra no mesmo lote dos sprites e dos nomes. Mesma API que a partida usa (`setFillStyle`, `setStrokeStyle`).
 */
export class FlatEllipse extends Phaser.GameObjects.Image {
    private fill: { color: number; alpha: number } | null = null;
    private stroke: { width: number; color: number; alpha: number } | null = null;

    /** `res`: px do canvas por px do jogo agora (a resolução da textura). */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        private readonly ew: number,
        private readonly eh: number,
        private readonly res: () => number,
        fillColor?: number,
        fillAlpha = 1,
    ) {
        super(scene, x, y, '__DEFAULT');
        if (fillColor !== undefined) this.fill = { color: fillColor, alpha: fillAlpha };
        scene.add.existing(this);
        this.redraw();
    }

    setFillStyle(color?: number, alpha = 1) {
        this.fill = color === undefined ? null : { color, alpha };
        return this.redraw();
    }

    setStrokeStyle(width?: number, color = 0xffffff, alpha = 1) {
        this.stroke = width ? { width, color, alpha } : null;
        return this.redraw();
    }

    /** Pinta (ou reaproveita) a textura deste estilo na resolução de agora. */
    redraw() {
        const r = Math.max(0.5, this.res());
        const { fill, stroke, ew, eh } = this;
        const key = `ell-${ew}x${eh}-${fill ? `${fill.color}.${fill.alpha}` : ''}-${stroke ? `${stroke.width}.${stroke.color}.${stroke.alpha}` : ''}-${r.toFixed(3)}`;
        const pad = (stroke?.width ?? 0) / 2 + 1;
        const tw = Math.ceil((ew + 2 * pad) * r);
        const th = Math.ceil((eh + 2 * pad) * r);
        const textures = this.scene.textures;
        if (!textures.exists(key)) {
            const tex = textures.createCanvas(key, tw, th);
            const ctx = tex?.getContext();
            if (tex && ctx) {
                ctx.scale(r, r);
                ctx.beginPath();
                ctx.ellipse(tw / r / 2, th / r / 2, ew / 2, eh / 2, 0, 0, Math.PI * 2);
                const css = (c: number, a: number) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
                if (fill) {
                    ctx.fillStyle = css(fill.color, fill.alpha);
                    ctx.fill();
                }
                if (stroke) {
                    ctx.lineWidth = stroke.width;
                    ctx.strokeStyle = css(stroke.color, stroke.alpha);
                    ctx.stroke();
                }
                tex.refresh();
                // o desenho divide o quadro pela resolução: a imagem tem o tamanho em px do jogo
                tex.source[0].resolution = r;
            }
        }
        if (this.texture.key !== key) {
            this.setTexture(key);
            this.setSize(tw / r, th / r);
            this.updateDisplayOrigin();
        }
        return this;
    }
}
