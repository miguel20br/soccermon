import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n/react';
import { HudIcon } from '../components/MatchHud';

/**
 * A sheet do kit (revamp-ui §2.2): no celular sobe de baixo, onde o dedo está; no desktop é a janela do meio. Fecha
 * no X vermelho, tocando fora ou com Esc. A saída usa o fantasma do `exit-motion.ts` (desce em vez de sumir).
 * Portal no `body`: dentro da quadra o `position: fixed` ficaria preso ao contêiner dela.
 */
export function Sheet({
    open,
    onClose,
    title,
    children,
    className = '',
    alert,
}: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    className?: string;
    /** Confirmação: `alertdialog` e sem o X (quem decide são os dois botões). */
    alert?: boolean;
}) {
    const id = useId();
    const box = useRef<HTMLDivElement>(null);
    const { t } = useT();
    useEffect(() => {
        if (!open) return;
        // o foco entra na folha: o 1º botão marcado com data-autofocus, senão a própria folha
        (box.current?.querySelector<HTMLElement>('[data-autofocus]') ?? box.current)?.focus();
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
    return createPortal(
        // biome-ignore lint/a11y/noStaticElementInteractions: tocar fora fecha; Esc e os botões cobrem o teclado
        <div
            className="modal-backdrop k-sheet-back"
            role="presentation"
            onClick={onClose}
            // o Phaser escuta mousedown na janela inteira: sem isso, tocar aqui "tocaria" na quadra embaixo
            onMouseDown={stop}
            onPointerDown={stop}
            onTouchStart={stop}
        >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions lint/a11y/useAriaPropsSupportedByRole: só impede que o toque dentro feche; o papel (dialog ou alertdialog) vem da prop */}
            <div
                ref={box}
                tabIndex={-1}
                className={`modal panel k-sheet ${className}`}
                role={alert ? 'alertdialog' : 'dialog'}
                aria-modal="true"
                aria-labelledby={id}
                onClick={stop}
            >
                <i className="k-sheet-grab" aria-hidden />
                {!alert && (
                    <button
                        type="button"
                        className="modal-close k-sheet-x"
                        onClick={onClose}
                        aria-label={t('common.ui.close')}
                    >
                        <HudIcon kind="close" />
                    </button>
                )}
                <h2 id={id}>{title}</h2>
                {children}
            </div>
        </div>,
        document.body,
    );
}

/** Confirmação curta em sheet: título, o que se perde numa linha, "Cancelar" à esquerda e o perigo à direita. */
export function ConfirmSheet({
    open,
    onClose,
    title,
    text,
    confirm,
    onConfirm,
    cancel,
    quiet,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    text: string;
    confirm: string;
    onConfirm: () => void;
    cancel?: string;
    /** O `onConfirm` toca o próprio som (leaveWith): o botão fica calado. */
    quiet?: boolean;
}) {
    const { t } = useT();
    return (
        <Sheet open={open} onClose={onClose} title={title} alert className="k-confirm">
            <p>{text}</p>
            <div className="k-confirm-actions">
                <button type="button" className="btn ghost" onClick={onClose} data-autofocus>
                    {cancel ?? t('common.ui.cancel')}
                </button>
                <button
                    type="button"
                    className="btn danger"
                    data-fx={quiet ? 'none' : undefined}
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                >
                    {confirm}
                </button>
            </div>
        </Sheet>
    );
}
