import { type CSSProperties, useEffect, useState } from 'react';
import { viewInstance } from '../../engine/instance';
import { walkoutPick } from '../../game/walkout-plan';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import type { TrainerId } from '../../store/missions';
import { utNow } from '../../store/ultimate/clock';
import { pickOptions, type UtPick } from '../../store/ultimate/ultimate';
import { CardPack, type PackLook } from '../components/CardPack';
import { FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { MomentStage } from '../kit/MomentStage';
import { preloadWalkout, Walkout } from '../kit/WalkoutStage';
import { METAL, metalLabel } from '../rarity';

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

/** A arte do pacote do Pick: dourada no de Ouro, holográfica no de Evento, na cor do tipo no do líder. */
const lookOf = (p: UtPick): PackLook => (p.event ? 'special' : p.min === 'ouro' ? 'gold' : '');

/**
 * Pokémon Pick em tela cheia (ultimate-fc.md, decidido em 09/11): rasga o pacote do Pick e as opções nascem como
 * silhueta ("Quem é esse Pokémon?"); tocar vira uma, "Virar todas" vira o resto, e a melhor (se for Ouro ou edição)
 * vira com o walkout. "Ficar com" acende quando todas viraram e uma foi escolhida; as outras somem.
 */
export function UtPickMoment({ pick, onClose }: { pick: UtPick; onClose: () => void }) {
    const { t } = useT();
    const name = usePickName();
    // as opções do momento em que abriu (mesma semente: fechar e voltar dá as mesmas)
    const [opts] = useState(() => pickOptions(useGame.getState().ultimate, pick, utNow()));
    const [open, setOpen] = useState(false);
    const [up, setUp] = useState<boolean[]>(() => opts.map(() => false));
    const [sel, setSel] = useState<number | null>(null);
    const best = walkoutPick(opts);
    const [walk, setWalk] = useState<'idle' | 'on' | 'done'>('idle');
    useEffect(() => {
        if (best >= 0) void preloadWalkout().catch(() => undefined);
    }, [best]);
    const flip = (ids: number[]) => {
        setUp((u) => u.map((x, i) => x || ids.includes(i)));
        if (ids.includes(best) && walk === 'idle') setWalk('on');
    };
    const all = up.every(Boolean);
    const chosen = sel === null ? null : opts[sel];
    const label = name(pick);
    return (
        <MomentStage label={label.title} className="ut-pick-moment">
            <h2 className="k-moment-title ut-pack-title">{label.title}</h2>
            <p className="ut-pick-sub">{label.hint}</p>
            <div className="ut-tear">
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
                            <div key={c.uid} className={`cpack-card ut-pick-opt${sel === i ? ' on' : ''}`}>
                                {up[i] ? (
                                    <div className={`ut-flip${i === best && walk !== 'done' ? ' walk-held' : ''}`}>
                                        <FutCard
                                            inst={c}
                                            selected={sel === i}
                                            action={{
                                                label:
                                                    sel === i ? t('ultimate.pick.chosen') : t('ultimate.pick.choose'),
                                                primary: sel === i,
                                                onClick: () => setSel(i),
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="ut-pick-back"
                                        style={{ '--mc': METAL[pick.min].color } as CSSProperties}
                                        onClick={() => flip([i])}
                                        aria-label={t('ultimate.pick.flip')}
                                    >
                                        <img className="pixel" src={cardSprite({ ...c, shiny: false })} alt="" />
                                        <b aria-hidden>?</b>
                                    </button>
                                )}
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
                    <small className="muted">{all ? t('ultimate.pick.rest') : t('ultimate.walkout.who')}</small>
                </div>
            )}
            {walk === 'on' && <Walkout inst={opts[best]} onDone={() => setWalk('done')} />}
        </MomentStage>
    );
}
