import { type FormEvent, useMemo, useState } from 'react';
import { species } from '../../engine/data';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    HOLO_TRAINERS,
    isGoldTrainer,
    isHoloTrainer,
    MISSION_GROUPS,
    MISSIONS,
    type Mission,
    missionCount,
    missionOfTrainer,
    PLATINUM,
    type Platinum,
    platinumItems,
    type SaveView,
    TITLE_IDS,
    TRAINERS,
    type TrainerId,
    trainerFx,
    trainerSrc,
    unlockedTrainers,
} from '../../store/missions';
import { newsKey } from '../../store/news';
import { markPlayed, type Profile } from '../../store/profile';
import { redeemCode, redeemDexCode, titleClass } from '../../store/title-codes';
import { missionOfTitle, missionText, speciesGif, titleHow, titleName, trainerHow, trainerName } from './club';
import { CheckIcon, LockIcon, MedalIcon } from './icons';
import { NewBadge } from './news';

/** O save do jeito que as missões leem (para as barras de progresso). */
export function useSaveView(): SaveView {
    const records = useGame((s) => s.records);
    const dex = useGame((s) => s.dex);
    const moves = useGame((s) => s.moves);
    const career = useGame((s) => s.career);
    const hall = useGame((s) => s.hall);
    const run = useGame((s) => s.run);
    const parked = useGame((s) => s.parkedRuns);
    const done = useGame((s) => s.profile.missionsDone);
    return useMemo(
        () => ({ records, dex, moves, career, hall, runs: [run, ...parked], done: new Set(done) }),
        [records, dex, moves, career, hall, run, parked, done],
    );
}

/** Sprite de treinador (pixel art; bloqueado = silhueta escura). */
export function TrainerSprite({ id, locked, className = '' }: { id: TrainerId; locked?: boolean; className?: string }) {
    return (
        <img
            className={`trainer-sprite${locked ? ' locked' : trainerFx(id)} ${className}`}
            src={trainerSrc(id)}
            alt=""
            draggable={false}
            loading="lazy"
        />
    );
}

/**
 * Seu treinador: a grade dos treinadores (bloqueados em silhueta: tocar mostra a missão), o título e o
 * resgate de código. Tudo salva na hora.
 */
export function TrainerCard({ save }: { save: (patch: Partial<Profile>) => void }) {
    const profile = useGame((s) => s.profile);
    const { t, d } = useT();
    const unlocked = unlockedTrainers(profile);
    const current = activeTrainer(profile);
    const view = useSaveView();
    const titles = earnedTitles(profile);
    const title = activeTitle(profile);
    const lockedTitles = TITLE_IDS.filter((id) => !titles.includes(id));

    const [code, setCode] = useState('');
    const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (busy || !code.trim()) return;
        setBusy(true);
        const id = await redeemCode(code).catch(() => null);
        const dexFix = id ? null : await redeemDexCode(code).catch(() => null);
        setBusy(false);
        if (dexFix) {
            useGame.setState((s) => ({ dex: markPlayed(s.dex, dexFix) }));
            setCode('');
            const names = dexFix.map((n) => species(n).name).join(', ');
            return setCodeMsg({ ok: true, text: t('profile.picker.codeDex', { names }) });
        }
        if (!id) return setCodeMsg({ ok: false, text: t('profile.picker.codeBad') });
        if (profile.redeemedTitles.includes(id))
            return setCodeMsg({ ok: false, text: t('profile.picker.codeHave', { title: titleName(id) }) });
        save({ redeemedTitles: [...profile.redeemedTitles, id], title: id });
        setCode('');
        setCodeMsg({ ok: true, text: t('profile.picker.codeOk', { title: titleName(id) }) });
    };

    return (
        <section className="panel pf-card">
            <fieldset className="pf-field">
                <legend>
                    {t('profile.picker.trainer')}{' '}
                    <span className="pf-count">
                        {t('profile.picker.trainerCount', { n: unlocked.length, total: TRAINERS.length })}
                    </span>
                </legend>
                <ul className="pf-trainers">
                    {/* liberados primeiro (grade compacta), depois os bloqueados com a missão */}
                    {[...unlocked, ...TRAINERS.filter((id) => !unlocked.includes(id))].map((id) => {
                        const open = unlocked.includes(id);
                        const on = open && id === current;
                        const mission = missionOfTrainer(id);
                        if (open)
                            return (
                                <li key={id}>
                                    <button
                                        type="button"
                                        aria-pressed={on}
                                        className={`pf-trainer${on ? ' active' : ''}`}
                                        onClick={() => save({ trainer: id })}
                                    >
                                        <TrainerSprite id={id} />
                                        <b>{trainerName(id)}</b>
                                        <small className="pf-how">{trainerHow(id)}</small>
                                        <NewBadge k={newsKey.trainer(id)} className="corner" />
                                    </button>
                                </li>
                            );
                        // dourado bloqueado: silhueta com brilho de ouro e o selo, pra dar gosto de caçar (holo: o da platina)
                        const holo = isHoloTrainer(id);
                        const gold = holo || isGoldTrainer(id);
                        return (
                            <li key={id} className={`pf-trainer locked${gold ? ' gold' : ''}${holo ? ' holo' : ''}`}>
                                {gold && (
                                    <span className="pf-gold-seal">
                                        {holo ? d.profile.missions.groups.platina : t('profile.picker.legendary')}
                                    </span>
                                )}
                                <TrainerSprite id={id} locked className={gold ? 'locked-gold' : ''} />
                                <b>
                                    <LockIcon /> {trainerName(id)}
                                </b>
                                {mission && <MissionHow m={mission} view={view} />}
                            </li>
                        );
                    })}
                </ul>
                <small className="muted">{t('profile.picker.trainerHelp')}</small>
            </fieldset>

            <fieldset className="pf-field">
                <legend>{t('profile.picker.title')}</legend>
                <ul className="pf-titles">
                    {titles.map((id) => (
                        <li key={id}>
                            <button
                                type="button"
                                aria-pressed={id === title}
                                className={`pf-chip pf-title-chip${id === title ? ' active' : ''}`}
                                onClick={() => save({ title: id })}
                            >
                                <span className={titleClass(id).trim() || undefined}>{titleName(id)}</span>
                                <small className="pf-how">{titleHow(id)}</small>
                                <NewBadge k={newsKey.title(id)} className="corner" />
                            </button>
                        </li>
                    ))}
                </ul>
                {lockedTitles.length > 0 && (
                    <details className="pf-titles-locked">
                        <summary>{t('profile.picker.lockedTitles', { n: lockedTitles.length })}</summary>
                        <ul className="pf-titles">
                            {lockedTitles.map((id) => {
                                const m = missionOfTitle(id);
                                return (
                                    <li key={id} className="pf-chip pf-title-chip locked">
                                        <span>
                                            <LockIcon /> {titleName(id)}
                                        </span>
                                        {m && <MissionHow m={m} view={view} />}
                                    </li>
                                );
                            })}
                        </ul>
                    </details>
                )}
                <small className="muted">{t('profile.picker.titleHelp')}</small>
            </fieldset>

            <form className="pf-field" onSubmit={submit}>
                <label htmlFor="pf-code">
                    <span>{t('profile.picker.code')}</span>
                </label>
                <div className="pf-row">
                    <input
                        id="pf-code"
                        className="pf-input"
                        value={code}
                        maxLength={40}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        placeholder={t('profile.picker.codePlaceholder')}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setCodeMsg(null);
                        }}
                    />
                    <button type="submit" className="btn" disabled={busy || !code.trim()}>
                        {t('profile.picker.codeSubmit')}
                    </button>
                </div>
                {codeMsg && (
                    <small className={codeMsg.ok ? 'pf-code-ok' : 'pf-code-bad'} role="status">
                        {codeMsg.text}
                    </small>
                )}
            </form>
        </section>
    );
}

/** Como cumprir: o texto da missão e, se for de contador, a barra (x/meta). */
function MissionHow({ m, view }: { m: Mission; view: SaveView }) {
    const { t } = useT();
    const n = m.goal && !view.done.has(m.id) ? missionCount(m, view) : null;
    return (
        <>
            <span className="pf-mission-text">{missionText(m)}</span>
            {n !== null && m.goal && (
                // o número fica ao lado da barra (por cima do amarelo ele sumia)
                <span
                    className="pf-mission-progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={m.goal}
                    aria-valuenow={n}
                    aria-label={t('profile.missions.progressAria', { n, goal: m.goal })}
                >
                    <span className="pf-mission-bar">
                        <i style={{ width: `${(n / m.goal) * 100}%` }} />
                    </span>
                    <small>
                        {n}/{m.goal}
                    </small>
                </span>
            )}
        </>
    );
}

function MissionRow({ m, view }: { m: Mission; view: SaveView }) {
    const { t } = useT();
    const done = view.done.has(m.id);
    return (
        <li className={`pf-mission${done ? ' done' : ''}`}>
            <div className="pf-mission-art" aria-hidden>
                {m.trainer ? <TrainerSprite id={m.trainer} locked={!done} /> : <MedalIcon />}
            </div>
            <div className="pf-mission-body">
                <MissionHow m={m} view={view} />
                {m.species && (
                    <ul className="pf-collection" aria-hidden>
                        {m.species.map((id) => (
                            <li key={id}>
                                <img
                                    className={`pixel${(view.dex[id]?.matches ?? 0) > 0 ? '' : ' pf-silhouette'}`}
                                    src={speciesGif(id)}
                                    alt=""
                                    loading="lazy"
                                    draggable={false}
                                />
                            </li>
                        ))}
                    </ul>
                )}
                <span className="pf-mission-reward">
                    {m.trainer && (
                        <span>
                            {t('profile.missions.rewardTrainer')}: <b>{trainerName(m.trainer)}</b>
                        </span>
                    )}
                    {m.title && (
                        <span>
                            {t('profile.missions.rewardTitle')}: <b>{titleName(m.title)}</b>
                        </span>
                    )}
                </span>
            </div>
            {done && (
                <span className="pf-mission-done" title={t('profile.missions.done')}>
                    <CheckIcon />
                    <span className="pf-sr">{t('profile.missions.done')}</span>
                </span>
            )}
        </li>
    );
}

/** Platina da geração: a lista do que falta para 100%, com a barra de cada item e o total (ex.: 4/6). */
function PlatinumBlock({ p, view }: { p: Platinum; view: SaveView }) {
    const { t, d } = useT();
    const items = platinumItems(p, view);
    const full = items.filter((i) => i.n >= i.goal).length;
    const trainer = HOLO_TRAINERS[p.gen];
    const done = view.done.has(p.mission);
    return (
        <section className={`panel pf-card pf-platinum${done ? ' done' : ''}`}>
            <header className="pf-platinum-head">
                <TrainerSprite id={trainer} locked={!done} className={done ? '' : 'locked-gold'} />
                <div>
                    <h2>
                        {t('profile.missions.platinum.title', { gen: p.gen })}{' '}
                        <span className="pf-count">
                            {full}/{items.length}
                        </span>
                    </h2>
                    <small className="muted">
                        {t('profile.missions.platinum.help', {
                            trainer: trainerName(trainer),
                            title: titleName(p.title),
                        })}
                    </small>
                </div>
            </header>
            <ul className="pf-mission-list">
                {items.map((i) => (
                    <li key={i.id} className={`pf-mission pf-platinum-item${i.n >= i.goal ? ' done' : ''}`}>
                        <div className="pf-mission-body">
                            <span className="pf-mission-text">{d.profile.missions.platinum.items[i.id]}</span>
                            <span
                                className="pf-mission-progress"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={i.goal}
                                aria-valuenow={Math.min(i.n, i.goal)}
                                aria-label={t('profile.missions.progressAria', { n: i.n, goal: i.goal })}
                            >
                                <span className="pf-mission-bar">
                                    <i style={{ width: `${Math.min(1, i.n / i.goal) * 100}%` }} />
                                </span>
                                <small>
                                    {i.n}/{i.goal}
                                </small>
                            </span>
                        </div>
                        {i.n >= i.goal && (
                            <span className="pf-mission-done" title={t('profile.missions.done')}>
                                <CheckIcon />
                                <span className="pf-sr">{t('profile.missions.done')}</span>
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** Missões: todas, por grupo, com o prêmio (treinador e/ou título), a barra das de contador e o visto. */
export function MissionsTab() {
    const view = useSaveView();
    const { t, d } = useT();
    const done = MISSIONS.filter((m) => view.done.has(m.id)).length;
    return (
        <div className="pf-missions">
            <div
                className="pf-mission-summary"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={MISSIONS.length}
                aria-valuenow={done}
            >
                <b>{t('profile.missions.summary', { done, total: MISSIONS.length })}</b>
                <span className="pf-mission-bar">
                    <i style={{ width: `${(done / MISSIONS.length) * 100}%` }} />
                </span>
            </div>
            {PLATINUM.map((p) => (
                <PlatinumBlock key={p.gen} p={p} view={view} />
            ))}
            {MISSION_GROUPS.filter((g) => g !== 'platina').map((g) => (
                <section key={g} className="panel pf-card">
                    <h2>{d.profile.missions.groups[g]}</h2>
                    {g === 'colecoes' && <small className="muted">{t('profile.missions.collectionHelp')}</small>}
                    <ul className="pf-mission-list">
                        {MISSIONS.filter((m) => m.group === g).map((m) => (
                            <MissionRow key={m.id} m={m} view={view} />
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
