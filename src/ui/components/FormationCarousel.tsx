import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { FORMATIONS, type FormationId, hasEdge } from '../../engine/formations';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import { stepIndex } from '../kit/beats';
import { InfoSheet } from '../kit/controls';
import { FormationIdentity } from './FormationIdentity';
import { HudIcon } from './MatchHud';
import '../draft.css';

const IDS = Object.keys(FORMATIONS) as FormationId[];
/** Arrasto que troca de quadra (px); menos que isso é toque. */
const SWIPE = 40;

/** Desenho da formação (bolinhas nas posições da UI). */
export function FormationDiagram({ id }: { id: FormationId }) {
    const f = FORMATIONS[id];
    return (
        <svg viewBox="0 0 60 80" className="formation-diagram" aria-hidden>
            <rect x="1" y="1" width="58" height="78" rx="3" />
            <line x1="1" y1="40" x2="59" y2="40" />
            <circle className="fd-ring" cx="30" cy="40" r="8" />
            <path className="fd-ring" d="M18 1a12 10 0 0 0 24 0M18 79a12 10 0 0 1 24 0" />
            {f.ui.map(([x, y], i) => (
                <circle
                    key={`${x}-${y}`}
                    className="fd-dot"
                    style={{ '--k': i } as CSSProperties}
                    cx={(x / 100) * 60}
                    cy={(y / 100) * 80}
                    r={i === 0 ? 3.4 : 4.2}
                />
            ))}
        </svg>
    );
}

/**
 * Escolha da formação em carrossel (cara-de-jogo.md, decisão 10): uma quadra grande por vez, as vizinhas menores dos
 * lados (no PC a fileira inteira em leque). Nome na placa e as 3 palavras; a frase e as posições no "?". Troca com as
 * setas, arrastando, tocando na vizinha ou com as setas do teclado. Quem escolhe é o botão do polegar (fora daqui).
 */
export function FormationCarousel({
    value,
    onChange,
    edgeAgainst,
}: {
    value: FormationId;
    onChange: (id: FormationId) => void;
    /** Formação do rival (escalação): o selo "Vantagem tática" na quadra que encaixa. */
    edgeAgainst?: FormationId;
}) {
    const { t, d, lang } = useT();
    const i = Math.max(0, IDS.indexOf(value));
    const go = (dir: -1 | 1) => onChange(IDS[stepIndex(i, dir, IDS.length, true)]);
    const [drag, setDrag] = useState<number | null>(null);
    const start = useRef<{ x: number; id: number } | null>(null);
    const moved = useRef(false);
    const text = formationText(value, lang);

    // setas do teclado também sem foco no carrossel (só nesta tela; com outra sheet aberta por cima, não)
    const root = useRef<HTMLDivElement>(null);
    const goRef = useRef(go);
    goRef.current = go;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.defaultPrevented || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
            const sheet = [...document.querySelectorAll('.k-sheet')].at(-1);
            if (
                (sheet && !sheet.contains(root.current)) ||
                (e.target as HTMLElement)?.closest?.('input, textarea, select')
            )
                return;
            e.preventDefault();
            goRef.current(e.key === 'ArrowLeft' ? -1 : 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const end = () => {
        const dx = drag ?? 0;
        start.current = null;
        setDrag(null);
        if (Math.abs(dx) >= SWIPE) go(dx < 0 ? 1 : -1);
    };

    return (
        <div className="fc" ref={root}>
            {/* biome-ignore lint/a11y/useSemanticElements: carrossel (setas + quadras); fieldset traria estilo de formulário */}
            <div
                className={`fc-stage${drag !== null ? ' dragging' : ''}`}
                role="group"
                aria-roledescription={d.help.onboarding.carousel}
                aria-label={t('team.draft.chooseFormation')}
            >
                <button type="button" className="fc-arrow prev" aria-label={t('common.ui.prev')} onClick={() => go(-1)}>
                    <HudIcon kind="prev" />
                </button>
                <div
                    className="fc-view"
                    onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        start.current = { x: e.clientX, id: e.pointerId };
                        moved.current = false;
                    }}
                    onPointerMove={(e) => {
                        const s = start.current;
                        if (!s || s.id !== e.pointerId) return;
                        const dx = e.clientX - s.x;
                        if (!moved.current && Math.abs(dx) < 6) return;
                        if (!moved.current) e.currentTarget.setPointerCapture(e.pointerId);
                        moved.current = true;
                        setDrag(dx);
                    }}
                    onPointerUp={end}
                    onPointerCancel={end}
                    // arrastou: o soltar não conta como toque na quadra vizinha
                    onClickCapture={(e) => {
                        if (moved.current) {
                            e.stopPropagation();
                            moved.current = false;
                        }
                    }}
                >
                    <div className="fc-track" style={{ '--i': i, '--drag': `${drag ?? 0}px` } as CSSProperties}>
                        {IDS.map((id, k) => (
                            <button
                                key={id}
                                type="button"
                                className={`fc-court${k === i ? ' on' : ''}`}
                                tabIndex={-1}
                                aria-hidden={k !== i}
                                aria-label={formationText(id, lang).name}
                                onClick={() => k !== i && onChange(id)}
                            >
                                <FormationDiagram id={id} />
                            </button>
                        ))}
                    </div>
                </div>
                <button type="button" className="fc-arrow next" aria-label={t('common.ui.next')} onClick={() => go(1)}>
                    <HudIcon kind="next" />
                </button>
            </div>
            {/* a chave nova faz a placa entrar de novo (nada teleporta) */}
            <div className="fc-plaque" key={value} aria-live="polite">
                <b className="fc-name">{text.name}</b>
                <InfoSheet title={text.name}>
                    <p>{text.description}</p>
                    <p className="muted">{FORMATIONS[value].slots.map((s) => d.common.pos[s]).join(' · ')}</p>
                </InfoSheet>
            </div>
            <FormationIdentity id={value} edge={!!edgeAgainst && hasEdge(value, edgeAgainst)} />
            <div className="fc-dots" aria-hidden>
                {IDS.map((id, k) => (
                    <i key={id} className={k === i ? 'on' : ''} />
                ))}
            </div>
        </div>
    );
}
