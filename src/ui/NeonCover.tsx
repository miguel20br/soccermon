import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { useT } from '../i18n/react';
import { Logo } from './components/LogoHits';
import { portraitSrc } from './portrait';
import { useTimeLeft } from './tema';
import './neon-cover.css';

/** Capa em painéis (Noite Neon, ui/tema.ts): uma vez por sessão ao abrir a Home, como tela de carregamento. */
const KEY = 'soccermon-neon-capa';
/** Some sozinha depois disso (um toque fecha antes). */
const SHOW_MS = 4500;
const EXIT_MS = 250;
/** Lido uma vez quando o pedaço carrega (fora do render: o StrictMode chama o useState duas vezes). */
// robô do navegador (a fumaça do CI, prints) não vê a capa por cima da Home, salvo com `?capa=1`
const FIRST = (() => {
    if (navigator.webdriver && !new URLSearchParams(window.location.search).has('capa')) return false;
    try {
        if (sessionStorage.getItem(KEY)) return false;
        sessionStorage.setItem(KEY, '1');
    } catch {
        // sem storage: mostra a cada abertura
    }
    return true;
})();

/**
 * Óculos escuros (wayfarer preto com reflexo) desenhados na grade do retrato PMD (40×40): cada letra é um pixel do
 * retrato e `.` é transparente. Cada linha é `haste + lente esquerda (10) + ponte + lente direita (10) + haste`; haste e
 * ponte são a letra da cor (esticada até a orelha ou pelo vão entre as lentes), ou espaço e `_` quando não tem.
 */
const OCULOS: { rows: string[]; pal: Record<string, string> } = {
    rows: [
        ' kgggkkkkkkkkgggkkkkkk ',
        'kkkkkkkkkkkkkkkkkkkkkkk',
        ' kaaaawawak_kaaaawawak ',
        ' .kbbwbwbbk_kbbbwbwbk. ',
        ' .kcwcccck._.kcwcccck. ',
        ' ..kkkkkk.._..kkkkkk.. ',
    ],
    pal: { k: '#0a0a10', g: '#6a6680', a: '#3a3150', b: '#221c33', c: '#110e1b', w: '#ffffff' },
};
/** Onde a lente esquerda começa no retrato, largura do vão entre as lentes e até onde vão as hastes. */
const FIT = {
    pika: { x: 12, y: 12, gap: 2, earL: 7, earR: 35 },
    squirtle: { x: 13, y: 15, gap: 4, earL: 8, earR: 37 },
};
type Fit = (typeof FIT)['pika'];
/** Pixels dos óculos no retrato (x, y, largura e letra da cor), a partir do desenho e do encaixe no rosto. */
function shadesPixels(rows: readonly string[], fit: Fit) {
    const out: { x: number; y: number; w: number; c: string }[] = [];
    const xr = fit.x + 10 + fit.gap;
    rows.forEach((row, dy) => {
        const y = fit.y + dy;
        const lens = (s: string, x0: number) => {
            for (let i = 0; i < 10; i++) if (s[i] !== '.') out.push({ x: x0 + i, y, w: 1, c: s[i] });
        };
        const left = row.slice(1, 11);
        const right = row.slice(12, 22);
        lens(left, fit.x);
        lens(right, xr);
        if (row[0] !== ' ') out.push({ x: fit.earL, y, w: fit.x - fit.earL, c: row[0] });
        if (row[11] !== '_') out.push({ x: fit.x + 10, y, w: fit.gap, c: row[11] });
        if (row[22] !== ' ') out.push({ x: xr + 10, y, w: fit.earR - xr - 10, c: row[22] });
    });
    return out;
}

function Shades({ who }: { who: keyof typeof FIT }) {
    const px = shadesPixels(OCULOS.rows, FIT[who]);
    const pal = OCULOS.pal;
    return (
        <svg
            className="nc-shades"
            viewBox="0 0 40 40"
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
            aria-hidden
        >
            {/* sombra no rosto, um pixel abaixo da armação */}
            <g transform="translate(0 1)" fill="rgb(40 0 30 / 35%)">
                {px.map((p) => (
                    <rect key={`s${p.x},${p.y}`} x={p.x} y={p.y} width={p.w} height="1" />
                ))}
            </g>
            {px.map((p) => (
                <rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width={p.w} height="1" fill={pal[p.c]} />
            ))}
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
                    <Shades who="pika" />
                </span>
            </Panel>
            <Panel k="car" r={1.2}>
                <span className="nc-ride">
                    <span className="nc-face driver">
                        <img className="pixel" src={portraitSrc(7, ['happy'])} alt="" width="40" height="40" />
                        <Shades who="squirtle" />
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
                <Logo className="nc-logo-img" alt="Soccermon" idle />
                <b className="nc-title">{t('home.amb.ledNeon')}</b>
                {left && <small className="nc-left">{t('home.amb.neonEndsShort', { left })}</small>}
                <small className="nc-tap">{t('home.amb.neonCoverTap')}</small>
            </Panel>
        </button>
    );
}

export default NeonCover;
