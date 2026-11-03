import { useEffect, useState } from 'react';
import { species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { editionOf, ICONS } from '../../engine/specials';
import {
    JOGADAS,
    type Jogada,
    jogadaOf,
    upgradeOf,
    type WalkTier,
    walkoutPlan,
    walkTier,
} from '../../game/walkout-plan';
import { useT } from '../../i18n/react';
import { MenuHead } from '../components/MenuHead';
import { WalkoutStage } from '../kit/WalkoutStage';
import { reduceMotionOn } from '../reduce-motion';

/**
 * Laboratório do walkout final (`?lab=walkout`, só dev e prévias; ut-walkout.md). `&ed=icone|destaque|evento|shiny|
 * ouro85|ouro75&id=<pokédex>` escolhe a carta; `&jogada=<nome>` força a jogada; `&up=1|0` força o upgrade do especial
 * (sem: metade, pela carta); `&dia=N` simula o N-ésimo do nível no dia; `&reduce=1` simula Reduzir movimento;
 * `&v=2` a versão 2 (mais animada, pra comparar); `&auto=1` já abre (a gravação espera `window.__wkStart`).
 */
type LabEd = 'icone' | 'destaque' | 'evento' | 'shiny' | 'ouro85' | 'ouro75';
const PRESETS: [string, LabEd, number][] = [
    ['Ícone', 'icone', 150],
    ['Destaque', 'destaque', 149],
    ['Evento', 'evento', 25],
    ['Shiny', 'shiny', 6],
    ['Ouro 85+', 'ouro85', 149],
    ['Ouro 75', 'ouro75', 59],
];

/** A carta do laboratório: a espécie com a edição pedida; ouro 75 e 85 acham um nível com a nota na faixa. */
function labCard(ed: LabEd, id: number): PokemonInstance {
    const make = (lv?: number) => createInstance(id, new Rng('walkout-lab', `${ed}-${id}`), lv);
    let inst = make();
    if (ed === 'ouro75') for (let lv = 49; lv > 1 && viewInstance(inst).overall > 84; lv--) inst = make(lv);
    if (ed === 'ouro85') for (let lv = 51; lv <= 100 && viewInstance(inst).overall < 85; lv++) inst = make(lv);
    if (ed === 'icone') return { ...inst, special: { kind: 'icone', title: ICONS[id] } };
    if (ed === 'destaque') return { ...inst, special: { kind: 'destaque', level: 1 } };
    if (ed === 'evento') return { ...inst, special: { kind: 'evento', type: species(id).types[0] } };
    if (ed === 'shiny') return { ...inst, shiny: true };
    return inst;
}

export function WalkoutLab({ onExit }: { onExit: () => void }) {
    const { d } = useT();
    const [q] = useState(() => new URLSearchParams(window.location.search));
    const ed = (PRESETS.find((p) => p[1] === q.get('ed'))?.[1] ?? 'icone') as LabEd;
    const id = Math.min(151, Math.max(1, Number(q.get('id')) || (PRESETS.find((p) => p[1] === ed)?.[2] ?? 150)));
    const [inst] = useState(() => labCard(ed, id));
    const tier: WalkTier = ed === 'ouro75' ? 'raro' : (walkTier(editionOf(inst), viewInstance(inst).overall) ?? 'raro');
    const jogada = JOGADAS.includes(q.get('jogada') as Jogada) ? (q.get('jogada') as Jogada) : undefined;
    const plan = walkoutPlan(tier, {
        nth: Number(q.get('dia')) || 1,
        reduce: q.get('reduce') === '1' || reduceMotionOn(),
        upgrade: q.has('up') ? q.get('up') === '1' : upgradeOf(inst),
        v2: q.get('v') === '2',
    });
    const manual = (window as unknown as { __wkManual?: boolean }).__wkManual;
    const [open, setOpen] = useState(() => (q.get('auto') === '1' && !manual ? 1 : 0));
    useEffect(() => {
        (window as unknown as { __wkStart?: () => void }).__wkStart = () => setOpen(1);
    }, []);
    const view = viewInstance(inst);
    return (
        <div className="wkl">
            <MenuHead title="Walkout" hud="cards" onBack={onExit} />
            <p className="muted">
                {view.displayName} · {view.overall} · {tier} · {plan.kind} · {(jogada ?? jogadaOf(id)).toString()}
                {plan.upgrade ? ' · upgrade' : ''}
                {plan.v2 ? ' · v2' : ''}
            </p>
            <div className="wkl-presets">
                {PRESETS.map(([label, e, pid]) => (
                    <a key={e} className="btn small" href={`?lab=walkout&ed=${e}&id=${pid}`}>
                        {label}
                    </a>
                ))}
            </div>
            <button type="button" className="btn confirm big wkl-open" onClick={() => setOpen((n) => n + 1)}>
                {open ? d.ultimate.walkout.again : d.ultimate.walkout.open}
            </button>
            {open > 0 && <WalkoutStage key={open} inst={inst} plan={plan} jogada={jogada} onDone={() => setOpen(0)} />}
        </div>
    );
}
