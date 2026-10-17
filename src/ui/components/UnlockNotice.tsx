import { useEffect } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { missionById } from '../../store/missions';
import { titleName, trainerName } from '../profile/club';
import { MedalIcon } from '../profile/icons';
import { TrainerSprite } from '../profile/TrainerTab';

const SHOW_MS = 3600;

/**
 * Aviso discreto de missão cumprida ("Treinador novo desbloqueado: Brock"), um de cada vez, na fila do
 * store. Não pega toque (não atrapalha a tela de baixo) e some sozinho.
 */
export function UnlockNotice() {
    const id = useGame((s) => s.unlockQueue[0]);
    const shift = useGame((s) => s.shiftUnlock);
    const { t } = useT();
    useEffect(() => {
        if (!id) return;
        const timer = window.setTimeout(shift, SHOW_MS);
        return () => clearTimeout(timer);
    }, [id, shift]);
    const m = id ? missionById(id) : undefined;
    if (!m) return null;
    return (
        <div key={id} className="unlock-notice" role="status">
            {m.trainer ? <TrainerSprite id={m.trainer} /> : <MedalIcon />}
            <span>
                {m.trainer
                    ? t('profile.unlocked.trainer', { name: trainerName(m.trainer) })
                    : t('profile.unlocked.title', { name: titleName(m.title ?? '') })}
            </span>
        </div>
    );
}
