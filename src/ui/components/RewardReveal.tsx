import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type TKey, tn } from '../../i18n';
import type { Lang } from '../../i18n/lang';
import { useT } from '../../i18n/react';
import { DEGRAUS, type DesafioItem } from '../../store/desafio-natal';
import { useGame } from '../../store/game-store';
import { type Reveal, shiftReveal, useReveal } from '../../store/reveal';
import { titleClass } from '../../store/title-codes';
import { useWipeBusy } from '../kit/wipe-store';
import { titleName } from '../profile/club';
import { RARE_ORNAMENT } from '../profile/ornaments';
import { PACK_NAME_KEY, packArt } from '../ultimate/pack-art';
import { HudIcon } from './MatchHud';
import '../desafio.css';

type T = (key: TKey, vars?: Record<string, string | number>) => string;
export const fmtInt = (n: number, lang: Lang) => n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');

/** O nome, a linha do que vem e onde o prêmio fica (a tela de prêmio e o painel do Desafio de Natal). */
export function prizeText(item: DesafioItem, t: T, lang: Lang): { name: string; hint: string; where: string } {
    const packs = t('natal.reveal.wherePacks');
    switch (item.kind) {
        case 'ornament': {
            const rare = item.id === RARE_ORNAMENT;
            return {
                name: t(rare ? 'natal.item.star' : 'natal.item.ornament'),
                hint: t(rare ? 'natal.item.starHint' : 'natal.item.ornamentHint'),
                where: t('natal.reveal.whereProfile'),
            };
        }
        case 'fichas':
            return {
                name: t('natal.item.fichas', { n: fmtInt(item.n, lang) }),
                hint: t('natal.item.fichasHint'),
                where: t('natal.reveal.whereFichas'),
            };
        case 'title':
            return {
                name: t('natal.item.title', { name: titleName(item.id) }),
                hint: t('natal.item.titleHint'),
                where: t('natal.reveal.whereTitle'),
            };
        case 'pick': {
            const gold = item.pick.min === 'ouro';
            return {
                name: t(gold ? 'natal.item.pickGold' : 'natal.item.pick'),
                hint: t(gold ? 'natal.item.pickGoldHint' : 'natal.item.pickHint'),
                where: packs,
            };
        }
        case 'pack':
            return {
                name: item.pack === 'big' ? tn('natal.item.bigN', item.n, {}, lang) : t(PACK_NAME_KEY[item.pack]),
                hint: t(
                    item.pack === 'evmini'
                        ? 'natal.item.evMiniHint'
                        : item.pack === 'evbig'
                          ? 'natal.item.evBigHint'
                          : 'natal.item.bigHint',
                ),
                where: packs,
            };
    }
}

/** O desenho do prêmio: o pacote de verdade, o título com o visual dele, a moeda, o enfeite. */
export function PrizeArt({ item }: { item: DesafioItem }) {
    const { lang } = useT();
    switch (item.kind) {
        case 'pack':
        case 'pick': {
            const gold = item.kind === 'pick' && item.pick.min === 'ouro';
            const art = item.kind === 'pick' ? `evento-${item.pick.event}` : packArt(item.pack);
            const n = item.kind === 'pack' ? item.n : 1;
            return (
                <span className={`dn-art dn-art-pack${gold ? ' is-gold' : ''}`}>
                    {n > 1 && (
                        <img className="dn-packimg dn-back" src={`assets/ui/pacotes/${lang}/${art}.png`} alt="" />
                    )}
                    <img className="dn-packimg" src={`assets/ui/pacotes/${lang}/${art}.png`} alt="" decoding="async" />
                    {n > 1 && <b className="dn-art-x cb-num">x{n}</b>}
                </span>
            );
        }
        case 'fichas':
            return (
                <span className="dn-art dn-art-coin">
                    <b className="cb-num">{item.n}</b>
                </span>
            );
        case 'title':
            return (
                <span className="dn-art dn-art-title">
                    <span className="dn-title-plate">
                        <span className={titleClass(item.id)}>{titleName(item.id)}</span>
                    </span>
                </span>
            );
        case 'ornament':
            return (
                <span className={`dn-art dn-art-orn${item.id === RARE_ORNAMENT ? ' is-rare' : ''}`}>
                    <HudIcon kind={item.id === RARE_ORNAMENT ? 'star' : 'sparkle'} />
                </span>
            );
    }
}

/** Por que ganhou e de onde veio. */
function sourceLines(r: Reveal, t: T, lang: Lang): { why: string; from: string } {
    const s = r.source;
    if (s.kind === 'gift') return { why: t('natal.reveal.giftWhy'), from: t('natal.reveal.giftFrom') };
    if (s.kind === 'natalCup') return { why: t('natal.reveal.cupWhy'), from: t('natal.reveal.cupFrom') };
    return {
        why: t('natal.reveal.why', { total: fmtInt(s.total, lang), n: s.degrau, of: DEGRAUS.length }),
        from: tn('natal.reveal.from', s.meus, { n: fmtInt(s.meus, lang) }, lang),
    };
}

/** As faíscas em volta (ângulo e distância); paradas com Reduzir movimento. */
const SPARKS = Array.from({ length: 12 }, (_, i) => ({ a: i * 30 + (i % 2) * 12, d: 120 + (i % 3) * 34 }));
/** Saída de um prêmio antes do próximo entrar (a entrada é o pop do CSS, 260 ms). */
const OUT_MS = 220;

/**
 * Tela de prêmio: cada prêmio da fila (`store/reveal.ts`) grande no centro, um por vez, com o que é, por que ganhou, de
 * onde veio e onde está agora. Entra com peso (escala, raios e faíscas) e sai em 220 ms antes do próximo. Só na Home e no
 * Time Ultimate, nunca por cima de uma transição ou do selo de missão (UnlockNotice). Toque, Enter ou Esc continua.
 */
export function RewardReveal() {
    const { t, lang } = useT();
    const queue = useReveal((s) => s.queue);
    const free = useGame((s) => (s.screen === 'home' || s.screen === 'ultimate') && s.unlockQueue.length === 0);
    const busy = useWipeBusy();
    const [out, setOut] = useState(false);
    // quantos já passaram nesta leva ("2 de 3")
    const [seen, setSeen] = useState(0);
    const btn = useRef<HTMLButtonElement>(null);
    const id = useId();
    const r = queue[0];
    const on = !!r && free && !busy;
    // biome-ignore lint/correctness/useExhaustiveDependencies: cada prêmio (r) pega o foco
    useEffect(() => {
        if (on) btn.current?.focus({ preventScroll: true });
    }, [on, r]);
    useEffect(() => {
        if (!queue.length) setSeen(0);
    }, [queue.length]);
    if (!on || !r) return null;
    const next = () => {
        if (out) return;
        setOut(true);
        window.setTimeout(() => {
            setOut(false);
            setSeen((n) => n + 1);
            shiftReveal();
        }, OUT_MS);
    };
    const txt = prizeText(r.item, t, lang);
    const src = sourceLines(r, t, lang);
    const total = seen + queue.length;
    return createPortal(
        <div
            className={`rr-back${out ? ' out' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={id}
            onKeyDown={(e) => {
                if (e.key === 'Escape') next();
            }}
        >
            <i className="rr-rays" aria-hidden />
            <button type="button" ref={btn} className="rr-hit" onClick={next} aria-label={t('natal.reveal.tap')} />
            <div key={`${seen}`} className="rr-card">
                <span className="rr-head bc-tag">
                    {t('natal.reveal.head')}
                    {total > 1 && ` · ${t('natal.reveal.count', { i: seen + 1, n: total })}`}
                </span>
                <span className="rr-art">
                    <span className="rr-sparks" aria-hidden>
                        {SPARKS.map((s) => (
                            <i key={s.a} style={{ '--a': `${s.a}deg`, '--d': `${s.d}px` } as CSSProperties} />
                        ))}
                    </span>
                    <PrizeArt item={r.item} />
                </span>
                <h2 id={id} className="rr-name">
                    {txt.name}
                </h2>
                <p className="rr-hint">{txt.hint}</p>
                <ul className="rr-facts">
                    <li>
                        <HudIcon kind="chart" />
                        {src.why}
                    </li>
                    <li>
                        <HudIcon kind="star" />
                        {src.from}
                    </li>
                    <li>
                        <HudIcon kind="check" />
                        {txt.where}
                    </li>
                </ul>
                <span className="rr-tap">{t('natal.reveal.tap')}</span>
            </div>
        </div>,
        document.body,
    );
}
