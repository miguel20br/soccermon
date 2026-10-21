import { type ReactNode, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import './help.css';
import { HudIcon } from '../components/MatchHud';

/** Dicas fechadas ficam neste aparelho (é só conveniência; não vai pro save nem pra nuvem). */
const KEY = 'soccermon-tips';

function readDismissed(): string[] {
    try {
        const raw = localStorage.getItem(KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

function dismiss(id: string) {
    try {
        const list = readDismissed();
        if (!list.includes(id)) localStorage.setItem(KEY, JSON.stringify([...list, id]));
    } catch {
        // sem localStorage (aba anônima, bloqueado): a dica só some nesta visita
    }
}

/** Esquece as dicas fechadas (pra elas voltarem). */
export function resetTips() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // nada a fazer
    }
}

/**
 * Dica contextual de uma linha, perto da coisa que ela explica. Aparece só na 1ª copa (até terminar uma), com "Dicas"
 * ligado nas configurações e até o jogador fechar; fechada, não volta mais neste aparelho.
 */
export function Tip({ id, children }: { id: string; children: ReactNode }) {
    const enabled = useGame((s) => s.settings.tips && s.records.cups === 0);
    const [hidden, setHidden] = useState(() => readDismissed().includes(id));
    const { d } = useT();
    if (!enabled || hidden) return null;
    return (
        <div className="tip bc-surface bc-stripe" role="note">
            <HudIcon kind="bulb" className="tip-icon" />
            <span className="tip-text">
                <b>{d.help.tip.label}</b> {children}
            </span>
            <button
                type="button"
                className="tip-close"
                aria-label={d.help.tip.close}
                onClick={() => {
                    dismiss(id);
                    setHidden(true);
                }}
            >
                <HudIcon kind="close" />
            </button>
        </div>
    );
}
