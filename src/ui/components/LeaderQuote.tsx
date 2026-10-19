import type { CSSProperties } from 'react';
import { clubLeader } from '../../engine/cup';
import { useT } from '../../i18n/react';
import { trainerSrc } from '../../store/missions';

/** Fala do treinador do clube rival depois do jogo (Copa): provoca quando ganha, reconhece quando perde. */
export function LeaderQuote({ club, won, color }: { club: string; won: boolean; color: string }) {
    const { d } = useT();
    const id = clubLeader(club);
    if (!id) return null;
    const l = d.match.leaders[id];
    return (
        <figure className="leader-quote" style={{ '--c': color } as CSSProperties}>
            <img className="pixel" src={trainerSrc(id)} alt="" draggable={false} />
            <blockquote>
                <p>{won ? l.lose : l.win}</p>
                <figcaption>{l.name}</figcaption>
            </blockquote>
        </figure>
    );
}
