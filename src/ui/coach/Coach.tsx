import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { track } from '../../analytics/track';
import { fmt } from '../../i18n';
import { useT } from '../../i18n/react';
import { COACH_GROUPS, type CoachId, coachSeen, whenHydrated } from '../../store/coach';
import { useGame } from '../../store/game-store';
import { reduceMotionOn } from '../reduce-motion';
import { uiZoom } from '../ui-zoom';
import './coach.css';
import { type Box, needsScroll, placeBalloon } from './place';

const PAD = 6;
/** Vão entre a linha e o alvo, onde mora o dedo. */
const FINGER_GAP = 34;
const FADE_MS = 220;
const MOVE_MS = 260;

export function useHydrated() {
    const [ok, setOk] = useState(() => useGame.persist.hasHydrated());
    useEffect(() => {
        if (ok) return;
        return whenHydrated(useGame.persist, () => setOk(true));
    }, [ok]);
    return ok;
}

const sameBox = (a: Box | null, b: Box | null) =>
    a === b || (!!a && !!b && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height);

/** Marca como visto (no save): só `ids`, ou o grupo inteiro quando a pessoa pula. */
export function markSeen(ids: readonly CoachId[]) {
    const { profile, updateProfile } = useGame.getState();
    const have = profile.coach ?? [];
    const next = [...new Set([...have, ...ids])];
    if (next.length !== have.length) updateProfile({ coach: next });
}

/**
 * Dicas da primeira vez (coach marks, cara-de-jogo.md decisão 14): um dedo apontando pro elemento de verdade e uma
 * linha ao lado, sem apagar a tela (dá pra tocar em tudo). Some quando a pessoa toca no elemento.
 * `targets` são seletores CSS, um por balão, na ordem; os textos vêm de `help.coach[id]`. Aparece uma vez por modo
 * (o flag vai pro save assim que o 1º balão aparece), respeita "Dicas" nas configurações, sempre dá pra pular, e
 * volta pela Ajuda. Se o elemento ainda não existe (ou sumiu), espera ele aparecer.
 */
export function Coach({
    id,
    targets,
    when = true,
    pause = false,
    onActive,
}: {
    id: CoachId;
    targets: readonly string[];
    when?: boolean;
    /** Some (com o fade) e deixa a tela tocável enquanto vale; volta depois, no mesmo passo (o golpe máximo aceso). */
    pause?: boolean;
    /** Avisa quando o balão abre e fecha (a tela esconde a dica que diria o mesmo). */
    onActive?: (on: boolean) => void;
}) {
    const { d } = useT();
    const hydrated = useHydrated();
    const [active, setActive] = useState(false);
    const decided = useRef(false);
    const lines = d.help.coach[id];
    const total = Math.min(lines.length, targets.length);

    // decide uma vez, na 1ª vez que `when` vale com o save carregado (marcar como visto depois não apaga o balão)
    useEffect(() => {
        if (decided.current || !hydrated || !when) return;
        decided.current = true;
        const g = useGame.getState();
        if (g.settings.tips && !coachSeen(g.profile.coach, id)) setActive(true);
    }, [hydrated, when, id]);
    useEffect(() => onActive?.(active), [active, onActive]);

    return active ? (
        <Balloon id={id} targets={targets.slice(0, total)} lines={lines} pause={pause} onEnd={() => setActive(false)} />
    ) : null;
}

function Balloon({
    id,
    targets,
    lines,
    pause,
    onEnd,
}: {
    id: CoachId;
    targets: readonly string[];
    lines: readonly string[];
    pause: boolean;
    onEnd: () => void;
}) {
    const { d } = useT();
    const c = d.help.coach;
    const [i, setI] = useState(0);
    const [el, setEl] = useState<Element | null>(null);
    const [rect, setRect] = useState<Box | null>(null);
    const [size, setSize] = useState({ width: 280, height: 90 });
    const [shown, setShown] = useState(false);
    const [moving, setMoving] = useState(false);
    const balloon = useRef<HTMLDivElement>(null);
    const told = useRef(-1);
    const mode = COACH_GROUPS[id][0];
    const props = { mode, part: id, total: targets.length };
    const last = i === targets.length - 1;

    // acha o alvo (e de novo se ele sumir ou trocar: a tela pode redesenhar)
    useEffect(() => {
        const find = () => {
            const found = document.querySelector(targets[i]);
            const ok = found && found.getBoundingClientRect().width > 0 ? found : null;
            setEl((prev) => (prev === ok ? prev : ok));
        };
        find();
        const timer = window.setInterval(find, 250);
        return () => window.clearInterval(timer);
    }, [i, targets]);

    // acompanha a posição do alvo (rolagem, animação de entrada da tela, mudança de tamanho)
    useEffect(() => {
        if (!el) {
            setRect(null);
            return;
        }
        let raf = 0;
        const tick = () => {
            // tela grande: medidas em px da tela, estilo em px do CSS (ui-zoom.ts)
            const z = uiZoom();
            const d = el.getBoundingClientRect();
            const r = { left: d.left / z, top: d.top / z, right: d.right / z, bottom: d.bottom / z };
            const vw = window.innerWidth / z;
            const vh = window.innerHeight / z;
            // só a parte que está na tela
            const l = Math.max(0, r.left - PAD);
            const t = Math.max(0, r.top - PAD);
            const box = {
                left: l,
                top: t,
                width: Math.max(0, Math.min(vw, r.right + PAD) - l),
                height: Math.max(0, Math.min(vh, r.bottom + PAD) - t),
            };
            setRect((prev) => (sameBox(prev, box) ? prev : box));
            raf = requestAnimationFrame(tick);
        };
        const r0 = el.getBoundingClientRect();
        if (needsScroll(r0, window.innerHeight))
            el.scrollIntoView({ block: 'nearest', behavior: reduceMotionOn() ? 'auto' : 'smooth' });
        tick();
        return () => cancelAnimationFrame(raf);
    }, [el]);

    // aviso de "apareceu": uma vez por balão; o flag vai pro save no 1º
    useEffect(() => {
        if (!rect || told.current === i) return;
        told.current = i;
        if (i === 0) markSeen([id]);
        track('coach_shown', { ...props, step: i + 1 });
        setShown(true);
    });

    // anda até o novo alvo com transição; fora disso a posição segue o alvo sem atraso (rolagem)
    useEffect(() => {
        setMoving(i > 0);
        const timer = window.setTimeout(() => setMoving(false), MOVE_MS);
        return () => window.clearTimeout(timer);
    }, [i]);

    useLayoutEffect(() => {
        const b = balloon.current;
        if (b && (b.offsetWidth !== size.width || b.offsetHeight !== size.height))
            setSize({ width: b.offsetWidth, height: b.offsetHeight });
    });

    const end = () => {
        setShown(false);
        window.setTimeout(onEnd, FADE_MS);
    };
    const advance = () => {
        track('coach_next', { ...props, step: i + 1 });
        if (last) end();
        else {
            setI(i + 1);
        }
    };
    const skip = () => {
        track('coach_skip', { ...props, step: i + 1 });
        markSeen(COACH_GROUPS[id]);
        end();
    };

    // tocar no elemento aceso conta como "entendi": a ação dele acontece e o tutorial segue
    // biome-ignore lint/correctness/useExhaustiveDependencies: advance muda a cada render e só lê i/last
    useEffect(() => {
        if (!el) return;
        const on = () => advance();
        el.addEventListener('click', on, { once: true });
        return () => el.removeEventListener('click', on);
    }, [el, i]);

    // sem véu a tela segue viva: Esc pula a dica sem tirar o foco de ninguém
    // biome-ignore lint/correctness/useExhaustiveDependencies: skip muda a cada render e só lê i
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || document.querySelector('.k-sheet')) return;
            skip();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [i]);

    if (!rect) return null;
    const vw = window.innerWidth / uiZoom();
    const vh = window.innerHeight / uiZoom();
    // a barra do polegar (fixa embaixo no celular) não conta como tela livre: a linha não tapa o botão de jogar
    const bar = document.querySelector('.bc-thumbbar');
    const barTop = bar && getComputedStyle(bar).position === 'fixed' ? bar.getBoundingClientRect().top / uiZoom() : vh;
    const p = placeBalloon(rect, size, vw, rect.top + rect.height <= barTop ? barTop : vh, FINGER_GAP);
    const text = lines[i];
    // o dedo fica no vão entre a linha e o alvo, apontando pra ele (no `inside`, a linha está dentro do alvo)
    const finger =
        p.side === 'below' || p.side === 'inside'
            ? { left: p.left + p.arrow, top: p.top - FINGER_GAP / 2 }
            : p.side === 'above'
              ? { left: p.left + p.arrow, top: p.top + size.height + FINGER_GAP / 2 }
              : p.side === 'right'
                ? { left: p.left - FINGER_GAP / 2, top: p.top + p.arrow }
                : p.side === 'left'
                  ? { left: p.left + size.width + FINGER_GAP / 2, top: p.top + p.arrow }
                  : { left: p.left + p.arrow, top: p.top - FINGER_GAP / 2 };
    // portal no body: dentro do palco (zoom no PC) o `position: fixed` mediria com o zoom do palco
    return createPortal(
        <div className={`coach${shown && !pause ? ' on' : ''}${pause ? ' paused' : ''}${moving ? ' moving' : ''}`}>
            <div
                className="coach-ring"
                aria-hidden="true"
                style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
            />
            <i
                className={`coach-finger to-${p.side}`}
                aria-hidden="true"
                style={{ left: finger.left, top: finger.top }}
            >
                <FingerIcon />
            </i>
            <div
                ref={balloon}
                className={`coach-balloon bc-surface bc-stripe side-${p.side}`}
                role="note"
                aria-label={c.label}
                style={{ left: p.left, top: p.top } as CSSProperties}
            >
                <p className="coach-text" aria-live="polite">
                    {text}
                </p>
                {targets.length > 1 && (
                    <span className="coach-count bc-lbl">{fmt(c.count, { n: i + 1, total: targets.length })}</span>
                )}
                <button type="button" className="btn ghost small coach-skip" onClick={skip}>
                    {c.skip}
                </button>
                <button type="button" className="btn small coach-next" onClick={advance}>
                    {last ? c.done : c.next}
                </button>
            </div>
        </div>,
        document.body,
    );
}

/** O dedo de pixel apontando pra cima (o CSS gira pro lado do alvo). */
function FingerIcon() {
    return (
        <svg viewBox="0 0 16 20" width="26" height="32" shapeRendering="crispEdges" aria-hidden="true">
            <path
                fill="#fff"
                stroke="#0b1030"
                strokeWidth="1.2"
                d="M6 1h2v1h1v6h1V7h2v1h1v1h1v1h1v6h-1v2h-1v1H5v-1H4v-2H3v-2H2v-3h1v-1h2v1h0V2h1z"
            />
            <path fill="#ffcb05" d="M6 2h2v5H6z" />
        </svg>
    );
}
