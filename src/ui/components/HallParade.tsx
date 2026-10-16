import { useEffect, useState } from 'react';
import { playCry } from '../../game/audio';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex, type HallEntry } from '../../store/profile';
import { clubVars } from '../profile/club';
import { reduceMotionOn } from '../settings-sync';
import { cardSprite } from './PokeCard';

const STEP_MS = 1700;

/**
 * Desfile do Hall da Fama, como o do Red/Blue: cada Pokémon do elenco campeão aparece sozinho (com o grito),
 * depois o clube e o número no Hall. Toque pula para o fim; no fim, toque fecha. Só aparece uma vez por título.
 */
export function HallParade({ entry, trainer, onDone }: { entry: HallEntry; trainer: string; onDone: () => void }) {
    const { t } = useT();
    const cries = useGame((s) => s.settings.cries);
    const total = entry.squad.length;
    // com "reduzir movimento", vai direto para o cartão final
    const [i, setI] = useState(() => (reduceMotionOn() ? total : 0));
    const mon = entry.squad[i];

    useEffect(() => {
        if (i >= total) return;
        playCry(entry.squad[i].speciesId, cries);
        const id = setTimeout(() => setI((n) => n + 1), STEP_MS);
        return () => clearTimeout(id);
    }, [i, total, entry, cries]);

    return (
        <button
            type="button"
            className="hall-parade"
            style={clubVars(clubColorHex(entry.clubColor))}
            onClick={() => (i < total ? setI(total) : onDone())}
            aria-label={i < total ? t('title.hall.skip') : t('common.ui.close')}
        >
            {mon ? (
                <div key={i} className="hp-mon">
                    <img className="pixel" src={cardSprite(mon)} alt="" />
                    <b>{mon.name}</b>
                    <span>
                        {mon.ovr}
                        {mon.goals > 0 && ` · ${t('title.hall.goals', { n: mon.goals })}`}
                    </span>
                </div>
            ) : (
                <div className="hp-end">
                    <span className="hp-no">{t('title.hall.entry', { n: entry.titleNo })}</span>
                    <b className="hp-club">{entry.club}</b>
                    <span>{trainer}</span>
                    <div className="hp-squad">
                        {entry.squad.map((m) => (
                            <img key={`${m.speciesId}-${m.name}`} className="pixel" src={cardSprite(m)} alt={m.name} />
                        ))}
                    </div>
                    {entry.perfect && <span className="perfect-badge">{t('title.hall.perfect')}</span>}
                </div>
            )}
            <small className="hp-skip">{i < total ? t('title.hall.skip') : t('common.ui.close')}</small>
        </button>
    );
}

/** Lista do Hall da Fama (Perfil): um cartão por título, do mais recente ao mais antigo. */
export function HallList() {
    const { t, lang } = useT();
    const hall = useGame((s) => s.hall);
    if (!hall.length) return <p className="muted">{t('title.hall.empty')}</p>;
    return (
        <ol className="hall-list">
            {hall.map((h) => (
                <li key={h.id} className="hall-card" style={clubVars(clubColorHex(h.clubColor))}>
                    <div className="hall-head">
                        <b>{t('title.hall.entry', { n: h.titleNo })}</b>
                        <span className="muted">
                            {new Date(h.date).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US')}
                        </span>
                    </div>
                    <span className="hall-club">{h.club}</span>
                    <div className="hall-squad">
                        {h.squad.map((m) => (
                            <img
                                key={`${m.speciesId}-${m.name}`}
                                className="pixel"
                                src={cardSprite(m)}
                                alt={m.name}
                                title={m.name}
                            />
                        ))}
                    </div>
                    <span className="muted hall-scores">
                        {h.scores.map((s) => `${s[0]}x${s[1]}`).join(' · ')}
                        {h.perfect && ` · ${t('title.hall.perfect')}`}
                    </span>
                </li>
            ))}
        </ol>
    );
}
