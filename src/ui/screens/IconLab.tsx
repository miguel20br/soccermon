import { type CSSProperties, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { HudIcon } from '../components/MatchHud';
import { ICON_SOURCE, type IconSource, MonIcon } from '../components/MonIcon';
import '../icon-lab.css';

/** As fontes de ícone de menu lado a lado (scripts/fetch-icons.ts). */
const SOURCES: { id: IconSource; name: string; short: string; note: string }[] = [
    {
        id: 'pokesprite',
        name: 'pokesprite · Gen 8',
        short: 'Gen 8',
        note: 'Ícones de Sword/Shield. Quem ganhou ícone novo no Galar (Venusaur, Charizard, Pikachu...) fica bem maior que quem ficou com o antigo.',
    },
    {
        id: 'pokesprite7',
        name: 'pokesprite · Gen 7',
        short: 'Gen 7',
        note: 'Ícones de Sun/Moon, todos no mesmo tamanho, com shiny feito pela comunidade. É o que está ligado no jogo.',
    },
    {
        id: 'showdown',
        name: 'Showdown',
        short: 'Showdown',
        note: 'A folha do Pokémon Showdown: o mesmo traço do Gen 7, sem shiny.',
    },
];

/**
 * Comparação dos ícones de menu (?lab=icones, só no dev e nas prévias): os 151, normal e shiny, em cada fonte. A fonte
 * do jogo é `ICON_SOURCE` em MonIcon.tsx (trocar é uma linha).
 */
export function IconLab({ onExit }: { onExit: () => void }) {
    const [scale, setScale] = useState(1);
    return (
        <div className="il">
            <header className="il-head bc-surface">
                <div>
                    <span className="bc-tag">Laboratório</span>
                    <h1>Ícones de menu</h1>
                    <p className="muted">
                        Os 151, normal e shiny, em cada fonte. No jogo: <b>{ICON_SOURCE}</b> (mapa da Rota e chave da
                        copa).
                    </p>
                </div>
                <fieldset className="bc-seg" aria-label="Escala">
                    {[1, 2, 3].map((n) => (
                        <button key={n} type="button" aria-pressed={scale === n} onClick={() => setScale(n)}>
                            {n}x
                        </button>
                    ))}
                </fieldset>
                <button type="button" className="btn small" onClick={onExit}>
                    <HudIcon kind="prev" /> Sair
                </button>
            </header>
            <ul className="il-legend">
                {SOURCES.map((s) => (
                    <li key={s.id} className={s.id === ICON_SOURCE ? 'on' : undefined}>
                        <b>{s.name}</b>
                        <small>{s.note}</small>
                    </li>
                ))}
            </ul>
            <div className="il-grid" style={{ '--s': scale } as CSSProperties}>
                {SPECIES.map((sp) => (
                    <section key={sp.id} className="il-row" aria-label={sp.name}>
                        <span className="il-name">
                            <small>#{String(sp.id).padStart(3, '0')}</small> {sp.name}
                        </span>
                        {SOURCES.map((s) => (
                            <span key={s.id} className={`il-cell${s.id === ICON_SOURCE ? ' on' : ''}`}>
                                <span className="il-pair">
                                    <MonIcon id={sp.id} source={s.id} scale={scale} />
                                    {s.id === 'showdown' ? (
                                        <span className="il-none">sem shiny</span>
                                    ) : (
                                        <MonIcon id={sp.id} source={s.id} scale={scale} shiny />
                                    )}
                                </span>
                                <small>{s.short}</small>
                            </span>
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}
