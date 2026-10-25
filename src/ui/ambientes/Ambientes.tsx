import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n/react';
import { ligaCountdown } from '../../league/rules';
import { useGame } from '../../store/game-store';
import { DoorTiles } from '../components/DoorTiles';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { TopActions } from '../components/TopActions';
import { reduceMotionOn } from '../settings-sync';
import { ClockCtx, useSceneClock } from './clock';
import { Estadio } from './Estadio';
import { dragPos, START, snapTab, TABS, type Tab } from './nav';
import { Rota } from './Rota';
import { installTabBack } from './tab-back';
import { useMq, useWild, WildZone, type ZoneDef } from './WildZone';
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

/** O chão das abas sem ambiente ainda: 1 ou 2 Pokémon passeando na faixa de baixo, atrás dos botões. */
const floorOf = (scale: number): Record<string, ZoneDef> => ({
    floor: { ok: (_x, y) => y > 0.2 && y < 0.85, speed: 0.22, scale },
});
/** Tela baixa (deitado) ou estreita: 1x, senão o Pokémon sobe por cima dos botões; desktop 3x. */
const SMALL = '(max-width: 359px), (max-height: 520px)';
const BIG = '(min-width: 900px) and (min-height: 700px)';

/** As abas que ainda não têm ambiente: o nome do lugar, as portas pras telas de hoje e o chão com os Pokémon. */
function Place({
    tab,
    title,
    active,
    wild,
    children,
}: {
    tab: Tab;
    title: string;
    active: boolean;
    wild: Wild[];
    children: ReactNode;
}) {
    const clock = useSceneClock(active);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const w = useWild(clock, wild, floorOf(small ? 1 : big ? 3 : 2));
    return (
        <ClockCtx.Provider value={clock}>
            <div className={`amb-scene pl-scene pl-${tab}`} aria-hidden>
                <div className="amb-layer pl-glow" style={{ '--depth': 0.5 } as CSSProperties}>
                    <HudIcon kind={ICON[tab]} className="pl-icon" />
                </div>
                <div className="amb-layer pl-floor" style={{ '--depth': 0.2 } as CSSProperties}>
                    <WildZone wild={w} zone="floor" />
                </div>
            </div>
            <div className="amb-ui pl-ui">
                <h2 className="pl-title">{title}</h2>
                {children}
            </div>
        </ClockCtx.Provider>
    );
}

function Arena({ active, wild }: { active: boolean; wild: Wild[] }) {
    const { t } = useT();
    const go = useGame((s) => s.go);
    const liga = ligaCountdown();
    return (
        <Place tab="arena" title={t('home.amb.arenaTitle')} active={active} wild={wild}>
            <button type="button" className="door bc-tile pl-duel" onClick={() => go('duel')}>
                <span className="pl-vs" aria-hidden>
                    <img className="pixel" src="assets/cards/25.gif" alt="" />
                    <b>VS</b>
                    <img className="pixel flip" src="assets/cards/133.gif" alt="" />
                </span>
                <span>
                    <b>{t('duel.title')}</b>
                    <small>{t('duel.line')}</small>
                </span>
            </button>
            <div className="pl-soon">
                <span>
                    <HudIcon kind="players" />
                    {t('home.amb.soon2x2')}
                </span>
                <span>
                    <HudIcon kind="dice" />
                    {t('home.amb.soonArcade')}
                </span>
                {liga ? (
                    <span>
                        <HudIcon kind="cup" />
                        {t('home.amb.ligaSoon', { d: liga.d })}
                    </span>
                ) : (
                    <button type="button" className="btn small" onClick={() => go('liga')}>
                        {t('liga.home.ligaTag')}
                    </button>
                )}
            </div>
        </Place>
    );
}

/**
 * Navegação por ambientes (`?lab=ambientes`): 5 lugares lado a lado, a barra de abas embaixo (coluna à esquerda com
 * o celular deitado) e o arrasto de lado entre eles. Abre no Estádio. A troca anda 280 ms com o fundo em camadas
 * (céu devagar, cenário médio, botões junto do dedo); com "reduzir movimento", só um fade.
 */
export function Ambientes() {
    const { t, d } = useT();
    const [tab, setTabState] = useState(lastTab);
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
        setTab(snapTab(tab, e.clientX - g.x, g.vx, width()));
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

    const view: Record<Tab, (active: boolean, wild: Wild[]) => ReactNode> = {
        lab: (active, wild) => (
            <Place tab="lab" title={t('home.amb.labTitle')} active={active} wild={wild}>
                <DoorTiles which={['collection']} />
            </Place>
        ),
        rota: (active, wild) => <Rota active={active} enter={enter} wild={wild} entering={!!entering} />,
        estadio: (active, wild) => <Estadio active={active} enter={enter} wild={wild} entering={!!entering} />,
        arena: (active, wild) => <Arena active={active} wild={wild} />,
        sede: (active, wild) => (
            <Place tab="sede" title={t('home.amb.sedeTitle')} active={active} wild={wild}>
                <DoorTiles which={['profile', 'trophies']} />
            </Place>
        ),
    };

    return (
        <div
            ref={root}
            className={`amb${entering ? ` amb-entering amb-enter-${TABS[tab]}` : ''}`}
            style={{ '--pos': tab, '--n': TABS.length } as CSSProperties}
        >
            <div className="amb-top">
                <TopActions />
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
                        {view[id](i === tab, wildOf(i))}
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
            {entering && (
                <button type="button" className="amb-skip" aria-label={t('home.amb.skip')} onClick={entering} />
            )}
        </div>
    );
}
