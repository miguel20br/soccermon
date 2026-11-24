import ANCORAS from '../../data/gorro-ancoras.json';
import { MenuHead } from '../components/MenuHead';
import { FieldSprite } from './FieldSprite';

/**
 * Galeria do gorro de Natal (`?lab=gorro`, só dev e prévia): cada espécie com âncora, de frente, de lado (direita e
 * esquerda) e de costas, pra conferir a cabeça antes de aprovar a âncora em `src/data/gorro-ancoras.json`.
 */
const DIRS = [0, 2, 6, 4];
export function GorroLab({ onExit }: { onExit: () => void }) {
    const ids = Object.keys(ANCORAS).map(Number);
    return (
        <div className="menu-screen">
            <MenuHead title="Gorro · galeria" onBack={onExit} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
                {ids.map((id) => (
                    <section key={id} className="panel" style={{ padding: 8 }}>
                        <small>#{id}</small>
                        <div style={{ display: 'flex', gap: 4, height: 190, alignItems: 'flex-end' }}>
                            {DIRS.map((d) => (
                                <span key={d} style={{ position: 'relative', flex: 1, height: '100%' }}>
                                    <span style={{ position: 'absolute', left: '50%', bottom: 6 }}>
                                        <FieldSprite id={id} anim="Idle" dir={d} scale={3} play={false} hat="lab" />
                                    </span>
                                </span>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
