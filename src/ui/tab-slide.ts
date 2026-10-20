/**
 * Nada teleporta nas abas (docs/planos/nada-teleporta.md): em todo `.bc-tabs` e `.bc-seg` da página, o marcador da
 * opção ativa (o fundo amarelo do seletor, o sublinhado e o fundo da aba) é um só e desliza até a opção nova, em vez
 * de sumir de uma e aparecer na outra. Um observador só pra página inteira: tela nova não precisa fazer nada.
 */
const BARS = '.bc-tabs, .bc-seg';
const ACTIVE =
    ':scope > .on, :scope > [aria-selected="true"], :scope > [aria-pressed="true"], :scope > [aria-checked="true"]';

function place(bar: HTMLElement) {
    const on = bar.querySelector<HTMLElement>(ACTIVE);
    if (!on || on.offsetParent === null) {
        bar.classList.remove('has-ind');
        return;
    }
    const s = bar.style;
    s.setProperty('--ind-x', `${on.offsetLeft}px`);
    s.setProperty('--ind-y', `${on.offsetTop}px`);
    s.setProperty('--ind-w', `${on.offsetWidth}px`);
    s.setProperty('--ind-h', `${on.offsetHeight}px`);
    if (!bar.classList.contains('has-ind')) {
        bar.classList.add('has-ind');
        // a 1ª posição não anima (nasce no lugar); daí pra frente, desliza
        requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('ind-ready')));
    }
}

export function startTabSlide() {
    if (typeof MutationObserver === 'undefined') return;
    let queued = false;
    const sync = () => {
        queued = false;
        for (const bar of document.querySelectorAll<HTMLElement>(BARS)) place(bar);
    };
    const later = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(sync);
    };
    new MutationObserver(later).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'aria-selected', 'aria-pressed', 'aria-checked'],
    });
    window.addEventListener('resize', later);
    later();
}
