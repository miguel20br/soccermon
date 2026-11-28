import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Ajustes de tela do QA da 0.10.0 (27/11/2026) que são só CSS ou JSX: o teste lê o código e cobra a regra que o
 * conserto põe (sem o conserto, falha). O que se vê na tela ficou nos prints de `qa-0010/ajustes`.
 */
const src = (f: string) => readFileSync(new URL(f, import.meta.url), 'utf8');
const rule = (css: string, sel: string) => {
    const i = css.indexOf(`\n${sel} {`);
    expect(i, `regra ${sel}`).toBeGreaterThan(-1);
    return css.slice(i, css.indexOf('}', i));
};

describe('ajustes do QA da 0.10.0', () => {
    it('Natal: o logo pequeno do topo também usa o gorrinho', () => {
        expect(src('../App.tsx')).toMatch(/brand-logo[\s\S]{0,400}natalOn[\s\S]{0,200}logo-gorro/);
        expect(src('./components/logo-hits.css')).toContain('.logo-blink > .logo-gorro');
    });

    it('Duelo: a escolha do capitão mostra o golpe máximo, o mesmo componente da Copa', () => {
        expect(src('./duel/DuelDraft.tsx')).toMatch(/round === 0 && <CaptainMax/);
        expect(src('./screens/Draft.tsx')).toMatch(/isCaptain && <CaptainMax/);
    });

    it('pílula "NN · fora": cabe na vaga (320 e prancheta compacta) e o item não fica por cima dela', () => {
        const css = src('./styles.css');
        expect(rule(css, '.slot.sc .slot-rating')).toContain('max-width: 100%');
        expect(rule(css, '.prancheta .slot .slot-rating')).toContain('padding-inline: 3px');
        expect(css).toMatch(
            /max-width: 359px\) and \(orientation: portrait\) \{\s+\.slot\.sc \.slot-rating \{\s+padding-inline: 3px/,
        );
        // o item sai do canto de baixo (onde a pílula fica): sobe pro pé do sprite
        expect(Number(/bottom: (\d+)px/.exec(rule(css, '.slot img.slot-item'))?.[1])).toBeGreaterThanOrEqual(30);
    });

    it('selo "craque" do fim da copa: na ponta da fileira cola no sprite, sem vazar pra fora', () => {
        const css = src('./styles.css');
        expect(rule(css, '.rh-mon:last-child .rh-star')).toContain('right: 0');
        expect(rule(css, '.rh-mon:first-child .rh-star')).toContain('left: 0');
    });

    it('caixa de narração não encolhe (a quadra cede)', () => {
        expect(rule(src('./components/broadcast.css'), '.bt-box')).toContain('flex-shrink: 0');
    });

    it('sinergia secreta: a linha dos dois nomes vai em cima do título, não embaixo (onde cobre quem está em quadra)', () => {
        expect(src('../game/scenes/MatchScene.ts')).toMatch(/battle\.secretSub[\s\S]{0,120}subAbove: true/);
        expect(src('../game/cinematics.ts')).toContain('sub.setY(-(t.height / 2');
    });

    it('Estádio deitado: as placas dos modos mostram o nome ao lado do ícone (2 placas)', () => {
        expect(src('./ambientes/ambientes.css')).toMatch(
            /max-height: 400px\) and \(min-width: 800px\)[\s\S]{0,200}\.es-rail:not\(\.many\) \.es-tile/,
        );
    });

    it('escalação em 320x568: a dica some e a quadra ganha a altura dela (vagas não se sobrepõem; scripts/prancheta-vagas.mjs mede)', () => {
        const css = src('./vestiario.css');
        expect(css).toMatch(
            /max-width: 400px\) and \(max-height: 600px\) and \(orientation: portrait\) \{\s+\.vt-swaphint \{\s+display: none;[\s\S]{0,120}height: calc\(100 \* var\(--svh\) - 288px\)/,
        );
    });
});
