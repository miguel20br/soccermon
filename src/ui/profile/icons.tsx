/** Ícones pequenos do Perfil, desenhados em SVG (nada de emoji). */
import type { CareerSeal } from '../../store/profile';

/** Bolinha de futsal: marca quem já jogou pelo seu time. */
export function BallMark({ className = 'pf-ball' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="7" fill="#f4f1e6" stroke="#0e1430" strokeWidth="1.5" />
            <path d="M8 4.6 L11 6.8 L9.9 10.3 H6.1 L5 6.8 Z" fill="#0e1430" />
        </svg>
    );
}

/** Alto-falante: tocar o grito. */
export function SpeakerIcon() {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 C17.3 10.3 17.3 13.7 16 15 M18.5 6.5 C21.2 9.2 21.2 14.8 18.5 17.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Cadeado: ainda não descoberto. */
export function LockIcon() {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M8 11V8a4 4 0 0 1 8 0v3M5 11h14v10H5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Setas de navegação (anterior/próximo). */
export function Chevron({ dir }: { dir: 'left' | 'right' }) {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path
                d={dir === 'left' ? 'M15 6 L9 12 L15 18' : 'M9 6 L15 12 L9 18'}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Seta da cadeia de evolução. */
export function EvoArrow() {
    return (
        <svg className="pf-evo-arrow" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M4 12 H17 M12 6 L18 12 L12 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Medalha com fita: prêmio de título (missões). */
export function MedalIcon() {
    return (
        <svg className="pf-medal" viewBox="0 0 24 24" aria-hidden>
            <path d="M7 2 H11 L13 9 H9 Z" fill="#e8423f" />
            <path d="M13 2 H17 L15 9 H11 Z" fill="#3a7bd5" />
            <circle cx="12" cy="15" r="6.5" fill="#ffcb05" stroke="#0e1430" strokeWidth="1.5" />
            <path
                d="M12 11.6 L13 14 L15.4 14.2 L13.6 15.8 L14.1 18.2 L12 17 L9.9 18.2 L10.4 15.8 L8.6 14.2 L11 14 Z"
                fill="#b07a12"
            />
        </svg>
    );
}

/** Fita de campeão (roseta dourada com as fitas vermelhas) com o número de títulos da espécie. */
export function ChampionRibbon({ n, className = 'pf-ribbon' }: { n: number; className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 30" aria-hidden>
            <path d="M7 15 L3 29 L8 26 L11 29 L12 17 Z" fill="#c8323a" stroke="#0e1430" strokeWidth="1.2" />
            <path d="M17 15 L21 29 L16 26 L13 29 L12 17 Z" fill="#e8423f" stroke="#0e1430" strokeWidth="1.2" />
            <circle
                cx="12"
                cy="11"
                r="10.5"
                fill="#f2c230"
                stroke="#0e1430"
                strokeWidth="1.4"
                strokeDasharray="2.2 1.1"
            />
            <circle cx="12" cy="11" r="7.2" fill="#c8323a" stroke="#ffe680" strokeWidth="1.2" />
            <text
                x="12"
                y="11"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={n >= 10 ? 8 : 10}
                fontWeight="700"
                fill="#fff"
                fontFamily="Galmuri11, monospace"
            >
                {n}
            </text>
        </svg>
    );
}

// selo de carreira: hexágono facetado com a borda de baixo preta do placar (visual da transmissão)
const HEX: [number, number][] = [
    [12, 1.5],
    [21.1, 6.75],
    [21.1, 17.25],
    [12, 22.5],
    [2.9, 17.25],
    [2.9, 6.75],
];
const hexPath = (dy = 0) => `M${HEX.map(([x, y]) => `${x} ${y + dy}`).join(' L')} Z`;
const facet = (i: number) => {
    const [a, b] = [HEX[i], HEX[(i + 1) % 6]];
    return `M12 12 L${a[0]} ${a[1]} L${b[0]} ${b[1]} Z`;
};
/** Cor de cada faceta (a partir da de cima à direita, no sentido do relógio). */
const SEAL_FACETS: Record<CareerSeal, string[]> = {
    folha: ['#e6ebf3', '#aeb8ca', '#7f8aa2', '#97a2b7', '#c9d1de', '#f7f9fc'],
    holo: ['#ff9ad5', '#ffd36b', '#a6f08a', '#7fe0ff', '#a99bff', '#ffb3a3'],
    prisma: ['#7a6cd6', '#5f53b8', '#483e98', '#5a4fb0', '#6c5fc8', '#8d7fe6'],
    ouro: ['#4a3a17', '#33280f', '#211907', '#2c220c', '#3d3013', '#5a4719'],
};

/** Selo de carreira da espécie (Folha, Holo, Prisma, Ouro escuro). Só enfeite da Pokédex: não muda a carta. */
export function CareerSealIcon({ seal, className = 'pf-seal' }: { seal: CareerSeal; className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 25" aria-hidden>
            <path d={hexPath(1.6)} fill="#000" />
            {SEAL_FACETS[seal].map((c, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: as 6 facetas são fixas
                <path key={i} d={facet(i)} fill={c} />
            ))}
            {seal === 'folha' && <path d="M7 15 L15 5 L17 6.4 L9 16.4 Z" fill="#fff" opacity="0.7" />}
            {seal === 'holo' && (
                <path d="M12 7.2 L16.2 9.6 V14.4 L12 16.8 L7.8 14.4 V9.6 Z" fill="#fff" opacity="0.75" />
            )}
            {seal === 'prisma' && (
                <>
                    <path d="M3.2 13.8 L9 12.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M12 12.8 L12 4.8 L18.6 16.8 Z" fill="#ff6ad5" />
                    <path d="M12 12.8 L18.6 16.8 L5.4 16.8 Z" fill="#ffe066" />
                    <path d="M12 12.8 L5.4 16.8 L12 4.8 Z" fill="#5fe3ff" />
                </>
            )}
            {seal === 'ouro' && (
                <>
                    <path
                        d={hexPath()}
                        fill="none"
                        stroke="#d9b23c"
                        strokeWidth="1.3"
                        transform="translate(3 3) scale(0.75)"
                    />
                    <path
                        d="M12 6.6 L13.5 10.3 L17.4 10.5 L14.4 13 L15.4 16.8 L12 14.7 L8.6 16.8 L9.6 13 L6.6 10.5 L10.5 10.3 Z"
                        fill="#f2c230"
                    />
                </>
            )}
            <path d={hexPath()} fill="none" stroke="#0e1430" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
    );
}

/** Brilho de 4 pontas (shiny), desenhado: nada de emoji. */
export function ShinySpark({ className = 'pf-spark' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
            <path
                d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1 Z"
                fill="#ffe066"
                stroke="#7a4a00"
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** Visto de "salvo". */
export function CheckIcon() {
    return (
        <svg className="pf-ico" viewBox="0 0 24 24" aria-hidden>
            <path
                d="M5 12.5 L10 17 L19 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
