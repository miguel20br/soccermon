import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { editionOf } from '../../engine/specials';
import { playSfx } from '../../game/audio';
import { useT } from '../../i18n/react';
import { metalOf } from '../rarity';
import { reduceMotionOn } from '../settings-sync';

/** Pista do melhor conteúdo no pacote fechado: edição especial brilha holográfico, carta ouro (75+) tem borda dourada. */
export type PackLook = '' | 'gold' | 'special';

/** Carta que segura a revelação um pouco mais: ouro (75+), Shiny ou edição especial. */
export const isBigCard = (o: PokemonInstance) => metalOf(viewInstance(o).overall) === 'ouro' || !!editionOf(o);

export const packLookOf = (cards: readonly PokemonInstance[]): PackLook =>
    cards.some((c) => editionOf(c)) ? 'special' : cards.some(isBigCard) ? 'gold' : '';

/**
 * Tempos da abertura (ms): `open` = do toque até a 1ª carta sair; `gap` entre cartas; `hold` a mais depois de
 * uma carta grande; `card` = duração da saída de cada carta. Compacto (draft, 8 por copa) e rápido (da 7ª
 * recompensa em diante) encurtam a festa.
 */
const TIMING = {
    full: { open: 560, gap: 220, hold: 380, card: 460 },
    compact: { open: 240, gap: 110, hold: 160, card: 340 },
    fast: { open: 200, gap: 50, hold: 0, card: 320 },
};
const WALKOUT_MS = 1200;
/** Tom sobe carta a carta (dó, mi, sol, dó), como a contagem do Balatro. */
const pitchOf = (i: number) => 2 ** ([0, 4, 7, 12][i] ?? 12) / 12;

type Phase = 'closed' | 'opening' | 'flip' | 'done';

/**
 * Pacote de cartas com o logo (recompensa e draft). Envolve a grade de cartas: cada carta marcada com
 * `.cpack-card` (`.big` segura mais e brilha; `.walk` sobe com luz atrás, o walkout). Fechado (`sealed`), espera
 * um toque; aberto, a tampa rasga e as cartas saem do pacote uma de cada vez com o tom subindo. Um toque durante
 * a abertura pula tudo. `revealKey` novo = cartas novas: no draft abre outro pacote, na recompensa (já aberta)
 * as cartas só viram. Com "reduzir movimento" as cartas aparecem na hora (fica o som).
 */
export function CardPack({
    revealKey,
    sealed = false,
    compact = false,
    fast = false,
    look,
    label,
    onOpen,
    children,
}: {
    revealKey: string;
    sealed?: boolean;
    compact?: boolean;
    fast?: boolean;
    look: PackLook;
    label?: string;
    onOpen?: () => void;
    children: ReactNode;
}) {
    const { t } = useT();
    const [phase, setPhase] = useState<Phase>(sealed ? 'closed' : 'opening');
    const [lastKey, setLastKey] = useState(revealKey);
    if (lastKey !== revealKey) {
        setLastKey(revealKey);
        setPhase(sealed ? (phase === 'closed' ? 'closed' : 'flip') : 'opening');
    }
    const stageRef = useRef<HTMLDivElement>(null);
    const btnFocused = useRef(false);
    const tm = fast ? TIMING.fast : compact ? TIMING.compact : TIMING.full;
    // só abre quando o pacote está à vista (no celular o draft ainda está rolando até as cartas)
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = stageRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return setInView(true);
        const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.35), {
            threshold: [0, 0.35, 1],
        });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: a sequência roda a cada abertura (fase ou cartas novas)
    useLayoutEffect(() => {
        if (phase !== 'opening' && phase !== 'flip') return;
        if (!inView) return;
        const stage = stageRef.current;
        if (!stage) return;
        const cards = [...stage.querySelectorAll<HTMLElement>('.cpack-card')];
        if (reduceMotionOn()) {
            playSfx(cards.some((c) => c.classList.contains('walk')) ? 'goal' : 'select');
            setPhase('done');
            return;
        }
        const timers: number[] = [];
        const lead = phase === 'opening' ? tm.open : 0;
        if (phase === 'opening' && !compact) playSfx('kick', 1.7);
        // cada carta sai do centro do pacote (que fica no centro da grade) até o seu lugar
        for (const el of cards) {
            el.style.removeProperty('--fx');
            el.style.removeProperty('--fy');
        }
        const s = stage.getBoundingClientRect();
        let at = lead;
        let end = 0;
        cards.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const fly = phase === 'opening';
            el.style.setProperty('--fx', `${fly ? s.left + s.width / 2 - (r.left + r.width / 2) : 0}px`);
            el.style.setProperty('--fy', `${fly ? s.top + s.height / 2 - (r.top + r.height / 2) : 0}px`);
            el.style.setProperty('--rd', `${at}ms`);
            const walk = el.classList.contains('walk');
            const d = at;
            timers.push(window.setTimeout(() => playSfx(walk ? 'goal' : 'select', walk ? 1 : pitchOf(i)), d));
            end = Math.max(end, d + (walk ? WALKOUT_MS : tm.card));
            at += tm.gap + (el.classList.contains('big') ? tm.hold : 0);
        });
        timers.push(window.setTimeout(() => setPhase('done'), end));
        return () => {
            for (const id of timers) clearTimeout(id);
        };
    }, [phase, revealKey, inView]);

    // quem abriu pelo teclado continua no lugar: o foco passa pra 1ª carta
    useEffect(() => {
        if (phase !== 'done' || !btnFocused.current) return;
        btnFocused.current = false;
        stageRef.current?.querySelector<HTMLElement>('.cpack-card button')?.focus({ preventScroll: true });
    }, [phase]);

    const tap = () => {
        if (phase === 'closed') {
            onOpen?.();
            setPhase('opening');
        } else setPhase('done');
    };
    const showPack = phase === 'closed' || phase === 'opening';

    return (
        <div
            ref={stageRef}
            className={`cpack-stage is-${phase}${phase === 'opening' || phase === 'flip' ? ' is-revealing' : ''}${compact ? ' cpack-compact' : ''}`}
            style={{ '--o': `${tm.open}ms` } as CSSProperties}
        >
            {children}
            {phase !== 'done' && (
                <button
                    type="button"
                    className="cpack-btn"
                    onClick={tap}
                    onFocus={() => {
                        btnFocused.current = true;
                    }}
                    onBlur={() => {
                        btnFocused.current = false;
                    }}
                    aria-label={t(phase === 'closed' ? 'reward.pack.open' : 'reward.pack.skip')}
                >
                    {showPack && (
                        <span className={`cpack${look ? ` cpack-${look}` : ''}`} aria-hidden>
                            <span className="cpack-body">
                                <img className="cpack-logo" src="assets/ui/logo.svg" alt="" />
                                {label && <span className="cpack-label">{label}</span>}
                            </span>
                            <span className="cpack-top" />
                            <span className="cpack-burst" />
                        </span>
                    )}
                    {phase === 'closed' && <span className="cpack-hint">{t('reward.pack.tap')}</span>}
                </button>
            )}
        </div>
    );
}
