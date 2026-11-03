import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { cardTypeOf } from '../../engine/specials';
import { playCry, playSfx } from '../../game/audio';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { KantoBadge } from '../components/BadgeCase';
import { FutCard } from '../components/FutCard';
import { TypeIcon } from '../components/TypeIcon';
import { readCount, writeCount } from '../local-count';
import { reduceMotionOn } from '../settings-sync';
import { TYPE_COLOR } from '../type-colors';
import { dayNumber, walkoutBeats } from './beats';
import { useFitZoom } from './Stage';
import './stage.css';

/**
 * Momento (cara-de-jogo.md, peça 2): overlay de tela cheia com o fundo da marca e os raios girando, por cima de tudo
 * (até da barra de cima), pro prêmio acontecer num palco e não dentro da página. `onSkip` põe o "Pular" no canto
 * (terciário) e liga o Esc. As sheets (z 100) abrem por cima dele.
 */
export function MomentStage({
    children,
    onSkip,
    label,
    className = '',
    style,
}: {
    children: ReactNode;
    onSkip?: () => void;
    /** Nome do momento pro leitor de tela. */
    label: string;
    className?: string;
    style?: CSSProperties;
}) {
    const { t } = useT();
    const body = useRef<HTMLDivElement>(null);
    useFitZoom(body);
    useEffect(() => {
        if (!onSkip) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSkip();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onSkip]);
    const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
    return createPortal(
        <div
            className={`k-moment ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            style={style}
            // o Phaser escuta o mousedown na janela inteira: o toque aqui não chega na quadra
            onMouseDown={stop}
            onPointerDown={stop}
            onTouchStart={stop}
        >
            <i className="k-moment-rays" aria-hidden />
            {onSkip && (
                <button type="button" className="btn ghost small k-moment-skip" onClick={onSkip}>
                    {t('common.ui.skip')}
                </button>
            )}
            <div className="k-moment-body" ref={body}>
                {children}
            </div>
        </div>,
        document.body,
    );
}

/** A insígnia do ginásio do tipo (a 3ª batida do walkout); tipo sem ginásio mostra "Kanto". */
const BADGE_OF: Partial<Record<string, TrainerId>> = {
    Rock: 'brock',
    Water: 'misty',
    Electric: 'ltsurge',
    Grass: 'erika',
    Poison: 'koga',
    Psychic: 'sabrina',
    Fire: 'blaine',
    Ground: 'giovanni',
};

/** Tempo de cada batida do walkout (ms): tipo, posição, insígnia; a carta vem na seguinte. */
const WALK_BEAT_MS = 600;
/** O dia do último walkout neste navegador: do 2º do dia em diante ele encolhe pra 1 batida. */
const WALK_DAY = 'soccermon:walkout-day';

/**
 * Walkout em 3 batidas (menus-fc-e-aclamados.md, direção B; só pra ouro 75+ e edição, quem escolhe é `walkoutIndex`):
 * a tela pinta na cor do tipo e o ícone bate, a placa da posição entra na diagonal, a insígnia do ginásio do tipo, e
 * a carta sobe com luz atrás e o grito. Cada toque adianta uma batida; "Pular" vai direto pro fim (`onDone`). Do 2º
 * walkout do dia em diante, 1 batida (o ícone na cor do tipo) e a carta; com Reduzir movimento, só a carta.
 */
export function Walkout({ inst, onDone }: { inst: PokemonInstance; onDone: () => void }) {
    const { t, d } = useT();
    const view = viewInstance(inst);
    const type = cardTypeOf(inst);
    const badge = BADGE_OF[type];
    const [today] = useState(() => dayNumber(new Date()));
    const [steps] = useState(() => (reduceMotionOn() ? 0 : walkoutBeats(readCount(WALK_DAY), today)));
    // grava depois (o StrictMode chama o useState duas vezes: gravar lá faria o 1º do dia nascer encolhido)
    useEffect(() => writeCount(WALK_DAY, today), [today]);
    // 0..steps-1 = batidas; steps = a carta
    const [beat, setBeat] = useState(0);
    const card = beat >= steps;
    useEffect(() => {
        if (card) {
            playSfx('goal');
            playCry(inst.speciesId, useGame.getState().settings.cries, 0.8);
            return;
        }
        // tum, tum, TUM: cada batida um pouco mais aguda
        playSfx('kick', 1 + beat * 0.15);
        const id = window.setTimeout(() => setBeat((b) => b + 1), WALK_BEAT_MS);
        return () => clearTimeout(id);
    }, [beat, card, inst.speciesId]);
    return (
        <MomentStage
            label={view.displayName}
            onSkip={onDone}
            className={`k-walk${card ? ' is-card' : ''}`}
            style={{ '--tc': TYPE_COLOR[type] ?? 'var(--blue)' } as CSSProperties}
        >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar adianta a batida; no teclado, Pular e Continuar fazem o mesmo */}
            <div className="k-walk-tap" onClick={() => (card ? onDone() : setBeat(beat + 1))}>
                {!card && (
                    <>
                        <span className="k-walk-type k-pop">
                            <TypeIcon type={type} size={96} />
                        </span>
                        {beat >= 1 && <span className="k-walk-pos">{d.common.pos[view.naturalPosition]}</span>}
                        {beat >= 2 && (
                            <span className="k-walk-badge k-pop">
                                {badge ? <KantoBadge leader={badge} earned /> : <b>Kanto</b>}
                            </span>
                        )}
                    </>
                )}
                {card && (
                    <span className="k-walk-card">
                        <i className="k-walk-light" aria-hidden />
                        <FutCard inst={inst} />
                    </span>
                )}
            </div>
            {card ? (
                <button type="button" className="btn confirm big k-walk-go" onClick={onDone}>
                    {t('common.ui.continue')}
                </button>
            ) : (
                <p className="k-walk-dots" aria-hidden>
                    {t('common.ui.tapToContinue')}
                    {Array.from({ length: steps }, (_, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: as bolinhas são as batidas
                        <i key={i} className={i <= beat ? 'on' : ''} />
                    ))}
                </p>
            )}
        </MomentStage>
    );
}
