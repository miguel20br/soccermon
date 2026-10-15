import { species } from '../../engine/data';
import { useGame } from '../../store/game-store';
import type { Dex, DexEntry } from '../../store/profile';
import { speciesGif } from './club';

/** Top 5 da Dex por um número (só quem jogou e tem esse número > 0). */
function top(dex: Dex, key: keyof DexEntry, tie: keyof DexEntry) {
    return Object.entries(dex)
        .map(([id, e]) => ({ id: Number(id), e }))
        .filter(({ e }) => e.matches > 0 && e[key] > 0)
        .sort((a, b) => b.e[key] - a.e[key] || b.e[tie] - a.e[tie] || a.id - b.id)
        .slice(0, 5);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Números: a carreira do treinador, os recordes e os Pokémon que mais marcaram e mais jogaram. */
export function NumbersTab({ onOpenDex }: { onOpenDex: () => void }) {
    const career = useGame((s) => s.career);
    const records = useGame((s) => s.records);
    const dex = useGame((s) => s.dex);
    const go = useGame((s) => s.go);

    if (career.matches === 0 && records.cups === 0) {
        return (
            <div className="pf-empty-state panel">
                <img className="pixel" src={speciesGif(25)} alt="" />
                <b>Sua história começa na primeira copa</b>
                <p>Jogue uma partida e os seus números, artilheiros e recordes aparecem aqui.</p>
                <button type="button" className="btn primary" onClick={() => go('home')}>
                    Ir para a Nova copa
                </button>
            </div>
        );
    }

    const pct = career.matches ? Math.round((career.wins / career.matches) * 100) : 0;
    const diff = career.goalsFor - career.goalsAgainst;
    const scorers = top(dex, 'goals', 'assists');
    const regulars = top(dex, 'matches', 'minutes');

    return (
        <div className="pf-numbers">
            <section className="panel pf-card">
                <h2>Carreira</h2>
                <div className="pf-career wide">
                    <Num label="Partidas" v={career.matches} />
                    <Num label="Vitórias" v={career.wins} />
                    <Num label="Derrotas" v={career.losses} />
                    <Num label="Aproveitamento" v={`${pct}%`} />
                    <Num label="Gols pró" v={career.goalsFor} />
                    <Num label="Gols contra" v={career.goalsAgainst} />
                    <Num label="Saldo" v={diff > 0 ? `+${diff}` : diff} />
                    <Num label="Vitórias nos pênaltis" v={career.shootoutWins} />
                </div>
                {career.matches > 0 && (
                    <div className="pf-winbar" role="img" aria-label={`${pct}% de vitórias`}>
                        <i style={{ width: `${pct}%` }} />
                    </div>
                )}
            </section>

            <section className="panel pf-card">
                <h2>Recordes</h2>
                <div className="pf-career wide three">
                    <Num label="Copas" v={records.cups} />
                    <Num label="Títulos" v={records.titles} />
                    <Num label="Copas perfeitas" v={records.perfect} />
                    <Num label="Destaques" v={records.destaques ?? 0} />
                    <Num label="Evoluções" v={records.evolucoes ?? 0} />
                    <Num label="Ícones" v={records.icones ?? 0} />
                </div>
            </section>

            <div className="pf-tops">
                <section className="panel pf-card">
                    <h2>Artilheiros</h2>
                    {scorers.length ? (
                        <ol className="pf-rank">
                            {scorers.map(({ id, e }, i) => (
                                <li key={id}>
                                    <span className="pf-rank-pos">{i + 1}</span>
                                    <img className="pixel" src={speciesGif(id)} alt="" loading="lazy" />
                                    <span className="pf-rank-name">
                                        <b>{species(id).name}</b>
                                        <small>
                                            {plural(e.matches, 'partida', 'partidas')} ·{' '}
                                            {plural(e.assists, 'assistência', 'assistências')}
                                        </small>
                                    </span>
                                    <b className="pf-rank-v">
                                        {e.goals}
                                        <small>{e.goals === 1 ? 'gol' : 'gols'}</small>
                                    </b>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="pf-note">Ninguém do seu time marcou ainda.</p>
                    )}
                </section>
                <section className="panel pf-card">
                    <h2>Mais escalados</h2>
                    {regulars.length ? (
                        <ol className="pf-rank">
                            {regulars.map(({ id, e }, i) => (
                                <li key={id}>
                                    <span className="pf-rank-pos">{i + 1}</span>
                                    <img className="pixel" src={speciesGif(id)} alt="" loading="lazy" />
                                    <span className="pf-rank-name">
                                        <b>{species(id).name}</b>
                                        <small>
                                            {plural(e.minutes, 'minuto', 'minutos')} ·{' '}
                                            {plural(e.wins, 'vitória', 'vitórias')}
                                        </small>
                                    </span>
                                    <b className="pf-rank-v">
                                        {e.matches}
                                        <small>{e.matches === 1 ? 'jogo' : 'jogos'}</small>
                                    </b>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="pf-note">Ninguém jogou pelo seu time ainda.</p>
                    )}
                </section>
            </div>
            <button type="button" className="btn ghost pf-to-dex" onClick={onOpenDex}>
                Ver todos na Pokédex
            </button>
        </div>
    );
}

function Num({ label, v }: { label: string; v: number | string }) {
    return (
        <div className="pf-num">
            <b>{v}</b>
            <span>{label}</span>
        </div>
    );
}
