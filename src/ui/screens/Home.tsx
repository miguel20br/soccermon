import { useEffect, useState } from 'react';
import { CUP_STAGES } from '../../engine/cup';
import { weeklyEventType } from '../../engine/specials';
import { seedFromUrl, useGame } from '../../store/game-store';
import { AccountBar } from '../components/AccountBar';
import { HomeCourt } from '../components/HomeCourt';
import { MenuIcon } from '../components/MenuIcon';
import { cardSprite } from '../components/PokeCard';
import { Trophy } from '../components/Trophy';
import { TypeIcon } from '../components/TypeIcon';
import { PATCH_NOTES } from '../patch-notes';
import { TYPE_PT } from '../type-colors';

/** O que vem por aí (só vitrine: nada disso é clicável ainda). */
const SOON = [
    { title: 'Modo história', text: 'Ginásios, insígnias e a Liga Índigo', img: 'assets/cards/25.gif' },
    { title: 'Multiplayer', text: 'Desafie o time de um amigo', img: 'assets/cards/68.gif' },
    { title: 'Futebol de campo', text: 'Partidas 11 contra 11', img: 'assets/cards/143.gif' },
    { title: 'Geração 2', text: 'Os Pokémon de Johto', img: 'assets/ui/poke-ball.png' },
];

export function Home() {
    const { run, newRun, go, records } = useGame();
    const [teamName, setTeamName] = useState('Pallet FC');
    const [notesOpen, setNotesOpen] = useState(false);
    useEffect(() => {
        if (!notesOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNotesOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [notesOpen]);
    const challengeSeed = seedFromUrl();
    const inProgress = run && !['eliminated', 'champion'].includes(run.status);
    const resumeScreen =
        run && ['formation', 'captain', 'drafting'].includes(run.status)
            ? 'draft'
            : run?.status === 'reward'
              ? 'reward'
              : 'lineup';
    const name = () => teamName.trim() || 'Pallet FC';
    /** Começar outra copa apaga a atual: com uma em andamento, pede confirmação antes. */
    const [confirm, setConfirm] = useState<string | null | undefined>(undefined);
    const start = (seed?: string) => {
        if (inProgress && confirm === undefined) setConfirm(seed ?? null);
        else newRun(name(), seed);
    };
    const eventType = weeklyEventType(new Date());
    const byUid = new Map(run?.picks.map((p) => [p.uid, p]) ?? []);
    const squad = run ? run.lineup.flatMap((u) => byUid.get(u) ?? []) : [];
    const runStep =
        run && ['formation', 'captain', 'drafting'].includes(run.status)
            ? `Draft · escolha ${Math.min(run.draftRound + 1, 7)} de 7`
            : run?.status === 'reward'
              ? 'Escolhendo a recompensa'
              : run
                ? CUP_STAGES[run.stage]
                : '';
    const openLab = (q: string) => {
        window.location.search = q;
    };

    return (
        <div className="home">
            <div className="home-top">
                <div className="event-banner">
                    <TypeIcon type={eventType} size={28} />
                    <div>
                        <b>Semana do tipo {TYPE_PT[eventType] ?? eventType}</b>
                        <span>Cartas Evento do tipo {TYPE_PT[eventType] ?? eventType} podem aparecer no draft.</span>
                    </div>
                </div>
                <AccountBar />
            </div>

            <section className="home-hero">
                <HomeCourt />
                <h1 className="logo">SOCCERMON</h1>
                <p className="tagline">
                    Monte seu time com os 151 de Kanto num draft “escolha 1 de 3” e dispute a Copa de Futsal contra os
                    ginásios.
                </p>
            </section>

            <div className="menu panel">
                {confirm !== undefined ? (
                    <div className="confirm-new">
                        <p>
                            Começar outra copa apaga a do <b>{run?.teamName}</b>. Tem certeza?
                        </p>
                        <div className="row" style={{ justifyContent: 'center' }}>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={() => newRun(name(), confirm ?? undefined)}
                            >
                                Sim, começar outra
                            </button>
                            <button type="button" className="btn ghost" onClick={() => setConfirm(undefined)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {inProgress && run && (
                            <button type="button" className="resume-card" onClick={() => go(resumeScreen)}>
                                <span className="rc-label">Copa em andamento</span>
                                <b className="rc-team">{run.teamName}</b>
                                <span className="rc-step">{runStep}</span>
                                <span className="rc-path" title="Fases da copa">
                                    {CUP_STAGES.map((st, i) => {
                                        const r = run.results.find((x) => x.stage === i);
                                        const cls = r ? (r.won ? 'won' : 'lost') : i === run.stage ? 'now' : '';
                                        return <i key={st} className={cls} />;
                                    })}
                                </span>
                                {squad.length > 0 && (
                                    <span className="rc-squad">
                                        {squad.map((p) => (
                                            <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                                        ))}
                                    </span>
                                )}
                                <span className="btn primary rc-go">Continuar ▶</span>
                            </button>
                        )}
                        <label className="muted" htmlFor="team-name">
                            {inProgress ? 'Ou comece outra copa' : 'Nome do seu time'}
                        </label>
                        <div className="new-run">
                            <input
                                id="team-name"
                                className="team-name-input"
                                value={teamName}
                                maxLength={22}
                                onChange={(e) => setTeamName(e.target.value)}
                            />
                            <button
                                type="button"
                                className={`btn ${inProgress ? 'ghost' : 'primary'} big`}
                                onClick={() => start()}
                            >
                                Nova copa
                            </button>
                        </div>
                        {challengeSeed && (
                            <button type="button" className="btn yellow" onClick={() => start(challengeSeed)}>
                                Aceitar desafio ({challengeSeed})
                            </button>
                        )}
                    </>
                )}
            </div>

            {records.cups > 0 && (
                <div className="records">
                    <span className="rec-titles">
                        <Trophy size={30} />
                        <b>{records.titles}</b> {records.titles === 1 ? 'título' : 'títulos'}
                    </span>
                    <span>
                        <b>{records.cups}</b> {records.cups === 1 ? 'copa' : 'copas'}
                    </span>
                    <span>
                        <b>{records.perfect}</b> {records.perfect === 1 ? 'perfeita' : 'perfeitas'}
                    </span>
                    {(records.destaques ?? 0) > 0 && (
                        <span>
                            <b>{records.destaques}</b> {records.destaques === 1 ? 'destaque' : 'destaques'}
                        </span>
                    )}
                    {(records.evolucoes ?? 0) > 0 && (
                        <span>
                            <b>{records.evolucoes}</b> {records.evolucoes === 1 ? 'evolução' : 'evoluções'}
                        </span>
                    )}
                    {(records.icones ?? 0) > 0 && (
                        <span>
                            <b>{records.icones}</b> {records.icones === 1 ? 'ícone' : 'ícones'}
                        </span>
                    )}
                </div>
            )}

            <nav className="home-tiles" aria-label="Menu">
                <button type="button" className="home-tile" onClick={() => openLab('?lab=golpes')}>
                    <MenuIcon kind="moves" />
                    <b>Golpes</b>
                    <span>A animação de todos os 164</span>
                </button>
                <button type="button" className="home-tile" onClick={() => setNotesOpen(true)}>
                    <MenuIcon kind="news" />
                    <b>Novidades</b>
                    <span>O que mudou na versão {PATCH_NOTES[0].version}</span>
                    <em className="tile-badge">v{PATCH_NOTES[0].version}</em>
                </button>
                <button type="button" className="home-tile" onClick={() => go('settings')}>
                    <MenuIcon kind="settings" />
                    <b>Configurações</b>
                    <span>Som, gritos e efeitos</span>
                </button>
                <button type="button" className="home-tile" onClick={() => go('credits')}>
                    <MenuIcon kind="credits" />
                    <b>Créditos</b>
                    <span>Sprites, sons e dados</span>
                </button>
                {import.meta.env.DEV && (
                    <button type="button" className="home-tile dev" onClick={() => openLab('?cards=1')}>
                        <MenuIcon kind="cards" />
                        <b>Cartas (teste)</b>
                        <span>Galeria de desenvolvimento</span>
                    </button>
                )}
            </nav>
            {notesOpen && (
                // biome-ignore lint/a11y/noStaticElementInteractions: clicar fora fecha; o botão fecha pelo teclado
                <div className="modal-backdrop" onClick={() => setNotesOpen(false)} role="presentation">
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: só impede que o clique dentro feche */}
                    <div
                        className="modal panel patch-notes"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Novidades"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setNotesOpen(false)}
                            aria-label="Fechar"
                            // biome-ignore lint/a11y/noAutofocus: o foco vai para dentro da janela que acabou de abrir
                            autoFocus
                        >
                            ×
                        </button>
                        {PATCH_NOTES.map((n) => (
                            <div key={n.version} className="patch-version">
                                <h2>
                                    Versão {n.version} · {n.title}
                                </h2>
                                {n.sections.map((sec) => (
                                    <div key={sec.title}>
                                        <h3>{sec.title}</h3>
                                        <ul>
                                            {sec.lines.map((l) => (
                                                <li key={l}>{l}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <section className="soon" aria-label="Em breve">
                <h2>Em breve</h2>
                <div className="soon-grid">
                    {SOON.map((c) => (
                        <div key={c.title} className="soon-card">
                            <img className="pixel" src={c.img} alt="" />
                            <b>{c.title}</b>
                            <span>{c.text}</span>
                        </div>
                    ))}
                </div>
            </section>
            <p className="disclaimer">
                Soccermon v{__APP_VERSION__.replace(/\.0$/, '')} · Criado por Miguel Cunha · Fan game sem fins
                lucrativos. Pokémon e todos os nomes, sprites e sons relacionados são © Nintendo, Game Freak, Creatures
                Inc. e The Pokémon Company. Este projeto não é afiliado nem endossado por eles. ·{' '}
                <a href="privacidade.html" target="_blank" rel="noopener">
                    Privacidade e termos
                </a>{' '}
                ·{' '}
                <a href="https://github.com/miguel20br/soccermon" target="_blank" rel="noopener">
                    Código no GitHub
                </a>
            </p>
        </div>
    );
}
