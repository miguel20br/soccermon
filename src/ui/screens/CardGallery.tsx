import { lazy, Suspense, useMemo, useState } from 'react';
import { computeAttributes } from '../../engine/attributes';
import { SPECIES, species } from '../../engine/data';
import { evolveInstance } from '../../engine/evolution';
import { createInstance, evolutionBonus, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { type Edition, EVENT_TYPES, ICONS, type Special, specialBonus } from '../../engine/specials';
import { useT } from '../../i18n/react';
import { type CareerSeal, type DexEntry, EMPTY_ENTRY } from '../../store/profile';
import { PokeCard2 } from '../components/PokeCard2';
import { sealTip } from '../profile/seal-tip';
import { EDITION, FINISH_LABEL, finishOf, METAL, type Metal, metalOf } from '../rarity';
import { TYPE_PT } from '../type-colors';

/**
 * Galeria de cartas (?cards=1, só no dev): só a carta do jogo (metal). Os estilos antigos ficam no arquivo
 * (?cards=1&arquivo=1, `CardArchive.tsx`, carregado só nessa rota).
 */
const CardArchive = lazy(() => import('./CardArchive').then((m) => ({ default: m.CardArchive })));

function sample(speciesId: number, opts: { shiny?: boolean; item?: string | null } = {}): PokemonInstance {
    const inst = createInstance(speciesId, new Rng(`galeria-${speciesId}`));
    return { ...inst, shiny: opts.shiny ?? false, item: opts.item ?? null };
}

const SHOWCASE_DEFAULT = sample(150, { item: 'twistedspoon' });

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
    icone: 'Ícone: só Pokémon da lista, 1 em 80 quando aparecem no draft.',
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
/** Nível da edição: Destaque II/III (craque de novo) ou Ícone que levou MVP (selo "MVP n"). */
const withMvp = (inst: PokemonInstance, level: number): PokemonInstance =>
    inst.special ? { ...inst, special: { ...inst.special, level } } : inst;
const EDITION_SAMPLES: { ed: Edition; inst: PokemonInstance; note?: string }[] = [
    { ed: 'shiny', inst: withEdition(sample(6), 'shiny') },
    { ed: 'destaque', inst: withEdition(sample(68), 'destaque') },
    {
        ed: 'destaque',
        inst: withMvp(withEdition(sample(68), 'destaque'), 2),
        note: 'Destaque II: craque de novo, +3 em tudo.',
    },
    {
        ed: 'destaque',
        inst: withMvp(withEdition(sample(68), 'destaque'), 3),
        note: 'Destaque III: o nível máximo, +4 em tudo.',
    },
    { ed: 'icone', inst: withEdition(sample(25), 'icone') },
    {
        ed: 'icone',
        inst: withMvp(withEdition(sample(25), 'icone'), 2),
        note: 'Ícone MVP 2: levou o prêmio de craque duas vezes, +4 em tudo.',
    },
    { ed: 'evento', inst: withEdition(sample(59), 'evento') },
];
/** Selo de carreira na faixa do nome: parte da carta (inclina junto). A dica usa números de exemplo. */
const SEAL_SAMPLES: { seal: CareerSeal; label: string; inst: PokemonInstance; have: Partial<DexEntry> }[] = [
    { seal: 'folha', label: 'Folha · bronze', inst: METAL_ROWS[0]?.inst ?? sample(16), have: { matches: 14 } },
    { seal: 'holo', label: 'Holo · prata brilhante', inst: METAL_ROWS[3]?.inst ?? sample(58), have: { goals: 31 } },
    { seal: 'prisma', label: 'Prisma · ouro', inst: sample(150), have: { titles: 6 } },
    { seal: 'ouro', label: 'Ouro escuro · Destaque', inst: withEdition(sample(68), 'destaque'), have: { titles: 5 } },
    { seal: 'holo', label: 'Holo · Shiny', inst: withEdition(sample(6), 'shiny'), have: { goals: 25 } },
    { seal: 'prisma', label: 'Prisma · Ícone', inst: withEdition(sample(25), 'icone'), have: { titles: 9 } },
];

/** Combos de edição em camadas (0.8.8): fundo da edição, shiny por cima, selo MVP 1–3. */
const card = (id: number, shiny: boolean, special: Special | null): PokemonInstance => ({
    ...sample(id),
    shiny,
    special,
});
const ico = (id: number, level?: number): Special => ({ kind: 'icone', title: ICONS[id], ...(level && { level }) });
const evt = (type: string, level?: number): Special => ({ kind: 'evento', type, ...(level && { level }) });
const dest = (level?: number): Special => ({ kind: 'destaque', ...(level && level > 1 && { level }) });
const COMBOS: { label: string; inst: PokemonInstance }[] = [
    { label: 'Shiny', inst: card(6, true, null) },
    { label: 'Ícone', inst: card(25, false, ico(25)) },
    { label: 'Shiny Ícone', inst: card(25, true, ico(25)) },
    { label: 'Evento', inst: card(59, false, evt('Fire')) },
    { label: 'Shiny Evento', inst: card(59, true, evt('Fire')) },
    ...[1, 2, 3].map((n) => ({ label: `Destaque ${n}`, inst: card(68, false, dest(n)) })),
    { label: 'Shiny Destaque 1', inst: card(6, true, dest()) },
    { label: 'Shiny Destaque 3', inst: card(6, true, dest(3)) },
    ...[1, 2, 3].map((n) => ({ label: `Ícone MVP ${n}`, inst: card(25, false, ico(25, n)) })),
    { label: 'Shiny Ícone MVP 3', inst: card(25, true, ico(25, 3)) },
    ...[1, 2, 3].map((n) => ({ label: `Evento MVP ${n}`, inst: card(59, false, evt('Fire', n)) })),
    { label: 'Shiny Evento MVP 3', inst: card(59, true, evt('Fire', 3)) },
];

/**
 * Passo a passo de uma carta empilhando tudo: a nota, o bônus e o que trava no 99 (cada atributo para em 99 e o
 * bônus que sobra só sobe os que ainda estão abaixo; a nota pode parar antes de 99).
 */
interface Step {
    label: string;
    inst: PokemonInstance;
}
function stepNumbers(inst: PokemonInstance) {
    const view = viewInstance(inst);
    const base = computeAttributes(view.species, inst.level);
    const bonus = specialBonus(inst) + evolutionBonus(inst);
    const keys = Object.keys(base) as (keyof typeof base)[];
    const at99 = keys.filter((k) => base[k] + bonus >= 99).length;
    const lost = keys.reduce((a, k) => a + Math.max(0, base[k] + bonus - 99), 0);
    return { ovr: view.overall, bonus, at99, lost };
}
const MEWTWO: Step[] = [
    { label: 'Normal', inst: card(150, false, null) },
    { label: 'Shiny', inst: card(150, true, null) },
    { label: 'Shiny Ícone', inst: card(150, true, ico(150)) },
    ...[1, 2, 3].map((n) => ({ label: `Shiny Ícone MVP ${n}`, inst: card(150, true, ico(150, n)) })),
    { label: 'Shiny Evento Psíquico MVP 3', inst: card(150, true, evt('Psychic', 3)) },
];
const caterpie = (shiny: boolean, special: Special | null) => card(10, shiny, special);
const bugMvp3 = caterpie(true, evt('Bug', 3));
const CATERPIE: Step[] = [
    { label: 'Caterpie', inst: caterpie(false, null) },
    { label: 'Shiny', inst: caterpie(true, null) },
    { label: 'Shiny Evento Inseto', inst: caterpie(true, evt('Bug')) },
    ...[1, 2, 3].map((n) => ({ label: `Shiny Evento MVP ${n}`, inst: caterpie(true, evt('Bug', n)) })),
    { label: 'Evoluiu: Metapod', inst: evolveInstance(bugMvp3, 11) },
    { label: 'Evoluiu: Butterfree', inst: evolveInstance(evolveInstance(bugMvp3, 11), 12) },
];

function Ladder({ steps }: { steps: Step[] }) {
    return (
        <div className="cg-row">
            {steps.map(({ label, inst }) => {
                const n = stepNumbers(inst);
                return (
                    <figure key={label} className="cg-item cb-step">
                        <PokeCard2 inst={inst} variant="metal" tipFocus />
                        <figcaption className="muted">
                            <b>{label}</b>
                            <br />
                            nota {n.ovr} · +{n.bonus} em tudo
                            {n.at99 > 0 && (
                                <>
                                    <br />
                                    {n.at99} no 99 (perdeu {n.lost})
                                </>
                            )}
                        </figcaption>
                    </figure>
                );
            })}
        </div>
    );
}

/** Evento por tipo: um Pokémon de cada tipo que dá evento (EVENT_TYPES). */
const EVENT_SPECIES: Record<string, number> = {
    Bug: 123,
    Electric: 135,
    Fairy: 36,
    Fighting: 68,
    Fire: 6,
    Flying: 18,
    Grass: 3,
    Ground: 112,
    Ice: 144,
    Normal: 143,
    Poison: 89,
    Psychic: 65,
    Rock: 95,
    Water: 130,
};
const EVENT_SAMPLES = EVENT_TYPES.map((type) => ({ type, inst: card(EVENT_SPECIES[type] ?? 143, false, evt(type)) }));

const ICON_SAMPLES = Object.keys(ICONS).map((id) => withEdition(sample(Number(id)), 'icone'));

export function CardGallery({ onExit }: { onExit: () => void }) {
    if (new URLSearchParams(window.location.search).get('arquivo') === '1')
        return (
            <Suspense fallback={null}>
                <CardArchive onExit={onExit} />
            </Suspense>
        );
    return <CurrentCards onExit={onExit} />;
}

function CurrentCards({ onExit }: { onExit: () => void }) {
    const { t } = useT();
    const [edition, setEdition] = useState<Edition | 'none'>('none');
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
                    <PokeCard2
                        key={`fig-${edition}-${showcaseInst.speciesId}`}
                        inst={withEdition(showcaseInst, edition)}
                        variant="metal"
                        showcase
                    />
                </div>
                <div className="cg-stage-side">
                    <h2>Vitrine</h2>
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

            <div className="cg-v06">
                <section className="panel">
                    <h2>Bronze, prata e ouro (pela nota) · fosco = comum, brilhante = raro</h2>
                    <div className="cg-row">
                        {(customInst ? [{ key: 'custom', label: 'Sua escolha', inst: customInst }] : METAL_ROWS).map(
                            (s) => (
                                <figure key={s.key} className="cg-item">
                                    <PokeCard2 inst={withEdition(s.inst, 'none')} variant="metal" size="md" />
                                    <figcaption className="muted">{s.label}</figcaption>
                                </figure>
                            ),
                        )}
                    </div>
                </section>
                <section className="panel">
                    <h2>Edições especiais (+2 em todos os atributos)</h2>
                    <div className="cg-row">
                        {EDITION_SAMPLES.map((s) => (
                            <figure key={`${s.ed}-${s.inst.special?.level ?? 0}`} className="cg-item">
                                <PokeCard2
                                    inst={customInst ? withEdition(customInst, s.ed) : s.inst}
                                    variant="metal"
                                    size="md"
                                />
                                <figcaption className="muted">{s.note ?? EDITION_DESC[s.ed]}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
                <section className="panel" id="combos">
                    <h2>Combos de edição</h2>
                    <p className="muted cb-intro">
                        O fundo é a edição (Ícone = galáxia, Evento = desenho do tipo, Destaque = preto e dourado); o
                        shiny vai por cima de qualquer uma (+1); o selo MVP soma +1 por nível. Passe o mouse ou segure o
                        dedo nos selos.
                    </p>
                    <div className="cg-row">
                        {COMBOS.map(({ label, inst }) => (
                            <figure key={label} className="cg-item">
                                <PokeCard2 inst={inst} variant="metal" tipFocus />
                                <figcaption className="muted">
                                    <b>{label}</b> · +{specialBonus(inst)} em tudo
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
                <section className="panel" id="absurda">
                    <h2>A carta mais absurda</h2>
                    <p className="muted cb-intro">
                        Cada atributo para em 99; o bônus que sobra só sobe os que ainda estão abaixo. Por isso a nota
                        pode travar antes de 99. Ícone e Evento não se juntam.
                    </p>
                    <Ladder steps={MEWTWO} />
                    <h3 className="cb-sub">Caterpie até Butterfree (Evento Inseto, shiny, MVP 3 e 2 evoluções)</h3>
                    <Ladder steps={CATERPIE} />
                </section>
                <section className="panel" id="evento-tipos">
                    <h2>Evento por tipo</h2>
                    <div className="cg-row">
                        {EVENT_SAMPLES.map(({ type, inst }) => (
                            <figure key={type} className="cg-item">
                                <PokeCard2 inst={inst} variant="metal" tipFocus />
                                <figcaption className="muted">{TYPE_PT[type] ?? type}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
                <section className="panel" id="selos">
                    <h2>Selo de carreira (ao lado do nome)</h2>
                    <p className="muted cg-seal-intro">
                        O selo da Pokédex faz parte da carta: inclina e brilha junto. Não muda o acabamento nem a
                        raridade. Por enquanto só aqui na galeria.
                    </p>
                    <div className="cg-row">
                        {SEAL_SAMPLES.map((s) => (
                            <figure key={s.label} className="cg-item">
                                <PokeCard2
                                    inst={s.inst}
                                    variant="metal"
                                    tipFocus
                                    seal={{
                                        kind: s.seal,
                                        tip: sealTip(
                                            t,
                                            s.seal,
                                            species(s.inst.speciesId).name,
                                            {
                                                ...EMPTY_ENTRY,
                                                ...s.have,
                                            },
                                            151,
                                        ),
                                    }}
                                />
                                <figcaption className="muted">{s.label}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
                <section className="panel">
                    <h2>Ícones ({ICON_SAMPLES.length})</h2>
                    <div className="cg-row cg-icons">
                        {ICON_SAMPLES.map((inst) => (
                            <PokeCard2 key={inst.speciesId} inst={inst} variant="metal" size="sm" />
                        ))}
                    </div>
                </section>
            </div>
            <footer className="cg-footer">
                <a href="?cards=1&arquivo=1" className="muted">
                    arquivo
                </a>
            </footer>
        </div>
    );
}
