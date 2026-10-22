import { type CSSProperties, useEffect, useState } from 'react';
import { weeklyEventType } from '../../engine/specials';
import { typeName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { isCupInProgress, resumeScreenOf, seedFromUrl, useGame } from '../../store/game-store';
import { seenCount } from '../../store/profile';
import { AccountBar } from '../components/AccountBar';
import { cupStep } from '../components/AccountLink';
import { CountUp } from '../components/CountUp';
import { HomeCourt } from '../components/HomeCourt';
import { cardSprite } from '../components/PokeCard';
import { TypeIcon } from '../components/TypeIcon';
import { FEEDBACK_URL, privacyUrl } from '../links';
import { readCount, writeCount } from '../local-count';
import { patchNotes } from '../patch-notes';
import { FriendChallenge } from '../profile/FriendsTab';
import { TYPE_COLOR } from '../type-colors';
import { HomeDailyCard } from './Daily';
import '../home-motion.css';
import { type CupMode, cupLength, isLong, LONG_CUP_LIVE } from '../../store/long-cup';
import { Coach } from '../coach/Coach';
import { ComingSoon } from '../components/ComingSoon';
import { DoorTiles } from '../components/DoorTiles';
import { HudIcon } from '../components/MatchHud';
import { TopActions } from '../components/TopActions';

const DEX_KEY = 'soccermon-dex-last';
/** Os 8 líderes de ginásio de Kanto, a arte do cartão da Rota Índigo. */
const GYM_LEADERS = ['brock', 'misty', 'ltsurge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni'];
const DEX_TOTAL = 151;

/**
 * Pokédex cresceu desde a última visita à Home (em geral: voltou de uma copa): a barra enche de 47 até 50/151
 * com "+3 novos". O último número visto fica no navegador. Antes do save carregar a Pokédex vem vazia: só
 * grava quando o número sobe, pra não zerar a referência.
 */
function DexProgress() {
    const { t, tn } = useT();
    const seen = useGame((s) => seenCount(s.dex));
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

/** Troca rápida de idioma no rodapé da tela inicial (as Configurações também têm). */
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
    const { run, newRun, go, profile, records, parkedRuns, resumeParked, discardParked } = useGame();
    const { t, d, lang } = useT();
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
    const resumeScreen = run ? resumeScreenOf(run.status) : 'lineup';
    const name = () => teamName.trim() || 'Pallet FC';
    /** Começar outra copa apaga a atual: com uma em andamento, pede confirmação antes. */
    const [confirm, setConfirm] = useState<string | null | undefined>(undefined);
    // modo da copa que vai começar (a Copa longa passa pela mesma confirmação de "apagar a atual")
    const [pendingMode, setPendingMode] = useState<CupMode | undefined>(undefined);
    const start = (seed?: string, mode?: CupMode) => {
        setPendingMode(mode);
        if (inProgress && confirm === undefined) setConfirm(seed ?? null);
        else newRun(name(), seed, undefined, mode);
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
    const runStep = run ? cupStep({ ...run, played: run.results.length }) : '';
    const openLab = (q: string) => {
        window.location.search = q;
    };

    /** A Rota Índigo é NOVO até a 1ª Rota (terminada ou em andamento). */
    const rotaNew = LONG_CUP_LIVE && !records.longCups && !isLong(run);
    /** Um vermelho por tela: Continuar com copa em andamento; senão a Rota enquanto é NOVO; depois, a Nova copa. */
    const red = inProgress ? 'resume' : rotaNew ? 'rota' : 'quick';
    const confirmBox = (
        <div className="confirm-new">
            <p>{rich(t('home.confirmNew'), { team: <b>{run?.teamName}</b> })}</p>
            <div className="row" style={{ justifyContent: 'center' }}>
                <button
                    type="button"
                    className="btn primary"
                    onClick={() => newRun(name(), confirm ?? undefined, undefined, pendingMode)}
                >
                    {t('home.confirmYes')}
                </button>
                <button type="button" className="btn ghost" onClick={() => setConfirm(undefined)}>
                    {t('common.ui.cancel')}
                </button>
            </div>
        </div>
    );
    const resumeCard = run && (
        <button type="button" className="resume-card bc-surface bc-stripe" onClick={() => go(resumeScreen)}>
            <span className="rc-label bc-tag">{t('home.inProgress')}</span>
            <b className="rc-team">{run.teamName}</b>
            <span className="rc-step">{runStep}</span>
            <span className="rc-path" title={t('home.cupPath')}>
                {Array.from({ length: cupLength(run) }, (_, i) => `p${i}`).map((st, i) => {
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
    );

    return (
        <div className={`home${entering ? ' home-enter' : ''}${HOME_FORTE ? ' home-forte' : ''}`}>
            <div className="home-top">
                <TopActions help={() => go('help')} />
            </div>

            <section className="home-hero">
                <HomeCourt />
                {/* logo (trailer/arte/logo/final: o O é a carta holo com a bola; publicar.mjs copia pra cá) */}
                <h1 className="logo logo-img">
                    <img src="assets/ui/logo.svg" alt="Soccermon" width="1441" height="300" />
                </h1>
                <p className="tagline">{t('home.tagline')}</p>
            </section>

            <Coach id="intro" targets={['[data-coach="quick"]', '[data-coach="help"]']} />
            <DexProgress />

            <div className="mode-cards">
                {LONG_CUP_LIVE && (
                    <div className="menu panel mode-card rota-card">
                        <div className="mode-head">
                            <b>
                                {t('home.longCup.title')}
                                {rotaNew && <span className="bc-tag rota-new">{t('profile.news.badge')}</span>}
                            </b>
                            <span>{t('home.longCup.line')}</span>
                        </div>
                        {confirm !== undefined && pendingMode === 'longa' ? (
                            confirmBox
                        ) : (
                            <>
                                {inProgress && isLong(run) ? (
                                    resumeCard
                                ) : (
                                    <span className="rota-art" aria-hidden>
                                        {GYM_LEADERS.map((id) => (
                                            <img key={id} src={`assets/trainers/${id}.png`} alt="" />
                                        ))}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={`btn big cup-go cup-go-long ${red === 'rota' ? 'primary' : 'outline'}`}
                                    onClick={() => start(undefined, 'longa')}
                                >
                                    <span className="cup-go-txt">
                                        <b>{t('home.longCup.go')}</b>
                                        <small>{t('home.longCup.tag')}</small>
                                    </span>
                                    <HudIcon kind="next" />
                                </button>
                            </>
                        )}
                    </div>
                )}
                <div className="menu panel mode-card cup-card">
                    <div className="mode-head">
                        <b>{t('home.quickCup.title')}</b>
                        <span>{t('home.quickCup.line')}</span>
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
                    ) : confirm !== undefined && pendingMode !== 'longa' ? (
                        confirmBox
                    ) : (
                        <>
                            {inProgress && !isLong(run) && resumeCard}
                            {parked.map((p) => (
                                <div key={p.seed} className="parked-row">
                                    <span className="pr-text">
                                        <span className="pr-label">{t('account.parkedLabel')}</span>
                                        <span>
                                            <b>{p.teamName}</b>{' '}
                                            <span className="pr-step">
                                                · {cupStep({ ...p, played: p.results.length })}
                                            </span>
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
                                data-coach="quick"
                                className={`btn big cup-go cup-go-quick ${red === 'quick' ? 'primary' : 'outline'}`}
                                onClick={() => start()}
                            >
                                <span className="cup-go-txt">
                                    <b>{t('home.newCup')}</b>
                                    <small>{t('home.quickCup.tag')}</small>
                                </span>
                                <HudIcon kind="next" />
                            </button>
                            <p
                                className="cup-event bc-stripe"
                                style={{ '--tc': TYPE_COLOR[eventType] } as CSSProperties}
                            >
                                <TypeIcon type={eventType} size={20} />
                                <span>
                                    <b>{t('home.eventWeek', { type: typeName(eventType) })}</b>{' '}
                                    {t('home.eventText', { type: typeName(eventType) })}
                                </span>
                            </p>
                            {challengeSeed && (
                                <button type="button" className="btn outline" onClick={() => start(challengeSeed)}>
                                    {t('home.challenge', { seed: challengeSeed })}
                                </button>
                            )}
                        </>
                    )}
                </div>
                {/* Duelo e Copa do Dia: no PC lado a lado, com a mesma largura e altura */}
                <div className="mode-pair">
                    <div className="panel mode-card duel-card beta-ribbon" data-ribbon={t('duel.beta')}>
                        <div className="dc-row">
                            <span className="duel-card-art" aria-hidden>
                                <img className="pixel" src="assets/cards/25.gif" alt="" />
                                <b>VS</b>
                                <img className="pixel flip" src="assets/cards/133.gif" alt="" />
                            </span>
                            <div className="mode-head">
                                <b>{t('duel.title')}</b>
                                <span>{t('duel.line')}</span>
                            </div>
                            <button type="button" className="btn dc-go duel-go" onClick={() => go('duel')}>
                                {t('duel.createRoom')}
                            </button>
                        </div>
                        <FriendChallenge />
                    </div>
                    <HomeDailyCard />
                </div>
            </div>

            {/* entrar com o Google: embaixo dos modos, pro "Nova copa" ficar na primeira tela do celular */}
            <AccountBar />

            <ComingSoon />

            <DoorTiles which={['profile', 'collection', 'trophies']} />
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
                            <HudIcon kind="close" />
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
            <footer className="home-footer">
                <nav className="footer-links" aria-label={t('home.footerAria')}>
                    <button type="button" className="link-btn" onClick={() => setNotesOpen(true)}>
                        {d.home.tiles.news[0]} <em className="tile-badge">v{notes[0].version}</em>
                    </button>
                    <button type="button" className="link-btn" onClick={() => go('help')}>
                        {d.home.tiles.help[0]}
                    </button>
                    <button type="button" className="link-btn" onClick={() => go('credits')}>
                        {d.home.tiles.credits[0]}
                    </button>
                    <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                        {d.home.tiles.feedback[0]}
                    </a>
                    <a href={privacyUrl()} target="_blank" rel="noopener">
                        {t('home.privacy')}
                    </a>
                    <a href="https://github.com/miguel20br/soccermon" target="_blank" rel="noopener">
                        {t('home.github')}
                    </a>
                    {import.meta.env.DEV && (
                        <button type="button" className="link-btn" onClick={() => openLab('?cards=1')}>
                            {d.home.tiles.cards[0]}
                        </button>
                    )}
                </nav>
                {/* fora da linha dos links: ao trocar o idioma os links mudam de largura e o botão ficava pulando */}
                <LangToggle />
                <p className="disclaimer">{t('home.disclaimer', { v: __APP_VERSION__.replace(/\.0$/, '') })}</p>
            </footer>
        </div>
    );
}
