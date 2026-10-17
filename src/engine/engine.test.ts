import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeAttributes, eligiblePositions, positionFactor, positionRating } from './attributes';
import { FUTSAL_5, segmentTicks, withConfig } from './config';
import { HumanController } from './controllers/human-controller';
import { effectiveness, MOVES, SPECIES, species } from './data';
import { matchHash } from './determinism';
import { aiDraftTeam, DRAFT_ROUNDS, draftOptions, playerDraftOptions, SILVER } from './draft';
import { evolvedRating } from './evolution';
import { FORMATIONS } from './formations';
import { createInstance, slotRating, viewInstance } from './instance';
import { computeLinks } from './links';
import { applyPendingSubs, captainFactor, createMatch, step } from './match';
import { matchDigest, playerLines, possessionByPeriod, shotMap } from './match-stats';
import { applyModifiers, attributeModifiers } from './modifiers';
import { defaultMoveset, moveProfile } from './moves';
import { rewardOptions } from './rewards';
import { Rng } from './rng';
import { runMatch } from './runners/batch-runner';
import { LiveRunner } from './runners/live-runner';
import { SIGNATURE } from './signature-moves';
import { EVENT_TYPES, rollSpecial, SPECIAL_BONUS, weeklyEventType } from './specials';
import { type MatchOrder, SNAP_STRIDE, type Tactic, type TeamSetup } from './state';
import { computeSynergies } from './synergy';
import { dir8, v } from './vec';

function team(seed: string, name: string): TeamSetup {
    const rng = new Rng(seed, 'team');
    return { name, ...aiDraftTeam(rng, 0), tactic: 'balanced', color: 0 };
}

describe('dados', () => {
    it('tem os 151 com tipos, stats e golpes', () => {
        expect(SPECIES).toHaveLength(151);
        for (const sp of SPECIES) {
            expect(sp.types.length).toBeGreaterThan(0);
            expect(defaultMoveset(sp).length).toBeGreaterThanOrEqual(1);
        }
    });

    it('tem sprites de card, atlas de campo e gritos para todos', () => {
        for (const sp of SPECIES) {
            expect(existsSync(`public/assets/cards/${sp.id}.gif`)).toBe(true);
            expect(existsSync(`public/assets/field/${sp.id}.json`)).toBe(true);
            expect(existsSync(`public/assets/cries/legacy/${sp.id}.ogg`)).toBe(true);
            expect(existsSync(`public/assets/cries/latest/${sp.id}.ogg`)).toBe(true);
        }
    });

    it('tem retrato (rostinho) de todos para a faixa de gol/defesa', () => {
        for (const sp of SPECIES) expect(existsSync(`public/assets/portraits/${sp.id}.png`)).toBe(true);
    });

    it('tem os ícones oficiais de todos os tipos dos Pokémon', () => {
        for (const t of new Set(SPECIES.flatMap((sp) => sp.types))) {
            expect(existsSync(`public/assets/types/${t.toLowerCase()}.png`)).toBe(true);
        }
    });

    it('tabela de tipos bate com casos conhecidos', () => {
        expect(effectiveness('Fire', ['Grass'])).toBe(2);
        expect(effectiveness('Water', ['Fire', 'Rock'])).toBe(4);
        expect(effectiveness('Electric', ['Ground'])).toBe(0);
        expect(effectiveness('Normal', ['Ghost'])).toBe(0);
        expect(effectiveness('Grass', ['Fire', 'Flying'])).toBe(0.25);
    });

    it('movesets têm a cara da espécie', () => {
        expect(defaultMoveset(species(25))).toContain('thunderbolt');
        expect(defaultMoveset(species(25))).toContain('thunderwave');
        expect(defaultMoveset(species(129))).toContain('splash');
    });
});

describe('atributos', () => {
    it('ficam entre 1 e 99', () => {
        for (const sp of SPECIES) {
            for (const val of Object.values(computeAttributes(sp, 50))) {
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(99);
            }
        }
    });

    it('fazem sentido: Jolteon é mais rápido que Snorlax; Snorlax mais forte', () => {
        const jolteon = computeAttributes(species(135), 50);
        const snorlax = computeAttributes(species(143), 50);
        expect(jolteon.pace).toBeGreaterThan(snorlax.pace);
        expect(snorlax.strength).toBeGreaterThan(jolteon.strength);
    });

    it('nível maior dá atributos maiores (carreira)', () => {
        const low = computeAttributes(species(4), 20);
        const high = computeAttributes(species(4), 80);
        expect(high.shooting).toBeGreaterThan(low.shooting);
    });
});

describe('vetores', () => {
    it('dir8 segue a ordem das linhas PMD', () => {
        expect(dir8(v(0, 1))).toBe(0); // baixo
        expect(dir8(v(1, 0))).toBe(2); // direita
        expect(dir8(v(0, -1))).toBe(4); // cima
        expect(dir8(v(-1, 0))).toBe(6); // esquerda
        expect(dir8(v(1, 1))).toBe(1);
        expect(dir8(v(-1, 1))).toBe(7);
    });
});

describe('draft', () => {
    it('gera 3 opções distintas e não repete espécies já escolhidas', () => {
        const rng = new Rng('draft-test');
        const taken = new Set<number>();
        for (let round = 0; round < DRAFT_ROUNDS.length; round++) {
            const opts = draftOptions(rng, round, taken);
            expect(opts).toHaveLength(3);
            const ids = opts.map((o) => o.speciesId);
            expect(new Set(ids).size).toBe(3);
            for (const id of ids) expect(taken.has(id)).toBe(false);
            taken.add(ids[0]);
        }
    });

    it('é determinístico pela seed', () => {
        const a = draftOptions(new Rng('x'), 0, new Set()).map((o) => o.speciesId);
        const b = draftOptions(new Rng('x'), 0, new Set()).map((o) => o.speciesId);
        expect(a).toEqual(b);
    });

    it('draft do jogador: toda rodada tem pelo menos uma prata na vaga, sem repetir espécie', () => {
        for (const need of ['GK', 'FIXO', 'ALA', 'PIVO', 'ANY'] as const) {
            for (let i = 0; i < 150; i++) {
                const taken = new Set([25, 6]);
                const opts = playerDraftOptions(new Rng(`piso-${i}`, need), i % 7, taken, need);
                expect(opts).toHaveLength(3);
                expect(Math.max(...opts.map((o) => slotRating(o, need)))).toBeGreaterThanOrEqual(SILVER);
                expect(new Set(opts.map((o) => o.speciesId)).size).toBe(3);
                for (const o of opts) {
                    expect(taken.has(o.speciesId)).toBe(false);
                    if (need !== 'ANY') expect(viewInstance(o).positions).toContain(need);
                }
            }
        }
    });

    it('selo de evolução: nota da forma nova na mesma vaga; quem não evolui não tem selo', () => {
        const charmander = createInstance(4, new Rng('evo'));
        const evo = evolvedRating(charmander, 'ALA');
        expect(evo?.into).toBe(5);
        expect(evo?.rating).toBe(slotRating({ ...charmander, speciesId: 5 }, 'ALA'));
        expect(evolvedRating(createInstance(6, new Rng('evo')), 'ALA')).toBeNull();
        expect(evolvedRating(createInstance(132, new Rng('evo')), 'ALA')).toBeNull();
    });
});

describe('partida', () => {
    const home = team('h', 'Casa');
    const away = team('a', 'Fora');

    it('mesma seed → mesmo log de eventos', () => {
        const r1 = runMatch(FUTSAL_5, home, away, 42, { snapshots: false });
        const r2 = runMatch(FUTSAL_5, home, away, 42, { snapshots: false });
        expect(r1.events).toEqual(r2.events);
        expect(r1.score).toEqual(r2.score);
    });

    it('placar bate com os eventos de gol e sempre há vencedor no mata-mata', () => {
        for (const seed of [1, 2, 3]) {
            const r = runMatch(FUTSAL_5, home, away, seed, { snapshots: false });
            const goals = r.events.filter((e) => e.type === 'goal');
            expect(goals.filter((g) => g.type === 'goal' && g.team === 0)).toHaveLength(r.score[0]);
            expect(goals.filter((g) => g.type === 'goal' && g.team === 1)).toHaveLength(r.score[1]);
            expect(r.winner).not.toBeNull();
            expect(r.events.at(-1)?.type).toBe('end');
        }
    });

    it('snapshots cobrem a partida inteira', () => {
        const r = runMatch(FUTSAL_5, home, away, 7);
        expect(r.snapshots.length).toBeGreaterThan(1000);
        expect(r.snapshots[0].p).toHaveLength(10 * SNAP_STRIDE);
    });

    it('BatchRunner e LiveRunner produzem o mesmo resultado', () => {
        const batch = runMatch(FUTSAL_5, home, away, 99, { snapshots: false });
        const live = new LiveRunner(FUTSAL_5, home, away, 99);
        while (!live.finished) live.step();
        expect(live.state.events).toEqual(batch.events);
    });

    it('obedece um controller humano roteirizado (modo jogável futuro)', () => {
        const live = new LiveRunner(FUTSAL_5, home, away, 5);
        const s = live.state;
        const human = new HumanController();
        // o ala da casa (slot 2) corre para a direita sem parar
        live.setController(2, human);
        human.hold({ type: 'move', dir: v(1, 0), sprint: true });
        const startX = s.players[2].pos.x;
        for (let i = 0; i < 60; i++) live.step();
        expect(s.players[2].pos.x).toBeGreaterThan(startX + 8);

        // com a bola: chutar
        s.ball.owner = 2;
        s.players[2].kickCooldown = 0;
        human.press({ type: 'shoot', target: v(40, 10), power: 1 });
        live.step();
        expect(s.ball.owner).toBeNull();
        expect(s.events.some((e) => e.type === 'shot' && e.by === 2)).toBe(true);
    });

    it('instâncias têm golpes e habilidade válidos', () => {
        const rng = new Rng('inst');
        for (const sp of SPECIES) {
            const inst = createInstance(sp.id, rng);
            expect(sp.abilities).toContain(inst.ability);
            expect(inst.moves.every((m) => sp.learnset.includes(m))).toBe(true);
        }
    });
});

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

describe('v0.6: cartas especiais', () => {
    it('rollSpecial: determinístico, só Ícones da lista, chance perto de 1 em 80', () => {
        const rng = new Rng('esp');
        let icons = 0;
        const n = 40_000;
        for (let i = 0; i < n; i++) {
            const inst = createInstance(25, rng);
            const a = rollSpecial(inst, null);
            expect(rollSpecial(inst, null)).toEqual(a);
            if (a.special?.kind === 'icone') icons++;
        }
        expect(icons / n).toBeGreaterThan(0.009);
        expect(icons / n).toBeLessThan(0.016);
        for (let i = 0; i < 2000; i++) expect(rollSpecial(createInstance(16, rng), null).special).toBeFalsy();
    });

    it('evento: só cartas do tipo da semana', () => {
        const rng = new Rng('evt');
        let fire = 0;
        for (let i = 0; i < 3000; i++) {
            if (rollSpecial(createInstance(4, rng), 'Fire').special?.kind === 'evento') fire++;
            expect(rollSpecial(createInstance(7, rng), 'Fire').special?.kind).not.toBe('evento');
        }
        expect(fire).toBeGreaterThan(250);
    });

    it('edição dá +2 em tudo, sem acumular com shiny', () => {
        const base = createInstance(1, new Rng('b'));
        const plain = viewInstance({ ...base, shiny: false, special: null }).attributes;
        const both = viewInstance({ ...base, shiny: true, special: { kind: 'destaque' } }).attributes;
        expect(both.pace - plain.pace).toBe(SPECIAL_BONUS);
        expect(both.shooting - plain.shooting).toBe(SPECIAL_BONUS);
    });

    it('evento da semana gira entre tipos com Pokémon e é estável dentro da semana', () => {
        const seg = weeklyEventType(new Date(2026, 9, 12));
        expect(weeklyEventType(new Date(2026, 9, 18))).toBe(seg);
        expect(weeklyEventType(new Date(2026, 9, 19))).not.toBe(seg);
        const seen = new Set<string>();
        for (let w = 0; w < 60; w++) seen.add(weeklyEventType(new Date(2026, 0, 1 + w * 7)));
        expect([...seen].every((t) => EVENT_TYPES.includes(t))).toBe(true);
        expect(EVENT_TYPES).not.toContain('Dark');
    });
});

describe('defesa do goleiro', () => {
    it('nunca acontece com a bola já dentro do gol', () => {
        const { length } = FUTSAL_5.pitch;
        let saves = 0;
        for (let i = 0; i < 6; i++) {
            const r = runMatch(FUTSAL_5, team(`gk-a${i}`, 'A'), team(`gk-b${i}`, 'B'), `gk-${i}`);
            for (const e of r.events) {
                if (e.type !== 'save') continue;
                saves++;
                const snap = r.snapshots.find((sn) => sn.tick >= e.tick);
                if (snap) {
                    expect(snap.bx).toBeGreaterThanOrEqual(-0.01);
                    expect(snap.bx).toBeLessThanOrEqual(length + 0.01);
                }
            }
        }
        expect(saves).toBeGreaterThan(10);
    });
});

describe('disputa de pênaltis', () => {
    const SHORT = withConfig({ halfSeconds: 4 });
    it('para assim que um time não pode mais ser alcançado', () => {
        let shootouts = 0;
        for (let i = 0; i < 60 && shootouts < 30; i++) {
            // partida curtinha: quase sempre empata e vai para os pênaltis
            const r = runMatch(SHORT, team(`pk-a${i}`, 'A'), team(`pk-b${i}`, 'B'), `pk-${i}`, {
                snapshots: false,
            });
            const pens = r.events.filter((e) => e.type === 'penalty');
            if (!pens.length) continue;
            shootouts++;
            const taken = [0, 0];
            const score = [0, 0];
            const kicks = FUTSAL_5.penaltyKicks;
            for (const e of pens) {
                if (e.type !== 'penalty') continue;
                if (taken[0] < kicks || taken[1] < kicks) {
                    const rem = [kicks - taken[0], kicks - taken[1]].map((n) => Math.max(0, n));
                    const decided = score[0] > score[1] + rem[1] || score[1] > score[0] + rem[0];
                    expect(decided).toBe(false);
                }
                const t = r.roster[e.by].team;
                taken[t]++;
                if (e.scored) score[t]++;
            }
        }
        expect(shootouts).toBeGreaterThan(10);
    });
});

describe('substituição pedida pelo técnico', () => {
    const home = { ...team('sub-a', 'A'), manualSubs: true };
    const away = team('sub-b', 'B');

    it('time do jogador não troca sozinho; a ordem entra na próxima bola parada', () => {
        const base = runMatch(FUTSAL_5, home, away, 5, { snapshots: false });
        expect(base.events.some((e) => e.type === 'sub' && e.team === 0)).toBe(false);

        const T = 1500;
        const out = home.lineup[2];
        const inn = home.bench[0];
        const r = runMatch(FUTSAL_5, home, away, 5, {
            snapshots: false,
            orders: [{ tick: T, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const sub = r.events.find((e) => e.type === 'sub' && e.team === 0);
        expect(sub && sub.type === 'sub' && sub.tick >= T).toBe(true);
        if (sub?.type !== 'sub') return;
        expect(sub.outUid).toBe(out.uid);
        expect(sub.inSpeciesId).toBe(inn.speciesId);
        // só em bola parada: logo depois dela vem reinício, saída de bola ou intervalo
        const before = r.events.filter((e) => e.tick < T);
        expect(before).toEqual(base.events.filter((e) => e.tick < T));
        expect(r.finalRoster.some((p) => p.uid === inn.uid)).toBe(true);
    });

    it('troca pedida no intervalo entra no vestiário, antes da saída de bola do 2º tempo', () => {
        const base = runMatch(FUTSAL_5, home, away, 5, { snapshots: false });
        const ht = base.events.find((e) => e.type === 'halftime')?.tick ?? 0;
        const out = home.lineup[2];
        const inn = home.bench[0];
        const r = runMatch(FUTSAL_5, home, away, 5, {
            snapshots: false,
            orders: [{ tick: ht + 1, team: 0, kind: 'sub', outUid: out.uid, inUid: inn.uid }],
        });
        const sub = r.events.find((e) => e.type === 'sub' && e.team === 0);
        const ko = r.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? 0;
        expect(sub?.tick).toBe(ht + 1);
        expect(sub && sub.tick < ko).toBe(true);
    });
});

describe('evolução no meio da partida', () => {
    it('evolui no máximo uma vez por jogador, com a forma certa, e a forma nova termina a partida', () => {
        let evolutions = 0;
        for (let i = 0; i < 25; i++) {
            const rng = new Rng(`evo-t${i}`, 'x');
            const lineup = [74, 7, 4, 1, 25].map((id) => createInstance(id, rng));
            const home: TeamSetup = { name: 'A', lineup, bench: [], tactic: 'balanced', color: 0, formation: '1-2-1' };
            const r = runMatch(FUTSAL_5, home, team(`evo-b${i}`, 'B'), `evo-${i}`, { snapshots: false });
            const evos = r.events.filter((e) => e.type === 'evolve');
            const per = new Map<string, number>();
            for (const e of evos) {
                if (e.type !== 'evolve') continue;
                evolutions++;
                per.set(e.uid, (per.get(e.uid) ?? 0) + 1);
                expect(species(e.from).evolvesTo.map((x) => x.id)).toContain(e.into);
                // (se depois ele saiu numa substituição, a vaga é de outro no fim)
                const subbedLater = r.events.some((x) => x.type === 'sub' && x.outIdx === e.by && x.tick > e.tick);
                if (!subbedLater) expect(r.finalRoster[e.by].speciesId).toBe(e.into);
            }
            expect([...per.values()].every((n) => n === 1)).toBe(true);
        }
        expect(evolutions).toBeGreaterThan(0);
    }, 90_000);
});

describe('golpes', () => {
    it('golpe-assinatura de cada Pokémon é um golpe que ele aprende e abre o moveset', () => {
        const bad = Object.entries(SIGNATURE).filter(([id, m]) => !species(Number(id)).learnset.includes(m));
        expect(bad).toEqual([]);
        for (const [id, m] of Object.entries(SIGNATURE)) expect(defaultMoveset(species(Number(id)))[0]).toBe(m);
    });

    it('nenhum golpe fica sem efeito', () => {
        const flavor = Object.keys(MOVES).filter((m) => moveProfile(m).kind === 'flavor');
        expect(flavor).toEqual([]);
    });

    it('movesets variados: muitos golpes diferentes e no máximo 4 por Pokémon', () => {
        const used = new Set(SPECIES.flatMap((sp) => defaultMoveset(sp)));
        expect(used.size).toBeGreaterThan(100);
        for (const sp of SPECIES) expect(defaultMoveset(sp).length).toBeLessThanOrEqual(4);
    });
});

describe('bônus e penalidades (carta = campo)', () => {
    it('os atributos do jogador em campo são exatamente os da regra de modificadores', () => {
        const home = team('mods-a', 'A');
        const s = createMatch(FUTSAL_5, home, team('mods-b', 'B'), 'mods');
        const captain = home.lineup.find((p) => p.uid === home.captainUid) ?? null;
        for (const p of s.players.filter((pl) => pl.team === 0)) {
            const expected = applyModifiers(
                computeAttributes(species(p.inst.speciesId), p.inst.level),
                attributeModifiers(p.inst, { lineup: home.lineup, captain, role: p.role }),
                p.role,
            );
            if (p.inst.ability === 'imposter') continue;
            expect(p.attr).toEqual(expected);
        }
    });

    it('substituição recalcula o time: quem entra fecha a dupla de história e o parceiro ganha o bônus', () => {
        const rng = new Rng('troca-bonus', 'x');
        // Mew em campo; Mewtwo no banco (dupla Gênese só vale com os dois escalados)
        const lineup = [143, 68, 151, 142, 25].map((id) => createInstance(id, rng));
        const bench = [150, 4].map((id) => createInstance(id, rng));
        const home: TeamSetup = {
            name: 'A',
            lineup,
            bench,
            tactic: 'balanced',
            color: 0,
            formation: '1-2-1',
            captainUid: lineup[0].uid,
            manualSubs: true,
        };
        const s = createMatch(FUTSAL_5, home, team('troca-b', 'B'), 'troca');
        const mew = () => s.players.find((p) => p.inst.speciesId === 151)!;
        const before = { ...mew().attr };
        s.pendingSubs.push({ tick: 0, team: 0, kind: 'sub', outUid: lineup[4].uid, inUid: bench[0].uid });
        applyPendingSubs(s);
        expect(s.teams[0].lineup[4].uid).toBe(bench[0].uid);
        expect(mew().attr.passing).toBeGreaterThan(before.passing);
        // e todo o time bate com a regra dos modificadores aplicada à escalação de agora
        const now = s.teams[0].lineup;
        const captain = now.find((p) => p.uid === home.captainUid) ?? null;
        for (const p of s.players.filter((pl) => pl.team === 0)) {
            const expected = applyModifiers(
                computeAttributes(species(p.inst.speciesId), p.inst.level),
                attributeModifiers(p.inst, { lineup: now, captain, role: p.role }),
                p.role,
            );
            expect(p.attr).toEqual(expected);
        }
    });
});

describe('estatísticas da partida', () => {
    it('resumo da partida: um gol anotado por gol do placar, com autor e minuto', () => {
        const r = runMatch(FUTSAL_5, team('dg-a', 'A'), team('dg-b', 'B'), 'dg');
        const d = matchDigest(r);
        expect(d.goals.filter((g) => g.team === 0)).toHaveLength(r.score[0]);
        expect(d.goals.filter((g) => g.team === 1)).toHaveLength(r.score[1]);
        for (const g of d.goals) {
            expect(g.uid).toBeTruthy();
            expect(g.minute).toBeGreaterThanOrEqual(0);
            expect(g.minute).toBeLessThanOrEqual(40);
        }
        expect(d.half).not.toBeNull();
    });

    it('notas entre 3 e 10, todo mundo correu, cada chute tem desfecho e a posse por período soma 100%', () => {
        const r = runMatch(FUTSAL_5, team('st-a', 'A'), team('st-b', 'B'), 'st');
        const lines = playerLines(r);
        expect(lines.length).toBeGreaterThanOrEqual(10);
        for (const l of lines) {
            expect(l.rating).toBeGreaterThanOrEqual(3);
            expect(l.rating).toBeLessThanOrEqual(10);
            expect(l.distance).toBeGreaterThan(0);
        }
        const shots = shotMap(r, () => '');
        expect(shots.length).toBe(r.events.filter((e) => e.type === 'shot').length);
        expect(shots.filter((s) => s.outcome === 'gol').length).toBeLessThanOrEqual(r.score[0] + r.score[1]);
        for (const p of possessionByPeriod(r)) expect(p.home + p.away).toBeCloseTo(1, 5);
    });
});

describe('golpes especiais', () => {
    it('Counter devolve o golpe, Haze limpa status, Teleport move, Leech Seed suga e Dream Eater sai', () => {
        const rng = new Rng('esp-golpes', 'x');
        const mk = (id: number, moves: string[]) => ({ ...createInstance(id, rng), moves });
        const home: TeamSetup = {
            name: 'A',
            lineup: [
                mk(143, ['bodyslam']),
                mk(94, ['dreameater', 'hypnosis']),
                mk(1, ['leechseed']),
                mk(68, ['counter', 'haze']),
                mk(64, ['teleport', 'counter']),
            ],
            bench: [],
            tactic: 'balanced',
            color: 0,
        };
        let counters = 0;
        let hazes = 0;
        let teleports = 0;
        let seeds = 0;
        let dreams = 0;
        for (let i = 0; i < 12; i++) {
            const r = runMatch(FUTSAL_5, home, team(`esp-b${i}`, 'B'), `esp-${i}`, { snapshots: false });
            for (const e of r.events) {
                if (e.type === 'move' && e.moveId === 'counter' && e.hit) counters++;
                if (e.type === 'haze') hazes++;
                if (e.type === 'teleport') teleports++;
                if (e.type === 'status' && e.status === 'seed') seeds++;
            }
            dreams += r.events.filter((e) => e.type === 'move' && e.moveId === 'dreameater').length;
        }
        expect({ counters: counters > 0, hazes: hazes > 0, teleports: teleports > 0, seeds: seeds > 0 }).toEqual({
            counters: true,
            hazes: true,
            teleports: true,
            seeds: true,
        });
        // antes do Bloco 3 só saía com rival dormindo (0 usos em 6.639 jogos)
        expect(dreams).toBeGreaterThan(0);
    });
});

describe('seed por trecho (duelo ao vivo)', () => {
    const home = team('seg-a', 'A');
    const away = team('seg-b', 'B');
    const seeds = Array.from({ length: 21 }, (_, k) => `trecho-${k}`);
    const play = (segmentSeeds?: string[]) => runMatch(FUTSAL_5, home, away, 'seg', { segmentSeeds });

    it('mesmas seeds dão a mesma partida, e o trecho dura 2 minutos (360 ticks de jogo)', () => {
        expect(segmentTicks(FUTSAL_5)).toBe(360);
        const a = play(seeds);
        expect(matchHash(play([...seeds]))).toBe(matchHash(a));
        // sem seeds por trecho é a partida de sempre (um stream só)
        expect(matchHash(play())).not.toBe(matchHash(a));
    });

    it('mudar só a seed do trecho 3 não muda nada antes dele', () => {
        const a = play(seeds);
        const b = play(seeds.map((x, k) => (k === 3 ? 'outra' : x)));
        // o trecho 3 começa no minuto 6 do relógio (ele para nas bolas paradas)
        const start = a.snapshots.find((sn) => sn.minute >= 6)!.tick;
        expect(b.snapshots.find((sn) => sn.minute >= 6)!.tick).toBe(start);
        const earlier = (r: typeof a) => ({
            events: r.events.filter((e) => e.tick < start),
            snaps: r.snapshots.filter((sn) => sn.tick < start),
        });
        expect(earlier(b)).toEqual(earlier(a));
        expect(matchHash(b)).not.toBe(matchHash(a));
    });
});

describe('ordens do técnico validadas no motor (duelo)', () => {
    const home = { ...team('ord-a', 'A'), manualSubs: true };
    const away = team('ord-b', 'B');
    const tactics = (r: ReturnType<typeof runMatch>) => r.events.filter((e) => e.type === 'tactic');

    it('a ordem do array não importa: vale (tick, time, seq)', () => {
        const orders: MatchOrder[] = [
            { tick: 600, team: 1, tactic: 'counter', seq: 0 },
            { tick: 600, team: 0, tactic: 'offensive', seq: 0 },
            { tick: 600, team: 0, tactic: 'defensive', seq: 1 },
            { tick: 900, team: 0, kind: 'sub', outUid: home.lineup[2].uid, inUid: home.bench[0].uid, seq: 2 },
        ];
        const a = runMatch(FUTSAL_5, home, away, 'ord', { orders });
        const b = runMatch(FUTSAL_5, home, away, 'ord', { orders: [...orders].reverse() });
        expect(matchHash(b)).toBe(matchHash(a));
        // no mesmo tick: time 0 antes do 1, e seq 0 antes do 1 (a última do time 0 é Retranca)
        expect(tactics(a).map((e) => (e.type === 'tactic' ? `${e.team}:${e.tactic}` : ''))).toEqual([
            '0:offensive',
            '0:defensive',
            '1:counter',
        ]);
    });

    it('ordem com o tick já passado é ignorada', () => {
        const live = new LiveRunner(FUTSAL_5, home, away, 'ord');
        for (let i = 0; i < 500; i++) live.step();
        expect(live.addOrder({ tick: 450, team: 0, tactic: 'offensive' })).toBe(false);
        expect(live.addOrder({ tick: live.state.tick, team: 0, tactic: 'offensive' })).toBe(true);
        live.step();
        expect(live.state.teams[0].tactic).toBe('offensive');
        // ordem inválida também não entra (time ou tática que não existem)
        expect(live.addOrder({ tick: 900, team: 2 as 0, tactic: 'offensive' })).toBe(false);
        expect(live.addOrder({ tick: 900, team: 0, tactic: 'parking' as 'offensive' })).toBe(false);
    });

    it('a 4ª troca de tática é ignorada, e quem já entrou não entra de novo', () => {
        const seq: Tactic[] = ['offensive', 'defensive', 'counter', 'balanced'];
        const orders: MatchOrder[] = seq.map((tactic, i) => ({ tick: 300 + 300 * i, team: 0, tactic }));
        const [outA, outB] = [home.lineup[1].uid, home.lineup[2].uid];
        orders.push(
            { tick: 400, team: 0, kind: 'sub', outUid: outA, inUid: home.bench[0].uid },
            { tick: 2000, team: 0, kind: 'sub', outUid: outB, inUid: home.bench[0].uid },
        );
        const r = runMatch(FUTSAL_5, home, away, 'ord4', { orders });
        expect(tactics(r).map((e) => (e.type === 'tactic' ? e.tactic : ''))).toEqual(seq.slice(0, 3));
        expect(r.events.filter((e) => e.type === 'sub' && e.team === 0)).toHaveLength(1);
    });
});

describe('escanteio (0.8.5)', () => {
    const home = team('esc-a', 'A');
    const away = team('esc-b', 'B');
    /** Bola rolando pela linha de fundo do time 1 (x = comprimento), fora das traves, tocada por último por `by`. */
    const ballOut = (by: number) => {
        const s = createMatch(FUTSAL_5, home, away, 'esc');
        s.phase = 'play';
        s.ball = { ...s.ball, owner: null, pos: v(39.8, 3), vel: v(8, 0), lastTouch: by, shot: null };
        step(s, []);
        return s;
    };

    it('último toque da defesa pela linha de fundo vira escanteio; do ataque, tiro de meta', () => {
        const defender = ballOut(7); // time 1 defende o gol em x = 40
        expect(defender.events.at(-1)).toMatchObject({ type: 'corner', team: 0 });
        expect(defender.phase).toBe('corner');
        const attacker = ballOut(2);
        expect(attacker.events.at(-1)).toMatchObject({ type: 'goalkick', team: 1 });
    });

    it('o relógio não corre enquanto monta a cobrança, e a cobrança sai sozinha', () => {
        const s = ballOut(7);
        const time = s.time;
        let ticks = 0;
        while (s.phase === 'corner' && ticks < 200) {
            step(s, []);
            ticks++;
        }
        expect(ticks).toBeGreaterThan(10);
        expect(s.phase).toBe('play');
        expect(s.time).toBe(time);
        expect(s.ball.owner).toBeNull();
    });

    it('acontece nas partidas, com o cobrador escolhido e a instrução trocada por ordem', () => {
        let corners = 0;
        let aerials = 0;
        for (let i = 0; i < 6; i++) {
            const a = team(`esc-a${i}`, 'A');
            const taker = a.lineup[2];
            const r = runMatch(
                FUTSAL_5,
                { ...a, cornerTakerUid: taker.uid, corner: 'area' },
                team(`esc-b${i}`, 'B'),
                i,
                {
                    snapshots: false,
                    orders: [{ tick: 3000, team: 0, kind: 'corner', corner: 'short' }],
                },
            );
            const mine = r.events.filter((e) => e.type === 'corner' && e.team === 0);
            for (const e of mine) if (e.type === 'corner') expect(r.roster[e.by].uid).toBe(taker.uid);
            corners += r.events.filter((e) => e.type === 'corner').length;
            aerials += r.events.filter((e) => e.type === 'aerial').length;
            expect(r.events.filter((e) => e.type === 'cornerPlan')).toMatchObject([{ team: 0, plan: 'short' }]);
        }
        expect(corners).toBeGreaterThan(6);
        expect(aerials).toBeGreaterThan(2);
    });
});
