import { useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';

/** Perfil: seu clube, Pokédex e números (em construção). */
export function Profile() {
    const go = useGame((s) => s.go);
    return (
        <div className="menu-screen">
            <MenuHead title="Perfil" icon="profile" onBack={() => go('home')} />
        </div>
    );
}
