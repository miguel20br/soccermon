import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { lookOfProfile } from '../../store/club-kit';
import { duelWins as duelWinsOf } from '../../store/duels';
import { useGame } from '../../store/game-store';
import { MEDALS, medalProgress } from '../../store/medals';
import { PLATINUM, platinumDone } from '../../store/missions';
import { clubColorHex } from '../../store/profile';
import {
    BELTS,
    cupCounts,
    cupMetal,
    dailyCounts,
    fullWeeks,
    METALS,
    type MetalCount,
    roomLevel,
} from '../../store/trophies';
import { FutCard } from '../components/FutCard';
import { HallList } from '../components/HallParade';
import { HudIcon } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { type ArtKind, PixelTrophy } from '../components/PixelTrophy';
import { useCardShowcase } from '../profile/Album';
import { Crest, KitShirt } from '../profile/Crest';
import { bannerText, clubVars, speciesGif } from '../profile/club';
import { MEDAL_GLYPH, MedalDisc, useMedalView } from '../profile/Medals';
import type { Metal } from '../rarity';
import { reduceMotionOn } from '../settings-sync';
import '../trophy-room.css';

// ------------------------------------------------------------------------------------------- objetos
type Focus =
    | { kind: 'cup' | 'daily'; metal: Metal }
    | { kind: 'belt'; i: number }
    | { kind: 'week' | 'liga' | 'medals' | 'diploma' | 'club' | 'glass' | 'books' | 'tv' };

const focusId = (f: Focus) => `${f.kind}${'metal' in f ? `-${f.metal}` : 'i' in f ? `-${f.i}` : ''}`;

/** Um objeto da sala: botão que aproxima (a câmera desliza até ele) e abre o detalhe embaixo. */
function Obj({
    f,
    focus,
    onFocus,
    label,
    className = '',
    children,
}: {
    f: Focus;
    focus: Focus | null;
    onFocus: (f: Focus) => void;
    label: string;
    className?: string;
    children: ReactNode;
}) {
    const on = !!focus && focusId(focus) === focusId(f);
    return (
        <button
            type="button"
            className={`tr-obj ${className}${on ? ' on' : ''}`}
            aria-label={label}
            aria-pressed={on}
            data-obj={focusId(f)}
            onClick={() => onFocus(f)}
        >
            {children}
        </button>
    );
}

/** Taça/medalhão com o número gravado na base ("×3"); sem nenhum, a silhueta. */
function Counted({ kind, metal, n }: { kind: ArtKind; metal: Metal; n: number }) {
    const { t } = useT();
    return (
        <span className="tr-counted">
            <PixelTrophy kind={kind} metal={metal} ghost={n === 0} />
            {n > 1 && <b className="tr-plate">{t('trophies.times', { n })}</b>}
        </span>
    );
}

/** Abre o Perfil numa aba (o Perfil lê `?perfil=` ao abrir). */
function toProfile(tab: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('perfil', tab);
    window.history.replaceState(null, '', url);
    useGame.getState().go('profile');
}

// ------------------------------------------------------------------------------------------- a sala
/** Sala de troféus: o que era lista e número vira objeto (docs/planos/sala-de-trofeus.md). */
export function TrophyRoom() {
    const { t } = useT();
    const go = useGame((s) => s.go);
    const profile = useGame((s) => s.profile);
    const hall = useGame((s) => s.hall);
    const daily = useGame((s) => s.daily);
    const records = useGame((s) => s.records);
    const view = useMedalView();
    const glass = useCardShowcase().insts;
    const [focus, setFocus] = useState<Focus | null>(null);
    const sheet = useRef<HTMLElement>(null);

    const cups = cupCounts(hall);
    const days = dailyCounts(daily);
    const weeks = fullWeeks(daily);
    const duelWins = duelWinsOf(records, view.duels);
    const medals = medalProgress(view);
    const platinum = platinumDone(PLATINUM[0], view);
    const titles = Math.max(records.titles, hall.length);
    const lvl = roomLevel(titles);
    const look = lookOfProfile(profile);
    const lastCap = hall[0] && (hall[0].squad.find((p) => p.captain) ?? hall[0].squad[0]);

    // o detalhe entra por baixo; no celular, rola até ele
    useEffect(() => {
        if (!focus) return;
        const id = requestAnimationFrame(() =>
            sheet.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotionOn() ? 'auto' : 'smooth' }),
        );
        return () => cancelAnimationFrame(id);
    }, [focus]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFocus(null);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const metalName = (m: Metal) => t(`trophies.metal.${m}` as TKey);
    const obj = { focus, onFocus: (f: Focus) => setFocus((cur) => (cur && focusId(cur) === focusId(f) ? null : f)) };

    return (
        <div
            className={`menu-screen tr tr-lv-${lvl.level}`}
            style={
                {
                    ...clubVars(clubColorHex(profile.clubColor)),
                    '--tr-ribbon': `#${clubColorHex(profile.clubColor).toString(16).padStart(6, '0')}`,
                } as CSSProperties
            }
        >
            <MenuHead title={t('trophies.title')} icon="liga" onBack={() => go('profile')} />

            <p className="tr-level">
                <b>{t('trophies.levelLine', { n: lvl.n, name: t(`trophies.level.${lvl.level}` as TKey) })}</b>
                <small>{lvl.next ? t('trophies.nextLevel', { n: lvl.next }) : t('trophies.maxLevel')}</small>
            </p>

            <div className="tr-room">
                {/* parede de cima: bandeira, faixa, diploma, camisa */}
                <section className="tr-wall">
                    <Obj f={{ kind: 'club' }} {...obj} label={t('trophies.flag')} className="tr-flag">
                        <Crest look={look} className="crest tr-crest" />
                    </Obj>
                    <Obj f={{ kind: 'club' }} {...obj} label={t('trophies.banner')} className="tr-banner">
                        <span>{bannerText(profile.banner, profile.clubName || 'Pallet FC')}</span>
                    </Obj>
                    <Obj f={{ kind: 'diploma' }} {...obj} label={t('trophies.diploma')} className="tr-frame tr-diploma">
                        <span className={platinum ? 'got' : 'ghost'}>
                            <img className="pixel" src="assets/trainers/oak.png" alt="" />
                        </span>
                    </Obj>
                    <Obj f={{ kind: 'club' }} {...obj} label={t('trophies.shirt')} className="tr-frame tr-shirt">
                        <KitShirt look={look} className="kit-shirt" />
                    </Obj>
                </section>

                {/* estante: Copa (3 taças) e a Liga no centro */}
                <section className="tr-shelf tr-shelf-cup" aria-label={t('trophies.shelfCup')}>
                    <span className="tr-shelf-tag">{t('trophies.shelfCup')}</span>
                    <div className="tr-shelf-row">
                        {METALS.map((m) => (
                            <Obj
                                key={m}
                                f={{ kind: 'cup', metal: m }}
                                {...obj}
                                label={`${t('trophies.cup', { metal: metalName(m) })} ${t('trophies.times', { n: cups[m] })}`}
                            >
                                <Counted kind="taca" metal={m} n={cups[m]} />
                            </Obj>
                        ))}
                        <Obj f={{ kind: 'liga' }} {...obj} label={t('trophies.liga')} className="tr-liga">
                            <PixelTrophy kind="taca" metal="ouro" ghost />
                        </Obj>
                    </div>
                </section>

                <div className="tr-two">
                    {/* cortiça: Copa do Dia */}
                    <section className="tr-cork" aria-label={t('trophies.shelfDaily')}>
                        <span className="tr-shelf-tag">{t('trophies.shelfDaily')}</span>
                        <div className="tr-shelf-row">
                            {METALS.map((m) => (
                                <Obj
                                    key={m}
                                    f={{ kind: 'daily', metal: m }}
                                    {...obj}
                                    label={`${t('trophies.daily', { metal: metalName(m) })} ${t('trophies.times', { n: days[m] })}`}
                                >
                                    <Counted kind="medalhao" metal={m} n={days[m]} />
                                </Obj>
                            ))}
                            <Obj f={{ kind: 'week' }} {...obj} label={t('trophies.week')} className="tr-week">
                                <Counted kind="taca" metal="prata" n={weeks} />
                            </Obj>
                        </div>
                    </section>
                    {/* cinturões do Duelo */}
                    <section className="tr-belts" aria-label={t('trophies.shelfDuel')}>
                        <span className="tr-shelf-tag">{t('trophies.shelfDuel')}</span>
                        <div className="tr-belt-col">
                            {BELTS.map((b, i) => (
                                <Obj
                                    key={b.wins}
                                    f={{ kind: 'belt', i }}
                                    {...obj}
                                    label={t('trophies.belt', { n: b.wins })}
                                >
                                    <PixelTrophy kind="cinturao" metal={b.metal} ghost={duelWins < b.wins} />
                                </Obj>
                            ))}
                        </div>
                    </section>
                </div>

                {/* veludo com os broches das medalhas */}
                <Obj f={{ kind: 'medals' }} {...obj} label={t('trophies.medals')} className="tr-velvet">
                    {medals.map((p) => (
                        <MedalDisc
                            key={p.medal.id}
                            glyph={MEDAL_GLYPH[p.medal.id] ?? 'pokebola'}
                            tier={p.tier}
                            className={p.tier ? '' : 'tr-pin-ghost'}
                        />
                    ))}
                </Obj>

                {/* chão: vitrine de vidro, livros e TV */}
                <section className="tr-floor">
                    <Obj f={{ kind: 'glass' }} {...obj} label={t('trophies.glass')} className="tr-glass">
                        {glass.length ? (
                            glass.map((p) => (
                                <span key={p.uid} className="tr-glass-card">
                                    <FutCard inst={p} size="sm" />
                                </span>
                            ))
                        ) : (
                            <span className="tr-glass-empty">{t('trophies.glassEmpty')}</span>
                        )}
                    </Obj>
                    <Obj f={{ kind: 'books' }} {...obj} label={t('trophies.books')} className="tr-books">
                        <span className="tr-book kanto">
                            <b>I</b>
                        </span>
                        <span className="tr-book johto">
                            <b>II</b>
                        </span>
                    </Obj>
                    <Obj f={{ kind: 'tv' }} {...obj} label={t('trophies.tv')} className="tr-tv">
                        <span className="tr-tv-screen">
                            {lastCap ? (
                                <img className="pixel" src={speciesGif(lastCap.speciesId, lastCap.shiny)} alt="" />
                            ) : (
                                <PixelTrophy kind="taca" metal="bronze" ghost />
                            )}
                        </span>
                    </Obj>
                </section>
            </div>

            {focus && (
                <section ref={sheet} className="panel tr-sheet bc-surface bc-stripe" aria-live="polite">
                    <button
                        type="button"
                        className="modal-close"
                        onClick={() => setFocus(null)}
                        aria-label={t('trophies.close')}
                    >
                        <HudIcon kind="close" />
                    </button>
                    <Detail
                        f={focus}
                        cups={cups}
                        days={days}
                        weeks={weeks}
                        duelWins={duelWins}
                        platinum={platinum}
                        medalsGot={medals.filter((p) => p.tier > 0).length}
                    />
                </section>
            )}
        </div>
    );
}

/** O detalhe do objeto tocado: nome, quantos, como ganhar e o atalho pra onde ele vem. */
function Detail({
    f,
    cups,
    days,
    weeks,
    duelWins,
    platinum,
    medalsGot,
}: {
    f: Focus;
    medalsGot: number;
    cups: MetalCount;
    days: MetalCount;
    weeks: number;
    duelWins: number;
    platinum: boolean;
}) {
    const { t } = useT();
    const go = useGame((s) => s.go);
    const hall = useGame((s) => s.hall);
    const metalName = (m: Metal) => t(`trophies.metal.${m}` as TKey);
    const btn = (label: string, on: () => void) => (
        <button type="button" className="btn primary tr-go" onClick={on}>
            {label}
        </button>
    );
    const head = (title: string, n?: number) => (
        <h2 className="bc-caption tr-sheet-title">
            {title}
            {n !== undefined && <small>{n ? t('trophies.times', { n }) : t('trophies.none')}</small>}
        </h2>
    );
    switch (f.kind) {
        case 'cup': {
            const mine = hall.filter((h) => cupMetal(h) === f.metal);
            return (
                <>
                    {head(t('trophies.cup', { metal: metalName(f.metal) }), cups[f.metal])}
                    <p className="tr-how">{t(`trophies.cupHow.${f.metal}` as TKey)}</p>
                    {mine.length > 0 && <HallList only={mine.map((h) => h.id)} />}
                </>
            );
        }
        case 'daily':
            return (
                <>
                    {head(t('trophies.daily', { metal: metalName(f.metal) }), days[f.metal])}
                    <p className="tr-how">{t(`trophies.dailyHow.${f.metal}` as TKey)}</p>
                    {btn(t('trophies.go.daily'), () => go('daily'))}
                </>
            );
        case 'week':
            return (
                <>
                    {head(t('trophies.week'), weeks)}
                    <p className="tr-how">{t('trophies.weekHow')}</p>
                    {btn(t('trophies.go.daily'), () => go('daily'))}
                </>
            );
        case 'belt': {
            const b = BELTS[f.i];
            return (
                <>
                    {head(t('trophies.belt', { n: b.wins }), duelWins >= b.wins ? 1 : 0)}
                    <p className="tr-how">{t('trophies.beltHow', { n: b.wins, have: duelWins })}</p>
                    {btn(t('trophies.go.duel'), () => go('duel'))}
                </>
            );
        }
        case 'liga':
            return (
                <>
                    {head(t('trophies.liga'))}
                    <p className="tr-how">{t('trophies.ligaHow')}</p>
                </>
            );
        case 'medals':
            return (
                <>
                    {head(t('trophies.medals'))}
                    <p className="tr-how">{t('trophies.medalsHow', { n: medalsGot, total: MEDALS.length })}</p>
                    {btn(t('trophies.go.medals'), () => toProfile('medalhas'))}
                </>
            );
        case 'diploma':
            return (
                <>
                    {head(t('trophies.diploma'), platinum ? 1 : 0)}
                    <p className="tr-how">{platinum ? t('trophies.diplomaDone') : t('trophies.diplomaHow')}</p>
                    {!platinum && btn(t('trophies.go.missions'), () => toProfile('missoes'))}
                </>
            );
        case 'club':
            return (
                <>
                    {head(t('trophies.flag'))}
                    <p className="tr-how">{t('trophies.clubHow')}</p>
                    {btn(t('trophies.go.club'), () => toProfile('clube'))}
                </>
            );
        case 'glass':
            return (
                <>
                    {head(t('trophies.glass'))}
                    <p className="tr-how">{t('trophies.glassHow')}</p>
                    {btn(t('trophies.go.album'), () => toProfile('album'))}
                </>
            );
        case 'books':
            return (
                <>
                    {head(t('trophies.books'))}
                    <p className="tr-how">{t('trophies.booksHow')}</p>
                    {btn(t('trophies.go.album'), () => toProfile('album'))}
                </>
            );
        case 'tv':
            return (
                <>
                    {head(t('trophies.tv'))}
                    <p className="tr-how">{hall.length ? t('trophies.tvHow') : t('trophies.tvEmpty')}</p>
                    {hall[0] && (
                        <p className="tr-how">
                            {hall[0].club} ·{' '}
                            {t('trophies.final', {
                                a: hall[0].scores.at(-1)?.[0] ?? 0,
                                b: hall[0].scores.at(-1)?.[1] ?? 0,
                            })}
                        </p>
                    )}
                    {hall.length > 0 && (
                        <>
                            <h3 className="bc-lbl">{t('trophies.hallTitle')}</h3>
                            <HallList />
                        </>
                    )}
                </>
            );
    }
}
