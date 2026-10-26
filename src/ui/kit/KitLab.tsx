import { useState } from 'react';
import { TopBar, useCountUp } from '../ambientes/TopBar';
import { HudIcon, type HudIconKind } from '../components/MatchHud';
import '../ambientes/ambientes.css';
import './kit-lab.css';

/** Um botão de cada função, do jeito que as telas usam (`.btn` + modificador). */
const ROLES: { cls: string; name: string; use: string; label: string; icon?: HudIconKind }[] = [
    { cls: 'primary', name: 'Dourado', use: 'joga (um por tela)', label: 'Jogar', icon: 'play' },
    { cls: 'confirm', name: 'Verde', use: 'confirma, compra, segue, escolhe', label: 'Comprar · ₽4', icon: 'check' },
    {
        cls: '',
        name: 'Azul',
        use: 'secundário (sortear, compartilhar, ir a um lugar)',
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
 * Galeria do kit (?lab=kit, só no dev e nas prévias): os 5 botões por função e seus estados, painel chapado contra
 * peça clicável (base escura = dá pra tocar), número com contorno e a barra de topo. Pra aprovar antes de espalhar.
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
                <p className="muted">Dourado, o maior da tela, com o brilho passando a cada 4 s. Um por tela.</p>
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
                        <button type="button" className="btn confirm" disabled>
                            Comprar · ₽7
                        </button>
                        <p className="btn-why">Faltam ₽3</p>
                        <figcaption>desabilitado: sem cor, sem base, diz o porquê</figcaption>
                    </figure>
                </div>
            </section>

            <section className="panel">
                <h2>Base escura = dá pra tocar</h2>
                <div className="kl-base">
                    <div className="panel kl-info">
                        <b>Painel de informação</b>
                        <span className="muted">Moldura dupla, chapado: sem base, não é botão.</span>
                    </div>
                    <button type="button" className="bc-tile">
                        <HudIcon kind="cup" />
                        <span>
                            <b>Peça clicável</b>
                            <small>Tem base escura: dá pra tocar</small>
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
