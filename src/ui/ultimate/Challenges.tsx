import { useState } from 'react';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import {
    SBCS,
    type Sbc,
    type SbcRule,
    sbcAccepts,
    sbcCanDeliver,
    sbcCards,
    sbcFree,
    sbcOpen,
    sbcPlaced,
    sbcPool,
    sbcStarters,
    sbcStatus,
} from '../../store/ultimate/challenges';
import { STARTERS } from '../../store/ultimate/rules';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { ConfirmSheet, Sheet } from '../kit/Sheet';
import { metalLabel, metalOf } from '../rarity';

const itemOf = (d: ReturnType<typeof useT>['d'], id: string) =>
    d.ultimate.sbc.items[id as keyof typeof d.ultimate.sbc.items];

/** As linhas da regra ("5 cartas", "Tipo Água", "Nota 70+"). */
function useRuleLines() {
    const { t, lang } = useT();
    return (r: SbcRule) =>
        [
            t('ultimate.sbc.rule.n', { n: r.n }),
            r.type && t('ultimate.sbc.rule.type', { type: typeName(r.type, lang) }),
            r.min !== undefined && t('ultimate.sbc.rule.min', { n: r.min }),
            r.max !== undefined && t('ultimate.sbc.rule.max', { n: r.max }),
            r.avg && t('ultimate.sbc.rule.avg', { n: r.avg }),
            r.kind && t(`ultimate.sbc.rule.${r.kind === 'family' ? 'family' : 'starters'}`),
        ].filter((x): x is string => !!x);
}

/** O prêmio em texto ("+1 Pacote Grande · +100 Fichas · Pick Prata"). */
function usePrizeText() {
    const { t, tn } = useT();
    return (p: Sbc['prize']) =>
        [
            p.packs ? tn('ultimate.pass.reward.packs', p.packs) : '',
            p.big ? tn('ultimate.pass.reward.big', p.big) : '',
            p.fichas ? t('ultimate.pass.reward.fichas', { n: p.fichas }) : '',
            p.pick ? t('ultimate.pick.metal', { metal: metalLabel(p.pick.min) }) : '',
        ]
            .filter(Boolean)
            .join(' · ');
}

/** Lista dos desafios da temporada; tocar abre a montagem. */
export function Challenges({ onBack }: { onBack: () => void }) {
    const { t, d } = useT();
    const u = useGame((s) => s.ultimate);
    const [openId, setOpenId] = useState<string | null>(null);
    const [got, setGot] = useState<string | null>(null);
    const ruleLines = useRuleLines();
    const prizeText = usePrizeText();
    return (
        <div className="ut-panel ut-sbc">
            <header className="ut-sbc-head">
                <button type="button" className="btn small" onClick={onBack}>
                    {t('ultimate.sbc.back')}
                </button>
                <b className="ut-mode-name">{t('ultimate.sbc.title')}</b>
            </header>
            <small className="muted">{t('ultimate.sbc.hint')}</small>
            {got && (
                <p className="panel ut-sbc-got" role="status">
                    <HudIcon kind="chest" />
                    {t('ultimate.sbc.got', { text: got })}
                </p>
            )}
            <ul className="ut-sbc-list">
                {SBCS.map((s) => {
                    const placed = sbcCards(u, s.id);
                    const open = sbcOpen(u, s);
                    return (
                        <li key={s.id}>
                            <button
                                type="button"
                                className={`panel bc-surface ut-sbc-item${open ? '' : ' is-done'}`}
                                onClick={() => setOpenId(s.id)}
                            >
                                <span className="ut-sbc-top">
                                    <b className="ut-mode-name">{itemOf(d, s.id).name}</b>
                                    {!open && <span className="ut-sbc-pill">{t('ultimate.sbc.done')}</span>}
                                    {open && s.repeatable && (
                                        <span className="ut-sbc-pill is-soft">{t('ultimate.sbc.repeat')}</span>
                                    )}
                                </span>
                                <span className="ut-sbc-rule">
                                    {ruleLines(s.rule).map((l) => (
                                        <i key={l}>{l}</i>
                                    ))}
                                </span>
                                {open && (
                                    <span className="ut-sbc-dots" aria-hidden>
                                        {Array.from({ length: s.rule.n }, (_, i) => ({
                                            k: `${s.id}${i}`,
                                            on: i < placed.length,
                                        })).map((x) => (
                                            <i key={x.k} className={x.on ? 'on' : undefined} />
                                        ))}
                                        <small>
                                            {t('ultimate.sbc.progress', { have: placed.length, need: s.rule.n })}
                                        </small>
                                    </span>
                                )}
                                <span className="ut-mode-gives">
                                    <HudIcon kind="chest" />
                                    {prizeText(s.prize)}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            {openId && (
                <Build
                    id={openId}
                    onClose={() => setOpenId(null)}
                    onDone={(text) => {
                        setOpenId(null);
                        setGot(text);
                    }}
                />
            )}
        </div>
    );
}

/** A montagem de um desafio: os slots, o que falta e as cartas que servem. */
function Build({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: (text: string) => void }) {
    const { t, tn, d } = useT();
    const u = useGame((s) => s.ultimate);
    const place = useGame((s) => s.ultimateSbcPlace);
    const remove = useGame((s) => s.ultimateSbcRemove);
    const deliver = useGame((s) => s.ultimateSbcDeliver);
    const [ask, setAsk] = useState(false);
    const ruleLines = useRuleLines();
    const prizeText = usePrizeText();
    const s = SBCS.find((x) => x.id === id) as Sbc;
    const placed = sbcCards(u, id);
    const st = sbcStatus(s.rule, placed);
    const taken = sbcPlaced(u);
    const repeats = new Set(u.pending.flatMap((p) => (p.kind === 'card' ? [p.card.uid] : [])));
    const tag = (c: PokemonInstance): 'repeat' | 'locked' | 'evo' | 'starter' | 'bench' | null => {
        const i = u.team.order.indexOf(c.uid);
        if (repeats.has(c.uid)) return 'repeat';
        if (u.locked.includes(c.uid)) return 'locked';
        if (u.evos.some((e) => e.uid === c.uid)) return 'evo';
        return i < 0 ? null : i < STARTERS ? 'starter' : 'bench';
    };
    // as repetidas primeiro, depois quem está fora do time, banco e titulares; dentro de cada grupo, a nota mais baixa
    const rank = { repeat: 0, none: 1, bench: 2, starter: 3, locked: 4, evo: 4 } as const;
    const options = sbcPool(u)
        .filter((c) => !taken.has(c.uid) && sbcAccepts(s.rule, placed, c))
        .map((c) => ({ c, v: viewInstance(c), tag: tag(c) }))
        .sort((a, b) => rank[a.tag ?? 'none'] - rank[b.tag ?? 'none'] || a.v.overall - b.v.overall);
    const starters = sbcStarters(u, id).length;
    const can = sbcCanDeliver(u, id);
    const blockedLive = !!u.live && starters > 0;
    return (
        <>
            <Sheet open onClose={onClose} title={itemOf(d, id).name} className="ut-sbc-sheet">
                <p className="ut-sbc-line">{itemOf(d, id).line}</p>
                <span className="ut-sbc-rule">
                    {ruleLines(s.rule).map((l) => (
                        <i key={l}>{l}</i>
                    ))}
                </span>
                <span className="bc-lbl">{t('ultimate.sbc.slots')}</span>
                <div className="ut-sbc-slots">
                    {Array.from({ length: s.rule.n }, (_, i) => {
                        const c = placed[i];
                        // biome-ignore lint/suspicious/noArrayIndexKey: slot vazio, posição fixa
                        if (!c) return <i key={`${id}-empty-${i}`} className="ut-sbc-slot" />;
                        const v = viewInstance(c);
                        return (
                            <button
                                key={c.uid}
                                type="button"
                                className="ut-sbc-slot is-on"
                                aria-label={`${t('ultimate.sbc.take')}: ${v.displayName}`}
                                onClick={() => remove(id, c.uid)}
                            >
                                <MonIcon id={c.speciesId} shiny={c.shiny} />
                                <b>{v.overall}</b>
                            </button>
                        );
                    })}
                </div>
                <p className={`ut-sbc-state${st.ok ? ' is-ok' : ''}`}>
                    {t('ultimate.sbc.progress', { have: st.have, need: st.need })}
                    {st.avg !== null &&
                        st.have > 0 &&
                        ` · ${t('ultimate.sbc.avg', { a: st.avg.toFixed(1), n: s.rule.avg ?? 0 })}`}
                </p>
                <span className="ut-mode-gives">
                    <HudIcon kind="chest" />
                    {t('ultimate.sbc.prize')}: {prizeText(s.prize)}
                </span>
                {blockedLive && <small className="ut-off">{t('ultimate.sbc.live')}</small>}
                <button type="button" className="btn primary wide" disabled={!can} onClick={() => setAsk(true)}>
                    {can ? t('ultimate.sbc.deliver') : t('ultimate.sbc.missing')}
                </button>
                <span className="bc-lbl">{t('ultimate.sbc.add')}</span>
                {options.length === 0 ? (
                    <small className="muted">{t('ultimate.sbc.none')}</small>
                ) : (
                    <ul className="ut-sbc-opts">
                        {options.slice(0, 60).map(({ c, v, tag: tg }) => (
                            <li key={c.uid} className="ut-sbc-opt">
                                <MonIcon id={c.speciesId} shiny={c.shiny} />
                                <span className="ut-sbc-opt-info">
                                    <b>{v.displayName}</b>
                                    <small>
                                        {v.overall} · {metalLabel(metalOf(v.overall))}
                                        {tg && <em className={`ut-sbc-tag is-${tg}`}>{d.ultimate.sbc.tag[tg]}</em>}
                                    </small>
                                </span>
                                <button
                                    type="button"
                                    className="btn k-chip"
                                    disabled={st.have >= st.need || !sbcFree(u, c)}
                                    onClick={() => place(id, c.uid)}
                                >
                                    {t('ultimate.sbc.put')}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Sheet>
            <ConfirmSheet
                open={ask}
                onClose={() => setAsk(false)}
                title={t('ultimate.sbc.confirm.title')}
                text={
                    starters
                        ? tn('ultimate.sbc.confirm.starters', starters, { n: starters })
                        : t('ultimate.sbc.confirm.text')
                }
                confirm={t('ultimate.sbc.confirm.go')}
                onConfirm={() => {
                    const text = prizeText(s.prize);
                    deliver(id);
                    onDone(text);
                }}
            />
        </>
    );
}
