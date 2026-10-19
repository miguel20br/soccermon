import { useEffect, useMemo, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { aiDraftTeam } from '../../engine/draft';
import { createInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import type { MatchResult } from '../../engine/runners/batch-runner';
import type { TeamSetup } from '../../engine/state';
import { EventBus } from '../../game/EventBus';
import { useT } from '../../i18n/react';
import { EMOTES } from '../../net/duel-state';
import { useDuel } from '../../net/session';
import { PhaserGame } from '../../PhaserGame';
import { useGame } from '../../store/game-store';
import { type Clock, hex, Scoreboard, useClockParts } from '../components/MatchHud';
import { captainAt } from '../match-view';
import { reduceMotionOn } from '../settings-sync';
import { simulateMatch } from '../sim-client';
import { EmoteBar, EmoteBubbles, RivalEmotes } from './Emotes';
import { rivalEmotes } from './emote-faces';
import './duel.css';

const BLUE = 0x3b6dff;
const RED = 0xe0403a;

/** Time da IA com o capitão escolhido no lugar do capitão dela. */
function labTeam(seed: string, name: string, captain: number, color: number): TeamSetup {
    const d = aiDraftTeam(new Rng(seed, 'team'), 1);
    const cap = createInstance(captain, new Rng(`${seed}-${captain}`, 'cap'));
    const lineup = d.lineup.map((p) => (p.uid === d.captainUid ? cap : p));
    return { name, ...d, lineup, captainUid: cap.uid, tactic: 'balanced', color };
}

/**
 * `?lab=emotes`: os emotes sem precisar de sala, numa partida de verdade entre dois times da IA (você é o da
 * esquerda). Duelo: o rival manda um emote a cada 3,5 s (dá pra pausar) e o "Vamooo!" faz o capitão posar em quadra.
 * Copa (`&modo=copa`): o capitão do líder rival reage aos gols. Escolha o capitão de cada lado pra ver as caras (quem
 * não tem a emoção cai no rosto normal).
 */
export function EmoteLab({ onExit }: { onExit: () => void }) {
    const { t, d } = useT();
    const settings = useGame((s) => s.settings);
    const [mine, setMine] = useState(25);
    const [theirs, setTheirs] = useState(6);
    const [auto, setAuto] = useState(true);
    const [mode, setMode] = useState<'duel' | 'cup'>(() =>
        new URLSearchParams(window.location.search).get('modo') === 'copa' ? 'cup' : 'duel',
    );
    const setups = useMemo<[TeamSetup, TeamSetup]>(
        () => [labTeam('lab-a', 'Pallet FC', mine, BLUE), labTeam('lab-b', 'Rival FC', theirs, RED)],
        [mine, theirs],
    );
    const [match, setMatch] = useState<MatchResult | null>(null);
    const [fonts, setFonts] = useState(false);
    const [clock, setClock] = useState<Clock>({ tick: 0, minute: 0, half: 1, score: [0, 0], phase: 'kickoff' });
    useEffect(() => {
        let alive = true;
        Promise.all([document.fonts.load('10px Galmuri11'), document.fonts.load('bold 10px Galmuri11')])
            .catch(() => {})
            .finally(() => alive && setFonts(true));
        return () => {
            alive = false;
        };
    }, []);
    useEffect(() => {
        let alive = true;
        setMatch(null);
        simulateMatch(setups[0], setups[1], `lab-${setups[0].captainUid}-${setups[1].captainUid}`).then(
            (r) => alive && setMatch(r),
        );
        return () => {
            alive = false;
        };
    }, [setups]);
    useEffect(() => {
        const onTick = (c: Clock) => setClock(c);
        EventBus.on('match:tick', onTick);
        return () => {
            EventBus.off('match:tick', onTick);
        };
    }, []);
    useEffect(() => {
        if (!auto || mode !== 'duel') return;
        let i = 0;
        const id = window.setInterval(() => {
            useDuel.setState({ emote: { kind: EMOTES[i++ % EMOTES.length], role: 'guest', at: Date.now() } });
        }, 3500);
        return () => clearInterval(id);
    }, [auto, mode]);
    const plan = useMemo(() => (match ? rivalEmotes(match.events, 1) : []), [match]);
    const clockParts = useClockParts(clock, false, null, false);
    // biome-ignore lint/correctness/useExhaustiveDependencies: a cena só lê os dados na montagem
    const sceneData = useMemo(
        () =>
            match && {
                result: match,
                colors: [BLUE, RED] as [number, number],
                cries: settings.cries,
                speed: 4 as const,
                cinematic: false,
                namesOnField: settings.namesOnField,
                reduceMotion: reduceMotionOn(settings.reduceMotion),
            },
        [match],
    );
    const caps = match ? ([0, 1] as const).map((tm) => captainAt(match, setups, tm, clock.tick)) : null;
    const pose = (tm: 0 | 1) => {
        const idx = caps?.[tm].idx;
        if (idx !== null && idx !== undefined) EventBus.emit('match:captain-pose', idx);
    };
    const pick = (label: string, value: number, set: (n: number) => void) => (
        <select aria-label={label} value={value} onChange={(e) => set(Number(e.target.value))}>
            {SPECIES.map((sp) => (
                <option key={sp.id} value={sp.id}>
                    #{sp.id} {sp.name}
                </option>
            ))}
        </select>
    );
    const captains: [number, number] = caps ? [caps[0].speciesId, caps[1].speciesId] : [mine, theirs];
    return (
        <div className="bc duel emote-lab">
            <div className="bc-head">
                <Scoreboard
                    names={['Pallet FC', 'Rival FC']}
                    tags={['PAL', 'RIV']}
                    colors={[BLUE, RED]}
                    score={clock.score}
                    clock={clockParts}
                    stage={mode === 'cup' ? t('match.cup') : t('duel.title')}
                >
                    {mode === 'duel' ? (
                        <EmoteBubbles mySide="left" captains={captains} colors={[hex(BLUE), hex(RED)]} onPose={pose} />
                    ) : (
                        match && (
                            <RivalEmotes
                                plan={plan}
                                tick={clock.tick}
                                side={1}
                                speciesId={captains[1]}
                                color={hex(RED)}
                                onPose={() => pose(1)}
                            />
                        )
                    )}
                </Scoreboard>
            </div>
            <div className="bc-stage">
                <div className="pitch-wrap">
                    {fonts && sceneData ? (
                        <PhaserGame key={String(match?.seed)} data={sceneData} />
                    ) : (
                        <div className="phaser-container" />
                    )}
                </div>
            </div>
            <div className="panel emote-lab-ctl">
                <span className="emote-lab-row">
                    {t('duel.emotes.lab.mode')}
                    <select
                        aria-label={t('duel.emotes.lab.mode')}
                        value={mode}
                        onChange={(e) => setMode(e.target.value as 'duel' | 'cup')}
                    >
                        <option value="duel">{d.duel.emotes.lab.duel}</option>
                        <option value="cup">{d.duel.emotes.lab.cup}</option>
                    </select>
                </span>
                <span className="emote-lab-row">
                    {t('duel.emotes.lab.mine')} {pick(t('duel.emotes.lab.mine'), mine, setMine)}
                </span>
                <span className="emote-lab-row">
                    {t('duel.emotes.lab.theirs')} {pick(t('duel.emotes.lab.theirs'), theirs, setTheirs)}
                </span>
                {mode === 'duel' && (
                    <>
                        <label>
                            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />{' '}
                            {t('duel.emotes.lab.auto')}
                        </label>
                        <EmoteBar captain={captains[0]} />
                    </>
                )}
                <button type="button" className="btn" onClick={onExit}>
                    {t('common.ui.back')}
                </button>
            </div>
        </div>
    );
}
