import { type RefObject, useEffect, useReducer, useRef, useState } from 'react';
import type { SceneClock } from './clock';
import { type FieldAnim, FieldSprite } from './FieldSprite';
import { type Actor, type Area, type Emote, type Pt, spawn, step, type Wild } from './wild';

/** Uma zona da cena: onde dá pra pisar, velocidade, tamanho do sprite e a camada (z-index pela altura do pé). */
export interface ZoneDef extends Omit<Area, 'aspect'> {
    scale: number;
    z?: (y: number) => number;
}
export type Threats = RefObject<Record<string, Pt[] | undefined>>;

const zOf = (def: ZoneDef | undefined, y: number) => (def?.z ? def.z(y) : 10 + Math.round(y * 30));

/**
 * Os Pokémon ambiente de uma cena, no relógio dela. A posição anda por escrita direta no estilo a cada quadro (nada de
 * render por quadro); a tela só redesenha quando alguém troca de ação, de direção ou de emote. Quem sai da lista
 * (limite de sprites) some; quem entra nasce num lugar válido.
 */
export function useWild(clock: SceneClock, list: Wild[], zones: Record<string, ZoneDef>, threats?: Threats) {
    const actors = useRef(new Map<string, Actor>());
    const areas = useRef<Record<string, Area>>({});
    const els = useRef(new Map<string, HTMLElement>());
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
                  }
              }),
    );
    const [, redraw] = useReducer((x: number) => x + 1, 0);
    const zonesRef = useRef(zones);
    zonesRef.current = zones;

    for (const [z, def] of Object.entries(zones)) {
        const aspect = areas.current[z]?.aspect ?? 1.6;
        areas.current[z] = { ok: def.ok, speed: def.speed, fly: def.fly, still: def.still, aspect };
    }
    const keys = new Set(list.map((w) => w.key));
    for (const k of [...actors.current.keys()]) if (!keys.has(k)) actors.current.delete(k);
    for (const w of list) {
        const a = actors.current.get(w.key);
        if (a?.id === w.id) continue;
        const area = areas.current[w.zone];
        if (area) actors.current.set(w.key, spawn(w, area, Math.random, clock.t));
    }

    useEffect(
        () =>
            clock.sub((t, dt) => {
                if (!dt) return;
                const all = [...actors.current.values()];
                if (step(all, areas.current, dt, t, threats?.current ?? {})) redraw();
                for (const a of all) {
                    const el = els.current.get(a.key);
                    if (!el) continue;
                    el.style.left = `${a.x * 100}%`;
                    el.style.top = `${a.y * 100}%`;
                    el.style.zIndex = String(zOf(zonesRef.current[a.zone], a.y));
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
                    if (el && ro) ro.observe(el);
                    return;
                }
                if (el) els.current.set(key, el);
                else els.current.delete(key);
            };
            refs.current.set(key, f);
        }
        return f;
    };
    return { actors: [...actors.current.values()], zones, ref };
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
const ICON: Record<Emote, { px: string[]; c: string }> = {
    heart: { px: ['01010', '11111', '11111', '01110', '00100'], c: '#e8443a' },
    note: { px: ['00110', '00101', '00100', '11100', '11100'], c: '#3a6fd8' },
    surprise: { px: ['00100', '00100', '00100', '00000', '00100'], c: '#e8443a' },
    question: { px: ['01110', '10001', '00110', '00000', '00100'], c: '#3a6fd8' },
};

function Bubble({ kind }: { kind: Emote }) {
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
                        <span
                            key={a.key}
                            ref={wild.ref(a.key, false)}
                            className={`wild${def.fly ? ' fly' : ''}${a.act === 'sleep' ? ' asleep' : ''}`}
                            style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, zIndex: zOf(def, a.y) }}
                        >
                            <i className="wild-shadow" />
                            <FieldSprite
                                id={a.id}
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
