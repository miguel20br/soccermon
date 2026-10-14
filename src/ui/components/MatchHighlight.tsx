import { useEffect, useRef, useState } from 'react';
import portraits from '../../data/portraits.json';
import { EventBus } from '../../game/EventBus';
import type { MatchHighlight as Highlight } from '../../game/scenes/MatchScene';

const EMOTIONS = portraits as Record<string, string[]>;
/** Quanto tempo (real) a faixa fica na tela. */
const SHOW_MS = 2600;

const KIND_LABEL: Record<Highlight['kind'], string> = {
    goal: 'GOL!',
    owngoal: 'GOL CONTRA',
    save: 'DEFESA!',
};

/** Rostinho do PMDCollab: comemorando no gol, concentrado na defesa (cai no normal se não tiver). */
function portraitOf(h: Highlight): string {
    const want = h.kind === 'save' ? 'determined' : h.kind === 'goal' ? 'happy' : null;
    const has = want && EMOTIONS[h.speciesId]?.includes(want);
    return `assets/portraits/${h.speciesId}${has ? `-${want}` : ''}.png`;
}

/** Faixa diagonal no canto do time com o rosto, o nome e o time de quem fez o gol ou a defesa. */
export function MatchHighlight({ teamNames, colors }: { teamNames: [string, string]; colors: [string, string] }) {
    const [shown, setShown] = useState<(Highlight & { id: number }) | null>(null);
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
            <div className="mh-face">
                <img className="pixel" src={portraitOf(shown)} alt="" />
                {shown.shiny && <span className="mh-shiny">✦</span>}
            </div>
            <div className="mh-text">
                <span className="mh-kind">{KIND_LABEL[shown.kind]}</span>
                <strong className="mh-name">{shown.name}</strong>
                <span className="mh-team">{teamNames[shown.team]}</span>
            </div>
        </div>
    );
}
