import type { Command, Controller } from '../commands';

/**
 * Controller humano (modo jogável futuro). A camada de input (teclado/gamepad no Phaser) só precisa
 * empurrar comandos aqui; o motor os consome exatamente como os da IA.
 * No MVP só é usado em testes, com comandos roteirizados.
 */
export class HumanController implements Controller {
    private queue: Command[] = [];
    private held: Command = { type: 'idle' };

    /** Comando contínuo (ex.: direção do analógico) mantido até ser trocado. */
    hold(cmd: Command) {
        this.held = cmd;
    }

    /** Comando de um tick só (ex.: apertou "chutar"). */
    press(cmd: Command) {
        this.queue.push(cmd);
    }

    decide(): Command[] {
        const cmds = [this.held, ...this.queue];
        this.queue = [];
        return cmds;
    }
}
