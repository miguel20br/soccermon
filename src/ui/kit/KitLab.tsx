import { useMemo, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { type MatchResult, runMatch } from '../../engine/runners/batch-runner';
import { TopBar, useCountUp } from '../ambientes/TopBar';
import { CountUp } from '../components/CountUp';
import { FinalCard } from '../components/FinalCard';
import { FutCard } from '../components/FutCard';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import '../ambientes/ambientes.css';
import './kit-lab.css';
import { Beat, Cascade, useCascade } from './Cascade';
import { InfoSheet, OptionTile, SheetRow, Stepper } from './controls';
import { MomentStage, Walkout } from './MomentStage';
import { MomentWipe, randomArt, WIPE_ART, type WipeArt } from './MomentWipe';
import { Stage } from './Stage';

/** A cascata de exemplo (o fim de partida): placar, ₽ contando, craque e o próximo rival. */
function CascadeDemo() {
    const c = useCascade([0, 450, 450, 500]);
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar pula a festa (demo)
        <div className="kl-cascade" onClick={c.skip}>
            <Beat on={c.step > 0}>
                <b className="cb-num kl-score">5 x 3</b>
            </Beat>
            <Beat on={c.step > 1}>
                <span className="kl-gain">
                    +₽
                    <CountUp from={0} to={c.step > 1 ? 14 : 0} skip={c.skipped} />
                </span>
            </Beat>
            <Beat on={c.step > 2}>
                <span className="k-seal">
                    <HudIcon kind="max" /> Craque: Mewtwo
                </span>
            </Beat>
            <Beat on={c.step > 3}>
                <span className="muted">Próximo: Quartas · Cerulean</span>
            </Beat>
        </div>
    );
}

const FORMS = [
    { value: '2-2', label: 'Quadrado (2-2)' },
    { value: '1-2-1', label: 'Losango (1-2-1)' },
    { value: '3-1', label: 'Muralha (3-1)' },
    { value: '2-1-1', label: 'Y (2-1-1)' },
];
const VOLS = Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: `${i * 10}%` }));

/** Um botão de cada função, do jeito que as telas usam (`.btn` + modificador). */
const ROLES: { cls: string; name: string; use: string; label: string; icon?: HudIconKind }[] = [
    { cls: 'primary', name: 'Dourado', use: 'joga (o gordo da tela)', label: 'Jogar', icon: 'play' },
    { cls: 'confirm', name: 'Verde', use: 'segue, confirma (o gordo da tela)', label: 'Seguir', icon: 'next' },
    {
        cls: '',
        name: 'Azul',
        use: 'secundário, sempre baixo (sortear, compartilhar, Monta pra mim)',
        label: 'Sortear',
        icon: 'reroll',
    },
    {
        cls: 'danger',
        name: 'Vermelho',
        use: 'perigo e fechar, dentro da confirmação',
        label: 'Abandonar',
        icon: 'close',
    },
    { cls: 'ghost', name: 'Terciário', use: 'pular, cancelar, voltar', label: 'Pular' },
    {
        cls: 'ghost danger',
        name: 'Terciário de perigo',
        use: 'o gatilho que abre a confirmação',
        label: 'Apagar dados',
    },
];

function Num({ n, of, size }: { n: number; of?: number; size: number }) {
    return (
        <b className="cb-num" style={{ fontSize: size }}>
            {useCountUp(n)}
            {of ? <small className="kl-of">/{of}</small> : null}
        </b>
    );
}

/**
 * Galeria do kit (?lab=kit, só no dev e nas prévias): os botões por função e seus estados, o chip de lista, o painel com
 * a placa, número com contorno e a barra de topo. A hierarquia é a variante B aprovada em 26/10 (um gordo por tela).
 */
export function KitLab({ onExit }: { onExit: () => void }) {
    const [sel, setSel] = useState(1);
    const [run, setRun] = useState(0);
    const [wipe, setWipe] = useState<WipeArt | null>(null);
    const [walk, setWalk] = useState(false);
    const [pick, setPick] = useState<number | null>(null);
    const [pickOpen, setPickOpen] = useState(false);
    const [casc, setCasc] = useState(0);
    const [form, setForm] = useState('1-2-1');
    const [vol, setVol] = useState(60);
    const [opt, setOpt] = useState(0);
    const [duel, setDuel] = useState<MatchResult | null>(null);
    // fim do Duelo visto do visitante: uma partida de verdade, sem quadra (o craque sai dela)
    const playDuel = () => {
        const rng = new Rng('kit', 'duelo');
        const team = (name: string, ids: number[], color: number) => ({
            name,
            lineup: ids.map((id) => createInstance(id, rng)),
            bench: [],
            tactic: 'balanced' as const,
            color,
        });
        const home = team('Sala do Ash', [143, 68, 151, 132, 150], 0xe94b4b);
        const away = team('Sala do Gary', [9, 3, 6, 25, 65], 0x3b82f6);
        setDuel(runMatch(FUTSAL_5, home, away, 'kit-duelo', { snapshots: false }));
    };
    const cards = useMemo(() => {
        const rng = new Rng('kit', 'lab');
        return [149, 6, 94].map((id) => createInstance(id, rng));
    }, []);
    return (
        <div className="kl">
            <header className="kl-head bc-screenhead">
                <span className="bc-tag">Laboratório</span>
                <h1>Kit do jogo</h1>
                <button type="button" className="btn small ghost" onClick={onExit}>
                    <HudIcon kind="prev" /> Sair
                </button>
            </header>

            <section className="panel" id="transicao">
                <h2>Transição de momento</h2>
                <p className="muted">
                    Linha na diagonal revela o papel de parede com o logo; ele sai da direita pra esquerda. Cada vez um
                    desenho (ou o do momento: bola pra entrar em quadra, troféu pro título). Só pra momento.
                </p>
                <div className="kl-btns">
                    <button type="button" className="btn" onClick={() => setWipe(randomArt())}>
                        <HudIcon kind="dice" /> Sorteado
                    </button>
                    {(Object.keys(WIPE_ART) as WipeArt[]).map((a) => (
                        <button key={a} type="button" className="btn small ghost" onClick={() => setWipe(a)}>
                            {a}
                        </button>
                    ))}
                </div>
                {wipe && <MomentWipe key={wipe} art={wipe} onDone={() => setWipe(null)} />}
            </section>

            <section className="panel" id="momento">
                <h2>Momento e walkout</h2>
                <p className="muted">
                    Overlay de tela cheia com o fundo da marca e os raios. Walkout em 3 batidas (tipo, posição,
                    insígnia) só pra ouro 75+ e edição; toque adianta, Pular vai pro fim.
                </p>
                <div className="kl-btns">
                    <button type="button" className="btn" onClick={() => setWalk(true)}>
                        <HudIcon kind="play" /> Walkout (Dragonite)
                    </button>
                    <button type="button" className="btn" onClick={() => setPickOpen(true)}>
                        <HudIcon kind="cards" /> Escolha 1 de 3
                    </button>
                    <button type="button" className="btn" onClick={playDuel}>
                        <HudIcon kind="max" /> Fim do Duelo (visitante)
                    </button>
                </div>
                {duel && (
                    <FinalCard
                        score={duel.score}
                        shootout={duel.shootout ?? null}
                        names={['Sala do Ash', 'Sala do Gary']}
                        colors={[0xe94b4b, 0x3b82f6]}
                        liga={false}
                        duel={{ side: 1, match: duel, label: 'Ver resultado' }}
                        onGo={() => setDuel(null)}
                    />
                )}
                {walk && <Walkout inst={cards[0]} onDone={() => setWalk(false)} />}
                {pickOpen && (
                    <MomentStage label="Escolha 1 de 3" onSkip={() => setPickOpen(false)}>
                        <h2 className="k-moment-title">Escolha 1</h2>
                        <div className="k-pick3">
                            {cards.map((c, i) => (
                                <FutCard
                                    key={c.uid}
                                    inst={c}
                                    selected={pick === i}
                                    action={{ label: 'Escolher', primary: true, onClick: () => setPick(i) }}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn confirm big"
                            disabled={pick === null}
                            onClick={() => setPickOpen(false)}
                        >
                            Confirmar
                        </button>
                    </MomentStage>
                )}
            </section>

            <section className="panel" id="cascata">
                <h2>Cascata</h2>
                <p className="muted">
                    Batidas de 250–600 ms, cada uma com som e pop; o total cabe em 3,5 s e um toque pula pro fim.
                </p>
                <CascadeDemo key={casc} />
                <Cascade gaps={[0, 300, 300]} key={`c${casc}`} className="kl-cascade-row">
                    <span className="k-seal">Primeiro título!</span>
                    <span className="k-seal k-seal-dark">Copa em 1 min</span>
                    <span className="k-seal">Copa perfeita</span>
                </Cascade>
                <button type="button" className="btn small" onClick={() => setCasc((n) => n + 1)}>
                    <HudIcon kind="reroll" /> De novo
                </button>
            </section>

            <section className="panel" id="palco">
                <h2>Palco</h2>
                <p className="muted">Tela que não rola: cena atrás, um bloco no meio, a ação gorda no polegar.</p>
                <div className="kl-stage-box">
                    <Stage
                        scene={<div className="kl-stage-scene" />}
                        action={
                            <button type="button" className="btn confirm">
                                Seguir <HudIcon kind="next" />
                            </button>
                        }
                    >
                        <div className="k-pick3">
                            {cards.map((c) => (
                                <FutCard key={c.uid} inst={c} size="sm" />
                            ))}
                        </div>
                    </Stage>
                </div>
            </section>

            <section className="panel" id="controles">
                <h2>Controles de jogo</h2>
                <div className="kl-controls">
                    <span className="muted">Formação</span>
                    <Stepper label="Formação" value={form} options={FORMS} onChange={setForm} wrap />
                    <span className="muted">Volume</span>
                    <Stepper label="Volume" value={vol} options={VOLS} onChange={setVol} />
                </div>
                <div className="kl-options">
                    {(
                        [
                            ['team', 'Meu time'],
                            ['cards', 'Disputa'],
                            ['chest', 'Pacotes'],
                        ] as const
                    ).map(([icon, label], i) => (
                        <OptionTile
                            key={label}
                            icon={icon}
                            label={label}
                            selected={opt === i}
                            onClick={() => setOpt(i)}
                        />
                    ))}
                </div>
                <div className="kl-controls">
                    <span>Critério do gol da copa</span>
                    <InfoSheet title="Gol da copa">
                        <p>Golpe no chute (+3), distância do gol (+1 a cada 4 m) e gol na final (+2).</p>
                    </InfoSheet>
                </div>
                <SheetRow icon="lock" label="Bloqueados" hint="45" title="Bloqueados">
                    <p>O que antes era um acordeão na página abre aqui, numa Sheet.</p>
                </SheetRow>
            </section>

            <section className="panel">
                <h2>O JOGAR</h2>
                <button type="button" className="btn cb cb-gold kl-play">
                    <i className="cb-shine" aria-hidden />
                    <b className="kl-play-verb">Jogar</b>
                    <small>Copa Relâmpago · 4 jogos</small>
                </button>
                <p className="muted">
                    Dourado, o maior da tela, com o brilho passando a cada 4 s. Cada tela tem um botão gordo só: dourado
                    se joga, verde se segue. Contorno no texto só de 16 px pra cima.
                </p>
            </section>

            <section className="panel">
                <h2>Cor por função</h2>
                <div className="kl-roles">
                    {ROLES.map((r) => (
                        <div key={r.name} className="kl-role">
                            <div className="kl-btns">
                                <button type="button" className={`btn big ${r.cls}`}>
                                    {r.icon && <HudIcon kind={r.icon} />}
                                    {r.label}
                                </button>
                                <button type="button" className={`btn ${r.cls}`}>
                                    {r.label}
                                </button>
                                <button type="button" className={`btn small ${r.cls}`}>
                                    {r.label}
                                </button>
                            </div>
                            <p>
                                <b>{r.name}</b> <code>.btn{r.cls ? `.${r.cls.replace(' ', '.')}` : ''}</code>
                                <br />
                                <span className="muted">{r.use}</span>
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="panel">
                <h2>Ação de lista</h2>
                <div className="kl-chips">
                    <button type="button" className="btn small confirm k-chip">
                        Comprar · ₽4
                    </button>
                    <button type="button" className="btn small k-chip">
                        Ver carta
                    </button>
                    <button type="button" className="btn small confirm k-chip" disabled>
                        Faltam ₽3
                    </button>
                </div>
                <p className="muted">
                    Comprar, Escalar, Escolher, Ensinar: o chip baixo preso na borda de baixo da carta ou do item.
                </p>
            </section>

            <section className="panel">
                <h2>Estados</h2>
                <div className="kl-states">
                    <figure>
                        <button type="button" className="btn confirm">
                            Normal
                        </button>
                        <figcaption>normal: afunda e quica no toque</figcaption>
                    </figure>
                    <figure>
                        <div className="kl-pick">
                            {[0, 1, 2].map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`btn small${sel === i ? ' active' : ''}`}
                                    aria-pressed={sel === i}
                                    onClick={() => setSel(i)}
                                >
                                    {['4x', '8x', '16x'][i]}
                                </button>
                            ))}
                        </div>
                        <figcaption>selecionado: anel dourado</figcaption>
                    </figure>
                    <figure>
                        <div className="bc-seg">
                            {['2-2', '1-2-1', '3-1'].map((f, i) => (
                                <button key={f} type="button" aria-pressed={sel === i} onClick={() => setSel(i)}>
                                    {f}
                                </button>
                            ))}
                        </div>
                        <figcaption>escolhido no seletor: azul</figcaption>
                    </figure>
                    <figure>
                        <button type="button" className="btn confirm" disabled>
                            Comprar · ₽7
                        </button>
                        <p className="btn-why">Faltam ₽3</p>
                        <figcaption>desabilitado: sem cor, sem base, diz o porquê</figcaption>
                    </figure>
                </div>
            </section>

            <section className="panel">
                <h2>Painel e peça</h2>
                <div className="kl-base">
                    <div className="panel kl-info">
                        <b>Painel</b>
                        <span className="muted">
                            Borda fina e sem sombra; o título é texto simples. Dentro de outro painel, fica solto.
                        </span>
                    </div>
                    <button type="button" className="bc-tile">
                        <HudIcon kind="cup" />
                        <span>
                            <b>Peça clicável</b>
                            <small>Afunda no toque</small>
                        </span>
                    </button>
                </div>
            </section>

            <section className="panel" key={run}>
                <h2>Número com contorno</h2>
                <div className="kl-nums">
                    <figure>
                        <Num n={24} size={30} />
                        <figcaption>₽ do Mercado</figcaption>
                    </figure>
                    <figure>
                        <Num n={121} of={151} size={24} />
                        <figcaption>Pokédex</figcaption>
                    </figure>
                    <figure>
                        <Num n={7} size={24} />
                        <figcaption>taças</figcaption>
                    </figure>
                    <figure>
                        <Num n={5} size={45} />
                        <figcaption>placar</figcaption>
                    </figure>
                </div>
                <button type="button" className="btn small" onClick={() => setRun((r) => r + 1)}>
                    <HudIcon kind="reroll" /> Contar de novo
                </button>
            </section>

            <section className="panel">
                <h2>Barra de topo</h2>
                <div className="kl-topbar">
                    <TopBar />
                </div>
                <p className="muted">
                    Nível do treinador pelas missões cumpridas (degraus de 1, 2, 2, 3, 3… missões), taças e Pokédex.
                </p>
            </section>
        </div>
    );
}
