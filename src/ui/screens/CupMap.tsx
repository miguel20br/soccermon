import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    FINAL_MATCH,
    GROUP_START,
    isMatchKind,
    longOpponent,
    type MapNode,
    matchIndexOfRow,
    type NodeKind,
    nextNodes,
    rivalTrainer,
} from '../../engine/cup-map';
import { EVO_THRESHOLD, evolutionTarget } from '../../engine/evolution';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { cupLength, groupOthers, groupTable, isGroupStage, YELLOW_CARDS } from '../../store/long-cup';
import { choiceTargets, type EventId, eventChoices } from '../../store/long-events';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { MonIcon } from '../components/MonIcon';
import { cardSprite } from '../components/PokeCard';
import { Money, SponsorSlots } from '../components/SponsorCard';
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
/** Altura de cada linha do mapa (px). */
const ROW_H = 84;

/**
 * Regiões de Kanto no mapa, de baixo pra cima (a história da Copa longa: o clube atravessa Kanto até o Planalto
 * Índigo). `rows` = primeira e última linha; `wild` = Pokémon selvagens que enfeitam a região; `who` = quem fala.
 */
const REGIONS = [
    { id: 'rota1', rows: [0, 1], decor: 'bush', who: 'oak' },
    { id: 'floresta', rows: [2, 3], decor: 'tree', who: 'blue' },
    { id: 'mtmoon', rows: [4, 5], decor: 'rock', who: 'brock' },
    { id: 'cerulean', rows: [6, 7], decor: 'wave', who: 'misty' },
    { id: 'vitoria', rows: [8, 8], decor: 'pillar', who: 'blue' },
] as const;
type DecorKind = (typeof REGIONS)[number]['decor'];
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
type RegionId = (typeof REGIONS)[number]['id'];
const regionOf = (row: number) => REGIONS.find((r) => row >= r.rows[0] && row <= r.rows[1]) ?? REGIONS[0];

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

    if (!run || !map) return null;
    const H = map.rows * ROW_H;
    const width = (row: number) => map.nodes.filter((x) => x.row === row).length;
    const pos = (n: MapNode) => ({ x: ((n.col + 0.5) / width(n.row)) * 100, y: H - (n.row + 0.5) * ROW_H });
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
          : { x: 50, y: H + 26 };
    const go2 = (id: string) => {
        setPick(null);
        if (reduceMotionOn()) {
            enterNode(id);
            return;
        }
        setWalking(id);
        window.setTimeout(() => enterNode(id), WALK_MS);
    };

    return (
        <div className={`menu-screen cm${chosen ? ' has-sheet' : ''}`}>
            <MenuHead
                title={t('longCup.title')}
                icon="liga"
                tag={t('longCup.step', { n: Math.min(played + 1, cupLength(run)), total: cupLength(run) })}
                onBack={() => go('home')}
            />
            <div className="cm-status bc-surface">
                <Money n={run.money ?? 0} className="cm-money" />
                <span
                    className={`cm-cards${(run.cards ?? 0) > 0 ? ' used' : ''}`}
                    title={t('longCup.cardsHint')}
                    aria-label={`${t('longCup.cards')}: ${run.cards ?? 0}/${YELLOW_CARDS}`}
                    role="img"
                >
                    <HudIcon kind="yellow" />
                    {run.cards ?? 0}/{YELLOW_CARDS}
                </span>
                {!!run.sponsors?.length && <SponsorSlots sponsors={run.sponsors} />}
            </div>

            <div className="cm-scroll" ref={scroller}>
                <div className="cm-map" style={{ height: H + 56 }}>
                    {REGIONS.map((r) => {
                        const top = H - (r.rows[1] + 1) * ROW_H;
                        const h = (r.rows[1] - r.rows[0] + 1) * ROW_H + (r.rows[0] === 0 ? 56 : 0);
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
                    <svg className="cm-lines" viewBox={`0 0 100 ${H + 56}`} preserveAspectRatio="none" aria-hidden>
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
                        const state = n.id === run.at ? ' at' : path.includes(n.id) ? ' done' : isOpen ? ' open' : '';
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
                            style={{ left: `${here.x}%`, top: here.y } as CSSProperties}
                        />
                    )}
                </div>
            </div>

            {chosen &&
                !walking &&
                createPortal(
                    <NodeSheet
                        key={chosen.id}
                        node={chosen}
                        seed={run.seed}
                        faced={run.opponents.filter(Boolean).map((o) => o.name)}
                        shift={run.rivalShift ?? 0}
                        lang={lang}
                        onGo={() => go2(chosen.id)}
                    />,
                    document.body,
                )}
            {untold &&
                !chosen &&
                createPortal(
                    <div className={`cm-story who-${untold.who}`}>
                        <img className="cm-story-who" src={`assets/trainers/${untold.who}.png`} alt="" />
                        <RoomDialog
                            text={`${d.longCup.story[untold.id].who}: ${d.longCup.story[untold.id].text}`}
                            action={{ label: t('longCup.storyNext'), run: () => tell(untold.id) }}
                            onClose={() => tell(untold.id)}
                        />
                    </div>,
                    document.body,
                )}
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
                    <span className="muted">
                        {t('longCup.rival')}: <b>{clubName(rival.name, lang)}</b>
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

/** Casa Treino: encher a barra de evolução de alguém (metade) ou descansar (+1 troca). */
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
            <div className="panel cm-train">
                <h2>{t('longCup.treino.evo')}</h2>
                <p className="muted">{t('longCup.treino.evoLine')}</p>
                {evolvers.length ? (
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
                ) : (
                    <p className="muted">{t('longCup.treino.none')}</p>
                )}
            </div>
            <div className="panel cm-train">
                <h2>{t('longCup.treino.rest')}</h2>
                <p className="muted">{t('longCup.treino.restLine')}</p>
                <button
                    type="button"
                    className="btn"
                    onClick={() => {
                        train('rest');
                    }}
                >
                    <HudIcon kind="reroll" />
                    {t('longCup.treino.rest')}
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
    const strip = (uids: string[], onPick: (u: string) => void, active?: string | null) => (
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
                    <img className="pixel" src={cardSprite(byUid.get(u)!)} alt="" />
                    <span>
                        <b>{nameOf(u)}</b>
                    </span>
                </button>
            ))}
        </div>
    );
    return (
        <div className="menu-screen cm">
            <MenuHead title={txt.title} icon="liga" tag={t('longCup.title')} onBack={() => go('home')} />
            <div className="cm-event bc-surface bc-stripe" style={{ '--ev': EVENT_ART[ev.id].color } as CSSProperties}>
                <span className="cm-event-emblem">
                    <HudIcon kind={EVENT_ART[ev.id].icon} />
                </span>
                <img className="cm-story-who" src={`assets/trainers/${txt.who}.png`} alt="" />
                <p>{fmtNames(txt.text, ev.uids?.map(nameOf) ?? [])}</p>
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
                                <small>{effect}</small>
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
                        : strip(targets, (u) => chooseEvent(picked.id, u, card))}
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
                            <span className="gp-day-tag">{t('longCup.matchday', { n: md + 1 })}</span>
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
