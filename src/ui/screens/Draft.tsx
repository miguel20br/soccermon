import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DRAFT_PICKS } from '../../engine/draft';
import { evolvedRating } from '../../engine/evolution';
import type { FormationId } from '../../engine/formations';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { computeLinks } from '../../engine/links';
import { computeSynergies } from '../../engine/synergy';
import { formationText } from '../../i18n';
import { rich, useT } from '../../i18n/react';
import { type SlotRef, slotRole, useGame } from '../../store/game-store';
import { isLong } from '../../store/long-cup';
import { Coach } from '../coach/Coach';
import { CardPack, isBigCard, packLookOf } from '../components/CardPack';
import { CountUp } from '../components/CountUp';
import { FormationBoard } from '../components/FormationBoard';
import { FormationCarousel } from '../components/FormationCarousel';
import { FutCard } from '../components/FutCard';
import { LinkChip, LinkChips, newLinks } from '../components/LinkChips';
import { HudIcon } from '../components/MatchHud';
import { TypeBadge } from '../components/PokeCard';
import { EvoBadge } from '../components/PokeCard2';
import { useMedia } from '../components/Prancheta';
import { Sheet } from '../kit/Sheet';
import { Stage } from '../kit/Stage';
import { lineupAverage, ratingAt } from '../rating';
import { flyCard } from '../view-transition';
import '../draft.css';

/** "Média dos titulares" que rola até o valor novo e mostra o quanto a escolha mudou (+4 / −2) por 1,5 s. */
function TeamAvg({ avg }: { avg: number }) {
    const { t } = useT();
    const prev = useRef(avg);
    const [delta, setDelta] = useState(0);
    useEffect(() => {
        const diff = avg - prev.current;
        prev.current = avg;
        if (!diff) return;
        setDelta(diff);
        const id = window.setTimeout(() => setDelta(0), 1500);
        return () => clearTimeout(id);
    }, [avg]);
    return (
        <span className="muted team-avg">
            {rich(t('team.draft.avg'), { n: <CountUp to={avg} className="team-avg-n" /> })}
            {delta !== 0 && (
                <b key={avg} className={`avg-delta ${delta > 0 ? 'up' : 'down'}`}>
                    {delta > 0 ? `+${delta}` : `−${-delta}`}
                </b>
            )}
        </span>
    );
}

/**
 * "Monta pra mim": completa o draft com a melhor carta pra cada vaga (escolha do jogador, pede confirmação).
 * No celular fica na barra do polegar (à vista o draft inteiro); no PC, no cabeçalho. Secundário azul baixo (o kit B
 * aprovado em 26/10): a escolha é das cartas.
 */
function AutoDraft({
    captainUid,
    hint,
    formation,
    children,
}: {
    captainUid?: string;
    hint?: string;
    /** Na escolha da formação: a que está na tela (o carrossel), não a padrão do save. */
    formation?: FormationId;
    /** A ação principal ao lado (no lugar da instrução). */
    children?: ReactNode;
}) {
    const { run, autoDraft, chooseFormation } = useGame();
    const { t, lang } = useT();
    const [ask, setAsk] = useState(false);
    if (!run) return null;
    return (
        <div className={`bc-thumbbar draft-auto${ask ? ' ask' : ''}`}>
            {ask ? (
                <>
                    <p>
                        {t('team.draft.autoAsk', { formation: formationText(formation ?? run.formation, lang).name })}
                    </p>
                    <button type="button" className="btn ghost" onClick={() => setAsk(false)}>
                        {t('team.draft.autoBack')}
                    </button>
                    {/* o diálogo abre com o foco no "Montar": Enter confirma, Esc/Voltar cancela pelo teclado */}
                    <button
                        type="button"
                        className="btn confirm"
                        // biome-ignore lint/a11y/noAutofocus: o diálogo acabou de abrir por um clique; o foco tem que entrar nele
                        autoFocus
                        onClick={() => {
                            if (formation && run.status === 'formation') chooseFormation(formation);
                            autoDraft(captainUid);
                        }}
                    >
                        {t('team.draft.autoGo')}
                    </button>
                </>
            ) : (
                // secundário à esquerda; à direita, a instrução da vez (no celular o cabeçalho já rolou pra cima)
                <>
                    <button type="button" className="btn draft-auto-go" onClick={() => setAsk(true)}>
                        <HudIcon kind="skip" />
                        {t('team.draft.auto')}
                    </button>
                    {children ?? (hint && <p className="tb-hint draft-auto-hint">{hint}</p>)}
                </>
            )}
        </div>
    );
}

/** A quadra cabe no palco sem rolar: encolhe (zoom) até caber na altura e na largura que sobram. */
function useFitBoard(ref: RefObject<HTMLDivElement | null>, key: unknown, min = 0.5) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: mede de novo quando a quadra troca (key)
    useLayoutEffect(() => {
        const wrap = ref.current;
        const inner = wrap?.firstElementChild as HTMLElement | null;
        if (!wrap || !inner || typeof ResizeObserver === 'undefined') return;
        const refit = () => {
            inner.style.zoom = '';
            const z = Math.min(1, wrap.clientHeight / inner.offsetHeight, wrap.clientWidth / inner.offsetWidth);
            if (z < 1) inner.style.zoom = String(Math.max(min, z));
        };
        refit();
        const ro = new ResizeObserver(refit);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, [ref, key, min]);
}

type DraftTeamRun = Pick<NonNullable<ReturnType<typeof useGame.getState>['run']>, 'formation' | 'lineup' | 'bench'>;

/**
 * O time junto das cartas da escolha: a mesma prancheta do passo "Escolha uma posição" (FormationBoard), encolhida
 * com zoom até caber, com a vaga da vez acesa. No PC e deitado, em pé ao lado das cartas; no celular em pé, deitada
 * (gol à esquerda) em cima delas. Só mostra; tocar abre o time inteiro (Copa e Duelo).
 */
export function DraftTeam({
    run,
    byUid,
    stateOf,
    label,
    onOpen,
}: {
    /** A copa ou, no Duelo, o time montado até aqui (formação, titulares e banco). */
    run: DraftTeamRun;
    byUid: Map<string, PokemonInstance>;
    stateOf: (slot: SlotRef, uid: string) => 'locked' | 'target' | 'selected';
    label: string;
    onOpen: () => void;
}) {
    const fitRef = useRef<HTMLDivElement>(null);
    const horizontal = useMedia('(orientation: portrait)');
    useFitBoard(fitRef, `${run.lineup.join()}|${run.bench.join()}|${horizontal}`, 0.2);
    return (
        <div className="dp-team">
            <div className="dp-fit" ref={fitRef} aria-hidden="true">
                <FormationBoard
                    formation={run.formation}
                    lineup={run.lineup}
                    bench={run.bench}
                    byUid={byUid}
                    stateOf={stateOf}
                    horizontal={horizontal}
                />
            </div>
            <button type="button" className="dp-open" aria-haspopup="dialog" aria-label={label} onClick={onOpen}>
                <HudIcon kind="next" />
            </button>
        </div>
    );
}

/**
 * Draft estilo "7 a 0": formação → capitão (1 de 3 raros, qualquer vaga) → a cada rodada você escolhe a
 * vaga e saem 3 Pokémon que jogam naquela posição.
 */
export function Draft() {
    const { run, chooseFormation, chooseSlot, pick, reroll, daily } = useGame();
    const [selected, setSelected] = useState<string | null>(null);
    // formação que o carrossel mostra (só a tela; vale quando toca em "Escolher")
    const [formation, setFormation] = useState<FormationId | null>(null);
    const tr = useT();
    const { t, d, lang } = tr;
    // a tela mostra a quadra (tocar numa vaga) ou as 3 cartas, uma de cada vez, sem rolar
    const boardRef = useRef<HTMLDivElement>(null);
    const focus = run?.status === 'captain' ? (selected ? 'board' : 'options') : run?.draftSlot ? 'options' : 'board';
    const [teamOpen, setTeamOpen] = useState(false);
    const [coachOn, setCoachOn] = useState(false);
    const firstFocus = useRef(true);
    // biome-ignore lint/correctness/useExhaustiveDependencies: a cada troca de foco ou rodada
    useEffect(() => {
        if (firstFocus.current) {
            firstFocus.current = false;
            return;
        }
        // teclado: escolheu o capitão (ou a carta), o foco vai pra 1ª vaga livre; sem isso o Tab seguia nas cartas
        if (focus === 'board')
            boardRef.current?.querySelector<HTMLElement>('.slot.target')?.focus({ preventScroll: true });
    }, [focus, run?.draftRound]);
    useFitBoard(boardRef, `${focus}|${run?.draftRound}|${selected}`);
    if (!run) return null;

    // Copa Relâmpago: a 1ª formação e o 1º draft (a Rota e a Copa do Dia não entram)
    const quick = !run.daily && !isLong(run);
    if (run.status === 'formation') {
        const shown = formation ?? run.formation;
        return (
            // uma quadra por vez, nada rola; "Escolher" no polegar (cara-de-jogo.md, decisão 10)
            <>
                <Stage
                    className={`draft-stage formation-stage${coachOn ? ' coach-on' : ''}`}
                    scene={<i className="k-stage-light" />}
                >
                    {/* o dedo aponta os pontinhos do carrossel; com a dica aberta a quadra encolhe e a linha cabe
                        entre os pontinhos e o polegar, sem cobrir a placa, as palavras nem a quadra */}
                    {quick && <Coach id="relampago" targets={['.fc-dots']} onActive={setCoachOn} />}
                    <div className="draft-head bc-screenhead">
                        <span className="bc-tag">
                            {t(isLong(run) ? 'team.draft.beforeDraftRota' : 'team.draft.beforeDraft')}
                        </span>
                        <h1>{t('team.draft.chooseFormation')}</h1>
                    </div>
                    {run.daily && daily.find((e) => e.day === run.daily)?.ranked === false && (
                        <p className="muted center">{t('liga.daily.unrankedNote')}</p>
                    )}
                    <FormationCarousel value={shown} onChange={setFormation} />
                </Stage>
                <AutoDraft formation={shown}>
                    <button
                        type="button"
                        className="btn primary fc-choose"
                        onClick={() => {
                            chooseFormation(shown);
                        }}
                    >
                        {t('team.draft.chooseThis')}
                    </button>
                </AutoDraft>
            </>
        );
    }

    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const isCaptain = run.status === 'captain';
    const chosen = isCaptain ? (run.options.find((o) => o.uid === selected) ?? null) : null;
    const filled = run.lineup.filter(Boolean).map((u) => byUid.get(u)!);
    const synergies = computeSynergies(filled);
    const links = computeLinks(filled);
    const avg = lineupAverage(
        run.lineup.map((u) => (u ? byUid.get(u) : null)),
        run.formation,
    );
    const role = run.draftSlot ? slotRole(run, run.draftSlot) : null;
    const roleLabel = role === 'ANY' ? t('team.draft.theBench') : role ? d.common.pos[role] : '';

    const title = isCaptain
        ? chosen
            ? t('team.draft.whereCaptain', { name: viewInstance(chosen).displayName })
            : t('team.draft.chooseCaptain')
        : run.draftSlot
          ? role === 'ANY'
              ? t('team.draft.chooseForBench')
              : t('team.draft.chooseForSlot', { pos: roleLabel })
          : t('team.draft.chooseSlot');

    // a linha cinza só quando ensina algo além do título (nas vagas ela repetia o título e a barra de baixo)
    const hint = isCaptain ? (chosen ? t('team.draft.hintCaptainSlot') : t('team.draft.hintCaptain')) : null;

    const onSlot = (slot: SlotRef, uid: string) => {
        if (uid) return;
        if (isCaptain) {
            if (!chosen) return;
            flyCard(chosen.uid, () => {
                pick(chosen.uid, slot);
                setSelected(null);
            });
        } else {
            chooseSlot(slot);
        }
    };

    const slotState = (slot: SlotRef, uid: string) => {
        if (uid) return 'locked' as const;
        if (isCaptain) return chosen ? ('target' as const) : ('locked' as const);
        if (run.draftSlot) {
            return run.draftSlot.zone === slot.zone && run.draftSlot.index === slot.index ? 'selected' : 'locked';
        }
        return 'target' as const;
    };

    const board = (
        <FormationBoard
            formation={run.formation}
            lineup={run.lineup}
            bench={run.bench}
            byUid={byUid}
            captainUid={run.captainUid}
            preview={chosen}
            projection={chosen}
            stateOf={slotState}
            onSlot={onSlot}
            footer={
                <div className="row draft-board-foot">
                    {filled.length > 0 && <TeamAvg avg={avg} />}
                    {synergies.map((s) => (
                        <span key={s.type} className="row" style={{ gap: 4 }}>
                            <TypeBadge type={s.type} />
                            <span className="tactic-desc">
                                ×{s.count} +{Math.round((s.bonus - 1) * 100)}%
                            </span>
                        </span>
                    ))}
                    <LinkChips links={links} />
                </div>
            }
        />
    );

    return (
        <>
            {/* escolha 1 de 3 num palco (cara-de-jogo.md): ou a quadra pra tocar na vaga, ou as 3 cartas do mesmo
                tamanho; o time inteiro mora numa sheet. Nada rola. */}
            <Stage className="draft-stage pick-stage" scene={<i className="k-stage-light" />}>
                <div className="draft-head bc-screenhead">
                    <span className="bc-tag">
                        {isCaptain
                            ? t('common.ui.captain')
                            : t('team.draft.pickOf', { n: run.draftRound + 1, total: DRAFT_PICKS })}{' '}
                        · {formationText(run.formation, lang).name}
                    </span>
                    <div className="draft-title">
                        <h1>{title}</h1>
                        {hint && <p className="muted">{hint}</p>}
                    </div>
                    <div className="steps" role="img" aria-label={t('team.draft.progress')}>
                        {Array.from({ length: DRAFT_PICKS }, (_, i) => (
                            <span
                                // biome-ignore lint/suspicious/noArrayIndexKey: posições fixas do progresso
                                key={i}
                                className={i < run.draftRound ? 'done' : i === run.draftRound ? 'now' : ''}
                            />
                        ))}
                    </div>
                </div>

                {quick && (
                    <Coach
                        id="relampagoDraft"
                        targets={['.slot.empty']}
                        when={run.status === 'drafting' && !run.draftSlot}
                    />
                )}
                {focus === 'board' ? (
                    <div className="draft-board" key="board" ref={boardRef}>
                        {board}
                    </div>
                ) : (
                    <div className="draft-pick" key="options">
                        {/* o time (a prancheta, ou a faixa no celular em pé): mostra onde a carta cai; tocar abre o time inteiro */}
                        <DraftTeam
                            run={run}
                            byUid={byUid}
                            stateOf={slotState}
                            label={t('reward.yourTeam')}
                            onOpen={() => setTeamOpen(true)}
                        />
                        {/* as 3 opções saem de um pacote compacto, uma de cada vez (um toque pula) */}
                        <CardPack
                            compact
                            look={packLookOf(run.options)}
                            label={isCaptain ? t('common.ui.captain') : roleLabel}
                            revealKey={run.options.map((o) => o.uid).join()}
                        >
                            <div className="k-pick3 draft-pick3">
                                {run.options.map((o) => (
                                    <div
                                        key={o.uid}
                                        className={`option cpack-card${isBigCard(o) ? ' big' : ''}`}
                                        data-fly={o.uid}
                                    >
                                        {!isCaptain && role !== 'ANY' && newLinks(filled, o).length > 0 && (
                                            <div className="option-links">
                                                {t('team.draft.activates')}{' '}
                                                {newLinks(filled, o).map((l) => (
                                                    <LinkChip
                                                        key={l.def.id}
                                                        def={l.def}
                                                        bonus={l.bonus}
                                                        special={l.full && l.def.special}
                                                        fresh
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {!isCaptain &&
                                            role &&
                                            role !== 'ANY' &&
                                            (() => {
                                                // a carta mostra a posição principal; aqui o aviso de que ele também joga na vaga
                                                const r = ratingAt(o, role);
                                                // fora da posição de origem, o selo da carta não vale pra vaga: a faixa mostra a nota evoluída ali
                                                const evo = r.fit === 'main' ? null : evolvedRating(o, role);
                                                const full =
                                                    r.fit === 'main'
                                                        ? t('team.draft.fitMain', { pos: d.common.pos[role] })
                                                        : t(
                                                              r.fit === 'alt'
                                                                  ? 'team.draft.fitAlt'
                                                                  : 'team.draft.fitOff',
                                                              {
                                                                  pos: d.common.pos[role],
                                                                  r: r.display,
                                                              },
                                                          );
                                                // coluna estreita: só "Pivô · 55", a cor diz o resto
                                                return (
                                                    <div className={`option-fit ${r.fit}`} title={full}>
                                                        <span className="fit-long">{full}</span>
                                                        {r.fit !== 'main' && (
                                                            <span className="fit-short">
                                                                {d.common.pos[role]} · {r.display}
                                                            </span>
                                                        )}
                                                        {evo && <EvoBadge evo={evo} now={r.rating} tr={tr} />}
                                                    </div>
                                                );
                                            })()}
                                        <FutCard
                                            inst={o}
                                            captain={isCaptain}
                                            action={{
                                                label: isCaptain
                                                    ? t('team.draft.chooseThis')
                                                    : roleLabel
                                                      ? t('team.draft.signAs', { pos: roleLabel })
                                                      : t('team.draft.sign'),
                                                primary: true,
                                                onClick: () => {
                                                    // sem grito: no draft só a música (o Miguel, 22/10/2026)
                                                    if (isCaptain) setSelected(o.uid);
                                                    else flyCard(o.uid, () => pick(o.uid));
                                                },
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardPack>
                    </div>
                )}
            </Stage>
            <Sheet open={teamOpen} onClose={() => setTeamOpen(false)} title={run.teamName} className="draft-team-sheet">
                {board}
            </Sheet>

            {/* o polegar: "Monta pra mim" e, nas cartas, sortear de novo; capitão escolhido, voltar pras cartas */}
            {focus === 'options' ? (
                <AutoDraft captainUid={chosen?.uid}>
                    <button
                        type="button"
                        className="btn"
                        disabled={run.rerolls <= 0}
                        onClick={() => {
                            reroll();
                            setSelected(null);
                        }}
                    >
                        <HudIcon kind="reroll" />
                        {t('team.draft.reroll', { n: run.rerolls })}
                    </button>
                </AutoDraft>
            ) : chosen ? (
                <AutoDraft captainUid={chosen.uid}>
                    <button type="button" className="btn ghost" onClick={() => setSelected(null)}>
                        {t('team.draft.autoBack')}
                    </button>
                </AutoDraft>
            ) : (
                <AutoDraft hint={title} />
            )}
        </>
    );
}
