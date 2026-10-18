import { useEffect, useState } from 'react';
import { playCry, playSfx } from '../../game/audio';
import { useT } from '../../i18n/react';
import { EMOTES, type EmoteKind, type Role } from '../../net/duel-state';
import { duel, useDuel } from '../../net/session';
import { useGame } from '../../store/game-store';

/** Ícones desenhados dos 6 emotes (sem emoji): palmas, bola em chamas, gota de suor, Snorlax dormindo, aperto de mão e a braçadeira de capitão gritando. */
export function EmoteIcon({ kind }: { kind: EmoteKind }) {
    switch (kind) {
        case 'boa':
            return (
                <svg viewBox="0 0 32 32" aria-hidden className="emote-svg">
                    <path
                        d="M9 18 L14 7 Q16 5 17 8 L15 14 L22 6 Q24 5 25 7 L19 17 Q18 25 11 26 Q6 25 9 18 Z"
                        fill="#ffd9a8"
                        stroke="#2b1a0e"
                        strokeWidth="1.6"
                    />
                    <path d="M6 11 L4 8 M8 8 L7 4 M11 6 L12 3" stroke="#ffd447" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );
        case 'golaco':
            return (
                <svg viewBox="0 0 32 32" aria-hidden className="emote-svg">
                    <path
                        d="M8 20 Q4 12 10 6 Q10 11 14 11 Q12 5 18 2 Q17 8 22 9 Q24 6 24 4 Q30 12 25 21 Z"
                        fill="#ff7a1a"
                        stroke="#7a1d00"
                        strokeWidth="1.4"
                    />
                    <circle cx="16" cy="21" r="8" fill="#fff" stroke="#1b1b1b" strokeWidth="1.6" />
                    <path d="M16 17 L19.5 19.5 L18 23.5 L14 23.5 L12.5 19.5 Z" fill="#1b1b1b" />
                </svg>
            );
        case 'ops':
            return (
                <svg viewBox="0 0 32 32" aria-hidden className="emote-svg">
                    <path
                        d="M16 3 Q24 15 24 20 A8 8 0 0 1 8 20 Q8 15 16 3 Z"
                        fill="#7cc8ff"
                        stroke="#14456b"
                        strokeWidth="1.6"
                    />
                    <path d="M12 19 Q12 23 15 24" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
            );
        case 'zzz':
            return (
                <span className="emote-zzz" aria-hidden>
                    <img className="pixel" src="assets/cards/143.gif" alt="" />
                    <svg viewBox="0 0 32 32" className="emote-z" aria-hidden>
                        <path
                            d="M14 4 H22 L14 12 H22 M24 14 H29 L24 19 H29"
                            stroke="#fff"
                            strokeWidth="2.2"
                            fill="none"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            );
        case 'gg':
            return (
                <svg viewBox="0 0 32 32" aria-hidden className="emote-svg">
                    <path
                        d="M3 14 L9 10 L15 13 L21 9 L29 14 L24 21 Q20 25 16 22 L9 19 Z"
                        fill="#ffd9a8"
                        stroke="#2b1a0e"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path d="M13 15 L18 18 M15 13 L20 16" stroke="#2b1a0e" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M3 14 L1 16 M29 14 L31 16" stroke="#4f8cff" strokeWidth="3" strokeLinecap="round" />
                </svg>
            );
        case 'grito':
            return (
                // braçadeira de capitão com o "C" e o grito saindo (o alto-falante fica só pro silenciar)
                <svg viewBox="0 0 32 32" aria-hidden className="emote-svg">
                    <rect x="3" y="9" width="18" height="14" rx="3" fill="#ffd447" stroke="#5a3b00" strokeWidth="1.6" />
                    <path
                        d="M16 13 Q12.5 11 10.2 13.4 Q8.6 16 10.2 18.6 Q12.5 21 16 19"
                        stroke="#5a3b00"
                        strokeWidth="2.4"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M24 10.5 L29 7.5 M25 16 H30.5 M24 21.5 L29 24.5"
                        stroke="#ff4d4d"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />
                </svg>
            );
    }
}

/** Grito do capitão do time `role` (respeita o volume dos gritos). */
function shout(role: Role) {
    const s = useDuel.getState().shared;
    const team = s?.teams[role];
    const cap = team && [...team.lineup, ...team.bench].find((p) => p.uid === team.captainUid);
    if (cap) playCry(cap.speciesId, useGame.getState().settings.cries, 1.2);
}

/** Balão do emote em cima do lado de quem mandou (some sozinho). */
export function EmoteBubbles({ mySide }: { mySide: 'left' | 'right' }) {
    const { d } = useT();
    const got = useDuel((s) => s.emote);
    const [mine, setMine] = useState<{ kind: EmoteKind; at: number } | null>(null);
    const [theirs, setTheirs] = useState<{ kind: EmoteKind; at: number } | null>(null);
    useEffect(() => {
        if (!got) return;
        setTheirs({ kind: got.kind, at: got.at });
        if (got.kind === 'grito') shout(got.role);
        else playSfx('select');
        const id = window.setTimeout(() => setTheirs(null), 2600);
        return () => clearTimeout(id);
    }, [got]);
    useEffect(() => {
        const on = (e: Event) => {
            const kind = (e as CustomEvent<EmoteKind>).detail;
            setMine({ kind, at: Date.now() });
            window.setTimeout(() => setMine((m) => (m && Date.now() - m.at >= 2500 ? null : m)), 2600);
        };
        window.addEventListener('duel:emote-sent', on);
        return () => window.removeEventListener('duel:emote-sent', on);
    }, []);
    const bubble = (e: { kind: EmoteKind; at: number } | null, side: 'left' | 'right') =>
        e && (
            <div key={`${side}-${e.at}`} className={`emote-bubble ${side}`} role="status">
                <EmoteIcon kind={e.kind} />
                <b>{d.duel.emotes[e.kind]}</b>
            </div>
        );
    return (
        <>
            {bubble(mine, mySide)}
            {bubble(theirs, mySide === 'left' ? 'right' : 'left')}
        </>
    );
}

/** Barra de emotes: 1 a cada 3 s (o grito, 10 s) e o botão de silenciar os do rival. */
export function EmoteBar() {
    const { t, d } = useT();
    const muted = useDuel((s) => s.muted);
    const role = useDuel((s) => s.role);
    const [cool, setCool] = useState(false);
    const send = (kind: EmoteKind) => {
        if (!duel.sendEmote(kind)) return;
        if (kind === 'grito' && role) shout(role);
        window.dispatchEvent(new CustomEvent('duel:emote-sent', { detail: kind }));
        setCool(true);
        window.setTimeout(() => setCool(false), 3000);
    };
    return (
        <div className="emote-bar">
            {EMOTES.map((k) => (
                <button
                    key={k}
                    type="button"
                    className="emote-btn"
                    disabled={cool}
                    title={d.duel.emotes[k]}
                    aria-label={d.duel.emotes[k]}
                    onClick={() => send(k)}
                >
                    <EmoteIcon kind={k} />
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
