import { useEffect, useRef, useState } from 'react';
import portraits from '../../data/portraits.json';
import { EventBus } from '../../game/EventBus';
import type { MatchHighlight as Highlight } from '../../game/scenes/MatchScene';
import { useT } from '../../i18n/react';

const EMOTIONS = portraits as Record<string, string[]>;
/** Quanto tempo (real) a faixa fica na tela. */
const SHOW_MS = 2600;

/** Rostinho do PMDCollab: comemorando no gol, concentrado na defesa (cai no normal se não tiver). */
function portraitOf(speciesId: number, kind: Highlight['kind']): string {
    const want = kind === 'save' ? 'determined' : kind === 'goal' || kind === 'rivalEvolve' ? 'happy' : null;
    const has = want && EMOTIONS[speciesId]?.includes(want);
    return `assets/portraits/${speciesId}${has ? `-${want}` : ''}.png`;
}

/** Faixa diagonal no canto do time com o rosto, o nome e o time de quem fez o gol ou a defesa. */
export function MatchHighlight({ teamNames, colors }: { teamNames: [string, string]; colors: [string, string] }) {
    const [shown, setShown] = useState<(Highlight & { id: number }) | null>(null);
    const { t, d } = useT();
    const nextId = useRef(0);

    useEffect(() => {
        let timer = 0;
        const onHighlight = (h: Highlight) => {
            setShown({ ...h, id: nextId.current++ });
            clearTimeout(timer);
            timer = window.setTimeout(() => setShown(null), SHOW_MS);
        };
        EventBus.on('match:highlight', onHighlight);
        return () => {
            EventBus.off('match:highlight', onHighlight);
            clearTimeout(timer);
        };
    }, []);

    if (!shown) return null;
    const side = shown.team === 0 ? 'left' : 'right';
    return (
        <div
            key={shown.id}
            className={`mh mh-${side} mh-${shown.kind}`}
            style={{ ['--team' as string]: colors[shown.team] }}
            aria-live="polite"
        >
            {shown.outSpeciesId !== undefined && (
                <>
                    <div className="mh-face mh-out">
                        <img className="pixel" src={portraitOf(shown.outSpeciesId, 'sub')} alt="" />
                    </div>
                    <span className="mh-arrow" aria-hidden>
                        ➜
                    </span>
                </>
            )}
            <div className="mh-face">
                <img className="pixel" src={portraitOf(shown.speciesId, shown.kind)} alt="" />
                {shown.shiny && <span className="mh-shiny">✦</span>}
            </div>
            <div className="mh-text">
                <span className="mh-kind">{d.match.highlight[shown.kind]}</span>
                <strong className="mh-name">
                    {shown.kind === 'sub' ? t('match.subIn', { name: shown.name }) : shown.name}
                </strong>
                <span className="mh-team">
                    {shown.kind === 'sub'
                        ? t('match.subOut', { name: shown.outName ?? '' })
                        : shown.kind === 'rivalEvolve'
                          ? t('match.evolvedRival', { name: shown.outName ?? '' })
                          : teamNames[shown.team]}
                </span>
            </div>
        </div>
    );
}
