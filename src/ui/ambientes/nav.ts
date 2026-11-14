import { AMB_TABS, type AmbTab } from '../../store/coach';

/**
 * Navegação por ambientes (docs/planos/clash-2x2-menus-arcade.md, parte 2): 5 abas lado a lado, o Estádio no centro
 * é a entrada. É a Home de todo mundo desde a 0.9.21 (a Home de lista, `?lab=off`, saiu na 0.9.51).
 */
export const TABS = AMB_TABS;
export type Tab = AmbTab;
export const START = TABS.indexOf('estadio');
const LAST = TABS.length - 1;
/** A aba em que a pessoa estava (voltar de uma tela pra Home cai nela de novo; recarregar volta pro Estádio). */
export const tabMemory = { last: START as number };
/** Marca a aba em que a Home abre da próxima vez (o "Ir pra Sede" do Perfil). */
export const openTabNext = (tab: Tab) => {
    tabMemory.last = TABS.indexOf(tab);
};
const tabCalls = new Set<(i: number) => void>();
/** Leva a Home pra uma aba agora (o botão das Notícias): a Home aberta troca na hora; fechada, abre nela. */
export const goTab = (tab: Tab) => {
    openTabNext(tab);
    for (const f of tabCalls) f(tabMemory.last);
};
/** Quem atende o `goTab` (os Ambientes trocam de aba; o App tira o menu de modos da frente). */
export const onGoTab = (f: (i: number) => void) => {
    tabCalls.add(f);
    return () => {
        tabCalls.delete(f);
    };
};

/** Posição durante o arrasto (em abas): passou da primeira ou da última, anda um terço (elástico). */
export function dragPos(from: number, dx: number, width: number, last = LAST): number {
    const p = from - dx / Math.max(1, width);
    if (p < 0) return p / 3;
    if (p > last) return last + (p - last) / 3;
    return p;
}

/**
 * Aba ao soltar o dedo: a mais perto de onde a tela parou, ou a vizinha se o gesto foi um peteleco (rápido e com
 * pelo menos 16 px). Nunca pula mais de uma aba por gesto. `vx` em px/ms (negativo = dedo indo pra esquerda). `last`:
 * a última das abas acesas (as apagadas ficam fora do arrasto).
 */
export function snapTab(from: number, dx: number, vx: number, width: number, last = LAST): number {
    let to = Math.round(dragPos(from, dx, width, last));
    if (Math.abs(vx) > 0.35 && Math.abs(dx) > 16) to = from + (vx < 0 ? 1 : -1);
    to = Math.max(from - 1, Math.min(from + 1, to));
    return Math.max(0, Math.min(last, to));
}

export type Sky = 'dia' | 'tarde' | 'noite';
/** O céu pela hora local: dia das 6 às 17, fim de tarde até as 19, noite no resto. */
export function skyOf(hour: number): Sky {
    if (hour >= 6 && hour < 17) return 'dia';
    if (hour >= 17 && hour < 19) return 'tarde';
    return 'noite';
}
