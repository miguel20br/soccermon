import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { placeBalloon } from '../ui/coach/place';
import { COACH_GROUPS, COACH_IDS, coachSeen, isFirstVisit, relampagoJogoDue, rotaNovaDue, whenHydrated } from './coach';
import { DEFAULT_SETTINGS, migrateSave, type PersistedSave, withUnlocks } from './game-store';
import { mergeProfileUnlocks } from './missions';
import { DEFAULT_PROFILE, EMPTY_CAREER } from './profile';

const save = (patch: Partial<PersistedSave> = {}): PersistedSave => ({
    run: null,
    settings: { ...DEFAULT_SETTINGS, lang: 'pt' },
    records: { cups: 0, titles: 0, perfect: 0 },
    profile: { ...DEFAULT_PROFILE, seen: [] },
    dex: {},
    moves: {},
    binder: [],
    career: EMPTY_CAREER,
    onboarded: false,
    parkedRuns: [],
    hall: [],
    duels: [],
    daily: [],
    ...patch,
});

describe('balões do tutorial: o que já foi jogado não aparece', () => {
    it('backup v6 de verdade (4 copas rápidas, Hall): Home e Relâmpago vistos; o resto continua novo', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const s = migrateSave(backup.save, backup.version);
            const coach = s.profile.coach;
            expect(Array.isArray(coach)).toBe(true);
            expect(coachSeen(coach, 'intro')).toBe(true);
            for (const id of COACH_GROUPS.relampago) expect(coachSeen(coach, id)).toBe(true);
            for (const id of ['rota', 'rotaGrupo', 'duelo', 'dueloSala', 'dia', 'liga'] as const)
                expect(coachSeen(coach, id)).toBe(false);
        }
    });

    it('quem nunca jogou vê tudo', () => {
        expect(withUnlocks(save()).profile.coach).toEqual([]);
    });

    it('Duelo e Copa do Dia jogados contam; Rota jogada conta, sem apagar a Relâmpago', () => {
        const s = withUnlocks(
            save({
                onboarded: true,
                records: { cups: 1, titles: 0, perfect: 0, longCups: 1, duelWins: 2 },
                daily: [{ day: '2026-10-20' } as PersistedSave['daily'][number]],
            }),
        );
        const c = s.profile.coach;
        expect(['rota', 'rotaGrupo', 'duelo', 'dueloSala', 'dia'].every((id) => c?.includes(id))).toBe(true);
        expect(coachSeen(c, 'relampago')).toBe(false);
        expect(coachSeen(c, 'liga')).toBe(false);
    });

    it('o campo existente não é recalculado, e a nuvem junta os dois lados', () => {
        const s = withUnlocks(save({ profile: { ...DEFAULT_PROFILE, seen: [], coach: ['dia'] }, onboarded: true }));
        expect(s.profile.coach).toEqual(['dia']);
        const merged = mergeProfileUnlocks({ ...DEFAULT_PROFILE, coach: ['dia'] }, { coach: ['liga', 'dia'] });
        expect(merged.coach).toEqual(expect.arrayContaining(['dia', 'liga']));
    });

    it('todo id tem grupo e Pular vale pro grupo do próprio id', () => {
        for (const id of COACH_IDS) expect(COACH_GROUPS[id]).toContain(id);
    });
});

describe('balão da Rota Índigo (rotaNova)', () => {
    const one = { cups: 1 };
    it('só depois da 1ª copa, com a Home de 1ª visita já vista, e uma vez só', () => {
        expect(rotaNovaDue({ cups: 0 }, ['intro'])).toBe(false);
        expect(rotaNovaDue(one, [])).toBe(false);
        expect(rotaNovaDue(one, ['intro'])).toBe(true);
        expect(rotaNovaDue(one, ['intro', 'rotaNova'])).toBe(false);
        expect(rotaNovaDue({ cups: 2 }, ['intro'])).toBe(false);
        expect(rotaNovaDue({ cups: 1, longCups: 1 }, ['intro'])).toBe(false);
    });
});

describe('placeBalloon: o balão nunca cobre o alvo', () => {
    const overlaps = (a: { left: number; top: number; width: number; height: number }, b: typeof a) =>
        a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;
    const sizes: [number, number][] = [
        [320, 568],
        [390, 844],
        [844, 390],
        [1440, 900],
    ];
    it.each(sizes)('em %ix%i, alvos de vários tamanhos e lugares', (vw, vh) => {
        const b = { width: Math.min(300, vw - 16), height: 110 };
        for (const fy of [0.05, 0.4, 0.9]) {
            for (const fx of [0.05, 0.5, 0.9]) {
                const hole = { left: vw * fx - 40, top: vh * fy - 20, width: 80, height: 40 };
                const p = placeBalloon(hole, b, vw, vh);
                expect(p.side).not.toBe('inside');
                expect(overlaps({ ...b, left: p.left, top: p.top }, hole)).toBe(false);
                expect(p.left).toBeGreaterThanOrEqual(0);
                expect(p.left + b.width).toBeLessThanOrEqual(vw);
                expect(p.top).toBeGreaterThanOrEqual(0);
                expect(p.top + b.height).toBeLessThanOrEqual(vh);
            }
        }
    });
});

describe('Home da 1ª visita (só o "Jogar")', () => {
    it('save novo vê a Home de 1ª visita; quem começou uma copa, jogou Duelo ou Copa do Dia vê a de sempre', () => {
        expect(isFirstVisit(save())).toBe(true);
        expect(isFirstVisit(save({ onboarded: true }))).toBe(false);
        expect(isFirstVisit(save({ records: { cups: 1, titles: 0, perfect: 0 } }))).toBe(false);
        expect(isFirstVisit(save({ duels: [{ id: 'x' } as PersistedSave['duels'][number]] }))).toBe(false);
        expect(isFirstVisit(save({ daily: [{ day: '2026-10-20' } as PersistedSave['daily'][number]] }))).toBe(false);
    });

    it('save antigo (backup v6) nunca cai na Home de 1ª visita', () => {
        for (const lang of ['pt', 'en']) {
            const backup = JSON.parse(readFileSync(`scripts/fixtures/backup-v6-${lang}.json`, 'utf8'));
            const old = { ...backup.save };
            delete old.onboarded; // save de antes do campo: vale o histórico
            expect(isFirstVisit(migrateSave(old, backup.version))).toBe(false);
        }
    });
});

describe('whenHydrated', () => {
    it('save que já carregou antes da assinatura ainda avisa (a Home de quem voltou ficava sem os modos)', () => {
        const cb = vi.fn();
        whenHydrated({ hasHydrated: () => true, onFinishHydration: () => () => {} }, cb);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('save que ainda vai carregar avisa quando terminar', () => {
        const cb = vi.fn();
        let done = () => {};
        const onFinishHydration = (fn: () => void) => {
            done = fn;
            return () => {};
        };
        whenHydrated({ hasHydrated: () => false, onFinishHydration }, cb);
        expect(cb).not.toHaveBeenCalled();
        done();
        expect(cb).toHaveBeenCalledTimes(1);
    });
});

describe('balão relampagoJogo', () => {
    it('só depois do 1º gol ou no intervalo, nunca no apito inicial', () => {
        expect(relampagoJogoDue([0, 0], false)).toBe(false);
        expect(relampagoJogoDue([1, 0], false)).toBe(true);
        expect(relampagoJogoDue([0, 2], false)).toBe(true);
        expect(relampagoJogoDue([0, 0], true)).toBe(true);
    });
});
