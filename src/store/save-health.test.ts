import { beforeEach, describe, expect, it } from 'vitest';
import { safeStorage, useSaveHealth, watchSave } from './save-health';

const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' });

describe('aviso de disco cheio', () => {
    beforeEach(() => useSaveHealth.setState({ full: false }));

    it('liga quando a gravação falha por cota e desliga na gravação seguinte que der certo', async () => {
        await expect(watchSave(Promise.reject(quota()))).rejects.toThrow();
        expect(useSaveHealth.getState().full).toBe(true);
        await watchSave(Promise.resolve());
        expect(useSaveHealth.getState().full).toBe(false);
    });

    it('outro erro de gravação não liga o aviso', async () => {
        await expect(watchSave(Promise.reject(new Error('x')))).rejects.toThrow();
        expect(useSaveHealth.getState().full).toBe(false);
    });
});

describe('safeStorage (navegador que bloqueia o IndexedDB)', () => {
    const blockedIdb = {
        get: () => Promise.reject(new DOMException('blocked', 'SecurityError')),
        set: () => {
            throw new DOMException('blocked', 'SecurityError');
        },
        del: () => {
            throw new DOMException('blocked', 'SecurityError');
        },
    };
    it('não lança: o save fica na memória e o aviso liga (antes o JOGAR não fazia nada no Opera GX)', async () => {
        useSaveHealth.setState({ blocked: false });
        const s = safeStorage(blockedIdb);
        expect(await s.getItem('save')).toBeNull();
        expect(() => s.setItem('save', '{"a":1}')).not.toThrow();
        expect(await s.getItem('save')).toBe('{"a":1}');
        expect(() => s.removeItem('save')).not.toThrow();
        expect(useSaveHealth.getState().blocked).toBe(true);
    });
    it('com IndexedDB, grava nele e não avisa nada', async () => {
        useSaveHealth.setState({ blocked: false });
        const db = new Map<string, string>();
        const s = safeStorage({
            get: async (k) => db.get(k),
            set: async (k, v) => void db.set(k, v),
            del: async (k) => void db.delete(k),
        });
        await s.setItem('save', 'x');
        expect(db.get('save')).toBe('x');
        expect(useSaveHealth.getState().blocked).toBe(false);
    });
});
