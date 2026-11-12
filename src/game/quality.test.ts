import { describe, expect, it } from 'vitest';
import {
    BASE_SPRITE_SCALE,
    FpsGovernor,
    gridShift,
    pixelFont,
    QualityStats,
    RES_CAPS,
    resAt,
    START_LEVEL,
    setMatchQualitySource,
    spriteScaleFor,
    takeMatchQuality,
} from './quality';

/** Pixels do canvas por pixel do sprite. */
const texel = (res: number) => spriteScaleFor(res) * res;

describe('escala inteira do sprite (pixel duro)', () => {
    it('celular em pé (2,02), deitado (1,47) e PC 1920 (0,97): número inteiro de pixels do canvas', () => {
        expect(texel(2.0167)).toBeCloseTo(4, 9);
        expect(texel(1.466)).toBeCloseTo(3, 9);
        expect(texel(0.9685)).toBeCloseTo(2, 9);
        expect(texel(3)).toBeCloseTo(5, 9);
    });

    it('perto da escala de sempre: no máximo 15% maior ou menor', () => {
        for (let r = 0.5; r <= 3; r += 0.01) {
            const ss = spriteScaleFor(r);
            expect(Math.abs(ss / BASE_SPRITE_SCALE - 1)).toBeLessThanOrEqual(0.15 + 1e-9);
        }
    });

    it('sem inteiro perto (PC 1440, 0,77 px por px do jogo): fica 1.8 e o smoothPixelArt suaviza a borda', () => {
        expect(spriteScaleFor(0.7748)).toBe(BASE_SPRITE_SCALE);
        expect(spriteScaleFor(0)).toBe(BASE_SPRITE_SCALE);
    });
});

describe('borda no pixel inteiro', () => {
    it('leva a borda pro pixel inteiro do canvas, com zoom e rolagem da câmera', () => {
        for (const [edge, scroll, zoom, res] of [
            [100.3, 0, 1, 2.0167],
            [57.77, 13.2, 1.2, 3],
            [400.01, 200.5, 1, 1.466],
        ]) {
            const s = gridShift(edge, scroll, 484, 0, zoom, res);
            const at = ((edge + s - scroll - 484) * zoom + 484) * res;
            expect(Math.abs(at - Math.round(at))).toBeLessThan(1e-6);
            expect(Math.abs(s * zoom * res)).toBeLessThanOrEqual(0.5 + 1e-9);
        }
    });
});

describe('nome em pixel inteiro', () => {
    it('Galmuri11 em múltiplo de 12 px do canvas', () => {
        for (const [want, res, px] of [
            [11, 2.0167, 24],
            [15, 1.466, 24],
            [10, 0.775, 12],
            [10, 3, 36],
        ]) {
            const f = pixelFont(want, res);
            expect(f.size * res).toBeCloseTo(px, 9);
            expect(Number.isInteger(Math.round(f.stroke * res * 1e6) / 1e6)).toBe(true);
        }
    });
});

describe('teto de resolução', () => {
    it('a tela inteira se passa do teto por até 10%; senão o teto', () => {
        expect(resAt(START_LEVEL, 2.0167)).toBe(2.0167);
        expect(resAt(START_LEVEL, 2.6)).toBe(2);
        expect(resAt(0, 2.6)).toBe(2.6);
        expect(resAt(RES_CAPS.length - 1, 2.6)).toBe(1);
    });
});

/** `secs` segundos a `fps` quadros por segundo; devolve as mudanças de degrau. */
function run(gov: FpsGovernor, fps: number, secs: number) {
    const levels: number[] = [];
    for (let i = 0; i < fps * secs; i++) if (gov.frame(1000 / fps)) levels.push(gov.level);
    return levels;
}

describe('governador de fps', () => {
    const tela3 = (level: number) => resAt(level, 3);

    it('lento sustentado desce um degrau; rápido sustentado sobe', () => {
        const gov = new FpsGovernor(tela3);
        expect(run(gov, 40, 4.5)).toEqual([]); // aquecendo (2 s) + 2 janelas: ainda não
        expect(run(gov, 40, 1)).toEqual([2]);
        // desceu e melhorou (60 fps): fica; depois de 8 s bons, tenta voltar
        expect(run(gov, 60, 3)).toEqual([]);
        expect(run(gov, 60, 8)).toEqual([1]);
        expect(run(gov, 60, 8)).toEqual([0]);
    });

    it('um quadro lento solto não muda nada', () => {
        const gov = new FpsGovernor(tela3);
        run(gov, 60, 3);
        gov.frame(200);
        expect(run(gov, 60, 1)).toEqual([]);
        expect(gov.level).toBe(START_LEVEL);
    });

    it('histerese: o degrau que falhou duas vezes não é tentado de novo (não fica oscilando)', () => {
        const gov = new FpsGovernor(tela3);
        run(gov, 60, 2); // aquece
        const seen: number[] = [];
        // aguenta 60 fps no degrau 1, mas não no 0: sobe, cai, sobe, cai e para
        for (let i = 0; i < 60 * 120; i++) if (gov.frame(gov.level === 0 ? 25 : 1000 / 60)) seen.push(gov.level);
        expect(seen).toEqual([0, 1, 0, 1]);
        expect(seen.filter((l) => l === 0).length).toBe(2);
        expect(gov.level).toBe(1);
    });

    it('preso em 30 fps (modo economia): desce, não melhora, volta e trava', () => {
        const gov = new FpsGovernor(tela3);
        expect(run(gov, 30, 5.5)).toEqual([2]);
        expect(run(gov, 30, 3)).toEqual([1]);
        expect(gov.locked).toBe(true);
        expect(run(gov, 30, 30)).toEqual([]);
    });

    it('degrau que não muda a resolução é pulado (PC com 0,77 px: nada pra descer)', () => {
        const gov = new FpsGovernor((l) => resAt(l, 0.77));
        expect(run(gov, 30, 10)).toEqual([]);
        expect(gov.level).toBe(START_LEVEL);
    });
});

describe('telemetria', () => {
    it('fps médio e p10 da partida', () => {
        const st = new QualityStats();
        for (let i = 0; i < 90; i++) st.frame(1000 / 60);
        for (let i = 0; i < 10; i++) st.frame(1000 / 20);
        expect(st.summary()).toEqual({ fps: 50, fpsP10: 20 });
        expect(new QualityStats().summary()).toBeNull();
    });

    it('o match_end lê uma vez', () => {
        setMatchQualitySource(() => ({ fps: 58, fps_p10: 50, dpr: 3, res_level: 1 }));
        expect(takeMatchQuality()).toEqual({ fps: 58, fps_p10: 50, dpr: 3, res_level: 1 });
        expect(takeMatchQuality()).toEqual({});
    });
});
