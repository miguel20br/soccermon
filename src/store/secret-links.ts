import { computeLinks, LINKS, type LinkDef } from '../engine/links';
import type { MatchResult } from '../engine/runners/batch-runner';
import type { MatchEvent } from '../engine/state';

/**
 * Sinergias secretas, fase 1 (docs/planos/pesquisas/sinergias-e-animacoes.md, §3 e §5): as rivalidades, um Pokémon de
 * cada time. Só tela: não mudam a partida (nada no motor, sem ENGINE_VERSION), aparecem como "???" na escalação, se
 * revelam em campo na 1ª vez que os dois se cruzam num lance e entram no Registro de Sinergias. Puro (sem Phaser,
 * Math.random ou Date): a cena, a tela e o store leem daqui. As secretas com bônus em campo (fase 2,
 * docs/planos/sinergias-secretas-fase2.md) moram em `LINKS` (src/engine/links.ts, `secret`) e se revelam no combo ou no
 * gol de dupla (passe de um, chute do outro, os dois da mesma secreta).
 */
export interface SecretLink {
    id: string;
    /** Pares de famílias (uma de cada time, em qualquer ordem); `mirror` = a mesma espécie nos dois times. */
    pairs: readonly (readonly [readonly number[], readonly number[]])[] | 'mirror';
    /** Quantas silhuetas o Registro mostra antes de descobrir. */
    members: number;
}

export const SECRET_LINKS: readonly SecretLink[] = [
    // a abertura do Red e Green no Game Boy
    { id: 'aberturaRG', pairs: [[[94], [33]]], members: 2 },
    // a abertura do Yellow
    { id: 'aberturaYellow', pairs: [[[25], [39]]], members: 2 },
    // Pikachu x Raichu do Lt. Surge
    { id: 'vermilion', pairs: [[[25], [26]]], members: 2 },
    // o Meowth da Rocket e o choque de sempre
    { id: 'meowth', pairs: [[[52], [25]]], members: 2 },
    // o filme do Mewtwo: original contra cópia
    { id: 'clone', pairs: 'mirror', members: 2 },
    // exclusivos de versão (Red x Blue), um de cada lado
    {
        id: 'classicoVersao',
        pairs: [
            [[123], [127]],
            [
                [23, 24],
                [27, 28],
            ],
            [
                [43, 44, 45],
                [69, 70, 71],
            ],
            [
                [58, 59],
                [37, 38],
            ],
            [
                [56, 57],
                [52, 53],
            ],
        ],
        members: 2,
    },
];

/** As secretas do mesmo time (fase 2), uma por id do Registro (a 1ª definição de cada: Mestre e Aprendiz tem 53). */
export const TEAM_SECRETS: readonly LinkDef[] = LINKS.filter(
    (l, i) => l.secret && LINKS.findIndex((x) => x.secret === l.secret) === i,
);

const IDS = new Set([...SECRET_LINKS.map((s) => s.id), ...TEAM_SECRETS.map((l) => l.secret!)]);
/** Quantas secretas existem (rivalidades + do mesmo time): o total do Registro e da medalha. */
export const SECRET_TOTAL = IDS.size;

/** A secreta (rivalidade) entre um Pokémon de um time (`a`) e um do outro (`b`); a primeira da lista ganha. */
export function secretOf(a: number, b: number): string | null {
    for (const s of SECRET_LINKS) {
        if (s.pairs === 'mirror') {
            if (a === b) return s.id;
            continue;
        }
        for (const [x, y] of s.pairs)
            if ((x.includes(a) && y.includes(b)) || (y.includes(a) && x.includes(b))) return s.id;
    }
    return null;
}

/** Secretas que ligam entre os titulares dos dois times (o chip "???" da escalação). Sem repetir, na ordem da lista. */
export function rivalSecrets(home: readonly number[], away: readonly number[]): string[] {
    const found = new Set<string>();
    for (const a of home) for (const b of away) found.add(secretOf(a, b) ?? '');
    return SECRET_LINKS.map((s) => s.id).filter((id) => found.has(id));
}

/** Os dois que se cruzaram num lance (dividida, interceptação, bloqueio, defesa, golpe que acerta); senão null. */
export function duelPair(e: MatchEvent): [number, number] | null {
    switch (e.type) {
        case 'tackle':
            return [e.by, e.victim];
        case 'interception':
            return [e.by, e.from];
        case 'block':
        case 'save':
            return [e.by, e.shooter];
        case 'knockback':
            return [e.by, e.target];
        default:
            return null;
    }
}

export interface SecretHit {
    id: string;
    /** O evento do lance (o mesmo objeto da partida: a cena acha por referência). */
    event: MatchEvent;
    /** Índices dos dois na partida e a espécie de cada um na hora do lance. */
    a: number;
    b: number;
    species: [number, number];
    /** Secreta do mesmo time (fase 2): "a e b" em vez de "a x b". */
    team?: true;
}

/** A secreta do mesmo time que liga `a` e `b` (índices) com os titulares de agora do time; senão null. */
function teamSecret(sp: Map<number, { speciesId: number; team: 0 | 1 }>, a: number, b: number): string | null {
    const pa = sp.get(a);
    if (!pa || a === b || sp.get(b)?.team !== pa.team) return null;
    const lineup = [...sp]
        .filter(([, p]) => p.team === pa.team)
        .map(([i, p]) => ({ uid: `${i}`, speciesId: p.speciesId }));
    return (
        computeLinks(lineup).find((l) => l.def.secret && l.members.includes(`${a}`) && l.members.includes(`${b}`))?.def
            .secret ?? null
    );
}

/**
 * Cada secreta que aconteceu na partida, na 1ª vez: um lance entre um de cada time (rivalidade) ou, nas do mesmo time,
 * o combo ou o gol de dupla (passe de um, gol do outro). A espécie de cada índice segue as substituições e as evoluções;
 * o Ditto transformado continua Ditto.
 */
export function matchSecrets(m: Pick<MatchResult, 'roster' | 'events'>): SecretHit[] {
    const sp = new Map<number, { speciesId: number; team: 0 | 1 }>(
        m.roster.map((p) => [p.idx, { speciesId: p.speciesId, team: p.team }]),
    );
    const hits: SecretHit[] = [];
    for (const e of m.events) {
        if (e.type === 'sub') {
            const p = sp.get(e.outIdx);
            if (p) sp.set(e.outIdx, { ...p, speciesId: e.inSpeciesId });
            continue;
        }
        if (e.type === 'evolve') {
            const p = sp.get(e.by);
            if (p) sp.set(e.by, { ...p, speciesId: e.into });
            continue;
        }
        const duo =
            e.type === 'combo'
                ? [e.partner, e.by]
                : e.type === 'goal' && !e.ownGoal && e.assist !== null
                  ? [e.assist, e.by]
                  : null;
        const tid = duo && teamSecret(sp, duo[0], duo[1]);
        if (duo && tid) {
            if (!hits.some((h) => h.id === tid))
                hits.push({
                    id: tid,
                    event: e,
                    a: duo[0],
                    b: duo[1],
                    species: [sp.get(duo[0])!.speciesId, sp.get(duo[1])!.speciesId],
                    team: true,
                });
            continue;
        }
        const pair = duelPair(e);
        if (!pair) continue;
        const [pa, pb] = [sp.get(pair[0]), sp.get(pair[1])];
        if (!pa || !pb || pa.team === pb.team) continue;
        const id = secretOf(pa.speciesId, pb.speciesId);
        if (id && !hits.some((h) => h.id === id))
            hits.push({ id, event: e, a: pair[0], b: pair[1], species: [pa.speciesId, pb.speciesId] });
    }
    return hits;
}

/** As descobertas do perfil, só com ids que existem (save estragado ou de outra versão não conta). */
export const combosFoundOf = (p: { combosFound?: unknown }): string[] =>
    Array.isArray(p.combosFound)
        ? p.combosFound.filter((id): id is string => typeof id === 'string' && IDS.has(id))
        : [];

/** O que é novo entre `ids` (sem repetir), dado o que já foi descoberto. */
export function freshCombos(found: readonly string[], ids: readonly string[]): string[] {
    const known = new Set(found);
    return ids.filter((id, i) => IDS.has(id) && !known.has(id) && ids.indexOf(id) === i);
}

/** Revelação longa (o letreiro "SINERGIA SECRETA" com os retratos) só na 1ª vez de sempre e nunca no replay. */
export const longReveal = (id: string, found: readonly string[] | undefined, replay: boolean) =>
    !replay && !(found ?? []).includes(id);
