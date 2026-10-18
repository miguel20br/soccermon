import { useT } from '../../i18n/react';
import { MenuIcon, type MenuIconKind } from './MenuIcon';

/** Cabeçalho das telas de menu em forma de placar: etiqueta em cima, voltar, ícone e título. */
export function MenuHead({
    title,
    icon,
    onBack,
    tag,
}: {
    title: string;
    icon: MenuIconKind;
    onBack: () => void;
    /** Etiqueta amarela em cima do placar (padrão: "Menu"). */
    tag?: string;
}) {
    const { t } = useT();
    return (
        <header className="menu-head bc-screenhead">
            <span className="bc-tag">{tag ?? t('common.ui.menu')}</span>
            <button type="button" className="btn ghost back-btn" onClick={onBack} aria-label={t('common.ui.back')}>
                <MenuIcon kind="back" />
            </button>
            <MenuIcon kind={icon} />
            <h1>{title}</h1>
        </header>
    );
}
