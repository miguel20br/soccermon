// Revisão dos golpes (docs/planos/golpes-revisao.md). Não muda nada do jogo: só lê e simula.
//   npx tsx scripts/balance/golpes-revisao.ts inventario   tabela de todos os golpes (kind, traços, quem usa)
//   npx tsx scripts/balance/golpes-revisao.ts iguais       golpes com o mesmo comportamento no motor
//   npx tsx scripts/balance/golpes-revisao.ts especies     os 151 com o moveset padrão e os casos ruins
//   npx tsx scripts/balance/golpes-revisao.ts calib [N] [regras]   o calibrate (mesmas seeds) + uso por golpe
//   npx tsx scripts/balance/golpes-revisao.ts diff [regras]        movesets que mudam com as regras
//   npx tsx scripts/balance/golpes-revisao.ts troca [M] [regras]   partidas pareadas só com as espécies que mudam
// regras (separadas por vírgula, sem mexer no código do jogo): tipo (1 golpe de cada tipo próprio),
// flyfix (Fly/Dig levam a bola 2 m), dupbeh (sem 2 golpes de mesmo comportamento), c (Harden = Defense Curl, Slam com alcance, Amnesia = Special +2)

import levelMoves from '../../src/data/level-moves.json';
import type { Species } from '../../src/engine/data';
import { MOVES, SPECIES } from '../../src/engine/data';
import { aiDraftTeam } from '../../src/engine/draft';
import type { MoveProfile } from '../../src/engine/moves';
import {
    DRAIN,
    DRAWBACK,
    defaultMoveset,
    MOVE_EXPLAIN,
    MOVE_TRAITS,
    MOVE_TUNING,
    moveProfile,
    OHKO,
    TRAP,
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

// ---- cópia do defaultMoveset (src/engine/moves.ts) com as regras novas ligáveis; sem regra = igual ao jogo
const GENERIC_TM = new Set([
    'doubleedge',
    'bodyslam',
    'takedown',
    'hyperbeam',
    'skullbash',
    'megakick',
    'megapunch',
    'submission',
    'seismictoss',
    'rage',
    'bide',
    'mimic',
    'doubleteam',
    'substitute',
    'toxic',
    'rest',
    'swift',
    'triattack',
]);
const RISKY = new Set([
    'fly',
    'dig',
    'hyperbeam',
    'explosion',
    'selfdestruct',
    'solarbeam',
    'skullbash',
    'skyattack',
    'razorwind',
]);
const LV = levelMoves as Record<string, Record<string, number>>;
const behKey = (p: MoveProfile) => behavior(p.id);
function moveset(sp: Species, rules: string[]): string[] {
    if (sp.id === 129) return ['splash', 'tackle'];
    const profiles = sp.learnset.filter((m) => !(rules.includes('semsplash') && m === 'splash')).map(moveProfile);
    const physical = sp.baseStats.atk >= sp.baseStats.spa;
    const levels = LV[sp.id] ?? {};
    const cap = !sp.evolvesTo.some((e) => e.id <= 151) ? 100 : sp.prevo ? 42 : 30;
    const origin = (p: MoveProfile) => (levels[p.id] === undefined ? 0.75 : levels[p.id] <= cap ? 1.4 : 0.85);
    const damageScore = (p: MoveProfile): number => {
        if (p.kind !== 'strike' && p.kind !== 'blast') return 0;
        let sc = p.strength * 100 * origin(p);
        if (sp.types.includes(p.data.type)) sc *= 1.6;
        else if (p.data.type === 'Normal') sc *= 0.7;
        if ((p.kind === 'strike') === physical) sc *= 1.2;
        if (GENERIC_TM.has(p.id)) sc *= 0.75;
        if (RISKY.has(p.id)) sc *= 0.55;
        return sc;
    };
    const utilityScore = (p: MoveProfile): number => {
        const g = (GENERIC_TM.has(p.id) ? 0.6 : 1) * (levels[p.id] !== undefined ? 1.3 : 1);
        const k = p.kind;
        if (k === 'status') return (60 + 25 * p.strength) * g;
        if (k === 'burst') return 65 * g;
        if (k === 'buff') return (40 + 15 * p.strength) * g;
        if (k === 'debuff') return (25 + 10 * p.strength) * g;
        if (k === 'heal') return 30 * g;
        if (k === 'special') return 50 * g;
        return 0;
    };
    const chosen: MoveProfile[] = [];
    const best = (score: (p: MoveProfile) => number) => {
        let top: MoveProfile | null = null;
        let topScore = 0;
        for (const p of profiles) {
            if (chosen.includes(p)) continue;
            const sc = score(p);
            if (sc > topScore || (sc === topScore && top && p.id < top.id)) {
                top = p;
                topScore = sc;
            }
        }
        if (top) chosen.push(top);
        return top;
    };
    const dupF = (p: MoveProfile) =>
        rules.includes('dupbeh') && chosen.some((c) => behKey(c) === behKey(p)) ? 0.4 : 1;
    // D1: no 4º golpe, MT de cobertura (sem STAB, não aprendida por nível) vale menos
    const coverF = (p: MoveProfile) =>
        rules.includes('menosmt') && levels[p.id] === undefined && !sp.types.includes(p.data.type) ? 0.6 : 1;
    const signature = profiles.find((p) => p.id === SIGNATURE[sp.id]);
    if (signature) chosen.push(signature);
    const first =
        signature && (signature.kind === 'strike' || signature.kind === 'blast') ? signature : best(damageScore);
    best((p) => {
        const sc = damageScore(p);
        if (!first) return sc;
        const sameType = p.data.type === first.data.type;
        const sameKind = p.kind === first.kind;
        return sc * dupF(p) * (sameType ? (sameKind ? 0.3 : 0.6) : 1.1);
    });
    const isUtility = (p: MoveProfile | undefined) => !!p && p.kind !== 'strike' && p.kind !== 'blast';
    if (!isUtility(signature)) best(utilityScore);
    const types = new Set(chosen.map((p) => p.data.type));
    if (chosen.length < 4) {
        best((p) =>
            Math.max(
                damageScore(p) * (types.has(p.data.type) ? 0.5 : 1) * dupF(p) * coverF(p),
                utilityScore(p) * 0.9,
                p.kind === 'flavor' ? 1 : 0,
            ),
        );
    }
    if (rules.includes('tipo')) {
        // regra A: pelo menos 1 golpe de cada tipo da espécie, se o learnset tiver. Entra o de melhor nota do tipo;
        // sai, nesta ordem: mesma classe (dano por dano, utilitário por utilitário), comportamento repetido, tipo de
        // fora repetido, tipo de fora, tipo próprio repetido; nunca a assinatura nem o único golpe de um tipo próprio.
        const isD = (p: MoveProfile) => p.kind === 'strike' || p.kind === 'blast';
        const score = (p: MoveProfile) => Math.max(damageScore(p), utilityScore(p));
        const own = (t: string) => sp.types.includes(t as never);
        for (const t of sp.types) {
            if (chosen.some((p) => p.data.type === t)) continue;
            let cand: MoveProfile | null = null;
            for (const p of profiles)
                if (p.data.type === t && !chosen.includes(p) && (!cand || score(p) > score(cand))) cand = p;
            if (!cand) continue;
            const c = cand;
            const count = (ty: string) => chosen.filter((p) => p.data.type === ty).length;
            const rank = (p: MoveProfile) =>
                (isD(p) === isD(c) ? 100 : 0) +
                (chosen.some((o) => o !== p && behKey(o) === behKey(p)) ? 40 : 0) +
                (!own(p.data.type) && count(p.data.type) > 1 ? 30 : !own(p.data.type) ? 20 : 10);
            const victims = chosen
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => p !== signature && !(own(p.data.type) && count(p.data.type) === 1))
                .sort((a, b) => rank(b.p) - rank(a.p) || score(a.p) - score(b.p) || b.i - a.i);
            if (victims.length) chosen[victims[0].i] = c;
        }
    }
    return chosen.slice(0, 4).map((p) => p.id);
}
const rulesArg = (i: number) => (process.argv[i] ?? '').split(',').filter(Boolean);
// confere a cópia: sem regra, igual ao jogo
for (const sp of SPECIES) {
    if (sp.id === 132) continue;
    const a = moveset(sp, []).join();
    if (a !== sets.get(sp.id)!.join()) throw new Error(`cópia do defaultMoveset diverge em ${sp.name}: ${a}`);
}
const C_MOVES = ['harden', 'slam', 'amnesia'];
function setC(on: boolean) {
    if (on) {
        MOVE_TRAITS.harden = ['curl'];
        MOVE_TRAITS.slam = ['reach'];
    } else {
        delete MOVE_TRAITS.harden;
        delete MOVE_TRAITS.slam;
    }
    (MOVES.amnesia as any).selfBoosts = on ? { spa: 2, spd: 2 } : { spd: 2 };
}
function applyRules(rules: string[]) {
    if (rules.includes('c')) setC(true);
    // Fly/Dig com a bola levam a bola 2 m em vez de 4 m antes do chute
    if (rules.includes('flyfix')) MOVE_TUNING.airCarry = 2;
    const next = new Map<number, string[]>();
    for (const sp of SPECIES) next.set(sp.id, sp.id === 132 ? sets.get(132)! : moveset(sp, rules));
    return next;
}
const changed = (next: Map<number, string[]>) =>
    SPECIES.filter((sp) => next.get(sp.id)!.join() !== sets.get(sp.id)!.join());

if (mode === 'diff') {
    const next = applyRules(rulesArg(3));
    const ch = changed(next);
    for (const sp of ch) {
        const a = sets.get(sp.id)!;
        const b = next.get(sp.id)!;
        const out = a.filter((m) => !b.includes(m));
        const inn = b.filter((m) => !a.includes(m));
        console.log(
            `| ${sp.id} ${sp.name} | ${sp.types.join('/')} | ${a.join(', ')} | ${out.join(', ')} ⇒ ${inn.join(', ')} |`,
        );
    }
    console.log(`${ch.length} espécies mudam`);
    const pool = new Set(SPECIES.flatMap((sp) => next.get(sp.id)!));
    const before = new Set(SPECIES.flatMap((sp) => sets.get(sp.id)!));
    console.log('saem de todo moveset padrão:', [...before].filter((m) => !pool.has(m)).join(' ') || '-');
    console.log('entram em algum moveset padrão:', [...pool].filter((m) => !before.has(m)).join(' ') || '-');
}

if (mode === 'calib') {
    const N = Number(process.argv[3]) || 400;
    const next = applyRules(rulesArg(4));
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
    console.log(`regras: ${rulesArg(4).join(',') || 'nenhuma'} · ${N} partidas`);
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
    const rules = rulesArg(4);
    const next = applyRules(rules);
    const cOn = rules.includes('c');
    const ch = changed(next);
    if (cOn)
        for (const sp of SPECIES)
            if (!ch.includes(sp) && sets.get(sp.id)!.some((m) => C_MOVES.includes(m))) ch.push(sp);
    const tot = { a: { w: 0, d: 0, gd: 0 }, b: { w: 0, d: 0, gd: 0 } };
    console.log('espécie|vitórias hoje|vitórias novo|saldo hoje|saldo novo');
    for (const sp of ch) {
        const res = { a: { w: 0, d: 0, gd: 0 }, b: { w: 0, d: 0, gd: 0 } };
        for (let i = 0; i < M; i++) {
            for (const arm of ['a', 'b'] as const) {
                if (cOn) setC(arm === 'b');
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
