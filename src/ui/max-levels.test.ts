import { describe, expect, it } from 'vitest';
import { AGENCY, MAX_FX_PIECES } from '../engine/agency';
import type { MatchEvent } from '../engine/state';
import { dict } from '../i18n';
import {
    maxFillText,
    maxFxText,
    maxLevelText,
    maxLevelUnlocked,
    maxLevelUpAt,
    maxPlan,
    maxPlayPoints,
} from './max-levels';

describe('golpe máximo explicado (max-levels)', () => {
    it('os pontos por lance saem do maxCharge do motor', () => {
        const pts = maxPlayPoints();
        expect(pts.tackle).toBe(1);
        expect(pts.save).toBe(1);
        expect(pts.goal).toBe(1);
        expect(pts.shot).toBe(0.5);
        expect(pts.interception).toBe(0.5);
        expect(pts.move).toBe(0.5);
    });

    it('a explicação da barra usa o gomo, o bônus de quem perde e os lances do motor', () => {
        const pt = maxFillText('pt');
        const per = AGENCY.maxLevelPts;
        expect(pt).toContain(`N1 com ${per} pontos, N2 com ${2 * per}, N3 com ${3 * per}`);
        expect(pt).toContain('Desarme, defesa e gol valem 1');
        expect(pt).toContain('chute, interceptação e golpe que acerta valem 0,5');
        expect(pt).toContain('enche 1,5x');
        expect(maxFillText('en')).toContain('L1 at 10 points');
        expect(pt).not.toMatch(/\{\w+\}/);
    });

    it('o N1 passa o status do tipo do golpe e o N3 é o efeito do tipo ou a assinatura', () => {
        // Charmander (Ember, Fogo) queima; Pikachu tem assinatura
        const charmander = maxPlan(['ember', 'scratch'], 4, false);
        expect(charmander.type).toBe('Fire');
        expect(maxLevelUnlocked(charmander, 1, 'pt')).toBe(
            'N1 liberado: chute forte que queima quem bloquear ou defender',
        );
        expect(maxLevelUnlocked(charmander, 2, 'pt')).toBe('N2 liberado: derruba quem estiver no caminho');
        expect(maxLevelUnlocked(charmander, 3, 'pt')).toBe('N3 liberado: sempre no alvo, com Bola em chamas');
        expect(maxLevelText(charmander, 1, 'pt')).toContain('+25% de força');
        const pikachu = maxPlan(['thundershock', 'quickattack'], 25, false);
        expect(pikachu.fx).toBe('thunderbolt');
        expect(maxLevelText(pikachu, 3, 'pt')).toContain('Raio em cadeia');
        expect(maxLevelText(pikachu, 1, 'en')).toContain('paralyzes');
    });

    it('no gol o golpe é a bicuda', () => {
        const snorlax = maxPlan(['bodyslam', 'rest'], 143, true);
        expect(maxLevelUnlocked(snorlax, 2, 'pt')).toBe('N2 liberado: a bicuda derruba quem estiver no caminho');
        expect(maxLevelText(snorlax, 3, 'pt')).toContain('Pancada do Snorlax');
    });

    it('todo tipo e toda assinatura tem nome, descrição e verbo do status nos dois idiomas', () => {
        for (const lang of ['pt', 'en'] as const) {
            for (const fx of [...Object.keys(MAX_FX_PIECES), ...Object.keys(AGENCY.maxSig)]) {
                expect(dict(lang).match.agency.maxFx[fx], `${lang} ${fx}`).toBeDefined();
                expect(maxFxText(fx, lang).desc, `${lang} ${fx}`).not.toBe('');
            }
            for (const [kind] of Object.values(AGENCY.maxStatus))
                expect(dict(lang).match.agency.levels.status[kind], `${lang} ${kind}`).toBeTruthy();
        }
    });

    it('acha o lance que encheu o gomo', () => {
        const ev = (tick: number, by = 0): MatchEvent => ({
            tick,
            half: 1,
            minute: 0,
            type: 'tackle',
            by,
            victim: 5,
            success: true,
        });
        const events = Array.from({ length: AGENCY.maxLevelPts }, (_, i) => ev(i * 10 + 10));
        const last = events.at(-1)?.tick ?? 0;
        expect(maxLevelUpAt(events, 0, last, 40)).toEqual({ level: 1, tick: last });
        expect(maxLevelUpAt(events, 0, last + 40, 40)).toBeNull();
        expect(maxLevelUpAt(events, 0, last - 1, 40)).toBeNull();
        expect(maxLevelUpAt(events, 1, last, 40)).toBeNull();
    });
});
