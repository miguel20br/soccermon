import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { playCry } from '../../game/audio';
import { claimOverlay, onOverlayClaim, overlayFreeIn, PRIO_REACTION } from '../../game/overlay-slot';
import { useT } from '../../i18n/react';
import { EMOTES, type EmoteKind } from '../../net/duel-state';
import { duel, useDuel } from '../../net/session';
import { useGame } from '../../store/game-store';
import { emoteFace, FACE, type RivalEmote } from './emote-faces';
import './emotes.css';
import { HudIcon } from '../components/MatchHud';

/** Quanto o emote fica na tela e quanto o "Rival silenciado · Desfazer" espera (tempo real). */
const SHOW_MS = 2600;
const NOTE_MS = 4000;
/** Copa: emote que a reprodução passou há mais que isso (pulou pro fim, voltou pra partida) não aparece. */
const LATE_TICKS = 60;
/** Celular: quanto (ms) a reação do rival espera o gol ou o golpe sair da quadra antes de desistir. */
const REACTION_WAIT_MS = 2500;

/** Grito do capitão no tom do emote (respeita o volume dos gritos; o Grito do capitão sai mais alto). */
function cry(speciesId: number, kind: EmoteKind) {
    playCry(speciesId, useGame.getState().settings.cries, kind === 'grito' ? 1.2 : 0.8, FACE[kind].rate);
}

type Shown = { kind: EmoteKind; at: number; leaving?: boolean };

/** O valor mais novo sem virar dependência do efeito (o capitão que evolui não reprisa o último emote). */
function useLatest<T>(value: T) {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}

/** "Rival silenciado · Desfazer" por uns segundos depois de tocar no emote dele. */
function useNote() {
    const [at, setAt] = useState(0);
    useEffect(() => {
        if (!at) return;
        const id = window.setTimeout(() => setAt(0), NOTE_MS);
        return () => clearTimeout(id);
    }, [at]);
    return [at > 0, () => setAt(Date.now()), () => setAt(0)] as const;
}

/**
 * Um emote: o capitão grandão saindo do lado de quem mandou, embaixo do placar, com a frase (some sozinho). Com
 * `onMute` (o do rival), tocar nele silencia os emotes dele, como no Clash Royale.
 */
function Pop({
    e,
    i,
    speciesId,
    color,
    onMute,
}: {
    e: Shown;
    i: 0 | 1;
    speciesId: number;
    color: string;
    onMute?: () => void;
}) {
    const { t, d } = useT();
    const body = (
        <>
            <img className="pixel emote-face" src={emoteFace(speciesId, e.kind)} alt="" />
            <b>{d.duel.emotes[e.kind]}</b>
        </>
    );
    return (
        <div
            className={`emote-pop ${i ? 'right' : 'left'} ${FACE[e.kind].move}${e.leaving ? ' leaving' : ''}`}
            style={{ '--tc': color } as CSSProperties}
            role="status"
            data-emote-pop={e.kind}
        >
            {onMute ? (
                <button
                    type="button"
                    className="emote-tap"
                    title={t('duel.emotes.tapMute')}
                    aria-label={`${d.duel.emotes[e.kind]} · ${t('duel.emotes.tapMute')}`}
                    onClick={onMute}
                >
                    {body}
                </button>
            ) : (
                body
            )}
        </div>
    );
}

/** No lugar do emote silenciado: o aviso e o "Desfazer". */
function MutedNote({ i, onUndo }: { i: 0 | 1; onUndo: () => void }) {
    const { t } = useT();
    return (
        <div className={`emote-muted ${i ? 'right' : 'left'}`} role="status">
            <HudIcon kind="mute" className="emote-svg" />
            <span>{t('duel.emotes.muted')}</span>
            <button type="button" className="emote-undo" onClick={onUndo}>
                {t('duel.emotes.undo')}
            </button>
        </div>
    );
}

/**
 * Os emotes do Duelo: o seu e o do rival, cada um do lado de quem mandou. `captains` (a espécie de agora: quem evoluiu
 * aparece evoluído) e `colors` vão na ordem do placar (esquerda, direita). `onPose`: "Vamooo!" de um dos lados (a tela
 * manda o capitão daquele lado fazer pose em quadra).
 */
export function EmoteBubbles({
    mySide,
    captains,
    colors,
    onPose,
}: {
    mySide: 'left' | 'right';
    captains: [number, number];
    colors: [string, string];
    onPose?: (i: 0 | 1) => void;
}) {
    const got = useDuel((s) => s.emote);
    const [mine, setMine] = useState<Shown | null>(null);
    const [theirs, setTheirs] = useState<Shown | null>(null);
    const [note, showNote, hideNote] = useNote();
    const me = mySide === 'left' ? 0 : 1;
    const them = me ? 0 : 1;
    // os 8 rostos dos dois capitães já ficam no cache (o do rival aparece sem piscar; de novo quando um evolui)
    const [capL, capR] = captains;
    useEffect(() => {
        for (const sp of [capL, capR]) for (const k of EMOTES) new Image().src = emoteFace(sp, k);
    }, [capL, capR]);
    const rivalCap = useLatest(captains[them]);
    const pose = useLatest(onPose);
    useEffect(() => {
        if (!got || useDuel.getState().muted) return;
        setTheirs({ kind: got.kind, at: got.at });
        cry(rivalCap.current, got.kind);
        if (got.kind === 'grito') pose.current?.(them);
        const id = window.setTimeout(() => setTheirs(null), SHOW_MS);
        return () => clearTimeout(id);
    }, [got, them, rivalCap, pose]);
    useEffect(() => {
        let id = 0;
        const on = (e: Event) => {
            const kind = (e as CustomEvent<EmoteKind>).detail;
            setMine({ kind, at: Date.now() });
            if (kind === 'grito') pose.current?.(me);
            clearTimeout(id);
            id = window.setTimeout(() => setMine(null), SHOW_MS);
        };
        window.addEventListener('duel:emote-sent', on);
        return () => {
            window.removeEventListener('duel:emote-sent', on);
            clearTimeout(id);
        };
    }, [me, pose]);
    const mute = () => {
        duel.setMuted(true);
        setTheirs(null);
        showNote();
    };
    return (
        <>
            {mine && <Pop key={`m-${mine.at}`} e={mine} i={me} speciesId={captains[me]} color={colors[me]} />}
            {theirs && (
                <Pop
                    key={`t-${theirs.at}`}
                    e={theirs}
                    i={them}
                    speciesId={captains[them]}
                    color={colors[them]}
                    onMute={mute}
                />
            )}
            {note && (
                <MutedNote
                    i={them}
                    onUndo={() => {
                        duel.setMuted(false);
                        hideNote();
                    }}
                />
            )}
        </>
    );
}

/**
 * Copa: o capitão do líder rival reage aos momentos grandes (`plan`, de `rivalEmotes`), no lado dele do placar,
 * quando a reprodução passa por eles. Tocar silencia pelo resto da partida (com o "Desfazer"). `onPose`: o "Vamooo!"
 * da virada (o capitão dele faz pose em quadra).
 */
export function RivalEmotes({
    plan,
    tick,
    side,
    speciesId,
    color,
    onPose,
}: {
    plan: RivalEmote[];
    tick: number;
    side: 0 | 1;
    speciesId: number;
    color: string;
    onPose?: () => void;
}) {
    const [shown, setShown] = useState<Shown | null>(null);
    const [muted, setMuted] = useState(false);
    const [note, showNote, hideNote] = useNote();
    // começa de onde a partida está: voltar pra uma partida no meio não reprisa os emotes de antes
    const prev = useRef(tick);
    const waitRef = useRef(0);
    const sp = useLatest(speciesId);
    const pose = useLatest(onPose);
    useEffect(() => {
        const from = prev.current;
        prev.current = tick;
        if (muted || tick <= from) return;
        const hit = plan.filter((p) => p.tick > from && p.tick <= tick && tick - p.tick < LATE_TICKS).at(-1);
        if (!hit) return;
        const show = () => {
            if (!claimOverlay('emote', PRIO_REACTION, SHOW_MS)) return false;
            setShown({ kind: hit.kind, at: Date.now() });
            cry(sp.current, hit.kind);
            if (hit.kind === 'grito') pose.current?.();
            return true;
        };
        // celular: a reação é a última da fila (overlay-slot.ts); espera o gol ou o golpe sair, senão fica de fora
        if (show()) return;
        const wait = overlayFreeIn(PRIO_REACTION);
        if (wait > REACTION_WAIT_MS) return;
        clearTimeout(waitRef.current);
        waitRef.current = window.setTimeout(show, wait + 50);
    }, [tick, plan, muted, sp, pose]);
    useEffect(() => {
        const off = onOverlayClaim((id) => {
            if (id !== 'emote') setShown((s) => s && { ...s, leaving: true });
        });
        return () => {
            off();
            clearTimeout(waitRef.current);
        };
    }, []);
    useEffect(() => {
        if (!shown) return;
        const id = window.setTimeout(() => setShown(null), shown.leaving ? 220 : SHOW_MS);
        return () => clearTimeout(id);
    }, [shown]);
    useEffect(() => {
        for (const k of new Set(plan.map((p) => p.kind))) new Image().src = emoteFace(speciesId, k);
    }, [plan, speciesId]);
    return (
        <>
            {shown && (
                <Pop
                    key={shown.at}
                    e={shown}
                    i={side}
                    speciesId={speciesId}
                    color={color}
                    onMute={() => {
                        setMuted(true);
                        setShown(null);
                        showNote();
                    }}
                />
            )}
            {note && (
                <MutedNote
                    i={side}
                    onUndo={() => {
                        setMuted(false);
                        hideNote();
                    }}
                />
            )}
        </>
    );
}

/**
 * Os 8 emotes com a cara do seu capitão: 1 a cada 3 s (o grito, 10 s) e o botão de silenciar os do rival. `onSent`:
 * a gaveta do celular fecha ao mandar (como no Clash Royale), pra o emote aparecer.
 */
export function EmoteBar({ captain, onSent }: { captain: number; onSent?: () => void }) {
    const { t, d } = useT();
    const muted = useDuel((s) => s.muted);
    const [cool, setCool] = useState(false);
    const send = (kind: EmoteKind) => {
        if (!duel.sendEmote(kind)) return;
        cry(captain, kind);
        window.dispatchEvent(new CustomEvent('duel:emote-sent', { detail: kind }));
        onSent?.();
        setCool(true);
        window.setTimeout(() => setCool(false), 3000);
    };
    return (
        <div className={`emote-bar${cool ? ' cool' : ''}`}>
            {EMOTES.map((k) => (
                <button
                    key={k}
                    type="button"
                    className="emote-btn"
                    disabled={cool}
                    title={d.duel.emotes[k]}
                    aria-label={d.duel.emotes[k]}
                    data-emote={k}
                    onClick={() => send(k)}
                >
                    <img className="pixel" src={emoteFace(captain, k)} alt="" />
                    <span>{d.duel.emotes[k]}</span>
                </button>
            ))}
            <button
                type="button"
                className={`emote-btn mute${muted ? ' on' : ''}`}
                title={muted ? t('duel.emotes.unmute') : t('duel.emotes.mute')}
                aria-label={muted ? t('duel.emotes.unmute') : t('duel.emotes.mute')}
                aria-pressed={muted}
                onClick={() => duel.setMuted(!muted)}
            >
                <HudIcon kind={muted ? 'mute' : 'shout'} className="emote-svg" />
            </button>
        </div>
    );
}
