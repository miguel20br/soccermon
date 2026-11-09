import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { playCry, playSfx } from '../../game/audio';
import { walkoutPick } from '../../game/walkout-plan';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { utNow } from '../../store/ultimate/clock';
import { pickOptions, type UtPick } from '../../store/ultimate/ultimate';
import { CardPack, isBigCard, type PackLook, pitchOf } from '../components/CardPack';
import { FutCard } from '../components/FutCard';
import { MomentStage } from '../kit/MomentStage';
import { preloadWalkout, Walkout } from '../kit/WalkoutStage';
import { METAL, metalLabel } from '../rarity';
import { reduceMotionOn } from '../reduce-motion';
import { useTear } from './PackMoment';

/** Nome e regra do Pick ("Seu primeiro craque" · "Escolha 1 de 5 · Prata ou melhor"), na tela e em Meus pacotes. */
export function usePickName() {
    const { t, d } = useT();
    return (p: UtPick) => {
        const title =
            p.from === 'start'
                ? t('ultimate.pick.start')
                : p.from === 'gym'
                  ? t('ultimate.pick.gym', { name: d.profile.trainers[p.ref as TrainerId] ?? p.ref })
                  : p.from === 'event'
                    ? t('ultimate.pick.event', { name: d.ultimate.events[p.ref] ?? p.ref })
                    : p.from === 'pass'
                      ? t('ultimate.pick.gold')
                      : t('ultimate.pick.metal', { metal: metalLabel(p.min) });
        const rule = p.event
            ? t('ultimate.pick.ruleEvent', { metal: metalLabel(p.min) })
            : p.exact
              ? metalLabel(p.min)
              : t('ultimate.pick.ruleMin', { metal: metalLabel(p.min) });
        const hint = [t('ultimate.pick.of', { n: p.n }), rule, p.type ? typeName(p.type) : '']
            .filter(Boolean)
            .join(' · ');
        return { title, hint };
    };
}

/** O verso da carta: o símbolo do Soccermon no fundo escuro, na moldura do metal (Pick e arte do Draft). */
export function CardBack({ metal }: { metal?: string }) {
    return (
        <span className="ut-cardback" style={metal ? ({ '--mc': metal } as CSSProperties) : undefined}>
            <img src="assets/ui/simbolo.svg" alt="" />
        </span>
    );
}

/** A arte do pacote do Pick: dourada no de Ouro, holográfica no de Evento, na cor do tipo no do líder. */
const lookOf = (p: UtPick): PackLook => (p.event ? 'special' : p.min === 'ouro' ? 'gold' : '');

/** Entre uma carta e a próxima no "Virar todas" (ms): o intervalo do leque de sempre (`TIMING.full` do CardPack). */
const FLIP_STEP = 220;
/** O verso dobra (ms) e a frente entra com a saída de carta de sempre (`cpack-out`, 460 ms). */
const FOLD_MS = 120;
const OUT_MS = 460;

/**
 * Pokémon Pick em tela cheia (ultimate-fc.md, decidido em 09/11): rasga o pacote do Pick e as opções nascem de costas
 * (o verso com o símbolo do Soccermon, retorno de 09/11: "a carta virada, não a silhueta"); tocar vira uma, "Virar
 * todas" vira o resto em sequência, e a melhor (se for Ouro ou edição) vira com o walkout. As animações são as de sempre
 * (retorno de 09/11): o rasgo com o dedo, o leque de versos, a frente entrando com a saída de carta do pacote e o som
 * dele, e o walkout depois que a sequência acaba, com a carta guardada até lá. "Ficar com" acende quando
 * todas viraram e uma foi escolhida; as outras somem.
 */
export function UtPickMoment({ pick, onClose }: { pick: UtPick; onClose: () => void }) {
    const { t } = useT();
    const name = usePickName();
    // as opções do momento em que abriu (mesma semente: fechar e voltar dá as mesmas)
    const [opts] = useState(() => pickOptions(useGame.getState().ultimate, pick, utNow()));
    const [open, setOpen] = useState(false);
    /** Virada de cada carta: -1 de costas; senão a vez dela na sequência (o atraso do giro). */
    const [up, setUp] = useState<number[]>(() => opts.map(() => -1));
    const [sel, setSel] = useState<number | null>(null);
    const best = walkoutPick(opts);
    const [walk, setWalk] = useState<'idle' | 'wait' | 'on' | 'done'>('idle');
    useEffect(() => {
        if (best >= 0) void preloadWalkout().catch(() => undefined);
    }, [best]);
    const timers = useRef<number[]>([]);
    useEffect(() => () => timers.current.forEach(clearTimeout), []);
    /** Vira as cartas em sequência com o som do leque (tom subindo, grito da carta grande); o walkout vem no fim. */
    const flip = (ids: number[]) => {
        const todo = ids.filter((i) => up[i] < 0);
        if (!todo.length) return;
        setUp((u) => u.map((x, i) => (x < 0 && todo.includes(i) ? todo.indexOf(i) : x)));
        const settings = useGame.getState().settings;
        const reduce = reduceMotionOn();
        todo.forEach((i, k) => {
            const at = reduce ? 0 : k * FLIP_STEP + FOLD_MS;
            const n = opts.length - up.filter((x) => x < 0).length + k;
            timers.current.push(
                window.setTimeout(() => {
                    playSfx(i === best ? 'goal' : 'select', i === best ? 1 : pitchOf(n));
                    if (i !== best && isBigCard(opts[i])) playCry(opts[i].speciesId, settings.cries, 0.8);
                }, at),
            );
        });
        // como no pacote: a melhor fica guardada até o leque acabar, e aí o walkout
        if (todo.includes(best) && walk === 'idle') {
            setWalk('wait');
            const end = reduce ? 0 : (todo.length - 1) * FLIP_STEP + FOLD_MS + OUT_MS;
            timers.current.push(window.setTimeout(() => setWalk('on'), end));
        }
    };
    const all = up.every((x) => x >= 0);
    const tear = useTear();
    const chosen = sel === null ? null : opts[sel];
    const label = name(pick);
    return (
        <MomentStage label={label.title} className="ut-pick-moment">
            <h2 className="k-moment-title ut-pack-title">{label.title}</h2>
            <p className="ut-pick-sub">{label.hint}</p>
            <div className="ut-tear" {...tear.props} style={{ '--tear': tear.p } as CSSProperties}>
                <CardPack
                    sealed
                    look={lookOf(pick)}
                    type={pick.type}
                    label={label.title}
                    revealKey={pick.uid}
                    onRevealed={() => setOpen(true)}
                >
                    <div className="k-pick3 ut-pick" style={{ '--k-n': opts.length } as CSSProperties}>
                        {opts.map((c, i) => (
                            <div
                                key={c.uid}
                                className={`cpack-card ut-pick-opt${sel === i ? ' on' : ''}${
                                    i === best && walk === 'done' ? ' k-pop' : ''
                                }`}
                            >
                                {/* de costas: o verso com o símbolo; virada, as duas faces giram juntas (a frente por cima) */}
                                <div
                                    className={`ut-pick-face${up[i] >= 0 ? ' up' : ''}`}
                                    style={{ '--flip-at': `${Math.max(0, up[i]) * FLIP_STEP}ms` } as CSSProperties}
                                >
                                    <button
                                        type="button"
                                        className="ut-pick-back"
                                        disabled={up[i] >= 0}
                                        onClick={() => flip([i])}
                                        aria-label={t('ultimate.pick.flip')}
                                    >
                                        <CardBack metal={METAL[pick.min].color} />
                                    </button>
                                    {up[i] >= 0 && (
                                        <div
                                            className={`ut-pick-flip${
                                                i === best
                                                    ? walk !== 'done'
                                                        ? ' walk-held'
                                                        : ''
                                                    : isBigCard(c)
                                                      ? ' big'
                                                      : ''
                                            }`}
                                        >
                                            <FutCard
                                                inst={c}
                                                selected={sel === i}
                                                action={{
                                                    label:
                                                        sel === i
                                                            ? t('ultimate.pick.chosen')
                                                            : t('ultimate.pick.choose'),
                                                    primary: sel === i,
                                                    onClick: () => setSel(i),
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardPack>
            </div>
            {open && (
                <div className="ut-pack-acts">
                    {all ? (
                        <button
                            type="button"
                            className="btn confirm big"
                            disabled={!chosen}
                            onClick={() => {
                                if (!chosen) return;
                                useGame.getState().ultimateChoosePick(pick.uid, chosen.uid);
                                onClose();
                            }}
                        >
                            {chosen
                                ? t('ultimate.pick.keep', {
                                      name: viewInstance(chosen).displayName,
                                      n: viewInstance(chosen).overall,
                                  })
                                : t('ultimate.pick.tapOne')}
                        </button>
                    ) : (
                        <button type="button" className="btn ut-pick-all" onClick={() => flip(opts.map((_, i) => i))}>
                            {t('ultimate.pick.flipAll')}
                        </button>
                    )}
                    <small className="muted">{all ? t('ultimate.pick.rest') : t('ultimate.pick.tapFlip')}</small>
                </div>
            )}
            {walk === 'on' && <Walkout inst={opts[best]} onDone={() => setWalk('done')} />}
        </MomentStage>
    );
}
