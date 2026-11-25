import ANCORAS from '../../data/gorro-ancoras.json';
import { MenuHead } from '../components/MenuHead';
import { FieldSprite } from './FieldSprite';

/**
 * Galeria do gorro de Natal (`?lab=gorro`, só dev e prévia): cada espécie com âncora, de frente, de lado (direita e
 * esquerda) e de costas, pra conferir a cabeça antes de aprovar a âncora em `src/data/gorro-ancoras.json`.
 * `&ids=25,143` filtra as espécies, `&escala=6` aumenta (zoom pra conferir pixel a pixel) e `&mexe=1` toca o Idle.
 */
const DIRS = [0, 2, 6, 4];
export function GorroLab({ onExit }: { onExit: () => void }) {
    const q = new URLSearchParams(location.search);
    const only = q.get('ids')?.split(',').map(Number);
    const ids = only ?? Object.keys(ANCORAS).map(Number);
    const scale = Number(q.get('escala')) || 3;
    const play = q.get('mexe') === '1';
    return (
        <div className="menu-screen">
            <MenuHead title="Gorro · galeria" onBack={onExit} />
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${scale * 100}px, 1fr))`,
                    gap: 8,
                }}
            >
                {ids.map((id) => (
                    <section
                        key={id}
                        className="panel"
                        style={{ padding: 8, position: 'relative', overflow: 'visible' }}
                    >
                        <small>#{id}</small>
                        <div style={{ display: 'flex', gap: 4, height: scale * 64, alignItems: 'flex-end' }}>
                            {DIRS.map((d) => (
                                <span key={d} style={{ position: 'relative', flex: 1, height: '100%' }}>
                                    <span
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            bottom: scale * 5,
                                            width: 0,
                                            height: 0,
                                        }}
                                    >
                                        <FieldSprite
                                            id={id}
                                            anim="Idle"
                                            dir={d}
                                            scale={scale}
                                            play={play}
                                            hat="lab"
                                            style={{ position: 'absolute' }}
                                        />
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
