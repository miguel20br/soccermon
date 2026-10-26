import { type RefObject, useEffect } from 'react';
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

/**
 * Quadra grande no celular (?lab=hud): o canvas fica do tamanho da altura da janela, mais largo que ela, e anda de
 * lado seguindo a bola (suave, como o clipe 9:16). Os textos presos à tela (caixa de batalha, faixas) vão pra dentro
 * da faixa visível (`setClipView`), e o toque no Pokémon continua certo (`updateBounds` quando a quadra anda).
 */
export function useCourtFollow(on: boolean, wrap: RefObject<HTMLElement | null>) {
    useEffect(() => {
        if (!on) return;
        let scene: FollowScene | null = null;
        let x: number | null = null;
        let raf = 0;
        const onReady = (s: FollowScene) => {
            scene = s;
        };
        EventBus.on('current-scene-ready', onReady);
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const box = wrap.current;
            const inner = box?.querySelector<HTMLElement>('.phaser-container');
            if (!scene || !box || !inner) return;
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
