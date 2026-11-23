import { describe, expect, it, vi } from 'vitest';

const reportError = vi.fn();
vi.mock('../../analytics/track', () => ({ reportError }));
const { ErrorBoundary } = await import('./ErrorBoundary');

describe('ErrorBoundary', () => {
    it('a tela de crash manda o evento de erro (antes só ia pro console)', () => {
        const err = new TypeError("Cannot read properties of undefined (reading 'zoom')");
        const b = new ErrorBoundary({ children: null });
        b.setState = () => {};
        vi.spyOn(console, 'error').mockImplementation(() => {});
        b.componentDidCatch(err, { componentStack: '\n    at Home' });
        expect(reportError).toHaveBeenCalledWith('react', err);
    });
});
