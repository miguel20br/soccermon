import { describe, expect, it } from 'vitest';
import { AGENCY } from '../../engine/agency';
import { MAX_SIGNATURE } from '../../engine/signature-moves';
import { maxDexEntries } from './MaxDex';

describe('Golpedex: Especiais e Bicudas', () => {
    it('lista os 3 níveis, os 16 tipos e as assinaturas, com os números do motor', () => {
        const rows = maxDexEntries('especiais', 'pt');
        expect(rows.filter((r) => r.id.startsWith('t-'))).toHaveLength(16);
        expect(rows.filter((r) => r.id.startsWith('s-'))).toHaveLength(Object.keys(MAX_SIGNATURE).length);
        const n3 = rows.find((r) => r.id === 'lv3');
        expect(n3?.facts.flat().join(' ')).toContain(`${3 * AGENCY.maxLevelPts} pontos`);
        expect(n3?.text).toContain('+120%');
        // nenhum texto ficou com {variável} sem trocar
        for (const r of rows) expect(JSON.stringify(r)).not.toMatch(/\{\w+\}/);
    });

    it('bicudas: duelo e espalmada com os números do AGENCY, em PT e EN', () => {
        for (const lang of ['pt', 'en'] as const) {
            const rows = maxDexEntries('bicudas', lang);
            expect(rows.map((r) => r.id)).toEqual(['b1', 'b2', 'b3', 'counter', 'duel', 'parry']);
            const duel = JSON.stringify(rows.find((r) => r.id === 'duel'));
            expect(duel).toContain(String(AGENCY.showdown.speed));
            expect(duel).toContain(lang === 'pt' ? '15,25' : '15.25');
            expect(JSON.stringify(rows.find((r) => r.id === 'parry'))).toContain(`${AGENCY.maxParry.post * 100}%`);
            for (const r of rows) expect(JSON.stringify(r)).not.toMatch(/\{\w+\}/);
        }
    });
});
