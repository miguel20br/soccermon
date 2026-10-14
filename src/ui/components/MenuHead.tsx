import { MenuIcon, type MenuIconKind } from './MenuIcon';

/** Cabeçalho das telas de menu: voltar, ícone e título. */
export function MenuHead({ title, icon, onBack }: { title: string; icon: MenuIconKind; onBack: () => void }) {
    return (
        <header className="menu-head">
            <button type="button" className="btn ghost back-btn" onClick={onBack} aria-label="Voltar">
                <MenuIcon kind="back" />
            </button>
            <MenuIcon kind={icon} />
            <h1>{title}</h1>
        </header>
    );
}
