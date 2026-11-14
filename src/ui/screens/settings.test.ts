import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playCrowd: () => {}, playCry: () => {}, playSfx: () => {} }));

// celular (a linha da câmera de perto aparece), sem storage
vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: false }) });

import { pt } from '../../i18n/pt';
import { Settings } from './Settings';

const s = pt.settings.screen;
const html = (open: boolean) => renderToStaticMarkup(createElement(Settings, { open }));
/** Nomes das linhas de opção (o `<b>` do rótulo). */
const rows = (out: string) => [...out.matchAll(/class="set-label"><b>([^<]+)<\/b>/g)].map((m) => m[1]);

describe('Configurações enxutas (menos-e-mais.md, B1)', () => {
    it('à vista: só velocidade, volume, idioma e movimento; o resto fechado em "Mais opções"', () => {
        const out = html(false);
        expect(rows(out)).toEqual([s.speed, s.volume, s.langLabel, s.motion]);
        expect(out).toContain(`aria-expanded="false"`);
        expect(out).toContain(s.more);
    });

    it('nada some: "Mais opções" aberto tem todas as outras opções', () => {
        const all = rows(html(true));
        for (const k of [
            s.music,
            s.sfx,
            s.crowd,
            s.cries,
            s.criesStyle,
            s.goalCry,
            s.packBeat,
            s.camFollow,
            s.chance,
            s.cinematic,
            s.names,
            s.arrow,
            s.confirmLeave,
            s.haptics,
            s.tips,
            pt.settings.data.stats,
            pt.settings.data.backup,
            pt.settings.data.wipe,
        ])
            expect(all).toContain(k);
        // cada opção aparece uma vez só
        expect(new Set(all).size).toBe(all.length);
    });
});
