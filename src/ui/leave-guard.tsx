import { useEffect } from 'react';
import { create } from 'zustand';
import { useT } from '../i18n/react';
import { useDuel } from '../net/session';
import { useGame } from '../store/game-store';
import { ConfirmSheet } from './kit/Sheet';

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

/** Voltar do sistema: com partida rolando abre a confirmação mesmo se a configuração pedir para não perguntar. */
export function requestBack(leave: () => void) {
    if (matchInProgress()) useLeave.setState({ pending: leave });
    else leave();
}

/** "Sair da partida?" em sheet (fica montada na tela da partida). */
export function LeaveConfirm() {
    const pending = useLeave((s) => s.pending);
    const { t } = useT();
    // ao sair da tela da partida por outro caminho, a pergunta some junto
    useEffect(() => () => useLeave.setState({ pending: null }), []);
    return (
        <ConfirmSheet
            open={!!pending}
            onClose={() => useLeave.setState({ pending: null })}
            title={t('settings.leave.title')}
            text={t('settings.leave.text')}
            cancel={t('settings.leave.stay')}
            confirm={t('settings.leave.leave')}
            onConfirm={() => pending?.()}
        />
    );
}
