import type { CSSProperties } from 'react';
import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { PokeCard2 } from '../components/PokeCard2';
import { ShinySpark } from '../profile/icons';
import '../retro-cards.css';

/**
 * Proposta da edição "Retrô" (só na galeria ?cards=1, pro ok do Miguel; nada disso está no jogo): a carta Metal com o
 * sprite do Red/Blue (scripts/fetch-retro.ts, 4 tons de cinza) pintado na paleta de um Game Boy por um filtro SVG, a
 * tela de cristal líquido atrás do Pokémon e a moldura de plástico. Três aparelhos; o shiny vai por cima como nas
 * outras edições (camadas de src/engine/specials.ts).
 */
const PALETTES = {
    dmg: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    pocket: ['#1f1f1f', '#4d533c', '#8b956d', '#c4cfa1'],
    light: ['#00303a', '#00777a', '#3fc0b0', '#a5f2e3'],
} as const;
type Palette = keyof typeof PALETTES;

const VARIANTS: { id: Palette; name: string; note: string }[] = [
    { id: 'dmg', name: 'Retrô · Clássico', note: 'Tela verde e plástico cinza do primeiro Game Boy.' },
    { id: 'pocket', name: 'Retrô · Bolso', note: 'Tela cinza-oliva e moldura prateada do modelo de bolso.' },
    { id: 'light', name: 'Retrô · Luz', note: 'Tela turquesa acesa e moldura dourada do modelo com luz.' },
];

const SAMPLES = [25, 6, 94, 150];

function sample(id: number, shiny = false): PokemonInstance {
    return { ...createInstance(id, new Rng(`retro-${id}`)), shiny, special: null };
}

/** Cada tom de cinza (0, 85, 170, 255) vira um tom da paleta: tabela discreta por canal, em sRGB. */
function GbFilters() {
    const ch = (pal: readonly string[], i: number) =>
        pal.map((hex) => (Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(' ');
    return (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
            {Object.entries(PALETTES).map(([id, pal]) => (
                <filter key={id} id={`gb-${id}`} colorInterpolationFilters="sRGB">
                    <feComponentTransfer>
                        <feFuncR type="discrete" tableValues={ch(pal, 0)} />
                        <feFuncG type="discrete" tableValues={ch(pal, 1)} />
                        <feFuncB type="discrete" tableValues={ch(pal, 2)} />
                    </feComponentTransfer>
                </filter>
            ))}
        </svg>
    );
}

function RetroCard({ id, palette, shiny = false }: { id: number; palette: Palette; shiny?: boolean }) {
    const pal = PALETTES[palette];
    return (
        <div
            className={`retro-card rv-${palette}${shiny ? ' rv-shiny' : ''}`}
            style={{ '--lcd': pal[3], '--lcd-dark': pal[0], '--lcd-mid': pal[2] } as CSSProperties}
        >
            <PokeCard2 inst={sample(id, shiny)} variant="metal" size="md" art={`assets/retro/${id}.png`} />
            <span className="retro-tag">
                Retrô
                {shiny && <ShinySpark className="pr-spark" />}
            </span>
        </div>
    );
}

export function RetroCards() {
    return (
        <section className="panel" id="retro">
            <GbFilters />
            <h2>Edição Retrô (sprite do Game Boy) · proposta pro ok do Miguel, fora do jogo</h2>
            <p className="muted">
                Sprite do Red/Blue em 4 tons, pintado na paleta de cada aparelho. Moldura de plástico, tela de cristal
                líquido atrás do Pokémon. Como as outras edições, o shiny entra por cima (último cartão).
            </p>
            {VARIANTS.map((v) => (
                <div key={v.id} className="retro-group">
                    <h3>
                        {v.name} <small className="muted">{v.note}</small>
                    </h3>
                    <div className="cg-row">
                        {SAMPLES.map((id) => (
                            <figure key={id} className="cg-item">
                                <RetroCard id={id} palette={v.id} />
                            </figure>
                        ))}
                        {v.id === 'dmg' && (
                            <figure className="cg-item">
                                <RetroCard id={6} palette="dmg" shiny />
                                <figcaption className="muted">Retrô + Shiny (camada de brilho por cima)</figcaption>
                            </figure>
                        )}
                    </div>
                </div>
            ))}
        </section>
    );
}
