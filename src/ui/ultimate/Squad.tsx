import { useMemo, useState } from 'react';
import { FORMATIONS } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { useT } from '../../i18n/react';
import type { SlotRef } from '../../store/game-store';
import { useGame } from '../../store/game-store';
import { chemistry } from '../../store/ultimate/chemistry';
import { STARTERS, TEAM_SIZE } from '../../store/ultimate/rules';
import { homeTeam, orderIndex, teamAverage, teamStrength, type UltimateSave } from '../../store/ultimate/ultimate';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { Sheet } from '../kit/Sheet';
import { LineupEditor } from '../screens/Lineup';
import { Chemistry } from './Chemistry';
import { clubPos, Diff, fitOf, ratingAtSlot } from './Club';

/** Cartão do time em cima da prancheta (como o do FC): a nota do time grande, a química e a força. */
function TeamCard({ u }: { u: UltimateSave }) {
    const { t } = useT();
    const home = homeTeam(u, '', 0);
    const avg = teamAverage(home);
    const chem = Math.round((chemistry(home.lineup, FORMATIONS[u.team.formation].slots, [], home.bench).avg - 1) * 100);
    return (
        <section className="panel bc-surface bc-stripe ut-teamcard" aria-live="polite">
            <b className="ut-teamcard-ovr cb-num">{avg}</b>
            <span>
                <span className="bc-lbl">{t('ultimate.teamcard.ovr')}</span>
                <b>{t('ultimate.home.chem', { c: chem })}</b>
            </span>
            <span className="ut-teamcard-str">
                <span className="bc-lbl">{t('ultimate.teamcard.str')}</span>
                <b className="cb-num">{Math.round(teamStrength(home))}</b>
            </span>
        </section>
    );
}

/**
 * Elenco: a prancheta da Copa com a troca por vaga (como no FC): tocar numa vaga abre a lista do Clube já filtrada
 * pela posição dela e ordenada pela nota naquela vaga. Banco com 2.
 */
export function Squad({ onPacks, onClub }: { onPacks: () => void; onClub: () => void }) {
    const { t, tn, d } = useT();
    const u = useGame((s) => s.ultimate);
    const setTeam = useGame((s) => s.ultimateTeam);
    const setMember = useGame((s) => s.ultimateSetMember);
    const clubName = useGame((s) => s.profile.clubName);
    const byUid = useMemo(() => new Map(u.cards.map((c) => [c.uid, c])), [u.cards]);
    const [slot, setSlot] = useState<number | null>(null);
    const order = u.team.order;
    if (order.length < STARTERS)
        return (
            <section className="panel ut-empty">
                <b>{tn('ultimate.team.need', STARTERS - order.length)}</b>
                <p className="muted">{t('ultimate.team.needHint')}</p>
                <button type="button" className="btn" onClick={onPacks}>
                    {t('ultimate.play.toPacks')}
                </button>
            </section>
        );
    const name = (uid: string) => viewInstance(byUid.get(uid)!).displayName;
    return (
        <>
            <TeamCard u={u} />
            <LineupEditor
                title={t('team.lineup.title', { team: clubName || t('ultimate.title') })}
                formation={u.team.formation}
                lineup={order.slice(0, STARTERS)}
                bench={order.slice(STARTERS, TEAM_SIZE)}
                byUid={byUid}
                captainUid={u.team.captainUid}
                tactic={u.team.tactic}
                cornerPlan={u.team.corner}
                cornerTakerUid={u.team.cornerTakerUid}
                locked={!!u.live}
                onFormation={(formation) => setTeam({ formation })}
                onSwap={(a, b) => setMember(orderIndex(a.zone, a.index), order[orderIndex(b.zone, b.index)])}
                onSlotTap={(ref: SlotRef) => setSlot(orderIndex(ref.zone, ref.index))}
                onTactic={(tactic) => setTeam({ tactic })}
                onCorner={(p) =>
                    setTeam({
                        ...(p.cornerPlan && { corner: p.cornerPlan }),
                        ...(p.cornerTakerUid !== undefined && { cornerTakerUid: p.cornerTakerUid }),
                    })
                }
                side={
                    <>
                        <Chemistry u={u} />
                        <section className="panel bc-surface ut-captain-box">
                            <label className="corner-taker ut-captain">
                                <h3>
                                    <HudIcon kind="armband" />
                                    {t('ultimate.team.captain')}
                                </h3>
                                <select
                                    value={u.team.captainUid ?? ''}
                                    disabled={!!u.live}
                                    onChange={(e) => setTeam({ captainUid: e.target.value || null })}
                                >
                                    {!u.team.captainUid && <option value="">{t('ultimate.team.captainNone')}</option>}
                                    {order.slice(0, STARTERS).map((uid) => (
                                        <option key={uid} value={uid}>
                                            {name(uid)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </section>
                    </>
                }
            />
            <SlotSheet
                i={slot}
                onClose={() => setSlot(null)}
                onClub={(pos) => {
                    setSlot(null);
                    clubPos(pos);
                    onClub();
                }}
                pos={d.common.posShort}
            />
        </>
    );
}

/**
 * "Trocar o ALA": as cartas do Clube (e as do time, que trocam de lugar) pela nota na vaga; primeiro quem tem a posição
 * como principal, depois a alternativa (até 98%), e fora de posição em cinza. "Todas" tira o filtro.
 */
function SlotSheet({
    i,
    onClose,
    onClub,
    pos,
}: {
    i: number | null;
    onClose: () => void;
    onClub: (pos: ReturnType<typeof roleOf>) => void;
    pos: Record<string, string>;
}) {
    const { t } = useT();
    const u = useGame((s) => s.ultimate);
    const setMember = useGame((s) => s.ultimateSetMember);
    const [all, setAll] = useState(false);
    const role = i === null ? null : roleOf(u.team.formation, i);
    const cur = i === null ? undefined : u.cards.find((c) => c.uid === u.team.order[i]);
    const curN = cur && i !== null ? ratingAtSlot(cur, i, u) : 0;
    const list =
        i === null
            ? []
            : u.cards
                  .filter((c) => c.uid !== cur?.uid && (all || !role || fitOf(c, role) !== 'off'))
                  .map((c) => ({ c, n: ratingAtSlot(c, i, u), fit: role ? fitOf(c, role) : 'main' }))
                  .sort((a, b) => b.n - a.n);
    const title =
        i === null || !cur
            ? ''
            : role
              ? t('ultimate.club.slotTitle', { pos: pos[role], name: viewInstance(cur).displayName, n: curN })
              : t('ultimate.club.benchTitle', { name: viewInstance(cur).displayName, n: curN });
    return (
        <Sheet
            open={i !== null}
            onClose={() => {
                setAll(false);
                onClose();
            }}
            title={title}
            className="ut-slot-sheet"
        >
            {role && (
                <div className="bc-seg">
                    <button
                        type="button"
                        aria-pressed={!all}
                        className={all ? undefined : 'on'}
                        onClick={() => setAll(false)}
                    >
                        {pos[role]}
                    </button>
                    <button
                        type="button"
                        aria-pressed={all}
                        className={all ? 'on' : undefined}
                        onClick={() => setAll(true)}
                    >
                        {t('ultimate.club.all')}
                    </button>
                </div>
            )}
            <ul className="ut-slot-list" key={String(all)}>
                {list.map(({ c, n, fit }) => {
                    const v = viewInstance(c);
                    const k = u.team.order.indexOf(c.uid);
                    return (
                        <li key={c.uid}>
                            <button
                                type="button"
                                className={`ut-slot-row fit-${fit}`}
                                disabled={!!u.live}
                                onClick={() => {
                                    if (i !== null) setMember(i, c.uid);
                                    setAll(false);
                                    onClose();
                                }}
                            >
                                <MonIcon id={c.speciesId} shiny={c.shiny} />
                                <span>
                                    {v.displayName}
                                    {k >= 0 && <small className="muted"> · {t('ultimate.club.inTeam')}</small>}
                                </span>
                                <small className="ut-slot-pos">
                                    {fit === 'off'
                                        ? t('ultimate.club.off')
                                        : `${pos[v.naturalPosition]}${fit === 'alt' ? ` ${t('ultimate.club.alt')}` : ''}`}
                                </small>
                                <b className="cb-num">{n}</b>
                                <Diff n={cur ? n - curN : null} />
                            </button>
                        </li>
                    );
                })}
            </ul>
            <button type="button" className="btn ghost small" onClick={() => onClub(role)}>
                {t('ultimate.club.seeClub')}
            </button>
        </Sheet>
    );
}

const roleOf = (formation: keyof typeof FORMATIONS, i: number) =>
    i < STARTERS ? FORMATIONS[formation].slots[i] : null;
