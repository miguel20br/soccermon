import { type ReactNode, useState } from 'react';
import { useT } from '../../i18n/react';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { stepIndex } from './beats';
import { Sheet } from './Sheet';
import './stage.css';

export interface StepOption<T> {
    value: T;
    label: string;
}

/**
 * Seletor de jogo ‹ valor › (k-stepper, cara-de-jogo.md peça 4): no lugar do `<select>` e do slider. As setas trocam
 * (e as setas do teclado também, com o foco nele); o valor fica no meio, grande. `wrap` dá a volta nas pontas (lista
 * de formações); sem ele, para (volume).
 */
export function Stepper<T>({
    value,
    options,
    onChange,
    label,
    wrap = false,
    disabled = false,
    className = '',
}: {
    value: T;
    options: readonly StepOption<T>[];
    onChange: (v: T) => void;
    label: string;
    wrap?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    const { t } = useT();
    const i = Math.max(
        0,
        options.findIndex((o) => o.value === value),
    );
    const go = (dir: -1 | 1) => {
        const j = stepIndex(i, dir, options.length, wrap);
        if (j !== i) onChange(options[j].value);
    };
    const atStart = !wrap && i === 0;
    const atEnd = !wrap && i === options.length - 1;
    return (
        // biome-ignore lint/a11y/useSemanticElements: grupo de 2 botões e o valor; um fieldset aqui herdaria estilo de formulário
        <div
            className={`k-stepper ${className}`}
            role="group"
            aria-label={label}
            onKeyDown={(e) => {
                if (disabled || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
                e.preventDefault();
                go(e.key === 'ArrowLeft' ? -1 : 1);
            }}
        >
            <button
                type="button"
                className="k-step-btn"
                aria-label={t('common.ui.prev')}
                disabled={disabled || atStart}
                onClick={() => go(-1)}
            >
                <HudIcon kind="prev" />
            </button>
            <output className="k-step-value" aria-live="polite">
                {/* a chave nova faz o valor entrar deslizando (nada teleporta) */}
                <span key={String(value)}>{options[i]?.label}</span>
            </output>
            <button
                type="button"
                className="k-step-btn"
                aria-label={t('common.ui.next')}
                disabled={disabled || atEnd}
                onClick={() => go(1)}
            >
                <HudIcon kind="next" />
            </button>
        </div>
    );
}

/** Bloco de escolha (k-option): ícone grande e 2–3 palavras; o escolhido ganha o anel azul. */
export function OptionTile({
    icon,
    label,
    sub,
    selected,
    disabled,
    onClick,
}: {
    icon: HudIconKind | ReactNode;
    label: string;
    sub?: string;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={`k-option${selected ? ' on' : ''}`}
            aria-pressed={selected}
            disabled={disabled}
            onClick={onClick}
        >
            {typeof icon === 'string' ? <HudIcon kind={icon as HudIconKind} /> : icon}
            <b>{label}</b>
            {sub && <small>{sub}</small>}
        </button>
    );
}

/**
 * "Ver tudo" do placar de TV (cara-de-jogo.md, padrão 8): a tela mostra 3 números por vez; o resto abre numa Sheet.
 */
export function SeeAll({ title, children }: { title: string; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const { t } = useT();
    return (
        <>
            <button
                type="button"
                className="k-seeall"
                aria-haspopup="dialog"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                {t('common.ui.seeAll')}
                <HudIcon kind="next" />
            </button>
            <Sheet open={open} onClose={() => setOpen(false)} title={title}>
                {children}
            </Sheet>
        </>
    );
}

/**
 * Info "?" (InfoSheet, cara-de-jogo.md peça 5): na tela fica só o botão-ícone; a regra inteira abre numa Sheet. Na
 * tela, no máximo ~12 palavras; o resto mora aqui.
 */
export function InfoSheet({
    title,
    children,
    className = '',
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const { t } = useT();
    return (
        <>
            <button
                type="button"
                className={`k-info ${className}`}
                aria-label={`${t('common.ui.howItWorks')}: ${title}`}
                aria-haspopup="dialog"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <HudIcon kind="question" />
            </button>
            <Sheet open={open} onClose={() => setOpen(false)} title={title} className="k-info-sheet">
                {children}
            </Sheet>
        </>
    );
}

/** Linha que abre uma Sheet (no lugar do `<details>`: acordeão só dentro de Sheet). */
export function SheetRow({
    icon,
    label,
    hint,
    title,
    children,
    className = '',
}: {
    icon?: HudIconKind | ReactNode;
    label: ReactNode;
    hint?: ReactNode;
    title: string;
    children: ReactNode;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                className={`k-sheetrow ${className}`}
                aria-haspopup="dialog"
                onClick={() => setOpen(true)}
            >
                {typeof icon === 'string' ? <HudIcon kind={icon as HudIconKind} /> : icon}
                <b>{label}</b>
                {hint && <span className="muted">{hint}</span>}
                <HudIcon kind="next" />
            </button>
            <Sheet open={open} onClose={() => setOpen(false)} title={title}>
                {children}
            </Sheet>
        </>
    );
}
