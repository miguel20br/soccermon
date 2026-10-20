import { useState } from 'react';
import { useT } from '../../i18n/react';
import type { MedalProgress } from '../../store/medals';
import { MEDALS } from '../../store/medals';
import { BELTS, METALS, type MetalCount } from '../../store/trophies';
import { HudIcon } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { type ArtKind, PixelTrophy } from '../components/PixelTrophy';
import type { Metal } from '../rarity';
import { RoomDialog } from '../trophy/RoomDialog';
import { type RoomData, RoomScene, type Spot } from '../trophy/RoomScene';
import '../trophy-room.css';
import '../room-lab.css';

/**
 * `?lab=sala` (dev e prévias): a mesma sala de troféus em 4 direções, com os mesmos números, pro Miguel comparar e
 * descobrir do que gosta (docs/planos/menus-e-sala.md). Esboços de direção, não arte final.
 */
const CUPS: MetalCount = { bronze: 4, prata: 2, ouro: 3 };
const DAYS: MetalCount = { bronze: 0, prata: 5, ouro: 3 };
const DUEL_WINS = 12;
const MEDALS_FAKE: MedalProgress[] = MEDALS.map((medal, i) => ({
    medal,
    value: 0,
    tier: ([3, 2, 2, 1, 4, 2, 0, 1, 3, 2, 1, 1, 2, 0, 3, 1, 2, 1, 0, 2][i] ?? 1) as MedalProgress['tier'],
    next: null,
}));
const ROOM: RoomData = {
    level: 'clube',
    club: 0x3a7bd5,
    cups: CUPS,
    days: DAYS,
    weeks: 1,
    duelWins: DUEL_WINS,
    medals: MEDALS_FAKE,
    platinum: false,
    glass: ['ouro', 'prata', 'bronze'],
    tv: { speciesId: 6, shiny: true },
};
const NAME: Record<Metal, string> = { bronze: 'bronze', prata: 'prata', ouro: 'ouro' };

interface Piece {
    id: string;
    kind: ArtKind;
    metal: Metal;
    n: number;
    name: string;
    text: string;
}
const PIECES: Piece[] = [
    ...METALS.map((m) => ({
        id: `copa-${m}`,
        kind: 'taca' as const,
        metal: m,
        n: CUPS[m],
        name: `Taça de ${NAME[m]}`,
        text: `Taça de ${NAME[m]} ×${CUPS[m]}. ${m === 'ouro' ? 'Campeão sem sofrer gol.' : m === 'prata' ? 'Campeão sem pênaltis.' : 'Campeão da Copa.'}`,
    })),
    ...METALS.map((m) => ({
        id: `dia-${m}`,
        kind: 'medalhao' as const,
        metal: m,
        n: DAYS[m],
        name: `Medalhão de ${NAME[m]}`,
        text: DAYS[m] ? `Medalhão de ${NAME[m]} ×${DAYS[m]} na Copa do Dia.` : 'Ganhe 2 partidas na Copa do Dia.',
    })),
    ...BELTS.map((b) => ({
        id: `cinto-${b.wins}`,
        kind: 'cinturao' as const,
        metal: b.metal,
        n: DUEL_WINS >= b.wins ? 1 : 0,
        name: `Cinturão de ${b.wins}`,
        text:
            DUEL_WINS >= b.wins
                ? `Cinturão de ${b.wins} vitórias no Duelo.`
                : `Vença ${b.wins} duelos. Você tem ${DUEL_WINS}.`,
    })),
];

/** B. Museu do clube: escuro como o resto do jogo, vitrines com holofote, troféus grandes que brilham. */
function Museum() {
    const [on, setOn] = useState<Piece | null>(null);
    return (
        <div className="lab-museum">
            {(['taca', 'medalhao', 'cinturao'] as const).map((k) => (
                <div key={k} className="lm-row">
                    {PIECES.filter((p) => p.kind === k).map((p) => (
                        <button
                            type="button"
                            key={p.id}
                            className={`lm-case${on?.id === p.id ? ' on' : ''}${p.n ? '' : ' empty'}`}
                            onClick={() => setOn(on?.id === p.id ? null : p)}
                        >
                            <span className="lm-light" aria-hidden />
                            <PixelTrophy kind={p.kind} metal={p.metal} ghost={!p.n} />
                            <b className="lm-plate">
                                {p.name}
                                {p.n > 1 && <em>×{p.n}</em>}
                            </b>
                        </button>
                    ))}
                </div>
            ))}
            {on && <p className="lm-say">{on.text}</p>}
        </div>
    );
}

/** C. Estante que desliza: uma prateleira grande por vez (Copa, Copa do Dia, Duelo), troféus enormes. */
function Shelf() {
    const shelves = [
        { title: 'Copa', kind: 'taca' as const },
        { title: 'Copa do Dia', kind: 'medalhao' as const },
        { title: 'Duelo', kind: 'cinturao' as const },
    ];
    const [i, setI] = useState(0);
    const [flip, setFlip] = useState<string | null>(null);
    const s = shelves[i];
    return (
        <div className="lab-shelf">
            <div className="ls-head">
                <button type="button" className="btn small" onClick={() => setI((i + 2) % 3)} aria-label="Anterior">
                    <HudIcon kind="prev" />
                </button>
                <b>{s.title}</b>
                <button type="button" className="btn small" onClick={() => setI((i + 1) % 3)} aria-label="Próxima">
                    <HudIcon kind="next" />
                </button>
            </div>
            <div className="ls-board" key={s.kind}>
                {PIECES.filter((p) => p.kind === s.kind).map((p) => (
                    <button
                        type="button"
                        key={p.id}
                        className={`ls-item${flip === p.id ? ' flip' : ''}`}
                        onClick={() => setFlip(flip === p.id ? null : p.id)}
                    >
                        <span className="ls-front">
                            <PixelTrophy kind={p.kind} metal={p.metal} ghost={!p.n} />
                            {p.n > 1 && <em>×{p.n}</em>}
                        </span>
                        <span className="ls-back">{p.text}</span>
                    </button>
                ))}
            </div>
            <div className="ls-plank" aria-hidden />
        </div>
    );
}

/** D. Game Boy: a tela de 4 tons do Red/Blue, uma lista como o menu de itens, o troféu escolhido grande em cima. */
function GameBoy() {
    const [k, setK] = useState(0);
    const p = PIECES[k];
    return (
        <div className="lab-gb">
            <div className="gb-screen">
                <div className="gb-show">
                    <PixelTrophy kind={p.kind} metal={p.metal} ghost={!p.n} gb />
                </div>
                <ul className="gb-list">
                    {PIECES.map((x, j) => (
                        <li key={x.id}>
                            <button type="button" className={j === k ? 'on' : ''} onClick={() => setK(j)}>
                                <span className="gb-cursor" aria-hidden />
                                {x.name.toUpperCase()}
                                <span className="gb-n">{x.n ? `×${x.n}` : '--'}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="gb-box">{p.text}</p>
            </div>
        </div>
    );
}

export function RoomLab({ onExit }: { onExit: () => void }) {
    const [say, setSay] = useState<Spot | null>(null);
    const { d } = useT();
    return (
        <div className="menu-screen room-lab">
            <MenuHead title="Sala de troféus · direções" icon="liga" onBack={onExit} />
            <p className="muted">
                Os mesmos números nas 4 direções (9 títulos, 12 vitórias no Duelo). Toque nas coisas: cada uma responde
                no lugar, sem levar a página pra baixo. São esboços de direção, não a arte final.
            </p>

            <section className="panel lab-dir">
                <h2 className="bc-caption">A · Quarto FireRed (o de agora)</h2>
                <p className="muted">O quarto do Red visto de cima, com móveis desenhados por código.</p>
                <RoomScene data={ROOM} onPick={(_, spot) => setSay(spot)}>
                    {say && <RoomDialog key={say} text={`${d.trophies.spots[say]}.`} onClose={() => setSay(null)} />}
                </RoomScene>
            </section>

            <section className="panel lab-dir">
                <h2 className="bc-caption">B · Museu do clube</h2>
                <p className="muted">
                    Escuro como o resto do jogo, vitrines com holofote, troféus grandes e brilhando. Menos cenário, mais
                    troféu.
                </p>
                <Museum />
            </section>

            <section className="panel lab-dir">
                <h2 className="bc-caption">C · Estante que desliza</h2>
                <p className="muted">Uma prateleira por vez, troféus enormes; tocar vira o troféu e mostra o que é.</p>
                <Shelf />
            </section>

            <section className="panel lab-dir">
                <h2 className="bc-caption">D · Game Boy (Red/Blue)</h2>
                <p className="muted">A tela de 4 tons do Game Boy, com a lista igual ao menu de itens.</p>
                <GameBoy />
            </section>
        </div>
    );
}
