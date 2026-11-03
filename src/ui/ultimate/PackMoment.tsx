import { type CSSProperties, type PointerEvent, useRef, useState } from 'react';
import { walkoutPick } from '../../game/walkout-plan';
import { useT } from '../../i18n/react';
import type { PackKind, PackOpen } from '../../store/ultimate/ultimate';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { FutCard } from '../components/FutCard';
import { MomentStage } from '../kit/MomentStage';
import { Walkout } from '../kit/WalkoutStage';

/** Quanto o dedo anda (fração da largura do pacote) pra rasgar a tampa. */
const TEAR_AT = 0.4;
/** Até aqui é toque, não arrasto (px). */
const TAP_SLOP = 8;

/**
 * Rasgar com o dedo (menus-fc-e-aclamados.md, direção B): arrastar de lado na frente do pacote fechado puxa a tampa
 * (`--tear` 0..1) e, passando de TEAR_AT, abre. O toque simples e o teclado (Enter no botão do pacote) abrem como
 * sempre: o arrasto só prende o ponteiro depois de TAP_SLOP, então o toque chega no botão.
 */
function useTear() {
    const ref = useRef<HTMLDivElement>(null);
    const from = useRef<number | null>(null);
    const [p, setP] = useState(0);
    const closed = () => !!ref.current?.querySelector('.cpack-stage.is-closed');
    const end = () => {
        from.current = null;
        setP(0);
    };
    return {
        p,
        props: {
            ref,
            onPointerDown: (e: PointerEvent) => {
                if (closed()) from.current = e.clientX;
            },
            onPointerMove: (e: PointerEvent) => {
                const el = ref.current;
                if (from.current === null || !el) return;
                const dx = Math.abs(e.clientX - from.current);
                if (dx < TAP_SLOP) return;
                if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
                const q = Math.min(1, dx / (el.getBoundingClientRect().width * TEAR_AT));
                setP(q);
                if (q >= 1) {
                    end();
                    el.querySelector<HTMLButtonElement>('.cpack-btn')?.click();
                }
            },
            onPointerUp: end,
            onPointerCancel: end,
        },
    };
}

/**
 * Pacote do Time Ultimate em tela cheia: rasga (arrasto ou toque), as cartas saem em leque e a melhor, se for ouro
 * (75+) ou edição, fica guardada pro walkout do nível dela depois do leque (com Pular). As novas já estão no Clube e
 * as repetidas nos Pendentes (openPack); "Guardar" só fecha.
 */
export function UtPackMoment({ open, onClose }: { open: PackOpen & { kind: PackKind }; onClose: () => void }) {
    const { t } = useT();
    const label = open.kind === 'big' ? t('ultimate.packs.big') : t('ultimate.packs.mini');
    const walkAt = walkoutPick(open.cards);
    // 'wait' = guardada até o leque acabar; 'on' = o walkout tocando; 'done' = já na mesa
    const [walk, setWalk] = useState<'wait' | 'on' | 'done'>(walkAt < 0 ? 'done' : 'wait');
    const [revealed, setRevealed] = useState(false);
    const tear = useTear();
    return (
        <MomentStage label={label} className="ut-pack-moment">
            <h2 className="k-moment-title ut-pack-title">{label}</h2>
            <div className="ut-tear" {...tear.props} style={{ '--tear': tear.p } as CSSProperties}>
                <CardPack
                    sealed
                    look={packLookOf(open.cards)}
                    label={label}
                    revealKey={open.cards.map((c) => c.uid).join()}
                    onRevealed={() => {
                        setRevealed(true);
                        setWalk((w) => (w === 'wait' ? 'on' : w));
                    }}
                >
                    <div className="k-pick3 ut-pick" style={{ '--k-n': open.cards.length } as CSSProperties}>
                        {open.cards.map((c, i) => (
                            <div
                                key={c.uid}
                                // a carta do walkout não grita nem brilha no leque: o momento dela vem depois
                                data-cry={i === walkAt ? undefined : c.speciesId}
                                className={`cpack-card${i !== walkAt && isBigCard(c) ? ' big' : ''}${
                                    i === walkAt ? (walk === 'done' ? ' k-pop' : ' walk-held') : ''
                                }`}
                            >
                                <FutCard
                                    inst={c}
                                    ribbon={open.repeat[i] ? t('ultimate.packs.repeat') : t('ultimate.packs.fresh')}
                                />
                            </div>
                        ))}
                    </div>
                </CardPack>
            </div>
            {revealed ? (
                <button type="button" className="btn confirm big ut-pack-keep" onClick={onClose}>
                    {t('ultimate.packs.keep')}
                </button>
            ) : (
                <p className="ut-tear-hint">{t('ultimate.packs.tear')}</p>
            )}
            {walk === 'on' && <Walkout inst={open.cards[walkAt]} onDone={() => setWalk('done')} />}
        </MomentStage>
    );
}
