import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { useT } from '../i18n/react';
import { useDuel } from '../net/session';
import { useGame } from '../store/game-store';
import './leave-guard.css';

/**
 * Confirmação ao sair de uma partida em andamento (Configurações > Partida). Sair no meio não perde nada:
 * a partida fica travada e volta do mesmo ponto (`run.live`), então o aviso é só para não sair sem querer.
 */
const useLeave = create<{ pending: (() => void) | null }>(() => ({ pending: null }));

/** Partida rolando: tela da partida, time travado e sem resultado gravado. */
function matchInProgress() {
    const { screen, run } = useGame.getState();
    if (screen === 'duel')
        return ['team', 'draft', 'preview', 'match'].includes(useDuel.getState().shared?.phase ?? '');
    return screen === 'match' && run?.status === 'lineup' && !!run.lockedTeam;
}

/** Sai da partida (ou de onde estiver) pedindo confirmação se a configuração mandar. */
export function requestLeave(leave: () => void) {
    if (matchInProgress() && useGame.getState().settings.confirmLeave) useLeave.setState({ pending: leave });
    else leave();
}

/** Janela "Sair da partida?" (fica montada na tela da partida). */
export function LeaveConfirm() {
    const pending = useLeave((s) => s.pending);
    const stay = useRef<HTMLButtonElement>(null);
    const { t } = useT();
    useEffect(() => {
        if (!pending) return;
        stay.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') useLeave.setState({ pending: null });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [pending]);
    // ao sair da tela da partida por outro caminho, a pergunta some junto
    useEffect(() => () => useLeave.setState({ pending: null }), []);
    if (!pending) return null;
    const close = () => useLeave.setState({ pending: null });
    // portal: dentro da quadra o `position: fixed` ficaria preso ao contêiner dela
    return createPortal(
        // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; Esc e os botões cobrem o teclado
        <div
            className="modal-backdrop leave-backdrop"
            role="presentation"
            onClick={close}
            // o Phaser escuta mousedown na janela inteira: sem isso, tocar aqui "tocaria" no Pokémon embaixo
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche a janela */}
            <div
                className="panel leave-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="leave-title"
                aria-describedby="leave-text"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="leave-title">{t('settings.leave.title')}</h2>
                <p id="leave-text">{t('settings.leave.text')}</p>
                <div className="leave-actions">
                    <button ref={stay} type="button" className="btn" onClick={close}>
                        {t('settings.leave.stay')}
                    </button>
                    <button
                        type="button"
                        className="btn primary"
                        onClick={() => {
                            close();
                            pending();
                        }}
                    >
                        {t('settings.leave.leave')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
