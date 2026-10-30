import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { editionOf } from '../../engine/specials';
import { playCry, playSfx } from '../../game/audio';
import { heardAt, musicLines, onLines } from '../../game/music';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { metalOf } from '../rarity';
import { reduceMotionOn } from '../settings-sync';
import { TYPE_COLOR } from '../type-colors';
import { uiZoom } from '../ui-zoom';
import { Logo } from './LogoHits';

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
    compact: { open: 480, gap: 120, hold: 160, card: 360 },
    fast: { open: 200, gap: 50, hold: 0, card: 320 },
};
const WALKOUT_MS = 1200;
/** Animações da carta que contam o `--rd` (a saída, o walkout, os raios e o brilho da carta grande). */
const REVEAL_ANIMS = ['cpack-out', 'cpack-walk', 'cpack-rays', 'opt-glow'];
/** Tom sobe carta a carta (dó, mi, sol, dó), como a contagem do Balatro. */
const pitchOf = (i: number) => 2 ** (([0, 4, 7, 12][i] ?? 12) / 12);

/**
 * Carta grande (ouro, Shiny, edição especial) solta o grito do Pokémon quando aparece (`data-cry` = espécie). As
 * outras não: três gritos em 0,3 s viravam barulho.
 */
function cryOf(el: HTMLElement) {
    const id = Number(el.dataset.cry);
    if (id && (el.classList.contains('big') || el.classList.contains('walk')))
        playCry(id, useGame.getState().settings.cries, 0.8);
}

type Phase = 'closed' | 'opening' | 'flip' | 'done';

/**
 * Pacote de cartas com o logo (recompensa e draft). Envolve a grade de cartas: cada carta marcada com
 * `.cpack-card` (`.big` segura mais e brilha; `.walk` sobe com luz atrás, o walkout; `data-cry` = espécie, pro grito da
 * carta grande). Fechado (`sealed`), espera
 * um toque; aberto, a tampa rasga e as cartas saem do pacote uma de cada vez com o tom subindo. Um toque durante
 * a abertura pula tudo. `revealKey` novo = cartas novas: no draft abre outro pacote, na recompensa (já aberta)
 * as cartas só viram. Com "reduzir movimento" as cartas aparecem na hora (fica o som).
 */
export function CardPack({
    revealKey,
    sealed = false,
    autoOpen = false,
    compact = false,
    fast = false,
    look,
    label,
    type,
    onOpen,
    children,
}: {
    revealKey: string;
    sealed?: boolean;
    /** Com `sealed`: abre sozinho ao aparecer (sem o toque a mais); cartas novas depois só viram, como no fechado. */
    autoOpen?: boolean;
    compact?: boolean;
    fast?: boolean;
    look: PackLook;
    label?: string;
    /** Pacote de tipo (Mercado): na cor e com a estampa do tipo. */
    type?: string;
    onOpen?: () => void;
    children: ReactNode;
}) {
    const { t } = useT();
    const [phase, setPhase] = useState<Phase>(sealed && !autoOpen ? 'closed' : 'opening');
    // biome-ignore lint/correctness/useExhaustiveDependencies: conta a abertura uma vez, quando o pacote abre sozinho
    useEffect(() => {
        if (sealed && autoOpen) onOpen?.();
    }, []);
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
    // abertura já rodando não para se o pacote sair da tela (senão travava e repetia tudo ao voltar)
    const running = useRef(false);
    useEffect(() => {
        const el = stageRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') return setInView(true);
        const io = new IntersectionObserver(
            ([e]) => {
                const v = e.intersectionRatio >= 0.35;
                if (v || !running.current) setInView(v);
            },
            {
                threshold: [0, 0.35, 1],
            },
        );
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
            // as cartas aparecem já; o som cai na próxima linha da música (a mesma regra, sem animação)
            const g = musicLines(1);
            playSfx(
                cards.some((c) => c.classList.contains('walk')) ? 'goal' : 'select',
                1,
                g ? heardAt(g.lines[0] / 1000) : undefined,
            );
            const big = cards.find(
                (c) => c.dataset.cry && (c.classList.contains('big') || c.classList.contains('walk')),
            );
            if (big) cryOf(big);
            setPhase('done');
            return;
        }
        const timers: number[] = [];
        /** Sons já agendados no tempo da música: um toque (pular) cala os que ainda não soaram. */
        const sounds: { src?: AudioBufferSourceNode; at: number }[] = [];
        running.current = true;
        const lead = phase === 'opening' ? tm.open : 0;
        if (phase === 'opening' && !compact) playSfx('kick', 1.7);
        // cada carta sai do centro do pacote (que fica no centro da grade) até o seu lugar
        for (const el of cards) {
            el.style.removeProperty('--fx');
            el.style.removeProperty('--fy');
        }
        const s = stage.getBoundingClientRect();
        const z = uiZoom();
        // horário de cada carta: depois da tampa, uma de cada vez (a grande segura mais)
        const base: number[] = [];
        let at = lead;
        for (const el of cards) {
            base.push(at);
            at += tm.gap + (el.classList.contains('big') ? tm.hold : 0);
        }
        // com a opção "cartas no ritmo da música" (padrão desligada), cada carta cai numa batida (colcheia, se a batida é longa) e o som dela sai nessa linha; o rápido
        // (da 7ª recompensa em diante) fica como era. Um toque continua pulando tudo na hora.
        const grid = fast || !useGame.getState().settings.packOnBeat ? null : musicLines(cards.length * 4 + 8);
        const pNow = performance.now();
        const times = grid ? onLines(base, grid.lines) : base;
        let end = 0;
        cards.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const fly = phase === 'opening';
            el.style.setProperty('--fx', `${fly ? (s.left + s.width / 2 - (r.left + r.width / 2)) / z : 0}px`);
            el.style.setProperty('--fy', `${fly ? (s.top + s.height / 2 - (r.top + r.height / 2)) / z : 0}px`);
            const d = times[i];
            el.style.setProperty('--rd', `${d}ms`);
            const walk = el.classList.contains('walk');
            // no tempo da música, o som vai já pro AudioContext (a saída do áudio atrasa até 200 ms: um timer chegaria tarde)
            const when = grid ? heardAt(d / 1000) : undefined;
            const sfx = () => playSfx(walk ? 'goal' : 'select', walk ? 1 : pitchOf(i), when);
            if (when === undefined) timers.push(window.setTimeout(sfx, d));
            else sounds.push({ src: sfx(), at: when });
            timers.push(window.setTimeout(() => cryOf(el), d));
            end = Math.max(end, d + (walk ? WALKOUT_MS : tm.card));
            // o atraso conta de agora, não do quadro em que a animação nasceu (pode ter sido 100 ms antes, num quadro
            // pesado, ou quando o pacote entrou na tela): a carta cai na linha junto do som dela
            for (const a of el.getAnimations({ subtree: true }))
                if (REVEAL_ANIMS.includes((a as CSSAnimation).animationName)) a.startTime = pNow;
        });
        timers.push(window.setTimeout(() => setPhase('done'), end));
        return () => {
            running.current = false;
            for (const id of timers) clearTimeout(id);
            for (const { src, at } of sounds) if (src && at > src.context.currentTime) src.stop();
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
                    {showPack && <PackArt look={look} label={label} type={type} />}
                    {phase === 'closed' && <span className="cpack-hint">{t('reward.pack.tap')}</span>}
                </button>
            )}
        </div>
    );
}

/**
 * O pacote lacrado (a arte, sem o toque): o do logo, ou o de tipo (Mercado) na cor do tipo, com o ícone no lugar da
 * carta do logo e a estampa do tipo no fundo.
 */
export function PackArt({ look, label, type }: { look: PackLook; label?: string; type?: string }) {
    const style = type
        ? ({ '--tc': TYPE_COLOR[type], '--ticon': `url(assets/types/${type.toLowerCase()}.png)` } as CSSProperties)
        : undefined;
    return (
        <span className={`cpack${look ? ` cpack-${look}` : ''}${type ? ' cpack-type' : ''}`} style={style} aria-hidden>
            <span className="cpack-body">
                {type ? (
                    <>
                        <span className="cpack-pattern" />
                        <img className="cpack-typeicon" src={`assets/types/${type.toLowerCase()}.png`} alt="" />
                    </>
                ) : (
                    <img className="cpack-simbolo" src="assets/ui/simbolo.svg" alt="" />
                )}
                <Logo className="cpack-logo" />
                {label && <span className="cpack-label">{label}</span>}
            </span>
            <span className="cpack-top" />
            <span className="cpack-burst" />
        </span>
    );
}
