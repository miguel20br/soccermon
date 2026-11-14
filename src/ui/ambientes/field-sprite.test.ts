import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fieldSheet, frameAt, frameMs, menuAtlas } from './FieldSprite';

describe('fieldSheet', () => {
    it('folha do menu; shiny usa a shiny; espécie sem shiny no PMDCollab fica na normal', () => {
        expect(fieldSheet(4, true)).toBe('assets/field/menu/shiny/4.png');
        expect(fieldSheet(4)).toBe('assets/field/menu/4.png');
        expect(fieldSheet(16, true)).toBe('assets/field/menu/16.png');
    });
});

describe('menuAtlas', () => {
    it('uma fileira por direção, quadros lado a lado, a partir da linha da animação', () => {
        const a = menuAtlas({
            size: { w: 96, h: 152 },
            anims: {
                Walk: { w: 32, h: 40, y: 0, n: 3, rows: 2, durations: [8, 10, 8] },
                Idle: { w: 24, h: 72, y: 80, n: 2, rows: 1, durations: [40, 2] },
            },
        });
        expect(Object.keys(a.frames).sort()).toEqual([
            'Idle/0/0',
            'Idle/0/1',
            'Walk/0/0',
            'Walk/0/1',
            'Walk/0/2',
            'Walk/1/0',
            'Walk/1/1',
            'Walk/1/2',
        ]);
        expect(a.frames['Walk/1/2'].frame).toEqual({ x: 64, y: 40, w: 32, h: 40 });
        expect(a.frames['Idle/0/1'].frame).toEqual({ x: 24, y: 80, w: 24, h: 72 });
        expect(a.anims?.Walk.durations).toEqual([8, 10, 8]);
    });
});

describe('folhas do menu em dia com as da quadra (npm run assets:menu)', () => {
    const dir = 'public/assets/field';
    const pmd = JSON.parse(readFileSync('src/data/pmd-anims.json', 'utf8'));
    const pngSize = (f: string) => {
        const b = readFileSync(f);
        return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    };
    const ids = readdirSync(dir)
        .filter((f) => /^\d+\.json$/.test(f))
        .map((f) => Number.parseInt(f, 10));
    it('as 151 espécies', () => expect(ids.length).toBe(151));
    it('cada espécie: Walk/Idle/Hop/Pose com os mesmos quadros e durações, PNG do tamanho do JSON', () => {
        for (const id of ids) {
            const field = JSON.parse(readFileSync(`${dir}/${id}.json`, 'utf8'));
            const menu = JSON.parse(readFileSync(`${dir}/menu/${id}.json`, 'utf8'));
            for (const anim of ['Walk', 'Idle', 'Hop', 'Pose']) {
                const f0 = field.frames[`${anim}/0/0`]?.frame;
                const m = menu.anims[anim];
                expect(!!m, `#${id} ${anim}`).toBe(!!f0);
                if (!f0) continue;
                expect([m.w, m.h], `#${id} ${anim}`).toEqual([f0.w, f0.h]);
                expect(field.frames[`${anim}/${m.rows - 1}/${m.n - 1}`], `#${id} ${anim}`).toBeTruthy();
                expect(m.durations, `#${id} ${anim}`).toEqual(pmd[id].anims[anim].durations);
            }
            expect(pngSize(`${dir}/menu/${id}.png`), `#${id}`).toEqual(menu.size);
            expect(existsSync(`${dir}/menu/shiny/${id}.png`), `#${id} shiny`).toBe(
                existsSync(`${dir}/shiny/${id}.png`),
            );
        }
    });
});

describe('ritmo do AnimData (F2 da revisão de arte)', () => {
    it('cada quadro dura o do AnimData (1/60 s); folha sem durações usa a de reserva', () => {
        const atlas = { anims: { Idle: { durations: [40, 2, 3, 3, 3, 2] } } };
        expect(frameMs(atlas, 'Idle', 6).map(Math.round)).toEqual([667, 33, 50, 50, 50, 33]);
        expect(frameMs(atlas, 'Walk', 4)).toEqual([110, 110, 110, 110]);
        // contagem de quadros diferente (folha e JSON fora de sincronia): reserva
        expect(frameMs(atlas, 'Idle', 4)).toEqual([170, 170, 170, 170]);
    });
    it('o Idle do Pikachu segura o 1º quadro (o de pé no chão) a maior parte do tempo', () => {
        const ms = frameMs({ anims: { Idle: { durations: [40, 2, 3, 3, 3, 2] } } }, 'Idle', 6);
        const total = ms.reduce((a, b) => a + b, 0);
        let noChao = 0;
        for (let t = 0; t < total; t += 5) if (frameAt(ms, t, true) === 0) noChao += 5;
        expect(noChao / total).toBeGreaterThan(0.7);
    });
    it('em loop repete; sem loop (Hop) dá -1 no fim, pra voltar pro Idle', () => {
        const ms = [100, 50, 50];
        expect([0, 99, 100, 149, 150, 199, 200, 300].map((t) => frameAt(ms, t, true))).toEqual([
            0, 0, 1, 1, 2, 2, 0, 1,
        ]);
        expect(frameAt(ms, 199, false)).toBe(2);
        expect(frameAt(ms, 200, false)).toBe(-1);
        expect(frameAt(ms, -5, false)).toBe(0);
    });
});
