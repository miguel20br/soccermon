import type { Screen } from '../store/game-store';

/**
 * Botão voltar do Android (e gesto do iOS): no máximo UMA entrada de histórico além da base, só enquanto a tela
 * não é a Home. Voltar vira o "voltar" da tela (o mesmo do `‹`); na Home a entrada de guarda não existe, então
 * voltar sai do app como sempre. Sem `pushState` por tela: não enche o histórico durante a copa.
 */
const UNDER_PROFILE: Screen[] = ['collection', 'trophies'];

/** De onde a última porta abriu: a Sede (Home) ou o Perfil. A Sala e a Coleção voltam pra lá (`openDoor`). */
let doorOrigin: Screen = 'profile';
export const setDoorOrigin = (from: Screen) => {
    doorOrigin = from === 'home' ? 'home' : 'profile';
};

/** Ajuda e Créditos abrem da Home ou das Configurações (rodapé): voltam pra lá (`openPage`). */
const UNDER_SETTINGS: Screen[] = ['help', 'credits'];
let pageOrigin: Screen = 'home';
/** Telas de menu que têm o "?" na barra de cima: a Ajuda (e os Créditos) abertas delas voltam pra elas. */
const PAGE_FROM: Screen[] = ['settings', 'profile', 'collection', 'trophies', 'liga', 'daily'];
export const setPageOrigin = (from: Screen) => {
    pageOrigin = PAGE_FROM.includes(from) ? from : 'home';
};

/** Para onde o voltar leva. `null` = Home (sai do app). */
export function backTarget(screen: Screen): Screen | null {
    if (screen === 'home') return null;
    if (UNDER_SETTINGS.includes(screen)) return pageOrigin;
    return UNDER_PROFILE.includes(screen) ? doorOrigin : 'home';
}

/** O que fazer com a entrada de guarda depois de uma troca de tela. */
export function guardAction(screen: Screen, guarded: boolean): 'push' | 'pop' | 'none' {
    if (screen === 'home') return guarded ? 'pop' : 'none';
    return guarded ? 'none' : 'push';
}

const GUARD = { soccermonBack: 1 };
const isGuard = (s: unknown) => !!s && typeof s === 'object' && 'soccermonBack' in s;

/**
 * Liga a guarda. `getScreen`/`subscribe` vêm do store; `onBack(screen)` faz o voltar (pode abrir a confirmação).
 * Devolve a função que desliga.
 */
export function installBackNav(
    getScreen: () => Screen,
    subscribe: (cb: () => void) => () => void,
    onBack: (screen: Screen) => void,
): () => void {
    let guarded = isGuard(window.history.state);
    // recarregou fora da Home: a guarda velha veio junto e o jogo abre na Home. Só tira a marca; voltar aqui sairia
    // do jogo (no dev, com o efeito montado duas vezes, voltava duas entradas e caía na página anterior)
    if (guarded && getScreen() === 'home') {
        window.history.replaceState(null, '');
        guarded = false;
    }
    let ignore = 0;
    const sync = () => {
        const act = guardAction(getScreen(), guarded);
        if (act === 'push') {
            window.history.pushState(GUARD, '');
            guarded = true;
        } else if (act === 'pop') {
            // volta à base sem tratar como "voltar do usuário"
            guarded = false;
            ignore++;
            window.history.back();
        }
    };
    const onPop = () => {
        if (ignore > 0) {
            ignore--;
            return;
        }
        guarded = isGuard(window.history.state);
        const screen = getScreen();
        if (screen === 'home' || guarded) return;
        onBack(screen);
        // a guarda foi consumida: recoloca se ainda estivermos fora da Home (partida pedindo confirmação)
        sync();
    };
    window.addEventListener('popstate', onPop);
    const off = subscribe(sync);
    sync();
    return () => {
        window.removeEventListener('popstate', onPop);
        off();
    };
}
