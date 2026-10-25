/**
 * Botão voltar do Android nos ambientes: fora do Estádio existe UMA entrada de histórico a mais (a marca), e voltar
 * consome ela e leva pro Estádio. No Estádio a marca sai, e voltar sai do app como na Home de sempre. Convive com a
 * guarda de tela (`back-nav.ts`): a marca é outro objeto de estado, e a guarda de tela, quando entra, fica por cima.
 */
const MARK = { soccermonTab: 1 };
const isMark = (s: unknown) => !!s && typeof s === 'object' && 'soccermonTab' in s;

/** `away()`: a aba atual não é o Estádio. `home()`: volta pro Estádio. Devolve `sync` (chamar a cada troca) e `off`. */
export function installTabBack(away: () => boolean, home: () => void) {
    const h = window.history;
    let marked = isMark(h.state);
    // recarregou com a marca e abriu no Estádio: só tira a marca (voltar aqui sairia do jogo)
    if (marked && !away()) {
        h.replaceState(null, '');
        marked = false;
    }
    let ignore = 0;
    const sync = () => {
        if (away() && !marked) {
            h.pushState(MARK, '');
            marked = true;
        } else if (!away() && marked) {
            marked = false;
            ignore++;
            h.back();
        }
    };
    const onPop = () => {
        if (ignore > 0) {
            ignore--;
            return;
        }
        marked = isMark(h.state);
        if (!marked && away()) home();
    };
    window.addEventListener('popstate', onPop);
    sync();
    return {
        sync,
        off: () => window.removeEventListener('popstate', onPop),
    };
}
