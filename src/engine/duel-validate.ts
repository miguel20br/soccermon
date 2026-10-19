import { POSITIONS, type Position } from './attributes';
import { MOVES, SPECIES_BY_ID } from './data';
import { EVO_THRESHOLD } from './evolution';
import { FORMATIONS, type FormationId } from './formations';
import { DEFAULT_LEVEL, type PokemonInstance } from './instance';
import { ITEMS } from './items';
import { defaultMoveset } from './moves';
import { CORNER_PLANS } from './runners/live-runner';
import { DESTAQUE_MAX_LEVEL, EVENT_TYPES, type Special } from './specials';
import type { CornerPlan, Tactic, TeamSetup } from './state';

/**
 * Time do duelo (modo "Time pronto") como receita: só o que o jogador escolheu ou ganhou na copa. Atributos, nota e
 * tudo mais saem do motor de novo, nunca do save de quem manda (que qualquer um edita no DevTools). Este arquivo não
 * usa DOM: o mesmo código pode rodar na Edge Function do ranqueado (docs/planos/multiplayer-revisao.md, §3.4).
 */
export interface DuelMonRecipe {
    speciesId: number;
    moves: string[];
    ability: string;
    shiny: boolean;
    item?: string | null;
    special?: Special | null;
    taught?: string[];
    evo?: number;
    inherited?: Position[];
    /** Quantas vezes a carta evoluiu (+2 em tudo por evolução): sem isso o Charizard da copa jogava com 4 a menos. */
    evolved?: number;
    nickname?: string | null;
}

export interface DuelTeamRecipe {
    name: string;
    color: number;
    formation: FormationId;
    tactic: Tactic;
    /** 5 titulares na ordem das vagas da formação. */
    lineup: DuelMonRecipe[];
    bench: DuelMonRecipe[];
    /** Índice do capitão em [...lineup, ...bench] (-1 = sem capitão). */
    captain: number;
    /** Instrução de escanteio (padrão: Variar) e o cobrador, índice em [...lineup, ...bench] (-1 = automático). */
    corner?: CornerPlan;
    cornerTaker?: number;
}

/**
 * Limite de cartas especiais no Time pronto, regra da sala escolhida por quem cria: nenhuma, até 3 ou livre (null).
 * Conta como especial toda carta com edição: Shiny, Destaque, Ícone ou Evento.
 */
export type SpecialLimit = 0 | 3 | null;
export const SPECIAL_LIMITS: SpecialLimit[] = [0, 3, null];
export const DEFAULT_SPECIAL_LIMIT: SpecialLimit = 3;

/** Quantas cartas especiais (Shiny, Destaque, Ícone, Evento) o time tem. */
export const countSpecials = (r: Pick<DuelTeamRecipe, 'lineup' | 'bench'>): number =>
    [...r.lineup, ...r.bench].filter((m) => !!m?.special || !!m?.shiny).length;

const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];
/**
 * Barra de evolução guardada entre partidas: abaixo do limiar (com a barra cheia ele já teria evoluído). A copa pode
 * guardar um pouco acima quando o limiar passa no fim da partida, sem bola parada: a receita leva no máximo isto.
 */
export const MAX_EVO = EVO_THRESHOLD - 0.1;

const monRecipe = (p: PokemonInstance): DuelMonRecipe => ({
    speciesId: p.speciesId,
    moves: [...p.moves],
    ability: p.ability,
    shiny: !!p.shiny,
    item: p.item ?? null,
    special: p.special ?? null,
    taught: p.taught ? [...p.taught] : undefined,
    evo: p.evo === undefined ? undefined : Math.min(p.evo, MAX_EVO),
    inherited: p.inherited ? [...p.inherited] : undefined,
    evolved: p.evolved || undefined,
    nickname: p.nickname ?? null,
});

/** Receita de um time do save (o que vai pela rede). */
export function teamRecipe(t: TeamSetup): DuelTeamRecipe {
    const all = [...t.lineup, ...t.bench];
    return {
        name: t.name,
        color: t.color,
        formation: t.formation ?? '1-2-1',
        tactic: t.tactic,
        lineup: t.lineup.map(monRecipe),
        bench: t.bench.map(monRecipe),
        captain: all.findIndex((p) => p.uid === t.captainUid),
        corner: t.corner ?? 'mixed',
        cornerTaker: t.cornerTakerUid ? all.findIndex((p) => p.uid === t.cornerTakerUid) : -1,
    };
}

const isStr = (v: unknown, max = 40): v is string => typeof v === 'string' && v.length <= max;

function monProblems(m: DuelMonRecipe, where: string): string[] {
    const out: string[] = [];
    const bad = (what: string) => out.push(`${where}: ${what}`);
    if (!m || typeof m !== 'object') return [`${where}: vazio`];
    const sp = SPECIES_BY_ID.get(m.speciesId);
    if (!sp || m.speciesId > 151) return [`${where}: espécie ${m.speciesId} não existe`];
    if (typeof m.shiny !== 'boolean') bad('shiny');
    if (!(m.speciesId === 132 ? m.ability === 'imposter' : sp.abilities.includes(m.ability)))
        bad(`habilidade ${m.ability}`);
    const taught = m.taught ?? [];
    if (!Array.isArray(taught) || !taught.every((x) => isStr(x) && MOVES[x] && sp.learnset.includes(x))) bad('MT');
    const allowed = new Set([...defaultMoveset(sp), ...taught]);
    if (
        !Array.isArray(m.moves) ||
        m.moves.length < 1 ||
        m.moves.length > 4 ||
        new Set(m.moves).size !== m.moves.length ||
        !m.moves.every((x) => isStr(x) && allowed.has(x))
    )
        bad('golpes');
    if (m.item != null && !(isStr(m.item) && ITEMS[m.item])) bad(`item ${m.item}`);
    const s = m.special;
    if (s != null) {
        const ok =
            typeof s === 'object' &&
            ((s.kind === 'icone' &&
                (s.title === undefined || isStr(s.title, 60)) &&
                (s.level === undefined ||
                    (Number.isInteger(s.level) && s.level >= 0 && s.level <= DESTAQUE_MAX_LEVEL))) ||
                (s.kind === 'evento' &&
                    isStr(s.type) &&
                    EVENT_TYPES.includes(s.type) &&
                    (s.level === undefined ||
                        (Number.isInteger(s.level) && s.level >= 0 && s.level <= DESTAQUE_MAX_LEVEL))) ||
                (s.kind === 'destaque' &&
                    (s.level === undefined ||
                        (Number.isInteger(s.level) && s.level >= 1 && s.level <= DESTAQUE_MAX_LEVEL))));
        if (!ok) bad('edição');
    }
    if (m.evo !== undefined && !(typeof m.evo === 'number' && m.evo >= 0 && m.evo <= MAX_EVO)) bad('evolução');
    if (
        m.inherited !== undefined &&
        !(Array.isArray(m.inherited) && m.inherited.length <= 3 && m.inherited.every((x) => POSITIONS.includes(x)))
    )
        bad('posição herdada');
    // evoluiu no máximo quantas vezes a linha dela deixa (Charizard: 2, Charmander: 0)
    let depth = 0;
    for (let id = sp.prevo; id; id = SPECIES_BY_ID.get(id)?.prevo ?? null) depth++;
    if (m.evolved !== undefined && !(Number.isInteger(m.evolved) && m.evolved >= 0 && m.evolved <= depth))
        bad('evoluções');
    if (m.nickname != null && !isStr(m.nickname, 20)) bad('apelido');
    return out;
}

/**
 * Confere se o time é "qualquer time que uma copa poderia dar": 5 titulares e até 2 reservas, espécies da Gen 1 sem
 * repetir, nível padrão, habilidade da espécie, golpes do moveset dela ou de MT que ela aprende, item que existe e
 * edições possíveis, dentro do limite de cartas especiais da sala. Devolve a lista de problemas (vazia = válido).
 */
export function validarTimeDuelo(r: unknown, specialLimit: SpecialLimit = null): string[] {
    const t = r as DuelTeamRecipe;
    if (!t || typeof t !== 'object') return ['time vazio'];
    const out: string[] = [];
    if (!isStr(t.name, 30)) out.push('nome');
    if (!Number.isInteger(t.color) || t.color < 0 || t.color > 0xffffff) out.push('cor');
    if (!FORMATIONS[t.formation]) out.push('formação');
    if (!TACTICS.includes(t.tactic)) out.push('tática');
    if (!Array.isArray(t.lineup) || t.lineup.length !== 5) return [...out, 'titulares'];
    if (!Array.isArray(t.bench) || t.bench.length > 2) return [...out, 'banco'];
    const all = [...t.lineup, ...t.bench];
    all.forEach((m, i) => {
        out.push(...monProblems(m, `#${i + 1}`));
    });
    // o draft não repete espécie, mas a evolução repete (Charmander que vira o Charmeleon que já estava no time):
    // a cópia a mais tem que ter evoluído
    const fresh = all.filter((m) => !m?.evolved).map((m) => m?.speciesId);
    if (new Set(fresh).size !== fresh.length) out.push('espécie repetida');
    // o capitão pode estar no banco (a copa deixa: ele entra depois)
    if (!Number.isInteger(t.captain) || t.captain < -1 || t.captain >= all.length) out.push('capitão');
    if (t.corner !== undefined && !CORNER_PLANS.includes(t.corner)) out.push('escanteio');
    // o cobrador tem que ser alguém do time (ou o automático do motor)
    if (
        t.cornerTaker !== undefined &&
        !(Number.isInteger(t.cornerTaker) && t.cornerTaker >= -1 && t.cornerTaker < all.length)
    )
        out.push('cobrador do escanteio');
    const specials = countSpecials(t);
    if (specialLimit !== null && specials > specialLimit)
        out.push(`cartas especiais: ${specials} (a sala deixa ${specialLimit})`);
    return out;
}

/** Time de verdade a partir da receita (uids novos, com o lado no fim; nível e condição padrão). */
export function teamFromRecipe(r: DuelTeamRecipe, suffix: string): TeamSetup {
    const make = (m: DuelMonRecipe, i: number): PokemonInstance => {
        const p: PokemonInstance = {
            uid: `${m.speciesId}-${i}${suffix}`,
            speciesId: m.speciesId,
            level: DEFAULT_LEVEL,
            xp: 0,
            moves: [...m.moves],
            ability: m.ability,
            shiny: m.shiny,
            nickname: m.nickname ?? null,
            condition: 1,
            item: m.item ?? null,
            special: m.special ?? null,
        };
        if (m.taught?.length) p.taught = [...m.taught];
        if (m.evo !== undefined) p.evo = m.evo;
        if (m.inherited?.length) p.inherited = [...m.inherited];
        if (m.evolved) p.evolved = m.evolved;
        return p;
    };
    const all = [...r.lineup, ...r.bench].map(make);
    return {
        name: r.name,
        lineup: all.slice(0, 5),
        bench: all.slice(5),
        tactic: r.tactic,
        color: r.color,
        formation: r.formation,
        captainUid: all[r.captain]?.uid ?? null,
        manualSubs: true,
        corner: r.corner ?? 'mixed',
        cornerTakerUid: r.cornerTaker !== undefined && r.cornerTaker >= 0 ? (all[r.cornerTaker]?.uid ?? null) : null,
    };
}
