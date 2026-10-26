import { type RefObject, useEffect, useRef } from 'react';
import { EventBus } from '../game/EventBus';

/** O que a quadra seguindo a bola precisa da cena (a mesma interface do clipe 9:16, sem importar o Phaser). */
interface FollowScene {
    ballOnScreen(): { x: number; y: number };
    setClipView(x: number, w: number): void;
    scale: { width: number; updateBounds(): void };
}

/** Deslocamento (px, ≤ 0) que centra a bola na janela, sem passar das bordas da quadra. */
export function followOffset(ballX: number, view: number, full: number): number {
    return Math.min(0, Math.max(view - full, view / 2 - ballX));
}

/** Quanto a troca seguir ⇄ quadra inteira fica apagada (o Phaser reencaixa o canvas no meio). */
const SWAP_MS = 180;

/**
 * Quadra grande no celular (?lab=hud): o canvas fica do tamanho da altura da janela, mais largo que ela, e anda de
 * lado seguindo a bola (suave, como o clipe 9:16). `follow` desligado (4x e 8x: seguir a bola correndo dá enjoo e a
 * gente perde o lance) mostra a quadra inteira: a caixa volta à largura da tela (`.hud-full`) e o próprio Phaser
 * (FIT) encaixa a quadra no meio. A troca passa por um fade curto (nada salta). Encolher com `scale` não serve: o
 * Phaser mede a caixa já encolhida e encolhe o canvas de novo. Os textos presos à tela vão pra faixa visível
 * (`setClipView`) e o toque no Pokémon continua certo (`updateBounds` quando a quadra anda).
 */
export function useCourtFollow(on: boolean, wrap: RefObject<HTMLElement | null>, follow = true) {
    const followRef = useRef(follow);
    followRef.current = follow;
    useEffect(() => {
        if (!on) return;
        let scene: FollowScene | null = null;
        let x: number | null = null;
        let mode: boolean | null = null;
        let swapping = false;
        let raf = 0;
        const onReady = (sc: FollowScene) => {
            scene = sc;
        };
        EventBus.on('current-scene-ready', onReady);
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const box = wrap.current;
            const inner = box?.querySelector<HTMLElement>('.phaser-container');
            if (!scene || !box || !inner || swapping) return;
            const want = followRef.current;
            if (mode !== want) {
                const first = mode === null;
                mode = want;
                const apply = () => {
                    box.classList.toggle('hud-full', !want);
                    inner.style.transform = '';
                    x = null;
                    if (!want) scene?.setClipView(0, scene.scale.width);
                };
                if (first) apply();
                else {
                    swapping = true;
                    inner.style.opacity = '0';
                    window.setTimeout(() => {
                        apply();
                        window.setTimeout(() => {
                            inner.style.opacity = '';
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
            const target = followOffset(scene.ballOnScreen().x * k, view, full);
            const next = x === null ? target : x + (target - x) * 0.12;
            if (x !== null && Math.abs(next - x) < 0.3) return;
            x = next;
            inner.style.transform = `translateX(${x}px)`;
            scene.setClipView(-x / k, view / k);
            scene.scale.updateBounds();
        };
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            EventBus.off('current-scene-ready', onReady);
        };
    }, [on, wrap]);
}
