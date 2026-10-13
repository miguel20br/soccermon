import type Phaser from 'phaser';

/**
 * Caixa de texto estilo batalha Pokémon ("Pikachu usou Thunderbolt!") na parte de baixo da quadra.
 * Mensagens entram numa fila curta; se o jogo estiver acelerado, as mais antigas são descartadas.
 */
export class BattleBox {
    private readonly container: Phaser.GameObjects.Container;
    private readonly text: Phaser.GameObjects.Text;
    private readonly queue: string[] = [];
    private showingUntil = 0;
    private visible = false;

    constructor(
        private readonly scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
    ) {
        const h = 46;
        const g = scene.add.graphics();
        g.fillStyle(0x2a3050, 1).fillRoundedRect(-width / 2 - 3, -h / 2 - 3, width + 6, h + 6, 10);
        g.fillStyle(0xf8f8f0, 1).fillRoundedRect(-width / 2, -h / 2, width, h, 8);
        g.lineStyle(2, 0xd06040, 1).strokeRoundedRect(-width / 2 + 4, -h / 2 + 4, width - 8, h - 8, 6);
        this.text = scene.add
            .text(-width / 2 + 16, 0, '', {
                fontFamily: 'Galmuri11, monospace',
                fontSize: '15px',
                color: '#303030',
                wordWrap: { width: width - 32 },
            })
            .setOrigin(0, 0.5)
            .setResolution(2);
        this.container = scene.add.container(x, y, [g, this.text]).setDepth(8000).setAlpha(0);
    }

    push(message: string) {
        this.queue.push(message);
        while (this.queue.length > 3) this.queue.shift();
    }

    /** `speed` encurta o tempo de leitura quando o jogo está acelerado. */
    update(now: number, speed: number) {
        if (now < this.showingUntil) return;
        const next = this.queue.shift();
        if (next) {
            this.text.setText(next);
            this.showingUntil = now + 1500 / Math.min(Math.max(speed, 1), 3);
            if (!this.visible) {
                this.visible = true;
                this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 120 });
            }
        } else if (this.visible) {
            this.visible = false;
            this.scene.tweens.add({ targets: this.container, alpha: 0, duration: 200 });
        }
    }
}
