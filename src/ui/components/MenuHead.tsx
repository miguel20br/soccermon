import { useT } from '../../i18n/react';
import { HudIcon, type HudIconKind } from './MatchHud';
import { MenuIcon, type MenuIconKind } from './MenuIcon';

/** Cabeçalho das telas de menu em forma de placar: etiqueta em cima, voltar, ícone e título. */
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
    return (
        <header className="menu-head bc-screenhead">
            {/* a barra de cima já diz onde você está: a etiqueta só quando a tela tem uma de verdade (ex.: Rota Índigo) */}
            {tag && <span className="bc-tag">{tag}</span>}
            {onBack && (
                <button type="button" className="k-icon-btn back-btn" onClick={onBack} aria-label={t('common.ui.back')}>
                    <HudIcon kind="prev" />
                </button>
            )}
            {hud ? <HudIcon kind={hud} className="menu-head-ic" /> : icon && <MenuIcon kind={icon} />}
            <h1>{title}</h1>
        </header>
    );
}
