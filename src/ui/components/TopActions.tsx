import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { ProfileChip } from '../profile/PlayerCard';
import { MenuIcon } from './MenuIcon';

/**
 * Canto de cima à direita, igual em toda tela de menu (Home inclusive): Ajuda ("?", só na Home: o Como jogar),
 * Configurações (engrenagem) e o seu Perfil.
 */
export function TopActions({ help }: { help?: () => void }) {
    const { t, d } = useT();
    const screen = useGame((s) => s.screen);
    const go = useGame((s) => s.go);
    return (
        <div className="top-actions">
            {help && (
                <button
                    type="button"
                    className="help-fab"
                    aria-label={t('home.helpAria')}
                    title={t('home.helpTitle')}
                    onClick={help}
                >
                    <MenuIcon kind="help" />
                </button>
            )}
            {screen !== 'settings' && (
                <button
                    type="button"
                    className="help-fab"
                    aria-label={d.home.tiles.settings[0]}
                    title={d.home.tiles.settings[0]}
                    onClick={() => go('settings')}
                >
                    <MenuIcon kind="settings" />
                </button>
            )}
            <ProfileChip />
        </div>
    );
}
