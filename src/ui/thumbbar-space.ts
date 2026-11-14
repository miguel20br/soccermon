/**
 * Espaço no fim da página = altura REAL da barra do polegar (.bc-thumbbar), não um número fixo: a barra cresce com a
 * dica em 2 linhas, o texto grande e o 320 px, e o fim da página ficava embaixo dela. Escreve `--bc-thumb-h` na raiz.
 */
export function startThumbbarSpace() {
    const root = document.documentElement;
    let bar: Element | null = null;
    const set = () => {
        if (bar?.isConnected) root.style.setProperty('--bc-thumb-h', `${(bar as HTMLElement).offsetHeight}px`);
        else root.style.removeProperty('--bc-thumb-h');
    };
    // escreve no quadro seguinte: mudar a variável dentro da entrega redimensiona o palco (Stage, que também é observado)
    // no mesmo quadro, e o navegador acusava "ResizeObserver loop" (Pronto na sala do Duelo)
    let frame = 0;
    const ro = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(set);
    });
    const find = () => {
        const next = document.querySelector('.bc-thumbbar');
        if (next === bar) return;
        if (bar) ro.unobserve(bar);
        bar = next;
        if (bar) ro.observe(bar);
        set();
    };
    new MutationObserver(find).observe(document.body, { childList: true, subtree: true });
    find();
}
