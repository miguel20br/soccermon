import { lazy, Suspense, useMemo, useState } from 'react';
import { SPECIES, species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { type Edition, ICONS } from '../../engine/specials';
import type { CareerSeal } from '../../store/profile';
import { PokeCard2 } from '../components/PokeCard2';
import { CareerSealIcon } from '../profile/icons';
import { EDITION, FINISH_LABEL, finishOf, METAL, type Metal, metalOf } from '../rarity';

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
/**
 * Selinho de carreira na carta: opção B (ao lado do nome), escolhida pelo Miguel em 18/10/2026; por enquanto só aqui.
 * Cada exemplo mistura metal e edição pra ver se o selo briga com a raridade, o bronze/prata/ouro e as edições.
 */
const SEAL_SAMPLES: { seal: CareerSeal; label: string; inst: PokemonInstance }[] = [
    { seal: 'folha', label: 'Folha (10 partidas) · bronze', inst: METAL_ROWS[0]?.inst ?? sample(16) },
    { seal: 'holo', label: 'Holo (25 gols) · prata brilhante', inst: METAL_ROWS[3]?.inst ?? sample(58) },
    { seal: 'prisma', label: 'Prisma (5 títulos) · ouro', inst: sample(149) },
    { seal: 'ouro', label: 'Ouro escuro · Destaque', inst: withEdition(sample(68), 'destaque') },
    { seal: 'holo', label: 'Holo · Shiny', inst: withEdition(sample(6), 'shiny') },
    { seal: 'prisma', label: 'Prisma · Ícone', inst: withEdition(sample(25), 'icone') },
];

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
                <section className="panel cg-seal-panel">
                    <h2>Selo de carreira · B, ao lado do nome</h2>
                    <p className="muted cg-seal-intro">
                        O selo da Pokédex (Folha, Holo, Prisma, Ouro escuro) na faixa do nome, como um carimbo. Não muda
                        o acabamento nem a raridade. Por enquanto só aqui na galeria.
                    </p>
                    <div className="cg-row">
                        {SEAL_SAMPLES.map((s) => (
                            <figure key={s.label} className="cg-item">
                                <div className="cg-seal cg-seal-nome">
                                    <PokeCard2 inst={s.inst} variant="metal" size="md" />
                                    <CareerSealIcon seal={s.seal} className="cg-seal-mark" />
                                </div>
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
