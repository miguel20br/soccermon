import type { ReactNode } from 'react';
import { type CSSProperties, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n/react';
import { useFitZoom } from './Stage';
import './stage.css';

/**
 * Momento (cara-de-jogo.md, peça 2): overlay de tela cheia com o fundo da marca e os raios girando, por cima de tudo
 * (até da barra de cima), pro prêmio acontecer num palco e não dentro da página. `onSkip` põe o "Pular" no canto
 * (terciário) e liga o Esc. As sheets (z 100) abrem por cima dele.
 */
export function MomentStage({
    children,
    onSkip,
    label,
    className = '',
    style,
}: {
    children: ReactNode;
    onSkip?: () => void;
    /** Nome do momento pro leitor de tela. */
    label: string;
    className?: string;
    style?: CSSProperties;
}) {
    const { t } = useT();
    const body = useRef<HTMLDivElement>(null);
    useFitZoom(body);
    useEffect(() => {
        if (!onSkip) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSkip();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onSkip]);
    const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
    return createPortal(
        <div
            className={`k-moment ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            style={style}
            // o Phaser escuta o mousedown na janela inteira: o toque aqui não chega na quadra
            onMouseDown={stop}
            onPointerDown={stop}
            onTouchStart={stop}
        >
            <i className="k-moment-rays" aria-hidden />
            {onSkip && (
                <button type="button" className="btn ghost small k-moment-skip" onClick={onSkip}>
                    {t('common.ui.skip')}
                </button>
            )}
            <div className="k-moment-body" ref={body}>
                {children}
            </div>
        </div>,
        document.body,
    );
}
