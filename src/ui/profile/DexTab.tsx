import { useMemo, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { useGame } from '../../store/game-store';
import { type DexEntry, isPlayed } from '../../store/profile';
import { TypeIcon } from '../components/TypeIcon';
import { TYPE_PT } from '../type-colors';
import { speciesGif } from './club';
import { BallMark } from './icons';
import { dexNo, SpeciesSheet } from './SpeciesSheet';

type Status = 'played' | 'seen' | 'unseen';
type Filter = 'all' | Status;

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'played', label: 'Jogaram' },
    { id: 'seen', label: 'Só vistos' },
    { id: 'unseen', label: 'Faltam' },
];

const statusOf = (e: DexEntry | undefined): Status => (!e ? 'unseen' : isPlayed(e) ? 'played' : 'seen');

/** Tipos que existem nos 151, na ordem da tabela de tipos. */
const TYPES = [...new Set(SPECIES.flatMap((s) => s.types))];
const TOTAL = SPECIES.length;

/** Pokédex: os 151 com o que você já viu e quem já jogou pelo seu time. */
export function DexTab() {
    const dex = useGame((s) => s.dex);
    const [filter, setFilter] = useState<Filter>('all');
    const [type, setType] = useState<string | null>(null);
    const [open, setOpen] = useState<number | null>(null);

    const counts = useMemo(() => {
        const c = { all: TOTAL, played: 0, seen: 0, unseen: 0 };
        for (const sp of SPECIES) c[statusOf(dex[sp.id])]++;
        return c;
    }, [dex]);
    const seenCount = counts.played + counts.seen;

    const list = useMemo(
        () =>
            SPECIES.filter((sp) => {
                const st = statusOf(dex[sp.id]);
                if (filter !== 'all' && st !== filter) return false;
                // o tipo de quem você ainda não viu fica escondido (como nos jogos)
                if (type && (st === 'unseen' || !sp.types.includes(type))) return false;
                return true;
            }),
        [dex, filter, type],
    );
    const order = useMemo(() => list.map((s) => s.id), [list]);

    return (
        <div className="pf-dex">
            <div className="pf-dex-progress">
                <div className="pf-dex-counts">
                    <span>
                        Vistos <b>{seenCount}</b>/{TOTAL}
                    </span>
                    <span>
                        <BallMark /> Jogaram <b>{counts.played}</b>/{TOTAL}
                    </span>
                </div>
                <div
                    className="pf-bar"
                    role="img"
                    aria-label={`${seenCount} de ${TOTAL} vistos, ${counts.played} jogaram pelo seu time`}
                >
                    <i className="seen" style={{ width: `${(seenCount / TOTAL) * 100}%` }} />
                    <i className="played" style={{ width: `${(counts.played / TOTAL) * 100}%` }} />
                </div>
            </div>

            <fieldset className="pf-filters">
                <legend className="pf-sr">Filtrar por situação</legend>
                {FILTERS.map((f) => (
                    <button
                        type="button"
                        key={f.id}
                        className={`pf-chip${filter === f.id ? ' active' : ''}`}
                        aria-pressed={filter === f.id}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label} <small>{counts[f.id]}</small>
                    </button>
                ))}
            </fieldset>
            <fieldset className="pf-types">
                <legend className="pf-sr">Filtrar por tipo</legend>
                {TYPES.map((t) => (
                    <button
                        type="button"
                        key={t}
                        className={`pf-type${type === t ? ' active' : ''}`}
                        aria-pressed={type === t}
                        aria-label={`Tipo ${TYPE_PT[t] ?? t}`}
                        title={TYPE_PT[t] ?? t}
                        onClick={() => setType(type === t ? null : t)}
                    >
                        <TypeIcon type={t} size={22} label={type === t} />
                    </button>
                ))}
            </fieldset>

            {list.length ? (
                <ul className="pf-grid">
                    {list.map((sp) => {
                        const st = statusOf(dex[sp.id]);
                        const known = st !== 'unseen';
                        return (
                            <li key={sp.id}>
                                <button
                                    type="button"
                                    className={`pf-cell ${st}`}
                                    onClick={() => setOpen(sp.id)}
                                    aria-label={`Nº ${dexNo(sp.id)} ${known ? sp.name : 'não visto'}${st === 'played' ? ', jogou pelo seu time' : ''}`}
                                >
                                    <span className="pf-cell-no">{dexNo(sp.id)}</span>
                                    <img
                                        className="pixel"
                                        src={speciesGif(sp.id)}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                    />
                                    <span className="pf-cell-name">{known ? sp.name : '???'}</span>
                                    {st === 'played' && <BallMark className="pf-ball pf-cell-mark" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="pf-empty">
                    {filter === 'unseen' && type
                        ? 'O tipo de quem falta fica escondido até você ver o Pokémon.'
                        : filter === 'played'
                          ? 'Ninguém jogou pelo seu time ainda. Comece uma copa!'
                          : 'Nenhum Pokémon por aqui ainda.'}
                </p>
            )}

            {open !== null && <SpeciesSheet id={open} order={order} onNav={setOpen} onClose={() => setOpen(null)} />}
        </div>
    );
}
