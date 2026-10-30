import { type RefObject, useEffect, useRef } from 'react';
import { EventBus } from '../game/EventBus';

/** O que a quadra seguindo a bola precisa da cena (a mesma interface do clipe 9:16, sem importar o Phaser). */
interface FollowScene {
    ballOnScreen(): { x: number; y: number };
    focusOnScreen(): { x: number; y: number };
    setZoomDamp(k: number): void;
    cameras: { main: { zoom: number } };
    setClipView(x: number, w: number): void;
    scale: { width: number; updateBounds(): void };
}

type ReadyScene = FollowScene & {
    sys?: { isActive(): boolean; events?: { once(ev: string, fn: () => void): unknown } };
};

/**
 * A última cena pronta. O `current-scene-ready` sai uma vez só (no create), e girar o celular desliga e religa a quadra
 * grande no meio da partida: sem guardar aqui, o efeito novo ficava esperando um evento que não vem mais. Solta a cena
 * quando ela acaba: guardada aqui, a partida inteira (Game e cena, ~12 MB) não saía da memória.
 */
let ready: ReadyScene | null = null;
EventBus.on('current-scene-ready', (sc: ReadyScene) => {
    ready = sc;
    const drop = () => {
        if (ready === sc) ready = null;
    };
    sc.sys?.events?.once('shutdown', drop);
    sc.sys?.events?.once('destroy', drop);
});
/** A cena da partida que está rodando agora (a de uma partida que já acabou não vale). */
export const readyScene = (): FollowScene | null => (ready?.sys?.isActive() ? ready : null);

/** Quanto a câmera vai à frente do ataque: até 22% da janela, pro lado em que a bola anda. */
export const LEAD = 0.22;

/** Deslocamento (px, ≤ 0) que centra o ponto na janela, sem passar das bordas da quadra. */
export function followOffset(ballX: number, view: number, full: number): number {
    return Math.min(0, Math.max(view - full, view / 2 - ballX));
}

/**
 * Quanto dos zooms dos lances (Transformar 1.5, golpe N3 1.35, escanteio 1.18...) vale com a quadra grande: ela já
 * mostra ~metade da quadra; o zoom inteiro por cima fechava em 2 ou 3 Pokémon e no gol (Transformar 1.5 vira 1.2).
 */
export const HUD_ZOOM_DAMP = 0.4;

/** Quanto a troca entre seguir a bola e a quadra inteira fica apagada (o Phaser reencaixa o canvas no meio). */
const SWAP_MS = 180;

/**
 * Quadra grande no celular (?lab=hud): o canvas fica do tamanho da altura da janela, mais largo que ela, e anda de
 * lado seguindo a bola (suave, como o clipe 9:16). `follow` desligado (4x e 8x: seguir a bola correndo dá enjoo e a
 * gente perde o lance) mostra a quadra inteira: a caixa volta à largura da tela (`.hud-full`) e o próprio Phaser
 * (FIT) encaixa a quadra no meio. A troca passa por um fade curto (nada salta). Encolher com `scale` não serve: o
 * Phaser mede a caixa já encolhida e encolhe o canvas de novo. Os textos presos à tela vão pra faixa visível
 * (`setClipView`) e o toque no Pokémon continua certo (`updateBounds` no toque).
 */
export function useCourtFollow(on: boolean, wrap: RefObject<HTMLElement | null>, follow = true) {
    const followRef = useRef(follow);
    followRef.current = follow;
    useEffect(() => {
        if (!on) return;
        let scene = readyScene();
        let x: number | null = null;
        let mode: boolean | null = null;
        // velocidade da bola na tela (px/s, suavizada): a câmera vai um pouco à frente, pro lado do ataque
        let lastBall: number | null = null;
        let lastT = 0;
        let vel = 0;
        let swapping = false;
        let raf = 0;
        let inner: HTMLElement | null = null;
        // a quadra anda com transform; o Phaser só precisa da posição nova do canvas na hora do toque (medir em todo
        // quadro forçava um layout por quadro)
        const onDown = () => scene?.scale.updateBounds();
        const host = wrap.current;
        host?.addEventListener('pointerdown', onDown, true);
        const onReady = (sc: FollowScene) => {
            scene = sc;
            mode = null;
        };
        EventBus.on('current-scene-ready', onReady);
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const box = wrap.current;
            if (!inner?.isConnected) inner = box?.querySelector<HTMLElement>('.phaser-container') ?? null;
            if (!scene || !box || !inner || swapping) return;
            const want = followRef.current;
            if (mode !== want) {
                const first = mode === null;
                mode = want;
                const el = inner;
                const apply = () => {
                    box.classList.toggle('hud-full', !want);
                    scene?.setZoomDamp(want ? HUD_ZOOM_DAMP : 1);
                    el.style.transform = '';
                    x = null;
                    if (!want) scene?.setClipView(0, scene.scale.width);
                };
                if (first) apply();
                else {
                    swapping = true;
                    el.style.opacity = '0';
                    window.setTimeout(() => {
                        apply();
                        window.setTimeout(() => {
                            el.style.opacity = '';
                            swapping = false;
                        }, 60);
                    }, SWAP_MS);
                }
                return;
            }
            if (!want) return;
            const view = box.clientWidth;
            const full = inner.offsetWidth;
            if (!full || full <= view) return;
            const k = full / (scene.scale.width || full);
            const now = performance.now();
            const ball = scene.ballOnScreen().x * k;
            if (lastBall !== null && now > lastT) {
                const v = ((ball - lastBall) * 1000) / (now - lastT);
                vel += (v - vel) * 0.06;
            }
            lastBall = ball;
            lastT = now;
            // lance especial (o jogo deu zoom: gol, golpe, defesa): vai pra onde a câmera do jogo aponta (presa na
            // quadra, nem sempre é o meio do canvas); fora disso, a bola mais um pouco à frente pro lado do ataque
            const zoomed = scene.cameras.main.zoom > 1.02;
            const focus = zoomed
                ? scene.focusOnScreen().x * k
                : ball + Math.max(-LEAD * view, Math.min(LEAD * view, vel * 0.35));
            const target = followOffset(focus, view, full);
            const next = x === null ? target : x + (target - x) * 0.12;
            if (x !== null && Math.abs(next - x) < 0.3) return;
            x = next;
            inner.style.transform = `translateX(${x}px)`;
            scene.setClipView(-x / k, view / k);
        };
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            EventBus.off('current-scene-ready', onReady);
            host?.removeEventListener('pointerdown', onDown, true);
            // girou pra deitado no meio do jogo: a quadra volta inteira, no lugar e com o zoom normal
            if (inner) inner.style.transform = '';
            wrap.current?.classList.remove('hud-full');
            scene?.setZoomDamp(1);
            scene?.setClipView(0, scene.scale.width);
        };
    }, [on, wrap]);
}
