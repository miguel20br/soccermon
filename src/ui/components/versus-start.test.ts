import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));
vi.mock('../../game/audio', () => ({ playSfx: () => {} }));

import { buildCupOpponents } from '../../engine/cup';
import { VersusIntro, VsStartButton } from './VersusIntro';

const noop = () => {};
const html = (props: Parameters<typeof VsStartButton>[0]) => renderToStaticMarkup(createElement(VsStartButton, props));

/**
 * Bug do jogador (19/10): o botão "Carregando a quadra…" do VERSUS era clicável e levava pra uma partida vazia
 * enquanto o Phaser ainda carregava. Carregando = desligado de verdade; só vira "Começar" com a quadra pronta.
 */
describe('botão do VERSUS', () => {
    it('carregando: desligado, aria-busy e sem "Começar"', () => {
        const out = html({ ready: false, onStart: noop });
        expect(out).toMatch(/<button[^>]*disabled=""/);
        expect(out).toContain('aria-busy="true"');
        expect(out).toContain('Carregando a quadra');
    });

    it('pronto: ligado e com "Começar!"', () => {
        const out = html({ ready: true, onStart: noop });
        expect(out).not.toContain('disabled');
        expect(out).toContain('aria-busy="false"');
        expect(out).toContain('Começar!');
    });

    it('demorou demais: aviso e "Tentar de novo" (também no Duelo, que não tem botão de começar)', () => {
        for (const startsIn of [undefined, 3]) {
            const out = html({ ready: false, slow: true, startsIn, onStart: noop, onRetry: noop });
            expect(out).toContain('role="alert"');
            expect(out).toContain('Tentar de novo');
            expect(out).not.toContain('disabled');
        }
        // quadra chegou depois do aviso: volta pro "Começar"
        expect(html({ ready: true, slow: true, onStart: noop, onRetry: noop })).toContain('Começar!');
    });

    it('a tela do VERSUS usa esse botão: carregando, ele sai desligado', () => {
        const [home, away] = buildCupOpponents('versus-start-test');
        const out = renderToStaticMarkup(
            createElement(VersusIntro, { home, away, stage: 'Quartas', ready: false, onDone: noop }),
        );
        expect(out).toMatch(/<button[^>]*class="btn primary vs-start loading"[^>]*disabled=""/);
    });
});
