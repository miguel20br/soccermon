import { type CSSProperties, useEffect, useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { CACHE_MS, desafioNow, refreshDesafio, useDesafio } from '../../cloud/desafio';
import { useT } from '../../i18n/react';
import { DEGRAUS, DESAFIO_TO, type DesafioPhase, daysToOpen, degrausBatidos } from '../../store/desafio-natal';
import { utNow } from '../../store/ultimate/clock';
import { Sheet } from '../kit/Sheet';
import { HudIcon } from './MatchHud';
import { fmtInt, PrizeArt, prizeText } from './RewardReveal';
import '../desafio.css';

const GOAL = DEGRAUS[DEGRAUS.length - 1].gols;
/** Depois de fechar, a faixa fica uma semana (o "Encerrado" com a meta final) e some. */
const SHOW_AFTER_MS = 7 * 86_400_000;

export interface DesafioView {
    phase: DesafioPhase;
    /** Soma de todo mundo (null = sem leitura: sem Supabase, sem rede ou ainda lendo). */
    total: number | null;
    /** Os seus gols (null = sem conta). */
    meus: number | null;
    logged: boolean;
    days: number;
    visible: boolean;
}

/** O estado do desafio pra tela: a fase pelo relógio e a leitura da nuvem (relê a cada minuto enquanto aparece). */
export function useDesafioView(): DesafioView {
    const net = useDesafio();
    const logged = useCloud((s) => !!s.user);
    const [now, setNow] = useState(utNow);
    useEffect(() => {
        void refreshDesafio();
        const id = window.setInterval(() => {
            setNow(utNow());
            void refreshDesafio();
        }, CACHE_MS);
        return () => window.clearInterval(id);
    }, []);
    return {
        phase: desafioNow(),
        total: net.total,
        meus: logged || net.demo ? net.meus : null,
        logged: logged || !!net.demo,
        days: daysToOpen(now),
        visible: now < DESAFIO_TO + SHOW_AFTER_MS,
    };
}

/** A barra com as 8 marcas (os degraus batidos acesos). */
function Bar({ total }: { total: number }) {
    const pct = Math.min(100, (total / GOAL) * 100);
    return (
        <span className="dn-bar" aria-hidden>
            <i className="dn-fill" style={{ width: `${pct}%` }} />
            {DEGRAUS.map((d) => (
                <i
                    key={d.gols}
                    className={`dn-tick${total >= d.gols ? ' on' : ''}`}
                    style={{ '--at': `${(d.gols / GOAL) * 100}%` } as CSSProperties}
                />
            ))}
        </span>
    );
}

/** A linha do jogador: os gols dele, o "marque 1 gol" ou o "só online". */
function mineLine(
    v: DesafioView,
    t: ReturnType<typeof useT>['t'],
    tn: ReturnType<typeof useT>['tn'],
    lang: 'pt' | 'en',
) {
    if (!v.logged) return t('natal.online');
    if (v.meus === null) return '';
    return v.meus > 0 ? tn('natal.mine', v.meus, { n: fmtInt(v.meus, lang) }) : t('natal.needOne');
}

/**
 * A faixa do Desafio de Natal: na Home (`home`, pequena) e no Estádio (`led`, com cara de letreiro). Antes de 07/12, a
 * contagem; aberto, a barra com a soma de todo mundo e os seus gols. Tocar abre o painel dos 8 degraus.
 */
export function DesafioStrip({ variant }: { variant: 'home' | 'led' }) {
    const { t, tn, lang } = useT();
    const v = useDesafioView();
    const [open, setOpen] = useState(false);
    if (!v.visible) return null;
    const teaser = v.phase === 'teaser';
    const total = v.total ?? 0;
    return (
        <>
            <button
                type="button"
                className={`dn-strip is-${variant}${teaser ? ' is-teaser' : ''}`}
                onClick={() => setOpen(true)}
                aria-label={`${t('natal.name')}: ${t('natal.open')}`}
            >
                <HudIcon kind="star" className="dn-strip-ic" />
                {teaser ? (
                    <span className="dn-strip-txt">{tn('natal.teaser', v.days)}</span>
                ) : (
                    <span className="dn-strip-body">
                        <span className="dn-strip-top">
                            <b>{t('natal.name')}</b>
                            <span className="cb-num">
                                {v.total === null
                                    ? t('natal.offline')
                                    : v.phase === 'closed'
                                      ? t('natal.closed')
                                      : `${fmtInt(total, lang)} / ${fmtInt(GOAL, lang)}`}
                            </span>
                        </span>
                        <Bar total={total} />
                        <small className="dn-strip-mine">{mineLine(v, t, tn, lang)}</small>
                    </span>
                )}
                <HudIcon kind="next" className="dn-strip-go" />
            </button>
            <DesafioPanel open={open} onClose={() => setOpen(false)} view={v} />
        </>
    );
}

/** O texto do Desafio de Natal no letreiro de LED do Estádio (null = nada a dizer). */
export function useDesafioLed(): string | null {
    const { t, tn, lang } = useT();
    const total = useDesafio((s) => s.total);
    const phase = desafioNow();
    if (phase === 'teaser') return tn('natal.ledTeaser', daysToOpen(utNow())).toUpperCase();
    if (phase === 'open' && total !== null)
        return t('natal.led', { total: fmtInt(total, lang), goal: fmtInt(GOAL, lang) }).toUpperCase();
    return null;
}

/**
 * O painel dos 8 degraus: cada um com o prêmio desenhado, a meta e o estado (batido, o próximo com "faltam X" ou
 * bloqueado), e embaixo os seus gols. Antes de 07/12, o mesmo painel com a contagem.
 */
export function DesafioPanel({ open, onClose, view: v }: { open: boolean; onClose: () => void; view: DesafioView }) {
    const { t, tn, lang } = useT();
    const total = v.total ?? 0;
    const teaser = v.phase === 'teaser';
    const known = !teaser && v.total !== null;
    const hit = known ? degrausBatidos(total) : 0;
    const mine = mineLine(v, t, tn, lang);
    return (
        <Sheet open={open} onClose={onClose} title={t('natal.name')} className="dn-panel">
            <p className="dn-intro">{t('natal.panel.intro')}</p>
            <div className="dn-head bc-surface">
                {teaser ? (
                    <b className="dn-count">{tn('natal.panel.teaser', v.days)}</b>
                ) : (
                    <>
                        <b className="dn-count cb-num">
                            {v.total === null
                                ? t('natal.offline')
                                : hit === DEGRAUS.length
                                  ? t('natal.done', { total: fmtInt(total, lang) })
                                  : t('natal.progress', { total: fmtInt(total, lang), goal: fmtInt(GOAL, lang) })}
                        </b>
                        <Bar total={total} />
                    </>
                )}
                {mine && (
                    <small className={`dn-mine${v.meus ? ' ok' : ''}`}>
                        {v.meus ? tn('natal.panel.mineOk', v.meus, { n: fmtInt(v.meus, lang) }) : mine}
                    </small>
                )}
            </div>
            <ol className="dn-steps">
                {DEGRAUS.map((d, i) => {
                    const state = i < hit ? 'done' : i === hit && known ? 'next' : 'locked';
                    return (
                        <li key={d.gols} className={`dn-step is-${state}`} style={{ '--i': i } as CSSProperties}>
                            <span className="dn-step-art">
                                {d.items.map((it) => (
                                    <PrizeArt key={it.kind + (('id' in it && it.id) || '')} item={it} />
                                ))}
                            </span>
                            <span className="dn-step-info">
                                <small>{t('natal.panel.step', { n: i + 1 })}</small>
                                {d.items.map((it) => {
                                    const p = prizeText(it, t, lang);
                                    return (
                                        <span key={p.name} className="dn-step-prize">
                                            <b>{p.name}</b>
                                            <small>{p.hint}</small>
                                        </span>
                                    );
                                })}
                            </span>
                            <span className="dn-step-goal">
                                <b className="cb-num">{t('natal.panel.goal', { n: fmtInt(d.gols, lang) })}</b>
                                <span className="dn-chip">
                                    <HudIcon kind={state === 'done' ? 'check' : state === 'next' ? 'flag' : 'lock'} />
                                    {state === 'done'
                                        ? t('natal.panel.stateDone')
                                        : state === 'next'
                                          ? t('natal.panel.stateNext', { n: fmtInt(d.gols - total, lang) })
                                          : t('natal.panel.stateLocked')}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </Sheet>
    );
}
