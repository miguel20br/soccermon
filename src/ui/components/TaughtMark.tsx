import type { PokemonInstance } from '../../engine/instance';
import { isTaught } from '../../engine/modifiers';
import { useT } from '../../i18n/react';
import './tm.css';

/**
 * Selo "MT" ao lado do nome do golpe ensinado por MT (golpe treinado: `TAUGHT_MOVE`) nas listas de golpes (carta,
 * painel, prévia). Fora do TmTeach pra carta não puxar o áudio da recompensa.
 */
export function TaughtMark({ inst, move }: { inst: PokemonInstance; move: string }) {
    const { t } = useT();
    if (!isTaught(inst, move)) return null;
    return (
        <span className="tm-mark" title={t('reward.tm.taughtTitle')}>
            {t('reward.tm.tm')}
        </span>
    );
}
