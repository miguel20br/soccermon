import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Volumes dos arquivos medidos com `npx tsx scripts/niveis-audio.ts` (22/10/2026): mediana do maior momentâneo dos
 * gritos `latest` (sem ganho) e o integrado das músicas (o render.mjs normaliza a −16 LUFS).
 */
const CRY_FILE_LUFS = -7.7;
// antes (GAIN.cry 0,55) o grito ficava ~11 dB acima da música; agora ~1,5 dB abaixo
const MUSIC_FILE_LUFS = -16;
const db = (g: number) => 20 * Math.log10(g);

describe('mistura', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('o grito no padrão das Configurações fica atrás da música (tempero), com folga de 1 dB', async () => {
        vi.doMock('zzfx', () => ({ ZZFX: { volume: 0.3 }, zzfx: () => {} }));
        const { GAIN } = await import('./audio');
        const master = 0.6;
        const music = 0.4; // DEFAULT_SETTINGS.musicVolume
        expect(db(GAIN.cry * master) + CRY_FILE_LUFS).toBeLessThanOrEqual(db(master * music) + MUSIC_FILE_LUFS - 1);
    });

    it('playCry toca no ganho base × geral × gritos × normalização da espécie; o controle baixa por cima', async () => {
        vi.doMock('zzfx', () => ({ ZZFX: { volume: 0.3 }, zzfx: () => {} }));
        const played: number[] = [];
        vi.stubGlobal(
            'Audio',
            class {
                volume = 1;
                cloneNode() {
                    return this;
                }
                play() {
                    played.push(this.volume);
                    return Promise.resolve();
                }
            },
        );
        vi.stubGlobal('window', { setInterval: () => 0 });
        const { GAIN, playCry, setVolumes } = await import('./audio');
        const { cryGain } = await import('./cry-level');
        setVolumes({ master: 0.6, cries: 1 });
        playCry(25, 'latest');
        setVolumes({ cries: 0.5 });
        playCry(25, 'latest');
        expect(played[0]).toBeCloseTo(GAIN.cry * 0.6 * cryGain(25, 'latest'), 9);
        expect(played[1]).toBeCloseTo(played[0] / 2, 9);
    });

    it('draft sem grito: escolher é silencioso, só a música', () => {
        for (const f of ['src/ui/screens/Draft.tsx', 'src/ui/duel/DuelDraft.tsx']) {
            const src = readFileSync(f, 'utf8');
            expect(src).not.toMatch(/playCry|data-cry/);
        }
    });
});
