import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { Sheet } from '../kit/Sheet';
import { missionText } from '../profile/club';
import { MedalsTab } from '../profile/Medals';
import { MissionSummary, useSaveView } from '../profile/TrainerTab';
import { closestMissions } from './metas';
import '../profile/profile.css';
import '../profile/armario.css';

/**
 * Metas (menos-e-mais.md, B2): as missões em cima (as 6 mais perto de sair) e as medalhas embaixo, numa folha só por
 * cima da Sede. Vem num pedaço à parte (o CSS do Perfil só baixa quando abre).
 */
export default function MetasSheet({ onClose, style }: { onClose: () => void; style?: CSSProperties }) {
    const { t, d } = useT();
    const view = useSaveView();
    const near = useMemo(() => closestMissions(view, 6), [view]);
    const updateProfile = useGame((s) => s.updateProfile);
    return (
        <Sheet open onClose={onClose} title={t('home.amb.sedeMetas')} className="pf pf-sheet sd-metas" style={style}>
            <h3 className="bc-lbl">{d.profile.tabs.missoes}</h3>
            <MissionSummary />
            <ul className="pf-near">
                {near.map((g) => (
                    <li key={g.m.id}>
                        <span>{missionText(g.m)}</span>
                        <span className="pf-near-bar">
                            <span className="k-bar">
                                <i style={{ width: `${(g.n / g.goal) * 100}%` }} />
                            </span>
                            <b className="k-num">
                                {g.n}/{g.goal}
                            </b>
                        </span>
                    </li>
                ))}
            </ul>
            <h3 className="bc-lbl">{d.trophies.tabs.medalhas}</h3>
            <MedalsTab save={updateProfile} />
        </Sheet>
    );
}
