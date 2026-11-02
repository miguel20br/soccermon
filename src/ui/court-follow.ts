import { type RefObject, useEffect, useRef } from 'react';
import { EventBus } from '../game/EventBus';

/** O que a quadra seguindo a bola precisa da cena (a mesma interface do clipe 9:16, sem importar o Phaser). */
interface FollowScene {
    ballOnScreen(): { x: number; y: number };
    camSubject(): { carrier: { x: number; y: number } | null; attack: number };
    focusOnScreen(): { x: number; y: number };
    setZoomDamp(k: number): void;
    cameras: { main: { zoom: number } };
    setClipView(x: number, w: number): void;
    scale: { width: number; updateBounds(): void; refresh(): void };
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

/**
 * Câmera da quadra grande em pé (1x e 2x), em frações da janela pra valer em qualquer celular. Calibrar aqui.
 * Deitado e no PC a quadra já aparece inteira (sem seguir): não há zoom mais aberto que esse.
 */
export const CAM = {
    /** Quanto da quadra cabe na janela em pé (antes ~0,46: o canvas na altura toda da caixa, só uns 18 m). */
    viewShare: 0.6,
    /** Quem conduz fica atrás do meio: este tanto da janela de espaço à frente, pro gol que ele ataca. */
    attackLead: 0.17,
    /** Segundos de bola à frente: no passe e no chute o alvo fica entre a bola e onde ela vai. */
    ballAhead: 0.4,
    /** ...até este tanto da janela (bola de saída de gol "teleporta": sem teto, a câmera disparava). */
    ballAheadMax: 0.24,
    /** Quanto da bola à frente vale com alguém conduzindo (a direção do ataque já manda). */
    carrierAhead: 0.5,
    /** Tempo da mola criticamente amortecida (s): maior = mais solta, menor = mais grudada (antes ~0,13). */
    smooth: 0.6,
    /** Zona morta: o alvo mexendo menos que isto (fração da janela) não move a câmera (sem tremida). */
    dead: 0.025,
    /** Quem tem a bola nunca chega mais perto que isto da borda da janela, nem num contra-ataque em 2x. */
    edge: 0.12,
    /** ...e pra manter isso a câmera corre no máximo este tanto de janela por segundo. */
    catchUp: 1.6,
};

/** Deslocamento (px, ≤ 0) que centra o ponto na janela, sem passar das bordas da quadra. */
export function followOffset(ballX: number, view: number, full: number): number {
    return Math.min(0, Math.max(view - full, view / 2 - ballX));
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Pra onde o meio da janela quer ir (px da quadra na tela): com dono, ele mais o espaço pro gol que ataca e um pouco
 * da bola andando; bola solta (passe, chute, dividida), entre a bola e onde ela vai.
 */
export function camTarget(ball: number, carrier: number | null, attack: number, ballVel: number, view: number) {
    const ahead = clamp(ballVel * CAM.ballAhead, -CAM.ballAheadMax * view, CAM.ballAheadMax * view);
    if (carrier === null) return ball + ahead;
    return carrier + attack * CAM.attackLead * view + ahead * CAM.carrierAhead;
}

export interface CamState {
    /** Meio da janela (px da quadra na tela). */
    x: number;
    /** Velocidade dele (px/s). */
    v: number;
}

/**
 * Um passo da câmera: mola criticamente amortecida (o SmoothDamp dos motores de jogo, estável com qualquer dt: troca de
 * dono vira curva, nunca salto), zona morta, quem tem a bola longe da borda e a janela dentro da quadra.
 * `subject` = quem tem a bola (ou a bola), px na tela; null nos lances com zoom (a câmera do jogo manda).
 */
export function camStep(
    s: CamState,
    target: number,
    subject: number | null,
    dt: number,
    view: number,
    full: number,
): CamState {
    const lo = view / 2;
    const hi = Math.max(lo, full - view / 2);
    const d = target - s.x;
    const dead = CAM.dead * view;
    const goal = clamp(Math.abs(d) <= dead ? s.x : target - Math.sign(d) * dead, lo, hi);
    const w = 2 / CAM.smooth;
    const k = w * dt;
    const decay = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
    const change = s.x - goal;
    const temp = (s.v + w * change) * dt;
    let v = (s.v - w * temp) * decay;
    let x = goal + (change + temp) * decay;
    if (subject !== null) {
        const room = view / 2 - CAM.edge * view;
        const held = clamp(x, subject - room, subject + room);
        if (held !== x) {
            // encostou na margem: anda junto com quem tem a bola, no máximo `catchUp` (a bola que troca de dono longe
            // ou volta pro meio depois do gol vira panorâmica rápida, não corte); sem a velocidade de antes, que puxava
            const max = CAM.catchUp * view * dt;
            x = clamp(held, s.x - max, s.x + max);
            v = dt > 0 ? (x - s.x) / dt : 0;
        }
    }
    const inside = clamp(x, lo, hi);
    if (inside !== x) v = 0;
    return { x: inside, v };
}

/**
 * Quanto dos zooms dos lances (Transformar 1.5, golpe N3 1.35, escanteio 1.18...) vale com a quadra grande: ela já
 * mostra ~metade da quadra; o zoom inteiro por cima fechava em 2 ou 3 Pokémon e no gol (Transformar 1.5 vira 1.2).
 */
export const HUD_ZOOM_DAMP = 0.4;

/** Altura própria do canvas (px; null = enche a caixa, como na quadra inteira), centrado na caixa. */
function sizeCourt(el: HTMLElement, h: number | null) {
    el.style.height = h === null ? '' : `${h}px`;
    el.style.flex = h === null ? '' : '0 0 auto';
    el.style.marginBlock = h === null ? '' : 'auto';
}

/** Quanto a troca entre seguir a bola e a quadra inteira fica apagada (o Phaser reencaixa o canvas no meio). */
const SWAP_MS = 180;

/**
 * Quadra grande no celular (?lab=hud): o canvas fica mais largo que a janela (`CAM.viewShare` da quadra à vista, no
 * máximo a altura da caixa; a sobra fica escura em cima e embaixo) e anda de lado seguindo o lance com mola (`camStep`). `follow` desligado (4x e 8x: seguir a bola correndo dá enjoo e a
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
        let cam: CamState | null = null;
        let x: number | null = null;
        let mode: boolean | null = null;
        // velocidade da bola na tela (px/s, suavizada): a câmera vai um pouco à frente, pro lado do ataque
        let lastBall: number | null = null;
        let lastT = 0;
        let vel = 0;
        // tamanho da caixa em que o canvas foi medido (girar, teclado, barra do navegador: mede de novo)
        let sizedFor = '';
        let swapping = false;
        let raf = 0;
        let inner: HTMLElement | null = null;
        // a quadra anda com transform; o Phaser só precisa da posição nova do canvas na hora do toque (medir em todo
        // quadro forçava um layout por quadro)
        const onDown = () => scene?.scale.updateBounds();
        const host = wrap.current;
        host?.addEventListener('pointerdown', onDown, true);
        // o Phaser lê o toque no touchstart: no Safari ele pode vir antes do pointerdown
        host?.addEventListener('touchstart', onDown, { capture: true, passive: true });
        const onReady = (sc: FollowScene) => {
            scene = sc;
            mode = null;
        };
        EventBus.on('current-scene-ready', onReady);
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const box = wrap.current;
            if (!inner?.isConnected) {
                inner = box?.querySelector<HTMLElement>('.phaser-container') ?? null;
                sizedFor = '';
            }
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
                    sizeCourt(el, null);
                    sizedFor = '';
                    cam = null;
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
            const size = `${view}x${box.clientHeight}`;
            if (size !== sizedFor) {
                sizedFor = size;
                // a altura que a caixa dá (o canvas sem tamanho próprio enche ela) e a largura pra mostrar viewShare
                sizeCourt(inner, null);
                const aspect = inner.offsetWidth / (inner.offsetHeight || 1);
                sizeCourt(inner, Math.min(inner.offsetHeight, view / CAM.viewShare / aspect));
                scene.scale.refresh();
                cam = null;
            }
            const full = inner.offsetWidth;
            if (!full || full <= view) return;
            const k = full / (scene.scale.width || full);
            const now = performance.now();
            const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0;
            const ball = scene.ballOnScreen().x * k;
            if (lastBall !== null && dt > 0) vel += ((ball - lastBall) / dt - vel) * (1 - Math.exp(-dt / 0.12));
            lastBall = ball;
            lastT = now;
            // lance especial (o jogo deu zoom: gol, golpe, defesa, pênalti): vai pra onde a câmera do jogo aponta
            // (presa na quadra, nem sempre é o meio do canvas); fora disso, quem tem a bola com espaço pro ataque
            const zoomed = scene.cameras.main.zoom > 1.02;
            const sub = scene.camSubject();
            const carrier = sub.carrier ? sub.carrier.x * k : null;
            const target = zoomed ? scene.focusOnScreen().x * k : camTarget(ball, carrier, sub.attack, vel, view);
            cam = cam
                ? camStep(cam, target, zoomed ? null : (carrier ?? ball), dt, view, full)
                : camStep({ x: target, v: 0 }, target, null, 0, view, full);
            const next = followOffset(cam.x, view, full);
            if (x !== null && Math.abs(next - x) < 0.1) return;
            x = next;
            inner.style.transform = `translateX(${x}px)`;
            scene.setClipView(-x / k, view / k);
        };
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            EventBus.off('current-scene-ready', onReady);
            host?.removeEventListener('pointerdown', onDown, true);
            host?.removeEventListener('touchstart', onDown, true);
            // girou pra deitado no meio do jogo: a quadra volta inteira, no lugar e com o zoom normal
            if (inner) {
                inner.style.transform = '';
                sizeCourt(inner, null);
            }
            wrap.current?.classList.remove('hud-full');
            scene?.setZoomDamp(1);
            scene?.setClipView(0, scene.scale.width);
        };
    }, [on, wrap]);
}
