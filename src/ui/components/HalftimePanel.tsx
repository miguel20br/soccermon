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
}: {
    match: MatchResult;
    names: [string, string];
    /** Nome de quem está na vaga `idx` (time 0) no intervalo. */
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
    const poss = first.length ? Math.round((first.reduce((s, p) => s + p.home, 0) / first.length) * 100) : 50;
    // quem do seu time está mais cansado agora
    const snap = snapAt(match.snapshots, ht.tick);
    const mine = match.roster.filter((p) => p.team === 0).map((p) => p.idx);
    const tired = mine
        .map((idx) => ({ idx, energy: snap.p[idx * SNAP_STRIDE + 6] ?? 1 }))
        .sort((a, b) => a.energy - b.energy)[0];

    const tip =
        tired && tired.energy < 0.4
            ? t('match.ht.tipTired', { name: nameOf(tired.idx), p: Math.round(tired.energy * 100) })
            : shots[1] >= shots[0] + 3
              ? t('match.ht.tipShots', { a: shots[1], b: shots[0] })
              : poss >= 60 && shots[0] <= shots[1]
                ? t('match.ht.tipPossession')
                : ht.score[0] > ht.score[1]
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
                        {shots[0]} x {shots[1]}
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
            </dl>
            <p className="ht-tip">{tip}</p>
            <div className="ht-actions">
                <button type="button" className="btn yellow" disabled={!canSub} onClick={onSub}>
                    {t('match.substitute')}
                </button>
                <button type="button" className="btn primary" onClick={onContinue}>
                    {t('match.ht.continue')}
                </button>
            </div>
            <small className="muted">{t('match.ht.tacticHint')}</small>
        </div>
    );
}
