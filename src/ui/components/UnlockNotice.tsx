import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { missionById } from '../../store/missions';
import { missionText, titleName, trainerName } from '../profile/club';
import { MedalIcon } from '../profile/icons';
import { TrainerSprite } from '../profile/TrainerTab';

const SHOW_MS = 4200;

/** O que o aviso diz: o prêmio ("Título novo: Original e Clone") e a tarefa cumprida. */
export function noticeLines(id: string): { head: string; task: string } | null {
    const m = missionById(id);
    if (!m) return null;
    const head = m.trainer
        ? t('profile.unlocked.trainer', { name: trainerName(m.trainer) })
        : t('profile.unlocked.title', { name: titleName(m.title ?? '') });
    return { head, task: missionText(m) };
}

function Unlock({ id, className }: { id: string; className: string }) {
    useT(); // troca de idioma redesenha
    const lines = noticeLines(id);
    const m = missionById(id);
    if (!lines) return null;
    return (
        <div className={className} role="status">
            {m?.trainer ? <TrainerSprite id={m.trainer} /> : <MedalIcon />}
            <span>
                <b>{lines.head}</b>
                <small>{lines.task}</small>
            </span>
        </div>
    );
}

/**
 * Home: aviso pequeno das missões que saíram fora de partida (retroativas, ao abrir o jogo), um de cada vez,
 * em cima da quadra do topo (enfeite). Não pega toque e some sozinho. Nas outras telas a fila espera.
 */
export function UnlockNotice() {
    const id = useGame((s) => s.unlockQueue[0]);
    const shift = useGame((s) => s.shiftUnlock);
    const home = useGame((s) => s.screen === 'home');
    useEffect(() => {
        if (!id || !home) return;
        const timer = window.setTimeout(shift, SHOW_MS);
        return () => clearTimeout(timer);
    }, [id, home, shift]);
    return id && home ? <Unlock key={id} id={id} className="unlock-notice" /> : null;
}

/**
 * Resultado: as conquistas da partida (gravadas no apito final, antes da tela abrir) numa faixa no meio da página,
 * embaixo do placar (fixa no topo ela cobria o placar). Ficam enquanto a tela está aberta; a fila esvazia.
 */
export function UnlockStrip() {
    const [ids] = useState(() => useGame.getState().unlockQueue);
    useEffect(() => {
        useGame.setState({ unlockQueue: [] });
    }, []);
    if (!ids.length) return null;
    return (
        <div className="unlock-strip">
            {ids.map((id) => (
                <Unlock key={id} id={id} className="unlock-item" />
            ))}
        </div>
    );
}
