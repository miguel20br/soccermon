import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

// sem DOM no Node: guarda as dependências do efeito que põe o foco na folha (o React só o roda de novo se mudarem)
const deps: unknown[][] = [];
vi.mock('react', async (orig) => ({
    ...(await orig<typeof import('react')>()),
    useEffect: (_fx: unknown, d: unknown[]) => void deps.push(d),
    useRef: (v: unknown) => ({ current: v }),
    useId: () => 'id',
}));
vi.mock('react-dom', () => ({ createPortal: () => null }));
vi.stubGlobal('document', { body: null });
vi.mock('../../i18n/react', () => ({ useT: () => ({ t: (k: string) => k }) }));
vi.mock('../back-nav', () => ({ useBackLayer: () => {} }));
vi.mock('../components/MatchHud', () => ({ HudIcon: () => null }));

import { Sheet } from './Sheet';

describe('Sheet', () => {
    it('não devolve o foco pra folha quando quem abre renderiza de novo (onClose novo a cada render)', () => {
        // o Clube do Perfil: cada letra do nome muda o perfil, a folha renderiza com outro `() => openSheet(null)`
        const props = { open: true, title: 'Clube', children: createElement('input') };
        Sheet({ ...props, onClose: () => {} });
        Sheet({ ...props, onClose: () => {} });
        expect(deps).toHaveLength(2);
        const [a, b] = deps;
        // mesmas dependências = o efeito não roda de novo e o campo continua com o foco (antes: o 2º render o tirava)
        expect(a.length === b.length && a.every((v, i) => Object.is(v, b[i]))).toBe(true);
    });
});
