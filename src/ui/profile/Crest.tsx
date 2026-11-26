import type { CSSProperties, ReactNode } from 'react';
import type { ClubLook, CrestArt, CrestShape, KitArt } from '../../store/club-kit';
import { bannerInk, colorDistance } from '../../store/profile';
import { hexCss } from './club';

/** Formatos do escudo (viewBox 40x44). */
const SHAPE_PATH: Record<CrestShape, string> = {
    escudo: 'M4 3 H36 V22 C36 32 28 38 20 42 C12 38 4 32 4 22 Z',
    redondo: 'M20 3 A19 19 0 1 1 19.99 3 Z',
    hexagono: 'M20 2 L37 12 V32 L20 42 L3 32 V12 Z',
    diamante: 'M20 1 L39 22 L20 43 L1 22 Z',
    flamula: 'M5 3 H35 V39 L20 32 L5 39 Z',
};

/** Símbolos (caixa de 24x24, tinta na cor secundária `c`; `b` = cor do fundo, pros furos). */
export function symbolArt(s: CrestArt, c: string, b: string): ReactNode {
    const line = {
        fill: 'none',
        stroke: c,
        strokeWidth: 2.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    } as const;
    switch (s) {
        case 'pokebola':
            // o id ficou (saves); o desenho é o símbolo do Soccermon (Miguel, 30/10: pokébola como símbolo não, brand guide)
            return <image href="assets/ui/simbolo.svg" x="3" y="0" width="18" height="23" />;
        case 'raio':
            return <path d="M14 1.5 L4.5 13.5 H11 L9 22.5 L19.5 9.5 H13 Z" fill={c} />;
        case 'chama':
            return (
                <path
                    d="M12 1.5 C14.5 6.5 19.5 9 19.5 15 A7.5 7.5 0 0 1 4.5 15 C4.5 11 7 9 8.5 6 C9.5 9 10.5 10 12 11.5 C13.5 8 12.8 5 12 1.5 Z"
                    fill={c}
                />
            );
        case 'gota':
            return <path d="M12 1.5 C15 7 19.5 11 19.5 15 A7.5 7.5 0 0 1 4.5 15 C4.5 11 9 7 12 1.5 Z" fill={c} />;
        case 'folha':
            return (
                <>
                    <path d="M3.5 20.5 C3.5 10 10 3.5 20.5 3.5 C20.5 14 14 20.5 3.5 20.5 Z" fill={c} />
                    <path d="M4 20 L14.5 9.5" stroke={b} strokeWidth="1.8" strokeLinecap="round" />
                </>
            );
        case 'asa':
            return (
                <path
                    d="M1.5 7 C7 9 13 9.5 21.5 3 C21 9 18.5 12.5 13.5 14 C16.5 15 18.5 17.5 19 21 C12 21 6 17 1.5 7 Z"
                    fill={c}
                />
            );
        case 'espiral':
            return (
                <path
                    d="M12 12 A1.6 1.6 0 0 1 13.6 13.6 A3.2 3.2 0 0 1 10.4 16.8 A4.8 4.8 0 0 1 5.6 12 A6.4 6.4 0 0 1 12 5.6 A8 8 0 0 1 20 13.6 A8 8 0 0 1 16 20.5"
                    {...line}
                />
            );
        case 'lua':
            return <path d="M15 2.5 A9.5 9.5 0 1 0 21.5 15.5 A7.5 7.5 0 1 1 15 2.5 Z" fill={c} />;
        case 'joia':
            return (
                <>
                    <path d="M7 3.5 H17 L21.5 9 L12 21.5 L2.5 9 Z" fill={c} />
                    <path d="M2.5 9 H21.5 M9 3.5 L8 9 L12 21 M15 3.5 L16 9 L12 21" stroke={b} strokeWidth="1.1" />
                </>
            );
        case 'punho':
            return (
                <path
                    d="M5 10 A2.2 2.2 0 0 1 9.4 10 V8.6 A2.2 2.2 0 0 1 13.8 8.6 V9 A2.2 2.2 0 0 1 18.2 9 V15 A6 6 0 0 1 12.2 21 H11 A6 6 0 0 1 5 15 Z"
                    fill={c}
                />
            );
        case 'chifre':
            return <path d="M5.5 21.5 C5.5 12 10 5.5 19.5 1.5 C15.5 8 14.5 14 17 21.5 Z" fill={c} />;
        case 'rocha':
            return (
                <>
                    <path d="M2.5 20 L6.5 9 L12 5 L18 8.5 L21.5 20 Z" fill={c} />
                    <path d="M12 5 L10.5 12 L14 15 M6.5 9 L10.5 12" stroke={b} strokeWidth="1.3" fill="none" />
                </>
            );
        case 'estrela':
            return (
                <path
                    d="M12 1.5 L14.9 8.6 L22.5 9.1 L16.7 14 L18.5 21.5 L12 17.4 L5.5 21.5 L7.3 14 L1.5 9.1 L9.1 8.6 Z"
                    fill={c}
                />
            );
        case 'bola':
            return (
                <>
                    <circle cx="12" cy="12" r="9.5" fill={c} />
                    <path
                        d="M12 7.6 L16.2 10.6 L14.6 15.5 H9.4 L7.8 10.6 Z M12 7.6 V2.8 M16.2 10.6 L20.8 9 M14.6 15.5 L17.4 19.6 M9.4 15.5 L6.6 19.6 M7.8 10.6 L3.2 9"
                        fill={b}
                        stroke={b}
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                    />
                </>
            );
        case 'coroa':
            return (
                <>
                    <path d="M2.5 18 L3.5 6.5 L8.5 11.5 L12 4 L15.5 11.5 L20.5 6.5 L21.5 18 Z" fill={c} />
                    <rect x="2.5" y="19" width="19" height="2.6" rx="1" fill={c} />
                </>
            );
        case 'taca':
            return (
                <>
                    <path
                        d="M6 2.5 H18 V8 A6 6 0 0 1 6 8 Z M10.5 13.5 H13.5 V17.5 H16.5 V21.5 H7.5 V17.5 H10.5 Z"
                        fill={c}
                    />
                    <path
                        d="M6 4.5 H3 V7 A3 3 0 0 0 6.5 10 M18 4.5 H21 V7 A3 3 0 0 1 17.5 10"
                        {...line}
                        strokeWidth="1.8"
                    />
                </>
            );
        case 'espadas':
            return (
                <>
                    <path d="M4 3 L20 19 M20 3 L4 19" {...line} strokeWidth="2.8" />
                    <path d="M2.5 16.5 L7.5 21.5 M21.5 16.5 L16.5 21.5" {...line} strokeWidth="2.6" />
                </>
            );
        // Time Ultimate (opções pro Miguel, UT_CREST_OPTIONS): a carta com a estrela, o pacote, a coroa de louros
        case 'carta':
            return (
                <>
                    <rect x="4.5" y="1.5" width="15" height="21" rx="2.2" fill={c} />
                    <path
                        d="M12 6.5 L13.6 10.2 L17.5 10.5 L14.5 13 L15.4 16.9 L12 14.8 L8.6 16.9 L9.5 13 L6.5 10.5 L10.4 10.2 Z"
                        fill={b}
                    />
                </>
            );
        case 'pacote':
            return (
                <>
                    <path
                        d="M4.5 3.5 L6.4 1.5 L8.3 3.5 L10.2 1.5 L12 3.5 L13.8 1.5 L15.7 3.5 L17.6 1.5 L19.5 3.5 V20.5 L17.6 22.5 L15.7 20.5 L13.8 22.5 L12 20.5 L10.2 22.5 L8.3 20.5 L6.4 22.5 L4.5 20.5 Z"
                        fill={c}
                    />
                    <path d="M4.5 7 H19.5" stroke={b} strokeWidth="1.3" strokeDasharray="1.6 1.2" />
                    <circle cx="12" cy="13.5" r="3.6" fill={b} />
                    <circle cx="12" cy="13.5" r="1.5" fill={c} />
                </>
            );
        case 'louro': {
            const branch = (
                <>
                    <path
                        d="M11 22 C5 19 2.8 12.5 5.5 4"
                        fill="none"
                        stroke={c}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <ellipse cx="5.6" cy="17.4" rx="2.9" ry="1.45" transform="rotate(-38 5.6 17.4)" fill={c} />
                    <ellipse cx="3.9" cy="12.6" rx="2.9" ry="1.45" transform="rotate(-72 3.9 12.6)" fill={c} />
                    <ellipse cx="4.4" cy="7.6" rx="2.6" ry="1.35" transform="rotate(-100 4.4 7.6)" fill={c} />
                    <ellipse cx="8.6" cy="19.8" rx="2.4" ry="1.2" transform="rotate(-8 8.6 19.8)" fill={c} />
                    <ellipse cx="7.6" cy="14.4" rx="2.2" ry="1.1" transform="rotate(-40 7.6 14.4)" fill={c} />
                    <ellipse cx="7.4" cy="9.4" rx="2" ry="1" transform="rotate(-60 7.4 9.4)" fill={c} />
                </>
            );
            return (
                <>
                    {branch}
                    <g transform="translate(24 0) scale(-1 1)">{branch}</g>
                </>
            );
        }
    }
}

/** Cor do símbolo: a secundária, ou a tinta legível se ela some no fundo (vermelho sobre vinho). */
export const symbolInk = (look: Pick<ClubLook, 'color' | 'color2'>) =>
    colorDistance(look.color, look.color2) < 90 ? bannerInk(look.color) : look.color2;

/** Escudo do clube em SVG (formato na cor 1, borda branca, símbolo na cor 2). */
export function Crest({
    look,
    className = 'crest',
    title,
}: {
    look: Pick<ClubLook, 'color' | 'color2' | 'shape'> & { symbol: CrestArt };
    className?: string;
    title?: string;
}) {
    const c = hexCss(symbolInk(look));
    const b = hexCss(look.color);
    const art = (
        <>
            <path d={SHAPE_PATH[look.shape]} fill="rgba(0,0,0,0.35)" transform="translate(0 1.6)" />
            <path d={SHAPE_PATH[look.shape]} fill={b} stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
            <g transform={`translate(10 ${look.shape === 'flamula' ? 8 : 10}) scale(0.84)`}>
                {symbolArt(look.symbol, c, b)}
            </g>
        </>
    );
    return title ? (
        <svg className={className} viewBox="0 0 40 44" role="img">
            <title>{title}</title>
            {art}
        </svg>
    ) : (
        <svg className={className} viewBox="0 0 40 44" aria-hidden>
            {art}
        </svg>
    );
}

/** Fundo CSS do uniforme (padrão nas duas cores): placar, VERSUS, editor. */
export function kitBackground(c1: number, c2: number, pattern: KitArt, stripe = '6px', dir = '90deg'): string {
    const [a, b] = [hexCss(c1), hexCss(c2)];
    switch (pattern) {
        case 'liso':
            return a;
        case 'listras':
            return `repeating-linear-gradient(${dir}, ${a} 0 ${stripe}, ${b} ${stripe} calc(${stripe} * 2))`;
        case 'faixa':
            return `linear-gradient(135deg, ${a} 0 36%, ${b} 36% 64%, ${a} 64%)`;
        case 'meio':
            return `linear-gradient(${dir}, ${a} 50%, ${b} 50%)`;
        // Time Ultimate (opções pro Miguel, UT_KIT_OPTIONS)
        case 'xadrez':
            return `repeating-conic-gradient(${a} 0 25%, ${b} 0 50%) 0 0 / calc(${stripe} * 2) calc(${stripe} * 2)`;
        case 'chevron':
            return `${chevron(b)}, ${a}`;
        case 'aros':
            return `repeating-linear-gradient(calc(${dir} + 90deg), ${a} 0 ${stripe}, ${b} ${stripe} calc(${stripe} * 2))`;
    }
}

/** O V no peito (o chevron): as duas metades em diagonal, na cor `b`, por cima do que vier depois. */
const chevron = (b: string) =>
    `linear-gradient(to top right, transparent 0 42%, ${b} 42% 62%, transparent 62%) left / 50.5% 100% no-repeat, ` +
    `linear-gradient(to top left, transparent 0 42%, ${b} 42% 62%, transparent 62%) right / 50.5% 100% no-repeat`;

/** Camisa (silhueta) com o padrão do uniforme: editor do clube. */
export function KitShirt({
    look,
    className = 'kit-shirt',
}: {
    look: Omit<ClubLook, 'pattern'> & { pattern: KitArt };
    className?: string;
}) {
    return (
        <span
            className={className}
            aria-hidden
            style={{ background: kitBackground(look.color, look.color2, look.pattern, '18%') } as CSSProperties}
        />
    );
}

/** Só a cor secundária do padrão, por cima de um fundo (metade do VERSUS). Liso = nada. */
export function kitOverlay(c2: number, pattern: KitArt, stripe = '28px'): string {
    const b = hexCss(c2);
    switch (pattern) {
        case 'liso':
            return 'none';
        case 'listras':
            return `repeating-linear-gradient(90deg, transparent 0 ${stripe}, ${b} ${stripe} calc(${stripe} * 2))`;
        case 'faixa':
            return `linear-gradient(135deg, transparent 0 40%, ${b} 40% 60%, transparent 60%)`;
        case 'meio':
            return `linear-gradient(90deg, transparent 50%, ${b} 50%)`;
        case 'xadrez':
            return `repeating-conic-gradient(transparent 0 25%, ${b} 0 50%) 0 0 / calc(${stripe} * 2) calc(${stripe} * 2)`;
        case 'chevron':
            return chevron(b);
        case 'aros':
            return `repeating-linear-gradient(0deg, transparent 0 ${stripe}, ${b} ${stripe} calc(${stripe} * 2))`;
    }
}
