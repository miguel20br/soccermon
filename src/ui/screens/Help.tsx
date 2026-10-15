import { useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';

/** Ajuda: como jogar e todas as mecânicas (em construção). */
export function Help() {
    const go = useGame((s) => s.go);
    return (
        <div className="menu-screen">
            <MenuHead title="Ajuda" icon="help" onBack={() => go('home')} />
        </div>
    );
}
