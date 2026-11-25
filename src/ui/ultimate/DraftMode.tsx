import { type CSSProperties, useState } from 'react';
import type { FormationId } from '../../engine/formations';
import { slotRating, viewInstance } from '../../engine/instance';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { utNow } from '../../store/ultimate/clock';
import {
    DRAFT_SIZE,
    type DraftPrize,
    type DraftRun,
    draftChoices,
    draftCost,
    draftLevel,
    draftMatch,
    draftRole,
    draftScore,
    draftSlot,
} from '../../store/ultimate/draft';
import { DRAFT_GAMES, DRAFT_PRIZES, STARTERS } from '../../store/ultimate/rules';
import { FormationCarousel } from '../components/FormationCarousel';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import type { useKick } from './Play';

/**
 * Volta da partida do Draft: o Time Ultimate abre na aba Jogar, já no Draft (só na sessão; `Play` apaga depois de
 * abrir).
 */
export const draftBack = { on: false };

const GAMES = Array.from({ length: DRAFT_GAMES }, (_, k) => k);

/** "+1 Pacote Mini · +1 Pacote Grande". */
function usePrizeText() {
    const { tn } = useT();
    return (p: DraftPrize) =>
        [
            p.fichas ? tn('ultimate.pass.reward.fichas', p.fichas) : '',
            p.packs ? tn('ultimate.pass.reward.packs', p.packs) : '',
            p.big ? tn('ultimate.pass.reward.big', p.big) : '',
        ]
            .filter(Boolean)
            .join(' · ');
}

/**
 * Draft do Time Ultimate (atrás de `utDraftOn`; regra em src/store/ultimate/draft.ts): entrada → capitão e vagas,
 * 1 de 5 → as 4 partidas (o mesmo JOGAR das Batalhas) → o prêmio. Cada passo entra com a animação do painel.
 */
export function DraftMode({
    onBack,
    onPacks,
    kick,
}: {
    onBack: () => void;
    onPacks: () => void;
    kick: ReturnType<typeof useKick>;
}) {
    const { t } = useT();
    const run = useGame((s) => s.ultimate.draft.run);
    const slot = run ? draftSlot(run) : null;
    const step = !run
        ? 'entry'
        : run.prize
          ? 'over'
          : slot! < DRAFT_SIZE
            ? `pick-${slot}`
            : `games-${run.games.length}`;
    return (
        <div className="ut-panel ut-draft">
            <header className="ut-sbc-head">
                <button type="button" className="btn small" onClick={onBack}>
                    {t('ultimate.draft.back')}
                </button>
                <b className="ut-mode-name">{t('ultimate.modes.draft.name')}</b>
            </header>
            <div key={step} className="ut-draft-step">
                {!run ? (
                    <Entry />
                ) : run.prize ? (
                    <Over run={run} onPacks={onPacks} />
                ) : slot! < DRAFT_SIZE ? (
                    <Picking run={run} />
                ) : (
                    <Games run={run} kick={kick} />
                )}
            </div>
        </div>
    );
}

/** A entrada: a regra, a formação, a tabela de prêmios e o botão (grátis na 1ª da semana). */
function Entry() {
    const { t, tn } = useT();
    const u = useGame((s) => s.ultimate);
    const [formation, setFormation] = useState<FormationId>(u.team.formation);
    const cost = draftCost(u, utNow());
    const prizeText = usePrizeText();
    const can = u.fichas >= cost;
    return (
        <>
            <small className="muted">{t('ultimate.draft.hint')}</small>
            <small className="muted">{t('ultimate.draft.note')}</small>
            <span className="bc-lbl">{t('ultimate.draft.formation')}</span>
            <FormationCarousel value={formation} onChange={setFormation} />
            <span className="bc-lbl">{t('ultimate.draft.prizes')}</span>
            <table className="ut-prizes ut-draft-prizes">
                <tbody>
                    {DRAFT_PRIZES.map((p, w) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: a linha é o número de vitórias
                        <tr key={w}>
                            <th>{tn('ultimate.draft.wins', w)}</th>
                            <td>{prizeText(p)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {u.draft.best > 0 && <small className="muted">{tn('ultimate.draft.best', u.draft.best)}</small>}
            <button
                type="button"
                className="btn primary big wide ut-go"
                disabled={!can}
                onClick={() => useGame.getState().ultimateDraftEnter(formation)}
            >
                <i className="cb-shine" aria-hidden />
                <span>{cost ? t('ultimate.draft.enter', { n: cost }) : t('ultimate.draft.free')}</span>
            </button>
            {!can && <small className="muted">{t('ultimate.draft.poor', { n: u.fichas })}</small>}
        </>
    );
}

/** As 8 vagas (5 da formação e o banco) e a pontuação do time: média, química (X/15) e força. */
function TeamStrip({ run, next }: { run: DraftRun; next?: number }) {
    const { t, d } = useT();
    const score = draftScore(run);
    return (
        <>
            <section className="panel bc-surface bc-stripe ut-teamcard" aria-live="polite">
                <b className="ut-teamcard-ovr cb-num">{score.avg}</b>
                <span>
                    <span className="bc-lbl">{t('ultimate.teamcard.ovr')}</span>
                    <b>{t('ultimate.home.chem', { n: score.dia, max: STARTERS * 3 })}</b>
                </span>
                <span className="ut-teamcard-str">
                    <span className="bc-lbl">{t('ultimate.teamcard.str')}</span>
                    <b className="cb-num">{Math.round(score.power)}</b>
                </span>
            </section>
            <div className="ut-draft-team">
                {run.team.map((p, i) => {
                    const role = draftRole(run, i);
                    const label = role === 'ANY' ? d.ultimate.sbc.tag.bench : d.common.posShort[role];
                    const cls = `ut-sbc-slot${p ? ' is-on' : ''}${i === next ? ' is-next' : ''}${
                        p && p.uid === run.captainUid ? ' is-cap' : ''
                    }`;
                    return (
                        // biome-ignore lint/suspicious/noArrayIndexKey: vaga fixa da formação
                        <span key={`v${i}`} className={cls}>
                            {p && <MonIcon id={p.speciesId} shiny={p.shiny} />}
                            {p && <b>{slotRating(p, role)}</b>}
                            <small>{label}</small>
                        </span>
                    );
                })}
            </div>
        </>
    );
}

/** A vez de escolher: capitão ou vaga, as 5 cartas sorteadas. */
function Picking({ run }: { run: DraftRun }) {
    const { t, d } = useT();
    const u = useGame((s) => s.ultimate);
    const [cards] = useState(() => draftChoices(u));
    const slot = draftSlot(run);
    const role = slot < 0 ? 'ANY' : draftRole(run, slot);
    const filled = run.team.filter(Boolean).length;
    const title =
        slot < 0
            ? t('ultimate.draft.captain')
            : role === 'ANY'
              ? t('ultimate.draft.bench')
              : t('ultimate.draft.slot', { pos: d.common.pos[role] });
    return (
        <>
            <TeamStrip run={run} next={slot} />
            <span className="ut-draft-title">
                <b className="ut-mode-name">{title}</b>
                <small className="muted">{t('ultimate.draft.step', { i: filled + 1, n: DRAFT_SIZE })}</small>
            </span>
            <div className="k-pick3 ut-pick ut-draft-pick" style={{ '--k-n': cards.length } as CSSProperties}>
                {cards.map((c) => (
                    <div key={c.uid} className="ut-draft-opt">
                        <FutCard
                            inst={c}
                            position={role === 'ANY' ? undefined : role}
                            captain={slot < 0}
                            action={{
                                label: t('ultimate.draft.choose'),
                                primary: true,
                                onClick: () => useGame.getState().ultimateDraftPick(c.uid),
                            }}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

/** Uma linha do caminho: "Partida 2 de 4 · Normal" e, jogada, o placar e o rival. */
function GameRow({ run, k }: { run: DraftRun; k: number }) {
    const { t, d, lang } = useT();
    const g = run.games[k];
    const cur = !run.prize && k === run.games.length;
    return (
        <li className={`ut-draft-game${g ? (g.won ? ' is-won' : ' is-lost') : ''}${cur ? ' is-cur' : ''}`}>
            <span>
                {t('ultimate.draft.game', { k: k + 1, n: DRAFT_GAMES, level: d.ultimate.play.levels[draftLevel(k)] })}
            </span>
            {g && (
                <span>
                    <b>
                        {g.score[0]} x {g.score[1]}
                    </b>{' '}
                    {g.shootout && <small>{t('ultimate.result.pens', { a: g.shootout[0], b: g.shootout[1] })} </small>}
                    <small>{clubName(g.rival, lang)}</small>
                </span>
            )}
        </li>
    );
}

/** Time pronto: o caminho das 4 partidas e o JOGAR (o mesmo das Batalhas). */
function Games({ run, kick }: { run: DraftRun; kick: ReturnType<typeof useKick> }) {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const profile = useGame((s) => s.profile);
    const live = u.live;
    const start = () => {
        const m = draftMatch(u, profile.clubName || 'Pallet FC', clubColorHex(profile.clubColor));
        if (!m || live) return;
        useGame.getState().ultimateStart(m);
        draftBack.on = true;
        void kick.kick();
    };
    const resume = () => {
        draftBack.on = true;
        void kick.kick();
    };
    return (
        <>
            <TeamStrip run={run} />
            <ol className="ut-draft-games">
                {GAMES.map((k) => (
                    <GameRow key={k} run={run} k={k} />
                ))}
            </ol>
            {live && !live.draft ? (
                <small className="ut-off">{t('ultimate.draft.busy')}</small>
            ) : (
                <button
                    type="button"
                    className="btn primary big wide ut-go"
                    disabled={kick.busy}
                    onClick={live ? resume : start}
                >
                    <i className="cb-shine" aria-hidden />
                    <span>
                        {kick.busy
                            ? t('ultimate.play.warming')
                            : live
                              ? t('ultimate.play.resume')
                              : t('ultimate.play.go')}
                    </span>
                </button>
            )}
            {kick.error && <p className="error-text">{kick.error}</p>}
        </>
    );
}

/** Fim da campanha: quantas venceu, o caminho e o prêmio (já em Meus pacotes). */
function Over({ run, onPacks }: { run: DraftRun; onPacks: () => void }) {
    const { t } = useT();
    const prizeText = usePrizeText();
    const wins = run.games.filter((g) => g.won).length;
    const close = () => useGame.getState().ultimateDraftClose();
    const best = run.team.reduce((b, p) => (p && (!b || viewInstance(p).overall > viewInstance(b).overall) ? p : b));
    return (
        <>
            <section className={`panel bc-surface bc-stripe ut-draft-over${wins === DRAFT_GAMES ? ' is-champ' : ''}`}>
                {best && <MonIcon id={best.speciesId} shiny={best.shiny} />}
                <b className="ut-mode-name">
                    {wins === DRAFT_GAMES ? t('ultimate.draft.champion') : t('ultimate.draft.over')}
                </b>
                <small>{t('ultimate.draft.result', { n: wins, of: DRAFT_GAMES })}</small>
                {run.prize && (
                    <span className="ut-mode-gives">
                        <HudIcon kind="chest" />
                        {t('ultimate.draft.prize', { text: prizeText(run.prize) })}
                    </span>
                )}
            </section>
            <ol className="ut-draft-games">
                {GAMES.map((k) => (
                    <GameRow key={k} run={run} k={k} />
                ))}
            </ol>
            <button
                type="button"
                className="btn primary wide"
                onClick={() => {
                    close();
                    onPacks();
                }}
            >
                {t('ultimate.draft.toPacks')}
            </button>
            <button type="button" className="btn wide" onClick={close}>
                {t('ultimate.draft.close')}
            </button>
        </>
    );
}
