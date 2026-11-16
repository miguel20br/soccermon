import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { useT } from '../i18n/react';
import { portraitSrc } from './portrait';
import { useTimeLeft } from './tema';
import './neon-cover.css';

/** Capa em painéis (Noite Neon, ui/tema.ts): uma vez por sessão ao abrir a Home, como tela de carregamento. */
const KEY = 'soccermon-neon-capa';
/** Some sozinha depois disso (um toque fecha antes). */
const SHOW_MS = 4500;
const EXIT_MS = 250;
/** Lido uma vez quando o pedaço carrega (fora do render: o StrictMode chama o useState duas vezes). */
const FIRST = (() => {
    try {
        if (sessionStorage.getItem(KEY)) return false;
        sessionStorage.setItem(KEY, '1');
    } catch {
        // sem storage: mostra a cada abertura
    }
    return true;
})();

/** Óculos escuros de pixel, com o reflexo rosa. */
function Shades({ className }: { className: string }) {
    return (
        <svg className={`nc-shades ${className}`} viewBox="0 0 22 6" shapeRendering="crispEdges" aria-hidden>
            <rect x="0" y="0" width="22" height="1" fill="#111" />
            <rect x="1" y="1" width="8" height="4" fill="#111" />
            <rect x="13" y="1" width="8" height="4" fill="#111" />
            <rect x="2" y="1" width="3" height="1" fill="#ff7fc8" />
            <rect x="14" y="1" width="3" height="1" fill="#ff7fc8" />
        </svg>
    );
}

/** Conversível de pixel, de lado, rosa com cromado. */
function Car() {
    return (
        <svg className="nc-auto" viewBox="0 0 64 26" shapeRendering="crispEdges" aria-hidden>
            <rect x="4" y="12" width="56" height="8" fill="#ff4f9a" />
            <rect x="2" y="14" width="2" height="5" fill="#ff4f9a" />
            <rect x="60" y="14" width="2" height="5" fill="#ff4f9a" />
            <rect x="34" y="9" width="24" height="3" fill="#ff4f9a" />
            <rect x="4" y="12" width="56" height="1" fill="#ffa3cf" />
            <rect x="32" y="4" width="2" height="8" fill="#bde9ff" />
            <rect x="4" y="16" width="56" height="1" fill="#c22d6f" />
            <rect x="0" y="18" width="4" height="2" fill="#d8dde6" />
            <rect x="60" y="18" width="4" height="2" fill="#d8dde6" />
            <rect x="58" y="13" width="3" height="2" fill="#fff27a" />
            <rect x="9" y="17" width="12" height="9" fill="#111" />
            <rect x="43" y="17" width="12" height="9" fill="#111" />
            <rect x="12" y="20" width="6" height="3" fill="#9aa3b5" />
            <rect x="46" y="20" width="6" height="3" fill="#9aa3b5" />
        </svg>
    );
}

function Palm() {
    return (
        <svg className="nc-palm" viewBox="0 0 32 48" shapeRendering="crispEdges" aria-hidden>
            <rect x="16" y="11" width="2" height="9" />
            <rect x="15" y="20" width="2" height="9" />
            <rect x="15" y="29" width="3" height="9" />
            <rect x="14" y="38" width="3" height="10" />
            <polygon points="16,11 3,8 0,14 8,11" />
            <polygon points="17,11 29,8 32,14 24,11" />
            <polygon points="16,11 7,2 3,4" />
            <polygon points="17,11 25,2 29,4" />
            <polygon points="16,11 11,22 8,20" />
            <polygon points="17,11 22,22 25,20" />
        </svg>
    );
}

const Panel = ({ k, r, children }: { k: string; r: number; children: ReactNode }) => (
    <div className={`nc-p nc-${k}`} style={{ '--r': `${r}deg` } as CSSProperties}>
        {children}
    </div>
);

/**
 * A capa: colagem de painéis tortos no estilo das capas de jogo de mundo aberto (paródia de linguagem visual, com os
 * Pokémon do jogo): o Pikachu de óculos, o Squirtle no conversível e os "da rua" da Semana Fora da Lei (Hitmonlee
 * e Hitmonchan no neon, o Blastoise no pôr do sol, o Machamp procurado) e o logo com o cronômetro.
 */
export function NeonCover() {
    const { t } = useT();
    const left = useTimeLeft();
    const [state, setState] = useState<'on' | 'out' | 'off'>(FIRST ? 'on' : 'off');
    const close = () => setState((s) => (s === 'on' ? 'out' : s));
    useEffect(() => {
        if (state === 'on') {
            const id = window.setTimeout(() => setState('out'), SHOW_MS);
            return () => window.clearTimeout(id);
        }
        if (state === 'out') {
            const id = window.setTimeout(() => setState('off'), EXIT_MS);
            return () => window.clearTimeout(id);
        }
    }, [state]);
    if (state === 'off') return null;
    return (
        <button
            type="button"
            className={`nc${state === 'out' ? ' out' : ''}`}
            onClick={close}
            aria-label={t('home.amb.neonCoverTap')}
        >
            <Panel k="pika" r={-1.5}>
                <i className="nc-sun" />
                <span className="nc-face">
                    <img className="pixel" src={portraitSrc(25, ['happy'])} alt="" width="40" height="40" />
                    <Shades className="pika" />
                </span>
            </Panel>
            <Panel k="car" r={1.2}>
                <span className="nc-ride">
                    <span className="nc-face driver">
                        <img className="pixel" src={portraitSrc(7, ['happy'])} alt="" width="40" height="40" />
                        <Shades className="squirtle" />
                    </span>
                    <Car />
                </span>
            </Panel>
            <Panel k="gengar" r={-1}>
                <img className="nc-mon pixel duo l" src="assets/cards/106.gif" alt="" />
                <img className="nc-mon pixel duo r" src="assets/cards/107.gif" alt="" />
            </Panel>
            <Panel k="lapras" r={1.6}>
                <i className="nc-sun low" />
                <i className="nc-sea" />
                <Palm />
                <img className="nc-mon pixel" src="assets/cards/9.gif" alt="" />
            </Panel>
            <Panel k="meowth" r={-1.8}>
                <img className="nc-mon pixel" src="assets/cards/68.gif" alt="" />
                <span className="nc-stars" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <svg key={i} viewBox="0 0 24 24" aria-hidden>
                            <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6L3.3 9.3l6.1-.7z" />
                        </svg>
                    ))}
                </span>
            </Panel>
            <Panel k="logo" r={0}>
                <img className="nc-logo-img" src="assets/ui/logo.svg" alt="Soccermon" />
                <b className="nc-title">{t('home.amb.ledNeon')}</b>
                {left && <small className="nc-left">{t('home.amb.neonEndsShort', { left })}</small>}
                <small className="nc-tap">{t('home.amb.neonCoverTap')}</small>
            </Panel>
        </button>
    );
}

export default NeonCover;
