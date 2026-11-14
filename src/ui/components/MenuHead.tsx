import { type ReactNode, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { MENU_SCREENS } from '../back-nav';
import { HudIcon, type HudIconKind } from './MatchHud';
import { MenuIcon, type MenuIconKind } from './MenuIcon';

/** O voltar da tela de menu aberta: o MenuHead entrega, o botão da barra de cima chama (um voltar só, no mesmo lugar). */
export const useMenuBack = create<{ back: (() => void) | null }>(() => ({ back: null }));

/**
 * Entrega o voltar da tela pra barra de cima (telas de palco sem o placar do MenuHead usam direto). Devolve se a
 * tela tem a barra (nos laboratórios, sem barra, o voltar fica no placar).
 */
export function useMenuBackOf(onBack?: () => void): boolean {
    const inBar = MENU_SCREENS.includes(useGame((s) => s.screen));
    const ref = useRef(onBack);
    ref.current = onBack;
    const register = inBar && !!onBack;
    useEffect(() => {
        if (!register) return;
        const fn = () => ref.current?.();
        useMenuBack.setState({ back: fn });
        return () => {
            if (useMenuBack.getState().back === fn) useMenuBack.setState({ back: null });
        };
    }, [register]);
    return inBar;
}

/** Cabeçalho das telas de menu em forma de placar: etiqueta em cima, ícone e título (o voltar fica na barra de cima). */
export function MenuHead({
    title,
    icon,
    hud,
    onBack,
    tag,
    info,
    side,
}: {
    title: string;
    /** Ilustração do menu; ou `hud`, o mesmo ícone de traço que a tela tem na Home (Liga, Duelo, Rota…). */
    icon?: MenuIconKind;
    hud?: HudIconKind;
    /** Sem `onBack` = sem seta (nas telas da copa o voltar é o da barra da copa). */
    onBack?: () => void;
    /** Etiqueta amarela em cima do placar (sem = nenhuma). */
    tag?: string;
    /** O "?" do título (um `InfoSheet`): explica a tela toda, no lugar de um por linha. */
    info?: ReactNode;
    /** No canto direito do placar (a carteira do Time Ultimate, como no FC). */
    side?: ReactNode;
}) {
    const { t } = useT();
    const inBar = useMenuBackOf(onBack);
    return (
        <header className="menu-head bc-screenhead">
            {/* a barra de cima já diz onde você está: a etiqueta só quando a tela tem uma de verdade (ex.: Rota Índigo) */}
            {tag && <span className="bc-tag">{tag}</span>}
            {onBack && !inBar && (
                <button type="button" className="k-icon-btn back-btn" onClick={onBack} aria-label={t('common.ui.back')}>
                    <HudIcon kind="prev" />
                </button>
            )}
            {hud ? <HudIcon kind={hud} className="menu-head-ic" /> : icon && <MenuIcon kind={icon} />}
            <h1>{title}</h1>
            {info}
            {side && <span className="menu-head-side">{side}</span>}
        </header>
    );
}
