import type { ReactNode } from 'react';
import { species } from '../../engine/data';
import { possessionByPeriod } from '../../engine/match-stats';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { SNAP_STRIDE } from '../../engine/state';
import { useT } from '../../i18n/react';
import { snapAt } from '../match-view';

/**
 * Intervalo de verdade (estilo Retro Bowl/FM): a partida para, mostra como foi o 1º tempo e uma dica, e o técnico
 * decide (tática e substituição continuam nos controles de sempre). Nada muda sozinho: "Continuar" segue o jogo.
 */
export function HalftimePanel({
    match,
    names,
    nameOf,
    onContinue,
    onSub,
    canSub,
    side = 0,
    footer,
    pending,
    suggest,
    readyText,
}: {
    /** Duelo: você já deu pronto (o botão vira "Pronto! Esperando…" e trava). */
    readyText?: string | null;
    /** Troca já marcada pro 2º tempo (aparece dentro do painel, perto dos botões). */
    pending?: ReactNode;
    /** Sugestão de troca: só abre o Substituir com quem está cansado marcado (nada troca sozinho). */
    suggest?: { text: string; onPick: () => void } | null;
    match: MatchResult;
    names: [string, string];
    /** Lado do jogador (no duelo, o convidado é o 1). */
    side?: 0 | 1;
    /** No duelo: cronômetro e quem já está pronto. */
    footer?: ReactNode;
    /** Nome de quem está na vaga `idx` (do seu time) no intervalo. */
    nameOf: (idx: number) => string;
    onContinue: () => void;
    onSub: () => void;
    canSub: boolean;
}) {
    const { t } = useT();
    const ht = match.events.find((e) => e.type === 'halftime');
    if (ht?.type !== 'halftime') return null;
    const team = (idx: number) => match.roster[idx]?.team ?? 0;
    const shots = [0, 0];
    for (const e of match.events) if (e.type === 'shot' && e.tick <= ht.tick) shots[team(e.by)]++;
    const first = possessionByPeriod(match).slice(0, 4);
    const homePoss = first.length ? Math.round((first.reduce((s, p) => s + p.home, 0) / first.length) * 100) : 50;
    const poss = side === 0 ? homePoss : 100 - homePoss;
    const rival = side === 0 ? 1 : 0;
    // quem do seu time está mais cansado agora
    // fôlego de quem vai começar o 2º tempo (com as trocas feitas no intervalo)
    const ko = match.events.find((e) => e.type === 'kickoff' && e.tick > ht.tick)?.tick ?? ht.tick;
    const snap = snapAt(match.snapshots, ko);
    const mine = match.roster.filter((p) => p.team === side).map((p) => p.idx);
    // evoluções do rival no 1º tempo: lembrete pra quem piscou
    const rivalEvos = match.events.flatMap((e) =>
        e.type === 'evolve' && e.team !== side && e.tick <= ht.tick
            ? [`${species(e.from).name} → ${species(e.into).name}`]
            : [],
    );
    const tired = mine
        .map((idx) => ({ idx, energy: snap.p[idx * SNAP_STRIDE + 6] ?? 1 }))
        .sort((a, b) => a.energy - b.energy)[0];

    const tip =
        tired && tired.energy < 0.4
            ? t('match.ht.tipTired', { name: nameOf(tired.idx), p: Math.round(tired.energy * 100) })
            : shots[rival] >= shots[side] + 3
              ? t('match.ht.tipShots', { a: shots[rival], b: shots[side] })
              : poss >= 60 && shots[side] <= shots[rival]
                ? t('match.ht.tipPossession')
                : ht.score[side] > ht.score[rival]
                  ? t('match.ht.tipAhead')
                  : t('match.ht.tipEven');

    return (
        <div className="ht-panel" role="dialog" aria-label={t('match.halftime')}>
            <span className="ht-title">{t('match.halftime')}</span>
            <b className="ht-score">
                {names[0]} {ht.score[0]} x {ht.score[1]} {names[1]}
            </b>
            <dl className="ht-stats">
                <div>
                    <dt>{t('match.ht.shots')}</dt>
                    <dd>
                        {shots[side]} x {shots[rival]}
                    </dd>
                </div>
                <div>
                    <dt>{t('match.ht.possession')}</dt>
                    <dd>{poss}%</dd>
                </div>
                {tired && (
                    <div>
                        <dt>{t('match.ht.tired')}</dt>
                        <dd>
                            {nameOf(tired.idx)} {Math.round(tired.energy * 100)}%
                        </dd>
                    </div>
                )}
                {rivalEvos.length > 0 && (
                    <div className="ht-rival-evo">
                        <dt>{t('match.ht.rivalEvo')}</dt>
                        <dd>{rivalEvos.join(', ')}</dd>
                    </div>
                )}
            </dl>
            <p className="ht-tip">{tip}</p>
            {suggest && (
                <button type="button" className="ht-suggest" onClick={suggest.onPick}>
                    {suggest.text}
                </button>
            )}
            {pending && <p className="ht-pending">{pending}</p>}
            <div className="ht-actions">
                <button type="button" className="btn yellow" disabled={!canSub} onClick={onSub}>
                    {t('match.substitute')}
                </button>
                <button type="button" className="btn primary" disabled={!!readyText} onClick={onContinue}>
                    {readyText || t('match.ht.continue')}
                </button>
            </div>
            {footer}
            <small className="muted">{t('match.ht.tacticHint')}</small>
        </div>
    );
}
