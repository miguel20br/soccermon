import { useEffect, useRef } from 'react';
import type { Screen } from '../store/game-store';

/**
 * Telas de menu: em cima, a mesma barra dos ambientes (voltar, treinador, Amigos, Novidades, Ajuda e Configurações,
 * App.tsx). Partida e draft não, pra ninguém sair sem querer; o Duelo com o jogo rolando só mostra o voltar.
 */
export const MENU_SCREENS: Screen[] = [
    'settings',
    'credits',
    'help',
    'profile',
    'collection',
    'trophies',
    'daily',
    'liga',
    'duel',
    'ultimate',
];

/**
 * O caminho até a tela de menu aberta (a Home e as telas de menu de antes dela). Fechar volta pra última, nunca pra
 * uma tela que a pessoa não abriu (11/11: Sede → Clube → X caía no Perfil; Perfil aberto do Estádio voltava pra Sede).
 * A Home volta na aba em que estava (`tabMemory`). Tela da copa no meio zera o caminho: o voltar dela é a Home.
 */
let trail: Screen[] = [];

/** Anota a troca de tela no caminho (installBackNav chama a cada troca). */
export function noteScreen(from: Screen, to: Screen) {
    if (to === 'home' || !MENU_SCREENS.includes(to)) trail = [];
    else if (trail.includes(to)) trail = trail.slice(0, trail.indexOf(to));
    else if (from !== to) trail = [...trail, MENU_SCREENS.includes(from) ? from : 'home'];
}

/** Para onde o voltar leva (o `‹`, o voltar do Android, o X da tela). `null` = já na Home (sai do app). */
export function backTarget(screen: Screen): Screen | null {
    if (screen === 'home') return null;
    return (MENU_SCREENS.includes(screen) && trail.at(-1)) || 'home';
}

/**
 * Folhas abertas (Sheet, ficha da Pokédex, objeto da Sala): o voltar do Android fecha a de cima e fica na tela, como
 * o X. Na Home, folha aberta também ganha a entrada de guarda (senão voltar saía do jogo com a folha aberta).
 */
const layers: { close: () => void }[] = [];
const layerSubs = new Set<() => void>();
// junta as trocas do mesmo instante (o StrictMode do dev monta, desmonta e monta a folha nova): um `back()` no meio
// de um `pushState` embaralhava o histórico e o X das Metas caía no Estádio
let pending = false;
const layersChanged = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
        pending = false;
        for (const f of layerSubs) f();
    });
};

/** Põe uma folha na pilha; devolve a função que tira (o `useBackLayer` usa; os testes chamam direto). */
export function holdLayer(close: () => void): () => void {
    const layer = { close };
    layers.push(layer);
    layersChanged();
    return () => {
        layers.splice(layers.indexOf(layer), 1);
        layersChanged();
    };
}

/** Registra a folha enquanto `open`; `onClose` é o mesmo do X. */
export function useBackLayer(open: boolean, onClose: () => void) {
    const ref = useRef(onClose);
    ref.current = onClose;
    useEffect(() => (open ? holdLayer(() => ref.current()) : undefined), [open]);
}

/** O que fazer com a entrada de guarda depois de uma troca de tela (ou de folha). */
export function guardAction(screen: Screen, guarded: boolean, layered = false): 'push' | 'pop' | 'none' {
    if (screen === 'home' && !layered) return guarded ? 'pop' : 'none';
    return guarded ? 'none' : 'push';
}

const GUARD = { soccermonBack: 1 };
const isGuard = (s: unknown) => !!s && typeof s === 'object' && 'soccermonBack' in s;

/**
 * Botão voltar do Android (e gesto do iOS): no máximo UMA entrada de histórico além da base, só enquanto a tela
 * não é a Home (ou há folha aberta). Voltar vira o "voltar" da tela (o mesmo do `‹`); na Home a entrada de guarda não
 * existe, então voltar sai do app como sempre. Sem `pushState` por tela: não enche o histórico durante a copa.
 *
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
    let last = getScreen();
    const sync = () => {
        const screen = getScreen();
        if (screen !== last) noteScreen(last, screen);
        last = screen;
        const act = guardAction(screen, guarded, layers.length > 0);
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
        if (guarded) return;
        // folha aberta: o voltar fecha só ela (a guarda volta quando ela sai, se a tela ainda precisar)
        const top = layers.at(-1);
        if (top) return top.close();
        const screen = getScreen();
        if (screen === 'home') return;
        onBack(screen);
        // a guarda foi consumida: recoloca se ainda estivermos fora da Home (partida pedindo confirmação)
        sync();
    };
    window.addEventListener('popstate', onPop);
    const off = subscribe(sync);
    layerSubs.add(sync);
    sync();
    return () => {
        window.removeEventListener('popstate', onPop);
        layerSubs.delete(sync);
        off();
    };
}
