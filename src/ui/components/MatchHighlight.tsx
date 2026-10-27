import { useEffect, useRef, useState } from 'react';
import { EventBus } from '../../game/EventBus';
import { claimOverlay, onOverlayClaim, PRIO_GOAL, PRIO_MOVE } from '../../game/overlay-slot';
import type { MatchHighlight as Highlight } from '../../game/scenes/MatchScene';
import { useT } from '../../i18n/react';
import { portraitSrc } from '../portrait';
import { ShinySpark } from '../profile/icons';
import { HudIcon } from './MatchHud';

/** Quanto tempo (real) a faixa fica na tela; a evolução do rival fica mais (era 2,6 s). */
const SHOW_MS = 2600;
const RIVAL_EVO_SHOW_MS = 3500;

/** Rostinho do PMDCollab: comemorando no gol, concentrado na defesa (cai no normal se não tiver). */
function portraitOf(speciesId: number, kind: Highlight['kind']): string {
    const want = kind === 'save' ? 'determined' : kind === 'goal' || kind === 'rivalEvolve' ? 'happy' : null;
    return portraitSrc(speciesId, want ? [want] : []);
}

/** Faixa diagonal no canto do time com o rosto, o nome e o time de quem fez o gol ou a defesa. */
export function MatchHighlight({ teamNames, colors }: { teamNames: [string, string]; colors: [string, string] }) {
    const [shown, setShown] = useState<(Highlight & { id: number; leaving?: boolean }) | null>(null);
    const { t, d } = useT();
    const nextId = useRef(0);

    useEffect(() => {
        let timer = 0;
        const onHighlight = (h: Highlight) => {
            const ms = h.kind === 'rivalEvolve' ? RIVAL_EVO_SHOW_MS : SHOW_MS;
            // celular: uma sobreposição por vez (overlay-slot.ts); gol e defesa valem como gol, o resto como golpe
            const big = h.kind === 'goal' || h.kind === 'owngoal' || h.kind === 'save';
            if (!claimOverlay('highlight', big ? PRIO_GOAL : PRIO_MOVE, ms)) return;
            setShown({ ...h, id: nextId.current++ });
            clearTimeout(timer);
            timer = window.setTimeout(() => setShown(null), ms);
        };
        EventBus.on('match:highlight', onHighlight);
        // outra sobreposição pegou a vaga: a faixa sai em 200 ms (nada teleporta)
        const off = onOverlayClaim((id) => {
            if (id === 'highlight') return;
            clearTimeout(timer);
            setShown((s) => s && { ...s, leaving: true });
            timer = window.setTimeout(() => setShown(null), 200);
        });
        return () => {
            EventBus.off('match:highlight', onHighlight);
            off();
            clearTimeout(timer);
        };
    }, []);

    if (!shown) return null;
    const side = shown.team === 0 ? 'left' : 'right';
    return (
        <div
            key={shown.id}
            className={`mh mh-${side} mh-${shown.kind}${shown.leaving ? ' mh-leaving' : ''}`}
            style={{ ['--team' as string]: colors[shown.team] }}
            aria-live="polite"
        >
            {shown.outSpeciesId !== undefined && (
                <>
                    <div className="mh-face mh-out">
                        <img className="pixel" src={portraitOf(shown.outSpeciesId, 'sub')} alt="" />
                    </div>
                    <span className="mh-arrow" aria-hidden>
                        <HudIcon kind="next" />
                    </span>
                </>
            )}
            <div className="mh-face">
                <img className="pixel" src={portraitOf(shown.speciesId, shown.kind)} alt="" />
                {shown.shiny && <ShinySpark className="mh-shiny" />}
            </div>
            <div className="mh-text">
                {/* evolução do rival: o nome do time (na cor dele) no lugar de "RIVAL" */}
                <span className="mh-kind">
                    {shown.kind === 'rivalEvolve' ? teamNames[shown.team] : d.match.highlight[shown.kind]}
                </span>
                <strong className="mh-name">
                    {shown.kind === 'sub'
                        ? t('match.subIn', { name: shown.name })
                        : shown.kind === 'rivalEvolve'
                          ? t('match.rivalEvolved', { name: shown.outName ?? '' })
                          : shown.name}
                </strong>
                <span className="mh-team">
                    {shown.kind === 'sub'
                        ? t('match.subOut', { name: shown.outName ?? '' })
                        : shown.kind === 'rivalEvolve'
                          ? t('match.evolvedRival', { name: shown.name })
                          : teamNames[shown.team]}
                </span>
            </div>
        </div>
    );
}
