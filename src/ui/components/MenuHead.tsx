import { useT } from '../../i18n/react';
import { MenuIcon, type MenuIconKind } from './MenuIcon';

/** Cabeçalho das telas de menu: voltar, ícone e título. */
export function MenuHead({ title, icon, onBack }: { title: string; icon: MenuIconKind; onBack: () => void }) {
    const { t } = useT();
    return (
        <header className="menu-head">
            <button type="button" className="btn ghost back-btn" onClick={onBack} aria-label={t('common.ui.back')}>
                <MenuIcon kind="back" />
            </button>
            <MenuIcon kind={icon} />
            <h1>{title}</h1>
        </header>
    );
}
