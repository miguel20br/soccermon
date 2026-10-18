import { describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { type Clock, clockLabel } from './components/MatchHud';

describe('relógio do placar', () => {
    it('no intervalo mostra Intervalo, mesmo com o último tick ainda na fase de jogo', () => {
        setLang('pt');
        const clock: Clock = { tick: 2400, minute: 19.9, half: 1, score: [1, 0], phase: 'play' };
        expect(clockLabel(clock, false, null)).toContain('19');
        expect(clockLabel(clock, false, null, true)).toBe(clockLabel({ ...clock, phase: 'halftime' }, false, null));
        expect(clockLabel(clock, false, null, true)).not.toContain('19');
    });
});
