import { type CSSProperties, useEffect, useState } from 'react';
import { playCry } from '../../game/audio';
import { useT } from '../../i18n/react';
import { EMOTES, type EmoteKind } from '../../net/duel-state';
import { duel, useDuel } from '../../net/session';
import { useGame } from '../../store/game-store';
import { emoteFace, FACE } from './emote-faces';

/** Grito do capitão no tom do emote (respeita o volume dos gritos; o Grito do capitão sai mais alto). */
function cry(speciesId: number, kind: EmoteKind) {
    playCry(speciesId, useGame.getState().settings.cries, kind === 'grito' ? 1.2 : 0.8, FACE[kind].rate);
}

type Shown = { kind: EmoteKind; at: number };

/**
 * O capitão grandão saindo do lado de quem mandou, embaixo do placar, com a frase (some sozinho). `captains` e
 * `colors` vão na ordem do placar (esquerda, direita).
 */
export function EmoteBubbles({
    mySide,
    captains,
    colors,
}: {
    mySide: 'left' | 'right';
    captains: [number, number];
    colors: [string, string];
}) {
    const { d } = useT();
    const got = useDuel((s) => s.emote);
    const [mine, setMine] = useState<Shown | null>(null);
    const [theirs, setTheirs] = useState<Shown | null>(null);
    const me = mySide === 'left' ? 0 : 1;
    const them = me ? 0 : 1;
    // os 8 rostos dos dois capitães já ficam no cache (o do rival aparece sem piscar)
    const [capL, capR] = captains;
    useEffect(() => {
        for (const sp of [capL, capR]) for (const k of EMOTES) new Image().src = emoteFace(sp, k);
    }, [capL, capR]);
    const rivalCap = captains[them];
    useEffect(() => {
        if (!got) return;
        setTheirs({ kind: got.kind, at: got.at });
        cry(rivalCap, got.kind);
        const id = window.setTimeout(() => setTheirs(null), 2600);
        return () => clearTimeout(id);
    }, [got, rivalCap]);
    useEffect(() => {
        let id = 0;
        const on = (e: Event) => {
            setMine({ kind: (e as CustomEvent<EmoteKind>).detail, at: Date.now() });
            clearTimeout(id);
            id = window.setTimeout(() => setMine(null), 2600);
        };
        window.addEventListener('duel:emote-sent', on);
        return () => {
            window.removeEventListener('duel:emote-sent', on);
            clearTimeout(id);
        };
    }, []);
    const bubble = (e: Shown | null, i: 0 | 1) =>
        e && (
            <div
                key={`${i}-${e.at}`}
                className={`emote-pop ${i ? 'right' : 'left'} ${FACE[e.kind].move}`}
                style={{ '--tc': colors[i] } as CSSProperties}
                role="status"
            >
                <img className="pixel emote-face" src={emoteFace(captains[i], e.kind)} alt="" />
                <b>{d.duel.emotes[e.kind]}</b>
            </div>
        );
    return (
        <>
            {bubble(mine, me)}
            {bubble(theirs, them)}
        </>
    );
}

/** Os 8 emotes com a cara do seu capitão: 1 a cada 3 s (o grito, 10 s) e o botão de silenciar os do rival. */
export function EmoteBar({ captain }: { captain: number }) {
    const { t, d } = useT();
    const muted = useDuel((s) => s.muted);
    const [cool, setCool] = useState(false);
    const send = (kind: EmoteKind) => {
        if (!duel.sendEmote(kind)) return;
        cry(captain, kind);
        window.dispatchEvent(new CustomEvent('duel:emote-sent', { detail: kind }));
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
                <svg viewBox="0 0 32 32" aria-hidden className="emote-svg">
                    <path d="M4 12 H10 L17 6 V26 L10 20 H4 Z" fill="#cfd6e4" stroke="#222" strokeWidth="1.6" />
                    {muted ? (
                        <path
                            d="M21 11 L29 21 M29 11 L21 21"
                            stroke="#ff4d4d"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                        />
                    ) : (
                        <path d="M21 12 Q24 16 21 20 M24 9 Q29 16 24 23" stroke="#cfd6e4" strokeWidth="2" fill="none" />
                    )}
                </svg>
            </button>
        </div>
    );
}
