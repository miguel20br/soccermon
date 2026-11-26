import { type FormEvent, useMemo, useState } from 'react';
import { species } from '../../engine/data';
import { useT } from '../../i18n/react';
import { returnCard } from '../../store/binder';
import { lookOfProfile } from '../../store/club-kit';
import { useGame } from '../../store/game-store';
import {
    activeTitle,
    activeTrainer,
    earnedTitles,
    HOLO_TRAINERS,
    isGoldTrainer,
    isHoloTrainer,
    MISSIONS,
    type Mission,
    missionCount,
    missionExtra,
    missionOfTrainer,
    type Platinum,
    platinumItems,
    type SaveView,
    TRAINERS,
    type TrainerId,
    trainerFx,
    trainerSrc,
    unlockedTrainers,
    utView,
} from '../../store/missions';
import { newsKey } from '../../store/news';
import { markPlayed, type Profile } from '../../store/profile';
import { redeemCardCode, redeemCode, redeemDexCode, titleClass } from '../../store/title-codes';
import { HudIcon } from '../components/MatchHud';
import { Crest, kitBackground } from './Crest';
import {
    missionOfTitle,
    missionText,
    pickerTitles,
    titleHow,
    titleName,
    titleRarity,
    trainerHow,
    trainerName,
    useTrainerLabel,
} from './club';
import { CheckIcon, LockIcon } from './icons';
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
    const ultimate = useGame((s) => s.ultimate);
    return useMemo(
        () => ({
            records,
            dex,
            moves,
            career,
            hall,
            runs: [run, ...parked],
            done: new Set(done),
            ut: utView(ultimate),
        }),
        [records, dex, moves, career, hall, run, parked, done, ultimate],
    );
}

/**
 * O desenho do prêmio da missão: o treinador (sprite), o símbolo no seu escudo, o padrão na sua camisa, a ficha, a
 * carta ou, com título, a coroa.
 */
export function MissionPrizeArt({ m }: { m: Mission }) {
    const look = lookOfProfile(useGame((s) => s.profile));
    if (m.trainer) return <TrainerSprite id={m.trainer} />;
    const x = m.title ? null : missionExtra(m.id);
    if (!x) return <HudIcon kind="crown" />;
    if (x.kind === 'crest') return <Crest look={{ ...look, symbol: x.id }} className="hud-icon prize-crest" />;
    if (x.kind === 'kit')
        return (
            <span
                className="prize-kit"
                aria-hidden
                style={{ background: kitBackground(look.color, look.color2, x.id, '18%') }}
            />
        );
    return <HudIcon kind={x.kind === 'fichas' ? 'coin' : 'cards'} />;
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
 * Treinadores como figurinhas (cara-de-jogo.md, decisão 9): só o sprite e o nome; tocar mostra a ficha em cima
 * (como liberar, com a barra) e, se liberado, já escolhe. Tudo salva na hora.
 */
export function TrainerPicker({ save }: { save: (patch: Partial<Profile>) => void }) {
    const profile = useGame((s) => s.profile);
    const { t, d } = useT();
    const unlocked = unlockedTrainers(profile);
    const current = activeTrainer(profile);
    const view = useSaveView();
    const [pick, setPick] = useState<TrainerId>(current);
    const open = unlocked.includes(pick);
    const mission = missionOfTrainer(pick);
    const seal = (id: TrainerId) =>
        isHoloTrainer(id)
            ? d.profile.missions.groups.platina
            : isGoldTrainer(id)
              ? t('profile.picker.legendary')
              : null;
    return (
        <div className="pf-figs">
            <div className={`pf-fig-card${open ? '' : ' locked'}`} aria-live="polite">
                <TrainerSprite id={pick} locked={!open} key={pick} className="k-pop" />
                <div>
                    <b>
                        {!open && <LockIcon />} {trainerName(pick)}
                    </b>
                    {seal(pick) && <span className="pf-gold-seal">{seal(pick)}</span>}
                    {open ? (
                        <small className="pf-how">{trainerHow(pick)}</small>
                    ) : (
                        mission && <MissionHow m={mission} view={view} />
                    )}
                </div>
            </div>
            <ul className="pf-trainers pf-fig-grid">
                {/* liberados primeiro, depois os bloqueados em silhueta */}
                {[...unlocked, ...TRAINERS.filter((id) => !unlocked.includes(id))].map((id) => {
                    const free = unlocked.includes(id);
                    const holo = isHoloTrainer(id);
                    const gold = holo || isGoldTrainer(id);
                    const how = missionOfTrainer(id);
                    return (
                        <li key={id}>
                            <button
                                type="button"
                                aria-pressed={free ? id === current : undefined}
                                aria-label={
                                    free
                                        ? trainerName(id)
                                        : t('profile.picker.lockedAria', {
                                              name: trainerName(id),
                                              mission: how ? missionText(how) : '',
                                          })
                                }
                                className={`pf-trainer${free && id === current ? ' active' : ''}${free ? '' : ' locked'}${!free && gold ? ' gold' : ''}${!free && holo ? ' holo' : ''}${id === pick ? ' picked' : ''}`}
                                onClick={() => {
                                    setPick(id);
                                    if (free) save({ trainer: id });
                                }}
                            >
                                <TrainerSprite id={id} locked={!free} className={!free && gold ? 'locked-gold' : ''} />
                                <b>{trainerName(id)}</b>
                                {free && <NewBadge k={newsKey.trainer(id)} className="corner" />}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/** Tocar num título: o ganho vira o seu (salva na hora); o bloqueado não muda nada. */
export const pickTitle = (id: string, earned: readonly string[]): Pick<Profile, 'title'> | null =>
    earned.includes(id) ? { title: id } : null;

/**
 * Título embaixo do nome, no molde dos treinadores (perfil-revamp.md §4.2): a prévia do cartão em cima (o título com o
 * visual vivo, a raridade e como se ganha) e a grade por grupo embaixo, parada, os raros primeiro. Tocar num ganho já
 * salva; num bloqueado mostra a missão na prévia. `profile` troca o do save (galeria `?lab=titulos`).
 */
export function TitlePicker({ save, profile: fake }: { save: (patch: Partial<Profile>) => void; profile?: Profile }) {
    const real = useGame((s) => s.profile);
    const profile = fake ?? real;
    const { t, d } = useT();
    const view = useSaveView();
    const name = useTrainerLabel();
    const earned = earnedTitles(profile);
    const current = activeTitle(profile);
    const [pick, setPick] = useState(current);
    const open = earned.includes(pick);
    const mission = missionOfTitle(pick);
    const look = (id: string) => titleClass(id).trim() || undefined;
    return (
        <div className="pf-figs pf-tpick">
            <div className={`pf-fig-card pf-tprev${open ? '' : ' locked'}`} aria-live="polite">
                <TrainerSprite id={activeTrainer(profile)} />
                <div key={pick} className="pf-tprev-body">
                    <span className={`pf-trarity r-${titleRarity(pick)}`}>
                        {d.profile.picker.rarity[titleRarity(pick)]}
                        {open && pick === current && ` · ${t('profile.picker.using')}`}
                    </span>
                    <b className="pf-tprev-name">{name}</b>
                    <span className="pf-tprev-title">
                        {!open && <LockIcon />}
                        <span className={look(pick)}>{titleName(pick)}</span>
                    </span>
                    {!open && mission ? (
                        <MissionHow m={mission} view={view} />
                    ) : (
                        <small className="pf-how">{titleHow(pick)}</small>
                    )}
                </div>
            </div>
            {pickerTitles(earned).map((g) => (
                <section key={g.group} className="pf-tgroup">
                    <h3 className="bc-lbl">{d.profile.missions.groups[g.group]}</h3>
                    <ul className="pf-tgrid">
                        {g.ids.map((id) => {
                            const free = earned.includes(id);
                            return (
                                <li key={id}>
                                    <button
                                        type="button"
                                        aria-pressed={free ? id === current : undefined}
                                        aria-label={
                                            free
                                                ? titleName(id)
                                                : t('profile.picker.lockedAria', {
                                                      name: titleName(id),
                                                      mission: titleHow(id),
                                                  })
                                        }
                                        className={`pf-tcell${free && id === current ? ' active' : ''}${free ? '' : ' locked'}${id === pick ? ' picked' : ''}`}
                                        onClick={() => {
                                            setPick(id);
                                            const patch = pickTitle(id, earned);
                                            if (patch) save(patch);
                                        }}
                                    >
                                        {!free && <LockIcon />}
                                        <span className={look(id)}>{titleName(id)}</span>
                                        {free && <NewBadge k={newsKey.title(id)} className="corner" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}

/** Resgatar código (título, Pokédex corrigida ou carta devolvida). Mora na folha do Título. */
export function RedeemCode() {
    const profile = useGame((s) => s.profile);
    const updateProfile = useGame((s) => s.updateProfile);
    const { t } = useT();
    const [code, setCode] = useState('');
    const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (busy || !code.trim()) return;
        setBusy(true);
        const id = await redeemCode(code).catch(() => null);
        const dexFix = id ? null : await redeemDexCode(code).catch(() => null);
        const gift = id || dexFix ? null : await redeemCardCode(code).catch(() => null);
        setBusy(false);
        if (gift) {
            const back = returnCard(useGame.getState(), gift);
            if (!back) return setCodeMsg({ ok: false, text: t('profile.picker.codeCardHave') });
            useGame.setState(back);
            setCode('');
            return setCodeMsg({ ok: true, text: t('profile.picker.codeCard', { name: species(gift.speciesId).name }) });
        }
        if (dexFix) {
            useGame.setState((s) => ({ dex: markPlayed(s.dex, dexFix) }));
            setCode('');
            const names = dexFix.map((n) => species(n).name).join(', ');
            return setCodeMsg({ ok: true, text: t('profile.picker.codeDex', { names }) });
        }
        if (!id) return setCodeMsg({ ok: false, text: t('profile.picker.codeBad') });
        if (profile.redeemedTitles.includes(id))
            return setCodeMsg({ ok: false, text: t('profile.picker.codeHave', { title: titleName(id) }) });
        updateProfile({ redeemedTitles: [...profile.redeemedTitles, id], title: id });
        setCode('');
        setCodeMsg({ ok: true, text: t('profile.picker.codeOk', { title: titleName(id) }) });
    };
    return (
        <form className="pf-field pf-code" onSubmit={submit}>
            <div className="pf-row">
                <input
                    id="pf-code"
                    className="pf-input"
                    aria-label={t('profile.picker.code')}
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
    );
}

/** Como cumprir: o texto da missão e, se for de contador, a barra (x/meta). */
export function MissionHow({ m, view }: { m: Mission; view: SaveView }) {
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
                    <span className="k-bar">
                        <i style={{ width: `${(n / m.goal) * 100}%` }} />
                    </span>
                    <b className="k-num" aria-hidden>
                        {n}/{m.goal}
                    </b>
                </span>
            )}
        </>
    );
}

/** Platina de uma geração (o diploma da Sala de troféus): os 6 itens com o progresso. */
export function PlatinumBlock({ p, view }: { p: Platinum; view: SaveView }) {
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
                                <span className={`k-bar${i.n >= i.goal ? ' full' : ''}`}>
                                    <i style={{ width: `${Math.min(1, i.n / i.goal) * 100}%` }} />
                                </span>
                                <b className="k-num" aria-hidden>
                                    {Math.min(i.n, i.goal)}/{i.goal}
                                </b>
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

/** O rótulo das Missões com a conta (o mesmo das Medalhas e da Vitrine: nome e "x/y"). */
export function MissionSummary() {
    const view = useSaveView();
    const { d } = useT();
    const done = MISSIONS.filter((m) => view.done.has(m.id)).length;
    return (
        <h3 className="bc-lbl">
            {d.profile.tabs.missoes}
            <span className="pf-count">
                {done}/{MISSIONS.length}
            </span>
        </h3>
    );
}
