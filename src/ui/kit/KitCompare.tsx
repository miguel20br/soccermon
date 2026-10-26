import { useMemo, useState } from 'react';
import { FORMATIONS, type FormationId } from '../../engine/formations';
import { createInstance, type PokemonInstance } from '../../engine/instance';
import { itemSprite } from '../../engine/items';
import { Rng } from '../../engine/rng';
import { formationText, itemDesc, itemName, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { PackArt } from '../components/CardPack';
import { FormationBoard } from '../components/FormationBoard';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { cardSprite } from '../components/PokeCard';
import { Money, SponsorCard, SponsorSlots } from '../components/SponsorCard';
import { FORMATION_ICON } from '../formation-info';
import '../shop.css';
import '../bracket.css';
import '../help/help.css';
import './kit-compare.css';

/**
 * ?lab=kit&v=comparar (só no dev e nas prévias): as mesmas 3 telas (Mercado, draft, Escalação) em 3 variantes do kit,
 * com os componentes de verdade e dados fixos. Pra decidir com o Miguel antes de espalhar.
 *   A: como está na 0.9.22.  B: hierarquia (um botão gordo por tela, o resto baixo e sem contorno).
 *   C: B + os painéis com o material do kit (moldura dupla grossa, placa de título, textura leve).
 * Sem `var`, a página mostra as 3 lado a lado em iframes de 390x844 (cada uma com o CSS de celular de verdade).
 */
const TELAS = ['mercado', 'draft', 'escalacao'] as const;
type Tela = (typeof TELAS)[number];
type Var = 'a' | 'b' | 'c';
const TELA_NOME: Record<Tela, string> = { mercado: 'Mercado', draft: 'Draft', escalacao: 'Escalação' };
const VAR_NOME: Record<Var, string> = { a: 'A · atual', b: 'B · hierarquia', c: 'C · material único' };

const mon = (id: number) => createInstance(id, new Rng(`kit-comparar-${id}`));

export function KitCompare() {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('var');
    const tela = (TELAS as readonly string[]).includes(params.get('tela') ?? '') ? (params.get('tela') as Tela) : null;
    if ((v === 'a' || v === 'b' || v === 'c') && tela) return <Phone tela={tela} v={v} />;
    return <Sheet first={tela ?? 'mercado'} />;
}

/** As 3 variantes lado a lado (quebram em coluna no celular). */
function Sheet({ first }: { first: Tela }) {
    const [tela, setTela] = useState<Tela>(first);
    return (
        <div className="kc-sheet">
            <header className="bc-screenhead">
                <span className="bc-tag">Laboratório · kit</span>
                <h1>Comparar variantes</h1>
            </header>
            <div className="bc-seg kc-tabs">
                {TELAS.map((t) => (
                    <button key={t} type="button" aria-pressed={tela === t} onClick={() => setTela(t)}>
                        {TELA_NOME[t]}
                    </button>
                ))}
            </div>
            <div className="kc-cols" key={tela}>
                {(['a', 'b', 'c'] as const).map((v) => (
                    <figure key={v}>
                        <figcaption>{VAR_NOME[v]}</figcaption>
                        <iframe
                            title={`${TELA_NOME[tela]} ${VAR_NOME[v]}`}
                            src={`?lab=kit&v=comparar&tela=${tela}&var=${v}`}
                            width={390}
                            height={844}
                        />
                    </figure>
                ))}
            </div>
        </div>
    );
}

function Phone({ tela, v }: { tela: Tela; v: Var }) {
    return (
        <div className={`kc-phone kv-${v}`}>
            <header className="topbar">
                <span className="brand">
                    <span className="brand-logo">
                        <img src="assets/ui/logo.svg" alt="" width="1441" height="300" />
                    </span>
                </span>
            </header>
            {tela === 'mercado' ? <Mercado v={v} /> : tela === 'draft' ? <Draft v={v} /> : <Escalacao v={v} />}
        </div>
    );
}

/** A: o botão "Comprar" verde embaixo de cada carta. B/C: um chip baixo, preso na borda de baixo da carta. */
function Buy({ v, label }: { v: Var; label: string }) {
    return v === 'a' ? (
        <button type="button" className="btn small confirm shop-buy">
            {label}
        </button>
    ) : (
        <button type="button" className="kv-chip">
            {label}
        </button>
    );
}

function Mercado({ v }: { v: Var }) {
    const { t, lang } = useT();
    const [ditto, machamp] = useMemo(() => [mon(132), mon(68)], []);
    const earned = [
        ['win', 5],
        ['goals', 3],
        ['clean', 2],
        ['interest', 2],
    ] as const;
    const packName = t('shop.pack', { type: typeName('Water', lang) });
    const buy = (n: number) => t('shop.buy', { n });
    return (
        <>
            <div className="draft-head bc-screenhead">
                <span className="bc-tag">{t('shop.before', { stage: 'Semifinal' })}</span>
                <div className="draft-title">
                    <h1>{t('shop.title')}</h1>
                    <Money n={24} className="shop-wallet cb-num" />
                </div>
                <button type="button" className="btn small">
                    <HudIcon kind="reroll" />
                    {t('shop.rerollFree')}
                </button>
            </div>
            <div className="panel shop-earned">
                <span className="shop-earned-title">{t('shop.earned.title')}</span>
                {earned.map(([k, n]) => (
                    <span key={k} className="shop-earned-line">
                        {t(`shop.earned.${k}`)} <b>+{t('shop.money', { n })}</b>
                    </span>
                ))}
                <span className="muted shop-earned-hint">{t('shop.interestHint', { cap: 3 })}</span>
            </div>
            <div className="shop-shelves">
                <section className="shop-shelf">
                    <h2 className="shop-shelf-title">{t('shop.shelf.mons')}</h2>
                    <div className="shop-grid">
                        {[
                            [ditto, 4],
                            [machamp, 7],
                        ].map(([inst, price]) => (
                            <div key={(inst as PokemonInstance).uid} className="shop-offer k-pokemon">
                                <FutCard inst={inst as PokemonInstance} />
                                <Buy v={v} label={buy(price as number)} />
                            </div>
                        ))}
                    </div>
                </section>
                <section className="shop-shelf">
                    <h2 className="shop-shelf-title">{t('shop.shelf.gear')}</h2>
                    <div className="shop-grid">
                        <div className="shop-offer k-pack">
                            <div className="shop-pack-offer">
                                <PackArt look="" type="Water" label={packName} />
                                <span className="sp-desc">
                                    {t('shop.packDesc', { n: 3, type: typeName('Water', lang) })}
                                </span>
                            </div>
                            <Buy v={v} label={buy(6)} />
                        </div>
                        <div className="shop-offer k-item">
                            <div className="card item-card">
                                <span className="tier-label">{t('reward.item')}</span>
                                <img className="pixel item-art" src={itemSprite('leftovers')} alt="" />
                                <b className="card-name">{itemName('leftovers')}</b>
                                <span className="tactic-desc">{itemDesc('leftovers', lang)}</span>
                            </div>
                            <Buy v={v} label={buy(3)} />
                        </div>
                    </div>
                </section>
                <section className="shop-shelf shelf-sponsor">
                    <h2 className="shop-shelf-title">
                        {t('shop.sponsors')} <span className="muted">{t('shop.slots', { n: 2 })}</span>
                    </h2>
                    <p className="shop-shelf-hint">{t('shop.sponsorsHint')}</p>
                    {(['cinnabar', 'torcida'] as const).map((id) => (
                        <div key={id} className="shop-offer k-sponsor">
                            <SponsorCard id={id} price={10} />
                            <Buy v={v} label={t('shop.buyPlain')} />
                        </div>
                    ))}
                    <SponsorSlots sponsors={['silph', 'creche']} />
                </section>
            </div>
            <div className="bc-thumbbar">
                <button type="button" className={`btn confirm${v === 'a' ? '' : ' big'}`}>
                    {t('shop.leave')}
                    <HudIcon kind="next" />
                </button>
            </div>
        </>
    );
}

function Draft({ v }: { v: Var }) {
    const { t, d } = useT();
    const options = useMemo(() => [mon(8), mon(105), mon(137)], []);
    const team = useMemo(() => ({ gk: mon(41) }), []);
    const byUid = new Map([[team.gk.uid, team.gk]]);
    const formation: FormationId = '2-2';
    const slots = FORMATIONS[formation].slots;
    const lineup = slots.map((_, i) => (i === 0 ? team.gk.uid : ''));
    const pos = d.common.pos.FIXO;
    return (
        <>
            <div className="draft-head bc-screenhead">
                <span className="bc-tag">
                    {t('team.draft.pickOf', { n: 2, total: 7 })} · {formationText(formation, 'pt').name}
                </span>
                <div className="draft-title">
                    <h1>{t('team.draft.chooseForSlot', { pos })}</h1>
                    <p className="muted">{t('team.draft.hintOptions')}</p>
                </div>
                <div className="steps" role="img">
                    {Array.from({ length: 7 }, (_, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: posições fixas do progresso
                        <span key={i} className={i < 1 ? 'done' : i === 1 ? 'now' : ''} />
                    ))}
                </div>
                <div className="bc-thumbbar draft-auto">
                    <button type="button" className={v === 'a' ? 'btn ghost draft-auto-go' : 'btn draft-auto-go'}>
                        <HudIcon kind="skip" />
                        {t('team.draft.auto')}
                    </button>
                    <p className="tb-hint draft-auto-hint">{t('team.draft.chooseForSlot', { pos })}</p>
                </div>
            </div>
            <div className="draft-strip" aria-hidden="true">
                {[...lineup, '', ''].map((uid, i) => {
                    const inst = uid ? byUid.get(uid) : undefined;
                    const label = i < slots.length ? d.team.board.slot[slots[i]] : t('common.ui.bench');
                    const state = inst ? 'locked' : i === 1 ? 'selected' : 'locked';
                    return (
                        <button
                            type="button"
                            // biome-ignore lint/suspicious/noArrayIndexKey: vagas fixas
                            key={i}
                            tabIndex={-1}
                            className={`ds-chip ${inst ? 'filled' : 'empty'} ${state}`}
                        >
                            {inst ? <img className="pixel" src={cardSprite(inst)} alt="" /> : <i />}
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="draft-grid">
                <div className="panel board-panel">
                    <h2>Pallet FC</h2>
                    <FormationBoard
                        formation={formation}
                        lineup={lineup}
                        bench={['', '']}
                        byUid={byUid}
                        stateOf={(ref, uid) =>
                            uid ? 'locked' : ref.zone === 'lineup' && ref.index === 1 ? 'selected' : 'locked'
                        }
                    />
                </div>
                <div className="draft-options">
                    <div className="row options-bar">
                        <span className="bc-lbl">{t('team.draft.optionsFor', { pos })}</span>
                        <button type="button" className="btn small">
                            <HudIcon kind="reroll" />
                            {t('team.draft.reroll', { n: 2 })}
                        </button>
                    </div>
                    <div className="options">
                        {options.map((o) => (
                            <div key={o.uid} className="option">
                                <div className="option-fit main">
                                    <span className="fit-long">{t('team.draft.fitMain', { pos })}</span>
                                </div>
                                <FutCard
                                    inst={o}
                                    position="FIXO"
                                    action={{
                                        label: t('team.draft.signAs', { pos }),
                                        primary: true,
                                        onClick: () => {},
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function Escalacao({ v }: { v: Var }) {
    const { t, d, lang } = useT();
    const team = useMemo(() => [mon(74), mon(54), mon(25), mon(52), mon(77), mon(43), mon(19)], []);
    const byUid = new Map(team.map((p) => [p.uid, p]));
    const formation: FormationId = '2-2';
    const stages = ['Cinnabar Vulcão', 'Saffron Mentes', 'Viridian Terra', 'Liga Índigo'];
    return (
        <>
            <div className="cup-bug bc-surface">
                <div className="cup-path">
                    {d.common.stage.map((label, i) => (
                        <div key={label} className={`cup-step${i === 0 ? ' now' : ''}`}>
                            <b>{label}</b>
                            <span className="muted">{stages[i]}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="br-peek">
                <button type="button" className="btn small ghost">
                    <HudIcon kind="down" />
                    {t('bracket.show')}
                </button>
            </div>
            <div className="tip bc-surface bc-stripe" role="note">
                <HudIcon kind="bulb" className="tip-icon" />
                <span className="tip-text">
                    <b>{d.help.tip.label}</b> {t('team.lineup.tip')}
                </span>
                <button type="button" className="tip-close" aria-label={d.help.tip.close}>
                    <HudIcon kind="close" />
                </button>
            </div>
            <div className="lineup-grid">
                <div className="panel">
                    <h2>{t('team.lineup.title', { team: 'Pallet FC' })}</h2>
                    <div className="formation-tabs bc-seg segmented">
                        {Object.values(FORMATIONS).map((f) => (
                            <button key={f.id} type="button" className={formation === f.id ? 'on' : undefined}>
                                <HudIcon kind={FORMATION_ICON[f.id]} />
                                {formationText(f.id, lang).name}
                            </button>
                        ))}
                    </div>
                    <p className="muted" style={{ marginTop: 8 }}>
                        {t('team.lineup.swapHint')}
                    </p>
                    <FormationBoard
                        formation={formation}
                        lineup={team.slice(0, 5).map((p) => p.uid)}
                        bench={team.slice(5).map((p) => p.uid)}
                        byUid={byUid}
                        captainUid={team[2].uid}
                    />
                </div>
            </div>
            <div className="bc-thumbbar">
                <button type="button" className={`btn primary wide${v === 'a' ? '' : ' big cb'}`}>
                    {v !== 'a' && <i className="cb-shine" aria-hidden />}
                    {t('team.lineup.play', { stage: 'oitavas de final' })}
                </button>
            </div>
        </>
    );
}
