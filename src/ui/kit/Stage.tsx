import type { ReactNode } from 'react';
import './stage.css';

/**
 * Palco (cara-de-jogo.md, peça 1): a tela de jogo que não rola. Ocupa a altura da tela embaixo da barra de cima, com
 * a cena de fundo (`scene`, decoração), no máximo um bloco de conteúdo no meio e a ação gorda no polegar (`action`,
 * vai pra `.bc-thumbbar`). O que não couber mora numa Sheet.
 */
export function Stage({
    scene,
    action,
    children,
    className = '',
}: {
    scene?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`k-stage ${className}`}>
            {scene && (
                <div className="k-stage-scene" aria-hidden>
                    {scene}
                </div>
            )}
            <div className="k-stage-body">{children}</div>
            {action && <div className="bc-thumbbar k-stage-action">{action}</div>}
        </div>
    );
}
