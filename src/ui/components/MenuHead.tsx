import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useT } from '../../i18n/react';
import { type Screen, useGame } from '../../store/game-store';
import { HudIcon, type HudIconKind } from './MatchHud';
import { MenuIcon, type MenuIconKind } from './MenuIcon';

/**
 * Telas de menu: em cima, a mesma barra dos ambientes (voltar, treinador, Novidades, Ajuda e Configurações, App.tsx).
 * Partida e draft não, pra ninguém sair sem querer; o Duelo com o jogo rolando só mostra o voltar (que confirma).
 */
export const MENU_SCREENS: Screen[] = [
    'settings',
    'credits',
    'help',
    'profile',
    'collection',
    'trophies',
    'daily',
    'liga',
    'duel',
];

/** O voltar da tela de menu aberta: o MenuHead entrega, o botão da barra de cima chama (um voltar só, no mesmo lugar). */
export const useMenuBack = create<{ back: (() => void) | null }>(() => ({ back: null }));

/** Cabeçalho das telas de menu em forma de placar: etiqueta em cima, ícone e título (o voltar fica na barra de cima). */
export function MenuHead({
    title,
    icon,
    hud,
    onBack,
    tag,
}: {
    title: string;
    /** Ilustração do menu; ou `hud`, o mesmo ícone de traço que a tela tem na Home (Liga, Duelo, Rota…). */
    icon?: MenuIconKind;
    hud?: HudIconKind;
    /** Sem `onBack` = sem seta (nas telas da copa o voltar é o da barra da copa). */
    onBack?: () => void;
    /** Etiqueta amarela em cima do placar (sem = nenhuma). */
    tag?: string;
}) {
    const { t } = useT();
    // nas telas de menu o voltar vai pra barra de cima; nos laboratórios (sem barra) fica no placar
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
        </header>
    );
}
