import { type CSSProperties, useEffect, useState } from 'react';
import { CUP_STAGES } from '../../engine/cup';
import { weeklyEventType } from '../../engine/specials';
import { fmt, stageName, typeName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { isCupInProgress, seedFromUrl, useGame } from '../../store/game-store';
import { AccountBar } from '../components/AccountBar';
import { cupStep } from '../components/AccountLink';
import { CountUp } from '../components/CountUp';
import { HomeCourt } from '../components/HomeCourt';
import { MenuIcon } from '../components/MenuIcon';
import { cardSprite } from '../components/PokeCard';
import { Trophy } from '../components/Trophy';
import { TypeIcon } from '../components/TypeIcon';
import { FEEDBACK_URL, privacyUrl } from '../links';
import { readCount, writeCount } from '../local-count';
import { patchNotes } from '../patch-notes';
import { TYPE_COLOR } from '../type-colors';
import '../home-motion.css';

/** O que vem por aí (só vitrine: nada disso é clicável ainda). Os textos ficam em i18n (home.soon). */
const SOON_IMG = ['assets/cards/25.gif', 'assets/cards/143.gif', 'assets/ui/poke-ball.png'];

const DEX_KEY = 'soccermon-dex-last';
const DEX_TOTAL = 151;

/**
 * Pokédex cresceu desde a última visita à Home (em geral: voltou de uma copa): a barra enche de 47 até 50/151
 * com "+3 novos". O último número visto fica no navegador. Antes do save carregar a Pokédex vem vazia: só
 * grava quando o número sobe, pra não zerar a referência.
 */
function DexProgress() {
    const { t, tn } = useT();
    const seen = useGame((s) => Object.keys(s.dex).length);
    const [from] = useState(() => readCount(DEX_KEY));
    useEffect(() => {
        if (seen > (readCount(DEX_KEY) ?? -1)) writeCount(DEX_KEY, seen);
    }, [seen]);
    if (from === null || seen <= from) return null;
    const pct = (n: number) => `${Math.min(100, (n / DEX_TOTAL) * 100)}%`;
    return (
        <div className="dex-progress" role="status">
            <span className="dp-label">
                {t('home.dex.label')} {from} → <CountUp from={from} to={seen} ms={900} />/{DEX_TOTAL}
            </span>
            <span
                className="dp-bar"
                style={
                    { '--from': pct(from), '--to': pct(seen), '--split': `${(from / seen) * 100}%` } as CSSProperties
                }
            >
                <i />
            </span>
            <b className="dp-new">{tn('home.dex.new', seen - from)}</b>
        </div>
    );
}

/** Troca rápida de idioma no topo da tela inicial (as Configurações também têm). */
function LangToggle() {
    const { lang, t } = useT();
    const updateSettings = useGame((s) => s.updateSettings);
    return (
        <fieldset className="lang-toggle bc-seg" aria-label={t('home.langAria')}>
            {(['pt', 'en'] as const).map((l) => (
                <button
                    key={l}
                    type="button"
                    className={l === lang ? 'on' : ''}
                    aria-pressed={l === lang}
                    lang={l === 'pt' ? 'pt-BR' : 'en'}
                    title={l === 'pt' ? 'Português (Brasil)' : 'English'}
                    onClick={() => updateSettings({ lang: l })}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </fieldset>
    );
}

/** `?home=forte`: enfeites da Home (logo, brilho, pulos) com o dobro da intensidade, pra comparar. */
const HOME_FORTE = new URLSearchParams(window.location.search).get('home') === 'forte';

/** A entrada da Home (título sobe, botões em cascata) só na 1ª vez que o jogo abre; voltar pra Home é na hora. */
let homeEntered = false;

export function Home() {
    const [entering] = useState(() => !homeEntered);
    useEffect(() => {
        homeEntered = true;
    }, []);
    const { run, newRun, go, records, profile, setOnboarded, parkedRuns, resumeParked, discardParked } = useGame();
    const { t, tn, d, lang } = useT();
    const notes = patchNotes(lang);
    const [teamName, setTeamName] = useState(profile.clubName || 'Pallet FC');
    // o perfil chega do IndexedDB/nuvem depois do primeiro render: acompanha até a pessoa digitar
    const [typed, setTyped] = useState(false);
    useEffect(() => {
        if (!typed) setTeamName(profile.clubName || 'Pallet FC');
    }, [profile.clubName, typed]);
    const [notesOpen, setNotesOpen] = useState(false);
    useEffect(() => {
        if (!notesOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNotesOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [notesOpen]);
    const challengeSeed = seedFromUrl();
    const inProgress = run && !['eliminated', 'champion'].includes(run.status);
    const resumeScreen =
        run && ['formation', 'captain', 'drafting'].includes(run.status)
            ? 'draft'
            : run?.status === 'reward'
              ? 'reward'
              : 'lineup';
    const name = () => teamName.trim() || 'Pallet FC';
    /** Começar outra copa apaga a atual: com uma em andamento, pede confirmação antes. */
    const [confirm, setConfirm] = useState<string | null | undefined>(undefined);
    const start = (seed?: string) => {
        if (inProgress && confirm === undefined) setConfirm(seed ?? null);
        else newRun(name(), seed);
    };
    /** Copas guardadas (vieram de um conflito entre aparelho e conta): retomar troca de lugar com a atual. */
    const parked = parkedRuns.filter(isCupInProgress);
    const [parkedAsk, setParkedAsk] = useState<{ kind: 'swap' | 'discard'; seed: string } | null>(null);
    const parkedTarget = parkedAsk ? parked.find((p) => p.seed === parkedAsk.seed) : undefined;
    const resume = (seed: string) => {
        // sem copa em andamento não há o que guardar no lugar: retoma direto
        if (inProgress) setParkedAsk({ kind: 'swap', seed });
        else resumeParked(seed);
    };
    const eventType = weeklyEventType(new Date());
    const byUid = new Map(run?.picks.map((p) => [p.uid, p]) ?? []);
    const squad = run ? run.lineup.flatMap((u) => byUid.get(u) ?? []) : [];
    const runStep =
        run && ['formation', 'captain', 'drafting'].includes(run.status)
            ? t('home.draftStep', { n: Math.min(run.draftRound + 1, 7) })
            : run?.status === 'reward'
              ? t('home.choosingReward')
              : run
                ? stageName(run.stage)
                : '';
    const openLab = (q: string) => {
        window.location.search = q;
    };
    const tile = (k: keyof typeof d.home.tiles, vars?: Record<string, string>) => (
        <>
            <span>
                <b>{d.home.tiles[k][0]}</b>
                <small>{fmt(d.home.tiles[k][1], vars)}</small>
            </span>
        </>
    );

    return (
        <div className={`home${entering ? ' home-enter' : ''}${HOME_FORTE ? ' home-forte' : ''}`}>
            <div className="home-top">
                <div
                    className="event-banner bc-surface bc-stripe"
                    style={{ '--tc': TYPE_COLOR[eventType] } as CSSProperties}
                >
                    <TypeIcon type={eventType} size={28} />
                    <div>
                        <b>{t('home.eventWeek', { type: typeName(eventType) })}</b>
                        <span>{t('home.eventText', { type: typeName(eventType) })}</span>
                    </div>
                </div>
                <LangToggle />
                <button
                    type="button"
                    className="help-fab"
                    aria-label={t('home.helpAria')}
                    title={t('home.helpTitle')}
                    onClick={() => setOnboarded(false)}
                >
                    <MenuIcon kind="help" />
                </button>
            </div>

            <section className="home-hero">
                <HomeCourt />
                {/* logo da beta (trailer/arte/logo: "Evolução", o O é uma carta holográfica com a bola) */}
                <h1 className="logo logo-img">
                    <img src="assets/ui/logo.svg" alt="Soccermon" width="1468" height="300" />
                </h1>
                <p className="tagline">{t('home.tagline')}</p>
            </section>

            <DexProgress />

            <div className="mode-cards">
                <div className="menu panel mode-card cup-card">
                    <div className="mode-head bc-screenhead">
                        <span className="bc-tag">{t('home.cupTag')}</span>
                        <b>{t('duel.cupTitle')}</b>
                        <span>{t('duel.cupLine')}</span>
                    </div>
                    {parkedAsk && parkedTarget ? (
                        <div className="confirm-new">
                            <p>
                                {parkedAsk.kind === 'swap'
                                    ? rich(t('account.confirmSwap'), {
                                          team: <b>{parkedTarget.teamName}</b>,
                                          current: <b>{run?.teamName}</b>,
                                      })
                                    : rich(t('account.confirmDiscard'), { team: <b>{parkedTarget.teamName}</b> })}
                            </p>
                            <div className="row" style={{ justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    className="btn primary"
                                    onClick={() => {
                                        if (parkedAsk.kind === 'swap') resumeParked(parkedAsk.seed);
                                        else discardParked(parkedAsk.seed);
                                        setParkedAsk(null);
                                    }}
                                >
                                    {parkedAsk.kind === 'swap'
                                        ? t('account.confirmSwapYes')
                                        : t('account.confirmDiscardYes')}
                                </button>
                                <button type="button" className="btn ghost" onClick={() => setParkedAsk(null)}>
                                    {t('common.ui.cancel')}
                                </button>
                            </div>
                        </div>
                    ) : confirm !== undefined ? (
                        <div className="confirm-new">
                            <p>{rich(t('home.confirmNew'), { team: <b>{run?.teamName}</b> })}</p>
                            <div className="row" style={{ justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    className="btn primary"
                                    onClick={() => newRun(name(), confirm ?? undefined)}
                                >
                                    {t('home.confirmYes')}
                                </button>
                                <button type="button" className="btn ghost" onClick={() => setConfirm(undefined)}>
                                    {t('common.ui.cancel')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {inProgress && run && (
                                <button
                                    type="button"
                                    className="resume-card bc-surface bc-stripe"
                                    onClick={() => go(resumeScreen)}
                                >
                                    <span className="rc-label bc-tag">{t('home.inProgress')}</span>
                                    <b className="rc-team">{run.teamName}</b>
                                    <span className="rc-step">{runStep}</span>
                                    <span className="rc-path" title={t('home.cupPath')}>
                                        {CUP_STAGES.map((st, i) => {
                                            const r = run.results.find((x) => x.stage === i);
                                            const cls = r ? (r.won ? 'won' : 'lost') : i === run.stage ? 'now' : '';
                                            return <i key={st} className={cls} />;
                                        })}
                                    </span>
                                    {squad.length > 0 && (
                                        <span className="rc-squad">
                                            {squad.map((p) => (
                                                <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                                            ))}
                                        </span>
                                    )}
                                    <span className="btn primary rc-go">{t('home.resume')}</span>
                                </button>
                            )}
                            {parked.map((p) => (
                                <div key={p.seed} className="parked-row">
                                    <span className="pr-text">
                                        <span className="pr-label">{t('account.parkedLabel')}</span>
                                        <span>
                                            <b>{p.teamName}</b> <span className="pr-step">· {cupStep(p)}</span>
                                        </span>
                                    </span>
                                    <button type="button" className="btn small" onClick={() => resume(p.seed)}>
                                        {t('account.resumeParked')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn ghost small"
                                        onClick={() => setParkedAsk({ kind: 'discard', seed: p.seed })}
                                    >
                                        {t('account.discardParked')}
                                    </button>
                                </div>
                            ))}
                            <label className="bc-lbl" htmlFor="team-name">
                                {inProgress ? t('home.orNew') : t('home.teamName')}
                            </label>
                            <div className="new-run">
                                <input
                                    id="team-name"
                                    className="team-name-input"
                                    value={teamName}
                                    maxLength={22}
                                    onChange={(e) => {
                                        setTyped(true);
                                        setTeamName(e.target.value);
                                    }}
                                />
                                <button
                                    type="button"
                                    className={`btn ${inProgress ? 'ghost' : 'primary'} big`}
                                    onClick={() => start()}
                                >
                                    {t('home.newCup')}
                                </button>
                            </div>
                            {challengeSeed && (
                                <button type="button" className="btn yellow" onClick={() => start(challengeSeed)}>
                                    {t('home.challenge', { seed: challengeSeed })}
                                </button>
                            )}
                        </>
                    )}
                </div>
                <div className="panel mode-card duel-card beta-ribbon" data-ribbon={t('duel.beta')}>
                    <div className="mode-head">
                        <b>{t('duel.title')}</b>
                        <span>{t('duel.line')}</span>
                    </div>
                    <span className="duel-card-art" aria-hidden>
                        <img className="pixel" src="assets/cards/25.gif" alt="" />
                        <b>VS</b>
                        <img className="pixel flip" src="assets/cards/133.gif" alt="" />
                    </span>
                    <button type="button" className="btn duel-go" onClick={() => go('duel')}>
                        {t('duel.createRoom')}
                    </button>
                </div>
            </div>

            {/* entrar com o Google: embaixo dos modos, pro "Nova copa" ficar na primeira tela do celular */}
            <AccountBar />

            {records.cups > 0 && (
                <div className="records">
                    <span className="rec-titles">
                        <Trophy size={30} />
                        <b>{records.titles}</b> {tn('home.rec.titles', records.titles)}
                    </span>
                    <span>
                        <b>{records.cups}</b> {tn('home.rec.cups', records.cups)}
                    </span>
                    <span>
                        <b>{records.perfect}</b> {tn('home.rec.perfect', records.perfect)}
                    </span>
                    {(records.destaques ?? 0) > 0 && (
                        <span>
                            <b>{records.destaques}</b> {tn('home.rec.destaques', records.destaques ?? 0)}
                        </span>
                    )}
                    {(records.evolucoes ?? 0) > 0 && (
                        <span>
                            <b>{records.evolucoes}</b> {tn('home.rec.evolucoes', records.evolucoes ?? 0)}
                        </span>
                    )}
                    {(records.icones ?? 0) > 0 && (
                        <span>
                            <b>{records.icones}</b> {tn('home.rec.icones', records.icones ?? 0)}
                        </span>
                    )}
                </div>
            )}

            <nav className="home-tiles" aria-label={t('common.ui.menu')}>
                <button type="button" className="home-tile bc-tile" onClick={() => go('profile')}>
                    <MenuIcon kind="profile" />
                    {tile('profile')}
                </button>
                <button type="button" className="home-tile bc-tile" onClick={() => openLab('?lab=golpes')}>
                    <MenuIcon kind="moves" />
                    {tile('moves')}
                </button>
                <button type="button" className="home-tile bc-tile" onClick={() => go('help')}>
                    <MenuIcon kind="help" />
                    {tile('help')}
                </button>
                <button type="button" className="home-tile bc-tile" onClick={() => setNotesOpen(true)}>
                    <MenuIcon kind="news" />
                    {tile('news', { v: notes[0].version })}
                    <em className="tile-badge">v{notes[0].version}</em>
                </button>
                <button type="button" className="home-tile bc-tile" onClick={() => go('settings')}>
                    <MenuIcon kind="settings" />
                    {tile('settings')}
                </button>
                <button type="button" className="home-tile bc-tile" onClick={() => go('credits')}>
                    <MenuIcon kind="credits" />
                    {tile('credits')}
                </button>
                <a className="home-tile bc-tile" href={FEEDBACK_URL} target="_blank" rel="noopener">
                    <MenuIcon kind="feedback" />
                    {tile('feedback')}
                </a>
                {import.meta.env.DEV && (
                    <button type="button" className="home-tile bc-tile dev" onClick={() => openLab('?cards=1')}>
                        <MenuIcon kind="cards" />
                        {tile('cards')}
                    </button>
                )}
            </nav>
            {notesOpen && (
                // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; o botão fecha pelo teclado
                <div className="modal-backdrop" onClick={() => setNotesOpen(false)} role="presentation">
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
                    <div
                        className="modal panel patch-notes"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('home.news')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setNotesOpen(false)}
                            aria-label={t('common.ui.close')}
                            // biome-ignore lint/a11y/noAutofocus: o foco vai para dentro da janela que acabou de abrir
                            autoFocus
                        >
                            ×
                        </button>
                        {notes.map((n) => (
                            <div key={n.version} className="patch-version">
                                <h2 className="bc-caption">{t('home.version', { v: n.version, title: n.title })}</h2>
                                {n.sections.map((sec) => (
                                    <div key={sec.title}>
                                        <h3>{sec.title}</h3>
                                        <ul>
                                            {sec.lines.map((l) => (
                                                <li key={l}>{l}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <section className="soon" aria-label={t('home.soonTitle')}>
                <h2 className="bc-caption">{t('home.soonTitle')}</h2>
                <div className="soon-grid">
                    {d.home.soon.map((c, i) => (
                        <div key={SOON_IMG[i]} className="soon-card" data-ribbon={t('home.soonRibbon')}>
                            <img className="pixel" src={SOON_IMG[i]} alt="" />
                            <b>{c.title}</b>
                            <span>{c.text}</span>
                        </div>
                    ))}
                </div>
            </section>
            <p className="disclaimer">
                {t('home.disclaimer', { v: __APP_VERSION__.replace(/\.0$/, '') })}{' '}
                <a href={privacyUrl()} target="_blank" rel="noopener">
                    {t('home.privacy')}
                </a>{' '}
                ·{' '}
                <a href="https://github.com/miguel20br/soccermon" target="_blank" rel="noopener">
                    {t('home.github')}
                </a>
            </p>
        </div>
    );
}
