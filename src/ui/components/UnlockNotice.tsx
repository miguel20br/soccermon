import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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

/** Com mais de um aviso no Resultado, cada um fica isto na tela (o último, SHOW_MS). */
const ITEM_MS = 2600;

/**
 * Resultado: as conquistas da partida (gravadas no apito final, antes da tela abrir) viram um aviso que desce do topo
 * e some sozinho (antes era uma faixa fixa no meio do placar). Vários: um de cada vez, nunca empilhados (no celular
 * três avisos cobriam o placar). A fila esvazia ao abrir.
 */
export function UnlockStrip() {
    const [ids] = useState(() => useGame.getState().unlockQueue);
    const [i, setI] = useState(0);
    const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');
    useEffect(() => {
        useGame.setState({ unlockQueue: [] });
    }, []);
    useEffect(() => {
        if (i < ids.length - 1) {
            const next = window.setTimeout(() => setI(i + 1), ITEM_MS);
            return () => clearTimeout(next);
        }
        const out = window.setTimeout(() => setPhase('out'), SHOW_MS + 600);
        const gone = window.setTimeout(() => setPhase('gone'), SHOW_MS + 900);
        return () => {
            clearTimeout(out);
            clearTimeout(gone);
        };
    }, [i, ids.length]);
    if (!ids.length || phase === 'gone') return null;
    // portal: o aviso é `fixed` e a tela do resultado entra com animação (transform prenderia o `fixed`)
    return createPortal(
        <div className={`unlock-strip${phase === 'out' ? ' out' : ''}`}>
            <Unlock key={ids[i]} id={ids[i]} className="unlock-item" />
        </div>,
        document.body,
    );
}
