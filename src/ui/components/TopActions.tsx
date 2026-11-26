import { useFriends } from '../../friends/api';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { openDoor, useDoorSheet } from '../doors';
import { NewDot } from '../profile/news';
import { ProfileChip } from '../profile/PlayerCard';
import { NewsButton } from './AboutFooter';
import { MenuIcon } from './MenuIcon';

/**
 * Canto de cima à direita, igual em toda tela de menu (Home inclusive): Amigos, Novidades, Configurações (engrenagem)
 * e o seu Perfil (`profile={false}`: a Home dos ambientes tem o treinador na barra de cima). Amigos abre a folha por
 * cima da tela de agora (antes era Sede → Amigos). A Ajuda saiu daqui (revisão dos menus, T1, 26/11): fica nas
 * Configurações e no "?" de cada tela, e o nome do treinador volta a caber no 390.
 */
export function TopActions({ profile = true }: { profile?: boolean }) {
    const { d } = useT();
    const screen = useGame((s) => s.screen);
    const go = useGame((s) => s.go);
    const friends = useDoorSheet((s) => s.open === 'amigos');
    const asked = useFriends((s) => !!s.rows?.some((r) => r.status === 'recebido'));
    return (
        <div className="top-actions">
            <button
                type="button"
                className="help-fab"
                aria-label={d.profile.tabs.amigos}
                aria-current={friends ? 'page' : undefined}
                title={d.profile.tabs.amigos}
                onClick={() => openDoor('profile', 'amigos')}
            >
                <MenuIcon kind="friends" />
                <NewDot on={asked} />
            </button>
            <NewsButton />
            {/* sempre no mesmo lugar (nas Configurações também: o botão some e os outros pulavam pro lado) */}
            <button
                type="button"
                className="help-fab"
                data-coach="settings"
                aria-label={d.home.tiles.settings}
                aria-current={screen === 'settings' ? 'page' : undefined}
                title={d.home.tiles.settings}
                onClick={() => go('settings')}
            >
                <MenuIcon kind="settings" />
            </button>
            {profile && <ProfileChip />}
        </div>
    );
}
