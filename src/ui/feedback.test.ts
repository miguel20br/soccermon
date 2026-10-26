import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../game/audio', () => ({ playSfx: () => {} }));

import { kindOf } from './feedback';

/** Botão de mentira: só classes e data-fx (o teste roda sem DOM). */
const btn = (cls: string, fx?: string) =>
    ({
        getAttribute: (a: string) => (a === 'data-fx' ? (fx ?? null) : null),
        matches: (sel: string) =>
            sel.split(',').some((s) => s.trim().startsWith('.') && cls.split(' ').includes(s.trim().slice(1))),
    }) as unknown as Element;

describe('retorno de toque: o tipo vem da classe do botão', () => {
    it('primário avança, fantasma volta, perigo é destrutivo, o resto é toque', () => {
        expect(kindOf(btn('btn primary'))).toBe('go');
        expect(kindOf(btn('btn ghost'))).toBe('back');
        expect(kindOf(btn('modal-close'))).toBe('back');
        expect(kindOf(btn('btn small danger'))).toBe('danger');
        expect(kindOf(btn('btn ghost small danger'))).toBe('danger');
        expect(kindOf(btn('btn small confirm'))).toBe('go');
        expect(kindOf(btn('btn outline'))).toBe('tap');
    });
    it('data-fx manda (e "none" cala, pra quem toca o próprio som)', () => {
        expect(kindOf(btn('btn primary', 'none'))).toBeNull();
        expect(kindOf(btn('btn', 'danger'))).toBe('danger');
    });
});
