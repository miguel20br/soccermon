import type { MaxGrade } from '../engine/state';
import { t } from '../i18n';
import { useGame } from '../store/game-store';
import { reduceMotionOn } from './reduce-motion';
import { uiZoom } from './ui-zoom';

/**
 * A resposta do toque no golpe máximo, na hora (pedido do Miguel, 30/10: "efeitos visuais responsivos e bonitos"):
 * sai do botão aceso, por cima de tudo, sem passar pelo React. Perfeito = clarão, duas ondas, chuva de estrelas e
 * moedas, "PERFEITO!" que pula e a quadra treme; bom = uma onda, umas faíscas e "BOM"; fora = "FORA" que cai e o
 * botão balança. Só transform e opacity (WAAPI); com "reduzir movimento", só o texto aparecendo e sumindo.
 */
const LOOK: Record<MaxGrade, { bits: number; rings: number; flash: boolean; shake: number; buzz: number[] }> = {
    2: { bits: 16, rings: 2, flash: true, shake: 5, buzz: [18, 30, 36] },
    1: { bits: 7, rings: 1, flash: false, shake: 0, buzz: [14] },
    0: { bits: 0, rings: 0, flash: false, shake: 0, buzz: [] },
};

/** O botão aceso que está na tela (o grande em cima da quadra ou o da barra de baixo). */
function litButton(): HTMLElement | null {
    for (const el of document.querySelectorAll<HTMLElement>('.sl-cue:not(.sl-wait), .bc-maxthumb.ready'))
        if (el.offsetParent !== null) return el;
    return null;
}

const node = (cls: string, parent: HTMLElement) => {
    const el = document.createElement('i');
    el.className = cls;
    parent.appendChild(el);
    return el;
};

const LABEL = { 2: 'match.agency.maxPerfect', 1: 'match.agency.maxGood', 0: 'match.agency.maxOff' } as const;

export function maxBurst(q: MaxGrade) {
    const btn = litButton();
    if (!btn) return;
    // o estouro sai do anel (o ícone do botão grande), não do meio do botão
    const r = (btn.querySelector('.sl-ring-at') ?? btn).getBoundingClientRect();
    const cs = getComputedStyle(btn);
    const layer = document.createElement('div');
    layer.className = `max-burst q${q}`;
    layer.setAttribute('aria-hidden', 'true');
    // a cor do nível (N3 = tipo do capitão) vem do botão
    layer.style.setProperty('--bc', cs.getPropertyValue('--lvc').trim() || 'var(--yellow)');
    // o retângulo vem em px da tela; o estilo anda em px da página com o zoom da tela grande
    const z = uiZoom();
    layer.style.left = `${(r.left + r.width / 2) / z}px`;
    layer.style.top = `${(r.top + r.height / 2) / z}px`;
    document.body.appendChild(layer);
    const look = LOOK[q];
    const anims: Animation[] = [];
    const text = node('mb-text', layer);
    text.textContent = t(LABEL[q]);

    if (reduceMotionOn()) {
        anims.push(text.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 700 }));
    } else {
        anims.push(
            text.animate(
                q === 0
                    ? [
                          { opacity: 0, transform: 'translate(-50%, -190%)' },
                          { opacity: 1, transform: 'translate(-50%, -170%)', offset: 0.2 },
                          { opacity: 0, transform: 'translate(-50%, -110%) rotate(-8deg)' },
                      ]
                    : [
                          { opacity: 0, transform: 'translate(-50%, -50%) scale(0.3)' },
                          { opacity: 1, transform: 'translate(-50%, -130%) scale(1.35)', offset: 0.18 },
                          { opacity: 1, transform: 'translate(-50%, -150%) scale(1)', offset: 0.32 },
                          { opacity: 1, transform: 'translate(-50%, -170%) scale(1)', offset: 0.75 },
                          { opacity: 0, transform: 'translate(-50%, -210%) scale(0.9)' },
                      ],
                { duration: q === 0 ? 600 : 950, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
            ),
        );
        // o botão: perfeito e bom afundam e voltam inchados; fora balança
        btn.animate(
            q === 0
                ? [
                      { translate: '0 0' },
                      { translate: '-5px 0', offset: 0.25 },
                      { translate: '5px 0', offset: 0.5 },
                      { translate: '-3px 0', offset: 0.75 },
                      { translate: '0 0' },
                  ]
                : [
                      { scale: '1' },
                      { scale: '0.86', offset: 0.25 },
                      { scale: q === 2 ? '1.16' : '1.08', offset: 0.6 },
                      { scale: '1' },
                  ],
            { duration: q === 0 ? 260 : 300, easing: 'ease-out' },
        );
        for (let i = 0; i < look.rings; i++) {
            const ring = node('mb-ring', layer);
            anims.push(
                ring.animate(
                    [
                        { opacity: 1, transform: 'translate(-50%, -50%) scale(0.4)' },
                        { opacity: 0, transform: `translate(-50%, -50%) scale(${i ? 5.5 : 3.6})` },
                    ],
                    { duration: i ? 620 : 420, delay: i * 70, easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)' },
                ),
            );
        }
        for (let i = 0; i < look.bits; i++) {
            // estrela ou moeda, num leque em volta (perfeito: o círculo todo; bom: só pra cima)
            const bit = node(i % 3 === 0 ? 'mb-bit coin' : 'mb-bit star', layer);
            const a =
                q === 2 ? (i / look.bits) * Math.PI * 2 + Math.random() * 0.4 : -Math.PI * (0.15 + Math.random() * 0.7);
            const d = (q === 2 ? 90 : 55) + Math.random() * (q === 2 ? 80 : 35);
            const [x, y] = [Math.cos(a) * d, Math.sin(a) * d];
            const spin = (Math.random() - 0.5) * 540;
            anims.push(
                bit.animate(
                    [
                        { opacity: 1, transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)' },
                        {
                            opacity: 1,
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.1) rotate(${spin / 2}deg)`,
                            offset: 0.45,
                        },
                        // a gravidade: depois do estouro elas caem um pouco e somem
                        {
                            opacity: 0,
                            transform: `translate(calc(-50% + ${x * 1.15}px), calc(-50% + ${y + 40}px)) scale(0.6) rotate(${spin}deg)`,
                        },
                    ],
                    { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(0.15, 0.85, 0.4, 1)' },
                ),
            );
        }
        if (look.flash) {
            const flash = node('mb-flash', layer);
            anims.push(flash.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' }));
        }
        if (look.shake) {
            const court = document.querySelector<HTMLElement>('.phaser-container');
            const s = look.shake;
            court?.animate(
                [
                    { translate: '0 0' },
                    { translate: `${-s}px ${s / 2}px`, offset: 0.2 },
                    { translate: `${s}px ${-s / 2}px`, offset: 0.4 },
                    { translate: `${-s / 2}px ${s / 3}px`, offset: 0.6 },
                    { translate: `${s / 3}px 0`, offset: 0.8 },
                    { translate: '0 0' },
                ],
                { duration: 240, easing: 'linear' },
            );
        }
    }
    if (useGame.getState().settings.haptics !== false && look.buzz.length && 'vibrate' in navigator) {
        try {
            navigator.vibrate(look.buzz);
        } catch {
            // sem vibração: fica o resto
        }
    }
    Promise.all(anims.map((a) => a.finished))
        .catch(() => {})
        .finally(() => layer.remove());
}
