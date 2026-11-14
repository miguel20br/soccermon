import { describe, expect, it } from 'vitest';
import { gsiAllowed } from './google-button';

describe('botão do Google x atalho da tela inicial (iOS)', () => {
    it('no Safari normal usa o botão; no atalho (navigator.standalone) cai no login por redirecionamento', () => {
        expect(gsiAllowed('https://soccermon.com', {})).toBe(true);
        expect(gsiAllowed('https://soccermon.com', { standalone: false })).toBe(true);
        expect(gsiAllowed('https://soccermon.com', { standalone: true })).toBe(false);
        expect(gsiAllowed('https://soccermon-git-x.vercel.app', {})).toBe(false);
    });
});
