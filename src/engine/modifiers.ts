import { abilityEffect } from './abilities';
import {
    type Attributes,
    type AttrKey,
    computeAttributes,
    eligiblePositions,
    type Position,
    positionFactor,
} from './attributes';
import { ABILITIES, MOVES, species } from './data';
import type { PokemonInstance } from './instance';
import { ITEMS } from './items';
import { computeLinks, linkFactor } from './links';
import { moveProfile } from './moves';
import { SPECIAL_BONUS, specialBonus } from './specials';
import { computeSynergies, synergyFactor } from './synergy';

/**
 * De onde vêm os bônus e penalidades de um Pokémon. É a MESMA regra que o motor usa para montar o jogador
 * (createPlayer em match.ts), então a carta e o painel nunca mostram um número diferente do que vale em campo.
 *
 * - intrínsecos (vão com a carta): edição especial (+2 em tudo), habilidade, item, tipo Fada
 * - do time (dependem da escalação): capitão, sinergia de tipo, sinergia de história, posição em que joga
 */
export type ModSource = 'edicao' | 'habilidade' | 'item' | 'tipo' | 'capitao' | 'sinergia' | 'historia' | 'posicao';

export interface AttrModifier {
    source: ModSource;
    label: string;
    /** Atributos afetados ('all' = todos; 'role' = os que importam para a posição). */
    attrs: AttrKey[] | 'all' | 'role';
    /** Multiplicador (1.05 = +5%). Ausente quando é soma (edição). */
    factor?: number;
    /** Pontos somados (edição especial). */
    add?: number;
}

export interface MoveModifier {
    moveId: string;
    label: string;
    /** Multiplicador da força do golpe; 0 = travado. */
    factor: number;
}

export interface TeamContext {
    lineup?: readonly PokemonInstance[];
    captain?: PokemonInstance | null;
    role?: Position | null;
}

const ALL: AttrKey[] = [
    'pace',
    'dribble',
    'shooting',
    'passing',
    'tackling',
    'strength',
    'positioning',
    'stamina',
    'goalkeeping',
];

/** Nome do atributo na linha do bônus (uma habilidade pode mexer em mais de um: "Sturdy: Força +6%"). */
const ATTR_NAME: Record<AttrKey, string> = {
    pace: 'Velocidade',
    dribble: 'Drible',
    shooting: 'Chute',
    passing: 'Passe',
    tackling: 'Desarme',
    strength: 'Força',
    positioning: 'Leitura',
    stamina: 'Fôlego',
    goalkeeping: 'Goleiro',
};

/** Aura do capitão: +3% para o time, +6% para quem divide tipo com ele. */
export function captainFactor(captain: PokemonInstance | null, types: readonly string[]): number {
    if (!captain) return 1;
    const capTypes = species(captain.speciesId).types;
    return types.some((t) => capTypes.includes(t)) ? 1.06 : 1.03;
}

const pct = (f: number) => `${f >= 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)}%`;

export function attributeModifiers(inst: PokemonInstance, ctx: TeamContext = {}): AttrModifier[] {
    const sp = species(inst.speciesId);
    const mods: AttrModifier[] = [];
    const bonus = specialBonus(inst);
    if (bonus)
        mods.push({ source: 'edicao', label: `Edição especial: +${SPECIAL_BONUS} em tudo`, attrs: 'all', add: bonus });

    const ability = abilityEffect(inst.ability);
    for (const [k, f] of Object.entries(ability.mods ?? {}) as [AttrKey, number][]) {
        const name = ABILITIES[inst.ability]?.name ?? inst.ability;
        mods.push({ source: 'habilidade', label: `${name}: ${ATTR_NAME[k]} ${pct(f)}`, attrs: [k], factor: f });
    }
    if (inst.item === 'choiceband') {
        mods.push({
            source: 'item',
            label: 'Choice Band: chute +15% (só o 1º golpe)',
            attrs: ['shooting'],
            factor: 1.15,
        });
    }
    // Encanto das fadas: os poucos Fada da Gen 1 são fracos de base
    if (sp.types.includes('Fairy'))
        mods.push({ source: 'tipo', label: 'Encanto (Fada): +8%', attrs: 'all', factor: 1.08 });

    // do time: valem para quem está (ou entra) em campo com essa escalação
    const lineup = ctx.lineup ?? [];
    if (ctx.captain !== undefined) {
        if (ctx.captain?.uid === inst.uid) {
            mods.push({ source: 'capitao', label: 'Capitão: +3%', attrs: 'all', factor: 1.03 });
        } else if (ctx.captain) {
            const f = captainFactor(ctx.captain, sp.types);
            const why = f > 1.03 ? 'Mesmo tipo do capitão' : 'Aura do capitão';
            mods.push({ source: 'capitao', label: `${why}: ${pct(f)}`, attrs: 'all', factor: f });
        }
    }
    if (lineup.length) {
        const syn = synergyFactor(computeSynergies(lineup), sp.types);
        if (syn > 1)
            mods.push({ source: 'sinergia', label: `Sinergia de tipo: ${pct(syn)}`, attrs: 'all', factor: syn });
        const link = linkFactor(computeLinks(lineup), inst.uid);
        if (link > 1)
            mods.push({ source: 'historia', label: `Sinergia de história: ${pct(link)}`, attrs: 'all', factor: link });
    }
    if (ctx.role) {
        const f = positionFactor(eligiblePositions(computeAttributes(sp, inst.level), sp.id), ctx.role);
        if (f !== 1) mods.push({ source: 'posicao', label: `Fora da posição: ${pct(f)}`, attrs: 'role', factor: f });
    }
    return mods;
}

const applies = (m: AttrModifier, k: AttrKey, role: Position | null | undefined) =>
    m.attrs === 'all' ||
    (m.attrs === 'role' ? (role === 'GK' ? k === 'goalkeeping' : k !== 'goalkeeping') : m.attrs.includes(k));

/** Atributos com todos os modificadores aplicados (o que vale em campo, antes de fadiga/tática/buffs). */
export function applyModifiers(base: Attributes, mods: readonly AttrModifier[], role?: Position | null): Attributes {
    const out = { ...base };
    for (const k of ALL) {
        let v = base[k];
        for (const m of mods) if (m.add && applies(m, k, role)) v = Math.min(99, v + m.add);
        for (const m of mods) if (m.factor && applies(m, k, role)) v *= m.factor;
        out[k] = v;
    }
    return out;
}

/** Golpes fortalecidos ou travados (item de tipo, Technician, Choice Band). */
export function moveModifiers(inst: PokemonInstance): MoveModifier[] {
    const out: MoveModifier[] = [];
    const ability = abilityEffect(inst.ability);
    const item = inst.item ? ITEMS[inst.item] : null;
    inst.moves.forEach((m, i) => {
        const data = MOVES[m];
        if (!data) return;
        if (item?.type && item.type === data.type) out.push({ moveId: m, label: `${item.name}: +20%`, factor: 1.2 });
        if (ability.weakMoveBoost && data.power > 0 && data.power <= 60 && moveProfile(m).kind !== 'flavor') {
            out.push({
                moveId: m,
                label: `${ABILITIES[inst.ability]?.name ?? 'Habilidade'}: +50%`,
                factor: ability.weakMoveBoost,
            });
        }
        if (inst.item === 'choiceband' && i > 0) out.push({ moveId: m, label: 'Choice Band: travado', factor: 0 });
    });
    return out;
}
