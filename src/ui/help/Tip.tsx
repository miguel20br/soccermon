import { type ReactNode, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import './help.css';

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
 * Dica contextual de uma linha. Aparece só com "Dicas" ligado nas configurações e até o jogador fechar;
 * fechada, não volta mais neste aparelho.
 */
export function Tip({ id, children }: { id: string; children: ReactNode }) {
    const enabled = useGame((s) => s.settings.tips);
    const [hidden, setHidden] = useState(() => readDismissed().includes(id));
    const { d } = useT();
    if (!enabled || hidden) return null;
    return (
        <div className="tip bc-surface bc-stripe" role="note">
            <svg className="tip-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1.5a4.5 4.5 0 0 0-2.6 8.2c.4.3.6.7.6 1.1V12h4v-1.2c0-.4.2-.8.6-1.1A4.5 4.5 0 0 0 8 1.5Z" />
                <rect x="6" y="13" width="4" height="1.6" rx=".6" />
            </svg>
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
                <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                </svg>
            </button>
        </div>
    );
}
