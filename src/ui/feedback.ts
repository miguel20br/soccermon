import { playSfx, type SfxName } from '../game/audio';
import { useGame } from '../store/game-store';
import { reduceMotionOn } from './settings-sync';

/**
 * Retorno de cada toque, num lugar só (docs/planos/pesquisa-layout-e-game-design.md §3.3). Um vocabulário pequeno por
 * tipo de ação, com som (no volume de efeitos das Configurações) e, no Android, uma vibração curta (desligável):
 *
 * - `tap`: botão comum, aba, vaga, carta. O "select" de sempre.
 * - `go`: jogar/avançar/confirmar (o dourado `.primary` e o verde `.confirm`). Mais grave, e vibra.
 * - `back`: voltar/cancelar/fechar (fantasma, voltar, X). Desce.
 * - `leave`: sair/abandonar/perder. Triste e descendo; com `leaveWith`, a tela desce, apaga e perde a cor.
 * - `danger`: destrutivo (apagar dados, bloquear). Grave e seco.
 *
 * Os botões não chamam som nenhum: um ouvinte só no documento (`startTapFeedback`) lê o tipo pela classe
 * (`.danger` = danger, `.primary`/`.confirm` = go, `.ghost`/voltar/fechar = back) ou por `data-fx` (`data-fx="none"` cala, pra
 * quem toca o próprio som, como o `leaveWith`).
 */
export type FeedbackKind = 'tap' | 'go' | 'back' | 'leave' | 'danger';

const SOUND: Record<FeedbackKind, [SfxName, number]> = {
    tap: ['select', 1],
    go: ['select', 0.7],
    back: ['back', 1],
    leave: ['sad', 1],
    danger: ['thud', 1],
};
/** Vibração (ms) por tipo; só onde o toque pesa. */
const BUZZ: Partial<Record<FeedbackKind, number | number[]>> = { go: 8, leave: [12, 40, 12], danger: 18 };

export function feedback(kind: FeedbackKind) {
    const [name, pitch] = SOUND[kind];
    playSfx(name, pitch);
    const ms = BUZZ[kind];
    if (ms && useGame.getState().settings.haptics !== false && 'vibrate' in navigator) {
        try {
            navigator.vibrate(ms);
        } catch {
            // navegador sem vibração (ou bloqueada): só o som
        }
    }
}

/** O tipo de um botão pela classe (ou `data-fx`). */
export function kindOf(el: Element): FeedbackKind | null {
    const fx = el.getAttribute('data-fx');
    if (fx) return fx === 'none' ? null : (fx as FeedbackKind);
    if (el.matches('.danger')) return 'danger';
    if (el.matches('.primary, .confirm')) return 'go';
    if (el.matches('.ghost, .back-btn, .modal-close, .tip-close')) return 'back';
    return 'tap';
}

/** Um ouvinte só pra página: todo botão habilitado dá o retorno do seu tipo ao ser tocado. */
export function startTapFeedback() {
    document.addEventListener(
        'click',
        (e) => {
            const el = (e.target as Element | null)?.closest?.('button, a.btn, [role="button"], [role="tab"]');
            if (!el || el.matches(':disabled, [aria-disabled="true"]')) return;
            const kind = kindOf(el);
            if (kind) feedback(kind);
        },
        true,
    );
}

/**
 * Sair com peso (abandonar copa, sair do Duelo, apagar dados): som e a tela desce, apaga e perde a cor (~340 ms) antes
 * de `then`. Com Reduzir movimento, só o fade.
 */
export function leaveWith(kind: 'leave' | 'danger', then: () => void) {
    feedback(kind);
    const app = document.querySelector<HTMLElement>('.app');
    if (!app) return then();
    const fade = reduceMotionOn();
    const cls = fade ? 'fx-leave-fade' : 'fx-leave';
    app.classList.add(cls);
    window.setTimeout(
        () => {
            app.classList.remove(cls);
            then();
        },
        fade ? 200 : 340,
    );
}
