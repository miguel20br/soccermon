import { useMemo, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { TIER_PT } from '../components/PokeCard';
import { type CardVariant, PokeCard2, VARIANT_LABEL } from '../components/PokeCard2';

/**
 * Galeria de cartas (?cards=1): os 4 estilos em teste lado a lado, o mesmo Pokémon em cada raridade.
 * O Miguel escolhe o favorito e ele vira a carta padrão do jogo.
 */
const VARIANTS: CardVariant[] = ['sticker', 'tcg', 'dex', 'holo'];

interface Sample {
    key: string;
    label: string;
    inst: PokemonInstance;
    captain?: boolean;
}

function sample(speciesId: number, opts: { shiny?: boolean; item?: string | null } = {}): PokemonInstance {
    const inst = createInstance(speciesId, new Rng(`galeria-${speciesId}`));
    return { ...inst, shiny: opts.shiny ?? false, item: opts.item ?? null };
}

const DEFAULT_SAMPLES: Sample[] = [
    { key: 'common', label: 'Comum', inst: sample(16) },
    { key: 'uncommon', label: 'Incomum', inst: sample(58) },
    { key: 'rare', label: 'Raro', inst: sample(94, { item: 'spelltag' }) },
    { key: 'epic', label: 'Épico', inst: sample(149, { item: 'leftovers' }), captain: true },
    { key: 'legendary', label: 'Lendário', inst: sample(150, { item: 'twistedspoon' }) },
    { key: 'shiny', label: 'Shiny', inst: sample(6, { shiny: true }) },
];

export function CardGallery({ onExit }: { onExit: () => void }) {
    const [tab, setTab] = useState<CardVariant>('sticker');
    const [query, setQuery] = useState('');
    const [customShiny, setCustomShiny] = useState(false);

    const custom = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return null;
        const sp =
            SPECIES.find((s) => s.name.toLowerCase() === q) ?? SPECIES.find((s) => s.name.toLowerCase().startsWith(q));
        return sp ? sp : null;
    }, [query]);

    const samples: Sample[] = custom
        ? [
              {
                  key: `custom-${custom.id}-${customShiny}`,
                  label: `Sua escolha · ${TIER_PT[custom.tier]}${customShiny ? ' · Shiny' : ''}`,
                  inst: sample(custom.id, { shiny: customShiny }),
              },
              ...DEFAULT_SAMPLES,
          ]
        : DEFAULT_SAMPLES;

    return (
        <div className="cg">
            <div className="draft-head">
                <div>
                    <div className="muted">Cartas novas (teste)</div>
                    <h1>Qual carta você prefere?</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        Quatro estilos, o mesmo Pokémon em cada raridade. Escolha o estilo favorito e me diga.
                    </p>
                </div>
                <button type="button" className="btn small" onClick={onExit}>
                    Sair
                </button>
            </div>

            <div className="panel cg-picker">
                <label htmlFor="cg-search" className="muted">
                    Ver outro Pokémon
                </label>
                <input
                    id="cg-search"
                    className="team-name-input"
                    list="cg-species"
                    placeholder="Ex.: Snorlax"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <datalist id="cg-species">
                    {SPECIES.map((s) => (
                        <option key={s.id} value={s.name} />
                    ))}
                </datalist>
                <label className="cg-check">
                    <input type="checkbox" checked={customShiny} onChange={(e) => setCustomShiny(e.target.checked)} />{' '}
                    Shiny
                </label>
                {query.trim() && !custom && <span className="muted">Nenhum Pokémon com esse nome.</span>}
            </div>

            <div className="cg-tabs" role="tablist">
                {VARIANTS.map((v) => (
                    <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={tab === v}
                        className={`btn small${tab === v ? ' active' : ''}`}
                        onClick={() => setTab(v)}
                    >
                        {VARIANT_LABEL[v]}
                    </button>
                ))}
            </div>

            <div className="cg-grid">
                {VARIANTS.map((v) => (
                    <section key={v} className={`cg-col${tab === v ? ' active' : ''}`}>
                        <h2>{VARIANT_LABEL[v]}</h2>
                        {samples.map((s) => (
                            <figure key={s.key} className="cg-item">
                                <PokeCard2 inst={s.inst} variant={v} captain={s.captain} />
                                <figcaption className="muted">{s.label}</figcaption>
                            </figure>
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}
