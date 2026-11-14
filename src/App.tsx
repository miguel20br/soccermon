import { lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { setVolume } from './game/audio';
import { useT } from './i18n/react';
import { duel } from './net/session';
import { prefetchGame, preloadGame } from './PhaserGame';
import { modeMenuDue, whenHydrated } from './store/coach';
import { type Screen, useGame } from './store/game-store';
import { useSaveHealth } from './store/save-health';
import { onGoTab } from './ui/ambientes/nav';
import { TopBar } from './ui/ambientes/TopBar';
import { backTarget, installBackNav, MENU_SCREENS } from './ui/back-nav';
import { AccountLink } from './ui/components/AccountLink';
import { CardModal } from './ui/components/CardModal';
import { CupBar } from './ui/components/CupBar';
import { LogoHits } from './ui/components/LogoHits';
import { useMenuBack } from './ui/components/MenuHead';
import { MenuIcon } from './ui/components/MenuIcon';
import { TopActions } from './ui/components/TopActions';
import { UnlockNotice } from './ui/components/UnlockNotice';
import { runDevDemo } from './ui/dev-demo';
import { openPage } from './ui/doors';
import { Duel, duelCodeFromUrl } from './ui/duel/Duel';
import { readHud } from './ui/hud-lab';
import { DoorLayer } from './ui/kit/DoorWipe';
import { MomentLayer } from './ui/kit/MomentWipe';
import { Toast } from './ui/kit/Toast';
import { requestBack, requestLeave } from './ui/leave-guard';
import { FriendInvite, FriendVitrine } from './ui/profile/FriendsTab';
import { PlayerCardModal } from './ui/profile/PlayerCard';
import { CardGallery } from './ui/screens/CardGallery';
import { Collection } from './ui/screens/Collection';
import { Credits } from './ui/screens/Credits';
import { CupMap, EventScreen, GroupScreen, Training } from './ui/screens/CupMap';
import { Daily } from './ui/screens/Daily';
import { Draft } from './ui/screens/Draft';
import { Help } from './ui/screens/Help';
import { Liga } from './ui/screens/Liga';
import { Lineup } from './ui/screens/Lineup';
import { Match } from './ui/screens/Match';
import { PositionLab } from './ui/screens/PositionLab';
import { DoorSheets, Profile } from './ui/screens/Profile';
import { Result } from './ui/screens/Result';
import { Reward } from './ui/screens/Reward';
import { Settings } from './ui/screens/Settings';
import { Shop } from './ui/screens/Shop';
import { TrophyRoom } from './ui/screens/TrophyRoom';
import { tvCut } from './ui/tv';
import { readUltimate } from './ui/ultimate/flag';

// Movedex (?lab=golpes) usa o Phaser: vem num pedaço à parte, como a partida
/** Telas de dentro da copa: a barra da copa (fase, ₽, sorteios) no lugar do logo (revamp-ui, 0.9.23). */
const CUP_SCREENS: Screen[] = ['draft', 'lineup', 'result', 'reward', 'shop', 'map', 'treino', 'event', 'group'];

const RoomLab = lazy(() => import('./ui/screens/RoomLab').then((m) => ({ default: m.RoomLab })));
const MoveLab = lazy(() => import('./ui/screens/MoveLab').then((m) => ({ default: m.MoveLab })));
const VersusLab = lazy(() => import('./ui/components/VersusLab').then((m) => ({ default: m.VersusLab })));
const CourtLab = lazy(() => import('./ui/screens/CourtLab').then((m) => ({ default: m.CourtLab })));
const EmoteLab = lazy(() => import('./ui/duel/EmoteLab').then((m) => ({ default: m.EmoteLab })));
const IconLab = lazy(() => import('./ui/screens/IconLab').then((m) => ({ default: m.IconLab })));
const StoryLab = lazy(() => import('./ui/screens/StoryLab').then((m) => ({ default: m.StoryLab })));
// Time Ultimate (atrás de ?lab=ultimate, só dev e prévias): pedaço à parte
const Ultimate = lazy(() => import('./ui/ultimate/Ultimate').then((m) => ({ default: m.Ultimate })));
// walkout final (?lab=walkout, ut-walkout.md): só dev e prévias, a cena do Phaser vem por import dinâmico
const WalkoutLab = lazy(() => import('./ui/screens/WalkoutLab').then((m) => ({ default: m.WalkoutLab })));
const KitLab = lazy(() => import('./ui/kit/KitLab').then((m) => ({ default: m.KitLab })));
// conceitos do menu de modos (antes da Home), só no dev e nas prévias
const ModeMenuLab = lazy(() => import('./ui/screens/ModeMenuLab').then((m) => ({ default: m.ModeMenuLab })));
// a Home (navegação por ambientes, src/ui/ambientes): pedaço à parte, baixa junto com o save
const loadAmbientes = () => import('./ui/ambientes/Ambientes');
const Ambientes = lazy(() => loadAmbientes().then((m) => ({ default: m.Ambientes })));
// o menu de modos (antes da Home, pra quem já jogou): pedaço à parte também
// pedaço que não chega (rede ruim, versão nova no ar): no lugar do menu, um "JOGAR" que sai sozinho pra Home (o
// chunk-reload cuida da versão nova). ponytail: o lazy guarda a falha; o botão de modos da Home só volta pra ela até recarregar
function NoMenu({ onPlay }: { phase: 'in' | 'on' | 'out'; onPlay: () => void; onUltimate?: () => void }): ReactNode {
    // biome-ignore lint/correctness/useExhaustiveDependencies: sai uma vez, na montagem
    useEffect(() => onPlay(), []);
    return null;
}
const ModeMenu = lazy(() =>
    import('./ui/screens/ModeMenu').then(
        (m) => ({ default: m.ModeMenu }),
        () => ({ default: NoMenu }),
    ),
);
/** Fade do menu de modos (entrar por cima da Home, sair pro JOGAR): ADR 0004. */
const MENU_FADE_MS = 280; // --dur-tela

/** Sai da tela atual (para a Home, ou `to`); sair do duelo guarda a sala (dá pra voltar pelo link). */
function leaveScreen(screen: Screen, to: Screen = 'home') {
    if (screen === 'duel') {
        duel.leave();
        window.history.replaceState(window.history.state, '', window.location.pathname);
        try {
            sessionStorage.removeItem('soccermon-duel-pending');
        } catch {
            // nada
        }
    }
    useGame.getState().go(to);
}

/**
 * O voltar de uma tela (o `‹` da barra de cima e o voltar do Android, o mesmo): o da tela (MenuHead), ou o caminho
 * (`backTarget`, com a confirmação do Duelo rolando). Antes o Android ia pelo caminho e o `‹` pelo da tela, e os
 * dois discordavam (Perfil: um voltava pro Estádio, o outro pra Sede).
 */
function goBack(screen: Screen) {
    const back = useMenuBack.getState().back;
    if (back) back();
    else requestBack(() => leaveScreen(screen, backTarget(screen) ?? 'home'));
}

function MenuBack({ screen }: { screen: Screen }) {
    const { t } = useT();
    return (
        <button
            type="button"
            className="help-fab amb-modes"
            aria-label={t('common.ui.back')}
            title={t('common.ui.back')}
            onClick={() => goBack(screen)}
        >
            <MenuIcon kind="back" />
        </button>
    );
}

export default function App() {
    const { screen, settings, run } = useGame();
    const diskFull = useSaveHealth((s) => s.full);
    const saveBlocked = useSaveHealth((s) => s.blocked);
    // idioma: o App redesenha na troca e leva junto as telas que usam t() fora de hook
    const { t } = useT();
    // ?demo=crash (dev e prévias): quebra a renderização para conferir a tela do ErrorBoundary
    if (__SMOKE__ && new URLSearchParams(window.location.search).get('demo') === 'crash') {
        throw new Error('Teste do aviso de erro (?demo=crash)');
    }
    // laboratórios: ?lab=golpes (animação de todos os golpes, público), ?lab=emotes (emotes do Duelo sem sala, público),
    // ?lab=quadras (treinadores, falas e a quadra de cada ginásio, público); ?lab=posicoes, ?lab=icones, ?lab=cenas, ?lab=kit e ?cards=1 só no dev e nas prévias (__SMOKE__), menos
    // a revisão dos suspeitos de posição (?lab=posicoes&revisao=1), que o Miguel abre no celular
    const [lab, setLab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('lab');
        if (q === 'golpes' || q === 'emotes' || q === 'quadras') return q;
        if (__SMOKE__ && q === 'walkout') return 'walkout';
        if (
            __SMOKE__ &&
            (q === 'versus' || q === 'sala' || q === 'icones' || q === 'cenas' || q === 'kit' || q === 'menu-modos')
        )
            return q;
        return (__SMOKE__ || params.has('revisao')) && q === 'posicoes' ? q : null;
    });
    const [ultimateLab] = useState(readUltimate);
    // menu de modos: decidido uma vez, quando o save carrega (modeMenuDue); 'in'/'out' = fade com a Home embaixo
    const [menu, setMenu] = useState<'in' | 'on' | 'out' | null>(null);
    const menuDecided = useRef(false);
    useEffect(
        () =>
            whenHydrated(useGame.persist, () => {
                // só na abertura: restaurar backup (carrega o save de novo) não abre o menu no meio da sessão
                if (menuDecided.current) return;
                menuDecided.current = true;
                const s = useGame.getState();
                if (s.screen === 'home' && modeMenuDue(s, window.location.search)) {
                    setMenu('on');
                    void loadAmbientes(); // o JOGAR não espera a rede
                }
            }),
        [],
    );
    const fadeTimer = useRef(0);
    const fadeMenu = (from: 'in' | 'out', to: 'on' | null) => {
        window.clearTimeout(fadeTimer.current); // tocou de novo no meio do fade: vale o último
        setMenu(from);
        fadeTimer.current = window.setTimeout(() => {
            setMenu(to);
            // saiu pro JOGAR: o foco vai pro JOGAR da Home (teclado e leitor de tela não ficam no nada)
            if (!to) requestAnimationFrame(() => document.querySelector<HTMLElement>('.amb .es-play')?.focus());
        }, MENU_FADE_MS);
    };
    useEffect(() => () => window.clearTimeout(fadeTimer.current), []);
    // entrar e sair do menu de modos também é corte de TV (o fade de sempre quando não dá pra animar)
    const tvMenu = (to: 'on' | null) =>
        tvCut(() => {
            window.clearTimeout(fadeTimer.current);
            setMenu(to);
        });
    // o botão das Notícias leva pra uma aba da Home: com o menu de modos na frente, ele sai (corte de TV)
    const menuNow = useRef(menu);
    menuNow.current = menu;
    // biome-ignore lint/correctness/useExhaustiveDependencies: tvMenu só usa o setter e o timer (refs)
    useEffect(() => onGoTab(() => menuNow.current && tvMenu(null)), []);
    // o menu é só da Home: saiu dela (Perfil, Configurações, copa), ele não volta no meio da sessão
    useEffect(() => {
        if (screen !== 'home') {
            window.clearTimeout(fadeTimer.current);
            setMenu(null);
        }
    }, [screen]);
    // ?lab=hud (partida nova, revamp-ui §3.5): guarda na aba já na entrada, a partida lê depois
    useState(readHud);
    const [cards, setCards] = useState(
        () => __SMOKE__ && new URLSearchParams(window.location.search).get('cards') === '1',
    );

    // botão voltar do Android: uma entrada de guarda fora da Home; voltar = o `‹` da tela (partida pede confirmação)
    useEffect(
        () =>
            installBackNav(
                () => useGame.getState().screen,
                (cb) => useGame.subscribe((s, p) => s.screen !== p.screen && cb()),
                goBack,
            ),
        [],
    );

    useEffect(() => {
        setVolume(settings.volume);
    }, [settings.volume]);

    // com a primeira tela já carregada (imagens inclusive), baixa a partida (Phaser) em segundo plano sem rodar: o
    // "Jogar" não espera a rede e o pedaço não disputa banda com a Home
    useEffect(() => {
        const idle = () =>
            (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300)))(prefetchGame);
        if (document.readyState === 'complete') idle();
        else window.addEventListener('load', idle, { once: true });
        return () => window.removeEventListener('load', idle);
    }, []);
    // na Escalação a partida está perto: roda o pedaço (já baixado) aqui, não no "Jogar"
    useEffect(() => {
        if (screen === 'lineup') preloadGame();
    }, [screen]);

    // tela nova abre no topo (sem isso a partida abria rolada lá embaixo, onde ficava o "Jogar")
    // biome-ignore lint/correctness/useExhaustiveDependencies: roda a cada troca de tela
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [screen]);

    useEffect(() => {
        // espera o save do IndexedDB carregar antes de montar a demo
        const unsub = useGame.persist.onFinishHydration(() => runDevDemo());
        if (useGame.persist.hasHydrated()) runDevDemo();
        return unsub;
    }, []);

    // link de duelo (?duelo=K7M2QX): abre a sala depois que o save carrega
    useEffect(() => {
        const open = () => {
            if (duelCodeFromUrl()) useGame.getState().go('duel');
        };
        const unsub = useGame.persist.onFinishHydration(open);
        if (useGame.persist.hasHydrated()) open();
        return unsub;
    }, []);

    if (cards) {
        const exit = () => {
            window.history.replaceState(null, '', window.location.pathname);
            setCards(false);
        };
        return (
            <div className="app">
                <CardGallery onExit={exit} />
                <CardModal />
            </div>
        );
    }

    if (lab) {
        const exit = () => {
            window.history.replaceState(null, '', window.location.pathname);
            setLab(null);
        };
        return (
            <div className="app">
                {lab === 'golpes' ||
                lab === 'emotes' ||
                lab === 'versus' ||
                lab === 'quadras' ||
                lab === 'sala' ||
                lab === 'icones' ||
                lab === 'cenas' ||
                lab === 'kit' ||
                lab === 'walkout' ||
                lab === 'menu-modos' ? (
                    <Suspense fallback={<p className="muted">{t('common.ui.loading')}</p>}>
                        {lab === 'golpes' ? (
                            <MoveLab onExit={exit} />
                        ) : lab === 'emotes' ? (
                            <EmoteLab onExit={exit} />
                        ) : lab === 'quadras' ? (
                            <CourtLab onExit={exit} />
                        ) : lab === 'sala' ? (
                            <RoomLab onExit={exit} />
                        ) : lab === 'icones' ? (
                            <IconLab onExit={exit} />
                        ) : lab === 'cenas' ? (
                            <StoryLab onExit={exit} />
                        ) : lab === 'kit' ? (
                            <KitLab onExit={exit} />
                        ) : lab === 'walkout' ? (
                            <WalkoutLab onExit={exit} />
                        ) : lab === 'menu-modos' ? (
                            <ModeMenuLab onExit={exit} />
                        ) : (
                            <VersusLab onExit={exit} />
                        )}
                    </Suspense>
                ) : (
                    <PositionLab onExit={exit} />
                )}
                <PlayerCardModal />
                <CardModal />
            </div>
        );
    }

    return (
        <div className="app">
            {screen !== 'home' && (
                <header className={`topbar${MENU_SCREENS.includes(screen) ? ' topbar-menu' : ''}`}>
                    {/* copa acabada (Eliminado, Campeão): volta o logo, é a festa */}
                    {CUP_SCREENS.includes(screen) && run && run.status !== 'eliminated' && run.status !== 'champion' ? (
                        <CupBar onBack={() => leaveScreen(screen)} />
                    ) : MENU_SCREENS.includes(screen) ? (
                        // telas de menu: a mesma barra de cima dos ambientes (voltar, treinador, Novidades, Ajuda e a
                        // engrenagem), no mesmo lugar. No Duelo só o voltar, no mesmo lugar: ele larga a sala (e pede
                        // confirmação com o jogo rolando); a engrenagem e o treinador saíam sem largar
                        <div className="k-topbar k-menubar">
                            <MenuBack screen={screen} />
                            {screen !== 'duel' && (
                                <>
                                    <TopBar />
                                    <TopActions help={() => openPage('help')} profile={false} />
                                </>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="brand"
                            onClick={() => requestLeave(() => leaveScreen(screen))}
                            aria-label={t('common.ui.backHome')}
                        >
                            <span className="brand-logo logo-blink">
                                <img src="assets/ui/logo.svg" alt="" width="1441" height="300" />
                                <LogoHits />
                            </span>
                            {/* na partida o logo inteiro ficava ilegível (~40 px): lá vai o símbolo, no mínimo de 24 px do guia */}
                            <img className="brand-symbol" src="assets/ui/simbolo.svg" alt="" width="28" height="28" />
                        </button>
                    )}
                </header>
            )}
            {screen === 'home' && (
                <>
                    {/* cada um no seu Suspense: a Home carregando embaixo não tira o menu da tela no fade */}
                    <Suspense fallback={null}>
                        {menu !== 'on' && <Ambientes onModes={() => tvMenu('on') || fadeMenu('in', 'on')} />}
                    </Suspense>
                    <Suspense fallback={null}>
                        {menu && (
                            <ModeMenu
                                phase={menu}
                                onPlay={() => tvMenu(null) || fadeMenu('out', null)}
                                onUltimate={ultimateLab ? () => useGame.getState().go('ultimate') : undefined}
                            />
                        )}
                    </Suspense>
                </>
            )}
            {screen === 'draft' && <Draft />}
            {screen === 'lineup' && <Lineup />}
            {screen === 'match' && <Match />}
            {screen === 'result' && <Result />}
            {screen === 'reward' && <Reward />}
            {screen === 'shop' && <Shop />}
            {screen === 'map' && <CupMap />}
            {screen === 'treino' && <Training />}
            {screen === 'event' && <EventScreen />}
            {screen === 'group' && <GroupScreen />}
            {screen === 'settings' && <Settings />}
            {screen === 'credits' && <Credits />}
            {screen === 'profile' && <Profile />}
            {screen === 'help' && <Help />}
            {screen === 'duel' && <Duel />}
            {screen === 'daily' && <Daily />}
            {screen === 'liga' && <Liga />}
            {screen === 'liga-match' && <Match liga />}
            {screen === 'ultimate' && (
                <Suspense fallback={<p className="muted">{t('common.ui.loading')}</p>}>
                    <Ultimate />
                </Suspense>
            )}
            {screen === 'ultimate-match' && <Match ultimate />}
            {screen === 'trophies' && <TrophyRoom />}
            {screen === 'collection' && <Collection />}
            <PlayerCardModal />
            <MomentLayer />
            <DoorLayer />
            <CardModal />
            <DoorSheets />
            <FriendInvite />
            <FriendVitrine />
            <AccountLink />
            <UnlockNotice />
            {diskFull && !['match', 'liga-match', 'ultimate-match'].includes(screen) && (
                <Toast tone="bad">{t('common.ui.diskFull')}</Toast>
            )}
            {saveBlocked && screen === 'home' && <Toast tone="bad">{t('common.ui.saveBlocked')}</Toast>}
        </div>
    );
}
