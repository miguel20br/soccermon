import { ABILITIES, MOVES, species } from '../engine/data';
import { ITEMS } from '../engine/items';
import { LINKS } from '../engine/links';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent, TraitFx } from '../engine/state';
import { effectivenessLabel } from '../engine/types';
import { type Dict, dict, fmt, formationText, linkText, type Vars } from '../i18n';

export type Tone = 'goal' | 'big' | 'normal' | 'minor' | 'whistle';

export interface CommentLine {
    tick: number;
    minute: number;
    text: string;
    tone: Tone;
    team: 0 | 1 | null;
}

/** Dicionário da narração no idioma atual. */
const C = () => dict().commentary;
/** Linha da narração com `{nome}` trocado. */
const say = (text: string, vars: Vars) => fmt(text, vars);

/** Narração dos golpes especiais que não têm evento próprio. */
const SPECIAL_LINE: Record<string, (w: string, tg: string, hit: boolean) => string> = {
    bide: (w) => say(C().special.bide, { w }),
    rage: (w) => say(C().special.rage, { w }),
    conversion: (w, _t, hit) => say(hit ? C().special.conversionHit : C().special.conversionMiss, { w }),
    disable: (w, tg, hit) => say(hit ? C().special.disableHit : C().special.disableMiss, { w, tg }),
    roar: (w, _t, hit) => say(hit ? C().special.roarHit : C().special.roarMiss, { w }),
    whirlwind: (w, _t, hit) => say(hit ? C().special.whirlwindHit : C().special.whirlwindMiss, { w }),
    splash: (w) => say(C().special.splash, { w }),
    transform: (w, tg, hit) => say(hit ? C().special.transformHit : C().special.transformMiss, { w, tg }),
};

type TraitText = Dict['commentary']['trait'];
/** Linha simples de traço: texto do dicionário + tom. */
const tl =
    (key: keyof TraitText, tone: Tone) =>
    (w: string, tg: string, m: string, n: number): [string, Tone] => [say(C().trait[key], { w, tg, m, n }), tone];

/**
 * Narração dos traços de golpe (evento 'trait', src/engine/moves.ts → MOVE_TRAITS).
 * `w` = quem usou, `tg` = alvo, `m` = golpe, `n` = número do efeito. null = não narra (fica só na cena).
 */
const TRAIT_LINE: Partial<Record<TraitFx, (w: string, tg: string, m: string, n: number) => [string, Tone] | null>> = {
    crit: tl('crit', 'big'),
    focusBug: tl('focusBug', 'normal'),
    charge: tl('charge', 'normal'),
    chargeLost: tl('chargeLost', 'normal'),
    noRecharge: tl('noRecharge', 'big'),
    fly: tl('fly', 'big'),
    dig: tl('dig', 'big'),
    priority: (w, tg, m, n) => (tg !== '???' ? tl('priority', 'normal')(w, tg, m, n) : null),
    area: (w, tg, m, n) => (n >= 2 ? tl('area', 'normal')(w, tg, m, n) : null),
    pierce: tl('pierce', 'normal'),
    lob: tl('lob', 'normal'),
    blind: (w, tg, m, n) => tl(n > 1 ? 'blindMany' : 'blindOne', 'minor')(w, tg, m, n),
    halfEnergy: tl('halfEnergy', 'normal'),
    throw: tl('throw', 'normal'),
    trip: (w, tg, m, n) => tl(n >= 150 ? 'tripHeavy' : 'trip', 'minor')(w, tg, m, n),
    multi: (w, tg, m, n) => (n >= 3 ? tl('multi', 'minor')(w, tg, m, n) : null),
    rebound: tl('rebound', 'normal'),
    wrap: tl('wrap', 'normal'),
    clampHold: tl('clampHold', 'minor'),
    toxic: tl('toxic', 'normal'),
    rageUp: tl('rageUp', 'minor'),
    bide: (w, tg, m, n) => tl(n ? 'bideStored' : 'bide', 'normal')(w, tg, m, n),
    clones: tl('clones', 'normal'),
    clone: tl('clone', 'normal'),
    mini: tl('mini', 'minor'),
    guard: (w, tg, m, n) => (tg !== '???' ? tl('guard', 'minor')(w, tg, m, n) : null),
    curl: tl('curl', 'minor'),
    wall: tl('wall', 'normal'),
    wallBlock: tl('wallBlock', 'big'),
    flee: tl('flee', 'normal'),
    blowBall: tl('blowBall', 'minor'),
    typeCopy: tl('typeCopy', 'normal'),
    teamHeal: tl('teamHeal', 'minor'),
    coins: tl('coins', 'normal'),
};

/**
 * Transforma o log estruturado de eventos em narração. Mantém os nomes atualizados conforme as
 * substituições e sorteia variações com um RNG próprio (a narração não mexe no RNG da partida).
 */
export class Commentator {
    private names: string[];
    private teams: (0 | 1)[];
    private captains: boolean[];
    private roles: string[];
    private teamNames: [string, string];
    private rng: Rng;
    /** Último escanteio (gol olímpico: o cobrador chuta direto e marca). */
    private corner: { tick: number; by: number; team: 0 | 1 } | null = null;
    private olympicShot = false;
    /** Time com técnico IA (rival que reage): o aviso dele já narra o grito e a tática, sem repetir. */
    private coached: [boolean, boolean];

    constructor(result: MatchResult, teamNames: [string, string]) {
        this.names = result.roster.map((p) => p.name);
        this.teams = result.roster.map((p) => p.team);
        this.captains = result.roster.map((p) => p.captain);
        this.roles = result.roster.map((p) => p.role);
        this.teamNames = teamNames;
        this.rng = new Rng(result.seed, 'commentary');
        this.coached = [0, 1].map((t) => result.events.some((e) => e.type === 'coach' && e.team === t)) as [
            boolean,
            boolean,
        ];
    }

    private n(idx: number | null | undefined): string {
        return idx === null || idx === undefined ? '???' : (this.names[idx] ?? '???');
    }

    /** Sorteia uma das opções (listas do dicionário: o mesmo tamanho nas duas línguas). */
    private pick(options: readonly string[], vars: Vars): string {
        return say(this.rng.pick(options as string[]), vars);
    }

    lineFor(e: MatchEvent): CommentLine | null {
        const base = { tick: e.tick, minute: e.minute };
        const line = (text: string, tone: Tone, team: 0 | 1 | null = null): CommentLine => ({
            ...base,
            text,
            tone,
            team,
        });
        const c = C();
        // gol olímpico: o primeiro chute depois do escanteio é do cobrador, na hora da cobrança
        if (e.type === 'shot') {
            const k = this.corner;
            this.olympicShot = !!k && k.by === e.by && e.tick - k.tick < 40;
            this.corner = null;
        }
        switch (e.type) {
            case 'kickoff':
                return e.tick < 30 || e.minute < 0.5 || Math.abs(e.minute - 20) < 0.2
                    ? line(say(c.kickoff, { team: this.teamNames[e.team] }), 'whistle', e.team)
                    : null;
            case 'goal': {
                const team = this.teamNames[e.team];
                if (this.olympicShot && !e.ownGoal) {
                    this.olympicShot = false;
                    return line(say(c.olympic, { x: this.n(e.by), score: this.score(e.score) }), 'goal', e.team);
                }
                if (e.ownGoal) {
                    return line(say(c.ownGoal, { x: this.n(e.by), score: this.score(e.score) }), 'goal', e.team);
                }
                const assist = e.assist !== null ? say(c.assist, { x: this.n(e.assist) }) : '';
                const shout = this.pick(c.shouts, {});
                return line(
                    say(c.goal, {
                        shout,
                        team,
                        captain: this.captains[e.by] ? c.captain : '',
                        x: this.n(e.by),
                        assist,
                        score: this.score(e.score),
                    }),
                    'goal',
                    e.team,
                );
            }
            case 'shot': {
                const w = this.n(e.by);
                if (e.moveId) {
                    const m = MOVES[e.moveId]?.name ?? e.moveId;
                    return line(say(c.shotMove, { w, m }), 'big', this.teams[e.by]);
                }
                if (e.xg > 0.3) return line(say(c.oneOnOne, { w }), 'big', this.teams[e.by]);
                return line(this.pick(c.shots, { w }), 'normal', this.teams[e.by]);
            }
            case 'save':
                return line(
                    this.pick(e.caught ? c.saveCaught : c.saveParried, { x: this.n(e.by) }),
                    'big',
                    this.teams[e.by],
                );
            case 'post':
                return line(this.pick(c.post, {}), 'big', this.teams[e.shooter]);
            case 'wide':
                return line(this.pick(c.wide, {}), 'minor', this.teams[e.shooter]);
            case 'block':
                return line(say(c.block, { x: this.n(e.by) }), 'normal', this.teams[e.by]);
            case 'tackle':
                if (!e.success) return null;
                return this.rng.chance(0.35)
                    ? line(this.pick(c.tackle, { x: this.n(e.by), y: this.n(e.victim) }), 'minor', this.teams[e.by])
                    : null;
            case 'interception':
                return this.rng.chance(0.2)
                    ? line(say(c.interception, { x: this.n(e.by) }), 'minor', this.teams[e.by])
                    : null;
            case 'move': {
                const m = MOVES[e.moveId]?.name ?? e.moveId;
                const w = this.n(e.by);
                const tg = this.n(e.target);
                const team = this.teams[e.by];
                const eff =
                    e.effectiveness !== null
                        ? effectivenessLabel(e.effectiveness >= 1.12 ? 2 : e.effectiveness < 1 ? 0.5 : 1)
                        : null;
                const suffix = eff === 'super' ? c.superEffective : eff === 'weak' ? c.notVeryEffective : '';
                const v = { w, m, tg };
                if (e.save) return e.hit ? line(say(c.gkSaveMove, v), 'big', team) : null;
                switch (e.kind) {
                    case 'special':
                        return e.moveId === 'counter'
                            ? line(say(c.counter, v), 'big', team)
                            : e.moveId === 'metronome'
                              ? line(say(c.metronome, v), 'normal', team)
                              : e.moveId === 'mirrormove' || e.moveId === 'mimic'
                                ? line(say(e.hit ? c.copyHit : c.copyMiss, v), 'normal', team)
                                : e.moveId === 'substitute'
                                  ? line(say(c.substitute, v), 'normal', team)
                                  : e.moveId === 'mist'
                                    ? line(say(c.mist, v), 'minor', team)
                                    : e.moveId === 'leechseed'
                                      ? e.hit
                                          ? null
                                          : line(say(c.leechSeedMiss, v), 'minor', team)
                                      : SPECIAL_LINE[e.moveId]
                                        ? line(SPECIAL_LINE[e.moveId](w, tg, e.hit), 'normal', team)
                                        : null;
                    case 'flavor':
                        return line(say(e.moveId === 'splash' ? c.splash : c.flavor, v), 'normal', team);
                    case 'burst':
                        return line(say(c.burst, v), 'normal', team);
                    case 'buff':
                        return line(say(c.buff, v), 'minor', team);
                    case 'heal':
                        return line(say(c.heal, v), 'minor', team);
                    case 'debuff':
                        return line(say(e.hit ? c.debuffHit : c.debuffMiss, v), 'minor', team);
                    case 'status':
                        return e.hit ? null : line(say(c.statusMiss, v), 'minor', team);
                    case 'strike':
                        if (e.withBall) return line(say(c.strikeBall, v), 'normal', team);
                        return e.target === null && !e.hit
                            ? null
                            : line(say(c.strike, { ...v, eff: suffix }), 'normal', team);
                    case 'blast':
                        return e.target !== null
                            ? line(say(c.blast, { ...v, eff: e.hit ? suffix : say(c.blastMissed, v) }), 'normal', team)
                            : null;
                }
                return null;
            }
            case 'status': {
                const by = e.by !== null && e.source in MOVES ? ` (${MOVES[e.source].name})` : '';
                const text = (c.status as Record<string, string>)[e.status] ?? c.statusOther;
                return line(say(text, { x: this.n(e.target), s: e.status, by }), 'normal', this.teams[e.target]);
            }
            case 'ability': {
                const ab = ABILITIES[e.ability]?.name ?? e.ability;
                return line(
                    e.blocked
                        ? say(c.abilityBlock, { ab, x: this.n(e.by) })
                        : e.target !== null
                          ? say(c.abilityHit, { ab, x: this.n(e.by), y: this.n(e.target) })
                          : say(c.ability, { ab, x: this.n(e.by) }),
                    'normal',
                    this.teams[e.by],
                );
            }
            case 'transform':
                return line(say(c.transform, { x: this.n(e.by), sp: species(e.into).name }), 'big', this.teams[e.by]);
            case 'combo': {
                const link = LINKS.some((l) => l.id === e.link) ? linkText(e.link) : null;
                return line(
                    say(c.combo, {
                        link: link?.name.toUpperCase() ?? '',
                        a: this.n(e.partner),
                        b: this.n(e.by),
                        combo: link?.combo ?? '',
                    }),
                    'big',
                    this.teams[e.by],
                );
            }
            case 'evolve': {
                // diz de quem é: "Koffing do Fuchsia evoluiu pra Weezing!"
                const text = say(c.evolve, { x: this.n(e.by), team: this.teamNames[e.team], sp: species(e.into).name });
                if (this.names[e.by] === species(e.from).name) this.names[e.by] = species(e.into).name;
                return line(text, 'big', e.team);
            }
            case 'decoy':
                return line(say(c.decoy, { x: this.n(e.by), y: this.n(e.attacker) }), 'normal', this.teams[e.by]);
            case 'haze':
                return line(
                    say(e.cleared.length ? c.haze : c.hazeEmpty, { x: this.n(e.by), n: e.cleared.length }),
                    'normal',
                    this.teams[e.by],
                );
            case 'trait': {
                const f = TRAIT_LINE[e.fx];
                const r = f?.(this.n(e.by), this.n(e.target), MOVES[e.moveId]?.name ?? e.moveId, e.n ?? 0);
                return r ? line(r[0], r[1], this.teams[e.by]) : null;
            }
            case 'teleport':
                return line(say(c.teleport, { x: this.n(e.by) }), 'normal', this.teams[e.by]);
            case 'skill':
                return this.rng.chance(0.12)
                    ? line(say(c.skill, { x: this.n(e.by) }), 'minor', this.teams[e.by])
                    : null;
            case 'corner':
                this.corner = { tick: e.tick, by: e.by, team: e.team };
                this.olympicShot = false;
                return line(
                    say(c.corner, {
                        team: this.teamNames[e.team],
                        x: this.n(e.by),
                        play: dict().common.cornerPlay[e.play],
                    }),
                    'normal',
                    e.team,
                );
            case 'aerial': {
                const x = { x: this.n(e.by) };
                const text =
                    e.kind === 'header'
                        ? this.pick(c.aerialHeader, x)
                        : say(
                              {
                                  volley: c.aerialVolley,
                                  flick: c.aerialFlick,
                                  clear: c.aerialClear,
                                  catch: c.aerialCatch,
                                  punch: c.aerialPunch,
                              }[e.kind],
                              x,
                          );
                return line(text, e.kind === 'clear' ? 'minor' : 'big', e.team);
            }
            case 'cornerPlan':
                return line(
                    say(c.cornerPlan, { team: this.teamNames[e.team], plan: dict().common.cornerPlan[e.plan] }),
                    'whistle',
                    e.team,
                );
            case 'tactic':
                if (this.coached[e.team]) return null;
                return line(
                    say(c.tactic, { team: this.teamNames[e.team], tactic: dict().common.tactic[e.tactic] }),
                    'whistle',
                    e.team,
                );
            case 'lineup':
                return line(
                    say(c.lineup, { team: this.teamNames[e.team], formation: formationText(e.formation).name }),
                    'whistle',
                    e.team,
                );
            case 'item': {
                const item = ITEMS[e.item]?.name ?? e.item;
                const text =
                    e.effect === 'save'
                        ? c.itemSave
                        : e.effect === 'cure'
                          ? c.itemCure
                          : e.effect === 'crit'
                            ? c.itemCrit
                            : c.itemEndure;
                return line(say(text, { item, x: this.n(e.by) }), 'big', this.teams[e.by]);
            }
            case 'sub':
                this.captains[e.outIdx] = false;
                this.names[e.outIdx] = e.in;
                return line(say(c.sub, { team: this.teamNames[e.team], out: e.out, in: e.in }), 'whistle', e.team);
            case 'halftime':
                return line(say(c.halftime, { score: this.score(e.score) }), 'whistle');
            case 'stoppage':
                return line(say(c.stoppage, { min: e.minutes }), 'whistle');
            case 'pressure':
                return e.team === null ? null : line(say(c.pressure, { team: this.teamNames[e.team] }), 'big', e.team);
            case 'fulltime':
                return line(
                    say(e.score[0] === e.score[1] ? c.fulltimeDraw : c.fulltime, { score: this.score(e.score) }),
                    'whistle',
                );
            case 'penalty':
                return line(
                    say(e.scored ? c.penaltyScored : c.penaltyMissed, {
                        round: e.round,
                        x: this.n(e.by),
                        gk: this.n(e.gk),
                        a: e.shootout[0],
                        b: e.shootout[1],
                    }),
                    e.scored ? 'big' : 'normal',
                    this.teams[e.by],
                );
            case 'coach': {
                const k = c.coach;
                const vars = {
                    leader: dict().match.leaders[e.leader].name,
                    team: this.teamNames[e.team],
                    tactic: e.call === 'tactic' ? dict().common.tactic[e.tactic] : '',
                };
                const text = e.call === 'flyGk' ? (e.on ? k.flyGkOn : k.flyGkOff) : k[e.call];
                return line(say(text, vars), e.call === 'timeout' || e.call === 'max' ? 'big' : 'whistle', e.team);
            }
            case 'timeout':
                return line(say(c.timeout, { team: this.teamNames[e.team] }), 'whistle', e.team);
            case 'flyGk':
                return line(
                    say(e.on ? c.flyGkOn : c.flyGkOff, { team: this.teamNames[e.team], x: this.n(e.by) }),
                    'big',
                    e.team,
                );
            case 'max': {
                // a defesa máxima só vira fala quando sai (E1): o começo fica na aura e o "sem chute" no goleiro
                if (e.phase !== 'hit') return null;
                const m = e.moveId ? (MOVES[e.moveId]?.name ?? e.moveId) : '';
                const text = this.roles[e.by] === 'GK' ? c.maxGk : c.maxHit;
                return line(say(text, { x: this.n(e.by), m }), 'big', e.team);
            }
            case 'end':
                if (e.winner === null) return null;
                return line(say(c.win, { team: this.teamNames[e.winner] }), 'whistle', e.winner);
            default:
                return null;
        }
    }

    private score(s: [number, number]): string {
        return say(C().score, { home: this.teamNames[0], a: s[0], b: s[1], away: this.teamNames[1] });
    }
}
