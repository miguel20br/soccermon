import { type CSSProperties, useRef } from 'react';
import { type AttrKey, POSITION_LABEL, type Position } from '../../engine/attributes';
import { ABILITIES, MOVES, type Tier } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { ITEMS, itemSprite } from '../../engine/items';
import { moveProfile } from '../../engine/moves';
import { type Edition, editionOf } from '../../engine/specials';
import { EDITION, RARITY } from '../rarity';
import { ratingAt } from '../rating';
import { TYPE_COLOR, TYPE_PT } from '../type-colors';
import { cardSprite, TIER_PT } from './PokeCard';
import './pokecard2.css';
import { TypeIcons } from './TypeIcon';
import { useHoloPointer } from './useHoloPointer';

/**
 * Cartas em teste (galeria ?cards=1): os mesmos dados da FutCard em 4 estilos.
 * - sticker: figurinha de álbum (Panini)
 * - tcg: carta do TCG adaptada ao futsal
 * - dex: tela de Pokédex
 * - holo: holográfico com fundo animado do tipo, e a família holográfica (acabamentos de foil):
 *   rainbow (arco-íris), reverse, cosmos (galáxia), radiant (radiante) e gold (dourado)
 * As cartas holográficas inclinam e refletem a luz com o ponteiro (useHoloPointer).
 */
export type HoloFinish = 'holo' | 'rainbow' | 'reverse' | 'cosmos' | 'radiant' | 'gold';
export type CardVariant = 'figurinha' | 'sticker' | 'tcg' | 'dex' | HoloFinish;

export const HOLO_FINISHES: HoloFinish[] = ['holo', 'rainbow', 'reverse', 'cosmos', 'radiant', 'gold'];

export const VARIANT_LABEL: Record<CardVariant, string> = {
    figurinha: 'Figurinha Holo',
    sticker: 'Figurinha',
    tcg: 'TCG de futsal',
    dex: 'Pokédex',
    holo: 'Holo clássico',
    rainbow: 'Arco-íris',
    reverse: 'Reverse',
    cosmos: 'Galáxia',
    radiant: 'Radiante',
    gold: 'Dourado',
};

const isHolo = (v: CardVariant): v is HoloFinish => (HOLO_FINISHES as string[]).includes(v);

const FIELD_STATS: [AttrKey, string][] = [
    ['pace', 'VEL'],
    ['shooting', 'CHU'],
    ['passing', 'PAS'],
    ['dribble', 'DRI'],
    ['tackling', 'DES'],
    ['strength', 'FOR'],
];
const GK_STATS: [AttrKey, string][] = [
    ['goalkeeping', 'GOL'],
    ['positioning', 'LEI'],
    ['strength', 'FOR'],
    ['pace', 'VEL'],
    ['passing', 'PAS'],
    ['stamina', 'FÔL'],
];

const TIER_SYMBOL: Record<Tier, string> = {
    common: '●',
    uncommon: '◆',
    rare: '★',
    epic: '★★',
    legendary: '★★★',
};

const KIND_PT: Record<string, string> = {
    strike: 'Chute forte ou carrinho.',
    blast: 'Finalização especial.',
    burst: 'Arrancada.',
    buff: 'Fortalece o time.',
    debuff: 'Enfraquece o rival.',
    status: 'Causa status no rival.',
    heal: 'Recupera fôlego.',
    flavor: 'Não faz nada… ou faz?',
};

interface PokeCard2Props {
    inst: PokemonInstance;
    variant: CardVariant;
    /** Posição para a nota (padrão: a principal). */
    position?: Position;
    captain?: boolean;
    onClick?: () => void;
    /** Brilho fraco (comum na mistura sugerida). */
    weak?: boolean;
    /** Carta grande de vitrine: balança sozinha quando ninguém está mexendo. */
    showcase?: boolean;
    /**
     * Acabamento especial aplicado por cima de qualquer estilo (inclusive figurinha/TCG/Pokédex):
     * liga a inclinação + reflexo e a camada de foil. Nas variantes holográficas, sobrepõe o acabamento da variante.
     */
    finish?: HoloFinish | 'none';
    /** Tamanho da carta (o layout todo é em em). */
    size?: 'lg' | 'md' | 'sm';
}

/**
 * Camada de foil reutilizável: brilho do acabamento + glitter + reflexo. Precisa estar dentro de um
 * elemento com as classes `pc2-fx fin-<acabamento>` (e o useHoloPointer ligado) para reagir ao ponteiro.
 */
export function HoloLayer() {
    return (
        <>
            <span className="pc2-shine" />
            <span className="pc2-glitter" />
            <span className="pc2-glare" />
        </>
    );
}

function cardData(inst: PokemonInstance, position?: Position) {
    const view = viewInstance(inst);
    const sp = view.species;
    const pos = position ?? view.naturalPosition;
    const { rating, display, fit } = ratingAt(inst, pos);
    const stats = (pos === 'GK' ? GK_STATS : FIELD_STATS).map(([k, label]) => ({
        k,
        label,
        v: Math.round(view.attributes[k]),
    }));
    const t1 = TYPE_COLOR[sp.types[0]] ?? '#888';
    const t2 = TYPE_COLOR[sp.types[1] ?? sp.types[0]] ?? t1;
    return {
        view,
        sp,
        pos,
        rating,
        display,
        fit,
        stats,
        dex: String(sp.id).padStart(3, '0'),
        item: inst.item ? ITEMS[inst.item] : null,
        ability: ABILITIES[inst.ability],
        style: {
            '--t1': t1,
            '--t2': t2,
            '--rar': RARITY[sp.tier].color,
            '--rar-dark': RARITY[sp.tier].dark,
        } as CSSProperties,
    };
}

type Data = ReturnType<typeof cardData>;
type VariantProps = { inst: PokemonInstance; d: Data; captain?: boolean };

export function PokeCard2({ inst, variant, position, captain, onClick, weak, showcase, finish, size }: PokeCard2Props) {
    const d = cardData(inst, position);
    const holo = isHolo(variant);
    const fig = variant === 'figurinha';
    const edition = editionOf(inst);
    // acabamento efetivo: o prop `finish` vale pra qualquer estilo; nas holográficas o padrão é a própria variante;
    // na Figurinha Holo, a edição especial define o acabamento (senão, o holo clássico com brilho pela raridade)
    const fin: HoloFinish | null =
        finish && finish !== 'none'
            ? finish
            : holo
              ? (variant as HoloFinish)
              : fig
                ? edition
                    ? EDITION[edition].finish
                    : 'holo'
                : null;
    const ref = useRef<HTMLElement | null>(null);
    useHoloPointer(ref, { enabled: fin !== null, maxTilt: showcase ? 14 : 10 });
    const classes = ['pc2', holo ? 'pc2-holo' : fig ? 'pc2-fig' : `pc2-${variant}`, `tier-${d.sp.tier}`];
    if (size) classes.push(`size-${size}`);
    if (fig) {
        // tema do fundo: o 1º tipo, mas Normal cede pro 2º (Pidgey/Normal-Voador ganha o céu)
        const theme = d.sp.types[0] === 'Normal' && d.sp.types[1] ? d.sp.types[1] : d.sp.types[0];
        classes.push(`holo-${theme.toLowerCase()}`);
        if (edition) classes.push('is-special', `sp-${edition}`);
    }
    if (inst.shiny) classes.push('is-shiny');
    if (fin) classes.push('pc2-fx', `fin-${fin}`);
    if (holo) classes.push(`holo-${d.sp.types[0].toLowerCase()}`);
    if (weak) classes.push('is-weak');
    if (showcase) classes.push('pc2-showcase');
    const label = `${d.view.displayName}, ${d.display} de ${POSITION_LABEL[d.pos]}, ${TIER_PT[d.sp.tier]}${edition ? `, edição ${EDITION[edition].label}` : ''}`;
    const base = fig ? (
        <Figurinha inst={inst} d={d} captain={captain} edition={edition} />
    ) : variant === 'sticker' ? (
        <Sticker inst={inst} d={d} captain={captain} />
    ) : variant === 'tcg' ? (
        <Tcg inst={inst} d={d} captain={captain} />
    ) : variant === 'dex' ? (
        <Dex inst={inst} d={d} captain={captain} />
    ) : (
        <Holo inst={inst} d={d} captain={captain} finish={fin ?? 'holo'} />
    );
    // a Holo já traz a HoloLayer; nos outros estilos ela entra por cima quando há acabamento
    const body = (
        <>
            {base}
            {fin && !holo && !fig && <HoloLayer />}
        </>
    );
    if (onClick) {
        return (
            <button
                ref={(el) => {
                    ref.current = el;
                }}
                type="button"
                className={classes.join(' ')}
                style={d.style}
                onClick={onClick}
                aria-label={label}
            >
                {body}
            </button>
        );
    }
    return (
        <div
            ref={(el) => {
                ref.current = el;
            }}
            className={classes.join(' ')}
            style={d.style}
            role="img"
            aria-label={label}
        >
            {body}
        </div>
    );
}

function Types({ types }: { types: string[] }) {
    return (
        <>
            {types.map((t) => (
                <i key={t} className="pc2-type" style={{ background: TYPE_COLOR[t] }} title={TYPE_PT[t] ?? t} />
            ))}
        </>
    );
}

// ---------------------------------------------------------------- Figurinha Holo (a carta do jogo)
/**
 * Figurinha + holográfico: moldura na cor da raridade, "foto" com o fundo animado do tipo e brilho que
 * cresce com a raridade. Edições especiais trocam a moldura por um acabamento próprio e ganham faixa;
 * a gema na faixa do nome continua mostrando a raridade.
 */
function Figurinha({ inst, d, captain, edition }: VariantProps & { edition: Edition | null }) {
    const ribbon =
        edition === 'icone'
            ? 'Ícone'
            : edition === 'evento'
              ? `Evento · ${TYPE_PT[inst.special?.type ?? ''] ?? ''}`
              : edition
                ? EDITION[edition].label
                : null;
    const sub = inst.special?.title ?? `${TIER_SYMBOL[d.sp.tier]} ${RARITY[d.sp.tier].label}`;
    return (
        <>
            <span className="fg-photo">
                <span className="holo-bg">
                    <i className="holo-l1" />
                    <i className="holo-l2" />
                    {edition === 'icone' && <i className="holo-l3" />}
                </span>
                <span className="fg-num">{d.dex}</span>
                <span className="fg-ovr">
                    <b>{d.display}</b>
                    <small>{POSITION_LABEL[d.pos]}</small>
                </span>
                {captain && <span className="pc2-captain">C</span>}
                <img className="pixel fg-art" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
                <span className="fg-types">
                    <TypeIcons types={d.sp.types} />
                </span>
                {d.item && <img className="pixel fg-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
                {!edition && <HoloLayer />}
            </span>
            {ribbon && <span className="fg-ribbon">{ribbon}</span>}
            <span className="fg-band">
                <i className="fg-gem" title={RARITY[d.sp.tier].label} />
                <span className="fg-name">{d.view.displayName}</span>
                <span className="fg-sub">{sub}</span>
            </span>
            <span className="fg-stats">
                {d.stats.map((s) => (
                    <span key={s.k}>
                        <b>{s.v}</b>
                        {s.label}
                    </span>
                ))}
            </span>
            {edition && <HoloLayer />}
            {inst.shiny && <span className="pc2-sparkles" />}
        </>
    );
}

// ---------------------------------------------------------------- A. figurinha
function Sticker({ inst, d, captain }: VariantProps) {
    return (
        <>
            <span className="st-photo">
                <span className="st-dots" />
                <span className="st-num">{d.dex}</span>
                <span className="st-ovr">
                    <b>{d.rating}</b>
                    <small>{POSITION_LABEL[d.pos]}</small>
                </span>
                {captain && <span className="pc2-captain">C</span>}
                <img className="pixel st-art" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
                <span className="st-types">
                    <Types types={d.sp.types} />
                </span>
                {d.item && <img className="pixel st-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
            </span>
            <span className="st-band">
                <span className="st-name">{d.view.displayName}</span>
                <span className="st-sub">
                    {d.sp.types.map((t) => TYPE_PT[t] ?? t).join(' / ')} · {TIER_PT[d.sp.tier]}
                </span>
            </span>
            <span className="st-stats">
                {d.stats.map((s) => (
                    <span key={s.k}>
                        <b>{s.v}</b>
                        {s.label}
                    </span>
                ))}
            </span>
            <span className="pc2-foil" />
            {inst.shiny && <span className="pc2-sparkles" />}
        </>
    );
}

// ---------------------------------------------------------------- B. TCG
function energies(power: number) {
    if (!power) return 1;
    if (power < 60) return 1;
    if (power < 90) return 2;
    return 3;
}

function Tcg({ inst, d, captain }: VariantProps) {
    const sp = d.sp;
    return (
        <span className="tcg-inner">
            <span className="tcg-head">
                <span className="tcg-stage">{sp.prevo ? 'Evoluído' : 'Básico'}</span>
                <span className="tcg-name">
                    {captain && <span className="pc2-captain">C</span>}
                    {d.view.displayName}
                </span>
                <span className="tcg-hp">
                    <small>OVR</small>
                    {d.rating}
                </span>
                <i className="tcg-energy big" style={{ background: TYPE_COLOR[sp.types[0]] }} />
            </span>
            <span className="tcg-art">
                <img className="pixel" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
                <span className="tcg-holo" />
                {d.item && <img className="pixel tcg-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
            </span>
            <span className="tcg-strip">
                Nº {d.dex} · {POSITION_LABEL[d.pos]} · {sp.heightm.toFixed(1).replace('.', ',')} m ·{' '}
                {sp.weightkg.toFixed(1).replace('.', ',')} kg
            </span>
            <span className="tcg-attacks">
                {inst.moves.map((m) => {
                    const data = MOVES[m];
                    const n = energies(data.power);
                    return (
                        <span key={m} className="tcg-atk">
                            <span className="tcg-cost">
                                {Array.from({ length: n }, (_, i) => (
                                    <i
                                        // biome-ignore lint/suspicious/noArrayIndexKey: ícones repetidos
                                        key={i}
                                        className="tcg-energy"
                                        style={{ background: TYPE_COLOR[data.type] }}
                                    />
                                ))}
                            </span>
                            <b className="tcg-atk-name">{data.name}</b>
                            <span className="tcg-dmg">{data.power || ''}</span>
                            <small className="tcg-atk-desc">{KIND_PT[moveProfile(m).kind]}</small>
                        </span>
                    );
                })}
            </span>
            <span className="tcg-foot">
                <span>
                    <small>habilidade</small>
                    {d.ability?.name ?? inst.ability}
                </span>
                <span>
                    <small>posições</small>
                    {d.view.positions.map((p) => POSITION_LABEL[p]).join(' · ')}
                </span>
                <span>
                    <small>item</small>
                    {d.item?.name ?? '—'}
                </span>
            </span>
            <span className="tcg-legal">
                <span>Soccermon 151 · Kanto</span>
                <span className="tcg-rarity">
                    {TIER_SYMBOL[sp.tier]} {d.dex}/151
                </span>
            </span>
            <span className="pc2-foil" />
            {inst.shiny && <span className="pc2-sparkles" />}
        </span>
    );
}

// ---------------------------------------------------------------- C. Pokédex
function Dex({ inst, d, captain }: VariantProps) {
    return (
        <>
            <span className="dex-top">
                <span className="dex-lens" />
                <span className="dex-led r" />
                <span className="dex-led y" />
                <span className="dex-led g" />
                <span className="dex-tier">{TIER_PT[d.sp.tier]}</span>
            </span>
            <span className="dex-bezel">
                <span className="dex-lcd">
                    <span className="dex-lcd-head">
                        <span>No.{d.dex}</span>
                        <span className="dex-ovr">
                            {d.rating}
                            <small>OVR</small>
                        </span>
                    </span>
                    <span className="dex-shot">
                        <img
                            className="pixel dex-sprite"
                            src={cardSprite(inst)}
                            alt=""
                            loading="lazy"
                            draggable={false}
                        />
                        {captain && <span className="pc2-captain">C</span>}
                        {inst.shiny && <span className="dex-shiny">★ SHINY</span>}
                    </span>
                    <span className="dex-name">{d.view.displayName.toUpperCase()}</span>
                    <span className="dex-cat">
                        POS: {POSITION_LABEL[d.pos].toUpperCase()} ·{' '}
                        {d.sp.types.map((t) => (TYPE_PT[t] ?? t).toUpperCase()).join('/')}
                    </span>
                </span>
            </span>
            <span className="dex-bars">
                {d.stats.map((s) => (
                    <span key={s.k} className="dex-bar">
                        <span>{s.label}</span>
                        <span className="dex-seg">
                            <i style={{ width: `${s.v}%` }} />
                        </span>
                        <b>{s.v}</b>
                    </span>
                ))}
            </span>
            <span className="dex-controls">
                <span className="dex-dpad" />
                <span className="dex-btns">
                    <i />
                    <i />
                </span>
                <span className="dex-grille" />
                {d.item && <img className="pixel dex-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
            </span>
        </>
    );
}

// ---------------------------------------------------------------- F. holográfico (família)
/**
 * Camadas, de baixo pra cima: fundo (tema do tipo ou textura do acabamento) → foil do fundo (reverse) →
 * janela da arte (reverse) → arte → painel → brilho do acabamento → glitter → reflexo (glare).
 */
function Holo({ inst, d, captain, finish }: VariantProps & { finish: HoloFinish }) {
    return (
        <>
            <span className="holo-bg">
                <i className="holo-l1" />
                <i className="holo-l2" />
                {finish === 'cosmos' && <i className="holo-l3" />}
            </span>
            {finish === 'reverse' && <span className="rev-window" />}
            <span className="holo-top">
                <span className="holo-ovr">
                    <b>{d.rating}</b>
                    <small>{POSITION_LABEL[d.pos]}</small>
                </span>
                <span className="holo-types">
                    <Types types={d.sp.types} />
                </span>
                {captain && <span className="pc2-captain">C</span>}
            </span>
            <img className="pixel holo-art" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
            {d.item && <img className="pixel holo-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
            <span className="holo-glass">
                <span className="holo-name">{d.view.displayName}</span>
                <span className="holo-tier">
                    {TIER_SYMBOL[d.sp.tier]} {TIER_PT[d.sp.tier]}
                </span>
                <span className="holo-stats">
                    {d.stats.map((s) => (
                        <span key={s.k}>
                            <b>{s.v}</b> {s.label}
                        </span>
                    ))}
                </span>
            </span>
            <HoloLayer />
            {inst.shiny && <span className="pc2-sparkles" />}
        </>
    );
}
