import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    claimOverlay,
    onOverlayClaim,
    overlayBusy,
    overlayFreeIn,
    PRIO_GOAL,
    PRIO_MOVE,
    PRIO_REACTION,
    setPhoneForTest,
} from './overlay-slot';

describe('uma sobreposição por vez na quadra (celular)', () => {
    afterEach(() => {
        vi.useRealTimers();
        setPhoneForTest(null);
    });

    it('gol tira o golpe, a reação espera e o golpe não passa por cima do gol', () => {
        vi.useFakeTimers();
        setPhoneForTest(true);
        const out: string[] = [];
        const off = onOverlayClaim((id) => out.push(id));
        expect(claimOverlay('banner', PRIO_MOVE, 1000)).toBe(true);
        expect(claimOverlay('drama', PRIO_GOAL, 1500)).toBe(true);
        expect(out).toEqual(['banner', 'drama']);
        expect(claimOverlay('emote', PRIO_REACTION, 2600)).toBe(false);
        expect(claimOverlay('banner', PRIO_MOVE, 1000)).toBe(false);
        expect(overlayFreeIn(PRIO_REACTION)).toBe(1500);
        expect(overlayBusy()).toBe(true);
        vi.advanceTimersByTime(1500);
        expect(overlayFreeIn(PRIO_REACTION)).toBe(0);
        expect(claimOverlay('emote', PRIO_REACTION, 2600)).toBe(true);
        off();
    });

    it('fora do celular tudo entra, como antes', () => {
        setPhoneForTest(false);
        expect(claimOverlay('drama', PRIO_GOAL, 1500)).toBe(true);
        expect(claimOverlay('emote', PRIO_REACTION, 2600)).toBe(true);
        expect(overlayBusy()).toBe(false);
    });
});
