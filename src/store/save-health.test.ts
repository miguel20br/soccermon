import { beforeEach, describe, expect, it } from 'vitest';
import { useSaveHealth, watchSave } from './save-health';

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
