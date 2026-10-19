import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { DEFAULT_SETTINGS, type PersistedSave, type RunState, withUnlocks } from '../store/game-store';
import { DEFAULT_PROFILE, type Dex, EDITION_BIT, EMPTY_CAREER } from '../store/profile';
import { hasProgress, mergeSaves, type PlanInput, planReconcile, summarize } from './reconcile-plan';

/** Copa mínima para as regras (o motor não roda aqui). */
function cup(seed: string, opts: Partial<RunState> & { played?: number } = {}): RunState {
    const { played = 0, ...rest } = opts;
    return {
        schemaVersion: 3,
        seed,
        teamName: `Time ${seed}`,
        status: 'lineup',
        formation: '1-2-1',
        draftRound: 7,
        draftSlot: null,
        options: [],
        rerolls: 2,
        rerollsUsed: 0,
        picks: [],
        lineup: [],
        bench: [],
        captainUid: null,
        tactic: 'balanced',
        opponents: [],
        stage: played,
        results: Array.from({ length: played }, (_, i) => ({
            stage: i,
            opponent: 'X',
            score: [2, 1] as [number, number],
            shootout: null,
            won: true,
        })),
        rewards: [],
        lockedTeam: null,
        ...rest,
    };
}

function save(patch: Partial<PersistedSave> = {}): PersistedSave {
    return {
        run: null,
        settings: { ...DEFAULT_SETTINGS, lang: 'pt' },
        records: { cups: 0, titles: 0, perfect: 0 },
        profile: DEFAULT_PROFILE,
        dex: {},
        moves: {},
        career: EMPTY_CAREER,
        onboarded: false,
        parkedRuns: [],
        hall: [],
        duels: [],
        daily: [],
        ...patch,
    };
}

const dex = (...ids: number[]): Dex =>
    Object.fromEntries(
        ids.map((id) => [
            id,
            { matches: 1, minutes: 10, goals: 0, assists: 0, wins: 0, titles: 0, bestRating: 6, bestOvr: 60 },
        ]),
    );

const plan = (p: Partial<PlanInput>) =>
    planReconcile({
        local: save(),
        cloud: undefined,
        owner: '',
        uid: 'me',
        localTs: 100,
        cloudTs: 0,
        syncedTs: 0,
        ...p,
    });

describe('planReconcile: o que fazer ao entrar', () => {
    it('visitante sem progresso: segue sem perguntar (sobe ou vale a conta)', () => {
        expect(plan({ local: save({ onboarded: true }) }).kind).toBe('upload');
        expect(plan({ cloud: save({ records: { cups: 4, titles: 1, perfect: 0 } }) }).kind).toBe('cloud-wins');
    });

    it('primeiro login, conta sem save, aparelho com progresso: pergunta se leva', () => {
        expect(plan({ local: save({ run: cup('a') }) }).kind).toBe('ask-bring');
        expect(plan({ local: save({ dex: dex(25) }) }).kind).toBe('ask-bring');
        // conta com save vazio (login antes num aparelho sem nada) conta como conta nova
        expect(plan({ local: save({ run: cup('a') }), cloud: save({ onboarded: true }) }).kind).toBe('ask-bring');
    });

    it('conta com save e aparelho de visitante com progresso: pergunta se junta', () => {
        const cloud = save({ records: { cups: 5, titles: 2, perfect: 0 }, run: cup('c') });
        // só a conta tem copa: continua a da conta, sem perguntar qual
        expect(plan({ local: save({ dex: dex(1) }), cloud })).toEqual({
            kind: 'ask-merge',
            cupChoice: false,
            keep: 'cloud',
        });
        // só o aparelho tem copa
        expect(plan({ local: save({ run: cup('d') }), cloud: save({ dex: dex(4) }) })).toEqual({
            kind: 'ask-merge',
            cupChoice: false,
            keep: 'device',
        });
        // as duas têm copas diferentes: o jogador escolhe
        expect(plan({ local: save({ run: cup('d') }), cloud })).toMatchObject({ kind: 'ask-merge', cupChoice: true });
        // copa terminada não conta como em andamento
        expect(plan({ local: save({ run: cup('d', { status: 'champion', played: 4 }) }), cloud })).toMatchObject({
            cupChoice: false,
            keep: 'cloud',
        });
    });

    it('save de outra conta: não herda nada', () => {
        expect(plan({ owner: 'outra', local: save({ run: cup('a') }), cloud: save() }).kind).toBe('other-account');
        expect(plan({ owner: 'outra' }).kind).toBe('other-account');
    });

    it('mesma conta: sincroniza sozinho pelo mais novo', () => {
        const local = save({ run: cup('a') });
        expect(plan({ owner: 'me', local }).kind).toBe('upload');
        expect(plan({ owner: 'me', local, cloud: save({ run: cup('a', { played: 2 }) }), cloudTs: 200 }).kind).toBe(
            'cloud-wins',
        );
        expect(plan({ owner: 'me', local, cloud: save(), localTs: 300, cloudTs: 200 }).kind).toBe('local-wins');
    });

    it('mesma conta com copas diferentes dos dois lados: pergunta qual continua', () => {
        const local = save({ run: cup('a') });
        const cloud = save({ run: cup('b') });
        expect(plan({ owner: 'me', local, cloud, localTs: 150, cloudTs: 200, syncedTs: 100 }).kind).toBe('ask-cup');
        // vale também com o aparelho mais novo (a copa da nuvem veio de outro aparelho)
        expect(plan({ owner: 'me', local, cloud, localTs: 300, cloudTs: 200, syncedTs: 100 }).kind).toBe('ask-cup');
    });

    it('mesma conta: se só um lado mudou desde a última sincronização, ele vale sem perguntar', () => {
        const local = save({ run: cup('a') });
        const cloud = save({ run: cup('b') });
        // o aparelho não mudou (a copa "a" já foi trocada em outro aparelho): vale a nuvem
        expect(plan({ owner: 'me', local, cloud, localTs: 100, cloudTs: 200, syncedTs: 100 }).kind).toBe('cloud-wins');
        // a nuvem não mudou (o aparelho começou outra copa): vale o aparelho
        expect(plan({ owner: 'me', local, cloud, localTs: 300, cloudTs: 100, syncedTs: 100 }).kind).toBe('local-wins');
    });
});

describe('mergeSaves: junção sem perder copa', () => {
    it('recordes, Pokédex e golpes juntam o melhor dos dois', () => {
        const local = save({ records: { cups: 3, titles: 2, perfect: 0 }, dex: dex(1, 4), moves: { tackle: 3 } });
        const cloud = save({
            records: { cups: 5, titles: 1, perfect: 1 },
            dex: dex(4, 7),
            moves: { tackle: 1, ember: 2 },
        });
        const m = mergeSaves(local, cloud, 'cloud');
        expect(m.records).toEqual({ cups: 5, titles: 2, perfect: 1 });
        expect(
            Object.keys(m.dex)
                .map(Number)
                .sort((a, b) => a - b),
        ).toEqual([1, 4, 7]);
        expect(m.moves).toEqual({ tackle: 3, ember: 2 });
    });

    it('sequência de títulos em curso vem do lado que vale (perdeu no celular, o PC não ressuscita); a melhor junta', () => {
        const pc = save({ records: { cups: 3, titles: 3, perfect: 0, streak: 3, bestStreak: 3 } });
        const phone = save({ records: { cups: 4, titles: 3, perfect: 0, streak: 0, bestStreak: 3 } });
        expect(mergeSaves(pc, phone, 'cloud').records).toMatchObject({ streak: 0, bestStreak: 3, cups: 4 });
        expect(mergeSaves(pc, phone, 'device').records).toMatchObject({ streak: 3, bestStreak: 3 });
    });

    it('figurinhas do álbum juntam com OU nos dois sentidos', () => {
        const withEd = (editions: number) => ({ 25: { ...dex(25)[25], editions } });
        const local = save({ dex: withEd(EDITION_BIT.shiny) });
        const cloud = save({ dex: withEd(EDITION_BIT.normal | EDITION_BIT.icone) });
        const all = EDITION_BIT.shiny | EDITION_BIT.normal | EDITION_BIT.icone;
        expect(mergeSaves(local, cloud, 'cloud').dex[25].editions).toBe(all);
        expect(mergeSaves(local, cloud, 'device').dex[25].editions).toBe(all);
    });

    it('copa que não continua fica guardada', () => {
        const local = save({ run: cup('a', { played: 1 }) });
        const cloud = save({ run: cup('b', { played: 2 }) });
        const keepDevice = mergeSaves(local, cloud, 'device');
        expect(keepDevice.run?.seed).toBe('a');
        expect(keepDevice.parkedRuns.map((r) => r.seed)).toEqual(['b']);
        const keepCloud = mergeSaves(local, cloud, 'cloud');
        expect(keepCloud.run?.seed).toBe('b');
        expect(keepCloud.parkedRuns.map((r) => r.seed)).toEqual(['a']);
    });

    it('mesma copa nos dois lados: fica a versão mais adiantada, sem guardar duplicata', () => {
        const local = save({ run: cup('a', { played: 1 }) });
        const cloud = save({ run: cup('a', { played: 3 }) });
        const m = mergeSaves(local, cloud, 'device');
        expect(m.run?.results.length).toBe(3);
        expect(m.parkedRuns).toEqual([]);
        // a versão terminada (título) vence a parada no meio: não ressuscita
        const done = mergeSaves(
            save({ run: cup('a', { played: 3 }) }),
            save({ run: cup('a', { status: 'champion', played: 4 }) }),
            'device',
        );
        expect(done.run?.status).toBe('champion');
        expect(done.parkedRuns).toEqual([]);
    });

    it('lado sem copa em jogo: continua a copa do outro lado', () => {
        const local = save({ run: cup('a') });
        const cloud = save({ run: cup('z', { status: 'eliminated', played: 2 }) });
        expect(mergeSaves(local, cloud, 'cloud').run?.seed).toBe('a');
    });

    it('lado que não mudou desde a sincronização não traz copa de volta', () => {
        const local = save({ run: cup('velha') });
        const cloud = save({ run: null, records: { cups: 1, titles: 0, perfect: 0 } });
        const m = mergeSaves(local, cloud, 'cloud', 'device');
        expect(m.run).toBeNull();
        expect(m.parkedRuns).toEqual([]);
        // mas recordes e Pokédex do aparelho continuam juntando
        expect(mergeSaves(save({ dex: dex(9) }), cloud, 'cloud', 'device').dex[9]).toBeDefined();
    });

    it('copas já guardadas dos dois lados continuam guardadas (até o limite)', () => {
        const local = save({ run: cup('a'), parkedRuns: [cup('p1')] });
        const cloud = save({ run: cup('b'), parkedRuns: [cup('p2')] });
        const m = mergeSaves(local, cloud, 'device');
        expect(m.run?.seed).toBe('a');
        expect(m.parkedRuns.map((r) => r.seed)).toEqual(['b', 'p1', 'p2']);
    });

    it('perfil vale do lado escolhido; recusar estatísticas em qualquer lado vence', () => {
        const local = save({ profile: { ...DEFAULT_PROFILE, clubName: 'Pallet FC' } });
        const cloud = save({
            profile: { ...DEFAULT_PROFILE, clubName: 'Viridian' },
            settings: { ...DEFAULT_SETTINGS, stats: false },
        });
        expect(mergeSaves(local, cloud, 'device').profile.clubName).toBe('Pallet FC');
        expect(mergeSaves(local, cloud, 'cloud').profile.clubName).toBe('Viridian');
        expect(mergeSaves(local, cloud, 'device').settings.stats).toBe(false);
    });

    it('levar para a conta sem save na nuvem: o save do aparelho vai inteiro', () => {
        // save de verdade já passou pela migração (o título já liberou o Blue)
        const local = withUnlocks(
            save({ run: cup('a'), records: { cups: 2, titles: 1, perfect: 0 }, onboarded: true }),
        );
        expect(mergeSaves(local, undefined, 'device')).toEqual(local);
    });
});

describe('resumo para a pergunta', () => {
    it('mostra clube, copa em andamento, copas, títulos e Pokédex', () => {
        const s = save({
            run: cup('a', { teamName: 'Pallet FC', played: 2 }),
            profile: { ...DEFAULT_PROFILE, clubName: 'Pallet FC' },
            records: { cups: 3, titles: 1, perfect: 0 },
            dex: dex(1, 4, 7),
            parkedRuns: [cup('p')],
        });
        expect(summarize(s)).toEqual({
            club: 'Pallet FC',
            cup: { team: 'Pallet FC', status: 'lineup', stage: 2, draftRound: 7 },
            cups: 3,
            titles: 1,
            seen: 3,
            parked: 1,
        });
        expect(summarize(save({ run: cup('a', { status: 'champion' }) })).cup).toBeNull();
    });

    it('só ter visto o tutorial não é progresso', () => {
        expect(hasProgress(save({ onboarded: true }))).toBe(false);
        expect(hasProgress(save({ parkedRuns: [cup('p')] }))).toBe(true);
    });
});
