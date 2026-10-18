import { type FormEvent, useMemo, useState } from 'react';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    isGoldTrainer,
    MISSION_GROUPS,
    MISSIONS,
    type Mission,
    missionCount,
    missionOfTrainer,
    type SaveView,
    TRAINERS,
    type TrainerId,
    trainerSrc,
    unlockedTrainers,
} from '../../store/missions';
import type { Profile } from '../../store/profile';
import { redeemCode, titleClass } from '../../store/title-codes';
import { BadgeCase } from '../components/BadgeCase';
import { missionText, speciesGif, titleName, trainerName } from './club';
import { CheckIcon, LockIcon, MedalIcon } from './icons';

/** O save do jeito que as missões leem (para as barras de progresso). */
function useSaveView(): SaveView {
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
            className={`trainer-sprite${locked ? ' locked' : isGoldTrainer(id) ? ' trainer-gold' : ''} ${className}`}
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
    const { t } = useT();
    const unlocked = unlockedTrainers(profile);
    const current = activeTrainer(profile);
    const view = useSaveView();
    const titles = earnedTitles(profile);
    const title = activeTitle(profile);

    const [code, setCode] = useState('');
    const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (busy || !code.trim()) return;
        setBusy(true);
        const id = await redeemCode(code).catch(() => null);
        setBusy(false);
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
                                    </button>
                                </li>
                            );
                        return (
                            <li key={id} className="pf-trainer locked">
                                <TrainerSprite id={id} locked />
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
                <div className="pf-titles">
                    {titles.map((id) => (
                        <button
                            type="button"
                            key={id}
                            aria-pressed={id === title}
                            className={`pf-chip pf-title-chip${id === title ? ' active' : ''}`}
                            onClick={() => save({ title: id })}
                        >
                            <span className={titleClass(id).trim() || undefined}>{titleName(id)}</span>
                        </button>
                    ))}
                </div>
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
                <span
                    className="pf-mission-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={m.goal}
                    aria-valuenow={n}
                    aria-label={t('profile.missions.progressAria', { n, goal: m.goal })}
                >
                    <i style={{ width: `${(n / m.goal) * 100}%` }} />
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

/** Missões: todas, por grupo, com o prêmio (treinador e/ou título), a barra das de contador e o visto. */
export function MissionsTab() {
    const view = useSaveView();
    const { t, d } = useT();
    const done = MISSIONS.filter((m) => view.done.has(m.id)).length;
    return (
        <div className="pf-missions">
            <BadgeCase earned={[...view.done]} />
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
            {MISSION_GROUPS.map((g) => (
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
