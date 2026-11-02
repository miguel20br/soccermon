import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
    FINAL_MATCH,
    GROUP_START,
    isMatchKind,
    MAP_REGIONS,
    type MapNode,
    type MapRegion,
    type NodeKind,
    nextNodes,
    ROTA_RULES,
    regionOfRow,
    rivalTrainer,
    rivalTypes,
} from '../../engine/cup-map';
import { evolutionTarget, evolveInstance, evoThreshold, type Stone, stoneInto } from '../../engine/evolution';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { EventBus } from '../../game/EventBus';
import type { MatchEvolution } from '../../game/scenes/MatchScene';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { lookOfCupClub, lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import {
    groupOthers,
    groupTable,
    isGroupStage,
    type LongRunFields,
    nodeOpponent,
    YELLOW_CARDS,
} from '../../store/long-cup';
import { choiceTargets, type EventId, eventChoices, stoners } from '../../store/long-events';
import { Coach } from '../coach/Coach';
import { CountUp } from '../components/CountUp';
import { EvolutionOverlay } from '../components/EvolutionOverlay';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { MonIcon } from '../components/MonIcon';
import { cardSprite } from '../components/PokeCard';
import { useMedia } from '../components/Prancheta';
import { SponsorSlots } from '../components/SponsorCard';
import { TypeIcons } from '../components/TypeIcon';
import { portraitSrc } from '../portrait';
import { Crest } from '../profile/Crest';
import { useClubColor } from '../profile/club';
import { lineupAverage } from '../rating';
import { reduceMotionOn } from '../settings-sync';
import { RoomDialog } from '../trophy/RoomDialog';
import { TYPE_COLOR } from '../type-colors';
import { useHeld } from '../use-held';
import '../long-cup.css';
import '../trophy-room.css';
import { FORMATIONS } from '../../engine/formations';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { FieldSprite } from '../ambientes/FieldSprite';
import { InfoSheet } from '../kit/controls';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';

const ICON: Record<NodeKind, HudIconKind> = {
    jogo: 'players',
    ginasio: 'medal',
    mercado: 'bag',
    evento: 'question',
    treino: 'dumbbell',
    bau: 'chest',
    centro: 'heart',
    final: 'cup',
};
/** Cor de cada pedra: a do tipo de quem ela evolui (a da Lua, a de Fada do Clefairy). */
const STONE_COLOR: Record<Stone, string> = {
    lua: TYPE_COLOR.Fairy,
    agua: TYPE_COLOR.Water,
    trovao: TYPE_COLOR.Electric,
    folha: TYPE_COLOR.Grass,
    fogo: TYPE_COLOR.Fire,
};
/** A gema da pedra, na cor dela. */
const StoneMark = ({ stone, className = 'cm-stone' }: { stone: Stone; className?: string }) => (
    <span className={className} style={{ '--stone': STONE_COLOR[stone] } as CSSProperties}>
        <HudIcon kind="stone" />
    </span>
);
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
        for (const n of map.nodes) {
            if (!open.has(n.id) || !isMatchKind(n.kind)) continue;
            const r = nodeOpponent(run, n);
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
        <NodeSheet key={chosen.id} node={chosen} run={run} lang={lang} onGo={() => go2(chosen.id)} />
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
            {/* a fase ("Partida 3 de 8") só na barra da copa (brand guide): aqui ela contava de outro jeito e brigava */}
            <MenuHead title={t('longCup.title')} hud="map" />
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
                                    aria-label={[
                                        t(`longCup.kind.${n.kind}`),
                                        [
                                            n.prize && n.prize !== 'pedra' && t(`longCup.prize.${n.prize}`),
                                            n.stone && t(`longCup.stone.${n.stone}`),
                                        ]
                                            .filter(Boolean)
                                            .join(' + '),
                                    ]
                                        .filter(Boolean)
                                        .join(': ')}
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
                                    {n.stone && <StoneMark stone={n.stone} className="cm-node-stone" />}
                                    {/* o Jogo mostra o prêmio no lugar do nome; as casas abertas, os tipos do caminho */}
                                    <span className="cm-label">
                                        {n.prize === 'pedra' && n.stone
                                            ? t(`longCup.stoneShort.${n.stone}`)
                                            : n.prize && n.kind === 'jogo'
                                              ? t(`longCup.prizeShort.${n.prize}`)
                                              : t(`longCup.kind.${n.kind}`)}
                                    </span>
                                    {isOpen && n.types && (
                                        <span className="cm-node-types">
                                            <TypeIcons types={n.types} size={12} />
                                        </span>
                                    )}
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
const AFFECTS_TARGET = new Set(['carrinho:parar', 'fosseis:pedra', 'pedra:usar', 'ovo:nasceu']);

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
    const art = EVENT_ART[note.id as EventId];
    const [rawLabel, rawEffect] = ev?.choices[note.choice] ?? ['', ''];
    const label = fmtNames(rawLabel, note.names ?? []);
    const effect = fmtNames(rawEffect, note.names ?? []);
    const mon = note.target ? picks.find((p) => p.uid === note.target) : undefined;
    const who = mon && AFFECTS_TARGET.has(`${note.id}:${note.choice}`) ? viewInstance(mon).displayName : label;
    const money = note.cost ? ` ${note.cost > 0 ? '−' : '+'}${t('shop.money', { n: Math.abs(note.cost) })}` : '';
    if ((!effect && !money) || !art) return null;
    return (
        <div className="cm-note bc-surface" role="status">
            <span className="cm-note-icon" style={{ '--ev': art.color } as CSSProperties}>
                <HudIcon kind={art.icon} />
            </span>
            <span>{`${who}${effect ? `: ${effect}` : ''}${money}`}</span>
        </div>
    );
}

/** O que a casa escolhida é (e o rival, se for partida, com o treinador dele), com o "Ir". */
function NodeSheet({
    node,
    run,
    lang,
    onGo,
}: {
    node: MapNode;
    run: Parameters<typeof nodeOpponent>[0] & Parameters<typeof stoners>[0];
    lang: 'pt' | 'en';
    onGo: () => void;
}) {
    const { t } = useT();
    const rival = useMemo(() => (isMatchKind(node.kind) ? nodeOpponent(run, node) : null), [node, run]);
    // a pedra: quem do seu time evolui com ela
    const users = node.stone ? stoners(run, node.stone).map((p) => viewInstance(p).displayName) : [];
    const trainer = rival ? rivalTrainer(rival.name) : undefined;
    // a mesma conta da escalação e do VERSUS (nota na vaga): a ficha dizia 55 e a escalação 54
    const avg = rival ? lineupAverage(rival.lineup, rival.formation) : 0;
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
                    <small>
                        {t(
                            node.kind === 'jogo' && ROTA_RULES.rivalEveryJogo
                                ? 'longCup.desc.jogoRival'
                                : `longCup.desc.${node.kind}`,
                        )}
                    </small>
                </span>
            </div>
            {node.kind === 'jogo' && node.prize && node.prize !== 'pedra' && (
                <p className="cm-prize">
                    <b>
                        {t('longCup.prizeLabel')}: {t(`longCup.prize.${node.prize}`)}
                    </b>{' '}
                    <span className="muted">
                        {t(
                            node.prize === 'money' && ROTA_RULES.rivalEveryJogo
                                ? 'longCup.prizeDesc.moneyRival'
                                : `longCup.prizeDesc.${node.prize}`,
                        )}
                    </span>
                </p>
            )}
            {/* a pedra vem junto do prêmio (Rota guardada antes: no lugar dele) */}
            {node.kind === 'jogo' && node.stone && (
                <p className="cm-prize">
                    <StoneMark stone={node.stone} />
                    <b>
                        {node.prize === 'pedra' ? `${t('longCup.prizeLabel')}: ` : '+ '}
                        {t(`longCup.stone.${node.stone}`)}
                    </b>{' '}
                    <span className="muted">
                        {t(ROTA_RULES.rivalEveryJogo ? 'longCup.prizeDesc.pedraRival' : 'longCup.prizeDesc.pedra')}{' '}
                        {users.length ? t('longCup.stoneWho', { names: users.join(', ') }) : t('longCup.stoneNobody')}
                    </span>
                </p>
            )}
            {node.types && node.kind !== 'final' && (
                <span className="cm-branch muted">
                    {t('longCup.branch')}
                    <TypeIcons types={node.types} label size={16} />
                </span>
            )}
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
            <button type="button" className="btn confirm wide" onClick={onGo}>
                {t('longCup.go')}
                <HudIcon kind="next" />
            </button>
        </div>
    );
}

/** Treino na quadra deitada (celular deitado e PC): o gol do time fica à esquerda. */
const TR_WIDE = '(orientation: landscape)';
const TR_SMALL = '(max-width: 359px), (max-height: 560px)';
/** PC grande: os sprites a 3x (a quadra passa de 700 px). */
const TR_BIG = '(min-width: 1250px) and (min-height: 840px)';

/**
 * Casa Treino como cena (cara-de-jogo.md, Rota Índigo): a quadra de treino do ginásio com os titulares nas posições e
 * os reservas na beira. Tocar em quem evolui marca e a placa mostra a barra enchendo pela metade; o colchonete é o
 * Descansar (+1 sorteio); se ninguém evolui, o suporte de halteres é o treino de técnica (1 de 2 itens). O botão do
 * polegar faz o que estiver marcado.
 */
export function Training() {
    const live = useGame((s) => s.run);
    const train = useGame((s) => s.train);
    const run = useHeld(live?.status === 'treino' ? live : null);
    // o uid de quem treina, ou 'rest' / 'item'
    const [mark, setMark] = useState<string | null>(null);
    const clock = useSceneClock(true);
    const wide = useMedia(TR_WIDE);
    const small = useMedia(TR_SMALL);
    const big = useMedia(TR_BIG);
    const { t } = useT();
    if (!run) return null;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const canEvo = (p: PokemonInstance) => evolutionTarget(p.speciesId, p.uid) !== null;
    const team = [...run.lineup, ...run.bench].flatMap((u) => byUid.get(u) ?? []);
    const anyEvo = team.some(canEvo);
    const max = evoThreshold(run.sponsors);
    const pctOf = (p: PokemonInstance) => Math.min(100, Math.round(((p.evo ?? 0) / max) * 100));
    const marked = mark && mark !== 'rest' && mark !== 'item' ? byUid.get(mark) : undefined;
    const into = marked ? evolutionTarget(marked.speciesId, marked.uid) : null;
    const resting = mark === 'rest';
    const scale = small ? 1 : big ? 3 : 2;
    const ui = FORMATIONS[run.formation].ui;
    const toggle = (id: string) => setMark(mark === id ? null : id);

    const mon = (p: PokemonInstance, cls: string, style?: CSSProperties) => {
        const evo = canEvo(p);
        const on = mark === p.uid;
        const body = (
            <>
                <i className="tr-shadow" />
                <FieldSprite
                    id={p.speciesId}
                    shiny={p.shiny}
                    anim={on ? 'Hop' : 'Idle'}
                    dir={wide ? 2 : 4}
                    scale={scale}
                    play={!resting}
                >
                    {resting && <i className="tr-zzz">z</i>}
                </FieldSprite>
                {evo && (
                    <span className="cm-evo tr-evo" style={{ '--p': `${pctOf(p)}%` } as CSSProperties}>
                        <i />
                    </span>
                )}
            </>
        );
        return evo ? (
            <button
                key={p.uid}
                type="button"
                className={`tr-mon ${cls}${on ? ' on' : ''}`}
                style={style}
                aria-pressed={on}
                aria-label={`${viewInstance(p).displayName}: ${t('team.board.evo', { n: pctOf(p) })}`}
                onClick={() => toggle(p.uid)}
            >
                {body}
            </button>
        ) : (
            <span key={p.uid} className={`tr-mon ${cls} still`} style={style} aria-hidden>
                {body}
            </span>
        );
    };

    const label = marked
        ? t('longCup.treino.go', { name: viewInstance(marked).displayName })
        : resting
          ? t('longCup.treino.restGo')
          : mark === 'item'
            ? t('longCup.treino.itemGo')
            : t(anyEvo ? 'longCup.treino.pick' : 'longCup.treino.pickObj');

    return (
        <ClockCtx.Provider value={clock}>
            <Stage
                className="tr-stage"
                action={
                    <button
                        type="button"
                        className="btn confirm wide"
                        disabled={!mark}
                        onClick={() => {
                            if (marked) train('evo', marked.uid);
                            else if (mark === 'rest') train('rest');
                            else if (mark === 'item') train('item');
                        }}
                    >
                        <HudIcon kind={resting ? 'reroll' : mark === 'item' ? 'bag' : 'dumbbell'} />
                        {label}
                    </button>
                }
            >
                <div className="draft-head bc-screenhead tr-head">
                    <h1>{t('longCup.treino.title')}</h1>
                    <InfoSheet title={t('longCup.treino.title')}>
                        <p>{t(anyEvo ? 'longCup.treino.evoLine' : 'longCup.treino.itemLine')}</p>
                        <p>
                            {t('longCup.treino.rest')}: {t('longCup.treino.restLine')}
                        </p>
                    </InfoSheet>
                </div>
                {/* a placa do que está marcado; a chave nova faz ela entrar de novo (nada teleporta). Sem nada marcado,
                    só o subtítulo: o "toque em quem treina" já está na barra do polegar */}
                <div
                    className={`tr-plaque ${!mark && anyEvo ? 'tr-sub' : 'bc-surface'}`}
                    key={mark ?? 'none'}
                    aria-live="polite"
                >
                    {marked ? (
                        <>
                            <b>
                                {viewInstance(marked).displayName}
                                {into !== null && ` → ${viewInstance(evolveInstance(marked, into)).displayName}`}
                            </b>
                            <span
                                className="tr-bar"
                                style={
                                    {
                                        '--p': `${pctOf(marked)}%`,
                                        '--q': `${Math.min(100, pctOf(marked) + 50)}%`,
                                    } as CSSProperties
                                }
                            >
                                <i className="tr-bar-now" />
                                <i className="tr-bar-add" />
                            </span>
                            <small>
                                {pctOf(marked)}% → {Math.min(100, pctOf(marked) + 50)}%
                            </small>
                        </>
                    ) : resting ? (
                        <>
                            <b>{t('longCup.treino.rest')}</b>
                            <small>{t('longCup.treino.restSign')}</small>
                        </>
                    ) : mark === 'item' ? (
                        <>
                            <b>{t('longCup.treino.item')}</b>
                            <small>{t('longCup.treino.itemLine')}</small>
                        </>
                    ) : anyEvo ? (
                        <small>{t('longCup.treino.evoLine')}</small>
                    ) : (
                        <>
                            <b>{t('longCup.treino.none')}</b>
                            <small>{t('longCup.treino.itemLine')}</small>
                        </>
                    )}
                </div>
                <div className={`tr-gym${wide ? ' wide' : ''}${resting ? ' resting' : ''}`}>
                    <div className="tr-court">
                        <svg className="tr-lines" viewBox="0 0 60 80" preserveAspectRatio="none" aria-hidden>
                            <rect x="2" y="2" width="56" height="76" />
                            <line x1="2" y1="40" x2="58" y2="40" />
                            <circle cx="30" cy="40" r="7" />
                            <path d="M18 2a12 10 0 0 0 24 0M18 78a12 10 0 0 1 24 0" />
                        </svg>
                        {/* o cone e a escada de agilidade: enfeite do treino */}
                        <i className="tr-cone c1" aria-hidden />
                        <i className="tr-cone c2" aria-hidden />
                        <i className="tr-ladder" aria-hidden />
                        {run.lineup.flatMap((u, i) => {
                            const p = byUid.get(u);
                            if (!p) return [];
                            const [x, y] = ui[i] ?? [50, 50];
                            const pos = wide ? { left: `${100 - y}%`, top: `${x}%` } : { left: `${x}%`, top: `${y}%` };
                            return [mon(p, 'field', pos as CSSProperties)];
                        })}
                    </div>
                    <div className="tr-side">
                        {/* os reservas na beira da quadra */}
                        <div className="tr-benchrow">
                            {run.bench.flatMap((u) => byUid.get(u) ?? []).map((p) => mon(p, 'bench'))}
                        </div>
                        <div className="tr-objs">
                            {!anyEvo && (
                                <button
                                    type="button"
                                    className={`tr-obj tr-rack${mark === 'item' ? ' on' : ''}`}
                                    aria-pressed={mark === 'item'}
                                    onClick={() => toggle('item')}
                                >
                                    <HudIcon kind="dumbbell" />
                                    <span className="tr-sign">{t('longCup.treino.itemSign')}</span>
                                </button>
                            )}
                            <button
                                type="button"
                                className={`tr-obj tr-bed${resting ? ' on' : ''}`}
                                aria-pressed={resting}
                                aria-label={`${t('longCup.treino.rest')}: ${t('longCup.treino.restSign')}`}
                                onClick={() => toggle('rest')}
                            >
                                <i className="tr-mat" aria-hidden />
                                <span className="tr-sign">{t('longCup.treino.restSign')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Stage>
        </ClockCtx.Provider>
    );
}

/** Emblema e cor de cada evento (o desenho do que aconteceu, ao lado de quem conta). */
const EVENT_ART: Record<EventId, { icon: HudIconKind; color: string }> = {
    carrinho: { icon: 'medkit', color: '#d9452f' },
    patrocinador: { icon: 'briefcase', color: '#3a3a46' },
    capitao: { icon: 'armband', color: '#c9871c' },
    entrevista: { icon: 'mic', color: '#7a4bc4' },
    fosseis: { icon: 'search', color: '#8e7c68' },
    lendario: { icon: 'crown', color: '#d9b42a' },
    rocket: { icon: 'flag', color: '#b8322e' },
    aposta: { icon: 'dice', color: '#2f7fc4' },
    juiz: { icon: 'yellow', color: '#c9a23a' },
    ovo: { icon: 'egg', color: '#e0a860' },
    pedra: { icon: 'stone', color: '#8e7c68' },
    centro: { icon: 'heart', color: '#e06a8a' },
};

/**
 * Evento "?" da Copa longa: a cena (quem fala, grande, e o texto) no meio e as escolhas na barra do polegar. Escolha que
 * pede alguém do time abre o "Quem?": tocar marca e o Confirmar aplica (nada sai do time num toque só).
 */
export function EventScreen() {
    const live = useGame((s) => s.run);
    const chooseEvent = useGame((s) => s.chooseEvent);
    const run = useHeld(live?.status === 'event' && live.event ? live : null);
    const [choice, setChoice] = useState<string | null>(null);
    const [who, setWho] = useState<string | null>(null);
    const [captain, setCaptain] = useState<string | null>(null);
    const [evolving, setEvolving] = useState(false);
    const { t, d } = useT();
    if (!run?.event) return null;
    const ev = run.event;
    const txt = d.longCup.events[ev.id];
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const nameOf = (u: string) => (byUid.get(u) ? viewInstance(byUid.get(u)!).displayName : '');
    // a pedra ganha no Jogo: o nome dela no título e na fala
    const stoneName = ev.stone ? t(`longCup.stone.${ev.stone}`) : null;
    const names = stoneName ? [stoneName] : (ev.uids?.map(nameOf) ?? []);
    const art = ev.stone ? { icon: EVENT_ART.pedra.icon, color: STONE_COLOR[ev.stone] } : EVENT_ART[ev.id];
    const stone: Stone = ev.stone ?? 'lua';
    // usar a pedra: a tela de evolução da partida (o momento dele) e, quando ela fecha, a escolha vale
    const evolve = (choiceId: string, uid: string) => {
        const mon = byUid.get(uid);
        const into = mon ? stoneInto(mon.speciesId, stone) : null;
        if (!mon || into === null) return;
        const e: MatchEvolution = {
            team: 0,
            from: mon.speciesId,
            into,
            name: viewInstance(mon).displayName,
            newName: viewInstance(evolveInstance(mon, into)).displayName,
            shiny: !!mon.shiny,
        };
        const done = () => {
            EventBus.off('match:evolution-done', done);
            chooseEvent(choiceId, uid);
        };
        setEvolving(true);
        EventBus.on('match:evolution-done', done);
        EventBus.emit('match:evolution', e);
    };
    const choices = eventChoices(run, ev);
    const picked = choices.find((c) => c.id === choice && c.need !== 'none');
    const targets = picked ? choiceTargets(run, ev, picked.need) : [];
    const pick = (id: string) => {
        const c = choices.find((x) => x.id === id)!;
        if (c.need === 'none') chooseEvent(id);
        else {
            setChoice(id);
            setWho(null);
            setCaptain(null);
        }
    };
    // venda do capitão: depois do reserva, o novo capitão sai da escalação com ele na vaga
    const sale = picked?.need === 'captainSale';
    const lineupAfter = sale && who ? run.lineup.map((u) => (u === run.captainUid ? who : u)) : [];
    const ready = !!who && (!sale || !!captain);
    // carrinho: quem pode parar aparece com cara de dor
    const face = picked?.need === 'involved' ? ['pain', 'dizzy'] : null;
    // a pedra: embaixo do nome, a forma nova (no Eevee, a pedra escolhe qual)
    const intoOf = (u: string) => {
        const into = picked?.need === 'stone' && byUid.get(u) ? stoneInto(byUid.get(u)!.speciesId, stone) : null;
        return into === null ? null : viewInstance(evolveInstance(byUid.get(u)!, into)).displayName;
    };
    const strip = (uids: string[], onPick: (u: string) => void, active: string | null, faces?: string[] | null) => (
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
                        {intoOf(u) && <small className="muted">{`→ ${intoOf(u)}`}</small>}
                    </span>
                </button>
            ))}
        </div>
    );
    const [pickedLabel, pickedEffect] = picked ? (txt.choices[picked.id] ?? [picked.id, '']) : ['', ''];
    return (
        <Stage className="ev-stage" style={{ '--ev': art.color } as CSSProperties}>
            <div className="draft-head bc-screenhead ev-head">
                <span className="bc-tag">
                    <HudIcon kind={art.icon} />
                    {t('longCup.kind.evento')}
                </span>
                <h1>{stoneName ?? txt.title}</h1>
            </div>
            {/* a cena atrás do diálogo: quem fala em pé, o emblema do evento e o que está em jogo (cartas, rostos) */}
            <div className="ev-scene" aria-hidden={!ev.cards?.length}>
                <i className="ev-floor" />
                <span className="ev-emblem">
                    {ev.stone ? <StoneMark stone={ev.stone} className="cm-event-stone" /> : <HudIcon kind={art.icon} />}
                </span>
                <img className="ev-who" src={`assets/trainers/${txt.who}.png`} alt="" />
                {ev.id === 'carrinho' && !!ev.uids?.length && (
                    <span className="cm-event-faces">
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
                {!!ev.cards?.length && (
                    <div className="cm-event-cards">
                        {ev.cards.map((c) => (
                            <FutCard key={c.uid} inst={c} size="sm" />
                        ))}
                    </div>
                )}
            </div>
            {/* a caixa de diálogo do mapa, com as escolhas como opções (o custo em ₽ à direita) */}
            <div className="ev-dialog">
                <RoomDialog text={fmtNames(txt.text, names)} onClose={() => {}}>
                    {choices.map((c) => {
                        const [label, effect] = txt.choices[c.id] ?? [c.id, ''];
                        return (
                            <button
                                key={c.id}
                                type="button"
                                className="ev-opt"
                                disabled={!c.ok || evolving}
                                onClick={() => pick(c.id)}
                            >
                                <HudIcon kind="next" className="ev-cursor" />
                                <span>
                                    <b>{fmtNames(label, names)}</b>
                                    {effect && <small>{fmtNames(effect, names)}</small>}
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
                </RoomDialog>
            </div>
            {/* escolha que pede alguém do time: o "Quem?" numa sheet (fechar = voltar); Confirmar aplica */}
            <Sheet
                open={!!picked && !evolving}
                onClose={() => setChoice(null)}
                title={fmtNames(pickedLabel, names)}
                className="ev-who-sheet"
            >
                {pickedEffect && <p className="muted ev-who-effect">{fmtNames(pickedEffect, names)}</p>}
                <h3>{t(sale ? 'longCup.pickSub' : 'longCup.pickWho')}</h3>
                {strip(targets, setWho, who, face)}
                {/* o novo capitão entra animado (e de novo a cada troca de reserva: a escalação muda) */}
                {sale && who && (
                    <div key={who} className="cm-bar-in">
                        <h3>{t('longCup.pickCaptain')}</h3>
                        {strip(lineupAfter, setCaptain, captain)}
                    </div>
                )}
                <div className="ev-who-bar">
                    <button type="button" className="btn ghost" onClick={() => setChoice(null)}>
                        {t('common.ui.back')}
                    </button>
                    <button
                        type="button"
                        className="btn primary"
                        disabled={!ready || evolving}
                        onClick={() => {
                            if (!who || !picked) return;
                            if (picked.need === 'stone') evolve(picked.id, who);
                            else chooseEvent(picked.id, who, captain ?? undefined);
                        }}
                    >
                        {t('longCup.confirm')}
                    </button>
                </div>
            </Sheet>
            <EvolutionOverlay />
        </Stage>
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
    const run = useHeld(live?.status === 'group' && live.group ? live : null);
    const color = useClubColor();
    const profile = useGame((s) => s.profile);
    const { t, d, lang } = useT();
    if (!run?.group) return null;
    const rows = groupTable(run, color);
    const others = groupOthers(run.seed);
    const played = run.results.filter((r) => isGroupStage(r.stage)).length;
    const toFinal = run.results.length >= FINAL_MATCH;
    const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
    const untold = !run.told?.includes('planalto');
    const myLook = lookOfProfile(profile);
    const lookOf = (i: number) =>
        i === 0 ? myLook : lookOfCupClub(run.group!.rivals[i - 1].name, run.group!.rivals[i - 1].color);
    // na placa só a cidade ("Cinnabar"); o nome inteiro fica na tabela
    const short = (i: number) => (i === 0 ? run.teamName : clubName(run.group!.rivals[i - 1].name, lang).split(' ')[0]);
    const score = (n: number | undefined) => <b className="bc-sc gp-sc">{n ?? '–'}</b>;
    return (
        <Stage
            className="gp-stage"
            action={
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
            }
        >
            <div className="draft-head bc-screenhead gp-head">
                <span className="bc-tag">{t('longCup.groupTable')}</span>
                <h1>{t('longCup.region.planalto')}</h1>
            </div>
            {/* a tabela em placar de TV: posição na placa, a cor do time, os pontos no quadro claro */}
            <section className="gp-table gp-tv" aria-label={t('longCup.groupTable')}>
                <div className="gp-row gp-head">
                    <span />
                    <span />
                    <span>{t('longCup.colPlayed')}</span>
                    <span>{t('longCup.colGd')}</span>
                    <span>{t('longCup.colPts')}</span>
                </div>
                {rows.map((r, i) => (
                    <div
                        key={r.name}
                        className={`gp-row${r.you ? ' you' : ''}${i < 2 ? ' up' : ''}`}
                        style={{ '--tc': hex(r.color), '--k': i } as CSSProperties}
                    >
                        <b className="gp-pos">{i + 1}</b>
                        <span className="gp-team">
                            <i />
                            {r.you ? r.name : clubName(r.name, lang)}
                        </span>
                        <span>{r.played}</span>
                        <span>{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</span>
                        <b className="bc-sc gp-pts">{r.pts}</b>
                    </div>
                ))}
                {/* a conta dos pontos no "?" (decisão 13: regra na tela até ~12 palavras) */}
                <small className="gp-note">
                    {t('longCup.groupNote')}
                    <InfoSheet title={t('longCup.groupPointsTitle')}>
                        <p>{t('longCup.groupPoints')}</p>
                    </InfoSheet>
                </small>
            </section>

            {/* as 3 rodadas como placas de jogo: os dois escudos e o placar; a próxima pulsa */}
            <div className="gp-days">
                {run.group.rivals.map((rival, md) => {
                    const mine = run.results.find((x) => x.stage === GROUP_START + md);
                    const o = others[md];
                    const trainer = rivalTrainer(rival.name);
                    const now = md === played && !toFinal;
                    return (
                        <div
                            key={rival.name}
                            className={`gp-day${now ? ' now' : ''}${mine ? ' done' : ''}`}
                            style={{ '--k': md } as CSSProperties}
                        >
                            <span className="gp-day-head">
                                <span className="gp-day-tag">{t('longCup.matchday', { n: md + 1 })}</span>
                                <span className="gp-types">
                                    <TypeIcons types={rivalTypes(rival.name)} size={14} />
                                </span>
                            </span>
                            <span className="gp-game mine" title={`${run.teamName} x ${clubName(rival.name, lang)}`}>
                                <Crest look={myLook} className="crest gp-crest" />
                                <span className="gp-name">{run.teamName}</span>
                                {score(mine?.score[0])}
                                {score(mine?.score[1])}
                                <span className="gp-name away">{short(md + 1)}</span>
                                <span className="gp-crest-wrap">
                                    <Crest look={lookOf(md + 1)} className="crest gp-crest" />
                                    {trainer && (
                                        <img className="gp-trainer" src={`assets/trainers/${trainer}.png`} alt="" />
                                    )}
                                </span>
                                {mine?.shootout && <small className="gp-pen">{t('longCup.pens')}</small>}
                            </span>
                            <span className="gp-game gp-other muted">
                                {short(o.a)} <b>{mine ? `${o.score[0]} x ${o.score[1]}` : 'x'}</b>
                                {mine && o.shootout && <small className="gp-pen">{t('longCup.pens')}</small>}{' '}
                                {short(o.b)}
                            </span>
                        </div>
                    );
                })}
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
        </Stage>
    );
}
