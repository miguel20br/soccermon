import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
    FINAL_MATCH,
    GROUP_START,
    isMatchKind,
    longOpponent,
    MAP_REGIONS,
    type MapNode,
    type MapRegion,
    matchIndexOfRow,
    type NodeKind,
    nextNodes,
    regionOfRow,
    rivalTrainer,
    rivalTypes,
} from '../../engine/cup-map';
import { EVO_THRESHOLD, evolutionTarget } from '../../engine/evolution';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import {
    cupLength,
    groupOthers,
    groupTable,
    isGroupStage,
    type LongRunFields,
    YELLOW_CARDS,
} from '../../store/long-cup';
import { choiceTargets, type EventId, eventChoices } from '../../store/long-events';
import { Coach } from '../coach/Coach';
import { CountUp } from '../components/CountUp';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { MonIcon } from '../components/MonIcon';
import { PmdSprite } from '../components/PmdSprite';
import { cardSprite } from '../components/PokeCard';
import { useMedia } from '../components/Prancheta';
import { SponsorSlots } from '../components/SponsorCard';
import { TypeIcons } from '../components/TypeIcon';
import { portraitSrc } from '../portrait';
import { useClubColor } from '../profile/club';
import { reduceMotionOn } from '../settings-sync';
import { RoomDialog } from '../trophy/RoomDialog';
import { useHeld } from '../use-held';
import '../long-cup.css';
import '../trophy-room.css';

const ICON: Record<NodeKind, HudIconKind> = {
    jogo: 'players',
    ginasio: 'medal',
    mercado: 'bag',
    evento: 'question',
    treino: 'up',
    bau: 'chest',
    final: 'cup',
};
/** Altura de cada linha do mapa (px): cabe na altura da tela, entre o mínimo que dá pra tocar e o máximo que respira. */
/** Altura da casa (ícone de 50 px + rótulo = 67 px) com folga: linha mais baixa que isso põe uma casa por cima da outra. */
const ROW_MIN = 72;
const ROW_MAX = 84;
/** Faixa do nome no alto de cada região: o nome fica nela e nunca embaixo de uma casa. */
const NAME_H = 20;
const regionIndex = (row: number) => MAP_REGIONS.findIndex((r) => row >= r.rows[0] && row <= r.rows[1]);
/** Altura que o cabeçalho e o status tomam no celular em pé (o resto da tela é do mapa). */
const MOBILE_CHROME = 250;
/** Desktop e celular deitado: mapa à esquerda, ficha da casa e status num painel ao lado (o mesmo CSS, long-cup.css). */
const WIDE = '(min-width: 1000px), (min-width: 700px) and (max-height: 500px)';
/** ₽ que o mapa mostrou da última vez: a próxima vez que abrir, o número rola até o novo (a vitória rendeu). */
let lastMapMoney: { seed: string; n: number } | null = null;
/** As casas ficam entre 10% e 90% da largura (as bordas são do cenário e do nome da região). */
const nodeX = (col: number, width: number) => 10 + ((col + 0.5) / width) * 80;

const useViewportH = () =>
    useSyncExternalStore(
        (cb) => {
            window.addEventListener('resize', cb);
            return () => window.removeEventListener('resize', cb);
        },
        () => window.innerHeight,
    );

/**
 * Regiões de Kanto no mapa, de baixo pra cima (a história da Copa longa: o clube atravessa Kanto até o Planalto
 * Índigo). `rows` = primeira e última linha; `wild` = Pokémon selvagens que enfeitam a região; `who` = quem fala.
 */
const LOOK = {
    rota1: { decor: 'bush', who: 'oak' },
    floresta: { decor: 'tree', who: 'blue' },
    mtmoon: { decor: 'rock', who: 'brock' },
    cerulean: { decor: 'wave', who: 'misty' },
    vitoria: { decor: 'pillar', who: 'blue' },
} as const satisfies Record<MapRegion, { decor: string; who: string }>;
const REGIONS = MAP_REGIONS.map((r) => ({ ...r, ...LOOK[r.id] }));
type DecorKind = (typeof LOOK)[MapRegion]['decor'];
/** Cenário de cada região nas bordas do mapa (árvore, pedra, onda, arbusto, coluna), desenhado em SVG. */
const DECOR: Record<DecorKind, string> = {
    bush: 'M2 20c0-6 4-9 8-9 1-4 5-6 9-4 4-2 9 1 9 6 3 1 4 4 4 7z',
    tree: 'M16 2L5 15h6L4 24h9v6h6v-6h9l-7-9h6z',
    rock: 'M3 28l4-12 7-6 8 3 6 9 1 6z',
    wave: 'M1 14c4-5 8-5 12 0s8 5 12 0 6-4 6-4M1 24c4-5 8-5 12 0s8 5 12 0 6-4 6-4',
    pillar: 'M8 30V8h16v22M5 8h22M6 4h20v4H6z',
};
const DECOR_SPOTS = [
    { x: 4, y: 18 },
    { x: 96, y: 30 },
    { x: 5, y: 72 },
    { x: 95, y: 82 },
];
type RegionId = MapRegion;
const regionOf = (row: number) => {
    const r = regionOfRow(row);
    return { ...r, ...LOOK[r.id] };
};

/** Tempo da caminhada do seu Pokémon até a casa escolhida, antes de entrar nela. */
const WALK_MS = 520;

/**
 * Mapa da Copa longa (docs/planos/copa-longa.md): de baixo pra cima por Kanto até o Planalto Índigo, estilo Slay the
 * Spire. O seu capitão fica na casa em que você está e anda até a próxima; cada região tem a sua fala na primeira vez.
 */
export function CupMap() {
    const live = useGame((s) => s.run);
    const enterNode = useGame((s) => s.enterNode);
    const tell = useGame((s) => s.tell);
    const go = useGame((s) => s.go);
    const run = useHeld(live?.status === 'map' && live.map ? live : null);
    const [pick, setPick] = useState<string | null>(null);
    const [walking, setWalking] = useState<string | null>(null);
    const { t, d, lang } = useT();
    const scroller = useRef<HTMLDivElement>(null);
    const wide = useMedia(WIDE);
    const vh = useViewportH();
    const map = run?.map;
    const open = useMemo(() => new Set(map ? nextNodes(map, run?.at ?? null).map((n) => n.id) : []), [map, run?.at]);
    // o capitão do rival em cada casa de partida aberta (a mesma conta da janela da casa: o mesmo time)
    const rivalIcons = useMemo(() => {
        const out = new Map<string, PokemonInstance>();
        if (!map || !run) return out;
        const faced = run.opponents.filter(Boolean).map((o) => o.name);
        for (const n of map.nodes) {
            if (!open.has(n.id) || !isMatchKind(n.kind)) continue;
            const r = longOpponent(run.seed, matchIndexOfRow(n.row), n.kind, faced, run.rivalShift ?? 0);
            const c = r.lineup.find((p) => p.uid === r.captainUid) ?? r.lineup[0];
            if (c) out.set(n.id, c);
        }
        return out;
    }, [map, open, run]);

    // a linha das casas abertas aparece na tela (o mapa começa embaixo)
    useEffect(() => {
        const first = scroller.current?.querySelector<HTMLElement>('.cm-node.open');
        first?.scrollIntoView({ block: 'center' });
    }, []);

    // a casa escolhida sobe pro meio da tela, acima da ficha presa embaixo (no desktop a ficha tem o painel ao lado)
    useEffect(() => {
        if (!pick || wide) return;
        scroller.current
            ?.querySelector<HTMLElement>('.cm-node.picked')
            ?.scrollIntoView({ block: 'center', behavior: reduceMotionOn() ? 'auto' : 'smooth' });
    }, [pick, wide]);

    const moneyNow = run?.money ?? 0;
    const seedNow = run?.seed;
    useEffect(() => {
        if (seedNow) lastMapMoney = { seed: seedNow, n: moneyNow };
    }, [moneyNow, seedNow]);

    if (!run || !map) return null;
    const rowH = wide
        ? Math.max(ROW_MIN, Math.min(112, Math.floor((vh - 190) / (map.rows + 0.7))))
        : Math.max(ROW_MIN, Math.min(ROW_MAX, Math.floor((vh - MOBILE_CHROME) / (map.rows + 0.7))));
    const pad = Math.round(rowH * 0.67);
    const H = map.rows * rowH + MAP_REGIONS.length * NAME_H;
    const width = (row: number) => map.nodes.filter((x) => x.row === row).length;
    const pos = (n: MapNode) => ({
        x: nodeX(n.col, width(n.row)),
        y: H - (n.row + 0.5) * rowH - regionIndex(n.row) * NAME_H,
    });
    const path = run.path ?? [];
    const walked = new Set(path.slice(1).map((id, i) => `${path[i]}>${id}`));
    const chosen = pick ? map.nodes.find((n) => n.id === pick) : undefined;
    const played = run.results.length;
    // a próxima região do caminho ainda não contada: a fala dela aparece por cima do mapa
    const nextRow = Math.min(...[...open].map((id) => map.nodes.find((n) => n.id === id)!.row));
    const region = regionOf(Number.isFinite(nextRow) ? nextRow : 0);
    const untold = !run.told?.includes(region.id) ? region : null;
    // o capitão: na casa atual, ou embaixo do mapa antes da 1ª casa; andando até a escolhida
    const captain = run.picks.find((p) => p.uid === run.captainUid) ?? run.picks[0];
    const here = walking
        ? pos(map.nodes.find((n) => n.id === walking)!)
        : run.at
          ? pos(map.nodes.find((n) => n.id === run.at)!)
          : { x: 50, y: H + pad / 2 };
    const go2 = (id: string) => {
        setPick(null);
        if (reduceMotionOn()) {
            enterNode(id);
            return;
        }
        setWalking(id);
        window.setTimeout(() => enterNode(id), WALK_MS);
    };
    const cards = run.cards ?? 0;
    // no desktop a ficha e a fala ficam no painel ao lado; no celular, presas embaixo da tela
    const sheet = chosen && !walking && (
        <NodeSheet
            key={chosen.id}
            node={chosen}
            seed={run.seed}
            faced={run.opponents.filter(Boolean).map((o) => o.name)}
            shift={run.rivalShift ?? 0}
            lang={lang}
            onGo={() => go2(chosen.id)}
        />
    );
    const story = untold && !chosen && (
        <div key={untold.id} className={`cm-story who-${untold.who}`}>
            <img className="cm-story-who" src={`assets/trainers/${untold.who}.png`} alt="" />
            <RoomDialog
                text={`${d.longCup.story[untold.id].who}: ${d.longCup.story[untold.id].text}`}
                action={{ label: t('longCup.storyNext'), run: () => tell(untold.id) }}
                onClose={() => tell(untold.id)}
            />
        </div>
    );

    return (
        <div className={`menu-screen cm cm-route${chosen ? ' has-sheet' : ''}${story ? ' has-story' : ''}`}>
            <MenuHead
                title={t('longCup.title')}
                icon="liga"
                tag={t('longCup.step', { n: Math.min(played + 1, cupLength(run)), total: cupLength(run) })}
                onBack={() => go('home')}
            />
            <Coach
                id="rota"
                targets={['.cm-node.open', '.cm-cards', '.cm-money']}
                when={played === 0 && !story && !chosen}
            />
            <div className="cm-body">
                <aside className="cm-side">
                    <div className="cm-status bc-surface">
                        <span className="money cm-money">
                            <CountUp
                                to={run.money ?? 0}
                                from={lastMapMoney?.seed === run.seed ? lastMapMoney.n : (run.money ?? 0)}
                                ms={300}
                                format={(n) => t('shop.money', { n })}
                            />
                        </span>
                        <span
                            className={`cm-cards${cards > 0 ? ' used' : ''}`}
                            aria-label={`${t('longCup.cards')}: ${cards}/${YELLOW_CARDS}`}
                            role="img"
                        >
                            <i className={`cm-card${cards > 0 ? ' on' : ''}`} />
                            {cards}/{YELLOW_CARDS}
                        </span>
                        {/* a regra do amarelo: o balão do mapa ensina e o cartão do resultado explica quando cai */}
                        {!!run.sponsors?.length && <SponsorSlots sponsors={run.sponsors} />}
                    </div>
                    {run.eventNote && <EventNote note={run.eventNote} picks={run.picks} />}
                    {wide && (sheet || story || <p className="cm-choose muted">{t('longCup.choose')}</p>)}
                </aside>

                <div className="cm-scroll" ref={scroller}>
                    <div className="cm-map" style={{ height: H + pad }}>
                        {REGIONS.map((r, i) => {
                            const top = H - (r.rows[1] + 1) * rowH - (i + 1) * NAME_H;
                            const h = (r.rows[1] - r.rows[0] + 1) * rowH + NAME_H + (r.rows[0] === 0 ? pad : 0);
                            return (
                                <div key={r.id} className={`cm-region rg-${r.id}`} style={{ top, height: h }}>
                                    <span className="cm-region-name">{d.longCup.region[r.id as RegionId]}</span>
                                    {DECOR_SPOTS.map((p) => (
                                        <svg
                                            key={`${p.x}-${p.y}`}
                                            className={`cm-decor d-${r.decor}`}
                                            viewBox="0 0 32 32"
                                            style={{ left: `${p.x}%`, top: `${p.y}%` } as CSSProperties}
                                            aria-hidden
                                        >
                                            <path d={DECOR[r.decor]} />
                                        </svg>
                                    ))}
                                </div>
                            );
                        })}
                        <svg className="cm-lines" viewBox={`0 0 100 ${H + pad}`} preserveAspectRatio="none" aria-hidden>
                            {map.nodes.flatMap((n) =>
                                n.next.map((id) => {
                                    const to = map.nodes.find((x) => x.id === id)!;
                                    const a = pos(n);
                                    const b = pos(to);
                                    return (
                                        <line
                                            key={`${n.id}>${id}`}
                                            className={walked.has(`${n.id}>${id}`) ? 'walked' : ''}
                                            x1={a.x}
                                            y1={a.y}
                                            x2={b.x}
                                            y2={b.y}
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    );
                                }),
                            )}
                        </svg>
                        {map.nodes.map((n) => {
                            const p = pos(n);
                            const isOpen = open.has(n.id) && !walking;
                            const state =
                                n.id === run.at ? ' at' : path.includes(n.id) ? ' done' : isOpen ? ' open' : '';
                            return (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={`cm-node k-${n.kind}${state}${pick === n.id ? ' picked' : ''}`}
                                    style={{ left: `${p.x}%`, top: p.y } as CSSProperties}
                                    disabled={!isOpen}
                                    aria-label={t(`longCup.kind.${n.kind}`)}
                                    onClick={() => {
                                        setPick(pick === n.id ? null : n.id);
                                        // quem já escolheu o caminho não precisa mais da fala por cima do mapa
                                        if (untold) tell(untold.id);
                                    }}
                                >
                                    <HudIcon kind={ICON[n.kind]} />
                                    {rivalIcons.has(n.id) && (
                                        <MonIcon
                                            className="cm-node-rival"
                                            id={rivalIcons.get(n.id)!.speciesId}
                                            shiny={rivalIcons.get(n.id)!.shiny}
                                        />
                                    )}
                                    <span className="cm-label">{t(`longCup.kind.${n.kind}`)}</span>
                                </button>
                            );
                        })}
                        {captain && (
                            <img
                                className={`cm-me pixel${walking ? ' walking' : ''}`}
                                src={cardSprite(captain)}
                                alt=""
                                style={
                                    {
                                        left: `${here.x}%`,
                                        top: here.y,
                                        // ao lado da casa, pro lado do meio do mapa: nunca em cima da próxima casa
                                        translate: here.x <= 50 ? '34px -50%' : 'calc(-100% - 34px) -50%',
                                    } as CSSProperties
                                }
                            />
                        )}
                    </div>
                </div>
            </div>

            {!wide && sheet && createPortal(sheet, document.body)}
            {!wide && story && createPortal(story, document.body)}
        </div>
    );
}

/** Escolhas de evento em que o alvo é quem sofre o efeito (o nome dele abre a linha). */
const AFFECTS_TARGET = new Set(['carrinho:parar', 'treinoPuxado:puxado', 'creche:deixar']);

/** O que a última escolha de evento fez, numa linha acima do mapa, até a próxima casa. */
function EventNote({
    note,
    picks,
}: {
    note: NonNullable<LongRunFields['eventNote']>;
    picks: readonly PokemonInstance[];
}) {
    const { t, d } = useT();
    const ev = d.longCup.events[note.id];
    const [label, effect] = ev?.choices[note.choice] ?? ['', ''];
    const mon = note.target ? picks.find((p) => p.uid === note.target) : undefined;
    const who = mon && AFFECTS_TARGET.has(`${note.id}:${note.choice}`) ? viewInstance(mon).displayName : label;
    const money = note.cost ? ` ${note.cost > 0 ? '−' : '+'}${t('shop.money', { n: Math.abs(note.cost) })}` : '';
    if (!effect && !money) return null;
    return (
        <div className="cm-note bc-surface" role="status">
            <span className="cm-note-icon" style={{ '--ev': EVENT_ART[note.id as EventId].color } as CSSProperties}>
                <HudIcon kind={EVENT_ART[note.id as EventId].icon} />
            </span>
            <span>{`${who}${effect ? `: ${effect}` : ''}${money}`}</span>
        </div>
    );
}

/** O que a casa escolhida é (e o rival, se for partida, com o treinador dele), com o "Ir". */
function NodeSheet({
    node,
    seed,
    faced,
    shift,
    lang,
    onGo,
}: {
    node: MapNode;
    seed: string;
    faced: string[];
    shift: number;
    lang: 'pt' | 'en';
    onGo: () => void;
}) {
    const { t } = useT();
    const rival = useMemo(
        () => (isMatchKind(node.kind) ? longOpponent(seed, matchIndexOfRow(node.row), node.kind, faced, shift) : null),
        [node, seed, faced, shift],
    );
    const trainer = rival ? rivalTrainer(rival.name) : undefined;
    const avg = rival
        ? Math.round(rival.lineup.reduce((s, p) => s + viewInstance(p).overall, 0) / (rival.lineup.length || 1))
        : 0;
    return (
        <div
            className={`cm-sheet bc-surface bc-stripe k-${node.kind}`}
            data-exit
            role="dialog"
            aria-label={t(`longCup.kind.${node.kind}`)}
        >
            <div className="cm-sheet-head">
                {trainer ? (
                    <img className="cm-sheet-trainer" src={`assets/trainers/${trainer}.png`} alt="" />
                ) : (
                    <span className="cm-sheet-icon">
                        <HudIcon kind={ICON[node.kind]} />
                    </span>
                )}
                <span>
                    <b>{t(`longCup.kind.${node.kind}`)}</b>
                    <small>{t(`longCup.desc.${node.kind}`)}</small>
                </span>
            </div>
            {rival && (
                <div className="cm-rival">
                    <span className="muted cm-rival-name">
                        {t('longCup.rival')}: <b>{clubName(rival.name, lang)}</b>
                        <span className="cm-types">
                            <TypeIcons types={rivalTypes(rival.name)} size={16} />
                        </span>
                        <span>{t('longCup.avg', { n: avg })}</span>
                    </span>
                    <span className="cm-rival-team">
                        {rival.lineup.map((p) => (
                            <MonIcon key={p.uid} id={p.speciesId} shiny={p.shiny} label={viewInstance(p).displayName} />
                        ))}
                    </span>
                </div>
            )}
            <button type="button" className="btn primary wide" onClick={onGo}>
                {t('longCup.go')}
                <HudIcon kind="next" />
            </button>
        </div>
    );
}

/** Casa Treino: encher a barra de evolução de alguém (metade), ou 1 de 2 itens se ninguém evolui; ou descansar (+1 sorteio). */
export function Training() {
    const live = useGame((s) => s.run);
    const train = useGame((s) => s.train);
    const go = useGame((s) => s.go);
    const run = useHeld(live?.status === 'treino' ? live : null);
    const { t } = useT();
    if (!run) return null;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const evolvers = [...run.lineup, ...run.bench]
        .map((u) => byUid.get(u))
        .filter((p) => p && evolutionTarget(p.speciesId, p.uid) !== null);
    return (
        <div className="menu-screen cm">
            <MenuHead
                title={t('longCup.treino.title')}
                icon="liga"
                tag={t('longCup.title')}
                onBack={() => go('home')}
            />
            {evolvers.length > 0 && (
                <div className="panel cm-train">
                    <h2>{t('longCup.treino.evo')}</h2>
                    <p className="muted">{t('longCup.treino.evoLine')}</p>
                    <div className="squad-strip">
                        {evolvers.map((p) => {
                            const pct = Math.min(100, Math.round(((p!.evo ?? 0) / EVO_THRESHOLD) * 100));
                            return (
                                <button
                                    key={p!.uid}
                                    type="button"
                                    className="mini target-btn"
                                    onClick={() => {
                                        train('evo', p!.uid);
                                    }}
                                >
                                    <img className="pixel" src={cardSprite(p!)} alt="" />
                                    <span>
                                        <b>{viewInstance(p!).displayName}</b>
                                        <span className="cm-evo" style={{ '--p': `${pct}%` } as CSSProperties}>
                                            <i />
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* ninguém evolui: treino de técnica, 1 de 2 itens (sem ele, o último Treino era um clique morto) */}
            {evolvers.length === 0 && (
                <div className="panel cm-train">
                    <h2>{t('longCup.treino.item')}</h2>
                    <p className="muted">{t('longCup.treino.itemLine')}</p>
                    <button
                        type="button"
                        className="btn primary"
                        onClick={() => {
                            train('item');
                        }}
                    >
                        <HudIcon kind="bag" />
                        {t('longCup.treino.itemGo')}
                    </button>
                </div>
            )}
            <div className="panel cm-train">
                <h2>{t('longCup.treino.rest')}</h2>
                <p className="muted">{t('longCup.treino.restLine')}</p>
                {/* o time tirando um cochilo (PMD Sleep; quem não tem, o sprite da carta) */}
                <div className="cm-rest-squad" aria-hidden>
                    {run.lineup
                        .map((u) => byUid.get(u))
                        .map(
                            (p) =>
                                p && (
                                    <PmdSprite
                                        key={p.uid}
                                        id={p.speciesId}
                                        shiny={p.shiny}
                                        anim="Sleep"
                                        fallback={<img className="pixel" src={cardSprite(p)} alt="" />}
                                    />
                                ),
                        )}
                </div>
                <button
                    type="button"
                    className="btn"
                    onClick={() => {
                        train('rest');
                    }}
                >
                    <HudIcon kind="reroll" />
                    {t('longCup.treino.restGo')}
                </button>
            </div>
        </div>
    );
}

/** Emblema e cor de cada evento (o desenho do que aconteceu, ao lado de quem conta). */
const EVENT_ART: Record<EventId, { icon: HudIconKind; color: string }> = {
    carrinho: { icon: 'medkit', color: '#d9452f' },
    patrocinador: { icon: 'briefcase', color: '#3a3a46' },
    capitao: { icon: 'armband', color: '#c9871c' },
    olheiro: { icon: 'binoculars', color: '#2f7fc4' },
    entrevista: { icon: 'mic', color: '#7a4bc4' },
    perdido: { icon: 'paw', color: '#4e8c43' },
    treinoPuxado: { icon: 'dumbbell', color: '#d1652a' },
    creche: { icon: 'egg', color: '#c9a23a' },
};

/** Evento "?" da Copa longa: quem fala, o que aconteceu, as escolhas e, se a escolha pede, com quem. */
export function EventScreen() {
    const live = useGame((s) => s.run);
    const chooseEvent = useGame((s) => s.chooseEvent);
    const go = useGame((s) => s.go);
    const run = useHeld(live?.status === 'event' && live.event ? live : null);
    const [choice, setChoice] = useState<string | null>(null);
    const [card, setCard] = useState(0);
    const [sub, setSub] = useState<string | null>(null);
    const { t, d } = useT();
    if (!run?.event) return null;
    const ev = run.event;
    const txt = d.longCup.events[ev.id];
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const nameOf = (u: string) => (byUid.get(u) ? viewInstance(byUid.get(u)!).displayName : '');
    const choices = eventChoices(run, ev);
    const picked = choices.find((c) => c.id === choice);
    const targets = picked ? choiceTargets(run, ev, picked.need) : [];
    const pick = (id: string) => {
        const c = choices.find((x) => x.id === id)!;
        if (c.need === 'none') chooseEvent(id);
        else {
            setChoice(choice === id ? null : id);
            setSub(null);
        }
    };
    // venda do capitão: depois do reserva, o novo capitão sai da escalação com ele na vaga
    const lineupAfter = sub ? run.lineup.map((u) => (u === run.captainUid ? sub : u)) : [];
    // carrinho: quem pode parar aparece com cara de dor; treino puxado: com cara de tonto (fica 1 partida fora)
    const face =
        picked?.need === 'involved' ? ['pain', 'dizzy'] : picked?.need === 'evolver' ? ['dizzy', 'sigh'] : null;
    const strip = (uids: string[], onPick: (u: string) => void, active?: string | null, faces?: string[] | null) => (
        <div className="squad-strip">
            {uids.map((u) => (
                <button
                    key={u}
                    type="button"
                    className="mini target-btn"
                    aria-pressed={active === u}
                    onClick={() => {
                        onPick(u);
                    }}
                >
                    {faces ? (
                        <img
                            className="pixel cm-face"
                            src={portraitSrc(byUid.get(u)!.speciesId, faces)}
                            alt=""
                            width="40"
                            height="40"
                        />
                    ) : (
                        <img className="pixel" src={cardSprite(byUid.get(u)!)} alt="" />
                    )}
                    <span>
                        <b>{nameOf(u)}</b>
                    </span>
                </button>
            ))}
        </div>
    );
    return (
        <div className="menu-screen cm cm-ev">
            <MenuHead title={txt.title} icon="liga" tag={t('longCup.title')} onBack={() => go('home')} />
            <div className="cm-event bc-surface bc-stripe" style={{ '--ev': EVENT_ART[ev.id].color } as CSSProperties}>
                <span className="cm-event-emblem">
                    <HudIcon kind={EVENT_ART[ev.id].icon} />
                </span>
                <img className="cm-story-who" src={`assets/trainers/${txt.who}.png`} alt="" />
                <p>{fmtNames(txt.text, ev.uids?.map(nameOf) ?? [])}</p>
                {ev.id === 'carrinho' && !!ev.uids?.length && (
                    <span className="cm-event-faces" aria-hidden>
                        {ev.uids.map((u) =>
                            byUid.get(u) ? (
                                <img
                                    key={u}
                                    className="pixel cm-face"
                                    src={portraitSrc(byUid.get(u)!.speciesId, ['pain', 'dizzy'])}
                                    alt=""
                                    width="40"
                                    height="40"
                                />
                            ) : null,
                        )}
                    </span>
                )}
            </div>
            {!!ev.cards?.length && (
                <div className="cm-event-cards">
                    {ev.cards.map((c, i) => (
                        <FutCard
                            key={c.uid}
                            inst={c}
                            size="sm"
                            selected={ev.cards!.length > 1 && card === i}
                            action={
                                ev.cards!.length > 1
                                    ? { label: t('longCup.pickCard'), onClick: () => setCard(i) }
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}
            <div className="cm-choices">
                {choices.map((c) => {
                    const [label, effect] = txt.choices[c.id] ?? [c.id, ''];
                    return (
                        <button
                            key={c.id}
                            type="button"
                            className={`cm-choice bc-tile${choice === c.id ? ' on' : ''}`}
                            disabled={!c.ok}
                            onClick={() => pick(c.id)}
                        >
                            <span>
                                <b>{label}</b>
                                {effect && <small>{effect}</small>}
                            </span>
                            {c.cost !== 0 && (
                                <span className={`money ${c.cost > 0 ? 'cost' : 'gain'}`}>
                                    {c.cost > 0 ? '−' : '+'}
                                    {t('shop.money', { n: Math.abs(c.cost) })}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            {picked && (
                <div className="panel reward-pick" data-exit>
                    <h2>{t(picked.need === 'captainSale' ? 'longCup.pickSub' : 'longCup.pickWho')}</h2>
                    {picked.need === 'captainSale'
                        ? strip(targets, setSub, sub)
                        : strip(targets, (u) => chooseEvent(picked.id, u, card), null, face)}
                    {picked.need === 'captainSale' && sub && (
                        <>
                            <h2>{t('longCup.pickCaptain')}</h2>
                            {strip(lineupAfter, (u) => chooseEvent(picked.id, sub, 0, u))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/** "{a} e {b}" com os nomes dos envolvidos. */
const fmtNames = (text: string, names: string[]) => text.replace('{a}', names[0] ?? '').replace('{b}', names[1] ?? '');

/**
 * Fase de grupos da Rota Índigo, no Planalto (docs/planos/campeonato.md): a tabela (os 2 primeiros vão pra Final), as
 * 3 rodadas com o seu jogo e o dos outros, e o botão da próxima partida. A fala do Lance abre o Planalto.
 */
export function GroupScreen() {
    const live = useGame((s) => s.run);
    const playNext = useGame((s) => s.playNext);
    const tell = useGame((s) => s.tell);
    const go = useGame((s) => s.go);
    const run = useHeld(live?.status === 'group' && live.group ? live : null);
    const color = useClubColor();
    const { t, d, lang } = useT();
    if (!run?.group) return null;
    const rows = groupTable(run, color);
    const others = groupOthers(run.seed);
    const played = run.results.filter((r) => isGroupStage(r.stage)).length;
    const toFinal = run.results.length >= FINAL_MATCH;
    const teamName = (i: number) => (i === 0 ? run.teamName : clubName(run.group!.rivals[i - 1].name, lang));
    const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
    const untold = !run.told?.includes('planalto');
    return (
        <div className="menu-screen cm">
            <MenuHead
                title={t('longCup.region.planalto')}
                icon="liga"
                tag={t('longCup.groupTag')}
                onBack={() => go('home')}
            />
            <section className="gp-table bc-surface" aria-label={t('longCup.groupTable')}>
                <div className="gp-row gp-head">
                    <span />
                    <span>{t('longCup.groupTable')}</span>
                    <span>{t('longCup.colPlayed')}</span>
                    <span>{t('longCup.colGd')}</span>
                    <span>{t('longCup.colPts')}</span>
                </div>
                {rows.map((r, i) => (
                    <div
                        key={r.name}
                        className={`gp-row${r.you ? ' you' : ''}${i < 2 ? ' up' : ''}`}
                        style={{ '--tc': hex(r.color) } as CSSProperties}
                    >
                        <b className="gp-pos">{i + 1}</b>
                        <span className="gp-team">
                            <i />
                            {r.you ? r.name : clubName(r.name, lang)}
                        </span>
                        <span>{r.played}</span>
                        <span>{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</span>
                        <b>{r.pts}</b>
                    </div>
                ))}
                <small className="gp-note">{t('longCup.groupNote')}</small>
            </section>

            <div className="gp-days">
                {run.group.rivals.map((rival, md) => {
                    const mine = run.results.find((x) => x.stage === GROUP_START + md);
                    const o = others[md];
                    const trainer = rivalTrainer(rival.name);
                    return (
                        <div key={rival.name} className={`gp-day${md === played && !toFinal ? ' now' : ''}`}>
                            <span className="gp-day-head">
                                <span className="gp-day-tag">{t('longCup.matchday', { n: md + 1 })}</span>
                                <span className="gp-types">
                                    <TypeIcons types={rivalTypes(rival.name)} label size={16} />
                                </span>
                            </span>
                            <span className="gp-game mine">
                                {trainer && (
                                    <img className="gp-trainer" src={`assets/trainers/${trainer}.png`} alt="" />
                                )}
                                {run.teamName} <b>{mine ? `${mine.score[0]} x ${mine.score[1]}` : 'x'}</b>
                                {mine?.shootout && <small className="gp-pen">{t('longCup.pens')}</small>}{' '}
                                {clubName(rival.name, lang)}
                            </span>
                            <span className="gp-game muted">
                                {teamName(o.a)} <b>{mine ? `${o.score[0]} x ${o.score[1]}` : 'x'}</b>
                                {mine && o.shootout && <small className="gp-pen">{t('longCup.pens')}</small>}{' '}
                                {teamName(o.b)}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bc-thumbbar">
                <button
                    type="button"
                    className="btn primary wide"
                    onClick={() => {
                        playNext();
                    }}
                >
                    {toFinal ? t('longCup.playFinal') : t('longCup.playMatchday', { n: played + 1 })}
                    <HudIcon kind="next" />
                </button>
            </div>
            <Coach id="rotaGrupo" targets={['.gp-table']} when={!untold} />
            {untold &&
                createPortal(
                    <div className="cm-story who-lance">
                        <img className="cm-story-who" src="assets/trainers/lance.png" alt="" />
                        <RoomDialog
                            text={`${d.longCup.story.planalto.who}: ${d.longCup.story.planalto.text}`}
                            action={{ label: t('longCup.storyNext'), run: () => tell('planalto') }}
                            onClose={() => tell('planalto')}
                        />
                    </div>,
                    document.body,
                )}
        </div>
    );
}
