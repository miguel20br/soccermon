import { type CSSProperties, useEffect, useState } from 'react';
import { weeklyEventType } from '../../engine/specials';
import { typeName } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { resumeScreenOf, seedFromUrl, useGame } from '../../store/game-store';
import { seenCount } from '../../store/profile';
import { AboutFooter } from '../components/AboutFooter';
import { AccountBar } from '../components/AccountBar';
import { cupStep } from '../components/AccountLink';
import { CountUp } from '../components/CountUp';
import { HomeCourt } from '../components/HomeCourt';
import { LogoHits } from '../components/LogoHits';
import { ParkedRuns } from '../components/ParkedRuns';
import { cardSprite } from '../components/PokeCard';
import { TypeIcon } from '../components/TypeIcon';
import { readCount, writeCount } from '../local-count';
import { FriendChallenge } from '../profile/FriendsTab';
import { TYPE_COLOR } from '../type-colors';
import { HomeDailyCard } from './Daily';
import '../home-motion.css';
import { isFirstVisit, rotaNovaDue } from '../../store/coach';
import { type CupMode, cupLength, isLong, LONG_CUP_LIVE, lossColor } from '../../store/long-cup';
import { Coach, markSeen, useHydrated } from '../coach/Coach';
import { ComingSoon } from '../components/ComingSoon';
import { DoorTiles } from '../components/DoorTiles';
import { HudIcon } from '../components/MatchHud';
import { TopActions } from '../components/TopActions';
import { openPage } from '../doors';

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

/** `?home=forte`: enfeites da Home (logo, brilho, pulos) com o dobro da intensidade, pra comparar. */
const HOME_FORTE = new URLSearchParams(window.location.search).get('home') === 'forte';

/** A entrada da Home (título sobe, botões em cascata) só na 1ª vez que o jogo abre; voltar pra Home é na hora. */
let homeEntered = false;

type Run = NonNullable<ReturnType<typeof useGame.getState>['run']>;

/** Cartão da copa em andamento (Home e Estádio dos ambientes): time, fase, caminho e o elenco. */
export function ResumeCard({ run, onClick }: { run: Run; onClick: () => void }) {
    const { t } = useT();
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const squad = run.lineup.flatMap((u) => byUid.get(u) ?? []);
    const runStep = cupStep({ ...run, played: run.results.length });
    return (
        <button type="button" className="resume-card bc-surface bc-stripe" onClick={onClick}>
            <span className="rc-label bc-tag">{t('home.inProgress')}</span>
            <b className="rc-team">{run.teamName}</b>
            <span className="rc-step">{runStep}</span>
            <span className="rc-path" title={t('home.cupPath')}>
                {Array.from({ length: cupLength(run) }, (_, i) => `p${i}`).map((st, i) => {
                    const r = run.results.find((x) => x.stage === i);
                    const cls = r ? (r.won ? 'won' : `lost-${lossColor(run, i)}`) : i === run.stage ? 'now' : '';
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
}

export function Home() {
    const [entering] = useState(() => !homeEntered);
    useEffect(() => {
        homeEntered = true;
    }, []);
    const { run, newRun, go, profile, records } = useGame();
    const { t } = useT();
    // 1ª visita: só o "Jogar" (Copa Relâmpago). Antes do save carregar não dá pra saber: só o topo e o rodapé
    const hydrated = useHydrated();
    const firstVisit = useGame(isFirstVisit);
    const [more, setMore] = useState(false);
    const [teamName, setTeamName] = useState(profile.clubName || 'Pallet FC');
    // o perfil chega do IndexedDB/nuvem depois do primeiro render: acompanha até a pessoa digitar
    const [typed, setTyped] = useState(false);
    useEffect(() => {
        if (!typed) setTeamName(profile.clubName || 'Pallet FC');
    }, [profile.clubName, typed]);
    const challengeSeed = seedFromUrl();
    const simple = firstVisit && !more && !challengeSeed;
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
    const eventType = weeklyEventType(new Date());

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
                    className="btn confirm"
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
    const resumeCard = run && <ResumeCard run={run} onClick={() => go(resumeScreen)} />;

    const play = () => {
        // o balão "Primeira vez? Comece pela Relâmpago" não faz sentido depois: a Home cheia chega sem ele
        markSeen(['intro']);
        newRun(name());
    };

    return (
        <div
            className={`home${entering ? ' home-enter' : ''}${more ? ' home-more' : ''}${HOME_FORTE ? ' home-forte' : ''}`}
        >
            <div className="home-top">
                <TopActions help={() => openPage('help')} />
            </div>

            <section className="home-hero">
                <HomeCourt />
                {/* logo (trailer/arte/logo/final: o O é a carta holo com a bola; publicar.mjs copia pra cá) */}
                <h1 className="logo logo-img">
                    <img src="assets/ui/logo.svg" alt="Soccermon" width="1441" height="300" />
                    <LogoHits idle />
                </h1>
                <p className="tagline">{t('home.tagline')}</p>
            </section>

            {!hydrated ? null : simple ? (
                <div className="first-play">
                    <button type="button" className="btn big primary cup-go first-go" onClick={play}>
                        <span className="cup-go-txt">
                            <b>{t('home.play')}</b>
                            <small>{t('home.playTag')}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                    <button type="button" className="link-btn first-more" onClick={() => setMore(true)}>
                        {t('home.moreModes')}
                    </button>
                </div>
            ) : (
                <>
                    <Coach id="intro" targets={['[data-coach="quick"]', '[data-coach="help"]']} />
                    {LONG_CUP_LIVE && (
                        <Coach
                            id="rotaNova"
                            targets={['[data-coach="rota"]']}
                            when={rotaNovaDue(records, profile.coach)}
                        />
                    )}
                    <DexProgress />

                    {/* o nome vale pra Rota e pra Relâmpago: fica acima dos dois cartões */}
                    <div className="team-name-row">
                        <label className="bc-lbl" htmlFor="team-name">
                            {t('home.teamName')}
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
                    </div>

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
                                            data-coach="rota"
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
                            {confirm !== undefined && pendingMode !== 'longa' ? (
                                confirmBox
                            ) : (
                                <>
                                    {inProgress && !isLong(run) && resumeCard}
                                    <ParkedRuns />
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
                                        <button
                                            type="button"
                                            className="btn outline"
                                            onClick={() => start(challengeSeed)}
                                        >
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
                </>
            )}
            <AboutFooter />
        </div>
    );
}
