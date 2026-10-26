import { cupStageName } from '../../i18n';
import { useT } from '../../i18n/react';
import { hasShop, useGame } from '../../store/game-store';
import { isLong } from '../../store/long-cup';
import { HudIcon } from './MatchHud';

/**
 * Barra da copa (revamp-ui §2.2, 0.9.23): no lugar do logo, nas telas de dentro da copa. Voltar à esquerda, a fase em
 * placa e o que você tem na copa (₽ e sorteios) com o número contornado.
 */
export function CupBar({ onBack }: { onBack: () => void }) {
    const run = useGame((s) => s.run);
    const { t, lang } = useT();
    if (!run) return null;
    const money = hasShop(run) || isLong(run);
    return (
        <div className="k-cupbar">
            <button type="button" className="k-icon-btn" onClick={onBack} aria-label={t('common.ui.backHome')}>
                <HudIcon kind="prev" />
            </button>
            <span className="k-cupbar-stage">{cupStageName(run, run.stage, lang)}</span>
            {money && (
                <span className="k-res" role="img" aria-label={t('common.ui.cupMoney', { n: run.money ?? 0 })}>
                    <i className="k-res-coin" aria-hidden>
                        ₽
                    </i>
                    <b className="cb-num">{run.money ?? 0}</b>
                </span>
            )}
            <span className="k-res" role="img" aria-label={t('common.ui.cupRerolls', { n: run.rerolls })}>
                <HudIcon kind="reroll" />
                <b className="cb-num">{run.rerolls}</b>
            </span>
        </div>
    );
}
