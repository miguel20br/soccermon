import type { AttrKey } from './attributes';
import type { StatusKind } from './moves';

/**
 * Habilidades → passivas de futsal. Só as curadas abaixo têm efeito; as demais são neutras.
 * `mods` são multiplicadores permanentes de atributo.
 */
export interface AbilityEffect {
    mods?: Partial<Record<AttrKey, number>>;
    /** Overgrow/Blaze/Torrent/Swarm: bônus nos minutos finais de cada tempo. */
    clutch?: number;
    /** Afeta rivais num raio (m). */
    aura?: { radius: number; attr: AttrKey; factor: number };
    /** Quem dá carrinho/desarme neste Pokémon pode sofrer status. */
    onTackled?: { chance: number; status: StatusKind | 'infatuation' };
    /** Imunidade a status (ou a todos). */
    immune?: StatusKind[] | 'all';
    immuneDebuff?: boolean;
    /** Bônus quando está com status (Guts, Marvel Scale). */
    whenStatused?: Partial<Record<AttrKey, number>>;
    /** Bônus na interceptação de passes (Levitate: domina a bola alta). */
    interceptBonus?: number;
    /** Multiplica a força dos golpes fracos (Technician) ou a chance de status (Serene Grace). */
    weakMoveBoost?: number;
    statusChanceBoost?: number;
    /** Pressure: rivais perto gastam mais fôlego. */
    drainAura?: number;
    /** Multiplica a duração dos status recebidos. */
    statusDuration?: number;
    /** Multiplicador extra no efeito de tipo (Adaptability). */
    typeBoost?: number;
    /** Ganha fôlego ao longo do jogo (Regenerator, Rain Dish, Ice Body). */
    regen?: number;
    /** Ditto: vira o melhor Pokémon da posição em campo (tratado em match.ts, vale pra qualquer Ditto). */
    transform?: boolean;
    /** Ganha atributos ao sofrer desarme (Anger Point, Defiant, Justified, Steadfast). */
    onTackledBoost?: Partial<Record<AttrKey, number>>;
}

export const ABILITY_EFFECTS: Record<string, AbilityEffect> = {
    imposter: { transform: true },
    // velocidade
    swiftswim: { mods: { pace: 1.05 } },
    chlorophyll: { mods: { pace: 1.05 } },
    sandrush: { mods: { pace: 1.05 } },
    runaway: { mods: { pace: 1.04, dribble: 1.03 } },
    quickfeet: { mods: { pace: 1.06 }, whenStatused: { pace: 1.1 } },
    unburden: { mods: { pace: 1.05 } },
    tangledfeet: { mods: { dribble: 1.05 } },
    // ataque
    hustle: { mods: { shooting: 1.1, passing: 0.95 } },
    sheerforce: { mods: { shooting: 1.07 } },
    ironfist: { mods: { shooting: 1.05, tackling: 1.03 } },
    reckless: { mods: { shooting: 1.08, tackling: 1.04 } },
    sniper: { mods: { shooting: 1.05, passing: 1.03 } },
    noguard: { mods: { shooting: 1.08, positioning: 0.96 } },
    compoundeyes: { mods: { passing: 1.06, shooting: 1.03 } },
    keeneye: { mods: { passing: 1.05 }, immuneDebuff: true },
    analytic: { mods: { passing: 1.06 } },
    tintedlens: { typeBoost: 1.2 },
    adaptability: { typeBoost: 1.3 },
    technician: { weakMoveBoost: 1.5 },
    serenegrace: { statusChanceBoost: 2 },
    skilllink: { mods: { dribble: 1.06 } },
    moxie: { mods: { shooting: 1.04 } },
    overgrow: { clutch: 1.1 },
    blaze: { clutch: 1.1 },
    torrent: { clutch: 1.1 },
    swarm: { clutch: 1.1 },
    // defesa e corpo
    rockhead: { mods: { strength: 1.07 } },
    shellarmor: { mods: { strength: 1.06, tackling: 1.03 } },
    battlearmor: { mods: { strength: 1.06, tackling: 1.03 } },
    sturdy: { mods: { strength: 1.06, goalkeeping: 1.06 } },
    thickfat: { mods: { strength: 1.08, pace: 0.97 } },
    weakarmor: { mods: { strength: 0.95, pace: 1.06 } },
    multiscale: { mods: { strength: 1.06, positioning: 1.05 } },
    filter: { mods: { positioning: 1.05 } },
    hypercutter: { mods: { tackling: 1.05 }, immuneDebuff: true },
    clearbody: { immuneDebuff: true },
    bigpecks: { mods: { tackling: 1.03 }, immuneDebuff: true },
    stickyhold: { mods: { dribble: 1.06 } },
    // leitura de jogo
    innerfocus: { mods: { positioning: 1.04 }, immune: ['confusion'], immuneDebuff: true },
    owntempo: { immune: ['confusion'] },
    oblivious: { immune: ['confusion'], immuneDebuff: true },
    levitate: { interceptBonus: 0.15, mods: { positioning: 1.03 } },
    forewarn: { mods: { positioning: 1.05 } },
    anticipation: { mods: { positioning: 1.05 } },
    synchronize: { mods: { passing: 1.03 } },
    // auras
    intimidate: { aura: { radius: 4, attr: 'shooting', factor: 0.93 } },
    unnerve: { aura: { radius: 4, attr: 'passing', factor: 0.95 } },
    stench: { aura: { radius: 2.5, attr: 'dribble', factor: 0.95 } },
    pressure: { drainAura: 1.3 },
    // contato
    static: { onTackled: { chance: 0.3, status: 'par' } },
    poisonpoint: { onTackled: { chance: 0.3, status: 'psn' } },
    poisontouch: { onTackled: { chance: 0.3, status: 'psn' } },
    flamebody: { onTackled: { chance: 0.3, status: 'brn' } },
    effectspore: { onTackled: { chance: 0.3, status: 'slp' } },
    cutecharm: { onTackled: { chance: 0.3, status: 'infatuation' } },
    angerpoint: { onTackledBoost: { shooting: 1.15, strength: 1.1 } },
    defiant: { onTackledBoost: { shooting: 1.1 } },
    justified: { onTackledBoost: { strength: 1.1 } },
    steadfast: { onTackledBoost: { pace: 1.1 } },
    rattled: { onTackledBoost: { pace: 1.1 } },
    // status
    guts: { whenStatused: { shooting: 1.2, strength: 1.1 } },
    marvelscale: { whenStatused: { strength: 1.2, tackling: 1.1 } },
    limber: { immune: ['par'] },
    insomnia: { immune: ['slp'] },
    vitalspirit: { immune: ['slp'] },
    earlybird: { statusDuration: 0.5 },
    immunity: { immune: ['psn'] },
    waterveil: { immune: ['brn'] },
    magicguard: { immune: ['psn', 'brn'] },
    naturalcure: { statusDuration: 0.5 },
    shedskin: { statusDuration: 0.6 },
    hydration: { statusDuration: 0.6 },
    leafguard: { statusDuration: 0.6 },
    shielddust: { immune: ['par', 'psn', 'brn'] },
    // fôlego
    regenerator: { regen: 0.0012 },
    raindish: { regen: 0.0008 },
    icebody: { regen: 0.0008 },
    gluttony: { regen: 0.0006 },
    harvest: { regen: 0.0006 },
    healer: { regen: 0.0008 },
};

export function abilityEffect(id: string | null | undefined): AbilityEffect {
    return (id && ABILITY_EFFECTS[id]) || {};
}

export function isStatusImmune(eff: AbilityEffect, status: StatusKind | 'infatuation'): boolean {
    if (!eff.immune) return false;
    if (eff.immune === 'all') return true;
    return status !== 'infatuation' && eff.immune.includes(status);
}
