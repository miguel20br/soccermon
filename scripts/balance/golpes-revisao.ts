// Revisão dos golpes (docs/planos/golpes-revisao.md). Não muda nada do jogo: só lê e simula.
//   npx tsx scripts/balance/golpes-revisao.ts inventario   tabela de todos os golpes (kind, traços, quem usa)
//   npx tsx scripts/balance/golpes-revisao.ts iguais       golpes com o mesmo comportamento no motor
//   npx tsx scripts/balance/golpes-revisao.ts especies     os 151 com o moveset padrão e os casos ruins
//   npx tsx scripts/balance/golpes-revisao.ts unicos [proto]   grupos de movesets iguais (proto: com a regra da unicidade)
//   npx tsx scripts/balance/golpes-revisao.ts calib [N] [movesets.json]   o calibrate (mesmas seeds) + uso por golpe
//   npx tsx scripts/balance/golpes-revisao.ts troca [M] movesets.json     partidas pareadas só com as espécies que mudam
// movesets.json = { "<id>": ["golpe", ...] }: troca os golpes padrão dessas espécies só na simulação.

import { readFileSync } from 'node:fs';
import { MOVES, SPECIES } from '../../src/engine/data';
import { aiDraftTeam } from '../../src/engine/draft';
import {
    DRAIN,
    DRAWBACK,
    defaultMoveset,
    MOVE_EXPLAIN,
    MOVE_TRAITS,
    moveProfile,
    OHKO,
    TRAP,
    uniqueMovesets,
} from '../../src/engine/moves';
import { SIGNATURE } from '../../src/engine/signature-moves';
import { FUTSAL_5, Rng, runMatch, viewInstance } from './lib';

const mode = process.argv[2] ?? 'inventario';
const isDmg = (m: string) => ['strike', 'blast'].includes(moveProfile(m).kind);

// quem leva cada golpe no moveset padrão
const users = new Map<string, string[]>();
const sets = new Map<number, string[]>();
for (const sp of SPECIES) {
    const ms = defaultMoveset(sp);
    sets.set(sp.id, ms);
    for (const m of ms) users.set(m, [...(users.get(m) ?? []), sp.name]);
}
const learners = (m: string) => SPECIES.filter((sp) => sp.learnset.includes(m)).length;

/** O que o motor de fato usa do golpe (fora força, precisão e tipo). */
function behavior(m: string): string {
    const p = moveProfile(m);
    const d = p.data;
    const sec = d.secondary;
    const parts = [p.kind];
    if (MOVE_TRAITS[m]) parts.push(MOVE_TRAITS[m].join('+'));
    if (DRAWBACK[m]) parts.push(DRAWBACK[m]);
    if (DRAIN[m]) parts.push('drain');
    if (TRAP.has(m)) parts.push('trap');
    if (OHKO.has(m)) parts.push('ohko');
    if (p.status) parts.push(`status:${p.status}`);
    if (sec?.status) parts.push(`sec:${sec.status}`);
    if (sec?.volatile) parts.push(`sec:${sec.volatile}`);
    if (sec?.boosts) parts.push(`sec:${Object.keys(sec.boosts).join('/')}`);
    if (p.kind === 'buff' && d.selfBoosts) parts.push(`+${Object.keys(d.selfBoosts).join('/')}`);
    if (p.kind === 'debuff' && d.targetBoosts) parts.push(`-${Object.keys(d.targetBoosts).join('/')}`);
    if (p.kind === 'special') parts.push(m);
    return parts.join(' ');
}

const all = Object.keys(MOVES).sort();

if (mode === 'inventario') {
    const byBeh = new Map<string, string[]>();
    for (const m of all) byBeh.set(behavior(m), [...(byBeh.get(behavior(m)) ?? []), m]);
    console.log('golpe|tipo|cat|poder|prec|kind|força|usos|comportamento|padrão|aprendem|texto próprio');
    for (const m of all) {
        const p = moveProfile(m);
        console.log(
            [
                m,
                p.data.type,
                p.data.category,
                p.data.power,
                p.data.accuracy,
                p.kind,
                p.strength.toFixed(2),
                p.uses,
                behavior(m),
                users.get(m)?.length ?? 0,
                learners(m),
                MOVE_EXPLAIN[m] ? 'sim' : 'não',
            ].join('|'),
        );
    }
    console.log(`\n${all.length} golpes, ${users.size} em algum moveset padrão, ${byBeh.size} comportamentos`);
    const kinds = new Map<string, number>();
    for (const m of all) kinds.set(moveProfile(m).kind, (kinds.get(moveProfile(m).kind) ?? 0) + 1);
    console.log('por kind:', [...kinds].map(([k, n]) => `${k}=${n}`).join(' '));
    const noText = all.filter((m) => !MOVE_EXPLAIN[m]);
    console.log(`sem texto próprio (${noText.length}):`, noText.join(' '));
}

if (mode === 'iguais') {
    const byBeh = new Map<string, string[]>();
    for (const m of all) byBeh.set(behavior(m), [...(byBeh.get(behavior(m)) ?? []), m]);
    for (const [b, ms] of [...byBeh].sort((a, b) => b[1].length - a[1].length)) {
        if (ms.length < 2) continue;
        const desc = ms
            .map((m) => {
                const p = moveProfile(m);
                return `${m}(${p.data.type} ${p.strength.toFixed(2)}${p.data.accuracy < 100 ? ` ${p.data.accuracy}%` : ''} u${users.get(m)?.length ?? 0})`;
            })
            .join(', ');
        console.log(`[${ms.length}] ${b}: ${desc}`);
    }
    // mesmo tipo + mesmo comportamento + força parecida (±0,1): clones de verdade
    console.log('\n== clones (mesmo tipo, mesmo comportamento, força ±0,10) ==');
    for (const [b, ms] of byBeh) {
        const byType = new Map<string, string[]>();
        for (const m of ms) byType.set(MOVES[m].type, [...(byType.get(MOVES[m].type) ?? []), m]);
        for (const [t, xs] of byType) {
            if (xs.length < 2) continue;
            xs.sort((a, c) => moveProfile(a).strength - moveProfile(c).strength);
            for (let i = 0; i < xs.length; i++)
                for (let j = i + 1; j < xs.length; j++) {
                    const d = Math.abs(moveProfile(xs[i]).strength - moveProfile(xs[j]).strength);
                    if (d <= 0.1)
                        console.log(
                            `${t} · ${b}: ${xs[i]} ${moveProfile(xs[i]).strength.toFixed(2)} (u${users.get(xs[i])?.length ?? 0}) ≈ ${xs[j]} ${moveProfile(xs[j]).strength.toFixed(2)} (u${users.get(xs[j])?.length ?? 0})`,
                        );
                }
        }
    }
}

if (mode === 'especies') {
    const flags = new Map<string, string[]>();
    const flag = (k: string, s: string) => flags.set(k, [...(flags.get(k) ?? []), s]);
    for (const sp of SPECIES) {
        const ms = sets.get(sp.id)!;
        const types = ms.map((m) => MOVES[m].type);
        const kinds = ms.map((m) => moveProfile(m).kind);
        const tag = `${sp.id} ${sp.name}`;
        const line = `${tag} [${sp.types.join('/')}]: ${ms.map((m) => `${m}${isDmg(m) ? '' : '*'}(${MOVES[m].type[0]}${MOVES[m].type[1]})`).join(', ')}`;
        console.log(line);
        if (sp.id === 129 || sp.id === 132) continue;
        if (!ms.some(isDmg)) flag('sem golpe de dano', tag);
        if (ms.filter(isDmg).length === 1) flag('só 1 golpe de dano', tag);
        if (ms.every(isDmg)) flag('4 de dano, nenhum utilitário', tag);
        for (const t of sp.types) {
            if (!types.includes(t)) {
                const can = sp.learnset.some((m) => MOVES[m].type === t);
                flag(
                    can ? 'falta tipo próprio (learnset tem)' : 'falta tipo próprio (learnset não tem)',
                    `${tag} (${t})`,
                );
            }
        }
        const foreign = new Map<string, number>();
        for (const t of types) if (!sp.types.includes(t as never)) foreign.set(t, (foreign.get(t) ?? 0) + 1);
        for (const [t, n] of foreign)
            if (n >= 2 && t !== 'Normal') flag('2+ do mesmo tipo de fora', `${tag} (${t}×${n})`);
        const beh = ms.map(behavior);
        const dupBeh = beh.filter((b, i) => beh.indexOf(b) !== i && !b.startsWith('special'));
        if (dupBeh.length) flag('2 golpes com o mesmo comportamento', `${tag} (${dupBeh.join('; ')})`);
        if (kinds.filter((k) => k === 'status').length >= 2) flag('2+ golpes de status', tag);
        const dmgTypes = ms.filter(isDmg).map((m) => MOVES[m].type);
        if (dmgTypes.length >= 2 && new Set(dmgTypes).size === 1) flag('dano todo de um tipo só', tag);
        const tmCover = ms.filter(
            (m) =>
                ['blizzard', 'fireblast', 'thunder', 'earthquake', 'hydropump', 'icebeam', 'thunderbolt'].includes(m) &&
                !sp.types.includes(MOVES[m].type as never),
        );
        if (tmCover.length >= 2) flag('2+ MTs de cobertura sem STAB', `${tag} (${tmCover.join(', ')})`);
        const sig = SIGNATURE[sp.id];
        if (sig && !ms.includes(sig)) flag('assinatura fora do moveset', `${tag} (${sig})`);
        if (ms.length < 4) flag('menos de 4 golpes', `${tag} (${ms.length})`);
    }
    console.log('');
    for (const [k, xs] of flags) console.log(`## ${k} (${xs.length})\n${xs.join('\n')}\n`);
}

// ---- protótipos: um JSON { "<id>": ["golpe", ...] } troca o moveset das espécies listadas, sem mexer no jogo
function loadSets(path?: string): Map<number, string[]> {
    const next = new Map(sets);
    if (path)
        for (const [id, ms] of Object.entries(JSON.parse(readFileSync(path, 'utf8'))))
            next.set(Number(id), ms as string[]);
    return next;
}
const changed = (next: Map<number, string[]>) =>
    SPECIES.filter((sp) => next.get(sp.id)!.join() !== sets.get(sp.id)!.join());

if (mode === 'calib') {
    const N = Number(process.argv[3]) || 400;
    const next = loadSets(process.argv[4]);
    const remap = (inst: any) => ({ ...inst, moves: next.get(inst.speciesId)! });
    const rng = new Rng('calibrate');
    const TACTICS = ['balanced', 'offensive', 'defensive', 'counter'] as const;
    const strength = (t: any) =>
        t.lineup.reduce((s: number, i: any) => s + viewInstance(i).overall, 0) / t.lineup.length;
    let goals = 0;
    let draws = 0;
    let blow = 0;
    let dec = 0;
    let sw = 0;
    const kinds = new Map<string, number>();
    const traits = new Map<string, number>();
    const typeRec = new Map<string, { w: number; g: number }>();
    const stat = new Map<string, { carry: number; uses: number; hit: number; ball: number; goals: number }>();
    const get = (m: string) => {
        let x = stat.get(m);
        if (!x) stat.set(m, (x = { carry: 0, uses: 0, hit: 0, ball: 0, goals: 0 }));
        return x;
    };
    for (let i = 0; i < N; i++) {
        const mk = (name: string) => {
            const d = aiDraftTeam(rng, rng.int(0, 1));
            return {
                name,
                lineup: d.lineup.map(remap),
                bench: d.bench.map(remap),
                captainUid: d.captainUid,
                tactic: rng.pick([...TACTICS]),
                color: 0,
            };
        };
        const home = mk('A');
        const away = mk('B');
        for (const t of [home, away]) for (const inst of t.lineup) for (const m of inst.moves) get(m).carry++;
        const r = runMatch(FUTSAL_5, home as any, away as any, i, { snapshots: false });
        goals += r.score[0] + r.score[1];
        if (r.score[0] === r.score[1]) draws++;
        if (Math.abs(r.score[0] - r.score[1]) >= 6) blow++;
        let lastShot: { by: number; moveId: string | null } | null = null;
        for (const e of r.events) {
            if (e.type === 'move') {
                kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
                const x = get(e.moveId);
                x.uses++;
                if (e.hit) x.hit++;
                if (e.withBall) x.ball++;
            } else if (e.type === 'trait') traits.set(e.fx, (traits.get(e.fx) ?? 0) + 1);
            else if (e.type === 'shot') lastShot = { by: e.by, moveId: e.moveId };
            else if (e.type === 'goal' && !e.ownGoal && lastShot?.moveId && lastShot.by === e.by)
                get(lastShot.moveId).goals++;
        }
        const sh = strength(home);
        const sa = strength(away);
        if (Math.abs(sh - sa) >= 3 && r.winner !== null) {
            dec++;
            if ((sh > sa ? 0 : 1) === r.winner) sw++;
        }
        [home, away].forEach((team, ti) => {
            for (const t of new Set(team.lineup.flatMap((inst: any) => SPECIES[inst.speciesId - 1].types))) {
                const rec = typeRec.get(t) ?? { w: 0, g: 0 };
                rec.g++;
                if (r.winner === ti) rec.w++;
                typeRec.set(t, rec);
            }
        });
    }
    const per = (n: number) => (n / N).toFixed(2);
    console.log(`movesets: ${process.argv[4] ?? 'os do jogo'} · ${N} partidas`);
    console.log(`gols/jogo: ${(goals / N).toFixed(2)}`);
    console.log(`empates: ${((draws / N) * 100).toFixed(1)}%  goleadas: ${((blow / N) * 100).toFixed(1)}%`);
    console.log(`mais forte (Δ≥3) vence: ${((sw / Math.max(1, dec)) * 100).toFixed(1)}% de ${dec}`);
    console.log(
        'golpes/jogo por tipo:',
        [...kinds].map(([k, c]) => `${k}=${per(c)}`).join(' '),
        `total=${per([...kinds.values()].reduce((a, b) => a + b, 0))}`,
    );
    console.log(
        'traços/jogo:',
        [...traits]
            .sort((a, b) => b[1] - a[1])
            .map(([k, c]) => `${k}=${per(c)}`)
            .join(' '),
    );
    console.log(
        'vitórias por tipo:',
        [...typeRec]
            .sort((a, b) => b[1].w / b[1].g - a[1].w / a[1].g)
            .map(([t, x]) => `${t}=${Math.round((x.w / x.g) * 100)}%`)
            .join(' '),
    );
    console.log('\ngolpe|kind|em quadra|usos/jogo|usos por portador|acerto|com bola|gols');
    for (const [m, x] of [...stat].sort((a, b) => b[1].carry - a[1].carry))
        console.log(
            [
                m,
                moveProfile(m).kind,
                x.carry,
                (x.uses / N).toFixed(3),
                (x.uses / Math.max(1, x.carry)).toFixed(2),
                x.uses ? `${Math.round((x.hit / x.uses) * 100)}%` : '-',
                x.uses ? `${Math.round((x.ball / x.uses) * 100)}%` : '-',
                x.goals,
            ].join('|'),
        );
}

if (mode === 'troca') {
    // cada partida 2 vezes, mesma seed e mesmos times: com o moveset de hoje e com o novo, só na espécie que muda
    const M = Number(process.argv[3]) || 60;
    const next = loadSets(process.argv[4]);
    const ch = changed(next);
    const tot = { a: { w: 0, d: 0, gd: 0 }, b: { w: 0, d: 0, gd: 0 } };
    console.log('espécie|vitórias hoje|vitórias novo|saldo hoje|saldo novo');
    for (const sp of ch) {
        const res = { a: { w: 0, d: 0, gd: 0 }, b: { w: 0, d: 0, gd: 0 } };
        for (let i = 0; i < M; i++) {
            for (const arm of ['a', 'b'] as const) {
                const rng = new Rng(`troca-${sp.id}-${i}`);
                const h = aiDraftTeam(rng, 1);
                const aw = aiDraftTeam(rng, 1);
                const slot = 1 + (i % (h.lineup.length - 1));
                const inst = {
                    ...h.lineup[slot],
                    speciesId: sp.id,
                    uid: `t-${sp.id}`,
                    moves: arm === 'a' ? sets.get(sp.id)! : next.get(sp.id)!,
                };
                if (h.captainUid === h.lineup[slot].uid) h.captainUid = inst.uid;
                h.lineup[slot] = inst;
                const r = runMatch(
                    FUTSAL_5,
                    { name: 'A', ...h, tactic: 'balanced', color: 0 } as any,
                    { name: 'B', ...aw, tactic: 'balanced', color: 0 } as any,
                    `troca-${sp.id}-${i}`,
                    { snapshots: false },
                );
                for (const x of [res[arm], tot[arm]]) {
                    if (r.winner === 0) x.w++;
                    x.gd += r.score[0] - r.score[1];
                }
            }
        }
        console.log(
            `${sp.name}|${Math.round((res.a.w / M) * 100)}%|${Math.round((res.b.w / M) * 100)}%|${(res.a.gd / M).toFixed(2)}|${(res.b.gd / M).toFixed(2)}`,
        );
    }
    const n = ch.length * M;
    console.log(
        `TOTAL (${n} pares)|${((tot.a.w / n) * 100).toFixed(1)}%|${((tot.b.w / n) * 100).toFixed(1)}%|${(tot.a.gd / n).toFixed(2)}|${(tot.b.gd / n).toFixed(2)}`,
    );
}

if (mode === 'unicos') {
    // grupos de movesets padrão iguais (mesmos 4 golpes, em qualquer ordem) e quase iguais (3 de 4), separando a
    // mesma linha evolutiva de espécies sem relação
    const root = (id: number): number => {
        const p = SPECIES[id - 1].prevo;
        return p && p <= 151 ? root(p) : id;
    };
    // `unicos proto`: com o protótipo da unicidade (UNIQUE_MOVESETS, desligado no jogo)
    const S = process.argv[3] === 'proto' ? uniqueMovesets() : sets;
    const mons = SPECIES.filter((sp) => sp.id <= 151 && sp.id !== 129 && sp.id !== 132);
    const key = (id: number) => [...S.get(id)!].sort().join(',');
    const groups = new Map<string, number[]>();
    for (const sp of mons) groups.set(key(sp.id), [...(groups.get(key(sp.id)) ?? []), sp.id]);
    const name = (id: number) => `${id} ${SPECIES[id - 1].name}`;
    const line = (ids: number[]) => new Set(ids.map(root)).size === 1;
    console.log('## Iguais (4 de 4)');
    for (const [k, ids] of groups)
        if (ids.length > 1) console.log(`${line(ids) ? 'linha' : 'SEM RELAÇÃO'} | ${ids.map(name).join(', ')} | ${k}`);
    console.log('\n## Quase iguais (3 de 4)');
    for (let i = 0; i < mons.length; i++)
        for (let j = i + 1; j < mons.length; j++) {
            const a = S.get(mons[i].id)!;
            const b = S.get(mons[j].id)!;
            const same = a.filter((m) => b.includes(m)).length;
            if (same === 3 && a.length === 4 && b.length === 4)
                console.log(
                    `${root(mons[i].id) === root(mons[j].id) ? 'linha' : 'SEM RELAÇÃO'} | ${name(mons[i].id)} × ${name(mons[j].id)} | iguais: ${a.filter((m) => b.includes(m)).join(', ')} | ${a.find((m) => !b.includes(m))} × ${b.find((m) => !a.includes(m))}`,
                );
        }
}
