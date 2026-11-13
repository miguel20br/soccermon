import { rich, useT } from '../../i18n/react';
import { type DuelRecord, rivalTally } from '../../store/duels';
import { TrainerName } from '../profile/TrainerName';
import './duel-history.css';

/** V/D/E/A de um duelo (histórico e série). */
export function resultLetter(res: DuelRecord['result'], t: ReturnType<typeof useT>['t']): string {
    return res === 'win'
        ? t('duel.result.win')
        : res === 'loss'
          ? t('duel.result.loss')
          : res === 'void'
            ? t('duel.result.voidShort')
            : t('duel.result.drawShort');
}

/**
 * Seus duelos: os últimos 8 com o placar de cada um. No fim do duelo (`rival`) vem o placar geral contra ele em cima;
 * na Arena (sem `rival`), o placar contra cada amigo. Mora fora do Duel.tsx pra Arena não baixar a sala inteira.
 */
export function DuelHistory({ duels, rival }: { duels: DuelRecord[]; rival?: string }) {
    const { t, tn } = useT();
    const vs = rival === undefined ? null : duels.filter((h) => h.rival === rival && h.result !== 'void');
    return (
        <>
            {vs && vs.length > 0 && (
                <p className="duel-h2h" data-testid="duel-h2h">
                    <span className="muted">{t('duel.result.h2hLabel')}</span>{' '}
                    <b>
                        {t('duel.result.h2h', {
                            w: vs.filter((h) => h.result === 'win').length,
                            l: vs.filter((h) => h.result === 'loss').length,
                            name: rival ?? '',
                        })}
                    </b>
                    {vs.some((h) => h.result === 'draw') && (
                        <span className="muted">
                            {' · '}
                            {tn('duel.result.h2hDraws', vs.filter((h) => h.result === 'draw').length)}
                        </span>
                    )}
                </p>
            )}
            {!vs && (
                <>
                    <h3 className="bc-lbl">{t('duel.result.vsEach')}</h3>
                    {rivalTally(duels).map((r) => (
                        <div key={r.rivalCode ?? `${r.rival}\n${r.rivalClub}`} className="duel-hrow tally">
                            <span>
                                <TrainerName who={{ trainer: r.rival, club: r.rivalClub, code: r.rivalCode }} />
                            </span>
                            <b data-testid="duel-tally">
                                {r.win} x {r.loss}
                                {r.draw > 0 && <small className="muted"> · {tn('duel.result.h2hDraws', r.draw)}</small>}
                            </b>
                        </div>
                    ))}
                    <h3 className="bc-lbl">{t('duel.result.recent')}</h3>
                </>
            )}
            {duels.slice(0, 8).map((h) => (
                <div key={h.id} className="duel-hrow">
                    <i className={h.result}>{resultLetter(h.result, t)}</i>
                    <span>
                        {rich(t('duel.result.vs'), {
                            name: <TrainerName who={{ trainer: h.rival, club: h.rivalClub, code: h.rivalCode }} />,
                        })}
                    </span>
                    <b>
                        {h.bestOf === 3 && `${t('duel.series.short')} `}
                        {h.wo ? 'W.O.' : `${h.score[0]} x ${h.score[1]}`}
                    </b>
                </div>
            ))}
        </>
    );
}
