import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { walkoutPick } from '../../game/walkout-plan';
import { useT } from '../../i18n/react';
import { OPEN_POINTS } from '../../store/ultimate/rules';
import type { PackKind, PackOpen } from '../../store/ultimate/ultimate';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MomentStage } from '../kit/MomentStage';
import { preloadWalkout, Walkout } from '../kit/WalkoutStage';

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

/** O que a Loja abriu: um pacote, ou vários do mesmo tipo (Abrir todos); `full` = parou nos Pendentes cheios. */
export type UtOpened = { packs: PackOpen[]; kind: PackKind; full: boolean };

/**
 * Pacote do Time Ultimate em tela cheia: rasga (arrasto ou toque), as cartas saem em leque e a melhor, se for ouro
 * (75+) ou edição, fica guardada pro walkout do nível dela depois do leque (com Pular). As novas já estão no Clube e
 * as repetidas nos Pendentes (openPack); "Guardar" só fecha. Abrir todos (ultimate-fc.md): um rasgo só, o leque rápido
 * de todas as cartas pela nota, um walkout só (o da melhor de todas) e o resumo, como a lista de itens do FC.
 */
export function UtPackMoment({
    open,
    onClose,
    onPending,
}: {
    open: UtOpened;
    onClose: () => void;
    onPending: () => void;
}) {
    const { t, tn } = useT();
    const many = open.packs.length > 1;
    const one = open.kind === 'big' ? t('ultimate.packs.big') : t('ultimate.packs.mini');
    const label = many ? t('ultimate.stack.many', { n: open.packs.length, kind: one }) : one;
    // todas as cartas, pela nota (no Abrir todos); um pacote só fica na ordem dele
    const all = open.packs.flatMap((p) => p.cards.map((c, i) => ({ c, repeat: p.repeat[i] })));
    const cards = many ? [...all].sort((a, b) => viewInstance(b.c).overall - viewInstance(a.c).overall) : all;
    const walkAt = walkoutPick(cards.map((x) => x.c));
    // 'wait' = guardada até o leque acabar; 'on' = o walkout tocando; 'done' = já na mesa
    const [walk, setWalk] = useState<'wait' | 'on' | 'done'>(walkAt < 0 ? 'done' : 'wait');
    useEffect(() => {
        if (walkAt >= 0) void preloadWalkout().catch(() => undefined);
    }, [walkAt]);
    const [revealed, setRevealed] = useState(false);
    const tear = useTear();
    const repeats = cards.filter((x) => x.repeat).length;
    return (
        <MomentStage label={label} className={`ut-pack-moment${many ? ' is-many' : ''}`}>
            <h2 className="k-moment-title ut-pack-title">
                {revealed && many ? t('ultimate.stack.summary', { n: open.packs.length }) : label}
            </h2>
            {revealed && many && (
                <p className="ut-sum-line k-pop">
                    <HudIcon kind="sparkle" />
                    {tn('ultimate.stack.sumFresh', cards.length - repeats)}
                    {repeats > 0 && ` · ${tn('ultimate.stack.sumRepeat', repeats)}`}
                    {` · ${t('ultimate.stack.sumPoints', { n: open.packs.length * OPEN_POINTS })}`}
                </p>
            )}
            <div className="ut-tear" {...tear.props} style={{ '--tear': tear.p } as CSSProperties}>
                <CardPack
                    sealed
                    fast={many}
                    look={packLookOf(cards.map((x) => x.c))}
                    label={one}
                    revealKey={cards.map((x) => x.c.uid).join()}
                    onRevealed={() => {
                        setRevealed(true);
                        setWalk((w) => (w === 'wait' ? 'on' : w));
                    }}
                >
                    <div
                        className={`k-pick3 ${many ? 'ut-sum' : 'ut-pick'}`}
                        style={{ '--k-n': cards.length } as CSSProperties}
                    >
                        {cards.map(({ c, repeat }, i) => (
                            <div
                                key={c.uid}
                                // a carta do walkout não grita nem brilha no leque: o momento dela vem depois
                                data-cry={i === walkAt ? undefined : c.speciesId}
                                className={`cpack-card${i !== walkAt && isBigCard(c) && !many ? ' big' : ''}${
                                    i === walkAt ? (walk === 'done' ? ' k-pop' : ' walk-held') : ''
                                }`}
                            >
                                <FutCard
                                    inst={c}
                                    ribbon={repeat ? t('ultimate.packs.repeat') : t('ultimate.packs.fresh')}
                                />
                            </div>
                        ))}
                    </div>
                </CardPack>
            </div>
            {revealed && open.full && <p className="ut-sum-full">{t('ultimate.stack.full')}</p>}
            {revealed ? (
                <div className="ut-pack-acts">
                    <button type="button" className="btn confirm big ut-pack-keep" onClick={onClose}>
                        {t('ultimate.packs.keep')}
                    </button>
                    {many && repeats > 0 && (
                        <button type="button" className="btn ghost" onClick={onPending}>
                            {t('ultimate.stack.toPending', { n: repeats })}
                        </button>
                    )}
                </div>
            ) : (
                <p className="ut-tear-hint">{t('ultimate.packs.tear')}</p>
            )}
            {walk === 'on' && <Walkout inst={cards[walkAt].c} onDone={() => setWalk('done')} />}
        </MomentStage>
    );
}
