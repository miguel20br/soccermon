import { type ReactNode, useRef, useState } from 'react';
import { cloudEnabled, deleteAccount, signOut, useCloud } from '../../cloud/cloud';
import { playCry, playSfx } from '../../game/audio';
import {
    DEFAULT_SETTINGS,
    migrateSave,
    type NamesOnField,
    type PersistedSave,
    type PlaybackSpeed,
    type ReduceMotion,
    SAVE_VERSION,
    useGame,
} from '../../store/game-store';
import { DEFAULT_PROFILE, EMPTY_CAREER } from '../../store/profile';
import { MenuHead } from '../components/MenuHead';
import { reduceMotionOn } from '../settings-sync';
import '../settings.css';

/** Uma escolha de botões lado a lado (o ativo fica amarelo). */
function Segmented<T extends string | number | boolean>({
    label,
    value,
    options,
    onPick,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onPick: (v: T) => void;
}) {
    return (
        <div className="segmented" title={label}>
            {options.map((o) => (
                <button
                    key={String(o.value)}
                    type="button"
                    aria-pressed={value === o.value}
                    className={`btn small${value === o.value ? ' active' : ''}`}
                    onClick={() => onPick(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** Linha de configuração: nome, explicação curta e o controle embaixo. */
function Row({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
    return (
        <div className="set-row">
            <div className="set-label">
                <b>{title}</b>
                {hint && <span>{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="panel set-group">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

/** Slider 0–100% que toca uma amostra ao soltar. */
function VolumeSlider({
    label,
    value,
    onChange,
    preview,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    preview: () => void;
}) {
    return (
        <div className="volume-row">
            <input
                aria-label={label}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                onMouseUp={preview}
                onTouchEnd={preview}
                onKeyUp={preview}
            />
            <b>{Math.round(value * 100)}%</b>
        </div>
    );
}

const SPEED_OPTIONS: { value: PlaybackSpeed; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' },
    { value: 'highlights', label: 'Lances' },
];
const NAMES_OPTIONS: { value: NamesOnField; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'mine', label: 'Só do meu time' },
    { value: 'none', label: 'Nenhum' },
];
const MOTION_OPTIONS: { value: ReduceMotion; label: string }[] = [
    { value: 'system', label: 'Seguir o aparelho' },
    { value: 'on', label: 'Ligado' },
    { value: 'off', label: 'Desligado' },
];
const onOff = (on: string, off: string) => [
    { value: true, label: on },
    { value: false, label: off },
];

export function Settings() {
    const { settings, updateSettings, go, setOnboarded } = useGame();
    const set = updateSettings;
    return (
        <div className="menu-screen settings-screen">
            <MenuHead title="Configurações" icon="settings" onBack={() => go('home')} />

            <Group title="Som">
                <Row title="Volume geral">
                    <VolumeSlider
                        label="Volume geral"
                        value={settings.volume}
                        onChange={(volume) => set({ volume })}
                        preview={() => playSfx('kick')}
                    />
                </Row>
                <Row title="Gritos" hint="Quando um Pokémon entra, marca ou evolui.">
                    <VolumeSlider
                        label="Volume dos gritos"
                        value={settings.criesVolume}
                        onChange={(criesVolume) => set({ criesVolume })}
                        preview={() => playCry(25, settings.cries)}
                    />
                </Row>
                <Row title="Efeitos" hint="Chutes, apito, golpes e menus.">
                    <VolumeSlider
                        label="Volume dos efeitos"
                        value={settings.sfxVolume}
                        onChange={(sfxVolume) => set({ sfxVolume })}
                        preview={() => playSfx('kick')}
                    />
                </Row>
                <Row title="Estilo dos gritos">
                    <Segmented
                        label="Estilo dos gritos"
                        value={settings.cries}
                        options={[
                            { value: 'legacy', label: 'Clássicos 8-bit (Gen 1)' },
                            { value: 'latest', label: 'Modernos' },
                        ]}
                        onPick={(cries) => {
                            set({ cries });
                            playCry(25, cries);
                        }}
                    />
                </Row>
            </Group>

            <Group title="Partida">
                <Row title="Velocidade inicial" hint="Também muda quando você troca a velocidade durante o jogo.">
                    <Segmented
                        label="Velocidade inicial"
                        value={settings.speed}
                        options={SPEED_OPTIONS}
                        onPick={(speed) => set({ speed })}
                    />
                </Row>
                <Row title="Efeitos cinematográficos" hint="Holofote e câmera lenta nos golpes, gols e defesas.">
                    <Segmented
                        label="Efeitos cinematográficos"
                        value={settings.cinematic}
                        options={onOff('Ligados', 'Desligados (jogo corrido)')}
                        onPick={(cinematic) => set({ cinematic })}
                    />
                </Row>
                <Row title="Nomes na quadra">
                    <Segmented
                        label="Nomes na quadra"
                        value={settings.namesOnField}
                        options={NAMES_OPTIONS}
                        onPick={(namesOnField) => set({ namesOnField })}
                    />
                </Row>
                <Row title="Confirmar antes de sair" hint="Pergunta antes de largar uma partida no meio.">
                    <Segmented
                        label="Confirmar antes de sair da partida"
                        value={settings.confirmLeave}
                        options={onOff('Ligado', 'Desligado')}
                        onPick={(confirmLeave) => set({ confirmLeave })}
                    />
                </Row>
            </Group>

            <Group title="Acessibilidade">
                <Row
                    title="Reduzir movimento"
                    hint={
                        settings.reduceMotion === 'system'
                            ? `Menos tremida, flash e zoom. Seu aparelho: ${reduceMotionOn('system') ? 'reduzido' : 'normal'}.`
                            : 'Menos tremida, flash e zoom.'
                    }
                >
                    <Segmented
                        label="Reduzir movimento"
                        value={settings.reduceMotion}
                        options={MOTION_OPTIONS}
                        onPick={(reduceMotion) => set({ reduceMotion })}
                    />
                </Row>
            </Group>

            <Group title="Ajuda">
                <Row title="Dicas nas telas" hint="Lembretes curtos de como jogar.">
                    <Segmented
                        label="Dicas nas telas"
                        value={settings.tips}
                        options={onOff('Ligadas', 'Desligadas')}
                        onPick={(tips) => set({ tips })}
                    />
                </Row>
                <Row title="Boas-vindas">
                    <div>
                        <button
                            type="button"
                            className="btn small"
                            onClick={() => {
                                setOnboarded(false);
                                go('home');
                            }}
                        >
                            Ver o passo a passo de novo
                        </button>
                    </div>
                </Row>
            </Group>

            <DataSettings />
            <AccountSettings />
            <p className="muted center">
                <a href="privacidade.html" target="_blank" rel="noopener">
                    Privacidade e termos
                </a>
            </p>
        </div>
    );
}

// ------------------------------------------------------------------ seus dados

interface BackupFile {
    app: 'soccermon';
    version: number;
    exportedAt: string;
    save: PersistedSave;
}

function currentSave(): PersistedSave {
    const { run, settings, records, profile, dex, moves, career, onboarded } = useGame.getState();
    return { run, settings, records, profile, dex, moves, career, onboarded };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Data local no formato AAAA-MM-DD (nome do arquivo). */
function today() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function downloadBackup() {
    const file: BackupFile = {
        app: 'soccermon',
        version: SAVE_VERSION,
        exportedAt: new Date().toISOString(),
        save: currentSave(),
    };
    const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soccermon-save-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lê e confere um backup. Lança Error com a mensagem para o jogador. */
function parseBackup(text: string): { save: PersistedSave; exportedAt: string | null } {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Esse arquivo não é um backup do Soccermon.');
    }
    if (!isObj(data) || data.app !== 'soccermon' || !isObj(data.save) || typeof data.version !== 'number') {
        throw new Error('Esse arquivo não é um backup do Soccermon.');
    }
    if (data.version > SAVE_VERSION) {
        throw new Error('Esse backup é de uma versão mais nova do jogo. Recarregue a página e tente de novo.');
    }
    const raw = data.save as Partial<PersistedSave>;
    // copa em andamento com formato estranho: melhor descartar só ela do que travar o jogo
    const run = raw.run;
    const runOk =
        run == null ||
        (isObj(run) &&
            [run.picks, run.lineup, run.bench, run.opponents, run.results].every(Array.isArray) &&
            typeof run.seed === 'string');
    const clean: Partial<PersistedSave> = {
        ...raw,
        run: runOk ? raw.run : null,
        settings: isObj(raw.settings) ? raw.settings : undefined,
        records: isObj(raw.records) ? raw.records : undefined,
        profile: isObj(raw.profile) ? raw.profile : undefined,
        dex: isObj(raw.dex) ? raw.dex : undefined,
        moves: isObj(raw.moves) ? raw.moves : undefined,
        career: isObj(raw.career) ? raw.career : undefined,
    } as Partial<PersistedSave>;
    return {
        save: migrateSave(clean, data.version),
        exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null,
    };
}

const dateLabel = (iso: string | null) => {
    const d = iso ? new Date(iso) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : null;
};

function DataSettings() {
    const user = useCloud((s) => s.user);
    const stats = useGame((s) => s.settings.stats);
    const updateSettings = useGame((s) => s.updateSettings);
    const fileRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<{ save: PersistedSave; exportedAt: string | null } | null>(null);
    const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
    const [wipe, setWipe] = useState<'idle' | 'confirm' | 'busy'>('idle');

    const pickFile = async (file: File | undefined) => {
        if (!file) return;
        setMsg(null);
        setWipe('idle');
        try {
            setPending(parseBackup(await file.text()));
        } catch (e) {
            setPending(null);
            setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Não deu para ler o arquivo.' });
        }
    };

    const restore = () => {
        if (!pending) return;
        useGame.setState({ ...pending.save, match: null });
        setPending(null);
        setMsg({ tone: 'ok', text: 'Backup restaurado.' });
    };

    const wipeDevice = async () => {
        setWipe('busy');
        setMsg(null);
        // logado, o save sobe para a nuvem a cada mudança: sai da conta antes (subindo o que falta),
        // senão o save vazio apagaria o da nuvem
        if (useCloud.getState().user) {
            try {
                await signOut();
            } catch {
                // conferido logo abaixo
            }
            if (useCloud.getState().user) {
                setWipe('idle');
                setMsg({ tone: 'error', text: 'Não deu para sair da conta agora. Tente de novo.' });
                return;
            }
        }
        useGame.setState({
            run: null,
            match: null,
            settings: DEFAULT_SETTINGS,
            records: { cups: 0, titles: 0, perfect: 0 },
            profile: DEFAULT_PROFILE,
            dex: {},
            moves: {},
            career: EMPTY_CAREER,
            onboarded: false,
            screen: 'home',
        });
    };

    const summary = pending?.save;
    const seen = summary ? Object.keys(summary.dex).length : 0;

    return (
        <Group title="Seus dados">
            <Row
                title="Estatísticas anônimas"
                hint={
                    <>
                        Conta visitas e partidas sem conta, sem cookie e sem saber quem é você. Ajuda a melhorar o jogo.{' '}
                        <a href="privacidade.html" target="_blank" rel="noopener">
                            Detalhes
                        </a>
                    </>
                }
            >
                <Segmented
                    label="Estatísticas anônimas"
                    value={stats}
                    options={onOff('Ligadas', 'Desligadas')}
                    onPick={(v) => updateSettings({ stats: v })}
                />
            </Row>
            <Row title="Backup" hint="Um arquivo com todo o seu progresso, para guardar ou levar a outro aparelho.">
                <div className="set-actions">
                    <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                            downloadBackup();
                            setMsg({ tone: 'ok', text: 'Backup baixado.' });
                        }}
                    >
                        <DataIcon kind="down" />
                        Baixar backup
                    </button>
                    <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
                        <DataIcon kind="up" />
                        Restaurar backup
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".json,application/json"
                        hidden
                        onChange={(e) => {
                            void pickFile(e.target.files?.[0]);
                            e.target.value = '';
                        }}
                    />
                </div>
            </Row>

            {summary && (
                <div className="set-confirm" role="alert">
                    <b>Restaurar este backup?</b>
                    <span>
                        {dateLabel(pending.exportedAt) ? `Salvo em ${dateLabel(pending.exportedAt)}. ` : ''}
                        Copas {summary.records.cups}, títulos {summary.records.titles}, Pokédex {seen} vistos
                        {summary.run ? ', com uma copa em andamento' : ''}.
                    </span>
                    <span>
                        Ele substitui o progresso deste aparelho.
                        {user ? ' Como você está conectado, ele também vai para a sua conta na nuvem.' : ''}
                    </span>
                    <div className="set-actions">
                        <button type="button" className="btn small primary" onClick={restore}>
                            Restaurar
                        </button>
                        <button type="button" className="btn small ghost" onClick={() => setPending(null)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <Row
                title="Apagar dados deste aparelho"
                hint="Volta o jogo ao zero aqui. Baixe um backup antes, se quiser."
            >
                {wipe === 'idle' ? (
                    <div>
                        <button
                            type="button"
                            className="btn small ghost danger"
                            onClick={() => {
                                setPending(null);
                                setMsg(null);
                                setWipe('confirm');
                            }}
                        >
                            Apagar dados deste aparelho
                        </button>
                    </div>
                ) : (
                    <div className="set-confirm danger" role="alert">
                        <b>Apagar tudo deste aparelho?</b>
                        <span>Copa em andamento, recordes, Pokédex, perfil e configurações. Não dá para desfazer.</span>
                        {user && (
                            <span>
                                Você também sai da conta aqui. O save na nuvem não é apagado: entre de novo com o Google
                                para trazê-lo de volta.
                            </span>
                        )}
                        <div className="set-actions">
                            <button
                                type="button"
                                className="btn small primary"
                                disabled={wipe === 'busy'}
                                onClick={() => void wipeDevice()}
                            >
                                {wipe === 'busy' ? 'Apagando…' : 'Sim, apagar'}
                            </button>
                            <button
                                type="button"
                                className="btn small ghost"
                                disabled={wipe === 'busy'}
                                onClick={() => setWipe('idle')}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </Row>

            {msg && (
                <p className={msg.tone === 'error' ? 'error-text' : 'set-ok'} role="status">
                    {msg.text}
                </p>
            )}
        </Group>
    );
}

/** Setinha para baixo (baixar) ou para cima (restaurar) sobre uma bandeja. */
function DataIcon({ kind }: { kind: 'down' | 'up' }) {
    return (
        <svg className="set-icon" viewBox="0 0 16 16" aria-hidden>
            <path
                d={kind === 'down' ? 'M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5' : 'M8 10 V2 M4.5 5.5 L8 2 L11.5 5.5'}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2.5 11 V13.5 H13.5 V11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ------------------------------------------------------------------ conta

/** Conta Google: apagar tudo da nuvem (LGPD). Só aparece logado. */
function AccountSettings() {
    const user = useCloud((s) => s.user);
    const [step, setStep] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'error'>('idle');
    if (!cloudEnabled || (!user && step !== 'done')) return null;
    const remove = () => {
        setStep('busy');
        deleteAccount().then(
            () => setStep('done'),
            () => setStep('error'),
        );
    };
    return (
        <section className="panel setting-card">
            <h2>Conta</h2>
            {step === 'done' ? (
                <p>Conta apagada. Seu progresso continua só neste aparelho, como visitante.</p>
            ) : (
                <>
                    <p>
                        Conectado como <b>{user?.name}</b>. Apagar a conta remove o login, o perfil e o save da nuvem de
                        vez. O jogo neste aparelho continua, como visitante.
                    </p>
                    {step === 'confirm' || step === 'busy' ? (
                        <div className="row">
                            <button type="button" className="btn primary" disabled={step === 'busy'} onClick={remove}>
                                {step === 'busy' ? 'Apagando…' : 'Sim, apagar minha conta'}
                            </button>
                            <button
                                type="button"
                                className="btn ghost"
                                disabled={step === 'busy'}
                                onClick={() => setStep('idle')}
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <div className="row">
                            <button type="button" className="btn ghost small" onClick={() => setStep('confirm')}>
                                Apagar minha conta
                            </button>
                            {step === 'error' && (
                                <span className="error-text">Não deu para apagar agora. Tente de novo.</span>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
