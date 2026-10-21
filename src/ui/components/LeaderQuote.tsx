import type { CSSProperties } from 'react';
import { rivalTrainer } from '../../engine/cup-map';
import { useT } from '../../i18n/react';
import { type TrainerId, trainerSrc } from '../../store/missions';

/** Fala do treinador do clube rival depois do jogo (Copa): provoca quando ganha, reconhece quando perde. */
export function LeaderQuote({ club, won, color }: { club: string; won: boolean; color: string }) {
    const { d } = useT();
    // líder do ginásio ou o treinador do time da Rota
    const id = rivalTrainer(club);
    const l = id ? d.match.leaders[id as keyof typeof d.match.leaders] : undefined;
    if (!id || !l) return null;
    return (
        <figure className="leader-quote" style={{ '--c': color } as CSSProperties}>
            <img className="pixel" src={trainerSrc(id as TrainerId)} alt="" draggable={false} />
            <blockquote>
                <p>{won ? l.lose : l.win}</p>
                <figcaption>{l.name}</figcaption>
            </blockquote>
        </figure>
    );
}
