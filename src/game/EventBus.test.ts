import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus';

describe('EventBus (sem Phaser)', () => {
    it('chama com o contexto e os argumentos, e off tira só o par fn+contexto', () => {
        const a = { n: 0 };
        const b = { n: 0 };
        function inc(this: { n: number }, k: number) {
            this.n += k;
        }
        EventBus.on('t:ctx', inc, a);
        EventBus.on('t:ctx', inc, b);
        EventBus.emit('t:ctx', 2);
        EventBus.off('t:ctx', inc, a);
        EventBus.emit('t:ctx', 3);
        expect([a.n, b.n]).toEqual([2, 5]);
        EventBus.off('t:ctx', inc);
        expect(EventBus.emit('t:ctx', 1)).toBe(false);
    });

    it('quem sai no meio do emit não faz o próximo ouvinte pular', () => {
        const second = vi.fn();
        const first = () => EventBus.off('t:self', first);
        EventBus.on('t:self', first);
        EventBus.on('t:self', second);
        EventBus.emit('t:self');
        expect(second).toHaveBeenCalledTimes(1);
        EventBus.off('t:self', second);
    });
});
