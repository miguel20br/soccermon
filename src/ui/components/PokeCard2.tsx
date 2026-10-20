import { type CSSProperties, useRef } from 'react';
import { type AttrKey, computeAttributes, type Position } from '../../engine/attributes';
import { MOVES, SPECIES, type Tier } from '../../engine/data';
import { evolvedRating } from '../../engine/evolution';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { applyModifiers, attributeModifiers } from '../../engine/modifiers';
import { moveProfile } from '../../engine/moves';
import { type Edition, editionOf, ICON_CHANCE, mvpLevel, specialBonus } from '../../engine/specials';
import { abilityName, iconTitle, itemName, moveName, typeName } from '../../i18n';
import { type Translator, useT } from '../../i18n/react';
import type { CareerSeal } from '../../store/profile';
import { CareerSealIcon, ShinySpark } from '../profile/icons';
import { EDITION, type FINISH_LABEL, finishOf, type METAL, metalOf, RARITY } from '../rarity';
import { ratingAt } from '../rating';
import { TYPE_COLOR } from '../type-colors';
import { cardSprite } from './PokeCard';
import './pokecard2.css';
import { Tip } from './Tip';
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
export type CardVariant = 'metal' | 'figurinha' | 'sticker' | 'tcg' | 'dex' | HoloFinish;

export const HOLO_FINISHES: HoloFinish[] = ['holo', 'rainbow', 'reverse', 'cosmos', 'radiant', 'gold'];

export const VARIANT_LABEL: Record<CardVariant, string> = {
    metal: 'Metal',
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

/** Atributos mostrados na carta (a sigla vem do dicionário: common.attrShort). */
const FIELD_STATS: AttrKey[] = ['pace', 'shooting', 'passing', 'dribble', 'tackling', 'strength'];
const GK_STATS: AttrKey[] = ['goalkeeping', 'positioning', 'strength', 'pace', 'passing', 'stamina'];

const TIER_SYMBOL: Record<Tier, string> = {
    common: '●',
    uncommon: '◆',
    rare: '★',
    epic: '★★',
    legendary: '★★★',
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
    /** Selo de carreira na faixa do nome (carta Metal), com a dica dele. */
    seal?: { kind: CareerSeal; tip: string };
    /** Dicas dos selos entram no Tab (fora de botão; a carta clicável já diz a edição no aria-label). */
    tipFocus?: boolean;
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

function cardData(inst: PokemonInstance, tr: Translator, position?: Position) {
    const view = viewInstance(inst);
    const sp = view.species;
    const pos = position ?? view.naturalPosition;
    const { rating, display, fit } = ratingAt(inst, pos);
    // setinha de bônus/penalidade que vai com a carta (edição, habilidade, item, Fada): quanto o atributo
    // vale a mais (ou a menos) em campo em relação ao Pokémon "puro"
    const base = computeAttributes(sp, inst.level);
    const final = applyModifiers(base, attributeModifiers(inst));
    const stats = (pos === 'GK' ? GK_STATS : FIELD_STATS).map((k) => ({
        k,
        label: tr.d.common.attrShort[k],
        v: Math.round(view.attributes[k]),
        delta: Math.round(final[k] - base[k]),
    }));
    // selo de evolução: a nota que ele vira na mesma vaga se evoluir (carta = campo)
    const evo = evolvedRating(inst, pos);
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
        evo,
        dex: String(sp.id).padStart(3, '0'),
        tr,
        item: inst.item ? { id: inst.item, name: itemName(inst.item) } : null,
        ability: abilityName(inst.ability),
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

export function PokeCard2({
    inst,
    variant,
    position,
    captain,
    onClick,
    weak,
    showcase,
    finish,
    size,
    seal,
    tipFocus,
}: PokeCard2Props) {
    const tr = useT();
    const d = cardData(inst, tr, position);
    const holo = isHolo(variant);
    const fig = variant === 'figurinha';
    const metal = variant === 'metal';
    const edition = editionOf(inst);
    const metalTier = metalOf(d.view.overall);
    const metalFinish = finishOf(d.sp.tier);
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
                : metal
                  ? edition
                      ? METAL_EDITION_FINISH[edition]
                      : metalFinish === 'lendario'
                        ? 'gold'
                        : 'holo'
                  : null;
    const ref = useRef<HTMLElement | null>(null);
    useHoloPointer(ref, { enabled: fin !== null, maxTilt: showcase ? 14 : 10 });
    const classes = ['pc2', holo ? 'pc2-holo' : fig ? 'pc2-fig' : `pc2-${variant}`, `tier-${d.sp.tier}`];
    if (size) classes.push(`size-${size}`);
    if (metal) {
        classes.push(edition ? `ed-${edition}` : metalFinish === 'lendario' ? 'm-lendario' : `m-${metalTier}`);
        classes.push(`m-${metalFinish}`);
        if (edition) classes.push('is-special');
        // edições em camadas: shiny por cima, Destaque por nível, Evento com o desenho do tipo
        classes.push('pr');
        if (inst.shiny) classes.push('pr-shiny');
        if (edition === 'destaque') classes.push(`pr-d${inst.special?.level ?? 1}`);
        if (edition === 'evento') classes.push(`pr-ev-${(inst.special?.type ?? '').toLowerCase()}`);
    }
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
    const label = tr.t('team.card.ariaFull', {
        name: d.view.displayName,
        rating: d.display,
        pos: tr.d.common.pos[d.pos],
        tier: tr.d.common.tier[d.sp.tier],
        edition: edition ? tr.t('team.card.editionAria', { label: tr.d.common.edition[edition] }) : '',
        evo: d.evo ? tr.t('team.card.evoAria', { name: SPECIES[d.evo.into - 1].name, r: d.evo.rating }) : '',
    });
    // Evento: a cor é a do tipo do evento (não a do 1º tipo do Pokémon)
    const style =
        metal && edition === 'evento'
            ? ({ ...d.style, '--t1': TYPE_COLOR[inst.special?.type ?? ''] ?? '#888' } as CSSProperties)
            : d.style;
    const base = metal ? (
        <Metal
            inst={inst}
            d={d}
            captain={captain}
            edition={edition}
            metalLabel={metalLabel(tr, metalTier, metalFinish)}
            seal={seal}
            tipFocus={!!tipFocus && !onClick}
        />
    ) : fig ? (
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
            {fin && !holo && !fig && !metal && <HoloLayer />}
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
                style={style}
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
            style={style}
            role="img"
            aria-label={label}
        >
            {body}
        </div>
    );
}

function Types({ types, tr }: { types: string[]; tr: Translator }) {
    return (
        <>
            {types.map((t) => (
                <i key={t} className="pc2-type" style={{ background: TYPE_COLOR[t] }} title={typeName(t, tr.lang)} />
            ))}
        </>
    );
}

// ---------------------------------------------------------------- Metal (a carta do jogo)
/** Acabamento holográfico das edições especiais na carta Metal. */
const METAL_EDITION_FINISH: Record<Edition, HoloFinish> = {
    shiny: 'rainbow',
    destaque: 'gold',
    icone: 'cosmos',
    evento: 'radiant',
};
const metalLabel = (tr: Translator, m: keyof typeof METAL, f: keyof typeof FINISH_LABEL) =>
    f === 'lendario'
        ? tr.t('team.card.legendary')
        : tr.t(f === 'brilhante' ? 'team.card.metalRare' : 'team.card.metalCommon', { metal: tr.d.common.metal[m] });

/** Etiqueta da edição especial ("Evento · Fogo", "Ícone", "Destaque II"...). */
function editionTag(tr: Translator, inst: PokemonInstance, edition: Edition | null) {
    if (edition === 'evento') return tr.t('team.card.event', { type: typeName(inst.special?.type ?? '', tr.lang) });
    if (!edition) return null;
    // Ícone que levou MVP: selo "MVP n" (a carta continua Ícone, com o fundo de galáxia)
    if (edition === 'icone' && inst.special?.level)
        return `${tr.d.common.edition.icone} · MVP${inst.special.level > 1 ? ` ${inst.special.level}` : ''}`;
    const level = inst.special?.level ?? 1;
    return `${tr.d.common.edition[edition]}${level > 1 ? ` ${'I'.repeat(level)}` : ''}`;
}

/** Título da carta Ícone no idioma do jogo (só quando a carta tem título salvo). */
const specialTitle = (inst: PokemonInstance, tr: Translator) =>
    inst.special?.title ? iconTitle(inst.speciesId, inst.special.title, tr.lang) : undefined;

/**
 * Carta minimalista: o metal (bronze/prata/ouro pela nota) diz se a carta é boa; o acabamento diz a
 * raridade (fosco = comum, brilhante = raro, creme e dourado = lendário). Nota grande, atributos grandes,
 * só o símbolo do tipo bem sutil no fundo. Edições especiais têm moldura própria e uma etiqueta.
 */
function Metal({
    inst,
    d,
    captain,
    edition,
    metalLabel: label,
    seal,
    tipFocus,
}: VariantProps & {
    edition: Edition | null;
    metalLabel: string;
    seal?: PokeCard2Props['seal'];
    tipFocus: boolean;
}) {
    const theme =
        edition === 'evento' && inst.special?.type
            ? inst.special.type
            : d.sp.types[0] === 'Normal' && d.sp.types[1]
              ? d.sp.types[1]
              : d.sp.types[0];
    const tag = layerTag(d.tr, inst, edition);
    const mvp = mvpLevel(inst);
    const dLevel = edition === 'destaque' ? mvp : 0;
    const tr = d.tr;
    return (
        <>
            {edition === 'evento' && <span className="pr-ev" />}
            {dLevel === 3 && (
                <>
                    <span className="pr-rays" />
                    <span className="pr-dust" />
                </>
            )}
            {dLevel >= 2 && <span className="pr-sweep" />}
            <span className="m-top">
                <span
                    className="m-mark"
                    style={{ '--type-icon': `url(/assets/types/${theme.toLowerCase()}.png)` } as CSSProperties}
                />
                <span className="m-left">
                    <b className="m-ovr">{d.display}</b>
                    <span className="m-pos">{d.tr.d.common.posShort[d.pos]}</span>
                    <span className="m-types">
                        <TypeIcons types={d.sp.types} />
                    </span>
                    {captain && <span className="pc2-captain">C</span>}
                    {d.evo && <EvoBadge evo={d.evo} now={d.rating} tr={d.tr} />}
                </span>
                <img className="pixel m-art" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
                {d.item && <img className="pixel m-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
                {tag && (
                    <Tip className="m-tag" text={editionTip(tr, inst, edition)} focusable={tipFocus}>
                        {tag}
                    </Tip>
                )}
                {mvp > 0 && (
                    <Tip
                        className="pr-stamp-tip"
                        focusable={tipFocus}
                        text={tr.t(mvp === 1 ? 'team.card.tipMvpOne' : 'team.card.tipMvp', {
                            n: mvp,
                            bonus: specialBonus(inst),
                        })}
                    >
                        <MvpStamp level={mvp} />
                    </Tip>
                )}
            </span>
            <span className="m-name">
                <span className="m-nm">{d.view.displayName}</span>
                <small>{specialTitle(inst, d.tr) ?? label}</small>
                {seal && (
                    <Tip className="m-seal" text={seal.tip} focusable={tipFocus}>
                        <CareerSealIcon seal={seal.kind} className="m-seal-icon" />
                    </Tip>
                )}
            </span>
            <span className="m-stats">
                {d.stats.map((s) => (
                    <span key={s.k}>
                        <b>{s.v}</b>
                        <i>{s.label}</i>
                        {s.delta !== 0 && (
                            <em className={`m-mod ${s.delta > 0 ? 'up' : 'down'}`}>
                                {s.delta > 0 ? `▲${s.delta}` : `▼${-s.delta}`}
                            </em>
                        )}
                    </span>
                ))}
            </span>
            <HoloLayer />
            {inst.shiny && <span className="pr-sparkles" />}
        </>
    );
}

/** Etiqueta da carta Metal: só a edição base (o nível vai no selo MVP), com a estrelinha quando é shiny. */
function layerTag(tr: Translator, inst: PokemonInstance, edition: Edition | null) {
    if (!edition) return null;
    const name =
        edition === 'evento'
            ? tr.t('team.card.event', { type: typeName(inst.special?.type ?? '', tr.lang) })
            : tr.d.common.edition[edition];
    return (
        <>
            {inst.shiny && <ShinySpark className="pr-spark" />}
            {name}
        </>
    );
}

/** Pontas do selo (roseta de 16 pontas), calculadas uma vez. */
const ROSETTE = Array.from({ length: 32 }, (_, i) => {
    const a = (i * Math.PI) / 16 - Math.PI / 2;
    const r = i % 2 ? 16.6 : 19.4;
    return `${(20 + r * Math.cos(a)).toFixed(2)},${(20 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');
const STAR = 'M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 16.9l-5.9 3.3 1.3-6.6L2.5 9l6.6-.8z';

/** Dica da etiqueta: o que é a edição (e o shiny por cima, quando tem). */
function editionTip(tr: Translator, inst: PokemonInstance, edition: Edition | null): string {
    const base =
        edition === 'icone'
            ? tr.t('team.card.tipIcone', { odds: Math.round(1 / ICON_CHANCE) })
            : edition === 'evento'
              ? tr.t('team.card.tipEvento', { type: typeName(inst.special?.type ?? '', tr.lang) })
              : edition === 'destaque'
                ? tr.t('team.card.tipDestaque')
                : tr.t('team.card.tipShiny');
    return inst.shiny && edition !== 'shiny' ? `${base} ${tr.t('team.card.tipShinyOn')}` : base;
}

/** Selo MVP: 1 bronze simples, 2 prata com brilho correndo, 3 ouro com raios girando. */
function MvpStamp({ level }: { level: number }) {
    const n = Math.min(3, level);
    return (
        <span className={`pr-stamp lv-${n}`} aria-hidden>
            {n === 3 && <i className="pr-stamp-rays" />}
            <svg viewBox="0 0 40 40" aria-hidden>
                <polygon className="pr-stamp-out" points={ROSETTE} />
                <circle className="pr-stamp-in" cx="20" cy="20" r="13.2" />
                <path className="pr-stamp-hi" d="M9.5 17a11 11 0 0 1 21 0" />
                <text x="20" y="21.6" textAnchor="middle">
                    MVP
                </text>
                {Array.from({ length: n }, (_, i) => (
                    <path
                        // biome-ignore lint/suspicious/noArrayIndexKey: estrelas iguais, só a quantidade importa
                        key={i}
                        d={STAR}
                        transform={`translate(${20 - n * 2.6 + i * 5.2 + 0.32} 24.6) scale(0.19)`}
                    />
                ))}
            </svg>
            {n >= 2 && <i className="pr-stamp-shine" />}
        </span>
    );
}

/** Selo "vira 85": seta desenhada + a nota depois de evoluir (para baixo se a forma nova joga pior na vaga). */
export function EvoBadge({ evo, now, tr }: { evo: { into: number; rating: number }; now: number; tr: Translator }) {
    const down = evo.rating < now;
    return (
        <span
            className={`m-evo${down ? ' down' : ''}`}
            title={tr.t('team.card.evoTitle', { name: SPECIES[evo.into - 1].name, r: evo.rating })}
        >
            <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d={down ? 'M5 9 1 4.5h2.5V1h3v3.5H9z' : 'M5 1 9 5.5H6.5V9h-3V5.5H1z'} />
            </svg>
            <b>{evo.rating}</b>
        </span>
    );
}

// ---------------------------------------------------------------- Figurinha Holo (galeria)
/**
 * Figurinha + holográfico: moldura na cor da raridade, "foto" com o fundo animado do tipo e brilho que
 * cresce com a raridade. Edições especiais trocam a moldura por um acabamento próprio e ganham faixa;
 * a gema na faixa do nome continua mostrando a raridade.
 */
function Figurinha({ inst, d, captain, edition }: VariantProps & { edition: Edition | null }) {
    const ribbon = editionTag(d.tr, inst, edition);
    const sub = specialTitle(inst, d.tr) ?? `${TIER_SYMBOL[d.sp.tier]} ${d.tr.d.common.tier[d.sp.tier]}`;
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
                    <small>{d.tr.d.common.pos[d.pos]}</small>
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
                <i className="fg-gem" title={d.tr.d.common.tier[d.sp.tier]} />
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
                    <small>{d.tr.d.common.pos[d.pos]}</small>
                </span>
                {captain && <span className="pc2-captain">C</span>}
                <img className="pixel st-art" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
                <span className="st-types">
                    <Types types={d.sp.types} tr={d.tr} />
                </span>
                {d.item && <img className="pixel st-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
            </span>
            <span className="st-band">
                <span className="st-name">{d.view.displayName}</span>
                <span className="st-sub">
                    {d.sp.types.map((t) => typeName(t, d.tr.lang)).join(' / ')} · {d.tr.d.common.tier[d.sp.tier]}
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
/** Número com uma casa: vírgula em português, ponto em inglês. */
const num = (v: number, tr: Translator) => {
    const s = v.toFixed(1);
    return tr.lang === 'pt' ? s.replace('.', ',') : s;
};

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
                <span className="tcg-stage">{d.tr.t(sp.prevo ? 'team.card.evolved' : 'team.card.basic')}</span>
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
                {d.tr.t('team.card.dexNo')} {d.dex} · {d.tr.d.common.pos[d.pos]} · {num(sp.heightm, d.tr)} m ·{' '}
                {num(sp.weightkg, d.tr)} kg
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
                            <b className="tcg-atk-name">{moveName(m)}</b>
                            <span className="tcg-dmg">{data.power || ''}</span>
                            <small className="tcg-atk-desc">{d.tr.d.team.card.kindTcg[moveProfile(m).kind]}</small>
                        </span>
                    );
                })}
            </span>
            <span className="tcg-foot">
                <span>
                    <small>{d.tr.t('team.card.ability')}</small>
                    {d.ability}
                </span>
                <span>
                    <small>{d.tr.t('team.card.positionsLower')}</small>
                    {d.view.positions.map((p) => d.tr.d.common.pos[p]).join(' · ')}
                </span>
                <span>
                    <small>{d.tr.t('team.card.item')}</small>
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
                <span className="dex-tier">{d.tr.d.common.tier[d.sp.tier]}</span>
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
                        {d.tr.t('team.card.dexPos')}: {d.tr.d.common.pos[d.pos].toUpperCase()} ·{' '}
                        {d.sp.types.map((t) => typeName(t, d.tr.lang).toUpperCase()).join('/')}
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
                    <small>{d.tr.d.common.pos[d.pos]}</small>
                </span>
                <span className="holo-types">
                    <Types types={d.sp.types} tr={d.tr} />
                </span>
                {captain && <span className="pc2-captain">C</span>}
            </span>
            <img className="pixel holo-art" src={cardSprite(inst)} alt="" loading="lazy" draggable={false} />
            {d.item && <img className="pixel holo-item" src={itemSprite(d.item.id)} alt={d.item.name} />}
            <span className="holo-glass">
                <span className="holo-name">{d.view.displayName}</span>
                <span className="holo-tier">
                    {TIER_SYMBOL[d.sp.tier]} {d.tr.d.common.tier[d.sp.tier]}
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
