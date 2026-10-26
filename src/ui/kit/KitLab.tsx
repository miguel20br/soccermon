import { useState } from 'react';
import { TopBar, useCountUp } from '../ambientes/TopBar';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import '../ambientes/ambientes.css';
import './kit-lab.css';

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
    return (
        <div className="kl">
            <header className="kl-head bc-screenhead">
                <span className="bc-tag">Laboratório</span>
                <h1>Kit do jogo</h1>
                <button type="button" className="btn small ghost" onClick={onExit}>
                    <HudIcon kind="prev" /> Sair
                </button>
            </header>

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
                        <span className="muted">Moldura dupla grossa e base dura; o título vai na placa, em cima.</span>
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
