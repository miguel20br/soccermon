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

/** Instruções fixas e Dicas só na 1ª copa (até terminar uma) e com "Dicas" ligado; depois, só pelo "?" (Ajuda). */
export const useFirstCup = () => useGame((s) => s.settings.tips && s.records.cups === 0);

/** Qual dica já falou em cada sequência de telas (`seq`): a 1ª que aparece fica com a sequência. Só nesta visita. */
const seqOwner = new Map<string, string>();

/** A sequência Resultado → Recompensa → Mercado de uma partida da copa. */
export const tipSeq = (run: { seed: string; results: readonly unknown[] }) => `${run.seed}:${run.results.length}`;

/** Esta dica pode falar nesta sequência? A primeira a perguntar fica com ela; as outras se calam. */
export function claimTipSeq(seq: string, id: string): boolean {
    const owner = seqOwner.get(seq);
    if (owner && owner !== id) return false;
    seqOwner.set(seq, id);
    return true;
}

/**
 * Dica contextual de uma linha, perto da coisa que ela explica. Aparece só na 1ª copa (até terminar uma), com "Dicas"
 * ligado nas configurações e até o jogador fechar; fechada, não volta mais neste aparelho. Com `seq`, uma dica só por
 * sequência de telas (a regra 8 da revisão de telas): a que falou primeiro na sequência cala as outras.
 */
export function Tip({ id, seq, children }: { id: string; seq?: string; children: ReactNode }) {
    const enabled = useFirstCup();
    const [hidden, setHidden] = useState(() => readDismissed().includes(id));
    const { d } = useT();
    if (!enabled || hidden || (seq && !claimTipSeq(seq, id))) return null;
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
