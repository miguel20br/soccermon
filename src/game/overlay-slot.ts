/**
 * Uma sobreposição por vez na quadra do celular (faxina de 27/10: um gol empilhava "GOOOOL!", a faixa do lance, o
 * retrato do rival, a faixa do golpe e a narração). Quem quer aparecer pede a vaga com a prioridade:
 *   3 gol (o texto grande de drama e a faixa do gol), 2 golpe (faixa do golpe e do escanteio), 1 reação (rival).
 * Vaga livre ou prioridade maior ou igual: entra (a de antes sai, os ouvintes ficam sabendo). Menor: fica de fora;
 * quem quiser espera `freeIn()` e pede de novo (a reação do rival espera o gol passar).
 * No desktop e no tablet tem espaço: tudo entra, como antes. Sem Phaser aqui (a Home não carrega o motor gráfico).
 */
export type OverlayPrio = 1 | 2 | 3;
export const PRIO_GOAL: OverlayPrio = 3;
export const PRIO_MOVE: OverlayPrio = 2;
export const PRIO_REACTION: OverlayPrio = 1;

/** Celular em pé ou deitado (o mesmo corte do layout da partida em broadcast.css). */
const PHONE = '(max-width: 700px), (orientation: landscape) and (max-height: 520px)';

let owner: { id: string; prio: OverlayPrio; until: number } | null = null;
const listeners = new Set<(id: string | null) => void>();
const now = () => performance.now();
let phoneTest = () => typeof window !== 'undefined' && !!window.matchMedia?.(PHONE).matches;

/** Testes: força o modo celular (ou volta pro matchMedia com `null`). */
export function setPhoneForTest(on: boolean | null) {
    phoneTest = on === null ? () => !!window.matchMedia?.(PHONE).matches : () => on;
    owner = null;
}

/** Pede a vaga por `ms`. true = pode mostrar. */
export function claimOverlay(id: string, prio: OverlayPrio, ms: number): boolean {
    if (!phoneTest()) return true;
    const t = now();
    if (owner && owner.until > t && owner.id !== id && prio < owner.prio) return false;
    owner = { id, prio, until: t + ms };
    for (const fn of listeners) fn(id);
    return true;
}

/** Larga a vaga antes do tempo (a faixa saiu mais cedo). */
export function releaseOverlay(id: string) {
    if (owner?.id === id) owner = null;
}

/** Quanto falta (ms) pra vaga abrir pra quem tem `prio`. 0 = pode pedir já. */
export function overlayFreeIn(prio: OverlayPrio): number {
    if (!phoneTest() || !owner || prio >= owner.prio) return 0;
    return Math.max(0, owner.until - now());
}

/** A vaga está com alguém agora (a caixa de narração do Phaser fica quieta enquanto isso). */
export function overlayBusy(): boolean {
    return phoneTest() && !!owner && owner.until > now();
}

/** Avisa quem pegou a vaga (pra quem estava na tela sair). */
export function onOverlayClaim(fn: (id: string) => void): () => void {
    const l = (id: string | null) => id && fn(id);
    listeners.add(l);
    return () => listeners.delete(l);
}
