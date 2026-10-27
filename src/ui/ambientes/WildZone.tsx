import { type RefObject, useEffect, useReducer, useRef, useState } from 'react';
import { playCry } from '../../game/audio';
import { useGame } from '../../store/game-store';
import type { SceneClock } from './clock';
import { type FieldAnim, FieldSprite } from './FieldSprite';
import { type Actor, type Area, type Box, type Emote, type Pt, poke, spawn, step, type Wild } from './wild';

/** Uma zona da cena: onde dá pra pisar, velocidade, tamanho do sprite e a camada (z-index pela altura do pé). */
export interface ZoneDef extends Omit<Area, 'aspect'> {
    scale: number;
    z?: (y: number) => number;
}
export type Threats = RefObject<Record<string, Pt[] | undefined>>;
/**
 * O que os Pokémon ambiente respeitam na tela (seletores dentro do painel do lugar): `ui`, o que fica na frente de
 * todo mundo (botões, textos, quadro); `props`, o que quem anda no chão contorna (o corpo não encosta); `feet`, os
 * móveis (o pé não entra na base deles, mas passar na frente pode). Os botões do topo (Ajuda, Configurações) valem
 * sempre.
 */
export interface Blockers {
    ui?: string;
    props?: string;
    feet?: string;
}

/** Camada pela altura do pé: quem está mais embaixo na tela passa na frente. */
export const zOf = (def: ZoneDef | undefined, y: number) => (def?.z ? def.z(y) : 10 + Math.round(y * 30));
/** Folga em volta do que bloqueia (px) e o espaço do balão em cima da cabeça (px). */
const GAP = 4;
const BUBBLE = 32;
/** De quanto em quanto tempo a tela é medida de novo (ms de cena). */
const MEASURE_MS = 500;

/** A caixa parada no lugar (sem arrasto nem deslize de aba): só aí as medidas batem com a tela em repouso. */
function atRest(el: Element): boolean {
    for (let e: Element | null = el; e && !e.classList.contains('amb-stage'); e = e.parentElement) {
        if (!e.matches('.amb-panel, .amb-layer, .amb-par')) continue;
        const t = getComputedStyle(e).transform;
        if (t !== 'none' && Math.abs(new DOMMatrixReadOnly(t).m41) > 0.5) return false;
    }
    return !el.closest('.amb-drag, .amb-entering');
}

/**
 * Mede a tela de uma zona: a parte que aparece (cortada por quem tem `overflow`), os retângulos que bloqueiam e o
 * corpo de cada Pokémon dela, tudo em unidades da caixa.
 */
function measure(box: HTMLElement, area: Area, sel: Blockers, actors: Actor[], els: Map<string, HTMLElement>): boolean {
    const r = box.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || !atRest(box)) return false;
    const panel = box.closest('.amb-panel');
    if (!panel) return false;
    const nx = (px: number) => (px - r.left) / r.width;
    const ny = (px: number) => (px - r.top) / r.height;
    const norm = (q: DOMRect, g = GAP): Box => [nx(q.left - g), ny(q.top - g), nx(q.right + g), ny(q.bottom + g)];
    // o corpo pode sair da caixa (a cabeça passa da linha do chão pra frente da parede); só não pode sair do que corta
    let [l, t, rr, b] = [-1e5, -1e5, 1e5, 1e5];
    for (let e = box.parentElement; e && e !== panel.parentElement; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
        const c = e.getBoundingClientRect();
        [l, t, rr, b] = [Math.max(l, c.left), Math.max(t, c.top), Math.min(rr, c.right), Math.min(b, c.bottom)];
    }
    area.aspect = r.width / r.height;
    area.head = BUBBLE / r.height;
    area.ground = [r.left, r.top, r.width, r.height].map(Math.round).join();
    area.bounds = [nx(l), ny(t), nx(rr), ny(b)];
    const rects = (q: string | undefined, root: ParentNode) =>
        q
            ? [...root.querySelectorAll(q)].flatMap((e) => {
                  const k = e.getBoundingClientRect();
                  return k.width > 0 && k.height > 0 ? [k] : [];
              })
            : [];
    area.blocks = [...rects('.amb-top > *', document), ...rects(sel.ui ?? '.amb-ui > *', panel)].map((k) => norm(k));
    area.props = [
        ...rects(sel.props, panel).map((k) => norm(k)),
        // a base do móvel: o terço de baixo e um pouco pra frente (o pé fica na frente dele ou longe)
        ...rects(sel.feet, panel).map(
            (k): Box => [nx(k.left), ny(k.bottom - k.height / 3), nx(k.right), ny(k.bottom + GAP)],
        ),
    ];
    for (const a of actors) {
        const el = els.get(a.key);
        const spr = el?.querySelector('.wild-mon');
        // no pulo o sprite sobe: medir aí "esticava" o corpo pra cima, ele deixava de caber e pulava de lugar no toque
        if (!el || !spr || a.act === 'hop') continue;
        const f = el.getBoundingClientRect();
        const k = spr.getBoundingClientRect();
        if (k.width < 1) continue;
        // a folha tem borda transparente dos lados; em cima, o lugar do balão
        // (o balão tem 18 px de largura em cima da cabeça: o corpo nunca é mais estreito que ele; a altura dele é
        // `Area.head`)
        const side = k.width * 0.15;
        const body: Box = [
            (Math.min(k.left + side, f.left - 10) - f.left) / r.width,
            (k.top + k.height * 0.15 - f.top) / r.height,
            (Math.max(k.right - side, f.left + 10) - f.left) / r.width,
            (Math.max(k.bottom, f.top + 3) - f.top) / r.height,
        ];
        // o maior quadro visto (o sprite muda um pouco de tamanho entre as animações)
        a.body = a.body
            ? [
                  Math.min(a.body[0], body[0]),
                  Math.min(a.body[1], body[1]),
                  Math.max(a.body[2], body[2]),
                  Math.max(a.body[3], body[3]),
              ]
            : body;
    }
    return true;
}

/**
 * Os Pokémon ambiente de uma cena, no relógio dela. A posição anda por escrita direta no estilo a cada quadro (nada de
 * render por quadro); a tela só redesenha quando alguém troca de ação, de direção ou de emote. Quem sai da lista
 * (limite de sprites) some; quem entra nasce num lugar válido.
 */
export function useWild(
    clock: SceneClock,
    list: Wild[],
    zones: Record<string, ZoneDef>,
    threats?: Threats,
    blockers: Blockers = {},
) {
    const actors = useRef(new Map<string, Actor>());
    const areas = useRef<Record<string, Area>>({});
    const els = useRef(new Map<string, HTMLElement>());
    const boxes = useRef(new Map<string, HTMLElement>());
    const sel = useRef(blockers);
    sel.current = blockers;
    const measured = useRef(-Infinity);
    const refs = useRef(new Map<string, (el: HTMLElement | null) => void>());
    const [ro] = useState(() =>
        typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver((es) => {
                  for (const e of es) {
                      const zone = (e.target as HTMLElement).dataset.zone ?? '';
                      const a = areas.current[zone];
                      const { width, height } = e.contentRect;
                      if (a && width > 0 && height > 0) a.aspect = width / height;
                      measured.current = -Infinity;
                  }
              }),
    );
    const [, redraw] = useReducer((x: number) => x + 1, 0);
    const zonesRef = useRef(zones);
    zonesRef.current = zones;

    for (const [z, def] of Object.entries(zones)) {
        const old = areas.current[z];
        areas.current[z] = {
            ok: def.ok,
            speed: def.speed,
            fly: def.fly,
            still: def.still,
            aspect: old?.aspect ?? 1.6,
            bounds: old?.bounds,
            blocks: old?.blocks,
            props: old?.props,
            ground: old?.ground,
            head: old?.head,
        };
    }
    const keys = new Set(list.map((w) => w.key));
    for (const k of [...actors.current.keys()]) if (!keys.has(k)) actors.current.delete(k);
    for (const w of list) {
        const a = actors.current.get(w.key);
        if (a?.id === w.id) continue;
        const area = areas.current[w.zone];
        if (area) actors.current.set(w.key, spawn(w, area, Math.random, clock.t, [...actors.current.values()]));
    }

    useEffect(
        () =>
            clock.sub((t, dt) => {
                if (!dt) return;
                const all = [...actors.current.values()];
                if (t - measured.current >= MEASURE_MS) {
                    // aba ainda deslizando: tenta de novo no próximo quadro
                    let ok = true;
                    for (const [z, box] of boxes.current) {
                        const area = areas.current[z];
                        const mine = all.filter((a) => a.zone === z);
                        if (area && !measure(box, area, sel.current, mine, els.current)) ok = false;
                    }
                    if (ok) measured.current = t;
                }
                if (step(all, areas.current, dt, t, threats?.current ?? {})) redraw();
                for (const a of all) {
                    const el = els.current.get(a.key);
                    if (!el) continue;
                    el.style.left = `${a.x * 100}%`;
                    el.style.top = `${a.y * 100}%`;
                    el.style.zIndex = String(zOf(zonesRef.current[a.zone], a.y));
                    el.classList.toggle('off', !a.shown);
                }
            }),
        [clock, threats],
    );
    useEffect(() => () => ro?.disconnect(), [ro]);

    const ref = (key: string, box: boolean) => {
        let f = refs.current.get(key);
        if (!f) {
            f = (el) => {
                if (box) {
                    const z = key.slice(4);
                    if (el) {
                        boxes.current.set(z, el);
                        ro?.observe(el);
                        measured.current = -Infinity;
                    } else boxes.current.delete(z);
                    return;
                }
                if (el) els.current.set(key, el);
                else els.current.delete(key);
            };
            refs.current.set(key, f);
        }
        return f;
    };
    /** Toque num Pokémon ambiente: ele pula e solta o grito, baixinho. */
    const tap = (key: string) => {
        const a = actors.current.get(key);
        if (!a) return;
        poke(a, clock.t);
        redraw();
        playCry(a.id, useGame.getState().settings.cries, 0.5);
    };
    return { actors: [...actors.current.values()], zones, ref, tap };
}
export type WildScene = ReturnType<typeof useWild>;

const ANIM: Record<Actor['act'], FieldAnim> = {
    idle: 'Idle',
    look: 'Idle',
    sleep: 'Idle',
    walk: 'Walk',
    chase: 'Walk',
    flee: 'Walk',
    hop: 'Hop',
    emote: 'Pose',
};

/** Ícones de emote em pixel art (5x5), nada de emoji. */
const ICON: Record<Exclude<Emote, 'goal'>, { px: string[]; c: string }> = {
    heart: { px: ['01010', '11111', '11111', '01110', '00100'], c: '#e8443a' },
    note: { px: ['00110', '00101', '00100', '11100', '11100'], c: '#3a6fd8' },
    surprise: { px: ['00100', '00100', '00100', '00000', '00100'], c: '#e8443a' },
    question: { px: ['01110', '10001', '00110', '00000', '00100'], c: '#3a6fd8' },
};

/** A bola do balão do artilheiro (5x5). */
const BALL = ['01110', '10001', '10101', '10001', '01110'];

/** Balão do artilheiro: a bola e os gols dele pelo clube. */
function GoalBubble({ n }: { n: number }) {
    return (
        <span className="wild-goals">
            <svg viewBox="0 0 5 5" shapeRendering="crispEdges" aria-hidden>
                {BALL.flatMap((row, y) =>
                    [...row].flatMap((b, x) =>
                        // biome-ignore lint/suspicious/noArrayIndexKey: desenho fixo, a casa é a chave
                        b === '1' ? [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />] : [],
                    ),
                )}
            </svg>
            {n}
        </span>
    );
}

function Bubble({ kind }: { kind: Exclude<Emote, 'goal'> }) {
    const { px, c } = ICON[kind];
    return (
        <svg className="wild-bubble" viewBox="0 0 9 10" shapeRendering="crispEdges" aria-hidden>
            <rect x="0.5" y="0.5" width="8" height="7" fill="#f8f8f0" stroke="#1d1d2c" />
            <rect x="3" y="7.5" width="2" height="1" fill="#f8f8f0" />
            <rect x="3" y="8.5" width="1" height="1" fill="#1d1d2c" />
            {px.flatMap((row, y) =>
                [...row].flatMap((b, x) =>
                    // biome-ignore lint/suspicious/noArrayIndexKey: desenho fixo, a casa é a chave
                    b === '1' ? [<rect key={`${x}-${y}`} x={2 + x} y={1.5 + y} width="1" height="1" fill={c} />] : [],
                ),
            )}
        </svg>
    );
}

/** Uma zona de Pokémon ambiente (a caixa onde eles andam; a posição de cada um vai em % dela). */
export function WildZone({ wild, zone, className = '' }: { wild: WildScene; zone: string; className?: string }) {
    const def = wild.zones[zone];
    return (
        <div className={`wild-zone ${className}`} data-zone={zone} ref={wild.ref(`box:${zone}`, true)} aria-hidden>
            {def &&
                wild.actors
                    .filter((a) => a.zone === zone)
                    .map((a) => (
                        // biome-ignore lint/a11y/noStaticElementInteractions: enfeite da cena (aria-hidden), o toque só faz ele pular
                        // biome-ignore lint/a11y/useKeyWithClickEvents: idem, sem foco nem função
                        <span
                            key={a.key}
                            ref={wild.ref(a.key, false)}
                            className={`wild${def.fly ? ' fly' : ''}${a.goals ? ' star' : ''}${a.act === 'sleep' ? ' asleep' : ''}${a.shown ? '' : ' off'}`}
                            style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, zIndex: zOf(def, a.y) }}
                            onClick={() => wild.tap(a.key)}
                        >
                            <i className="wild-shadow" />
                            <FieldSprite
                                id={a.id}
                                shiny={a.shiny}
                                anim={ANIM[a.act]}
                                dir={a.dir}
                                scale={def.scale}
                                play={a.act !== 'sleep'}
                                start={a.act === 'hop' || a.act === 'emote' ? a.t0 : 0}
                                className="wild-mon"
                            >
                                {a.act === 'sleep' ? (
                                    <span className="wild-zzz">
                                        <b>z</b>
                                        <b>z</b>
                                        <b>Z</b>
                                    </span>
                                ) : a.emote === 'goal' ? (
                                    <GoalBubble key={`goal${a.t0}`} n={a.goals ?? 0} />
                                ) : a.emote ? (
                                    <Bubble key={`${a.emote}${a.t0}`} kind={a.emote} />
                                ) : null}
                            </FieldSprite>
                        </span>
                    ))}
        </div>
    );
}

/** Media query como estado (sprite maior no desktop, menor no celular pequeno). */
export function useMq(q: string): boolean {
    const [on, setOn] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
    useEffect(() => {
        const m = matchMedia(q);
        const f = () => setOn(m.matches);
        f();
        m.addEventListener('change', f);
        return () => m.removeEventListener('change', f);
    }, [q]);
    return on;
}
