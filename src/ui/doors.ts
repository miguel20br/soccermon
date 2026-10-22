import { type Screen, useGame } from '../store/game-store';

/**
 * As três portas (docs/planos/menus-e-sala.md): Perfil (quem eu sou), Coleção (o que eu coleciono) e Sala de troféus
 * (o que eu ganhei). `?aba=` abre direto numa aba (atalho dos prints e dos botões que levam de uma porta pra outra).
 */
export type Door = Extract<Screen, 'profile' | 'collection' | 'trophies'>;

export const DOOR_TABS = {
    profile: ['treinador', 'clube', 'amigos'],
    collection: ['dex', 'album', 'golpedex'],
    trophies: ['trofeus', 'medalhas', 'numeros'],
} as const satisfies Record<Door, readonly string[]>;
export type DoorTab<D extends Door> = (typeof DOOR_TABS)[D][number];

/** `?perfil=` de antes da 0.8.9 (prints, links, demos): pra que porta e aba ele vai agora. */
const LEGACY: Record<string, [Door, string]> = {
    clube: ['profile', 'clube'],
    missoes: ['profile', 'treinador'],
    amigos: ['profile', 'amigos'],
    dex: ['collection', 'dex'],
    album: ['collection', 'album'],
    fichario: ['collection', 'album'],
    medalhas: ['trophies', 'medalhas'],
    numeros: ['trophies', 'numeros'],
    hall: ['trophies', 'trofeus'],
};

const setAba = (tab?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('perfil');
    if (tab) url.searchParams.set('aba', tab);
    else url.searchParams.delete('aba');
    window.history.replaceState(null, '', url);
};

/** Abre uma porta (numa aba, se vier). */
export function openDoor(door: Door, tab?: string) {
    setAba(tab);
    useGame.getState().go(door);
}

/** A aba com que a porta abre: `?aba=`, ou o `?perfil=` antigo que aponta pra ela. */
export function initialTab<D extends Door>(door: D): DoorTab<D> {
    const q = new URLSearchParams(window.location.search);
    const tabs = DOOR_TABS[door] as readonly string[];
    const aba = q.get('aba');
    if (aba && tabs.includes(aba)) return aba as DoorTab<D>;
    const legacy = LEGACY[q.get('perfil') ?? ''];
    if (legacy?.[0] === door) return legacy[1] as DoorTab<D>;
    return tabs[0] as DoorTab<D>;
}

/** `?perfil=` antigo que aponta pra outra porta: vai pra ela (o Perfil chama ao abrir). */
export function legacyDoor(): [Door, string] | null {
    const legacy = LEGACY[new URLSearchParams(window.location.search).get('perfil') ?? ''];
    return legacy && legacy[0] !== 'profile' ? legacy : null;
}
