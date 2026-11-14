import type { ReactNode } from 'react';
import { HudIcon } from '../components/MatchHud';

/**
 * Aviso rápido do kit (revisao-estilo.md item 4): desce do topo com a cor da função (verde deu certo, vermelho deu
 * errado, azul só informa) e o ícone; some com fade (`data-exit`, exit-motion.ts). Quem chama decide quando tirar.
 */
export function Toast({ tone = 'info', children }: { tone?: 'ok' | 'bad' | 'info'; children: ReactNode }) {
    return (
        <div className={`k-toast tone-${tone}`} role="status" data-exit>
            <HudIcon kind={tone === 'ok' ? 'check' : tone === 'bad' ? 'close' : 'bulb'} />
            <span>{children}</span>
        </div>
    );
}
