import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { ProfileChip } from '../profile/PlayerCard';
import { MenuIcon } from './MenuIcon';

/**
 * Canto de cima à direita, igual em toda tela de menu (Home inclusive): Ajuda ("?", só na Home: o Como jogar),
 * Configurações (engrenagem) e o seu Perfil (`profile={false}`: a Home dos ambientes tem o treinador na barra de cima).
 */
export function TopActions({ help, profile = true }: { help?: () => void; profile?: boolean }) {
    const { t, d } = useT();
    const screen = useGame((s) => s.screen);
    const go = useGame((s) => s.go);
    return (
        <div className="top-actions">
            {help && (
                <button
                    type="button"
                    className="help-fab"
                    data-coach="help"
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
                    aria-label={d.home.tiles.settings}
                    title={d.home.tiles.settings}
                    onClick={() => go('settings')}
                >
                    <MenuIcon kind="settings" />
                </button>
            )}
            {profile && <ProfileChip />}
        </div>
    );
}
