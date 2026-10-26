import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { isFirstVisit, rotaNovaDue } from '../../store/coach';
import { useGame } from '../../store/game-store';
import { LONG_CUP_LIVE } from '../../store/long-cup';
import { Coach, useHydrated } from '../coach/Coach';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { TopActions } from '../components/TopActions';
import { feedback } from '../feedback';
import { reduceMotionOn } from '../settings-sync';
import { Arena } from './Arena';
import { Estadio } from './Estadio';
import { Lab } from './Lab';
import { dragPos, START, skyOf, snapTab, TABS, type Tab } from './nav';
import { Rota } from './Rota';
import { Sede } from './Sede';
import { installTabBack } from './tab-back';
import { rollAll, type Wild, wildQuota } from './wild';
import './ambientes.css';

const ICON: Record<Tab, HudIconKind> = {
    lab: 'flask',
    rota: 'map',
    estadio: 'stadium',
    arena: 'friends',
    sede: 'building',
};
/** Duração da entrada num modo (exceção ao ADR 0004, ver ADR 0008): um toque pula. */
const ENTER_MS = 860;
/** A aba em que a pessoa estava (voltar de uma tela pra Home cai nela de novo; recarregar volta pro Estádio). */
let lastTab = START;

/**
 * A Home (navegação por ambientes; `?lab=off` = a Home de lista): 5 lugares lado a lado, a barra de abas embaixo (coluna à esquerda com
 * o celular deitado) e o arrasto de lado entre eles. Abre no Estádio. A troca anda 280 ms com o fundo em camadas
 * (céu devagar, cenário médio, botões junto do dedo); com "reduzir movimento", só um fade.
 */
export function Ambientes() {
    const { t, d } = useT();
    const go = useGame((s) => s.go);
    const hydrated = useHydrated();
    const firstVisit = useGame(isFirstVisit);
    const records = useGame((s) => s.records);
    const coachSeen = useGame((s) => s.profile.coach);
    const [tab, setTabState] = useState(lastTab);
    // o céu do Estádio e da Rota segue a hora de verdade (dia, fim de tarde, noite); a Arena é sempre à noite
    const [sky] = useState(() => skyOf(new Date().getHours()));
    const [entering, setEntering] = useState<(() => void) | null>(null);
    const root = useRef<HTMLDivElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const drag = useRef<{ x: number; y: number; on: boolean; lx: number; lt: number; vx: number } | null>(null);
    const swallowClick = useRef(false);
    // os Pokémon ambiente: sorteio novo a cada abertura, puxando pra quem você já viu na Pokédex
    const [rolled] = useState(() => {
        const dex = useGame.getState().dex;
        return rollAll((id) => !!dex[id]);
    });
    const quota = wildQuota(
        tab,
        TABS.map((id) => rolled[id].length),
    );
    const wildOf = (i: number) => rolled[TABS[i]].slice(0, quota[i]);
    // a arte do kit (Laboratório, Sede) só baixa quando a aba fica perto da tela, e depois fica
    const seen = useRef(new Set<number>());
    for (const i of [tab - 1, tab, tab + 1]) seen.current.add(i);

    const setPos = (p: number) => root.current?.style.setProperty('--pos', String(p));
    const setTab = (i: number) => {
        lastTab = i;
        setTabState(i);
        setPos(i);
    };

    // entrar num modo: a câmera anda até a quadra (ou o time sai pela estrada) e aí a copa começa; um toque pula
    const enter = (action: () => void) => {
        if (reduceMotionOn()) {
            action();
            return;
        }
        let done = false;
        // a tela fica no escuro até a copa trocar de tela (senão o Estádio aparece de novo, já com a copa nova, por um
        // quadro); se a troca não vier, o escuro sai sozinho
        const finish = () => {
            if (done) return;
            done = true;
            action();
            window.setTimeout(() => setEntering(null), 800);
        };
        setEntering(() => finish);
        window.setTimeout(finish, ENTER_MS);
    };

    // teclado: setas trocam de aba quando o foco está na barra
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const i = Math.max(0, Math.min(TABS.length - 1, tab + (e.key === 'ArrowRight' ? 1 : -1)));
        setTab(i);
        root.current?.querySelector<HTMLElement>(`#amb-tab-${TABS[i]}`)?.focus();
    };

    const width = () => stage.current?.clientWidth || window.innerWidth;
    const onDown = (e: React.PointerEvent) => {
        if (e.button !== 0 || entering) return;
        swallowClick.current = false;
        drag.current = { x: e.clientX, y: e.clientY, on: false, lx: e.clientX, lt: e.timeStamp, vx: 0 };
    };
    const onMove = (e: React.PointerEvent) => {
        const g = drag.current;
        if (!g) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (!g.on) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
                drag.current = null;
                return;
            }
            if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            g.on = true;
            stage.current?.setPointerCapture(e.pointerId);
            root.current?.classList.add('amb-drag');
        }
        const dt = e.timeStamp - g.lt;
        if (dt > 0) g.vx = 0.7 * ((e.clientX - g.lx) / dt) + 0.3 * g.vx;
        g.lx = e.clientX;
        g.lt = e.timeStamp;
        setPos(dragPos(tab, dx, width()));
    };
    const onUp = (e: React.PointerEvent) => {
        const g = drag.current;
        drag.current = null;
        if (!g?.on) return;
        root.current?.classList.remove('amb-drag');
        swallowClick.current = true;
        const to = snapTab(tab, e.clientX - g.x, g.vx, width());
        // o toque na aba já faz o som (feedback.ts); o arrasto que troca de lugar faz o mesmo
        if (to !== tab) feedback('tap');
        setTab(to);
    };

    useEffect(() => {
        setPos(tab);
    });

    // voltar do Android: fora do Estádio, volta pro Estádio
    const tabRef = useRef(tab);
    tabRef.current = tab;
    const back = useRef<ReturnType<typeof installTabBack> | null>(null);
    useEffect(() => {
        const tb = installTabBack(
            () => tabRef.current !== START,
            () => {
                lastTab = START;
                setTabState(START);
            },
        );
        back.current = tb;
        return () => {
            tb.off();
            back.current = null;
        };
    }, []);
    useEffect(() => {
        back.current?.sync();
    });

    const view: Record<Tab, (active: boolean, wild: Wild[], near: boolean) => ReactNode> = {
        lab: (active, wild, near) => <Lab active={active} wild={wild} near={near} />,
        rota: (active, wild) => <Rota active={active} enter={enter} wild={wild} entering={!!entering} />,
        estadio: (active, wild) => <Estadio active={active} enter={enter} wild={wild} entering={!!entering} />,
        arena: (active, wild) => <Arena active={active} wild={wild} />,
        sede: (active, wild, near) => <Sede active={active} wild={wild} near={near} />,
    };

    return (
        <div
            ref={root}
            className={`amb${entering ? ` amb-entering amb-enter-${TABS[tab]}` : ''}`}
            data-sky={sky}
            style={{ '--pos': tab, '--n': TABS.length } as CSSProperties}
        >
            <div className="amb-top">
                <TopActions help={() => go('help')} />
            </div>
            <div
                ref={stage}
                className="amb-stage"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onClickCapture={(e) => {
                    if (!swallowClick.current) return;
                    swallowClick.current = false;
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                {TABS.map((id, i) => (
                    <section
                        key={id}
                        id={`amb-panel-${id}`}
                        role="tabpanel"
                        aria-labelledby={`amb-tab-${id}`}
                        className={`amb-panel amb-${id}${i === tab ? ' on' : ''}`}
                        style={{ '--i': i } as CSSProperties}
                        inert={i !== tab}
                    >
                        {view[id](i === tab, wildOf(i), seen.current.has(i))}
                    </section>
                ))}
            </div>
            <nav className="amb-bar" aria-label={t('home.amb.tabsAria')}>
                <div className="amb-tabs" role="tablist" aria-orientation="horizontal" onKeyDown={onKey}>
                    <i className="amb-ind" aria-hidden />
                    {TABS.map((id, i) => (
                        <button
                            key={id}
                            id={`amb-tab-${id}`}
                            type="button"
                            role="tab"
                            aria-selected={i === tab}
                            aria-controls={`amb-panel-${id}`}
                            tabIndex={i === tab ? 0 : -1}
                            className={`amb-tab amb-tab-${id}${i === tab ? ' on' : ''}`}
                            onClick={() => setTab(i)}
                        >
                            <span className="amb-tab-ic">
                                <HudIcon kind={ICON[id]} />
                            </span>
                            <span className="amb-tab-lbl">{d.home.amb.tabs[id]}</span>
                        </button>
                    ))}
                </div>
            </nav>
            {/* balões (fora do palco: o painel tem transform e cortaria o balão): o da Home depois da 1ª copa (o JOGAR
                e a Ajuda) e "Agora tem a Rota Índigo" apontando a aba; só no Estádio */}
            {tab === START && hydrated && !firstVisit && (
                <Coach id="intro" targets={['[data-coach="quick"]', '[data-coach="help"]']} />
            )}
            {tab === START && LONG_CUP_LIVE && (
                <Coach id="rotaNova" targets={['#amb-tab-rota']} when={rotaNovaDue(records, coachSeen)} />
            )}
            {entering && (
                <button type="button" className="amb-skip" aria-label={t('home.amb.skip')} onClick={entering} />
            )}
        </div>
    );
}
