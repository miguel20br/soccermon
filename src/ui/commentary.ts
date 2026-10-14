import { ABILITIES, MOVES, species } from '../engine/data';
import { ITEMS } from '../engine/items';
import { LINKS } from '../engine/links';
import { Rng } from '../engine/rng';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent } from '../engine/state';
import { TACTIC_LABEL } from '../engine/state';
import { effectivenessLabel } from '../engine/types';

export type Tone = 'goal' | 'big' | 'normal' | 'minor' | 'whistle';

export interface CommentLine {
    tick: number;
    minute: number;
    text: string;
    tone: Tone;
    team: 0 | 1 | null;
}

const STATUS_PT: Record<string, string> = {
    par: 'paralisado',
    slp: 'dormindo',
    psn: 'envenenado',
    brn: 'queimado',
    frz: 'congelado',
    confusion: 'confuso',
    infatuation: 'apaixonado',
    flinch: 'hesitante',
    seed: 'semeado (perde fôlego aos poucos)',
};

/**
 * Transforma o log estruturado de eventos em narração. Mantém os nomes atualizados conforme as
 * substituições e sorteia variações com um RNG próprio (a narração não mexe no RNG da partida).
 */
export class Commentator {
    private names: string[];
    private teams: (0 | 1)[];
    private captains: boolean[];
    private teamNames: [string, string];
    private rng: Rng;

    constructor(result: MatchResult, teamNames: [string, string]) {
        this.names = result.roster.map((p) => p.name);
        this.teams = result.roster.map((p) => p.team);
        this.captains = result.roster.map((p) => p.captain);
        this.teamNames = teamNames;
        this.rng = new Rng(result.seed, 'commentary');
    }

    private n(idx: number | null | undefined): string {
        return idx === null || idx === undefined ? '???' : (this.names[idx] ?? '???');
    }

    private pick(...options: string[]): string {
        return this.rng.pick(options);
    }

    lineFor(e: MatchEvent): CommentLine | null {
        const base = { tick: e.tick, minute: e.minute };
        const line = (text: string, tone: Tone, team: 0 | 1 | null = null): CommentLine => ({
            ...base,
            text,
            tone,
            team,
        });
        switch (e.type) {
            case 'kickoff':
                return e.tick < 30 || e.minute < 0.5 || Math.abs(e.minute - 20) < 0.2
                    ? line(`Rola a bola! Saída do ${this.teamNames[e.team]}.`, 'whistle', e.team)
                    : null;
            case 'goal': {
                const team = this.teamNames[e.team];
                if (e.ownGoal) {
                    return line(
                        `GOL CONTRA! ${this.n(e.by)} manda pra própria rede! ${this.score(e.score)}`,
                        'goal',
                        e.team,
                    );
                }
                const assist = e.assist !== null ? ` Assistência de ${this.n(e.assist)}.` : '';
                const shout = this.pick('GOOOOL', 'GOLAÇO', 'É GOL', 'GOOOL');
                return line(
                    `${shout} do ${team}! ${this.captains[e.by] ? 'O capitão ' : ''}${this.n(e.by)} balança a rede!${assist} ${this.score(e.score)}`,
                    'goal',
                    e.team,
                );
            }
            case 'shot': {
                const who = this.n(e.by);
                if (e.moveId) {
                    const move = MOVES[e.moveId]?.name ?? e.moveId;
                    return line(`${who} usa ${move} e solta a bomba!`, 'big', this.teams[e.by]);
                }
                if (e.xg > 0.3) return line(`${who} cara a cara com o goleiro... chutou!`, 'big', this.teams[e.by]);
                return line(
                    this.pick(
                        `${who} arrisca de longe!`,
                        `${who} finaliza!`,
                        `Chute de ${who}!`,
                        `${who} bate para o gol!`,
                    ),
                    'normal',
                    this.teams[e.by],
                );
            }
            case 'save':
                return line(
                    e.caught
                        ? this.pick(`${this.n(e.by)} encaixa firme!`, `Defesa segura de ${this.n(e.by)}.`)
                        : this.pick(
                              `QUE DEFESA de ${this.n(e.by)}! Espalmou!`,
                              `${this.n(e.by)} voa e manda para fora!`,
                          ),
                    'big',
                    this.teams[e.by],
                );
            case 'post':
                return line(
                    this.pick('NA TRAVE!', 'Carimbou a trave!', 'Bola no poste! Que azar!'),
                    'big',
                    this.teams[e.shooter],
                );
            case 'wide':
                return line(
                    this.pick('Pra fora.', 'Passou longe.', 'Raspando a trave, pra fora!'),
                    'minor',
                    this.teams[e.shooter],
                );
            case 'block':
                return line(`${this.n(e.by)} se joga na frente e bloqueia!`, 'normal', this.teams[e.by]);
            case 'tackle':
                if (!e.success) return null;
                return this.rng.chance(0.35)
                    ? line(
                          this.pick(
                              `Desarme de ${this.n(e.by)} em ${this.n(e.victim)}.`,
                              `${this.n(e.by)} rouba a bola!`,
                          ),
                          'minor',
                          this.teams[e.by],
                      )
                    : null;
            case 'interception':
                return this.rng.chance(0.2)
                    ? line(`${this.n(e.by)} lê o passe e intercepta.`, 'minor', this.teams[e.by])
                    : null;
            case 'move': {
                const move = MOVES[e.moveId]?.name ?? e.moveId;
                const who = this.n(e.by);
                const team = this.teams[e.by];
                const eff =
                    e.effectiveness !== null
                        ? effectivenessLabel(e.effectiveness >= 1.12 ? 2 : e.effectiveness < 1 ? 0.5 : 1)
                        : null;
                const suffix = eff === 'super' ? ' É super efetivo!' : eff === 'weak' ? ' Não é muito efetivo...' : '';
                switch (e.kind) {
                    case 'special':
                        return e.moveId === 'counter'
                            ? line(`COUNTER! ${who} devolve o golpe em ${this.n(e.target)}!`, 'big', team)
                            : e.moveId === 'metronome'
                              ? line(`${who} balança o dedo... Metronome!`, 'normal', team)
                              : e.moveId === 'mirrormove' || e.moveId === 'mimic'
                                ? line(
                                      e.hit
                                          ? `${who} copia o golpe do rival com ${move}!`
                                          : `${who} usa ${move}... não tinha o que copiar.`,
                                      'normal',
                                      team,
                                  )
                                : e.moveId === 'substitute'
                                  ? line(`${who} usa Substitute: um boneco entra na frente!`, 'normal', team)
                                  : e.moveId === 'mist'
                                    ? line(`${who} cobre o time com Mist!`, 'minor', team)
                                    : e.moveId === 'leechseed'
                                      ? e.hit
                                          ? null
                                          : line(`${who} usa Leech Seed... não pegou.`, 'minor', team)
                                      : null;
                    case 'flavor':
                        return e.moveId === 'splash'
                            ? line(`${who} usa Splash! ...mas nada acontece.`, 'normal', team)
                            : line(`${who} usa ${move}! A torcida não entendeu nada.`, 'normal', team);
                    case 'burst':
                        return line(`${who} usa ${move} e dispara em velocidade!`, 'normal', team);
                    case 'buff':
                        return line(`${who} usa ${move} e se concentra.`, 'minor', team);
                    case 'heal':
                        return line(`${who} usa ${move} e recupera o fôlego.`, 'minor', team);
                    case 'debuff':
                        return line(
                            e.hit
                                ? `${who} usa ${move} em ${this.n(e.target)}!`
                                : `${who} usa ${move}, mas não surte efeito.`,
                            'minor',
                            team,
                        );
                    case 'status':
                        return e.hit ? null : line(`${who} usa ${move}... errou!`, 'minor', team);
                    case 'strike':
                        if (e.withBall) return line(`${who} carrega ${move} no pé!`, 'normal', team);
                        return e.target === null && !e.hit
                            ? null
                            : line(`${who} chega com ${move} na dividida!${suffix}`, 'normal', team);
                    case 'blast':
                        return e.target !== null
                            ? line(
                                  `${who} dispara ${move} em ${this.n(e.target)}!${e.hit ? suffix : ' Errou!'}`,
                                  'normal',
                                  team,
                              )
                            : null;
                }
                return null;
            }
            case 'status': {
                const by = e.by !== null && e.source in MOVES ? ` (${MOVES[e.source].name})` : '';
                return line(
                    `${this.n(e.target)} ficou ${STATUS_PT[e.status] ?? e.status}!${by}`,
                    'normal',
                    this.teams[e.target],
                );
            }
            case 'ability': {
                const ab = ABILITIES[e.ability]?.name ?? e.ability;
                return line(
                    e.target !== null
                        ? `${ab} de ${this.n(e.by)} pega ${this.n(e.target)}!`
                        : `${ab} de ${this.n(e.by)} é ativada!`,
                    'normal',
                    this.teams[e.by],
                );
            }
            case 'transform':
                return line(
                    `${this.n(e.by)} se transforma em ${species(e.into).name}, o melhor da posição em campo!`,
                    'big',
                    this.teams[e.by],
                );
            case 'combo': {
                const link = LINKS.find((l) => l.id === e.link);
                return line(
                    `COMBO ${link?.name.toUpperCase() ?? ''}! ${this.n(e.partner)} serve ${this.n(e.by)}: ${link?.combo ?? ''}!`,
                    'big',
                    this.teams[e.by],
                );
            }
            case 'evolve': {
                const text = `O QUÊ? ${this.n(e.by)} está evoluindo... virou ${species(e.into).name}!`;
                if (this.names[e.by] === species(e.from).name) this.names[e.by] = species(e.into).name;
                return line(text, 'big', e.team);
            }
            case 'decoy':
                return line(
                    `O boneco de ${this.n(e.by)} aguentou o golpe de ${this.n(e.attacker)}!`,
                    'normal',
                    this.teams[e.by],
                );
            case 'haze':
                return line(
                    e.cleared.length
                        ? `${this.n(e.by)} solta Haze: a névoa limpa ${e.cleared.length} Pokémon em volta!`
                        : `${this.n(e.by)} solta Haze, mas ninguém por perto tinha nada.`,
                    'normal',
                    this.teams[e.by],
                );
            case 'teleport':
                return line(`${this.n(e.by)} usa Teleport e aparece do outro lado!`, 'normal', this.teams[e.by]);
            case 'skill':
                return this.rng.chance(0.12)
                    ? line(`${this.n(e.by)} dá um drible desconcertante!`, 'minor', this.teams[e.by])
                    : null;
            case 'tactic':
                return line(`${this.teamNames[e.team]} muda para ${TACTIC_LABEL[e.tactic]}!`, 'whistle', e.team);
            case 'item': {
                const item = ITEMS[e.item]?.name ?? e.item;
                const who = this.n(e.by);
                const text =
                    e.effect === 'save'
                        ? `${item} de ${who} segura o gol certo!`
                        : e.effect === 'cure'
                          ? `${who} come a ${item} e se cura!`
                          : e.effect === 'crit'
                            ? `Chute crítico! ${item} de ${who}!`
                            : `${who} resiste graças à ${item}!`;
                return line(text, 'big', this.teams[e.by]);
            }
            case 'sub':
                this.captains[e.outIdx] = false;
                this.names[e.outIdx] = e.in;
                return line(
                    `Substituição no ${this.teamNames[e.team]}: sai ${e.out}, entra ${e.in}.`,
                    'whistle',
                    e.team,
                );
            case 'halftime':
                return line(`Fim do primeiro tempo. ${this.score(e.score)}`, 'whistle');
            case 'fulltime':
                return line(
                    e.score[0] === e.score[1]
                        ? `Fim de jogo! ${this.score(e.score)} — vamos para os pênaltis!`
                        : `Fim de jogo! ${this.score(e.score)}`,
                    'whistle',
                );
            case 'penalty':
                return line(
                    `Pênalti ${e.round}: ${this.n(e.by)} ${e.scored ? 'converte!' : `perde! ${this.n(e.gk)} defende!`} (${e.shootout[0]} x ${e.shootout[1]})`,
                    e.scored ? 'big' : 'normal',
                    this.teams[e.by],
                );
            case 'end':
                if (e.winner === null) return null;
                return line(`${this.teamNames[e.winner]} vence!`, 'whistle', e.winner);
            default:
                return null;
        }
    }

    private score(s: [number, number]): string {
        return `${this.teamNames[0]} ${s[0]} x ${s[1]} ${this.teamNames[1]}`;
    }
}
