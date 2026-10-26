import { useEffect, useMemo, useRef, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { clubLeader, cupRival } from '../../engine/cup';
import { species } from '../../engine/data';
import { viewInstance } from '../../engine/instance';
import type { MatchResult } from '../../engine/runners/batch-runner';
import {
    type CornerPlan,
    isCornerOrder,
    isLineupOrder,
    isSubOrder,
    isTacticOrder,
    type MatchEvent,
    type MatchOrder,
    type MaxGrade,
    SNAP_STRIDE,
    type Tactic,
    type TeamSetup,
} from '../../engine/state';
import { skinOf } from '../../game/animation-manager';
import { setVolume } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchSceneData } from '../../game/scenes/MatchScene';
import { clubName, cupStageName, cupStageShort, formationText } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { ligaRun, useLiga } from '../../league/liga-store';
import { PhaserGame } from '../../PhaserGame';
import { fieldKit, lookOfCupClub, lookOfProfile, matchLooks } from '../../store/club-kit';
import { relampagoJogoDue } from '../../store/coach';
import { liveOf, type PlaybackSpeed, playerTeam, useGame } from '../../store/game-store';
import { isFinalStage, isLong } from '../../store/long-cup';
import { rivalColor, tagFromName } from '../../store/profile';
import { Coach } from '../coach/Coach';
import { Commentator, type CommentLine } from '../commentary';
import { BattleText } from '../components/BattleText';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { HalftimePanel, rivalHtSubs } from '../components/HalftimePanel';
import { MatchHighlight } from '../components/MatchHighlight';
import {
    type Clock,
    type CoachTab,
    CoachTabs,
    FinalBanner,
    HudIcon,
    hex,
    MatchFeed,
    PressureBar,
    ResultButton,
    Scoreboard,
    subSuggestion,
    TacticControls,
    TIRED_HINT,
    Ticker,
    useClockParts,
    useCoachTab,
    useFinalHold,
} from '../components/MatchHud';
import { PlayerInspect } from '../components/PlayerInspect';
import { cardSprite } from '../components/PokeCard';
import { type BoardPlan, Prancheta, useMedia, WIDE } from '../components/Prancheta';
import {
    agencyView,
    CharangaCue,
    capFxType,
    MaxBars,
    MaxCueButton,
    MaxThumb,
    maxCueAt,
    maxLit,
    PenaltyOrderPanel,
    type PenaltyTaker,
    SidelineControls,
    SidelineOverlay,
    TimeoutPanel,
} from '../components/Sideline';
import { sponsorBoards } from '../components/SponsorCard';
import { TeamPanel } from '../components/TeamPanel';
import { VersusIntro } from '../components/VersusIntro';
import { useCourtFollow } from '../court-follow';
import { RivalEmotes } from '../duel/Emotes';
import { rivalEmotes } from '../duel/emote-faces';
import { readHud } from '../hud-lab';
import { playMoment } from '../kit/MomentWipe';
import { Sheet } from '../kit/Sheet';
import { LeaveConfirm } from '../leave-guard';
import { captainAt, clockExtrasAt, type MaxWait, maxWaitNext, roleAt, snapAt } from '../match-view';
import { maxGradeNow } from '../max-beat';
import { matchMusic, penaltyMusic } from '../music-sync';
import { bannerText, useClubColor } from '../profile/club';
import { reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';

/** Velocidades (o rótulo de 'highlights' vem do dicionário: "Lances"). */
const SPEEDS: { value: PlaybackSpeed; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' },
    { value: 'highlights', label: '' },
];

/** A mudança vale ~2 s de jogo à frente (dá tempo de resimular sem pular nada). */
const CHANGE_LEAD_TICKS = 40;
/** No modo "Lances" o ritmo varia (1x perto dos lances, 16x no resto): na média fica perto de 4x. */
const HIGHLIGHTS_MULT = 4;

/** De quanto em quanto tempo (real) o ponto da partida é salvo para poder retomar. */
const SAVE_EVERY_MS = 1500;

/** `liga`: partida contra um time fantasma (src/league): a mesma tela, com a partida da Liga no lugar da copa. */
/** Sheets da partida no ?lab=hud: Tática, Trocar (Posições), Tempo e Lances. */
type HudSheet = 'tactic' | 'board' | 'time' | 'feed';

export function Match({ liga = false }: { liga?: boolean }) {
    const store = useGame();
    const { match, settings, updateSettings, setMatch, go } = store;
    const ligaOpen = useLiga((s) => s.open);
    // a partida da Liga vira uma copa de 1 fase (montada uma vez: as ordens vêm do estado da tela)
    const ligaRunRef = useRef(liga && ligaOpen ? ligaRun(ligaOpen, useLiga.getState().live) : null);
    const run = liga ? ligaRunRef.current : store.run;
    const saveLive = liga ? useLiga.getState().saveLive : store.saveLive;
    // na Liga quem grava é o servidor: o apito final manda as ordens e ele refaz a partida
    const recordResult = liga ? useLiga.getState().finish : store.recordResult;
    const saveLiveRef = useRef(saveLive);
    saveLiveRef.current = saveLive;
    const { t, d } = useT();
    // retomando uma partida que ficou no meio: mesmo ponto e mesmas ordens
    const resume = useRef(liveOf(run)).current;
    const [fontsReady, setFontsReady] = useState(false);
    const [lines, setLines] = useState<(CommentLine & { id: number })[]>([]);
    const lineId = useRef(0);
    const [clock, setClock] = useState<Clock>({ tick: 0, minute: 0, half: 1, score: [0, 0], phase: 'kickoff' });
    const [shootout, setShootout] = useState<[number, number] | null>(null);
    const [ended, setEnded] = useState(false);
    const [orders, setOrders] = useState<MatchOrder[]>(() => resume?.orders ?? []);
    /** Substituições que já aconteceram em campo (uid de quem entrou). */
    const [subsDone, setSubsDone] = useState<string[]>([]);
    /** A partida está parada no intervalo esperando o técnico. */
    const [halftime, setHalftime] = useState(false);
    const halftimeRef = useRef<HTMLDivElement>(null);
    const [subOut, setSubOut] = useState<{ uid: string } | null>(null);
    const [pending, setPending] = useState(false);
    /** "Esperar" no golpe máximo (`maxWaitNext`): apaga o aviso; a quadra sai da câmera lenta (`match:max-wait`). */
    const [maxWait, setMaxWait] = useState<MaxWait | null>(null);
    useEffect(() => {
        EventBus.emit('match:max-wait', maxWait !== null);
    }, [maxWait]);
    /** A cena Phaser só escuta comandos depois de carregar; até lá os controles ficam travados. */
    const [sceneReady, setSceneReady] = useState(false);
    /** Se a quadra demorar demais (celular fraco, aba em segundo plano), oferece recarregar. */
    const [sceneSlow, setSceneSlow] = useState(false);
    /** Tela de VERSUS antes do apito inicial; a cena espera parada até ela sair. */
    const [introDone, setIntroDone] = useState(!!resume?.tick);
    const introDoneRef = useRef(!!resume?.tick);
    const [sceneKey, setSceneKey] = useState(0);
    const [fulltime, setFulltime] = useState(false);
    const [tacticError, setTacticError] = useState<string | null>(null);
    /** Tick do pedido de tempo em que a quadra está parada (null = jogando). */
    const [timeoutAt, setTimeoutAt] = useState<number | null>(null);
    /** Tick do apito final, parado pra escolher a ordem dos pênaltis. */
    const [penPick, setPenPick] = useState<number | null>(null);
    const alive = useRef(true);
    // painel do técnico: no desktop a Tática fica embaixo da quadra e as abas abrem na Prancheta
    const wide = useMedia(WIDE);
    // ?lab=hud (revamp-ui §3.5, variante A): no celular em pé, quadra grande seguindo a bola e o painel vira 4 botões
    const [hudLab] = useState(readHud);
    const portrait = useMedia('(orientation: portrait)');
    const hud = hudLab && !wide && portrait;
    const [hudSheet, setHudSheet] = useState<HudSheet | null>(null);
    const [hudFeedTab, setHudFeedTab] = useState<CoachTab>('feed');
    const pitchRef = useRef<HTMLDivElement>(null);
    // até a velocidade escolhida em Configurações (padrão 2x) a câmera segue o lance; acima, a quadra inteira
    const camFollow = settings.camFollow ?? 2;
    useCourtFollow(hud, pitchRef, typeof settings.speed === 'number' && settings.speed <= camFollow);
    const tabs: CoachTab[] = wide ? ['board', 'team', 'feed'] : ['tactic', 'board', 'team', 'feed'];
    const [tab, setTab] = useCoachTab(tabs, wide ? 'board' : 'tactic');
    const latest = useRef<MatchResult | null>(match);
    const recorded = useRef(false);
    const tickRef = useRef(0);
    const scoreboardRef = useRef<HTMLDivElement>(null);
    const coachRef = useRef<HTMLDivElement>(null);
    // celular deitado: placar no topo da tela pra quadra caber inteira (depois do scrollTo(0) do App)
    useEffect(() => {
        if (!window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches) return;
        const id = requestAnimationFrame(() => scoreboardRef.current?.scrollIntoView({ block: 'start' }));
        return () => cancelAnimationFrame(id);
    }, []);
    useEffect(() => {
        if (halftime) halftimeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [halftime]);

    const opponent = run?.opponents[run.stage];
    // cor do seu clube (Perfil); o rival troca para o uniforme reserva se a cor dele for parecida
    const clubColor = useClubColor();
    const colors: [number, number] = [clubColor, rivalColor(clubColor, opponent?.color ?? 0x3a7bd5)];
    const teamNames: [string, string] = [
        run?.teamName ?? t('match.home'),
        opponent ? clubName(opponent.name) : t('match.away'),
    ];
    // sigla no placar do celular: a do perfil se a copa tem o nome do clube, senão a tirada do nome
    const profileClub = useGame((s) => s.profile);
    const homeTag = teamNames[0] === profileClub.clubName ? profileClub.clubTag : tagFromName(teamNames[0]);
    // escudo e uniforme: o seu (Perfil) e o do ginásio (no reserva, se bater)
    const looks = matchLooks(
        { ...lookOfProfile(profileClub), color: clubColor },
        lookOfCupClub(opponent?.name ?? '', opponent?.color ?? 0x3a7bd5),
    );
    const tacticOrders = orders.filter(isTacticOrder);
    const subOrders = orders.filter(isSubOrder);
    const currentTactic: Tactic = tacticOrders.at(-1)?.tactic ?? run?.tactic ?? 'balanced';

    latest.current = match;

    // biome-ignore lint/correctness/useExhaustiveDependencies: a cena só lê os dados na montagem; trocas vêm por 'match:replace'
    const sceneData = useMemo<MatchSceneData | null>(
        () =>
            match
                ? {
                      result: match,
                      colors,
                      cries: settings.cries,
                      speed: settings.speed,
                      cinematic: settings.cinematic,
                      namesOnField: settings.namesOnField,
                      arrowSize: settings.arrowSize,
                      chanceSpeed: settings.chanceSpeed,
                      reduceMotion: reduceMotionOn(settings.reduceMotion),
                      extraSpecies: [...(run?.picks ?? []), ...(opponent?.bench ?? [])].map((p) =>
                          skinOf(p.speciesId, p.shiny),
                      ),
                      startPaused: true,
                      startTick: resume?.tick || undefined,
                      final: !liga && !!run && isFinalStage(run),
                      agency: true,
                      // o rival joga em casa: a quadra do ginásio dele
                      court: opponent ? clubLeader(opponent.name) : undefined,
                      // a faixa da torcida é só a sua (o rival da copa não tem torcida organizada)
                      banners: [bannerText(profileClub.banner, run?.teamName || profileClub.clubName), null],
                      kits: [fieldKit(looks[0]), fieldKit(looks[1])],
                      boards: liga ? undefined : sponsorBoards(run?.sponsors),
                  }
                : null,
        [match?.seed],
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: sceneKey reinicia a contagem ao recarregar a quadra
    useEffect(() => {
        if (sceneReady || !fontsReady) return;
        setSceneSlow(false);
        const timer = window.setTimeout(() => setSceneSlow(true), 8000);
        return () => clearTimeout(timer);
    }, [sceneReady, fontsReady, sceneKey]);

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    // o resultado só vale no apito final (pode mudar com a tática ao vivo). Sair antes não grava nada:
    // a fase continua aberta e, com a mesma seed, a partida se repete igual.
    useEffect(() => {
        const record = () => {
            if (!recorded.current && latest.current) {
                recorded.current = true;
                recordResult(latest.current);
            }
        };
        EventBus.on('match:ended', record);
        return () => {
            EventBus.off('match:ended', record);
        };
    }, [recordResult]);

    useEffect(() => {
        let alive = true;
        Promise.all([document.fonts.load('10px Galmuri11'), document.fonts.load('bold 10px Galmuri11')])
            .catch(() => {})
            .finally(() => alive && setFontsReady(true));
        return () => {
            alive = false;
        };
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: a narração é criada uma vez por partida
    useEffect(() => {
        if (!match) return;
        const commentator = new Commentator(match, teamNames);
        // depois do apito final (pênaltis) o ponto de retomada não anda: voltar no meio da disputa
        // faria todas as cobranças passarem de uma vez
        let afterFulltime = false;
        const onEvent = (e: MatchEvent) => {
            if (e.type === 'sub' && e.team === 0) setSubsDone((prev) => [...prev, e.inUid]);
            // gol: salva o ponto na hora (não dá para sair e voltar antes dele)
            if (e.type === 'goal') saveLiveRef.current({ tick: e.tick });
            const line = commentator.lineFor(e);
            if (line) setLines((prev) => [{ ...line, id: lineId.current++ }, ...prev].slice(0, 200));
            if (e.type === 'penalty') setShootout(e.shootout);
            if (e.type === 'fulltime') {
                afterFulltime = true;
                setFulltime(true);
            }
        };
        let lastSave = 0;
        const onTick = (t: Clock) => {
            tickRef.current = t.tick;
            setClock(t);
            const now = performance.now();
            if (!afterFulltime && now - lastSave > SAVE_EVERY_MS) {
                lastSave = now;
                saveLiveRef.current({ tick: Math.floor(t.tick) });
            }
        };
        const onEnded = () => {
            setEnded(true);
            setHalftime(false);
        };
        const onHalftime = () => setHalftime(true);
        const onTimeout = (tick: number) => setTimeoutAt(tick);
        const onPenaltyPick = (tick: number) => setPenPick(tick);
        EventBus.on('match:timeout', onTimeout);
        EventBus.on('match:penalty-pick', onPenaltyPick);
        const onReady = () => {
            setSceneReady(true);
            // VERSUS já foi embora antes de a quadra carregar: começa direto
            if (introDoneRef.current) EventBus.emit('match:resume');
            // velocidade escolhida antes da cena carregar
            EventBus.emit('match:set-speed', useGame.getState().settings.speed);
        };
        EventBus.on('current-scene-ready', onReady);
        EventBus.on('match:event', onEvent);
        EventBus.on('match:tick', onTick);
        EventBus.on('match:ended', onEnded);
        EventBus.on('match:halftime', onHalftime);
        return () => {
            EventBus.off('match:timeout', onTimeout);
            EventBus.off('match:penalty-pick', onPenaltyPick);
            EventBus.off('match:halftime', onHalftime);
            EventBus.off('match:event', onEvent);
            EventBus.off('match:tick', onTick);
            EventBus.off('match:ended', onEnded);
            EventBus.off('current-scene-ready', onReady);
        };
    }, [match?.seed]);

    // acréscimos ("+2'") e Pressão final do tick da tela (eventos do motor)
    const extras = clockExtrasAt(match?.events ?? [], clock.tick, clock.half);
    const clockParts = useClockParts({ ...clock, added: extras.added }, fulltime || ended, shootout, halftime);
    const pressureNow = halftime || fulltime || ended ? null : extras.pressure;
    // música da partida: faixa do tempo e trecho pela intensidade (troca na linha do compasso)
    const pressing = pressureNow !== null;
    // partida retomada: espera o 1º tick (senão buscaria a faixa do 1º tempo à toa)
    const musicOn = clock.tick > 0 || !resume?.tick;
    // disputa de pênaltis: espera entre as cobranças, e o fim na cobrança decisiva
    const penaltis = fulltime || ended ? penaltyMusic(match?.events ?? [], clock.tick) : null;
    useEffect(() => {
        if (musicOn)
            matchMusic({
                half: clock.half,
                minute: clock.minute,
                pressure: pressing,
                opponent: opponent?.name,
                intro: !introDone,
                ended: ended || fulltime,
                penaltis,
            });
    }, [musicOn, clock.half, clock.minute, pressing, opponent?.name, introDone, ended, fulltime, penaltis]);
    // o capitão do líder rival reage aos gols (emote do Duelo, só na tela)
    const rivalPlan = useMemo(() => (match ? rivalEmotes(match.events, 1) : []), [match]);
    // fim de jogo: vai sozinho pro resultado; um toque na quadra ou no painel segura
    const auto = useFinalHold(ended);
    // fim de jogo: a quadra volta pra tela (no celular a página pode ter ficado rolada desde o intervalo)
    useEffect(() => {
        if (ended)
            scoreboardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotionOn() ? 'auto' : 'smooth' });
    }, [ended]);
    // atalho do teclado: M dispara o golpe máximo na hora certa (o botão grande só aparece por ~1 s); E/W, "Esperar"
    const maxKey = useRef<(key: string) => void>(() => {});
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
            if (e.target instanceof HTMLElement && e.target.matches('input, textarea, select, [contenteditable]'))
                return;
            maxKey.current(e.key.toLowerCase());
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    if (!run || !match || !sceneData || !opponent) return null;

    const lockedSetup = run.lockedTeam ? { ...run.lockedTeam, manualSubs: true } : playerTeam(run);
    // instrução de escanteio: trocável como a tática, sem limite
    const cornerOrders = orders.filter(isCornerOrder);
    const currentCorner = cornerOrders.at(-1)?.corner ?? lockedSetup.corner ?? 'mixed';
    // a troca vale um pouco à frente do que está na tela (mais à frente em velocidades altas)
    const speedMult = typeof settings.speed === 'number' ? settings.speed : HIGHLIGHTS_MULT;
    const leadTicks = CHANGE_LEAD_TICKS * speedMult;
    // trocas só no tempo normal e com folga antes do apito: a troca tem que cair antes dele, senão
    // nunca entraria no motor (e gastaria uma troca à toa)
    const leadMinutes = (leadTicks / (FUTSAL_5.tickRate * FUTSAL_5.halfSeconds)) * FUTSAL_5.displayHalfMinutes;
    const canChangeTactic =
        sceneReady &&
        !pending &&
        !ended &&
        !fulltime &&
        clock.minute + leadMinutes < FUTSAL_5.displayHalfMinutes * 2 - 1;

    const setSpeed = (speed: PlaybackSpeed) => {
        updateSettings({ speed });
        EventBus.emit('match:set-speed', speed);
    };

    /**
     * Ordem do técnico ao vivo (tática ou substituição): agenda um pouco à frente do que está na tela e
     * resimula a partida com a agenda inteira. As ordens ficam salvas para retomar a partida igual.
     */
    const htTick = match.events.find((e) => e.type === 'halftime')?.tick;
    const sendOrder = async (make: (tick: number) => MatchOrder, at?: number) => {
        // sempre depois da ordem anterior, para a ordem do motor bater com a da tela; no intervalo (e no pedido de
        // tempo) a partida está parada, então vale já no tick seguinte. `at`: tick fixo (ordem dos pênaltis, que
        // entra antes do apito final e não muda nada do jogo)
        const base =
            halftime && htTick !== undefined
                ? htTick + 1
                : timeoutAt !== null
                  ? timeoutAt + 1
                  : Math.ceil(tickRef.current + leadTicks);
        const tick = at ?? Math.max(base, (orders.at(-1)?.tick ?? 0) + 1);
        await resim([...orders, make(tick)], tick);
    };

    /** Resimula com a agenda inteira (ordem nova ou troca desfeita) e segura a tela até a partida nova chegar. */
    const resim = async (schedule: MatchOrder[], tick: number) => {
        const seed = match.seed;
        setPending(true);
        setTacticError(null);
        EventBus.emit('match:hold', tick);
        try {
            const result = await simulateMatch(
                lockedSetup,
                cupRival(opponent, true),
                `${run.seed}-stage-${run.stage}`,
                schedule,
            );
            if (!alive.current || useGame.getState().match?.seed !== seed) return;
            setOrders(schedule);
            saveLive({ orders: schedule });
            latest.current = result;
            setMatch(result);
            EventBus.emit('match:replace', result);
        } catch {
            // libera o playback com a partida que já estava valendo
            if (alive.current && latest.current) EventBus.emit('match:replace', latest.current);
            if (alive.current) setTacticError(t('match.orderFailed'));
        } finally {
            if (alive.current) setPending(false);
        }
    };

    const changeCorner = (corner: CornerPlan) => {
        if (!canChangeTactic || corner === currentCorner) return;
        sendOrder((tick) => ({ tick, team: 0, kind: 'corner', corner }));
    };

    // beira da quadra: tempo, goleiro-linha e golpe máximo, pelo mesmo caminho das ordens
    const setups: [TeamSetup, TeamSetup] = [lockedSetup, opponent];
    const cue = maxCueAt(match, setups, 0, clock.tick);
    const agency = agencyView(match.events, orders, 0, clock.tick, cue);
    const wait = maxWaitNext(maxWait, agency.max.level, cue);
    if (wait !== maxWait) setMaxWait(wait);
    const sideline = { ...agency, fxType: capFxType(match, setups, 0, clock.tick), maxWaiting: wait !== null };
    const canAgency = canChangeTactic && penPick === null;
    // golpe máximo: vale já no quadro da tela, antes da decisão do capitão (com +1 a IA chutava antes e o lance
    // passava; a quadra espera a partida nova; é um lance, não um plano)
    const sendMax = (q: MaxGrade) =>
        sendOrder((tick) => ({ tick, team: 0, kind: 'max', q }), Math.ceil(tickRef.current));
    const lit = canAgency && maxLit(sideline);
    const waitMax = () => setMaxWait({ level: sideline.max.level });
    maxKey.current = (key) => {
        if (!lit) return;
        if (key === 'm') sendMax(maxGradeNow());
        else if (key === d.match.agency.maxWaitKey.toLowerCase()) waitMax();
    };
    const sidelineControls = (
        <SidelineControls
            view={sideline}
            canAct={canAgency}
            onTimeout={
                timeoutAt === null && !halftime
                    ? () => sendOrder((tick) => ({ tick, team: 0, kind: 'timeout' }))
                    : undefined
            }
            onFlyGk={(on) => sendOrder((tick) => ({ tick, team: 0, kind: 'flyGk', on }))}
            onMax={sendMax}
        />
    );

    const changeTactic = (tactic: Tactic) => {
        if (!canChangeTactic || tactic === currentTactic) return;
        sendOrder((tick) => ({ tick, team: 0, tactic }));
    };

    // quem está em campo e no banco agora (escalação + trocas que já aconteceram)
    const byUid = new Map([...lockedSetup.lineup, ...lockedSetup.bench].map((p) => [p.uid, p]));
    const onField = lockedSetup.lineup.map((p) => p.uid);
    const benchNow = lockedSetup.bench.map((p) => p.uid);
    for (const o of subOrders) {
        if (!subsDone.includes(o.inUid)) continue;
        const i = onField.indexOf(o.outUid);
        if (i >= 0) onField[i] = o.inUid;
        const j = benchNow.indexOf(o.inUid);
        if (j >= 0) benchNow.splice(j, 1);
    }
    /** Fôlego (0..1) agora de quem está na vaga `i` do seu time. */
    const energyAt = (i: number, tick = tickRef.current) => snapAt(match.snapshots, tick).p[i * SNAP_STRIDE + 6] ?? 1;
    const pendingSub = subOrders.find((o) => !subsDone.includes(o.inUid)) ?? null;
    // vestiário: várias trocas no mesmo intervalo (no jogo, uma por bola parada); quem já vai entrar ou sair fica fora
    const htSubs = halftime && htTick !== undefined ? subOrders.filter((o) => o.tick > htTick) : [];
    const benchFree = benchNow.filter((u) => !subOrders.some((o) => o.inUid === u));
    const leaving = new Set(htSubs.map((o) => o.outUid));
    const canSub =
        canChangeTactic &&
        (halftime ? onField.some((u) => !leaving.has(u)) : !pendingSub) &&
        subOrders.length < lockedSetup.bench.length &&
        benchFree.length > 0;
    const undoSub = (o: MatchOrder) => {
        if (!canChangeTactic || htTick === undefined) return;
        resim(
            orders.filter((x) => x !== o),
            htTick + 1,
        );
    };
    const orderSub = (outUid: string, inUid: string) => {
        setSubOut(null);
        if (!canSub) return;
        sendOrder((tick) => ({ tick, team: 0, kind: 'sub', outUid, inUid }));
    };
    // Substituir (botão, intervalo, pedido de tempo, sugestão): abre a prancheta, já com quem sai marcado se tiver
    const openBoard = (uid?: string) => {
        if (hud) {
            setSubOut(uid ? { uid } : null);
            setHudSheet('board');
            return;
        }
        setTab('board');
        setSubOut(uid ? { uid } : null);
        requestAnimationFrame(() => coachRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    };
    // prancheta: sem limite, a última mandada vale na hora (pendente até o evento passar na tela)
    const lastBoard = orders.filter(isLineupOrder).at(-1);
    const boardEv =
        lastBoard && match.events.find((e) => e.type === 'lineup' && e.team === 0 && e.tick >= lastBoard.tick);
    const pendingBoard: BoardPlan | null =
        lastBoard && boardEv && boardEv.tick > clock.tick
            ? { formation: lastBoard.formation, order: lastBoard.order }
            : null;
    const orderBoard = ({ formation, order }: BoardPlan) => {
        if (!canChangeTactic) return;
        sendOrder((tick) => ({ tick, team: 0, kind: 'lineup', formation, order }));
    };
    const nameOf = (uid: string) => {
        const p = byUid.get(uid);
        if (!p) return '?';
        const name = viewInstance(p).displayName;
        // quem já evoluiu nesta partida aparece com o nome novo (Graveler → Golem), como na quadra
        const evo = match.events.find((e) => e.type === 'evolve' && e.uid === uid && e.tick <= tickRef.current);
        return evo?.type === 'evolve' && name === species(evo.from).name ? species(evo.into).name : name;
    };

    const spriteOf = (uid: string) => {
        const p = byUid.get(uid);
        return p ? cardSprite(p) : '';
    };

    const stage = liga ? t('liga.stage') : cupStageName(run, run.stage) || t('match.cup');

    const finishIntro = () => {
        if (introDoneRef.current) return;
        introDoneRef.current = true;
        setIntroDone(true);
        EventBus.emit('match:resume');
    };
    // fôlego que vale na tela: no intervalo, o com que cada um começaria o 2º tempo (o mesmo número no "Mais
    // cansado" do painel, na sugestão de troca e no aviso e na lista do Substituir)
    const ko2 = match.events.find((e) => e.type === 'kickoff' && e.half === 2)?.tick;
    const energyNow = (i: number) => energyAt(i, halftime ? ko2 : undefined);
    // quem está mais cansado em quadra: o botão Substituir avisa (só avisa; a troca é sempre do técnico)
    const tiredSlot = onField.map((uid, i) => ({ uid, energy: energyNow(i) })).sort((a, b) => a.energy - b.energy)[0];
    // intervalo: sugere trocar o mais cansado (só abre o Substituir com ele marcado)
    const htSuggest = halftime
        ? subSuggestion(
              onField.map((uid, i) => ({ uid, energy: energyNow(i) })),
              canSub,
          )
        : null;
    const pendingSubText = pendingSub
        ? rich(t(halftime ? 'match.subPendingHt' : 'match.subPending'), {
              out: <b>{nameOf(pendingSub.outUid)}</b>,
              in: <b>{nameOf(pendingSub.inUid)}</b>,
          })
        : null;
    const tiredInst = tiredSlot && byUid.get(tiredSlot.uid);
    const tired =
        canSub && tiredSlot && tiredInst && tiredSlot.energy < TIRED_HINT
            ? { name: nameOf(tiredSlot.uid), energy: tiredSlot.energy, sprite: cardSprite(tiredInst) }
            : null;

    const over = fulltime || ended;
    const tacticControls = (
        <TacticControls
            tactic={currentTactic}
            corner={currentCorner}
            canChange={canChangeTactic}
            pending={pending}
            error={tacticError}
            onTactic={changeTactic}
            onCorner={changeCorner}
            canSub={canSub}
            // no intervalo o Substituir mora no painel do intervalo (antes aparecia duas vezes); no ?lab=hud, no Trocar
            onSub={halftime || hud ? undefined : () => openBoard(tired ? tiredSlot.uid : undefined)}
            tired={tired}
        />
    );
    const tactics = (
        <>
            {tacticControls}
            {sidelineControls}
        </>
    );
    // ordem dos pênaltis: quem está em quadra no apito final, na ordem do motor (pelo chute); o goleiro no fim
    const penaltyTakers = (): PenaltyTaker[] => {
        const ft = penPick ?? 0;
        const field = onField.map((uid, i) => ({ uid, i, role: roleAt(match, [lockedSetup, opponent], i, ft) }));
        const shooting = (uid: string) => {
            const inst = byUid.get(uid);
            return inst ? viewInstance(inst).attributes.shooting : 0;
        };
        return field
            .sort((a, b) => Number(a.role === 'GK') - Number(b.role === 'GK') || shooting(b.uid) - shooting(a.uid))
            .map(({ uid, role }) => {
                const inst = byUid.get(uid);
                return { uid, name: nameOf(uid), sprite: inst ? cardSprite(inst) : '', gk: role === 'GK' };
            });
    };
    const resumeFromPens = () => {
        setPenPick(null);
        // no celular, o "Manter ordem" fica embaixo da dobra: a quadra volta pra tela antes da disputa
        scoreboardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotionOn() ? 'auto' : 'smooth' });
        EventBus.emit('match:resume');
    };

    const jogoCoach = (
        <Coach
            id="relampagoJogo"
            targets={[hud ? '.bc-hudbar' : '.bc-coach .bc-tabs']}
            when={
                !liga &&
                !!run &&
                !run.daily &&
                !isLong(run) &&
                run.results.length === 0 &&
                relampagoJogoDue(clock.score, halftime)
            }
        />
    );
    /** O conteúdo de cada aba do técnico (no painel ou na sheet do ?lab=hud). */
    const pane = (k: CoachTab) =>
        k === 'board' ? (
            <Prancheta
                match={match}
                setups={[lockedSetup, opponent]}
                side={0}
                tick={clock.tick}
                names={teamNames}
                selectedUid={subOut}
                onMine={(_, idx) => idx !== null && EventBus.emit('match:inspect-request', idx)}
                onSub={canSub ? orderSub : undefined}
                subs={subOrders.filter((o) => !subsDone.includes(o.inUid))}
                edit={{ enabled: canChangeTactic, pending: pendingBoard, onConfirm: orderBoard, over }}
            />
        ) : k === 'team' ? (
            <TeamPanel
                match={match}
                setups={[lockedSetup, opponent]}
                tick={clock.tick}
                teamNames={teamNames}
                interactive={sceneReady && !ended}
            />
        ) : k === 'feed' ? (
            <MatchFeed lines={lines} colors={colors} />
        ) : (
            tactics
        );

    return (
        <>
            {!introDone && (
                <VersusIntro
                    home={lockedSetup}
                    away={opponent}
                    stage={stage}
                    ready={sceneReady}
                    onDone={() => playMoment('bola', finishIntro)}
                    onRetry={() => setSceneKey((k) => k + 1)}
                />
            )}
            <div className={`bc${hud ? ' bc-hud' : ''}`}>
                <div className="bc-head" ref={scoreboardRef}>
                    <Scoreboard
                        names={teamNames}
                        tags={[homeTag, tagFromName(teamNames[1])]}
                        colors={colors}
                        looks={looks}
                        score={clock.score}
                        clock={clockParts}
                        pressure={pressureNow}
                        stage={liga ? t('liga.stageShort') : cupStageShort(run, run.stage, d.match.stageShort) || stage}
                    >
                        <RivalEmotes
                            plan={rivalPlan}
                            tick={clock.tick}
                            side={1}
                            speciesId={captainAt(match, [lockedSetup, opponent], 1, clock.tick).speciesId}
                            color={hex(colors[1])}
                            onPose={() => {
                                const idx = captainAt(match, [lockedSetup, opponent], 1, tickRef.current).idx;
                                if (idx !== null) EventBus.emit('match:captain-pose', idx);
                            }}
                        />
                    </Scoreboard>
                    <PressureBar match={match} tick={clock.tick} minute={clock.minute} colors={colors} over={over} />
                    <MaxBars events={match.events} tick={clock.tick} colors={colors} />
                </div>

                <div className="bc-stage" onPointerDownCapture={auto.hold}>
                    <div className={`pitch-wrap${hud ? ' hud-follow' : ''}`} ref={pitchRef}>
                        {fontsReady ? (
                            <PhaserGame key={`${match.seed}-${sceneKey}`} data={sceneData} />
                        ) : (
                            <div className="phaser-container" />
                        )}
                        {/* partida nova: a caixa de texto da batalha no lugar da faixa da narração */}
                        {hud ? (
                            <BattleText lines={lines} colors={colors} speed={settings.speed} />
                        ) : (
                            <Ticker lines={lines} colors={colors} />
                        )}
                        <SidelineOverlay events={match.events} tick={clock.tick} colors={colors} names={teamNames} />
                        <CharangaCue events={match.events} tick={clock.tick} setups={setups} colors={colors} />
                        <MaxCueButton view={sideline} canAct={canAgency} onMax={sendMax} onWait={waitMax} />
                        <MatchHighlight teamNames={teamNames} colors={[hex(colors[0]), hex(colors[1])]} />
                        <EvolutionOverlay />
                        {ended && !auto.held && (
                            <FinalBanner score={clock.score} shootout={shootout} side={0} names={teamNames} />
                        )}
                        <LeaveConfirm />
                        <PlayerInspect
                            match={match}
                            setups={[lockedSetup, opponent]}
                            tactics={[currentTactic, opponent.tactic]}
                            onSub={hud && canSub ? (uid) => openBoard(uid) : undefined}
                        />
                    </div>
                    {sceneSlow && !sceneReady && (
                        <button type="button" className="btn outline" onClick={() => setSceneKey((k) => k + 1)}>
                            {t('match.reload')}
                        </button>
                    )}
                    {halftime && (
                        <div className="ht-wrap" ref={halftimeRef}>
                            <HalftimePanel
                                match={match}
                                names={teamNames}
                                nameOf={(idx) => {
                                    const ht = match.events.find((e) => e.type === 'halftime')?.tick ?? 0;
                                    // trocas até a saída de bola do 2º tempo (as feitas no intervalo entram)
                                    const ko =
                                        match.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? ht;
                                    const sub = match.events
                                        .filter((e) => e.type === 'sub' && e.outIdx === idx && e.tick <= ko)
                                        .at(-1);
                                    return sub && sub.type === 'sub' ? sub.in : match.roster[idx].name;
                                }}
                                canSub={canSub}
                                onSub={() => openBoard()}
                                suggest={
                                    htSuggest && {
                                        text: t('match.ht.suggest', {
                                            name: nameOf(htSuggest.uid),
                                            p: Math.round(htSuggest.energy * 100),
                                        }),
                                        onPick: () => openBoard(htSuggest.uid),
                                    }
                                }
                                mySubs={htSubs.map((o) => ({
                                    key: o.inUid,
                                    inName: nameOf(o.inUid),
                                    outName: nameOf(o.outUid),
                                    sprite: spriteOf(o.inUid),
                                    onUndo: canChangeTactic ? () => undoSub(o) : undefined,
                                }))}
                                rivalSubs={rivalHtSubs(match, 1)}
                                onContinue={() => {
                                    setHalftime(false);
                                    EventBus.emit('match:resume');
                                }}
                            />
                        </div>
                    )}
                    {timeoutAt !== null && (
                        <div className="ht-wrap">
                            <TimeoutPanel
                                canSub={canSub}
                                onSub={() => openBoard()}
                                onBack={() => {
                                    setTimeoutAt(null);
                                    EventBus.emit('match:resume');
                                }}
                            />
                        </div>
                    )}
                    {penPick !== null && (
                        <div className="ht-wrap">
                            <PenaltyOrderPanel
                                takers={penaltyTakers()}
                                busy={pending}
                                onKeep={resumeFromPens}
                                onConfirm={async (order) => {
                                    // entra antes do apito final: o jogo é o mesmo, só a disputa muda
                                    await sendOrder(
                                        (tick) => ({ tick, team: 0, kind: 'penalties', order }),
                                        penPick - 1,
                                    );
                                    resumeFromPens();
                                }}
                            />
                        </div>
                    )}
                    {pendingSub && !halftime && <div className="sub-pending">{pendingSubText}</div>}
                    {pendingBoard && (
                        <div className="sub-pending">
                            {t('match.boardPending', { formation: formationText(pendingBoard.formation).name })}
                        </div>
                    )}
                    {wide && <div className="bc-deskbar">{tactics}</div>}
                </div>

                {hud ? (
                    <>
                        {jogoCoach}
                        {/* ?lab=hud: 4 botões no lugar das abas; cada um abre a sua sheet (o estado fica à vista) */}
                        <nav className="bc-hudbar" aria-label={t('match.coach.title')}>
                            {(
                                [
                                    ['tactic', currentTactic, t('match.coach.tactic'), d.common.tactic[currentTactic]],
                                    ['board', 'sub', t('match.coach.hudSwap'), t('match.coach.board')],
                                    [
                                        'time',
                                        'timeout',
                                        t('match.coach.hudTime'),
                                        sideline.timeoutPending
                                            ? d.match.agency.timeoutPending
                                            : sideline.timeoutUsed
                                              ? d.match.agency.timeoutUsed
                                              : d.match.agency.timeoutPerHalf,
                                    ],
                                    [
                                        'feed',
                                        'feed',
                                        t('match.coach.feed'),
                                        lines[0] ? `${Math.floor(lines[0].minute)}'` : '',
                                    ],
                                ] as const
                            ).map(([k, icon, label, sub]) => (
                                <button
                                    key={k}
                                    type="button"
                                    className={`bc-hudbtn${hudSheet === k ? ' on' : ''}`}
                                    aria-haspopup="dialog"
                                    onClick={() => setHudSheet(k)}
                                >
                                    <HudIcon kind={icon} />
                                    <b>{label}</b>
                                    <small>{sub}</small>
                                </button>
                            ))}
                        </nav>
                        <Sheet
                            open={hudSheet !== null}
                            onClose={() => setHudSheet(null)}
                            title={
                                hudSheet === 'board'
                                    ? t('match.coach.hudSwap')
                                    : hudSheet === 'time'
                                      ? t('match.coach.hudTime')
                                      : hudSheet === 'feed'
                                        ? t('match.coach.feed')
                                        : t('match.coach.tactic')
                            }
                            className={`hud-sheet hud-${hudSheet ?? 'tactic'}`}
                        >
                            {hudSheet === 'tactic' && tacticControls}
                            {hudSheet === 'board' && pane('board')}
                            {hudSheet === 'time' && sidelineControls}
                            {hudSheet === 'feed' && (
                                <>
                                    <CoachTabs tabs={['feed', 'team']} active={hudFeedTab} onPick={setHudFeedTab} />
                                    {pane(hudFeedTab)}
                                </>
                            )}
                        </Sheet>
                    </>
                ) : (
                    <div className="panel bc-coach" ref={coachRef} onPointerDownCapture={auto.hold}>
                        {jogoCoach}
                        <CoachTabs tabs={tabs} active={tab} onPick={setTab} />
                        <div className={`bc-pane pane-${tab}`} role="tabpanel">
                            {tab === 'tactic' ? tactics : pane(tab)}
                        </div>
                        {wide && tab !== 'feed' && lines.length > 0 && (
                            <div className="bc-recent">
                                <MatchFeed lines={lines.slice(0, 3)} colors={colors} />
                            </div>
                        )}
                    </div>
                )}

                <div className="bc-thumb">
                    {!ended ? (
                        <>
                            <fieldset className="bc-seg speed-seg" aria-label={t('match.coach.speed')}>
                                {/* "Lances" (a velocidade) só aparece se for a escolhida nas Configurações: o nome é o da aba */}
                                {SPEEDS.filter((s) => s.value !== 'highlights' || settings.speed === 'highlights').map(
                                    (s) => (
                                        <button
                                            key={String(s.value)}
                                            type="button"
                                            className={settings.speed === s.value ? 'on' : undefined}
                                            aria-pressed={settings.speed === s.value}
                                            disabled={!sceneReady}
                                            onClick={() => setSpeed(s.value)}
                                            title={s.value === 'highlights' ? t('match.highlightsHint') : undefined}
                                        >
                                            {s.label || t('match.highlights')}
                                        </button>
                                    ),
                                )}
                            </fieldset>
                            {/* celular: o golpe máximo sempre à vista na barra fixa (na aba Tática ficava abaixo da quadra) */}
                            {!wide && <MaxThumb view={sideline} canAct={canAgency} onMax={sendMax} />}
                            <button
                                type="button"
                                className="bc-skip"
                                disabled={pending || !sceneReady}
                                aria-label={t('match.skip')}
                                title={t('match.skip')}
                                onClick={() => EventBus.emit('match:skip')}
                            >
                                <HudIcon kind="skip" />
                                <span>{t('match.skip')}</span>
                            </button>
                        </>
                    ) : (
                        <ResultButton
                            label={t('match.seeResult')}
                            onGo={() =>
                                // título: o troféu cobre a quadra e a festa aparece embaixo
                                !liga && useGame.getState().run?.status === 'champion'
                                    ? playMoment('trofeu', () => go('result'))
                                    : go(liga ? 'liga' : 'result')
                            }
                        />
                    )}
                </div>
            </div>
        </>
    );
}
