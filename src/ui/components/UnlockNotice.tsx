import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { missionById } from '../../store/missions';
import { useWipeBusy } from '../kit/wipe-store';
import { missionText, titleName, trainerName } from '../profile/club';
import { MedalIcon } from '../profile/icons';
import { TrainerSprite } from '../profile/TrainerTab';

/** O que o aviso diz: o prêmio ("Título novo: Original e Clone") e a tarefa cumprida. */
export function noticeLines(id: string): { head: string; task: string } | null {
    const m = missionById(id);
    if (!m) return null;
    const head = m.trainer
        ? t('profile.unlocked.trainer', { name: trainerName(m.trainer) })
        : t('profile.unlocked.title', { name: titleName(m.title ?? '') });
    return { head, task: missionText(m) };
}

/** Quanto o selo fica na tela (batida, pausa e saída); o próximo da fila vem depois. */
const SEAL_MS = 1200;
const OUT_MS = 220;

/**
 * Missão cumprida (treinador ou título novo): o selo dourado batendo com o sprite em cima (cara-de-jogo.md, Modais
 * e avisos), por 1,2 s, um de cada vez. Só na volta pro menu (Home), nunca durante outra comemoração: o Campeão e o
 * Resultado não mostram nada, a fila espera; com a tela coberta por uma transição (momento, porta) ou o passo a passo
 * aberto, espera também. Não pega toque.
 */
export function UnlockNotice() {
    useT(); // troca de idioma redesenha
    const id = useGame((s) => s.unlockQueue[0]);
    const shift = useGame((s) => s.shiftUnlock);
    const free = useGame((s) => s.screen === 'home' && !s.tour);
    const busy = useWipeBusy();
    const [out, setOut] = useState(false);
    const on = !!id && free && !busy;
    // biome-ignore lint/correctness/useExhaustiveDependencies: cada selo da fila (id) ganha o seu 1,2 s
    useEffect(() => {
        if (!on) return;
        setOut(false);
        const fade = window.setTimeout(() => setOut(true), SEAL_MS - OUT_MS);
        const next = window.setTimeout(shift, SEAL_MS);
        return () => {
            clearTimeout(fade);
            clearTimeout(next);
        };
    }, [on, id, shift]);
    const lines = id ? noticeLines(id) : null;
    const m = id ? missionById(id) : undefined;
    if (!on || !lines) return null;
    return createPortal(
        <div key={id} className={`unlock-seal${out ? ' out' : ''}`} role="status">
            {m?.trainer ? <TrainerSprite id={m.trainer} /> : <MedalIcon />}
            <b className="k-seal">{lines.head}</b>
        </div>,
        document.body,
    );
}
