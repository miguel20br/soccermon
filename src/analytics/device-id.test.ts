import { describe, expect, it } from 'vitest';
import { savePart, useGame } from '../store/game-store';
import { DEVICE_KEY, deviceVisit, forgetDevice } from './device-id';

/** localStorage de mentira (o vitest roda em node). */
const memory = () => {
    const m = new Map<string, string>();
    return {
        m,
        getItem: (k: string) => m.get(k) ?? null,
        setItem: (k: string, v: string) => void m.set(k, v),
        removeItem: (k: string) => void m.delete(k),
    };
};
const visit = (store: ReturnType<typeof memory> | null, today: string, over: object = {}) =>
    deviceVisit({ store, today, hadSave: false, gpc: false, ...over });

describe('id anônimo do aparelho', () => {
    it('gera na 1ª sessão e persiste: o mesmo id nas seguintes', () => {
        const s = memory();
        const a = visit(s, '2026-11-23');
        expect(a).toMatchObject({ first_day: '2026-11-23', day_n: 0, days: 1, new_day: true, legacy: false });
        expect(a?.did).toMatch(/^[0-9a-f-]{32,36}$/);
        expect(s.m.has(DEVICE_KEY)).toBe(true);
        expect(visit(s, '2026-11-23')?.did).toBe(a?.did);
    });

    it('day_n conta dias desde o 1º; days conta dias diferentes com sessão (2ª sessão no mesmo dia não soma)', () => {
        const s = memory();
        visit(s, '2026-11-30');
        expect(visit(s, '2026-11-30')).toMatchObject({ day_n: 0, days: 1, new_day: false });
        expect(visit(s, '2026-12-01')).toMatchObject({ day_n: 1, days: 2, new_day: true });
        // pulou dias e virou o mês/ano
        expect(visit(s, '2027-01-06')).toMatchObject({ day_n: 37, days: 3, first_day: '2026-11-30' });
    });

    it('aparelho que já tinha save quando o id nasceu é legacy (fica fora das coortes)', () => {
        const s = memory();
        expect(visit(s, '2026-11-23', { hadSave: true })?.legacy).toBe(true);
        // depois continua legacy, mesmo que o save mude
        expect(visit(s, '2026-11-24', { hadSave: false })?.legacy).toBe(true);
    });

    it('respeita o Global Privacy Control: não gera, e apaga um id que já existia', () => {
        const s = memory();
        expect(visit(s, '2026-11-23', { gpc: true })).toBeNull();
        expect(s.m.size).toBe(0);
        visit(s, '2026-11-23');
        expect(visit(s, '2026-11-24', { gpc: true })).toBeNull();
        expect(s.m.has(DEVICE_KEY)).toBe(false);
    });

    it('sem localStorage (ou bloqueado) vai sem id; lixo na chave vira id novo', () => {
        expect(visit(null, '2026-11-23')).toBeNull();
        const broken = {
            ...memory(),
            setItem: () => {
                throw new Error('QuotaExceededError');
            },
        };
        expect(deviceVisit({ store: broken, today: '2026-11-23', hadSave: false, gpc: false })).toBeNull();
        const s = memory();
        s.m.set(DEVICE_KEY, '{"id":42}');
        expect(visit(s, '2026-11-23')).toMatchObject({ day_n: 0, days: 1 });
    });

    it('desligar as estatísticas apaga o id', () => {
        const s = memory();
        visit(s, '2026-11-23');
        forgetDevice(s);
        expect(s.m.has(DEVICE_KEY)).toBe(false);
    });

    it('fica fora do save (não vai pra nuvem nem pro backup)', () => {
        const s = memory();
        const did = visit(s, '2026-11-23')?.did as string;
        const save = JSON.stringify(savePart(useGame.getState()));
        expect(save).not.toContain(did);
        expect(save).not.toContain(DEVICE_KEY);
        // o save usa outra chave de armazenamento
        expect(DEVICE_KEY).not.toBe(useGame.persist.getOptions().name);
    });
});
