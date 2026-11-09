import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playCry: () => {} }));
// a cena não roda aqui: guarda o que o replay mandaria pro Phaser
const seen: { data?: { court?: string } } = {};
vi.mock('../../PhaserGame', () => ({
    PhaserGame: ({ data }: { data: { court?: string } }) => {
        seen.data = data;
        return null;
    },
}));
vi.mock('../kit/Sheet', async () => {
    const { createElement: h } = await import('react');
    return { Sheet: ({ children }: { children: unknown }) => h('div', null, children as never) };
});

import type { MatchResult } from '../../engine/runners/batch-runner';
import type { Moment } from '../moments';
import { Moments } from './Moments';

describe('replay na quadra da partida', () => {
    it('os melhores momentos tocam no ginásio do rival, não na quadra padrão', () => {
        const result = { snapshots: [], events: [] } as unknown as MatchResult;
        const clip = { from: 0, to: 10, kind: 'goal', name: 'Pikachu', minute: 3 } as unknown as Moment;
        renderToStaticMarkup(
            createElement(Moments, {
                result,
                clips: [clip],
                names: ['A', 'B'],
                colors: [0, 0],
                court: 'brock',
                onClose: () => {},
            }),
        );
        expect(seen.data?.court).toBe('brock');
    });
});
