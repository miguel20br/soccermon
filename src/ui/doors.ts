import { trackNav } from '../analytics/track';
import { type Screen, useGame } from '../store/game-store';
import { openTabNext } from './ambientes/nav';
import { setDoorOrigin, setPageOrigin } from './back-nav';

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
    // mantém o estado (a marca da aba da Sede, `tab-back.ts`): só a URL muda
    window.history.replaceState(window.history.state, '', url);
};

/** Abre uma porta (numa aba, se vier); o voltar dela leva pra tela de onde ela abriu (`backTarget`). */
export function openDoor(door: Door, tab?: string) {
    setAba(tab);
    const g = useGame.getState();
    if (g.screen !== door) setDoorOrigin(g.screen);
    trackNav('door', tab ? `${door}.${tab}` : door, g.screen);
    g.go(door);
}

/** `?aba=` (ou `?perfil=`) que agora é das Metas (menos-e-mais.md, B2): missões e medalhas moram na Sede. */
export function metasLink(search: string): boolean {
    const q = new URLSearchParams(search);
    return ['missoes', 'medalhas', 'metas'].includes(q.get('aba') ?? q.get('perfil') ?? '');
}

/** Pedido pra Sede abrir as Metas quando a Home aparecer (a Sede consome; a Home zera se a Sede está apagada). */
export const metasNext = { on: false };

/** Vai pra Sede com as Metas abertas (a medalha da Sala de troféus, links antigos de missões e medalhas). */
export function openMetas() {
    setAba();
    metasNext.on = true;
    trackNav('metas', 'metas', useGame.getState().screen);
    openTabNext('sede');
    useGame.getState().go('home');
}

/** Abre a Ajuda ou os Créditos; o voltar (o `‹` e o do Android) leva pra tela de onde abriu (`backTarget`). */
export function openPage(page: Extract<Screen, 'help' | 'credits'>) {
    const g = useGame.getState();
    if (g.screen !== page) setPageOrigin(g.screen);
    if (page === 'help') trackNav('help', 'help', g.screen);
    g.go(page);
}

/** A aba com que a porta abre: `?aba=`, ou o `?perfil=` antigo que aponta pra ela. */
export function initialTab<D extends Door>(door: D): DoorTab<D> {
    const q = new URLSearchParams(window.location.search);
    const tabs = DOOR_TABS[door] as readonly string[];
    const aba = q.get('aba');
    if (aba && tabs.includes(aba)) return aba as DoorTab<D>;
    // `?aba=missoes` (o quadro da Sede): a aba Treinador, rolada até as missões (Perfil)
    const legacy = LEGACY[q.get('perfil') ?? aba ?? ''];
    if (legacy?.[0] === door) return legacy[1] as DoorTab<D>;
    return tabs[0] as DoorTab<D>;
}

/** `?perfil=` antigo que aponta pra outra porta: vai pra ela (o Perfil chama ao abrir). */
export function legacyDoor(): [Door, string] | null {
    const legacy = LEGACY[new URLSearchParams(window.location.search).get('perfil') ?? ''];
    return legacy && legacy[0] !== 'profile' ? legacy : null;
}
