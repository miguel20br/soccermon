import { type ReactNode, useRef, useState } from 'react';
import { cloudEnabled, deleteAccount, signOut, useCloud } from '../../cloud/cloud';
import { playCrowd, playCry, playSfx } from '../../game/audio';
import { getLang, type Lang, t as tr } from '../../i18n';
import { htmlLang } from '../../i18n/lang';
import { rich, useLang, useT } from '../../i18n/react';
import {
    type ArrowSize,
    type ChanceSpeed,
    DEFAULT_SETTINGS,
    migrateSave,
    type NamesOnField,
    type PersistedSave,
    type PlaybackSpeed,
    type ReduceMotion,
    SAVE_VERSION,
    savePart,
    useGame,
} from '../../store/game-store';
import { DEFAULT_PROFILE, EMPTY_CAREER, seenCount } from '../../store/profile';
import { AboutFooter } from '../components/AboutFooter';
import { AccountBar } from '../components/AccountBar';
import { MenuHead } from '../components/MenuHead';
import { leaveWith } from '../feedback';
import { privacyUrl } from '../links';
import { reduceMotionOn } from '../settings-sync';
import '../settings.css';
import { HudIcon } from '../components/MatchHud';
import { readHud } from '../hud-lab';
import { iosBrowser, promptInstall, useInstall } from '../install';
import { ConfirmSheet, Sheet } from '../kit/Sheet';

/** Seletor segmentado do kit da transmissão (o ativo fica amarelo). */
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
        <div className="bc-seg segmented" title={label}>
            {options.map((o) => (
                <button
                    key={String(o.value)}
                    type="button"
                    aria-pressed={value === o.value}
                    className={value === o.value ? 'on' : undefined}
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

/** "Jogar como app": o botão de instalar (Android) ou a dica do iPhone; some quando já está instalado. */
function InstallGroup() {
    const { prompt, installed } = useInstall();
    const { t } = useT();
    if (installed || (!prompt && !iosBrowser())) return null;
    return (
        <Group title={t('settings.install.title')}>
            <Row
                title={t('settings.install.title')}
                hint={prompt ? t('settings.install.hint') : t('settings.install.ios')}
            >
                {prompt && (
                    <button type="button" className="btn confirm" onClick={() => void promptInstall()}>
                        <HudIcon kind="download" />
                        {t('settings.install.btn')}
                    </button>
                )}
            </Row>
        </Group>
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
                aria-valuetext={`${Math.round(value * 100)}%`}
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

type T = ReturnType<typeof useT>['t'];
const speedOptions = (t: T): { value: PlaybackSpeed; label: string }[] => [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' },
    { value: 'highlights', label: t('settings.screen.highlights') },
];
const chanceOptions = (t: T): { value: ChanceSpeed; label: string }[] => [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 0, label: t('settings.screen.chanceOff') },
];
const arrowOptions = (t: T): { value: ArrowSize; label: string }[] => [
    { value: 'small', label: t('settings.screen.arrowSmall') },
    { value: 'medium', label: t('settings.screen.arrowMedium') },
    { value: 'large', label: t('settings.screen.arrowLarge') },
];
const namesOptions = (t: T): { value: NamesOnField; label: string }[] => [
    { value: 'all', label: t('settings.screen.namesAll') },
    { value: 'mine', label: t('settings.screen.namesMine') },
    { value: 'none', label: t('settings.screen.namesNone') },
];
const motionOptions = (t: T): { value: ReduceMotion; label: string }[] => [
    { value: 'system', label: t('settings.screen.motionSystem') },
    { value: 'on', label: t('settings.screen.on') },
    { value: 'off', label: t('settings.screen.off') },
];
const onOff = (on: string, off: string) => [
    { value: true, label: on },
    { value: false, label: off },
];

export function Settings() {
    const { settings, updateSettings, go } = useGame();
    const [more, setMore] = useState(false);
    const [hudOn] = useState(readHud);
    // a quadra grande só liga no celular (o WIDE da Prancheta; importar ela puxaria o motor pra cá)
    const [wide] = useState(() => window.matchMedia('(min-width: 1051px)').matches);
    const set = updateSettings;
    const { t } = useT();
    const lang = useLang();
    return (
        <div className="menu-screen settings-screen">
            <MenuHead title={t('settings.screen.title')} icon="settings" onBack={() => go('home')} />
            {/* entrar com o Google (na Home de lista ficava embaixo dos modos) */}
            <AccountBar />
            <InstallGroup />

            <Group title={t('settings.screen.langLabel')}>
                <div className="set-row">
                    <Segmented<Lang>
                        label={t('settings.screen.langLabel')}
                        value={lang}
                        options={[
                            { value: 'pt', label: t('settings.screen.langPt') },
                            { value: 'en', label: t('settings.screen.langEn') },
                        ]}
                        onPick={(l) => set({ lang: l })}
                    />
                </div>
            </Group>

            <Group title={t('settings.screen.sound')}>
                <Row title={t('settings.screen.volume')}>
                    <VolumeSlider
                        label={t('settings.screen.volume')}
                        value={settings.volume}
                        onChange={(volume) => set({ volume })}
                        preview={() => playSfx('kick')}
                    />
                </Row>
                <Row title={t('settings.screen.cries')} hint={t('settings.screen.criesHint')}>
                    <VolumeSlider
                        label={t('settings.screen.criesVolume')}
                        value={settings.criesVolume}
                        onChange={(criesVolume) => set({ criesVolume })}
                        preview={() => playCry(25, settings.cries)}
                    />
                </Row>
            </Group>

            <Group title={t('settings.screen.match')}>
                <Row title={t('settings.screen.speed')} hint={t('settings.screen.speedHint')}>
                    <Segmented
                        label={t('settings.screen.speed')}
                        value={settings.speed}
                        options={speedOptions(t)}
                        onPick={(speed) => set({ speed })}
                    />
                </Row>
                {/* partida nova (padrão; ?lab=hud-off desliga): até que velocidade a câmera fica de perto */}
                {hudOn && !wide && (
                    <Row title={t('settings.screen.camFollow')} hint={t('settings.screen.camFollowHint')}>
                        <Segmented
                            label={t('settings.screen.camFollow')}
                            value={settings.camFollow ?? 2}
                            options={[
                                { value: 1, label: '1x' },
                                { value: 2, label: '2x' },
                                { value: 4, label: '4x' },
                                { value: 8, label: '8x' },
                                { value: 0, label: t('settings.screen.camNever') },
                            ]}
                            onPick={(camFollow) => set({ camFollow })}
                        />
                    </Row>
                )}
            </Group>

            <Group title={t('settings.screen.accessibility')}>
                <Row
                    title={t('settings.screen.motion')}
                    hint={
                        settings.reduceMotion === 'system'
                            ? t('settings.screen.motionHintSystem', {
                                  state: t(
                                      reduceMotionOn('system')
                                          ? 'settings.screen.motionReduced'
                                          : 'settings.screen.motionNormal',
                                  ),
                              })
                            : t('settings.screen.motionHint')
                    }
                >
                    <Segmented
                        label={t('settings.screen.motion')}
                        value={settings.reduceMotion}
                        options={motionOptions(t)}
                        onPick={(reduceMotion) => set({ reduceMotion })}
                    />
                </Row>
            </Group>

            <Group title={t('settings.screen.help')}>
                <Row title={t('settings.screen.tips')} hint={t('settings.screen.tipsHint')}>
                    <Segmented
                        label={t('settings.screen.tips')}
                        value={settings.tips}
                        options={onOff(t('settings.screen.onPl'), t('settings.screen.offPl'))}
                        onPick={(tips) => set({ tips })}
                    />
                </Row>
            </Group>

            {/* o que pouca gente muda fica fechado (revisão de design, item 15): à vista só o essencial */}
            <button
                type="button"
                className="btn ghost set-more-toggle"
                aria-expanded={more}
                aria-controls="set-more"
                onClick={() => setMore(!more)}
            >
                <HudIcon kind={more ? 'up' : 'down'} />
                {t('settings.screen.more')}
            </button>
            {more && (
                <div id="set-more" className="set-more" data-exit="collapse">
                    <Group title={t('settings.screen.sound')}>
                        <Row title={t('settings.screen.sfx')} hint={t('settings.screen.sfxHint')}>
                            <VolumeSlider
                                label={t('settings.screen.sfxVolume')}
                                value={settings.sfxVolume}
                                onChange={(sfxVolume) => set({ sfxVolume })}
                                preview={() => playSfx('kick')}
                            />
                        </Row>
                        <Row title={t('settings.screen.crowd')} hint={t('settings.screen.crowdHint')}>
                            <VolumeSlider
                                label={t('settings.screen.crowdVolume')}
                                value={settings.crowdVolume}
                                onChange={(crowdVolume) => set({ crowdVolume })}
                                preview={() => playCrowd('gol')}
                            />
                        </Row>
                        <Row title={t('settings.screen.music')} hint={t('settings.screen.musicHint')}>
                            <VolumeSlider
                                label={t('settings.screen.musicVolume')}
                                value={settings.musicVolume ?? DEFAULT_SETTINGS.musicVolume}
                                onChange={(musicVolume) => set({ musicVolume })}
                                preview={() => undefined}
                            />
                        </Row>
                        <Row title={t('settings.screen.goalCry')} hint={t('settings.screen.goalCryHint')}>
                            <Segmented
                                label={t('settings.screen.goalCry')}
                                value={settings.goalCry}
                                options={onOff(t('settings.screen.on'), t('settings.screen.off'))}
                                onPick={(goalCry) => set({ goalCry })}
                            />
                        </Row>
                        <Row title={t('settings.screen.packBeat')} hint={t('settings.screen.packBeatHint')}>
                            <Segmented
                                label={t('settings.screen.packBeat')}
                                value={!!settings.packOnBeat}
                                options={onOff(t('settings.screen.on'), t('settings.screen.off'))}
                                onPick={(packOnBeat) => set({ packOnBeat })}
                            />
                        </Row>
                        <Row title={t('settings.screen.criesStyle')}>
                            <Segmented
                                label={t('settings.screen.criesStyle')}
                                value={settings.cries}
                                options={[
                                    { value: 'legacy', label: t('settings.screen.criesLegacy') },
                                    { value: 'latest', label: t('settings.screen.criesLatest') },
                                ]}
                                onPick={(cries) => {
                                    set({ cries, criesChosen: true });
                                    playCry(25, cries);
                                }}
                            />
                        </Row>
                    </Group>
                    <Group title={t('settings.screen.match')}>
                        <Row title={t('settings.screen.cinematic')} hint={t('settings.screen.cinematicHint')}>
                            <Segmented
                                label={t('settings.screen.cinematic')}
                                value={settings.cinematic}
                                options={onOff(t('settings.screen.cinematicOn'), t('settings.screen.cinematicOff'))}
                                onPick={(cinematic) => set({ cinematic })}
                            />
                        </Row>
                        <Row title={t('settings.screen.chance')} hint={t('settings.screen.chanceHint')}>
                            <Segmented
                                label={t('settings.screen.chance')}
                                value={settings.chanceSpeed}
                                options={chanceOptions(t)}
                                onPick={(chanceSpeed) => set({ chanceSpeed })}
                            />
                        </Row>
                        <Row title={t('settings.screen.names')}>
                            <Segmented
                                label={t('settings.screen.names')}
                                value={settings.namesOnField}
                                options={namesOptions(t)}
                                onPick={(namesOnField) => set({ namesOnField })}
                            />
                        </Row>
                        <Row title={t('settings.screen.arrow')} hint={t('settings.screen.arrowHint')}>
                            <Segmented
                                label={t('settings.screen.arrow')}
                                value={settings.arrowSize}
                                options={arrowOptions(t)}
                                onPick={(arrowSize) => set({ arrowSize })}
                            />
                        </Row>
                        <Row title={t('settings.screen.confirmLeave')} hint={t('settings.screen.confirmLeaveHint')}>
                            <Segmented
                                label={t('settings.screen.confirmLeaveLabel')}
                                value={settings.confirmLeave}
                                options={onOff(t('settings.screen.on'), t('settings.screen.off'))}
                                onPick={(confirmLeave) => set({ confirmLeave })}
                            />
                        </Row>
                        <Row title={t('settings.screen.haptics')} hint={t('settings.screen.hapticsHint')}>
                            <Segmented
                                label={t('settings.screen.haptics')}
                                value={settings.haptics !== false}
                                options={onOff(t('settings.screen.hapticsOn'), t('settings.screen.hapticsOff'))}
                                onPick={(haptics) => set({ haptics })}
                            />
                        </Row>
                    </Group>
                </div>
            )}

            <DataSettings />
            <AccountSettings />
            {/* a Home de ambientes não tem rodapé: Ajuda, Créditos e o aviso de direitos moram aqui (Novidades no canto de cima) */}
            <AboutFooter lang={false} />
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
    return savePart(useGame.getState());
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
        throw new Error(tr('settings.data.notBackup'));
    }
    if (!isObj(data) || data.app !== 'soccermon' || !isObj(data.save) || typeof data.version !== 'number') {
        throw new Error(tr('settings.data.notBackup'));
    }
    if (data.version > SAVE_VERSION) {
        throw new Error(tr('settings.data.newer'));
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
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(htmlLang(getLang())) : null;
};

function DataSettings() {
    const user = useCloud((s) => s.user);
    const stats = useGame((s) => s.settings.stats);
    const updateSettings = useGame((s) => s.updateSettings);
    const fileRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState<{ save: PersistedSave; exportedAt: string | null } | null>(null);
    const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
    const [wipe, setWipe] = useState<'idle' | 'confirm' | 'busy'>('idle');
    const { t } = useT();

    const pickFile = async (file: File | undefined) => {
        if (!file) return;
        setMsg(null);
        setWipe('idle');
        try {
            setPending(parseBackup(await file.text()));
        } catch (e) {
            setPending(null);
            setMsg({ tone: 'error', text: e instanceof Error ? e.message : t('settings.data.unreadable') });
        }
    };

    const restore = () => {
        if (!pending) return;
        useGame.setState({ ...pending.save, match: null });
        setPending(null);
        setMsg({ tone: 'ok', text: t('settings.data.restored') });
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
                setMsg({ tone: 'error', text: t('settings.data.signOutFailed') });
                return;
            }
        }
        // idioma e a recusa das estatísticas são escolhas da pessoa, não progresso: ficam
        const { lang, stats } = useGame.getState().settings;
        useGame.setState({
            run: null,
            match: null,
            settings: { ...DEFAULT_SETTINGS, lang, stats },
            records: { cups: 0, titles: 0, perfect: 0 },
            profile: { ...DEFAULT_PROFILE, seen: [] },
            dex: {},
            moves: {},
            career: EMPTY_CAREER,
            onboarded: false,
            parkedRuns: [],
            binder: [],
            screen: 'home',
        });
    };

    const summary = pending?.save;
    const seen = summary ? seenCount(summary.dex) : 0;

    return (
        <Group title={t('settings.data.title')}>
            <Row
                title={t('settings.data.stats')}
                hint={
                    <>
                        {t('settings.data.statsHint')}{' '}
                        <a href={privacyUrl()} target="_blank" rel="noopener">
                            {t('settings.data.details')}
                        </a>
                    </>
                }
            >
                <Segmented
                    label={t('settings.data.stats')}
                    value={stats}
                    options={onOff(t('settings.screen.onPl'), t('settings.screen.offPl'))}
                    onPick={(v) => updateSettings({ stats: v })}
                />
            </Row>
            <Row title={t('settings.data.backup')} hint={t('settings.data.backupHint')}>
                <div className="set-actions">
                    <button
                        type="button"
                        className="btn small"
                        onClick={() => {
                            downloadBackup();
                            setMsg({ tone: 'ok', text: t('settings.data.downloaded') });
                        }}
                    >
                        <HudIcon kind="download" className="set-icon" />
                        {t('settings.data.download')}
                    </button>
                    <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
                        <HudIcon kind="upload" className="set-icon" />
                        {t('settings.data.restore')}
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

            {/* restaurar substitui o progresso: confirmação em sheet (verde: não é perigo, é uma troca escolhida) */}
            <Sheet
                open={!!summary}
                onClose={() => setPending(null)}
                title={t('settings.data.restoreTitle')}
                alert
                className="k-confirm"
            >
                {summary && (
                    <>
                        <p>
                            {dateLabel(pending.exportedAt)
                                ? t('settings.data.savedOn', { date: dateLabel(pending.exportedAt) ?? '' })
                                : ''}
                            {t('settings.data.summary', {
                                cups: summary.records.cups,
                                titles: summary.records.titles,
                                seen,
                            })}
                            {summary.run && !['eliminated', 'champion'].includes(summary.run.status)
                                ? t('settings.data.withRun')
                                : ''}
                            .
                        </p>
                        <p>
                            {t('settings.data.replaces')}
                            {user ? t('settings.data.replacesCloud') : ''}
                        </p>
                        <div className="k-confirm-actions">
                            <button type="button" className="btn ghost" onClick={() => setPending(null)} data-autofocus>
                                {t('common.ui.cancel')}
                            </button>
                            <button type="button" className="btn confirm" onClick={restore}>
                                {t('settings.data.restoreBtn')}
                            </button>
                        </div>
                    </>
                )}
            </Sheet>

            <Row title={t('settings.data.wipe')} hint={t('settings.data.wipeHint')}>
                <div>
                    <button
                        type="button"
                        className="btn small ghost danger"
                        disabled={wipe === 'busy'}
                        onClick={() => {
                            setPending(null);
                            setMsg(null);
                            setWipe('confirm');
                        }}
                    >
                        {wipe === 'busy' ? t('settings.data.wiping') : t('settings.data.wipe')}
                    </button>
                </div>
                <ConfirmSheet
                    open={wipe === 'confirm'}
                    onClose={() => setWipe((w) => (w === 'confirm' ? 'idle' : w))}
                    title={t('settings.data.wipeTitle')}
                    text={
                        user
                            ? `${t('settings.data.wipeWhat')} ${t('settings.data.wipeCloud')}`
                            : t('settings.data.wipeWhat')
                    }
                    confirm={t('settings.data.wipeYes')}
                    onConfirm={() => leaveWith('danger', () => void wipeDevice())}
                    quiet
                />
            </Row>

            {msg && (
                <p className={msg.tone === 'error' ? 'error-text' : 'set-ok'} role="status">
                    {msg.text}
                </p>
            )}
        </Group>
    );
}

// ------------------------------------------------------------------ conta

/** Conta Google: apagar tudo da nuvem (LGPD). Só aparece logado. */
function AccountSettings() {
    const user = useCloud((s) => s.user);
    const [step, setStep] = useState<'idle' | 'confirm' | 'busy' | 'done' | 'error'>('idle');
    const { t } = useT();
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
            <h2>{t('settings.account.title')}</h2>
            {step === 'done' ? (
                <p>{t('settings.account.deleted')}</p>
            ) : (
                <>
                    <p>{rich(t('settings.account.signedAs'), { name: <b>{user?.name}</b> })}</p>
                    <div className="row">
                        <button
                            type="button"
                            className="btn ghost small danger"
                            disabled={step === 'busy'}
                            onClick={() => setStep('confirm')}
                        >
                            {step === 'busy' ? t('settings.account.deleting') : t('settings.account.delete')}
                        </button>
                        {step === 'error' && <span className="error-text">{t('settings.account.deleteFailed')}</span>}
                    </div>
                    <ConfirmSheet
                        open={step === 'confirm'}
                        onClose={() => setStep((x) => (x === 'confirm' ? 'idle' : x))}
                        title={t('settings.account.deleteTitle')}
                        text={t('settings.account.deleteWhat')}
                        confirm={t('settings.account.deleteYes')}
                        onConfirm={remove}
                    />
                </>
            )}
        </section>
    );
}
