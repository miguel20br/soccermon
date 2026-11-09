import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { walkoutLast } from '../../game/walkout-plan';
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
export function useTear() {
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

/** Abrir todos: a pausa entre um pacote e o próximo (ms); o rasgo e o leque de cada um são os de sempre. */
const PACK_GAP = 450;

/**
 * Pacote do Time Ultimate em tela cheia: rasga (arrasto ou toque), as cartas saem em leque e a melhor, se for ouro
 * (75+) ou edição, fica guardada pro walkout do nível dela depois do leque (com Pular). As novas já estão no Clube e
 * as repetidas nos Pendentes (openPack); "Guardar" só fecha. Abrir todos (retorno de 09/11: "as animações
 * originais"): o mesmo pacote de sempre, um depois do outro. Você rasga o 1º, os outros rasgam sozinhos com o leque
 * inteiro; o walkout toca uma vez, pra melhor de todas, no pacote dela (que fica por último). Depois, o resumo pela nota.
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
    const all = open.packs.flatMap((p) => p.cards.map((c, i) => ({ c, repeat: p.repeat[i] })));
    const { packs, best } = walkoutLast(open.packs);
    const [at, setAt] = useState(0);
    const pack = packs[at];
    const cards = pack.cards.map((c, i) => ({ c, repeat: pack.repeat[i] }));
    const walkHere = best ? pack.cards.indexOf(best) : -1;
    // 'wait' = guardada até o leque do pacote dela acabar; 'on' = o walkout tocando; 'done' = já na mesa
    const [walk, setWalk] = useState<'wait' | 'on' | 'done'>(best ? 'wait' : 'done');
    useEffect(() => {
        if (best) void preloadWalkout().catch(() => undefined);
    }, [best]);
    const [revealed, setRevealed] = useState(false);
    /** Abrir todos: todos os pacotes abertos, no resumo. */
    const [sum, setSum] = useState(false);
    // Abrir todos: leque (e walkout, no pacote dele) acabou, o próximo pacote rasga sozinho
    useEffect(() => {
        if (!many || sum || !revealed || (walkHere >= 0 && walk !== 'done')) return;
        const id = window.setTimeout(() => {
            if (at < packs.length - 1) {
                setAt(at + 1);
                setRevealed(false);
            } else setSum(true);
        }, PACK_GAP);
        return () => clearTimeout(id);
    }, [many, sum, revealed, walk, walkHere, at, packs.length]);
    const skip = () => {
        setSum(true);
        setWalk((w) => (w === 'wait' ? 'on' : w));
    };
    const tear = useTear();
    const sorted = [...all].sort((a, b) => viewInstance(b.c).overall - viewInstance(a.c).overall);
    const repeats = all.filter((x) => x.repeat).length;
    if (sum)
        return (
            <MomentStage label={label} className="ut-pack-moment is-many">
                <h2 className="k-moment-title ut-pack-title">
                    {t('ultimate.stack.summary', { n: open.packs.length })}
                </h2>
                <p className="ut-sum-line k-pop">
                    <HudIcon kind="sparkle" />
                    {tn('ultimate.stack.sumFresh', all.length - repeats)}
                    {repeats > 0 && ` · ${tn('ultimate.stack.sumRepeat', repeats)}`}
                    {` · ${t('ultimate.stack.sumPoints', { n: open.packs.length * OPEN_POINTS })}`}
                </p>
                <div className="k-pick3 ut-sum">
                    {sorted.map(({ c, repeat }) => (
                        <div key={c.uid} className="cpack-card">
                            <FutCard
                                inst={c}
                                ribbon={repeat ? t('ultimate.packs.repeat') : t('ultimate.packs.fresh')}
                            />
                        </div>
                    ))}
                </div>
                {open.full && <p className="ut-sum-full">{t('ultimate.stack.full')}</p>}
                <div className="ut-pack-acts">
                    <button type="button" className="btn confirm big ut-pack-keep" onClick={onClose}>
                        {t('ultimate.packs.keep')}
                    </button>
                    {repeats > 0 && (
                        <button type="button" className="btn ghost" onClick={onPending}>
                            {t('ultimate.stack.toPending', { n: repeats })}
                        </button>
                    )}
                </div>
                {walk === 'on' && best && <Walkout inst={best} onDone={() => setWalk('done')} />}
            </MomentStage>
        );
    return (
        <MomentStage label={label} className="ut-pack-moment">
            <h2 className="k-moment-title ut-pack-title">
                {label}
                {many && <small className="ut-pack-count"> {`${at + 1}/${packs.length}`}</small>}
            </h2>
            <div className="ut-tear" {...tear.props} style={{ '--tear': tear.p } as CSSProperties}>
                <CardPack
                    key={at}
                    sealed
                    autoOpen={at > 0}
                    look={packLookOf(pack.cards)}
                    label={one}
                    revealKey={pack.cards.map((c) => c.uid).join()}
                    onRevealed={() => {
                        setRevealed(true);
                        if (walkHere >= 0) setWalk((w) => (w === 'wait' ? 'on' : w));
                    }}
                >
                    <div className="k-pick3 ut-pick" style={{ '--k-n': cards.length } as CSSProperties}>
                        {cards.map(({ c, repeat }, i) => (
                            <div
                                key={c.uid}
                                // a carta do walkout não grita nem brilha no leque: o momento dela vem depois
                                data-cry={i === walkHere ? undefined : c.speciesId}
                                className={`cpack-card${i !== walkHere && isBigCard(c) ? ' big' : ''}${
                                    i === walkHere ? (walk === 'done' ? ' k-pop' : ' walk-held') : ''
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
            {many ? (
                <div className="ut-pack-acts">
                    {at === 0 && !revealed && <p className="ut-tear-hint">{t('ultimate.packs.tear')}</p>}
                    <button type="button" className="btn ghost small" onClick={skip}>
                        {t('ultimate.stack.skipAll')}
                    </button>
                </div>
            ) : revealed ? (
                <div className="ut-pack-acts">
                    {open.full && <p className="ut-sum-full">{t('ultimate.stack.full')}</p>}
                    <button type="button" className="btn confirm big ut-pack-keep" onClick={onClose}>
                        {t('ultimate.packs.keep')}
                    </button>
                </div>
            ) : (
                <p className="ut-tear-hint">{t('ultimate.packs.tear')}</p>
            )}
            {walk === 'on' && best && <Walkout inst={best} onDone={() => setWalk('done')} />}
        </MomentStage>
    );
}
