import type { CSSProperties, ReactNode } from 'react';
import { CUP_STAGES } from '../../engine/cup';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import type { TeamSetup } from '../../engine/state';
import type { RunState } from '../../store/game-store';
import { cardSprite } from './PokeCard';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const CONFETTI_COLORS = ['#ffd447', '#e8423f', '#3a8ee6', '#7dff8a', '#ff8fc8', '#ffffff'];

/** Confete caindo uma vez (vitória e título). Posições fixas por índice: nada de aleatório a cada render. */
export function Confetti({ count }: { count: number }) {
    return (
        <div className="rh-confetti" aria-hidden>
            {Array.from({ length: count }, (_, i) => {
                const style = {
                    '--x': `${(i * 37) % 100}%`,
                    '--d': `${(i % 9) * 0.12}s`,
                    '--t': `${2.4 + (i % 5) * 0.35}s`,
                    '--r': `${(i * 53) % 360}deg`,
                    '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                } as CSSProperties;
                // biome-ignore lint/suspicious/noArrayIndexKey: confete fixo, sem identidade
                return <i key={i} style={style} />;
            })}
        </div>
    );
}

/**
 * Topo da tela de resultado: título grande (VITÓRIA / CAMPEÕES / FIM DA LINHA), placar com os dois times,
 * o seu time comemorando (o craque com estrela), o caminho da copa e quem vem pela frente.
 */
export function ResultHero({
    run,
    match,
    opponent,
    names,
    mvpUid,
    actions,
}: {
    run: RunState;
    match: MatchResult;
    opponent: TeamSetup;
    names: [string, string];
    /** Craque do seu time na partida. */
    mvpUid: string | null;
    actions: ReactNode;
}) {
    const won = match.winner === 0;
    const champion = run.status === 'champion';
    const mood = champion ? 'champ' : won ? 'win' : 'loss';
    const title = champion ? 'CAMPEÕES!' : won ? 'VITÓRIA!' : 'FIM DA LINHA';
    const sub = champion
        ? 'Copa de Kanto conquistada!'
        : won
          ? `${CUP_STAGES[run.stage]} vencida`
          : `Eliminado nas ${CUP_STAGES[run.stage].toLowerCase()}`;
    const squad = match.finalRoster.filter((p) => p.team === 0);
    const next = won && !champion ? run.opponents[run.stage + 1] : null;
    const style = { '--home': '#e8423f', '--away': hex(opponent.color) } as CSSProperties;

    return (
        <section className={`panel rh rh-${mood}`} style={style} aria-label="Resultado da partida">
            {mood !== 'loss' && <Confetti count={mood === 'champ' ? 60 : 36} />}
            {champion && (
                <div className="rh-trophy" aria-hidden>
                    🏆
                </div>
            )}
            <div className="rh-stage">{CUP_STAGES[run.stage]}</div>
            <h1 className="rh-title" aria-label={title}>
                {[...title].map((ch, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: letras do título
                    <span key={i} style={{ '--i': i } as CSSProperties}>
                        {ch === ' ' ? ' ' : ch}
                    </span>
                ))}
            </h1>
            <div className="rh-sub">{sub}</div>

            <div className="rh-score">
                <div className="rh-team home">
                    <i />
                    <span>{names[0]}</span>
                </div>
                <b className={match.score[0] > match.score[1] ? 'lead' : ''}>{match.score[0]}</b>
                <span className="rh-x">x</span>
                <b className={match.score[1] > match.score[0] ? 'lead' : ''}>{match.score[1]}</b>
                <div className="rh-team away">
                    <span>{names[1]}</span>
                    <i />
                </div>
            </div>
            {match.shootout && (
                <div className="rh-pens">
                    Pênaltis {match.shootout[0]} x {match.shootout[1]}
                </div>
            )}

            <div className="rh-squad">
                {squad.map((p, i) => (
                    <div
                        key={p.uid}
                        className={`rh-mon${p.uid === mvpUid ? ' mvp' : ''}`}
                        style={{ '--i': i } as CSSProperties}
                    >
                        {p.uid === mvpUid && <span className="rh-star">★ craque</span>}
                        <img
                            className="pixel"
                            src={cardSprite({ speciesId: p.speciesId, shiny: p.shiny })}
                            alt={p.name}
                        />
                    </div>
                ))}
            </div>

            <ol className="rh-path" aria-label="Caminho da copa">
                {CUP_STAGES.map((label, i) => {
                    const res = run.results.find((r) => r.stage === i);
                    const state = res ? (res.won ? 'won' : 'lost') : i === run.stage + 1 && won ? 'next' : 'todo';
                    return (
                        <li key={label} className={state}>
                            <span className="rh-dot">{state === 'won' ? '✓' : state === 'lost' ? '✗' : i + 1}</span>
                            <span>{label.replace(' de final', '')}</span>
                            {res && (
                                <small>
                                    {res.score[0]}x{res.score[1]}
                                </small>
                            )}
                        </li>
                    );
                })}
            </ol>

            {next && (
                <div className="rh-next">
                    <span className="muted">Próximo: {CUP_STAGES[run.stage + 1]} contra</span>
                    <b>{next.name}</b>
                    <div className="rh-next-squad">
                        {next.lineup.map((p) => (
                            <img key={p.uid} className="pixel" src={cardSprite(p)} alt={viewInstance(p).displayName} />
                        ))}
                    </div>
                </div>
            )}

            <div className="rh-actions">{actions}</div>
        </section>
    );
}
