import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { CUP_STAGES } from '../../engine/cup';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import type { TeamSetup } from '../../engine/state';
import { playSfx } from '../../game/audio';
import { clubName, stageName } from '../../i18n';
import { useT } from '../../i18n/react';
import type { RunState } from '../../store/game-store';
import { rivalColor } from '../../store/profile';
import { useClubColor } from '../profile/club';
import { CountUp } from './CountUp';
import { cardSprite } from './PokeCard';

/** Linha de número do topo do resultado (seu time x rival). */
export interface HeroStat {
    label: string;
    home: number;
    away: number;
    fmt?: (v: number) => string;
}

/** Espera do placar rolar antes da 1ª linha, e o intervalo entre as linhas seguintes (ms). */
const FIRST_LINE_MS = 450;
const LINE_MS = 150;

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
    stats = [],
    actions,
}: {
    run: RunState;
    match: MatchResult;
    opponent: TeamSetup;
    names: [string, string];
    /** Craque do seu time na partida. */
    mvpUid: string | null;
    /** Números que entram linha a linha depois do placar. */
    stats?: HeroStat[];
    actions: ReactNode;
}) {
    // um de cada vez: placar rola, as linhas entram a cada 150 ms e o craque vem por último, com batida.
    // Um toque em qualquer lugar do bloco mostra tudo na hora.
    const lines = stats.length + 1;
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (step >= lines) return;
        const id = window.setTimeout(
            () => {
                const next = step + 1;
                // cada linha um semitom acima: o número "sobe" também no som
                if (next < lines) playSfx('select', 2 ** ((next * 2) / 12));
                else if (mvpUid) playSfx('kick');
                setStep(next);
            },
            step === 0 ? FIRST_LINE_MS : LINE_MS,
        );
        return () => clearTimeout(id);
    }, [step, lines, mvpUid]);
    const finish = () => {
        setDone(true);
        setStep(lines);
    };
    const mvpOn = step >= lines;
    const won = match.winner === 0;
    const { t, d } = useT();
    const champion = run.status === 'champion';
    const mood = champion ? 'champ' : won ? 'win' : 'loss';
    const title = champion ? t('result.hero.champions') : won ? t('result.hero.win') : t('result.hero.loss');
    const sub = champion
        ? t('result.hero.cupWon')
        : won
          ? d.common.stageWon[run.stage]
          : run.stage === CUP_STAGES.length - 1
            ? t('result.hero.runnerUp')
            : t('result.hero.eliminated', { stage: d.common.stageIn[run.stage] ?? '' });
    const squad = match.finalRoster.filter((p) => p.team === 0);
    const next = won && !champion ? run.opponents[run.stage + 1] : null;
    // seu time na cor do clube (Perfil); o rival no uniforme reserva se as cores baterem
    const homeColor = useClubColor();
    const style = { '--home': hex(homeColor), '--away': hex(rivalColor(homeColor, opponent.color)) } as CSSProperties;

    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: toque pra pular a contagem; o teclado chega aos botões, que também completam
        <section className={`panel rh rh-${mood}`} style={style} aria-label={t('result.hero.aria')} onClick={finish}>
            {mood !== 'loss' && <Confetti count={mood === 'champ' ? 60 : 36} />}
            <div className="rh-stage">{stageName(run.stage)}</div>
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
                <b className={match.score[0] > match.score[1] ? 'lead' : ''}>
                    <CountUp from={0} to={match.score[0]} skip={done} />
                </b>
                <span className="rh-x">x</span>
                <b className={match.score[1] > match.score[0] ? 'lead' : ''}>
                    <CountUp from={0} to={match.score[1]} skip={done} />
                </b>
                <div className="rh-team away">
                    <span>{names[1]}</span>
                    <i />
                </div>
            </div>
            {match.shootout && (
                <div className="rh-pens">{t('result.hero.pens', { a: match.shootout[0], b: match.shootout[1] })}</div>
            )}

            {stats.length > 0 && (
                <div className="rh-stats">
                    {stats.map((s, i) => {
                        const on = step > i;
                        const f = s.fmt ?? String;
                        return (
                            <div key={s.label} className={`rh-stat${on ? ' on' : ''}`}>
                                <b>{on ? <CountUp from={0} to={s.home} format={f} skip={done} /> : f(s.home)}</b>
                                <span>{s.label}</span>
                                <b>{on ? <CountUp from={0} to={s.away} format={f} skip={done} /> : f(s.away)}</b>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="rh-squad">
                {squad.map((p, i) => (
                    <div
                        key={p.uid}
                        className={`rh-mon${p.uid === mvpUid ? ` mvp${mvpOn ? ' mvp-on' : ''}` : ''}`}
                        style={{ '--i': i } as CSSProperties}
                    >
                        {p.uid === mvpUid && mvpOn && <span className="rh-star">{t('result.hero.star')}</span>}
                        <img
                            className="pixel"
                            src={cardSprite({ speciesId: p.speciesId, shiny: p.shiny })}
                            alt={p.name}
                        />
                    </div>
                ))}
            </div>

            <ol className="rh-path" aria-label={t('result.hero.path')}>
                {CUP_STAGES.map((label, i) => {
                    const res = run.results.find((r) => r.stage === i);
                    const state = res ? (res.won ? 'won' : 'lost') : i === run.stage + 1 && won ? 'next' : 'todo';
                    return (
                        <li key={label} className={state}>
                            <span className="rh-dot">{state === 'won' ? '✓' : state === 'lost' ? '✗' : i + 1}</span>
                            <span>{d.result.hero.stageShort[i] ?? label}</span>
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
                    <span className="muted">{t('result.hero.next', { stage: stageName(run.stage + 1) })}</span>
                    <b>{clubName(next.name)}</b>
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
