import { CARD_SLOTS, slotId } from './binder';
import { CREST_SYMBOLS, isUnlocked, KIT_PATTERNS, UNLOCK } from './club-kit';
import type { PersistedSave } from './game-store';
import { type MedalView, medalProgress } from './medals';
import { DEFAULT_TITLE, earnedTitles, FREE_TRAINERS, MISSIONS, unlockedTrainers } from './missions';
import { avatarOptions, GENERATIONS, hasSticker, kantoComplete, type Profile, topSeal } from './profile';

/**
 * Selo NOVO do Perfil: uma chave por coisa ganha (treinador, título, degrau de medalha, coleção, peça do escudo,
 * selo de carreira, figurinha, avatar). "Novo" = ganho e ainda não visto (`Profile.seen`). Save sem o campo (de
 * antes da 0.8.8.3) conta tudo o que já tinha como visto (`withSeenBaseline`), pra não virar enxurrada.
 *
 * ponytail: `seen` guarda uma chave por item (~1.000 numa carreira cheia, ~10 KB); se pesar, guardar só a contagem
 * por categoria.
 */
export type NewsTab = 'clube' | 'medalhas' | 'dex';

const TAB_OF: Record<string, NewsTab> = {
    tr: 'clube',
    ti: 'clube',
    av: 'clube',
    kit: 'clube',
    md: 'medalhas',
    col: 'medalhas',
    sl: 'medalhas',
    fig: 'dex',
};
export const newsTabOf = (key: string): NewsTab => TAB_OF[key.slice(0, key.indexOf(':'))] ?? 'clube';

/** Chaves de uma peça do Perfil (as mesmas que o selo procura na tela). */
export const newsKey = {
    trainer: (id: string) => `tr:${id}`,
    title: (id: string) => `ti:${id}`,
    avatar: (id: number, shiny = false) => `av:${id}${shiny ? ':s' : ''}`,
    kit: (piece: string) => `kit:${piece}`,
    medal: (id: string, tier: number) => `md:${id}:${tier}`,
    collection: (id: string) => `col:${id}`,
    seal: (id: number, seal: string) => `sl:${id}:${seal}`,
    sticker: (slot: string) => `fig:${slot}`,
};

/** Tudo que o save já ganhou (o que vem de graça, como o Red e o Pikachu, fica de fora). */
export function earnedKeys(v: MedalView, p: Pick<Profile, 'missionsDone' | 'redeemedTitles'>): string[] {
    const out: string[] = [];
    for (const id of unlockedTrainers(p)) if (!FREE_TRAINERS.includes(id)) out.push(newsKey.trainer(id));
    for (const id of earnedTitles(p)) if (id !== DEFAULT_TITLE) out.push(newsKey.title(id));
    const tiers: Record<string, 0 | 1 | 2 | 3 | 4> = {};
    for (const { medal, tier } of medalProgress(v)) {
        tiers[medal.id] = tier;
        if (tier) out.push(newsKey.medal(medal.id, tier));
    }
    for (const piece of [...CREST_SYMBOLS, ...KIT_PATTERNS])
        if (UNLOCK[piece] && isUnlocked(piece, v.done, tiers)) out.push(newsKey.kit(piece));
    for (const m of MISSIONS) if (m.group === 'colecoes' && v.done.has(m.id)) out.push(newsKey.collection(m.id));
    const kanto = kantoComplete(v.dex);
    for (const [k, e] of Object.entries(v.dex)) {
        const id = Number(k);
        const seal = topSeal(e, kanto);
        if (seal) out.push(newsKey.seal(id, seal));
        for (const ed of CARD_SLOTS) if (hasSticker(e, ed)) out.push(newsKey.sticker(slotId(id, ed)));
    }
    for (const g of GENERATIONS)
        for (const { speciesId, shiny } of avatarOptions(v.dex, g)) {
            if (speciesId !== 25 || (v.dex[25]?.matches ?? 0) > 0) out.push(newsKey.avatar(speciesId));
            if (shiny) out.push(newsKey.avatar(speciesId, true));
        }
    return out;
}

/** O save do jeito que as medalhas leem (mesma montagem do `useMedalView` da tela). */
export const medalViewOf = (s: PersistedSave): MedalView => ({
    records: s.records,
    dex: s.dex,
    moves: s.moves,
    career: s.career,
    hall: s.hall ?? [],
    runs: [s.run, ...(s.parkedRuns ?? [])],
    done: new Set(s.profile.missionsDone),
    duels: s.duels ?? [],
});

/** Save sem `seen` (de antes do selo NOVO): o que ele já ganhou conta como visto. */
export function withSeenBaseline(s: PersistedSave): PersistedSave {
    if (Array.isArray(s.profile.seen)) return s;
    return { ...s, profile: { ...s.profile, seen: earnedKeys(medalViewOf(s), s.profile) } };
}

/** As novidades: ganho e não visto. Sem `seen` (estado de antes do baseline), nada é novo. */
export function freshKeys(earned: readonly string[], seen: readonly string[] | undefined): string[] {
    if (!seen) return [];
    const s = new Set(seen);
    return earned.filter((k) => !s.has(k));
}
