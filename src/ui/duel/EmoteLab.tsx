import { useEffect, useState } from 'react';
import { SPECIES } from '../../engine/data';
import { EMOTES } from '../../net/duel-state';
import { useDuel } from '../../net/session';
import { hex, Scoreboard } from '../components/MatchHud';
import { EmoteBar, EmoteBubbles } from './Emotes';
import './duel.css';

const BLUE = 0x3b6dff;
const RED = 0xe0403a;

/**
 * `?lab=emotes`: os emotes do Duelo sem precisar de sala. Você é o time da esquerda; o rival manda um emote a cada
 * 3,5 s (dá pra pausar). Escolha o capitão de cada lado pra ver as caras (quem não tem a emoção cai no rosto normal).
 */
export function EmoteLab({ onExit }: { onExit: () => void }) {
    const [mine, setMine] = useState(25);
    const [theirs, setTheirs] = useState(6);
    const [auto, setAuto] = useState(true);
    useEffect(() => {
        if (!auto) return;
        let i = 0;
        const id = window.setInterval(() => {
            useDuel.setState({ emote: { kind: EMOTES[i++ % EMOTES.length], role: 'guest', at: Date.now() } });
        }, 3500);
        return () => clearInterval(id);
    }, [auto]);
    const pick = (label: string, value: number, set: (n: number) => void) => (
        <select aria-label={label} value={value} onChange={(e) => set(Number(e.target.value))}>
            {SPECIES.map((sp) => (
                <option key={sp.id} value={sp.id}>
                    #{sp.id} {sp.name}
                </option>
            ))}
        </select>
    );
    return (
        <div className="bc duel emote-lab">
            <div className="bc-head">
                <Scoreboard
                    names={['Pallet FC', 'Rival FC']}
                    tags={['PAL', 'RIV']}
                    colors={[BLUE, RED]}
                    score={[2, 1]}
                    clock={{ main: "14'", sub: '2º', text: false, progress: 0.7 }}
                    stage="Duelo"
                >
                    <EmoteBubbles mySide="left" captains={[mine, theirs]} colors={[hex(BLUE), hex(RED)]} />
                </Scoreboard>
            </div>
            <div className="emote-lab-pitch" />
            <div className="panel emote-lab-ctl">
                <span className="emote-lab-row">Seu capitão {pick('Seu capitão', mine, setMine)}</span>
                <span className="emote-lab-row">Capitão rival {pick('Capitão rival', theirs, setTheirs)}</span>
                <label>
                    <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Rival manda
                    sozinho
                </label>
                <EmoteBar captain={mine} />
                <button type="button" className="btn" onClick={onExit}>
                    Sair
                </button>
            </div>
        </div>
    );
}
