import { useMemo, useState } from 'react';
import { FORMATIONS } from '../../engine/formations';
import { viewInstance } from '../../engine/instance';
import { useT } from '../../i18n/react';
import type { SlotRef } from '../../store/game-store';
import { useGame } from '../../store/game-store';
import { chemistry, chemTotal, chemWhy, diamondsOf } from '../../store/ultimate/chemistry';
import { STARTERS, TEAM_SIZE } from '../../store/ultimate/rules';
import { homeTeam, orderIndex, teamAverage, teamStrength, type UltimateSave } from '../../store/ultimate/ultimate';
import { useCardModal } from '../card-modal';
import { FutCard } from '../components/FutCard';
import { HudIcon } from '../components/MatchHud';
import { MonIcon } from '../components/MonIcon';
import { useMedia, WIDE } from '../components/Prancheta';
import { SheetRow } from '../kit/controls';
import { Sheet } from '../kit/Sheet';
import { LineupEditor } from '../screens/Lineup';
import { Chemistry, ChemWhyPanel, chemOf, Diamonds } from './Chemistry';
import { clubPos, Diff, fitOf, ratingAtSlot } from './Club';

/** Cartão do time em cima da prancheta (como o do FC): a nota do time grande, a química e a força. */
function TeamCard({ u }: { u: UltimateSave }) {
    const { t } = useT();
    const home = homeTeam(u, '', 0);
    const avg = teamAverage(home);
    const chem = chemTotal(chemistry(home.lineup, FORMATIONS[u.team.formation].slots, [], home.bench));
    return (
        <section className="panel bc-surface bc-stripe ut-teamcard" aria-live="polite">
            <b className="ut-teamcard-ovr cb-num">{avg}</b>
            <span>
                <span className="bc-lbl">{t('ultimate.teamcard.ovr')}</span>
                <b>{t('ultimate.home.chem', { n: chem, max: STARTERS * 3 })}</b>
            </span>
            <span className="ut-teamcard-str">
                <span className="bc-lbl">{t('ultimate.teamcard.str')}</span>
                <b className="cb-num">{Math.round(teamStrength(home))}</b>
            </span>
        </section>
    );
}

/**
 * Elenco: a prancheta da Copa com a química à vista (como no FC). Tocar num titular destaca os parceiros dele (os
 * outros apagam) e abre o "por que" da química com Trocar, Banco e Ver carta; no PC a química fica à esquerda da quadra
 * e o titular à direita, no celular o titular sobe numa folha. Tocar no banco abre a troca. Banco com 2.
 */
export function Squad({ onPacks, onClub }: { onPacks: () => void; onClub: () => void }) {
    const { t, tn, d } = useT();
    const u = useGame((s) => s.ultimate);
    const setTeam = useGame((s) => s.ultimateTeam);
    const setMember = useGame((s) => s.ultimateSetMember);
    const clubName = useGame((s) => s.profile.clubName);
    const byUid = useMemo(() => new Map(u.cards.map((c) => [c.uid, c])), [u.cards]);
    const [slot, setSlot] = useState<number | null>(null);
    // o titular tocado (índice da vaga) e o Banco dele (a folha com os 2 do banco)
    const [focus, setFocus] = useState<number | null>(null);
    const [benchFor, setBenchFor] = useState<number | null>(null);
    const wide = useMedia(WIDE);
    const openCard = useCardModal((s) => s.open);
    const order = u.team.order;
    const cap = u.team.captainUid ? byUid.get(u.team.captainUid) : undefined;
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
    const { lineup, roles, ch } = chemOf(u);
    const dia = new Map(ch.players.map((p) => [p.uid, diamondsOf(p.chem)]));
    // no PC a coluna da direita mostra sempre um titular (o capitão, até tocar noutro); só o toque apaga os outros
    const capIndex = Math.max(
        0,
        lineup.findIndex((p) => p.uid === u.team.captainUid),
    );
    const shown = focus ?? (wide ? capIndex : null);
    const focusUid = focus === null ? null : (lineup[focus]?.uid ?? null);
    // a vaga em destaque é a do titular do painel (no PC, o capitão até tocar noutro)
    const lit = new Set(focus === null || !lineup[focus] ? [] : [focusUid!, ...chemWhy(ch, lineup, focus).partners]);
    const tapStarter = (i: number) => {
        setFocus(focus === i ? null : i);
        // celular: a folha sobe embaixo; a quadra vai pro topo da tela pra ver quem acende
        if (!wide && focus !== i)
            document.querySelector('.ut-panel .vt-board')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    const whyActions = (i: number) => {
        const p = lineup[i];
        return (
            <>
                <button
                    type="button"
                    className="btn small"
                    disabled={!!u.live}
                    onClick={() => {
                        if (!wide) setFocus(null);
                        setSlot(i);
                    }}
                >
                    <HudIcon kind="reroll" />
                    {t('ultimate.why.swap')}
                </button>
                <button
                    type="button"
                    className="btn small"
                    disabled={!!u.live || order.length <= STARTERS}
                    onClick={() => setBenchFor(i)}
                >
                    <HudIcon kind="prev" />
                    {t('ultimate.why.bench')}
                </button>
                <button
                    type="button"
                    className="btn small"
                    onClick={() => openCard(p, { position: roles[i], captain: p.uid === u.team.captainUid })}
                >
                    <HudIcon kind="cards" />
                    {t('ultimate.why.card')}
                </button>
            </>
        );
    };
    return (
        <>
            {!wide && <TeamCard u={u} />}
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
                badgeOf={(inst) => dia.has(inst.uid) && <Diamonds n={dia.get(inst.uid)!} />}
                focusUid={shown === null ? null : (lineup[shown]?.uid ?? null)}
                dimOf={lit.size ? (inst) => !lit.has(inst.uid) : undefined}
                noSynergies
                lying={wide}
                lead={
                    <>
                        {wide && <TeamCard u={u} />}
                        <Chemistry u={u} />
                    </>
                }
                aside={
                    wide ? (
                        <section className="panel bc-surface ut-focus">
                            {shown !== null && lineup[shown] ? (
                                <ChemWhyPanel
                                    u={u}
                                    i={shown}
                                    head={
                                        <FutCard
                                            inst={lineup[shown]}
                                            size="sm"
                                            position={roles[shown]}
                                            captain={lineup[shown].uid === u.team.captainUid}
                                        />
                                    }
                                    actions={whyActions(shown)}
                                />
                            ) : (
                                <small className="muted">{t('ultimate.why.hint')}</small>
                            )}
                        </section>
                    ) : null
                }
                onFormation={(formation) => setTeam({ formation })}
                onSwap={(a, b) => setMember(orderIndex(a.zone, a.index), order[orderIndex(b.zone, b.index)])}
                onSlotTap={(ref: SlotRef) =>
                    ref.zone === 'lineup' ? tapStarter(ref.index) : setSlot(orderIndex(ref.zone, ref.index))
                }
                onTactic={(tactic) => setTeam({ tactic })}
                onCorner={(p) =>
                    setTeam({
                        ...(p.cornerPlan && { corner: p.cornerPlan }),
                        ...(p.cornerTakerUid !== undefined && { cornerTakerUid: p.cornerTakerUid }),
                    })
                }
                side={
                    <>
                        {/* o capitão numa linha que abre a folha com os 5 titulares, como Tática e Formação logo
                            abaixo (sem o select do sistema) */}
                        <section className="panel bc-surface vt-plan ut-captain-box">
                            <SheetRow
                                className="vt-row"
                                icon="armband"
                                label={
                                    cap
                                        ? `${t('ultimate.team.captain')}: ${name(cap.uid)}`
                                        : t('ultimate.team.captainNone')
                                }
                                title={t('ultimate.team.captain')}
                            >
                                <ul className="ut-slot-list">
                                    {order.slice(0, STARTERS).map((uid, i) => {
                                        const c = byUid.get(uid)!;
                                        const on = uid === u.team.captainUid;
                                        return (
                                            <li key={uid}>
                                                <button
                                                    type="button"
                                                    className={`ut-slot-row ut-cap-pick${on ? ' on' : ''}`}
                                                    aria-pressed={on}
                                                    disabled={!!u.live}
                                                    onClick={() => setTeam({ captainUid: uid })}
                                                >
                                                    <MonIcon id={c.speciesId} shiny={c.shiny} />
                                                    <span>{name(uid)}</span>
                                                    <small className="ut-slot-pos">
                                                        {d.common.posShort[FORMATIONS[u.team.formation].slots[i]]}
                                                    </small>
                                                    <b className="cb-num">{viewInstance(c).overall}</b>
                                                    {on ? <HudIcon kind="armband" /> : <i aria-hidden />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </SheetRow>
                        </section>
                    </>
                }
            />
            {!wide && (
                <Sheet
                    open={focus !== null && !!lineup[focus]}
                    onClose={() => setFocus(null)}
                    title={focus !== null && lineup[focus] ? name(lineup[focus].uid) : ''}
                    className="ut-why-sheet"
                >
                    {focus !== null && <ChemWhyPanel u={u} i={focus} actions={whyActions(focus)} />}
                </Sheet>
            )}
            <SlotSheet
                i={benchFor}
                benchOnly
                onClose={() => setBenchFor(null)}
                onClub={() => {}}
                pos={d.common.posShort}
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
    benchOnly,
}: {
    i: number | null;
    /** "Banco" do titular tocado: só os do banco, e quem é escolhido entra no lugar dele. */
    benchOnly?: boolean;
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
                  .filter((c) =>
                      benchOnly
                          ? u.team.order.indexOf(c.uid) >= STARTERS
                          : c.uid !== cur?.uid && (all || !role || fitOf(c, role) !== 'off'),
                  )
                  .map((c) => ({ c, n: ratingAtSlot(c, i, u), fit: role ? fitOf(c, role) : 'main' }))
                  .sort((a, b) => b.n - a.n);
    const title =
        i === null || !cur
            ? ''
            : benchOnly
              ? t('ultimate.why.benchTitle', { name: viewInstance(cur).displayName })
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
            {role && !benchOnly && (
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
                                    {k >= 0 && !benchOnly && (
                                        <small className="muted"> · {t('ultimate.club.inTeam')}</small>
                                    )}
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
            {!benchOnly && (
                <button type="button" className="btn ghost small" onClick={() => onClub(role)}>
                    {t('ultimate.club.seeClub')}
                </button>
            )}
        </Sheet>
    );
}

const roleOf = (formation: keyof typeof FORMATIONS, i: number) =>
    i < STARTERS ? FORMATIONS[formation].slots[i] : null;
