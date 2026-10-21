import { type ReactNode, useState } from 'react';
import { species } from '../../engine/data';
import { createInstance, type PokemonInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { type CardVariant, HOLO_FINISHES, type HoloFinish, PokeCard2, VARIANT_LABEL } from '../components/PokeCard2';

/**
 * Arquivo de cartas antigas (?cards=1&arquivo=1, só no dev): os acabamentos holográficos e os outros estilos
 * (figurinha, TCG, Pokédex) que vieram antes da carta metal. Fica guardado aqui pra consulta; o jogo não usa.
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
    mix: 'A raridade define o brilho, como no TCG de verdade.',
};
const COLUMN_SUB: Record<HoloColumn, string> = {
    holo: 'Arte em arco-íris',
    rainbow: 'Carta inteira + glitter',
    reverse: 'Moldura de foil',
    cosmos: 'Estrelas e nebulosa',
    radiant: 'Raios de sol',
    gold: 'Metal gravado',
    mix: 'A raridade define o brilho',
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

function sample(speciesId: number, opts: { shiny?: boolean; item?: string | null } = {}): PokemonInstance {
    const inst = createInstance(speciesId, new Rng(`galeria-${speciesId}`));
    return { ...inst, shiny: opts.shiny ?? false, item: opts.item ?? null };
}

const SAMPLES: { key: string; label: string; inst: PokemonInstance; captain?: boolean }[] = [
    { key: 'common', label: 'Comum', inst: sample(16) },
    { key: 'uncommon', label: 'Incomum', inst: sample(58) },
    { key: 'rare', label: 'Raro', inst: sample(94, { item: 'spelltag' }) },
    { key: 'epic', label: 'Épico', inst: sample(149, { item: 'leftovers' }), captain: true },
    { key: 'legendary', label: 'Lendário', inst: sample(150, { item: 'twistedspoon' }) },
    { key: 'shiny', label: 'Shiny', inst: sample(6, { shiny: true }) },
];

function Column({ title, children, active }: { title: string; children: ReactNode; active: boolean }) {
    return (
        <section className={`cg-col${active ? ' active' : ''}`}>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

export function CardArchive({ onExit }: { onExit: () => void }) {
    const [section, setSection] = useState<'holo' | 'other'>('holo');
    const [holoTab, setHoloTab] = useState<HoloColumn>('mix');
    const [otherTab, setOtherTab] = useState<CardVariant>('sticker');
    const [showcase, setShowcase] = useState<HoloFinish>('rainbow');

    return (
        <div className="cg">
            <div className="draft-head">
                <div>
                    <div className="muted">Cartas do Soccermon</div>
                    <h1>Arquivo de cartas antigas</h1>
                    <p className="muted" style={{ margin: '4px 0 0' }}>
                        Estilos que vieram antes da carta metal. Guardados só pra consulta: o jogo não usa nenhum.{' '}
                        <a href="?cards=1">Voltar pra galeria</a>
                    </p>
                </div>
                <button type="button" className="btn small" onClick={onExit}>
                    Sair
                </button>
            </div>

            <div className="panel cg-showcase">
                <div className="cg-stage">
                    <PokeCard2 key={showcase} inst={SAMPLES[4].inst} variant={showcase} showcase />
                </div>
                <div className="cg-stage-side">
                    <h2>Vitrine</h2>
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
                </div>
            </div>

            <div className="cg-sections" role="tablist" aria-label="Estilos antigos">
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'holo'}
                    className={`btn${section === 'holo' ? ' active' : ' ghost'}`}
                    onClick={() => setSection('holo')}
                >
                    Acabamentos holográficos
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'other'}
                    className={`btn${section === 'other' ? ' active' : ' ghost'}`}
                    onClick={() => setSection('other')}
                >
                    Outros estilos
                </button>
            </div>

            {section === 'holo' ? (
                <>
                    <div className="cg-tabs" role="tablist" aria-label="Acabamentos">
                        {HOLO_COLUMNS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                role="tab"
                                aria-selected={holoTab === c}
                                className={`btn small${holoTab === c ? ' active' : ''}${c === 'mix' ? ' outline' : ''}`}
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
                                {SAMPLES.map((s) => {
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
                                {SAMPLES.map((s) => (
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
