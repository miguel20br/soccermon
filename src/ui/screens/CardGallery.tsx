import { type ReactNode, useMemo, useState } from 'react';
import { SPECIES, species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { type Edition, ICONS } from '../../engine/specials';
import { TIER_PT } from '../components/PokeCard';
import { type CardVariant, HOLO_FINISHES, type HoloFinish, PokeCard2, VARIANT_LABEL } from '../components/PokeCard2';
import { EDITION, FINISH_LABEL, finishOf, METAL, type Metal, metalOf } from '../rarity';

/**
 * Galeria de cartas (?cards=1): a família holográfica (6 acabamentos + a mistura sugerida), uma carta
 * grande de vitrine pra sentir os efeitos, e os outros estilos (figurinha, TCG, Pokédex) mais abaixo.
 */
const OTHER: CardVariant[] = ['sticker', 'tcg', 'dex'];
type HoloColumn = HoloFinish | 'mix';
const HOLO_COLUMNS: HoloColumn[] = [...HOLO_FINISHES, 'mix'];

const FINISH_DESC: Record<HoloColumn, string> = {
    holo: 'Faixas de arco-íris na arte, sobre o fundo animado do tipo.',
    rainbow: 'Arco-íris na carta inteira com glitter, estilo "secret rare".',
    reverse: 'A moldura brilha; a janela da arte fica lisa.',
    cosmos: 'Galáxia com estrelas em 3 camadas que se mexem com a luz.',
    radiant: 'Raios de sol na cor do tipo, girando com a luz.',
    gold: 'Metal dourado escovado com gravação. Pra raridade máxima.',
    mix: 'Minha sugestão: a raridade define o brilho, como no TCG de verdade.',
};
const COLUMN_SUB: Record<HoloColumn, string> = {
    holo: 'Arte em arco-íris',
    rainbow: 'Carta inteira + glitter',
    reverse: 'Moldura de foil',
    cosmos: 'Estrelas e nebulosa',
    radiant: 'Raios de sol',
    gold: 'Metal gravado',
    mix: 'Minha sugestão: a raridade define o brilho',
};
const COLUMN_LABEL = (c: HoloColumn) => (c === 'mix' ? 'Mistura sugerida' : VARIANT_LABEL[c]);

/** Mistura sugerida: comum = clássico fraco, incomum = clássico, raro = reverse, épico = arco-íris, lendário = galáxia, shiny = dourado. */
function mixFinish(inst: PokemonInstance): { finish: HoloFinish; weak: boolean } {
    if (inst.shiny) return { finish: 'gold', weak: false };
    const tier = species(inst.speciesId).tier;
    if (tier === 'legendary') return { finish: 'cosmos', weak: false };
    if (tier === 'epic') return { finish: 'rainbow', weak: false };
    if (tier === 'rare') return { finish: 'reverse', weak: false };
    return { finish: 'holo', weak: tier === 'common' };
}

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
const SHOWCASE_DEFAULT = DEFAULT_SAMPLES[4].inst;

/** A mesma carta em cada edição especial (pra vitrine e pra galeria). */
function withEdition(inst: PokemonInstance, ed: Edition | 'none'): PokemonInstance {
    const sp = species(inst.speciesId);
    if (ed === 'none') return { ...inst, shiny: false, special: null };
    if (ed === 'shiny') return { ...inst, shiny: true, special: null };
    if (ed === 'destaque') return { ...inst, shiny: false, special: { kind: 'destaque' } };
    if (ed === 'icone')
        return { ...inst, shiny: false, special: { kind: 'icone', title: ICONS[sp.id] ?? `${sp.name} Ícone` } };
    return { ...inst, shiny: false, special: { kind: 'evento', type: sp.types[0] } };
}
const EDITIONS: (Edition | 'none')[] = ['none', 'shiny', 'destaque', 'icone', 'evento'];
const EDITION_LABEL = (e: Edition | 'none') => (e === 'none' ? 'Normal' : EDITION[e].label);
const EDITION_DESC: Record<Edition | 'none', string> = {
    none: 'Bronze, prata ou ouro pela nota; fosco (comum) ou brilhante (raro) pela raridade; lendário é creme e dourado.',
    shiny: 'Shiny (1 em 64, sorte): pérola iridescente.',
    destaque: 'Destaque: o craque do seu time na partida ganha esta carta preta e dourada, estilo TOTW.',
    icone: 'Ícone: só Pokémon da lista, 1 em 20 quando aparecem no draft.',
    evento: 'Evento: o tipo da semana tem 1 em 8 de vir com esta carta.',
};
/** Um exemplo de cada metal × acabamento (e o lendário), achado nos dados. */
function metalSample(metal: Metal, finish: 'fosco' | 'brilhante' | 'lendario'): PokemonInstance | null {
    const sp = SPECIES.find((x) => {
        if (finishOf(x.tier) !== finish) return false;
        const inst = sample(x.id);
        return finish === 'lendario' || metalOf(viewInstance(inst).overall) === metal;
    });
    return sp ? sample(sp.id) : null;
}
const METAL_ROWS: { key: string; label: string; inst: PokemonInstance }[] = (
    [
        ['bronze', 'fosco'],
        ['bronze', 'brilhante'],
        ['prata', 'fosco'],
        ['prata', 'brilhante'],
        ['ouro', 'fosco'],
        ['ouro', 'brilhante'],
        ['ouro', 'lendario'],
    ] as const
).flatMap(([m, f]) => {
    const inst = metalSample(m, f);
    const label = f === 'lendario' ? 'Lendário' : `${METAL[m].label} · ${FINISH_LABEL[f]}`;
    return inst ? [{ key: `${m}-${f}`, label, inst }] : [];
});
const EDITION_SAMPLES: { ed: Edition; inst: PokemonInstance }[] = [
    { ed: 'shiny', inst: withEdition(sample(6), 'shiny') },
    { ed: 'destaque', inst: withEdition(sample(68), 'destaque') },
    { ed: 'icone', inst: withEdition(sample(25), 'icone') },
    { ed: 'evento', inst: withEdition(sample(59), 'evento') },
];
const ICON_SAMPLES = Object.keys(ICONS).map((id) => withEdition(sample(Number(id)), 'icone'));

function Column({ title, children, active }: { title: string; children: ReactNode; active: boolean }) {
    return (
        <section className={`cg-col${active ? ' active' : ''}`}>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

export function CardGallery({ onExit }: { onExit: () => void }) {
    const [section, setSection] = useState<'v06' | 'holo' | 'other'>('v06');
    const [edition, setEdition] = useState<Edition | 'none'>('none');
    const [holoTab, setHoloTab] = useState<HoloColumn>('mix');
    const [otherTab, setOtherTab] = useState<CardVariant>('sticker');
    const [showcase, setShowcase] = useState<HoloFinish>('rainbow');
    const [query, setQuery] = useState('');
    const [customShiny, setCustomShiny] = useState(false);

    const custom = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return null;
        return (
            SPECIES.find((s) => s.name.toLowerCase() === q) ??
            SPECIES.find((s) => s.name.toLowerCase().startsWith(q)) ??
            null
        );
    }, [query]);

    const customInst = useMemo(
        () => (custom ? sample(custom.id, { shiny: customShiny }) : null),
        [custom, customShiny],
    );

    const samples: Sample[] = customInst
        ? [
              {
                  key: `custom-${customInst.speciesId}-${customShiny}`,
                  label: `Sua escolha · ${TIER_PT[species(customInst.speciesId).tier]}${customShiny ? ' · Shiny' : ''}`,
                  inst: customInst,
              },
              ...DEFAULT_SAMPLES,
          ]
        : DEFAULT_SAMPLES;
    const showcaseInst = customInst ?? SHOWCASE_DEFAULT;

    return (
        <div className="cg">
            <div className="draft-head">
                <div>
                    <div className="muted">Cartas do Soccermon</div>
                    <h1>Carta Metal</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        Bronze, prata ou ouro pela nota; fosco ou brilhante pela raridade; lendários e edições especiais
                        com visual próprio. Passe o mouse (ou o dedo) nas cartas.
                    </p>
                </div>
                <button type="button" className="btn small" onClick={onExit}>
                    Sair
                </button>
            </div>

            <div className="panel cg-showcase">
                <div className="cg-stage">
                    {section === 'v06' ? (
                        <PokeCard2
                            key={`fig-${edition}-${showcaseInst.speciesId}`}
                            inst={withEdition(showcaseInst, edition)}
                            variant="metal"
                            showcase
                        />
                    ) : (
                        <PokeCard2
                            key={`${showcase}-${showcaseInst.speciesId}`}
                            inst={showcaseInst}
                            variant={showcase}
                            showcase
                        />
                    )}
                </div>
                <div className="cg-stage-side">
                    <h2>Vitrine</h2>
                    {section === 'v06' ? (
                        <>
                            <div className="cg-finishes">
                                {EDITIONS.map((e) => (
                                    <button
                                        key={e}
                                        type="button"
                                        aria-pressed={edition === e}
                                        className={`btn small${edition === e ? ' active' : ''}`}
                                        onClick={() => setEdition(e)}
                                    >
                                        {EDITION_LABEL(e)}
                                    </button>
                                ))}
                            </div>
                            <p className="tactic-desc cg-desc">{EDITION_DESC[edition]}</p>
                        </>
                    ) : (
                        <>
                            <div className="cg-finishes">
                                {HOLO_FINISHES.map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        aria-pressed={showcase === f}
                                        className={`btn small${showcase === f ? ' active' : ''}`}
                                        onClick={() => setShowcase(f)}
                                    >
                                        {VARIANT_LABEL[f]}
                                    </button>
                                ))}
                            </div>
                            <p className="tactic-desc cg-desc">{FINISH_DESC[showcase]}</p>
                        </>
                    )}
                    <div className="cg-picker">
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
                            <input
                                type="checkbox"
                                checked={customShiny}
                                onChange={(e) => setCustomShiny(e.target.checked)}
                            />{' '}
                            Shiny
                        </label>
                        {query.trim() && !custom && <span className="muted">Nenhum Pokémon com esse nome.</span>}
                    </div>
                </div>
            </div>

            <div className="cg-sections" role="tablist" aria-label="Estilos">
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'v06'}
                    className={`btn${section === 'v06' ? ' active' : ''}`}
                    onClick={() => setSection('v06')}
                >
                    Carta nova
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'holo'}
                    className={`btn ghost${section === 'holo' ? ' active' : ''}`}
                    onClick={() => setSection('holo')}
                >
                    Arquivo: acabamentos
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'other'}
                    className={`btn ghost${section === 'other' ? ' active' : ''}`}
                    onClick={() => setSection('other')}
                >
                    Arquivo: outros estilos
                </button>
            </div>

            {section === 'v06' ? (
                <div className="cg-v06">
                    <section className="panel">
                        <h2>Bronze, prata e ouro (pela nota) · fosco = comum, brilhante = raro</h2>
                        <div className="cg-row">
                            {(customInst
                                ? [{ key: 'custom', label: 'Sua escolha', inst: customInst }]
                                : METAL_ROWS
                            ).map((s) => (
                                <figure key={s.key} className="cg-item">
                                    <PokeCard2 inst={withEdition(s.inst, 'none')} variant="metal" size="md" />
                                    <figcaption className="muted">{s.label}</figcaption>
                                </figure>
                            ))}
                        </div>
                    </section>
                    <section className="panel">
                        <h2>Edições especiais (+2 em todos os atributos)</h2>
                        <div className="cg-row">
                            {EDITION_SAMPLES.map((s) => (
                                <figure key={s.ed} className="cg-item">
                                    <PokeCard2
                                        inst={customInst ? withEdition(customInst, s.ed) : s.inst}
                                        variant="metal"
                                        size="md"
                                    />
                                    <figcaption className="muted">{EDITION_DESC[s.ed]}</figcaption>
                                </figure>
                            ))}
                        </div>
                    </section>
                    <section className="panel">
                        <h2>Ícones ({ICON_SAMPLES.length}): a lista pra você aprovar</h2>
                        <div className="cg-row cg-icons">
                            {ICON_SAMPLES.map((inst) => (
                                <PokeCard2 key={inst.speciesId} inst={inst} variant="metal" size="sm" />
                            ))}
                        </div>
                    </section>
                </div>
            ) : section === 'holo' ? (
                <>
                    <div className="cg-tabs" role="tablist" aria-label="Acabamentos">
                        {HOLO_COLUMNS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                role="tab"
                                aria-selected={holoTab === c}
                                className={`btn small${holoTab === c ? ' active' : ''}${c === 'mix' ? ' yellow' : ''}`}
                                onClick={() => setHoloTab(c)}
                            >
                                {COLUMN_LABEL(c)}
                            </button>
                        ))}
                    </div>
                    <p className="tactic-desc cg-tab-desc">{FINISH_DESC[holoTab]}</p>
                    <div className="cg-grid cg-grid-holo">
                        {HOLO_COLUMNS.map((c) => (
                            <Column key={c} title={COLUMN_LABEL(c)} active={holoTab === c}>
                                <p className={`cg-col-sub${c === 'mix' ? ' mix' : ''}`}>{COLUMN_SUB[c]}</p>
                                {samples.map((s) => {
                                    const m = c === 'mix' ? mixFinish(s.inst) : { finish: c, weak: false };
                                    return (
                                        <figure key={s.key} className="cg-item">
                                            <PokeCard2
                                                inst={s.inst}
                                                variant={m.finish}
                                                weak={m.weak}
                                                captain={s.captain}
                                            />
                                            <figcaption className="muted">
                                                {s.label}
                                                {c === 'mix' &&
                                                    ` · ${VARIANT_LABEL[m.finish]}${m.weak ? ' (fraco)' : ''}`}
                                            </figcaption>
                                        </figure>
                                    );
                                })}
                            </Column>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="cg-tabs" role="tablist" aria-label="Outros estilos">
                        {OTHER.map((v) => (
                            <button
                                key={v}
                                type="button"
                                role="tab"
                                aria-selected={otherTab === v}
                                className={`btn small${otherTab === v ? ' active' : ''}`}
                                onClick={() => setOtherTab(v)}
                            >
                                {VARIANT_LABEL[v]}
                            </button>
                        ))}
                    </div>
                    <div className="cg-grid cg-grid-other">
                        {OTHER.map((v) => (
                            <Column key={v} title={VARIANT_LABEL[v]} active={otherTab === v}>
                                {samples.map((s) => (
                                    <figure key={s.key} className="cg-item">
                                        <PokeCard2 inst={s.inst} variant={v} captain={s.captain} />
                                        <figcaption className="muted">{s.label}</figcaption>
                                    </figure>
                                ))}
                            </Column>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
