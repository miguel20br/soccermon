import { useT } from '../../i18n/react';
import { HudIcon } from '../components/MatchHud';

/**
 * O "pronto" do duelo (escolha do time, escalação e intervalo), igual nas três telas: quem está pronto (você e o rival)
 * e o botão em 3 estados. Pronto → "Pronto! Esperando Fulano" com o "Mudar algo" (tira o pronto e destrava a tela)
 * → "Começando…" quando os dois deram (aí não volta: a fase já andou).
 */
export function ReadyBar({
    mine,
    rival,
    rivalName,
    starting,
    label,
    onReady,
    onUndo,
    note,
    compact,
}: {
    mine: boolean;
    rival: boolean;
    rivalName: string;
    /** Os dois prontos (ou o tempo acabou): trava. */
    starting: boolean;
    label: string;
    onReady: () => void;
    onUndo: () => void;
    /** Texto embaixo do botão quando ainda não deu pronto. */
    note?: string;
    /** Dentro do painel do intervalo (sem a nota). */
    compact?: boolean;
}) {
    const { t } = useT();
    const chip = (name: string, on: boolean, testid: string) => (
        <span className={`ready-chip${on ? ' on' : ''}`} data-testid={testid}>
            <b>{name}</b>
            <span>
                <i aria-hidden />
                {on ? t('duel.ready.on') : t('duel.ready.off')}
            </span>
        </span>
    );
    return (
        <div className={`ready-bar${compact ? ' compact' : ''}`}>
            <div className="ready-chips">
                {chip(t('duel.ready.you'), mine || starting, 'ready-me')}
                {chip(rivalName, rival || starting, 'ready-rival')}
            </div>
            {starting ? (
                <button type="button" className="btn wide ready-btn starting" disabled data-testid="duel-starting">
                    <HudIcon kind="lock" />
                    {t('duel.ready.starting')}
                </button>
            ) : mine ? (
                <>
                    <span className="btn wide ready-btn done" role="status" data-testid="duel-ready-done">
                        <HudIcon kind="check" />
                        {t('duel.ready.waiting', { name: rivalName })}
                    </span>
                    <button type="button" className="ready-undo" data-testid="duel-unready" onClick={onUndo}>
                        {t('duel.ready.change')}
                    </button>
                </>
            ) : (
                <button type="button" className="btn primary wide" data-testid="duel-ready-btn" onClick={onReady}>
                    {label}
                </button>
            )}
            {!compact && !starting && <p className="tactic-desc">{mine ? t('duel.ready.undoNote') : note}</p>}
        </div>
    );
}
