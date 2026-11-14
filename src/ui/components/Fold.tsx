import { type ReactNode, useId, useState } from 'react';

/**
 * Bloco recolhível: o cabeçalho é um botão com `aria-expanded`; o conteúdo abre e fecha com transição de altura
 * (nada teleporta). Fechado, o conteúdo fica `inert` (fora do foco e do leitor de tela). `open` inicial: no PC
 * abre, no celular em pé fecha (quem chama decide).
 */
export function Fold({
    label,
    summary,
    defaultOpen = false,
    children,
}: {
    label: string;
    /** Valor atual, mostrado ao lado do título enquanto fechado. */
    summary?: ReactNode;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();
    return (
        <div className={`fold${open ? ' open' : ''}`}>
            <button
                type="button"
                className="fold-head"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen(!open)}
            >
                <span className="bc-lbl">{label}</span>
                {summary && <span className="fold-sum">{summary}</span>}
                <i className="fold-chev" aria-hidden="true" />
            </button>
            <div className="fold-body" id={id} inert={!open}>
                <div>{children}</div>
            </div>
        </div>
    );
}

/** Celular em pé (ou estreito): começa fechado. */
export const foldOpenByDefault = () =>
    typeof window === 'undefined' || !window.matchMedia('(max-width: 600px)').matches;
