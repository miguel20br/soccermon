import { useState } from 'react';
import { rich, useT } from '../../i18n/react';
import { isCupInProgress, useGame } from '../../store/game-store';
import { cupStep } from './AccountLink';

/**
 * Copas guardadas (vieram de um conflito entre aparelho e conta): retomar troca de lugar com a atual (pede
 * confirmação se tiver uma em andamento), descartar pede confirmação sempre. Home de lista e Estádio.
 */
export function ParkedRuns() {
    const { t } = useT();
    const run = useGame((s) => s.run);
    const parkedRuns = useGame((s) => s.parkedRuns);
    const resumeParked = useGame((s) => s.resumeParked);
    const discardParked = useGame((s) => s.discardParked);
    const [ask, setAsk] = useState<{ kind: 'swap' | 'discard'; seed: string } | null>(null);
    const parked = parkedRuns.filter(isCupInProgress);
    const target = ask ? parked.find((p) => p.seed === ask.seed) : undefined;
    const inProgress = !!run && isCupInProgress(run);
    if (!parked.length) return null;
    if (ask && target)
        return (
            <div className="confirm-new">
                <p>
                    {ask.kind === 'swap'
                        ? rich(t('account.confirmSwap'), {
                              team: <b>{target.teamName}</b>,
                              current: <b>{run?.teamName}</b>,
                          })
                        : rich(t('account.confirmDiscard'), { team: <b>{target.teamName}</b> })}
                </p>
                <div className="row" style={{ justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="btn confirm"
                        onClick={() => {
                            if (ask.kind === 'swap') resumeParked(ask.seed);
                            else discardParked(ask.seed);
                            setAsk(null);
                        }}
                    >
                        {ask.kind === 'swap' ? t('account.confirmSwapYes') : t('account.confirmDiscardYes')}
                    </button>
                    <button type="button" className="btn ghost" onClick={() => setAsk(null)}>
                        {t('common.ui.cancel')}
                    </button>
                </div>
            </div>
        );
    return parked.map((p) => (
        <div key={p.seed} className="parked-row">
            <span className="pr-text">
                <span className="pr-label">{t('account.parkedLabel')}</span>
                <span>
                    <b>{p.teamName}</b> <span className="pr-step">· {cupStep({ ...p, played: p.results.length })}</span>
                </span>
            </span>
            <button
                type="button"
                className="btn small"
                // sem copa em andamento não há o que guardar no lugar: retoma direto
                onClick={() => (inProgress ? setAsk({ kind: 'swap', seed: p.seed }) : resumeParked(p.seed))}
            >
                {t('account.resumeParked')}
            </button>
            <button type="button" className="btn ghost small" onClick={() => setAsk({ kind: 'discard', seed: p.seed })}>
                {t('account.discardParked')}
            </button>
        </div>
    ));
}
