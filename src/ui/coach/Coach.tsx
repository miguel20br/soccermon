import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { track } from '../../analytics/track';
import { fmt } from '../../i18n';
import { useT } from '../../i18n/react';
import { COACH_GROUPS, type CoachId, coachSeen, whenHydrated } from '../../store/coach';
import { useGame } from '../../store/game-store';
import { reduceMotionOn } from '../reduce-motion';
import './coach.css';
import { type Box, needsScroll, placeBalloon, tappableUnder } from './place';

const PAD = 6;
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
 * Balões do tutorial (coach marks): apagam o resto da tela, acendem o elemento de verdade e põem uma linha ao lado.
 * `targets` são seletores CSS, um por balão, na ordem; os textos vêm de `help.coach[id]`. Aparece uma vez por modo
 * (o flag vai pro save assim que o 1º balão aparece), respeita "Dicas" nas configurações, sempre dá pra pular, e
 * volta pela Ajuda. Se o elemento ainda não existe (ou sumiu), espera ele aparecer.
 */
export function Coach({
    id,
    targets,
    when = true,
    onActive,
}: {
    id: CoachId;
    targets: readonly string[];
    when?: boolean;
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
        if (g.settings.tips && !g.tour && !coachSeen(g.profile.coach, id)) setActive(true);
    }, [hydrated, when, id]);
    useEffect(() => onActive?.(active), [active, onActive]);

    return active ? (
        <Balloon id={id} targets={targets.slice(0, total)} lines={lines} onEnd={() => setActive(false)} />
    ) : null;
}

function Balloon({
    id,
    targets,
    lines,
    onEnd,
}: {
    id: CoachId;
    targets: readonly string[];
    lines: readonly string[];
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
            const r = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
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

    // foco no balão e de volta pra quem tinha
    const lit = useRef<Element | null>(null);
    lit.current = el;
    useEffect(() => {
        const before = document.activeElement as HTMLElement | null;
        return () => {
            // ninguém tinha o foco (o balão abre sozinho na entrada): ele vai pro alvo aceso, se der pra focar
            const target =
                before && before !== document.body ? before : lit.current?.closest('button, a, input, [tabindex]');
            (target as HTMLElement | null)?.focus?.({ preventScroll: true });
        };
    }, []);
    useEffect(() => {
        if (shown) balloon.current?.focus({ preventScroll: true });
    }, [shown]);

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

    // tocar fora fecha o balão E segue pro botão tocado (antes o toque morria no pedaço transparente)
    const tapOutside = (e: MouseEvent) => {
        const target = tappableUnder(document.elementsFromPoint(e.clientX, e.clientY));
        skip();
        (target as HTMLElement | null)?.click();
    };

    // tocar no elemento aceso conta como "entendi": a ação dele acontece e o tutorial segue
    // biome-ignore lint/correctness/useExhaustiveDependencies: advance muda a cada render e só lê i/last
    useEffect(() => {
        if (!el) return;
        const on = () => advance();
        el.addEventListener('click', on, { once: true });
        return () => el.removeEventListener('click', on);
    }, [el, i]);

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            skip();
        } else if (e.key === 'Tab') {
            const items = balloon.current?.querySelectorAll<HTMLElement>('button');
            if (!items?.length) return;
            const first = items[0];
            const lastEl = items[items.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === balloon.current)) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    if (!rect) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const p = placeBalloon(rect, size, vw, vh);
    const right = rect.left + rect.width;
    const bottom = rect.top + rect.height;
    const text = lines[i];
    return (
        <div className={`coach${shown ? ' on' : ''}${moving ? ' moving' : ''}`}>
            {/* quatro pedaços transparentes em volta do alvo: tocar fora fecha, e o alvo continua tocável.
                Div e não botão: fora do Tab e do leitor (o teclado pula com Esc ou "Pular"). */}
            {(
                [
                    ['cima', { left: 0, top: 0, width: vw, height: rect.top }],
                    ['baixo', { left: 0, top: bottom, width: vw, height: Math.max(0, vh - bottom) }],
                    ['esq', { left: 0, top: rect.top, width: rect.left, height: rect.height }],
                    ['dir', { left: right, top: rect.top, width: Math.max(0, vw - right), height: rect.height }],
                ] as const
            ).map(([k, style]) => (
                <div key={k} aria-hidden="true" className="coach-block" onClick={tapOutside} style={style} />
            ))}
            <div
                className="coach-hole"
                aria-hidden="true"
                style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
            />
            <div
                ref={balloon}
                className={`coach-balloon bc-surface bc-stripe side-${p.side}`}
                role="dialog"
                aria-modal="true"
                aria-label={c.label}
                aria-describedby="coach-text"
                tabIndex={-1}
                onKeyDown={onKeyDown}
                style={{ left: p.left, top: p.top, '--arrow': `${p.arrow}px` } as CSSProperties}
            >
                <p id="coach-text" className="coach-text">
                    {text}
                </p>
                <div className="coach-foot">
                    {targets.length > 1 && (
                        <span className="coach-count bc-lbl">{fmt(c.count, { n: i + 1, total: targets.length })}</span>
                    )}
                    <button type="button" className="btn ghost small coach-skip" onClick={skip}>
                        {c.skip}
                    </button>
                    <button type="button" className="btn primary small coach-next" onClick={advance}>
                        {last ? c.done : c.next}
                    </button>
                </div>
            </div>
        </div>
    );
}
