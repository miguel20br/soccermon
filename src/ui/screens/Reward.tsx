import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { MOVES, species } from '../../engine/data';
import { formationOf } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import type { Reward as RewardDef } from '../../engine/rewards';
import { editionOf } from '../../engine/specials';
import { playSfx } from '../../game/audio';
import { clubName, itemDesc, itemName, stageName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { useCardModal } from '../card-modal';
import { FormationBoard } from '../components/FormationBoard';
import { ExpandIcon, FutCard } from '../components/FutCard';
import { cardSprite } from '../components/PokeCard';
import { TmCard, TmTeachPanel } from '../components/TmTeach';
import { TypeIcon } from '../components/TypeIcon';
import { Tip } from '../help/Tip';
import { type ItemFit, itemFit } from '../item-fit';
import { readCount, writeCount } from '../local-count';
import { metalOf } from '../rarity';
import { TYPE_COLOR } from '../type-colors';

/** Quantas telas de recompensa a pessoa já abriu (neste navegador): da 7ª em diante, um toque revela tudo. */
const PACKS_KEY = 'soccermon-packs-opened';
const FAST_AFTER = 6;
/** Cada etapa da revelação (cor → silhueta → carta): ~900 ms no total, com a carta entrando. */
const STAGE_MS = 300;

const rewardKey = (r: RewardDef) => (r.kind === 'item' ? r.item : r.kind === 'tm' ? `tm-${r.move}` : r.inst.uid);
/** Shiny e edições especiais (Destaque, Ícone, Evento) entram com walkout. */
const isSpecial = (r: RewardDef) => r.kind === 'pokemon' && !!editionOf(r.inst);
/** O pacote fechado já dá uma pista (como o walkout do FIFA): edição especial brilha, carta ouro tem borda dourada. */
const packLook = (r: RewardDef) =>
    r.kind !== 'pokemon'
        ? ''
        : editionOf(r.inst)
          ? ' pack-special'
          : metalOf(viewInstance(r.inst).overall) === 'ouro'
            ? ' pack-gold'
            : '';
const packColor = (r: RewardDef) =>
    r.kind === 'pokemon'
        ? TYPE_COLOR[species(r.inst.speciesId).types[0]]
        : r.kind === 'tm'
          ? TYPE_COLOR[MOVES[r.move]?.type]
          : '#8a94b8';
const packShadow = (r: RewardDef) =>
    r.kind === 'pokemon' ? cardSprite(r.inst) : r.kind === 'item' ? itemSprite(r.item) : null;

/**
 * Recompensa como pacote fechado (desenhado em CSS). Aberto, revela em etapas: a cor do tipo, a silhueta e a
 * carta. Shiny e edição especial sobem com luz atrás (walkout, 1,2 s). `instant` pula as etapas.
 */
function Pack({
    reward,
    open,
    instant,
    onOpen,
    children,
}: {
    reward: RewardDef;
    open: boolean;
    instant: boolean;
    onOpen: () => void;
    children: ReactNode;
}) {
    const { t } = useT();
    const [stage, setStage] = useState(open ? 3 : 0);
    const [walk, setWalk] = useState(false);
    const special = isSpecial(reward);
    // biome-ignore lint/correctness/useExhaustiveDependencies: a sequência só depende de abrir (ou pular)
    useEffect(() => {
        if (!open) return;
        if (instant) {
            setStage(3);
            return;
        }
        setStage(1);
        const a = window.setTimeout(() => setStage(2), STAGE_MS);
        const b = window.setTimeout(() => {
            setStage(3);
            setWalk(special);
            playSfx(special ? 'goal' : 'select');
        }, STAGE_MS * 2);
        return () => {
            clearTimeout(a);
            clearTimeout(b);
        };
    }, [open, instant]);
    const shadow = packShadow(reward);
    return (
        <div
            className={`pack pack-s${stage}${walk ? ' walkout' : ''}${packLook(reward)}`}
            style={{ '--pc': packColor(reward) } as CSSProperties}
        >
            <div className="pack-card">{children}</div>
            {walk && <span className="pack-rays" aria-hidden />}
            {stage < 3 && (
                <button type="button" className="pack-face" onClick={onOpen} aria-label={t('reward.pack.open')}>
                    <span className="pack-foil" aria-hidden />
                    {stage >= 2 && shadow && <img className="pixel pack-shadow" src={shadow} alt="" />}
                    {stage === 0 && <span className="pack-hint">{t('reward.pack.tap')}</span>}
                </button>
            )}
        </div>
    );
}

/** Selo "quantos golpes este item aproveita": ícone do tipo (ou do item) + número; `full` mostra o texto. */
function FitBadge({ fit, item, text, full }: { fit: ItemFit; item: string; text: string; full?: boolean }) {
    return (
        <span className={`fit-badge${fit.count === 0 ? ' none' : ''}${full ? ' full' : ''}`} title={text}>
            {fit.type ? <TypeIcon type={fit.type} /> : <img className="pixel" src={itemSprite(item)} alt="" />}
            {full ? text : fit.count}
        </span>
    );
}

/**
 * Recompensa após vitória (estilo Slay the Spire): 1 de 3 — reforço para o banco, item ou MT do ginásio —,
 * ou pular e ganhar +1 reroll.
 */
export function Reward() {
    const { run, claimReward, skipReward, rerollReward } = useGame();
    const [chosen, setChosen] = useState<number | null>(null);
    const { lang, t, tn } = useT();
    // a festa encurta: da 7ª tela de recompensa em diante, um toque abre todos os pacotes de uma vez
    const [fast] = useState(() => (readCount(PACKS_KEY) ?? 0) >= FAST_AFTER);
    const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
    const [all, setAll] = useState(false);
    const counted = useRef(false);
    if (run?.status !== 'reward') return null;
    const countOpen = () => {
        if (counted.current) return;
        counted.current = true;
        writeCount(PACKS_KEY, (readCount(PACKS_KEY) ?? 0) + 1);
    };
    const openAll = () => {
        countOpen();
        setAll(true);
        playSfx(run.rewards.some((r) => isSpecial(r) && !opened.has(rewardKey(r))) ? 'goal' : 'select');
    };
    const openPack = (key: string) => {
        if (fast) return openAll();
        countOpen();
        playSfx('select');
        setOpened((s) => new Set(s).add(key));
    };
    const closed = all ? 0 : run.rewards.filter((r) => !opened.has(rewardKey(r))).length;

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const reward = chosen !== null ? run.rewards[chosen] : null;
    const squad = [...run.lineup, ...run.bench].map((u) => byUid.get(u)!).filter(Boolean);
    const targets =
        reward?.kind === 'pokemon'
            ? run.bench.map((u) => byUid.get(u)!).filter((p) => p && p.uid !== run.captainUid)
            : squad;
    const pick = (i: number) => {
        playSfx('select');
        setChosen(chosen === i ? null : i);
    };
    // item que depende dos golpes (tipo, King's Rock): quantos golpes de cada um ele aproveita
    const fitItem = reward?.kind === 'item' ? reward.item : null;
    const fitOf = (p: PokemonInstance) => (fitItem ? itemFit(fitItem, p) : null);
    const fitText = (f: ItemFit) =>
        f.type
            ? tn('reward.fit.typeCount', f.count, { type: typeName(f.type, lang) })
            : tn('reward.fit.hitCount', f.count);
    const sampleFit = fitItem && squad[0] ? fitOf(squad[0]) : null;
    const slots = formationOf(run.formation).slots;
    const openCard = useCardModal.getState().open;

    return (
        <>
            <div className="draft-head">
                <div>
                    <div className="muted">
                        {t('reward.nextStage', { stage: stageName(run.stage + 1, lang) || t('reward.cup') })}
                    </div>
                    <h1>
                        {reward
                            ? reward.kind === 'pokemon'
                                ? t('reward.whoLeaves')
                                : reward.kind === 'tm'
                                  ? t('reward.whoLearns')
                                  : t('reward.whoHolds')
                            : t('reward.choose')}
                    </h1>
                </div>
                <div className="row">
                    {closed > 0 && (
                        <button type="button" className="btn small primary" onClick={openAll}>
                            {t('reward.pack.revealAll')}
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn small"
                        disabled={run.rerolls <= 0}
                        onClick={() => {
                            playSfx('select');
                            rerollReward();
                            setChosen(null);
                        }}
                    >
                        {t('reward.reroll', { n: run.rerolls })}
                    </button>
                    <button type="button" className="btn small ghost" onClick={skipReward}>
                        {t('reward.skip')}
                    </button>
                </div>
            </div>

            <Tip id="reward-pick">{t('reward.tip')}</Tip>

            <div className="reward-grid">
                {run.rewards.map((r, i) => (
                    <Pack
                        key={rewardKey(r)}
                        reward={r}
                        open={all || opened.has(rewardKey(r))}
                        instant={all}
                        onOpen={() => openPack(rewardKey(r))}
                    >
                        <div className={`option${r.kind === 'tm' ? ' option-tm' : ''}`}>
                            {r.kind === 'pokemon' ? (
                                <FutCard
                                    inst={r.inst}
                                    selected={chosen === i}
                                    ribbon={
                                        r.from
                                            ? t('reward.fromClub', { club: clubName(r.from, lang) })
                                            : t('reward.reinforcement')
                                    }
                                    action={{
                                        label: t(
                                            chosen === i ? 'reward.chosen' : r.from ? 'reward.sign' : 'reward.pick',
                                        ),
                                        primary: true,
                                        onClick: () => {
                                            playSfx('select');
                                            setChosen(chosen === i ? null : i);
                                        },
                                    }}
                                />
                            ) : r.kind === 'tm' ? (
                                <TmCard
                                    move={r.move}
                                    leader={r.leader}
                                    team={squad}
                                    selected={chosen === i}
                                    onClick={() => pick(i)}
                                />
                            ) : (
                                <button
                                    type="button"
                                    className={`card item-card${chosen === i ? ' selected' : ''}`}
                                    onClick={() => pick(i)}
                                >
                                    <span className="tier-label">{t('reward.item')}</span>
                                    <img className="pixel item-art" src={itemSprite(r.item)} alt="" />
                                    <b className="card-name">{itemName(r.item)}</b>
                                    <span className="tactic-desc">{itemDesc(r.item, lang)}</span>
                                </button>
                            )}
                        </div>
                    </Pack>
                ))}
            </div>

            {reward?.kind === 'tm' && (
                <TmTeachPanel
                    move={reward.move}
                    team={squad}
                    onTeach={(uid, slot) => {
                        playSfx('select');
                        claimReward(chosen!, uid, slot);
                    }}
                />
            )}
            {reward && reward.kind !== 'tm' && (
                <div className="panel reward-pick">
                    <h2>{t(reward.kind === 'pokemon' ? 'reward.swapWhich' : 'reward.giveTo')}</h2>
                    <div className="squad-strip">
                        {targets.map((p) => (
                            <button
                                key={p.uid}
                                type="button"
                                className={`mini target-btn${fitOf(p)?.count === 0 ? ' dim' : ''}`}
                                onClick={() => {
                                    playSfx('select');
                                    claimReward(chosen!, p.uid);
                                }}
                            >
                                <img className="pixel" src={cardSprite(p)} alt="" />
                                <span>
                                    <b>{viewInstance(p).displayName}</b>
                                    {fitItem && fitOf(p) && (
                                        <FitBadge fit={fitOf(p)!} item={fitItem} text={fitText(fitOf(p)!)} full />
                                    )}
                                    {p.item && (
                                        <span className="muted">
                                            {t(
                                                reward.kind === 'pokemon'
                                                    ? 'reward.itemGoesToNew'
                                                    : 'reward.replacesItem',
                                                {
                                                    item: itemName(p.item),
                                                },
                                            )}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div className="panel reward-team">
                <h2>{t('reward.yourTeam')}</h2>
                <p className="muted" style={{ marginTop: 0 }}>
                    {reward?.kind === 'pokemon'
                        ? t('reward.positionsHint', { name: viewInstance(reward.inst).displayName })
                        : t('reward.compare')}
                </p>
                <p className="muted reward-open-hint">
                    <ExpandIcon />
                    {t('reward.openCard')}
                </p>
                {fitItem && sampleFit && (
                    <p className="reward-fit-legend">
                        <FitBadge fit={{ ...sampleFit, count: 1 }} item={fitItem} text="" />
                        {sampleFit.type
                            ? t('reward.fit.typeLegend', {
                                  item: itemName(fitItem),
                                  type: typeName(sampleFit.type, lang),
                              })
                            : t('reward.fit.hitLegend', { item: itemName(fitItem) })}
                    </p>
                )}
                <FormationBoard
                    formation={run.formation}
                    lineup={run.lineup}
                    bench={run.bench}
                    byUid={byUid}
                    captainUid={run.captainUid}
                    projection={reward?.kind === 'pokemon' ? reward.inst : null}
                    onSlot={(ref, uid) => {
                        const inst = byUid.get(uid);
                        if (!inst) return;
                        playSfx('select');
                        openCard(inst, {
                            position: ref.zone === 'lineup' ? slots[ref.index] : undefined,
                            captain: inst.uid === run.captainUid,
                        });
                    }}
                    badgeOf={(p) => {
                        const f = fitOf(p);
                        // na quadra só quem aproveita ganha o selo (quem não aproveita já fica apagado)
                        return f?.count && fitItem ? <FitBadge fit={f} item={fitItem} text={fitText(f)} /> : null;
                    }}
                    dimOf={(p) => fitOf(p)?.count === 0}
                    slotAria={(p) => {
                        const f = fitOf(p);
                        return `${f ? `, ${fitText(f)}` : ''}${t('reward.openAria')}`;
                    }}
                />
            </div>
        </>
    );
}
