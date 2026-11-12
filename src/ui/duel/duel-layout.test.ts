import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** O bloco de uma regra CSS pelo seletor exato (o primeiro). */
const rule = (file: string, selector: string) => {
    const css = readFileSync(file, 'utf8');
    const at = css.indexOf(`${selector} {`);
    return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
};

describe('layout do Duelo', () => {
    // a 390, na partida, a linha da sala ocupava a largura toda e o Sair da sala caía embaixo do voltar
    it('na partida a linha da sala fica no canto, na largura dela', () => {
        expect(rule('src/ui/components/broadcast.css', '.duel:has(.bc) > .duel-top')).toMatch(/width:\s*auto/);
    });
    // no palco do Duelo a dupla desce pro vão e a bola ficava no meio da cena, em cima do VS ou do título da sala
    it('a bola acompanha a dupla no palco', () => {
        expect(
            rule('src/ui/kit/stage.css', '.k-stage-place[data-gap] .amb-bd :is(.ar-duel, .ar-circle, .ar-ball)'),
        ).not.toBe('');
    });
});
