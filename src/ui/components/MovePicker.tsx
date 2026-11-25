import { useState } from 'react';
import { pickableMoves } from '../../engine/choose-moves';
import { MOVES } from '../../engine/data';
import type { PokemonInstance } from '../../engine/instance';
import { moveUses } from '../../engine/modifiers';
import { moveProfile } from '../../engine/moves';
import { SIGNATURE } from '../../engine/signature-moves';
import { moveName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { TYPE_COLOR } from '../type-colors';
import './move-picker.css';

/**
 * Escolher os golpes (`?lab=golpes-escolher`): toque numa vaga e depois no golpe que entra no lugar. A assinatura
 * fica travada. A ficha só mostra isto na escalação, antes de travar o time.
 */
export function MovePicker({ inst }: { inst: PokemonInstance }) {
    const { t, d } = useT();
    const choose = useGame((s) => s.chooseMoves);
    const [slot, setSlot] = useState<number | null>(null);
    const sig = SIGNATURE[inst.speciesId];
    const pool = pickableMoves(inst).filter((m) => !inst.moves.includes(m));
    const put = (m: string) => {
        if (slot === null) return;
        choose(
            inst.uid,
            inst.moves.map((x, i) => (i === slot ? m : x)),
        );
        setSlot(null);
    };
    return (
        <section className="mpick">
            <h3>{t('team.modal.pickTitle')}</h3>
            <p className="tactic-desc">{t('team.modal.pickHint')}</p>
            <div className="mpick-slots">
                {inst.moves.map((m, i) => (
                    <button
                        key={m}
                        type="button"
                        className={`mpick-slot${slot === i ? ' on' : ''}`}
                        style={{ borderColor: TYPE_COLOR[MOVES[m].type] }}
                        disabled={m === sig}
                        aria-pressed={slot === i}
                        onClick={() => setSlot(slot === i ? null : i)}
                    >
                        <b>{moveName(m)}</b>
                        <small>
                            {m === sig ? t('team.modal.pickLocked') : d.team.modal.kindName[moveProfile(m).kind]}
                        </small>
                    </button>
                ))}
            </div>
            <div className={`mpick-pool${slot === null ? '' : ' open'}`}>
                {pool.map((m) => (
                    <button
                        key={m}
                        type="button"
                        className="mpick-chip"
                        style={{ borderColor: TYPE_COLOR[MOVES[m].type] }}
                        tabIndex={slot === null ? -1 : 0}
                        onClick={() => put(m)}
                    >
                        {moveName(m)}
                        <small>
                            {MOVES[m].power > 0 ? MOVES[m].power : t('team.modal.pickStatus')} · {moveUses(inst, m)}x
                        </small>
                    </button>
                ))}
            </div>
        </section>
    );
}
