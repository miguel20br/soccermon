import { describe, expect, it } from 'vitest';
import { computeAttributes, eligiblePositions, positionFactor, positionRating } from './attributes';
import { FUTSAL_5 } from './config';
import { species } from './data';
import { aiDraftTeam, draftOptions } from './draft';
import { FORMATIONS } from './formations';
import { createInstance, viewInstance } from './instance';
import { computeLinks } from './links';
import { captainFactor, createMatch } from './match';
import { rewardOptions } from './rewards';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import type { TeamSetup } from './state';
import { computeSynergies } from './synergy';

function team(seed: string, name: string): TeamSetup {
    const rng = new Rng(seed, 'team');
    return { name, ...aiDraftTeam(rng, 0), tactic: 'balanced', color: 0 };
}

describe('iteração 3: posições, formações, capitão, itens, tática ao vivo', () => {
    const home = team('h3', 'Casa');
    const away = team('a3', 'Fora');

    it('Snorlax é goleiro de posição principal', () => {
        const pos = eligiblePositions(computeAttributes(species(143), 50), 143);
        expect(pos[0]).toBe('GK');
    });

    it('positionFactor: principal 1, secundária 0.98, fora penaliza', () => {
        expect(positionFactor(['FIXO', 'GK'], 'FIXO')).toBe(1);
        expect(positionFactor(['FIXO', 'GK'], 'GK')).toBe(0.98);
        expect(positionFactor(['FIXO', 'GK'], 'ALA')).toBe(0.93);
        expect(positionFactor(['ALA'], 'GK')).toBe(0.75);
        // secundária nunca passa da principal (Dragonite: Pivô principal, Goleiro com nota crua maior)
        const dragonite = computeAttributes(species(149), 50);
        const pos = eligiblePositions(dragonite, 149);
        expect(pos[0]).toBe('PIVO');
        const main = positionRating(dragonite, 'PIVO');
        expect(Math.round(positionRating(dragonite, 'GK') * positionFactor(pos, 'GK', dragonite))).toBeLessThanOrEqual(
            main,
        );
    });

    it('opções do draft para uma posição sempre jogam nela', () => {
        const rng = new Rng('elig');
        for (const need of ['GK', 'FIXO', 'ALA', 'PIVO'] as const) {
            for (let i = 0; i < 10; i++) {
                for (const o of draftOptions(rng, i % 7, new Set(), 3, [], need)) {
                    expect(viewInstance(o).positions).toContain(need);
                }
            }
        }
    });

    it('formações têm 5 vagas, pivô no slot 4 (ou nenhum, no Rodízio) e coordenadas dentro da quadra', () => {
        for (const f of Object.values(FORMATIONS)) {
            expect(f.slots).toHaveLength(5);
            expect(f.slots[0]).toBe('GK');
            // quem dá a saída é o primeiro pivô; sem pivô (Rodízio), a vaga 4
            if (f.slots.includes('PIVO')) expect(f.slots[4]).toBe('PIVO');
            else expect(f.slots[4]).not.toBe('GK');
            for (const [x, y] of [...f.attack, ...f.defend, ...f.kickoff]) {
                expect(x).toBeGreaterThanOrEqual(0);
                expect(x).toBeLessThanOrEqual(40);
                expect(y).toBeGreaterThanOrEqual(0);
                expect(y).toBeLessThanOrEqual(20);
            }
            const r = runMatch(FUTSAL_5, { ...home, formation: f.id }, away, 3, { snapshots: false });
            expect(r.winner).not.toBeNull();
        }
    });

    it('capitão dá +6% a quem divide tipo e +3% ao resto', () => {
        const cap = createInstance(25, new Rng('cap')); // Pikachu (Elétrico)
        expect(captainFactor(cap, ['Electric'])).toBe(1.06);
        expect(captainFactor(cap, ['Water'])).toBe(1.03);
        expect(captainFactor(null, ['Water'])).toBe(1);
        const s = createMatch(FUTSAL_5, { ...home, captainUid: home.lineup[2].uid }, away, 1);
        expect(s.players[2].captain).toBe(true);
    });

    it('Choice Band trava os outros golpes; Focus Sash e Lum Berry disparam no máximo uma vez', () => {
        const withItems = (t: TeamSetup, item: string): TeamSetup => ({
            ...t,
            lineup: t.lineup.map((p) => ({ ...p, item })),
        });
        const s = createMatch(FUTSAL_5, withItems(home, 'choiceband'), away, 1);
        for (const p of s.players.filter((pl) => pl.team === 0)) {
            expect(p.moveUses.slice(1).every((u) => u === 0)).toBe(true);
        }
        let saves = 0;
        let cures = 0;
        for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
            const r = runMatch(FUTSAL_5, home, withItems(away, seed % 2 ? 'focussash' : 'lumberry'), seed, {
                snapshots: false,
            });
            const items = r.events.filter((e) => e.type === 'item');
            const perPlayer = new Map<number, number>();
            for (const e of items) if (e.type === 'item') perPlayer.set(e.by, (perPlayer.get(e.by) ?? 0) + 1);
            expect([...perPlayer.values()].every((n) => n === 1)).toBe(true);
            saves += items.filter((e) => e.type === 'item' && e.effect === 'save').length;
            cures += items.filter((e) => e.type === 'item' && e.effect === 'cure').length;
        }
        expect(saves).toBeGreaterThan(0);
        expect(cures).toBeGreaterThan(0);
    });

    it('mudança de tática no tick T mantém tudo igual antes de T', () => {
        const base = runMatch(FUTSAL_5, home, away, 77, { snapshots: false });
        const T = 2000;
        const changed = runMatch(FUTSAL_5, home, away, 77, {
            snapshots: false,
            orders: [{ tick: T, team: 0, tactic: 'defensive' }],
        });
        const prefix = (r: typeof base) => r.events.filter((e) => e.tick < T);
        expect(prefix(changed)).toEqual(prefix(base));
        expect(changed.events.some((e) => e.type === 'tactic' && e.tick === T && e.team === 0)).toBe(true);
    });

    it('estatísticas de quem saiu no intervalo entram no resultado (gols batem com o placar)', () => {
        // intervalo sem recuperação de fôlego: garante substituições, qualquer que seja o elenco sorteado
        const tired: TeamSetup = { ...home, tactic: 'offensive' };
        const cfg = { ...FUTSAL_5, halftimeRecovery: -0.3 };
        let checked = 0;
        for (let seed = 1; seed <= 60 && checked < 2; seed++) {
            const r = runMatch(cfg, tired, { ...away, tactic: 'offensive' }, seed, { snapshots: false });
            const everyone = [...r.finalRoster, ...r.subbedOut];
            for (const team of [0, 1] as const) {
                const ownGoals = r.events.filter((e) => e.type === 'goal' && e.team === team && e.ownGoal).length;
                const scored = everyone.filter((p) => p.team === team).reduce((s, p) => s + p.stats.goals, 0);
                expect(scored + ownGoals).toBe(r.score[team]);
            }
            checked += r.subbedOut.length;
        }
        expect(checked).toBeGreaterThan(0);
    }, 30_000);

    it('quem conduz a bola nunca sai da quadra', () => {
        const live = new LiveRunner(FUTSAL_5, home, away, 21);
        while (!live.finished) {
            live.step();
            const s = live.state;
            if (s.ball.owner !== null && s.phase === 'play') {
                const x = s.players[s.ball.owner].pos.x;
                expect(x).toBeGreaterThanOrEqual(0.39);
                expect(x).toBeLessThanOrEqual(40 - 0.39);
            }
        }
    });

    it('recompensas são determinísticas pela seed e trazem 1 reforço + 2 itens (ou 1 item e 1 MT)', () => {
        const a = rewardOptions('seed', 0, 0, home.lineup);
        const b = rewardOptions('seed', 0, 0, home.lineup);
        expect(a).toEqual(b);
        expect(a).toHaveLength(3);
        expect(a.filter((r) => r.kind === 'pokemon')).toHaveLength(1);
        expect(a.filter((r) => r.kind === 'item' || r.kind === 'tm')).toHaveLength(2);
        expect(a.filter((r) => r.kind === 'tm').length).toBeLessThanOrEqual(1);
        expect(rewardOptions('seed', 0, 1, home.lineup)).not.toEqual(a);
        // contratar do adversário: o Pokémon vem do time derrotado, sem item e com uid novo
        const defeated = { name: 'Fora', players: away.lineup };
        const c = rewardOptions('seed', 0, 0, home.lineup, defeated);
        const signed = c.find((r) => r.kind === 'pokemon');
        expect(signed && signed.kind === 'pokemon' && signed.from).toBe('Fora');
        if (signed?.kind === 'pokemon') {
            expect(away.lineup.some((p) => p.speciesId === signed.inst.speciesId)).toBe(true);
            expect(away.lineup.some((p) => p.uid === signed.inst.uid)).toBe(false);
            expect(signed.inst.item).toBeNull();
        }
    });
});

describe('v0.5: físico, sinergias de história e Ditto', () => {
    const rng = new Rng('v05');
    const lineupOf = (ids: number[]) => ids.map((id) => createInstance(id, rng));
    const setup = (ids: number[], name: string): TeamSetup => ({
        name,
        lineup: lineupOf(ids),
        bench: [],
        formation: '1-2-1',
        tactic: 'balanced',
        color: 0,
    });

    it('físico: Snorlax, Machamp e Muk são goleiros; Magikarp não', () => {
        for (const id of [143, 68, 89]) expect(eligiblePositions(computeAttributes(species(id), 50), id)[0]).toBe('GK');
        expect(eligiblePositions(computeAttributes(species(129), 50), 129)).not.toContain('GK');
    });

    it('Ditto pode jogar em qualquer posição e vem com Imposter', () => {
        const pos = eligiblePositions(computeAttributes(species(132), 50), 132);
        expect([...pos].sort()).toEqual(['ALA', 'FIXO', 'GK', 'PIVO']);
        expect(createInstance(132, rng).ability).toBe('imposter');
    });

    it('sinergias de história: Mew + Mewtwo ativam Gênese; evoluções contam na família', () => {
        const ids = (l: ReturnType<typeof computeLinks>) => l.map((x) => x.def.id);
        expect(ids(computeLinks(lineupOf([150, 151, 1, 4, 7])))).toEqual(
            expect.arrayContaining(['genese', 'iniciais']),
        );
        expect(ids(computeLinks(lineupOf([3, 6, 9, 19, 20])))).toContain('iniciais');
        expect(ids(computeLinks(lineupOf([150, 19, 20, 21, 22])))).not.toContain('genese');
    });

    it('sinergias em degraus: tipo sobe até +10% e os 3 pássaros dão +10% com aura', () => {
        const bonusOf = (ids: number[], type: string) =>
            computeSynergies(lineupOf(ids)).find((x) => x.type === type)?.bonus;
        expect(bonusOf([7, 54, 60, 19, 20], 'Water')).toBe(1.06);
        expect(bonusOf([7, 54, 60, 72, 20], 'Water')).toBe(1.08);
        expect(bonusOf([7, 54, 60, 72, 79], 'Water')).toBe(1.1);
        const birds = (ids: number[]) => computeLinks(lineupOf(ids)).find((l) => l.def.id === 'passaros');
        expect(birds([144, 145, 19, 20, 21])).toMatchObject({ bonus: 1.06, full: false });
        expect(birds([144, 145, 146, 20, 21])).toMatchObject({ bonus: 1.1, full: true });
    });

    it('Ditto vira o melhor da posição em campo (de qualquer time) e continua Ditto no elenco', () => {
        // Ditto no gol (slot 0) contra um time com Snorlax no gol
        const home = setup([132, 19, 20, 21, 22], 'Casa');
        const away = setup([143, 16, 17, 10, 11], 'Fora');
        const s = createMatch(FUTSAL_5, home, away, 1);
        const ditto = s.players[0];
        expect(ditto.role).toBe('GK');
        expect(ditto.inst.speciesId).toBe(143);
        expect(ditto.origin?.speciesId).toBe(132);
        expect(ditto.name).toBe('Ditto');
        expect(s.events.find((e) => e.type === 'transform')).toMatchObject({ by: 0, into: 143 });
        const r = runMatch(FUTSAL_5, home, away, 1, { snapshots: false });
        expect(r.roster[0].speciesId).toBe(132);
    });

    it('combo de sinergia acontece no máximo 1 vez por tempo por sinergia', () => {
        const home = setup([143, 150, 151, 144, 145], 'Lendas');
        const away = setup([19, 20, 21, 22, 16], 'Fora');
        let combos = 0;
        for (let seed = 1; seed <= 6; seed++) {
            const r = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
            const list = r.events.filter((e) => e.type === 'combo');
            for (const half of [1, 2]) {
                const ids = list
                    .filter((e) => e.half === half && e.type === 'combo')
                    .map((e) => e.type === 'combo' && e.link);
                expect(new Set(ids).size).toBe(ids.length);
            }
            combos += list.length;
        }
        expect(combos).toBeGreaterThan(0);
    }, 60_000);
});
