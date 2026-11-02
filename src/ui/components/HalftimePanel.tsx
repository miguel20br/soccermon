import type { CSSProperties, ReactNode } from 'react';
import { species } from '../../engine/data';
import { possessionByPeriod } from '../../engine/match-stats';
import type { MatchResult } from '../../engine/runners/batch-runner';
import { SNAP_STRIDE } from '../../engine/state';
import { useT } from '../../i18n/react';
import { Beat, useCascade } from '../kit/Cascade';
import { snapAt } from '../match-view';
import { HudIcon } from './MatchHud';
import { cardSprite } from './PokeCard';

/** Cascata do placar do intervalo (cara-de-jogo.md, padrão 8): uma linha a cada 250 ms. */
const HT_BEAT_MS = 250;

/** Uma troca do intervalo: quem entra no lugar de quem (com o desfazer, se ainda dá). */
export interface HtSub {
    key: string;
    inName: string;
    outName: string;
    sprite: string;
    /** Quem saiu (a placa de substituição mostra os dois). */
    outSprite?: string;
    onUndo?: () => void;
}

/** Trocas do time `team` no intervalo (do apito até a saída de bola do 2º tempo), pela partida simulada. */
export function rivalHtSubs(match: MatchResult, team: 0 | 1): HtSub[] {
    const ht = match.events.find((e) => e.type === 'halftime')?.tick;
    if (ht === undefined) return [];
    const ko = match.events.find((e) => e.type === 'kickoff' && e.tick > ht)?.tick ?? ht;
    return match.events.flatMap((e) =>
        e.type === 'sub' && e.team === team && e.tick >= ht && e.tick <= ko
            ? [
                  {
                      key: e.inUid,
                      inName: e.in,
                      outName: e.out,
                      sprite: cardSprite({ speciesId: e.inSpeciesId, shiny: e.inShiny }),
                      outSprite: cardSprite({ speciesId: e.outSpeciesId, shiny: match.roster[e.outIdx]?.shiny }),
                  },
              ]
            : [],
    );
}

/**
 * Dica do intervalo. O mais cansado já aparece no quadro ("Mais cansado") e na sugestão de troca, então não entra
 * aqui (antes a dica repetia o nome dele pela terceira vez, mesmo sem troca sobrando).
 */
export function htTip(myShots: number, rivalShots: number, poss: number, ahead: boolean) {
    if (rivalShots >= myShots + 3) return 'tipShots';
    if (poss >= 60 && myShots <= rivalShots) return 'tipPossession';
    return ahead ? 'tipAhead' : 'tipEven';
}

/** A parte de `a` em `a + b` (0..1), pra barra de dois lados do placar; 0 x 0 fica no meio. */
export const share = (a: number, b: number) => (a + b > 0 ? a / (a + b) : 0.5);

/** Placa de substituição de TV: seta verde com quem entra, seta vermelha com quem sai. `text` é a frase pro leitor. */
function SubPlate({ x, text, undo }: { x: HtSub; text: ReactNode; undo?: string }) {
    return (
        <li className="ht-plate">
            <span className="sr-only">{text}</span>
            <span className="ht-in" aria-hidden>
                <HudIcon kind="up" />
                <img className="pixel" src={x.sprite} alt="" />
                <b>{x.inName}</b>
            </span>
            <span className="ht-out" aria-hidden>
                <HudIcon kind="down" />
                {x.outSprite && <img className="pixel" src={x.outSprite} alt="" />}
                <span>{x.outName}</span>
            </span>
            {x.onUndo && undo && (
                <button type="button" className="ht-undo" onClick={x.onUndo}>
                    {undo}
                </button>
            )}
        </li>
    );
}

/**
 * Intervalo de verdade (estilo Retro Bowl/FM), o vestiário: a partida para, mostra como foi o 1º tempo e uma dica, e o
 * técnico decide (tática e substituição continuam nos controles de sempre). Várias trocas no mesmo intervalo, cada uma
 * com desfazer até o 2º tempo começar, e as do rival à vista. Nada muda sozinho: "Continuar" segue o jogo.
 */
export function HalftimePanel({
    match,
    names,
    nameOf,
    onContinue,
    onSub,
    canSub,
    side = 0,
    footer,
    mySubs = [],
    rivalSubs = [],
    suggest,
    ready,
    colors,
}: {
    /** Cores dos dois times (a barra de dois lados); sem elas, amarelo contra cinza. */
    colors?: [string, string];
    /** Suas trocas pro 2º tempo (ainda não aconteceram: dá pra desfazer). */
    mySubs?: HtSub[];
    /** Trocas do rival no intervalo. */
    rivalSubs?: HtSub[];
    /** Sugestão de troca, logo abaixo da dica: só abre o Substituir com quem está cansado marcado (nada troca sozinho). */
    suggest?: { text: string; onPick: () => void } | null;
    /** No duelo: o "pronto" no lugar do "Começar o 2º tempo" (com o desfazer). */
    ready?: ReactNode;
    match: MatchResult;
    names: [string, string];
    /** Lado do jogador (no duelo, o convidado é o 1). */
    side?: 0 | 1;
    /** No duelo: cronômetro e quem já está pronto. */
    footer?: ReactNode;
    /** Nome de quem está na vaga `idx` (do seu time) no intervalo. */
    nameOf: (idx: number) => string;
    onContinue: () => void;
    onSub: () => void;
    canSub: boolean;
}) {
    const { t } = useT();
    // o placar entra linha a linha: chutes, posse, o mais cansado e a placa do rival (o toque pula pro fim)
    const casc = useCascade(Array(4).fill(HT_BEAT_MS));
    const ht = match.events.find((e) => e.type === 'halftime');
    if (ht?.type !== 'halftime') return null;
    const team = (idx: number) => match.roster[idx]?.team ?? 0;
    const shots = [0, 0];
    for (const e of match.events) if (e.type === 'shot' && e.tick <= ht.tick) shots[team(e.by)]++;
    const first = possessionByPeriod(match).slice(0, 4);
    const homePoss = first.length ? Math.round((first.reduce((s, p) => s + p.home, 0) / first.length) * 100) : 50;
    const poss = side === 0 ? homePoss : 100 - homePoss;
    const rival = side === 0 ? 1 : 0;
    // quem do seu time está mais cansado agora
    // fôlego de quem vai começar o 2º tempo (com as trocas feitas no intervalo)
    const ko = match.events.find((e) => e.type === 'kickoff' && e.tick > ht.tick)?.tick ?? ht.tick;
    const snap = snapAt(match.snapshots, ko);
    const mine = match.roster.filter((p) => p.team === side).map((p) => p.idx);
    // evoluções do rival no 1º tempo: lembrete pra quem piscou
    const rivalEvos = match.events.flatMap((e) =>
        e.type === 'evolve' && e.team !== side && e.tick <= ht.tick
            ? [`${species(e.from).name} → ${species(e.into).name}`]
            : [],
    );
    const tired = mine
        .map((idx) => ({ idx, energy: snap.p[idx * SNAP_STRIDE + 6] ?? 1 }))
        .sort((a, b) => a.energy - b.energy)[0];

    const tip = t(`match.ht.${htTip(shots[side], shots[rival], poss, ht.score[side] > ht.score[rival])}`, {
        a: shots[rival],
        b: shots[side],
    });
    const sides = colors ? ({ '--ht-a': colors[side], '--ht-b': colors[rival] } as CSSProperties) : undefined;
    const bar = (v: number) => ({ '--v': v }) as CSSProperties;

    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: tocar pula a cascata (tudo já está no DOM pro leitor de tela)
        <div className="ht-panel" role="dialog" aria-label={t('match.halftime')} onClick={casc.skip}>
            <div className="ht-info">
                <span className="ht-title">{t('match.halftime')}</span>
                <b className="ht-score">
                    {names[0]} {ht.score[0]} x {ht.score[1]} {names[1]}
                </b>
                {/* placar de TV (.bc-sc): uma linha por número, com a barra, entrando uma por vez */}
                <dl className="ht-stats ht-board" style={sides}>
                    <Beat on={casc.step > 0} className="ht-row">
                        <dt>{t('match.ht.shots')}</dt>
                        <dd>
                            <b className="bc-sc">{shots[side]}</b>
                            <i className="ht-bar two" style={bar(share(shots[side], shots[rival]))} />
                            <b className="bc-sc">{shots[rival]}</b>
                        </dd>
                    </Beat>
                    <Beat on={casc.step > 1} className="ht-row">
                        <dt>{t('match.ht.possession')}</dt>
                        <dd>
                            <b className="bc-sc">{poss}%</b>
                            <i className="ht-bar two" style={bar(poss / 100)} />
                            <b className="bc-sc">{100 - poss}%</b>
                        </dd>
                    </Beat>
                    {tired && (
                        <Beat on={casc.step > 2} className="ht-row">
                            <dt>
                                {t('match.ht.tired')} <span className="ht-who">{nameOf(tired.idx)}</span>
                            </dt>
                            <dd>
                                <i
                                    className={`ht-bar one${tired.energy < 0.5 ? ' low' : tired.energy < 0.75 ? ' mid' : ''}`}
                                    style={bar(tired.energy)}
                                />
                                <b className="bc-sc">{Math.round(tired.energy * 100)}%</b>
                            </dd>
                        </Beat>
                    )}
                    {rivalEvos.length > 0 && (
                        <div className="ht-rival-evo">
                            <dt>{t('match.ht.rivalEvo')}</dt>
                            <dd>{rivalEvos.join(', ')}</dd>
                        </div>
                    )}
                </dl>
                <p className="ht-tip">{tip}</p>
            </div>
            <div className="ht-ctl">
                {suggest && (
                    <button type="button" className="ht-suggest" onClick={suggest.onPick}>
                        {suggest.text}
                    </button>
                )}
                {mySubs.length > 0 && (
                    <section className="ht-subs" data-testid="ht-my-subs">
                        <h3>{t('match.ht.mySubs')}</h3>
                        <ul>
                            {mySubs.map((x) => (
                                <SubPlate
                                    key={x.key}
                                    x={x}
                                    text={t('match.ht.subRow', { in: x.inName, out: x.outName })}
                                    undo={t('match.ht.undo')}
                                />
                            ))}
                        </ul>
                    </section>
                )}
                {rivalSubs.length > 0 && (
                    <Beat on={casc.step > 3} className="ht-subs-beat">
                        <section className="ht-subs rival" data-testid="ht-rival-subs">
                            <h3>{t('match.ht.rivalSubs')}</h3>
                            <ul>
                                {rivalSubs.map((x) => (
                                    <SubPlate
                                        key={x.key}
                                        x={x}
                                        text={t('match.ht.rivalRow', { in: x.inName, out: x.outName })}
                                    />
                                ))}
                            </ul>
                        </section>
                    </Beat>
                )}
                <div className="ht-actions">
                    <button type="button" className="btn outline" disabled={!canSub} onClick={onSub}>
                        {mySubs.length ? t('match.ht.subMore') : t('match.substitute')}
                    </button>
                    {ready ?? (
                        <button type="button" className="btn primary big" onClick={onContinue}>
                            {t('match.ht.continue')}
                        </button>
                    )}
                </div>
                {footer}
            </div>
            <small className="muted">{t('match.ht.tacticHint')}</small>
        </div>
    );
}
