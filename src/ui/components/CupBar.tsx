import { cupStageName, cupStageShort, dict, type Lang } from '../../i18n';
import { useT } from '../../i18n/react';
import { hasShop, type RunState, type Screen, useGame } from '../../store/game-store';
import { cupMatchNow, isLong } from '../../store/long-cup';
import { HudIcon } from './MatchHud';

/** "Partida 4 de 8" / "4/8" da Rota: a mesma partida do "Continuar" (`cupMatchNow`). */
export function cupBarStage(run: RunState, screen: Screen, lang: Lang) {
    const at = cupMatchNow({ ...run, played: run.results.length }, screen === 'result');
    return { full: cupStageName(run, at, lang), short: cupStageShort(run, at, dict(lang).match.stageShort) };
}

/**
 * Barra da copa (revamp-ui §2.2, 0.9.23): no lugar do logo, nas telas de dentro da copa. Voltar à esquerda, a fase em
 * placa e o que você tem na copa (₽ e sorteios) com o número contornado.
 */
export function CupBar({ onBack }: { onBack: () => void }) {
    const run = useGame((s) => s.run);
    const screen = useGame((s) => s.screen);
    const { t, d, lang } = useT();
    if (!run) return null;
    const stage = isLong(run) ? cupBarStage(run, screen, lang) : null;
    const money = hasShop(run) || isLong(run);
    return (
        <div className="k-cupbar">
            <button type="button" className="k-icon-btn" onClick={onBack} aria-label={t('common.ui.backHome')}>
                <HudIcon kind="prev" />
            </button>
            {/* Relâmpago: o nome curto ("Quartas de final" cortava com ₽ de 2 dígitos); Rota: "Partida 3 de 8" */}
            <span className="k-cupbar-stage">
                {stage ? (
                    <>
                        <span className="k-cupbar-full">{stage.full}</span>
                        {/* 320: "Partida 3 de 8" cortava em "Partida…" ao lado do ₽; lá vai "3/8" */}
                        <span className="k-cupbar-short">{stage.short}</span>
                    </>
                ) : (
                    d.match.stageShort[run.stage]
                )}
            </span>
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
