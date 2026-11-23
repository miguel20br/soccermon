import { useState } from 'react';
import { useGame } from '../../store/game-store';
import { MISSIONS } from '../../store/missions';
import type { Profile } from '../../store/profile';
import { CODE_TITLES, EVENT_TITLES, titleClass } from '../../store/title-codes';
import { MenuHead } from '../components/MenuHead';
import { titleName } from './club';
import { TitlePicker } from './TrainerTab';
import './profile.css';
import './armario.css';

/** Os três visuais, um título de cada. */
const LOOKS = ['goat', 'criador', 'natal2026'];
/** O gelo de perto: nos tamanhos da Galmuri e em 3 fundos (escuro, claro, cor de clube). */
const SIZES = [15, 30, 45];
const BACKS = [
    { id: 'escuro', bg: 'var(--panel-2)' },
    { id: 'claro', bg: '#f4f1e6' },
    { id: 'clube', bg: '#c8102e' },
];
const BACK = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 24,
    padding: '18px 16px',
    borderRadius: 8,
} as const;

/**
 * Galeria dos títulos (`?lab=titulos`, só dev e prévia; perfil-revamp.md §4.3): o gelo do "Natal 2026" de perto e o
 * seletor com tudo ganho de mentira (num perfil só desta tela: o save não muda). O Miguel aprova o gelo aqui.
 */
export function TitleLab({ onExit }: { onExit: () => void }) {
    const real = useGame((s) => s.profile);
    const [fake, setFake] = useState<Profile>(() => ({
        ...real,
        missionsDone: MISSIONS.map((m) => m.id),
        redeemedTitles: [...new Set([...Object.values(CODE_TITLES), ...EVENT_TITLES])],
        title: 'natal2026',
    }));
    return (
        <div className="menu-screen pf">
            <MenuHead title="Títulos · galeria" hud="crown" onBack={onExit} />
            <section className="panel tl-ice">
                <h2 className="bc-caption">Gelo de perto (Natal 2026)</h2>
                <div style={{ display: 'grid', gap: 8 }}>
                    {BACKS.map((b) => (
                        <div key={b.id} style={{ ...BACK, background: b.bg }}>
                            {SIZES.map((px) => (
                                <span key={px} style={{ fontSize: px }}>
                                    <span className="title-ice">{titleName('natal2026')}</span>
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </section>
            <section className="panel">
                <h2 className="bc-caption">Os três visuais (vivo e parado)</h2>
                <ul style={{ display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
                    {LOOKS.map((id) => (
                        <li key={id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                            <span className="pf-chip">
                                <span className={titleClass(id).trim()}>{titleName(id)}</span>
                            </span>
                            <span className="pf-tgrid">
                                <span className="pf-tcell">
                                    <span className={titleClass(id).trim()}>{titleName(id)}</span>
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
            <section className="panel">
                <h2 className="bc-caption">Seletor com tudo ganho</h2>
                <TitlePicker profile={fake} save={(p) => setFake((f) => ({ ...f, ...p }))} />
            </section>
        </div>
    );
}
