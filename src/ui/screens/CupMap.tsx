import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    isMatchKind,
    longOpponent,
    type MapNode,
    matchIndexOfRow,
    type NodeKind,
    nextNodes,
} from '../../engine/cup-map';
import { EVO_THRESHOLD, evolutionTarget } from '../../engine/evolution';
import { viewInstance } from '../../engine/instance';
import { playSfx } from '../../game/audio';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { cupLength, YELLOW_CARDS } from '../../store/long-cup';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { cardSprite } from '../components/PokeCard';
import { Money, SponsorSlots } from '../components/SponsorCard';
import { useHeld } from '../use-held';
import '../long-cup.css';

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
const ROW_H = 78;

/**
 * Mapa da Copa longa (docs/planos/copa-longa.md): de baixo pra cima até a Final, estilo Slay the Spire. Tocar numa
 * casa aberta mostra o que ela é (e o rival, nas partidas); "Ir" entra.
 */
export function CupMap() {
    const live = useGame((s) => s.run);
    const enterNode = useGame((s) => s.enterNode);
    const go = useGame((s) => s.go);
    const run = useHeld(live?.status === 'map' && live.map ? live : null);
    const [pick, setPick] = useState<string | null>(null);
    const { t, lang } = useT();
    const scroller = useRef<HTMLDivElement>(null);
    const map = run?.map;
    const open = useMemo(() => new Set(map ? nextNodes(map, run?.at ?? null).map((n) => n.id) : []), [map, run?.at]);

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
                <div className="cm-map" style={{ height: H }}>
                    <svg className="cm-lines" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden>
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
                        const isOpen = open.has(n.id);
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
                                    playSfx('select');
                                    setPick(pick === n.id ? null : n.id);
                                }}
                            >
                                <HudIcon kind={ICON[n.kind]} />
                                <span className="cm-label">{t(`longCup.kind.${n.kind}`)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* no body: a tela de menu tem transform (animação de entrada), que prenderia o fixed dentro dela */}
            {chosen &&
                createPortal(
                    <NodeSheet
                        key={chosen.id}
                        node={chosen}
                        seed={run.seed}
                        faced={run.opponents.filter(Boolean).map((o) => o.name)}
                        lang={lang}
                        onGo={() => {
                            playSfx('select');
                            setPick(null);
                            enterNode(chosen.id);
                        }}
                    />,
                    document.body,
                )}
        </div>
    );
}

/** O que a casa escolhida é (e o rival, se for partida), com o "Ir". */
function NodeSheet({
    node,
    seed,
    faced,
    lang,
    onGo,
}: {
    node: MapNode;
    seed: string;
    faced: string[];
    lang: 'pt' | 'en';
    onGo: () => void;
}) {
    const { t } = useT();
    const rival = useMemo(
        () => (isMatchKind(node.kind) ? longOpponent(seed, matchIndexOfRow(node.row), node.kind, faced) : null),
        [node, seed, faced],
    );
    return (
        <div
            className={`cm-sheet bc-surface bc-stripe k-${node.kind}`}
            data-exit
            role="dialog"
            aria-label={t(`longCup.kind.${node.kind}`)}
        >
            <div className="cm-sheet-head">
                <span className="cm-sheet-icon">
                    <HudIcon kind={ICON[node.kind]} />
                </span>
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
                            <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
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
                                        playSfx('select');
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
                        playSfx('select');
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
