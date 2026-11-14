import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { BracketMatch, BracketTeam } from '../../engine/bracket';
import type { PokemonInstance } from '../../engine/instance';
import type { TeamSetup } from '../../engine/state';
import { clubName, stageName } from '../../i18n';
import { useT } from '../../i18n/react';
import { HudIcon } from './MatchHud';
import { MonIcon } from './MonIcon';
import '../bracket.css';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

const iconOf = (p?: PokemonInstance) => (p ? { speciesId: p.speciesId, shiny: p.shiny } : undefined);

/** Os rivais da copa na chave, com o ícone do capitão de cada um. */
export const bracketRivals = (opponents: readonly TeamSetup[]): BracketTeam[] =>
    opponents.map((o) => ({
        name: o.name,
        color: o.color,
        icon: iconOf(o.lineup.find((p) => p.uid === o.captainUid) ?? o.lineup[0]),
    }));

/** O seu time na chave, com o ícone do seu capitão. */
export const bracketYou = (
    name: string,
    color: number,
    picks: readonly PokemonInstance[],
    captainUid: string | null,
) => ({
    name,
    color,
    icon: iconOf(picks.find((p) => p.uid === captainUid)),
});

/**
 * Chave da Copa Relâmpago (docs/planos/campeonato.md): uma coluna por fase (oitavas → final), o seu caminho em
 * amarelo e a taça no fim. No celular a chave desliza pro lado e já abre na fase em que você está; `fresh` = a fase em
 * que você acabou de entrar sobe com brilho (você avançando).
 */
export function Bracket({ rounds, current, fresh }: { rounds: BracketMatch[][]; current: number; fresh?: boolean }) {
    const { t } = useT();
    const scroller = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const col = scroller.current?.querySelectorAll<HTMLElement>('.br-round')[current];
        if (col && scroller.current)
            scroller.current.scrollTo({ left: col.offsetLeft - 12, behavior: 'instant' as ScrollBehavior });
    }, [current]);
    const champion = rounds[3]?.[0];
    const winner = champion?.winner === undefined ? null : champion.winner === 0 ? champion.a : champion.b;
    return (
        <section className="br" aria-label={t('bracket.title')}>
            <div className="br-scroll" ref={scroller}>
                {rounds.map((games, r) => (
                    <div
                        key={stageName(r)}
                        className={`br-round${r === current ? ' now' : r > current ? ' future' : ''}`}
                        style={{ '--r': r } as CSSProperties}
                    >
                        <span className="br-stage">{stageName(r)}</span>
                        <div className="br-games">
                            {games.map((m) => (
                                <Game key={`${m.a.name}-${m.b.name}`} m={m} fresh={fresh && r === current} />
                            ))}
                        </div>
                    </div>
                ))}
                <div className="br-round br-trophy">
                    <span className="br-stage">{t('bracket.champion')}</span>
                    <div className={`br-cup${winner?.you ? ' you' : ''}`}>
                        <HudIcon kind="cup" />
                        {winner && <b>{winner.you ? winner.name : clubName(winner.name)}</b>}
                    </div>
                </div>
            </div>
        </section>
    );
}

function Game({ m, fresh }: { m: BracketMatch; fresh?: boolean }) {
    const mine = m.a.you || m.b.you;
    return (
        <div className={`br-game${mine ? ' mine' : ''}${mine && fresh ? ' fresh' : ''}`}>
            <Row team={m.a} goals={m.score?.[0]} won={m.winner === 0} />
            <Row team={m.b} goals={m.score?.[1]} won={m.winner === 1} />
        </div>
    );
}

function Row({ team, goals, won }: { team: BracketTeam; goals?: number; won: boolean }) {
    return (
        <span
            className={`br-team${team.you ? ' you' : ''}${won ? ' won' : ''}`}
            style={{ '--tc': hex(team.color) } as CSSProperties}
        >
            <i />
            {team.icon ? (
                <span className="br-name has-icon">
                    <MonIcon id={team.icon.speciesId} shiny={team.icon.shiny} />
                    <span>{team.you ? team.name : clubName(team.name)}</span>
                </span>
            ) : (
                <span className="br-name">{team.you ? team.name : clubName(team.name)}</span>
            )}
            <b>{goals ?? ''}</b>
        </span>
    );
}

/**
 * A chave inteira atrás de um toque ("Ver a chave"): a fileira das fases (Escalação) e o caminho do Resultado já dizem
 * onde você está; a chave é a 3ª leitura. Abre deslizando e fecha recolhendo (nada teleporta).
 */
export function BracketPeek(props: Parameters<typeof Bracket>[0]) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    return (
        <div className="br-peek">
            <button type="button" className="btn small ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
                <HudIcon kind={open ? 'up' : 'down'} />
                {open ? t('bracket.hide') : t('bracket.show')}
            </button>
            {open && (
                <div className="br-peek-body" data-exit="collapse">
                    <Bracket {...props} />
                </div>
            )}
        </div>
    );
}
