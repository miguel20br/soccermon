import type Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { cardTypeOf, editionOf, ICONS } from '../../engine/specials';
import type { WalkoutData, WalkoutScene } from '../../game/scenes/WalkoutScene';
import { entryOf, homeOf, type WalkTier, walkTier } from '../../game/walkout-plan';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { KantoBadge } from '../components/BadgeCase';
import { MenuHead } from '../components/MenuHead';
import { BADGE_OF } from '../kit/MomentStage';
import { editionLabel } from '../rarity';
import { reduceMotionOn } from '../reduce-motion';
import { TYPE_COLOR } from '../type-colors';
import './walkout-lab.css';

/**
 * Laboratório do walkout em Phaser (`?lab=walkout&motor=phaser`, só dev e prévias; ut-walkout.md, "Decidido com o
 * Miguel"): a cena vem por import dinâmico só quando o pacote abre, montada por cima da tela. `&ed=icone|destaque|
 * shiny|ouro85|ouro75&id=<pokédex>` escolhe a carta; `&up=1|0` força o upgrade do especial (sem ele, metade das
 * vezes); `&reduce=1` simula Reduzir movimento.
 */
const PRESETS: [string, string, number][] = [
    ['Ícone', 'icone', 150],
    ['Destaque', 'destaque', 149],
    ['Shiny', 'shiny', 6],
    ['Ouro 85+', 'ouro85', 149],
    ['Ouro 75', 'ouro75', 59],
];

/** A carta do laboratório: a edição pedida e, no ouro, o nível que põe a nota na faixa (75–84 ou 85+). */
function labCard(q: URLSearchParams): { inst: PokemonInstance; tier: WalkTier } {
    const ed = q.get('ed') ?? 'icone';
    const id = Math.min(151, Math.max(1, Number(q.get('id')) || 150));
    let inst: PokemonInstance = { ...createInstance(id, new Rng('walkout-lab')), shiny: ed === 'shiny' };
    if (ed === 'icone') inst.special = { kind: 'icone', title: ICONS[id] };
    if (ed === 'destaque') inst.special = { kind: 'destaque', level: 1 };
    const ovr = () => viewInstance(inst).overall;
    if (ed === 'ouro75') while (inst.level > 1 && ovr() > 84) inst = { ...inst, level: inst.level - 1 };
    if (ed === 'ouro85') while (inst.level < 100 && ovr() < 85) inst = { ...inst, level: inst.level + 1 };
    const tier = ed === 'ouro75' ? 'raro' : (walkTier(editionOf(inst), ovr()) ?? 'raro');
    return { inst, tier };
}

/** A insígnia SVG (desenhada em React) num canvas pro Phaser. */
async function rasterBadge(svg: SVGSVGElement | null | undefined): Promise<HTMLCanvasElement | null> {
    if (!svg) return null;
    const src = svg.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"');
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;
    try {
        await img.decode();
    } catch {
        return null;
    }
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    c.getContext('2d')?.drawImage(img, 0, 0, 24, 24);
    return c;
}

export function WalkoutPhaserLab({ onExit }: { onExit: () => void }) {
    const { d, lang } = useT();
    const [q] = useState(() => new URLSearchParams(window.location.search));
    const [{ inst, tier }] = useState(() => labCard(q));
    const [open, setOpen] = useState(0);
    const badgeRef = useRef<HTMLSpanElement>(null);
    const view = viewInstance(inst);
    const type = cardTypeOf(inst);
    const leader = BADGE_OF[type];
    const ed = editionOf(inst);

    const data = async (): Promise<WalkoutData> => {
        const pos = view.naturalPosition;
        const attrs = (Object.keys(view.attributes) as (keyof typeof view.attributes)[])
            .filter((k) => k !== 'goalkeeping' || pos === 'GK')
            .map((k) => ({ label: d.common.attrShort[k], v: Math.round(view.attributes[k]) }))
            .sort((a, b) => b.v - a.v)
            .slice(0, 4);
        return {
            tier,
            edition: ed,
            speciesId: inst.speciesId,
            shiny: inst.shiny,
            name: view.displayName,
            title: inst.special?.title,
            overall: view.overall,
            posShort: d.common.posShort[pos],
            posLong: d.common.pos[pos],
            type,
            typeLabel: typeName(type),
            typeColor: Number.parseInt((TYPE_COLOR[type] ?? '#3a7bd5').slice(1), 16),
            editionLabel: ed ? editionLabel(ed) : d.common.metal.ouro,
            home: homeOf(inst.speciesId, lang === 'pt'),
            badge: leader ? await rasterBadge(badgeRef.current?.querySelector('svg')) : null,
            attrs,
            upgrade: q.has('up') ? q.get('up') === '1' : Math.random() < 0.5,
            reduce: q.get('reduce') === '1' || reduceMotionOn(),
            who: d.ultimate.walkout.who,
            entry: entryOf(inst.speciesId),
            cries: useGame.getState().settings.cries,
        };
    };

    return (
        <div className="wkl">
            <MenuHead title="Walkout · Phaser" hud="cards" onBack={onExit} />
            <p className="muted">
                {view.displayName} · {view.overall} · {ed ? editionLabel(ed) : d.common.metal.ouro} · {tier}
            </p>
            <div className="wkl-presets">
                {PRESETS.map(([label, e, id]) => (
                    <a key={e} className="btn small" href={`?lab=walkout&motor=phaser&ed=${e}&id=${id}`}>
                        {label}
                    </a>
                ))}
            </div>
            <button type="button" className="btn confirm big wkl-open" onClick={() => setOpen((n) => n + 1)}>
                {open ? d.ultimate.walkout.again : d.ultimate.walkout.open}
            </button>
            <span ref={badgeRef} className="wkl-badge" aria-hidden>
                {leader && <KantoBadge leader={leader} earned />}
            </span>
            {open > 0 && <PhaserWalkout key={open} data={data} label={view.displayName} onDone={() => setOpen(0)} />}
        </div>
    );
}

/** O palco: baixa o Phaser e a cena, cria o jogo a 2x (pixel art), e põe Pular e Continuar em cima. */
function PhaserWalkout({
    data,
    label,
    onDone,
}: {
    data: () => Promise<WalkoutData>;
    label: string;
    onDone: () => void;
}) {
    const { t } = useT();
    const host = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const scene = () => gameRef.current?.scene.getScene('walkout') as WalkoutScene | null | undefined;
    const [stage, setStage] = useState<'load' | 'on' | 'skippable' | 'done'>('load');
    const make = useRef(data);
    useEffect(() => {
        let game: Phaser.Game | null = null;
        let dead = false;
        void (async () => {
            const [{ default: P }, { WalkoutScene: Scene }, wk] = await Promise.all([
                import('phaser'),
                import('../../game/scenes/WalkoutScene'),
                make.current(),
                document.fonts.load('11px Galmuri11'),
                document.fonts.load('bold 11px Galmuri11'),
                document.fonts.load('28px Galmuri14'),
            ]);
            if (dead || !host.current) return;
            game = new P.Game({
                type: P.AUTO,
                width: Math.floor(window.innerWidth / 2),
                height: Math.floor(window.innerHeight / 2),
                parent: host.current,
                pixelArt: true,
                backgroundColor: '#000000',
                scale: { mode: P.Scale.NONE, zoom: 2 },
                audio: { noAudio: true },
            });
            game.events.on('walkout', (what: 'skippable' | 'done') => setStage(what));
            game.scene.add('walkout', Scene, true, wk);
            gameRef.current = game;
            // gravação quadro a quadro e medida de FPS (só dev e prévias)
            if (__SMOKE__) (window as unknown as { __walkoutGame?: Phaser.Game }).__walkoutGame = game;
            setStage('on');
        })();
        return () => {
            dead = true;
            game?.destroy(true);
        };
    }, []);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) =>
            e.key === 'Escape' && (gameRef.current?.scene.getScene('walkout') as WalkoutScene | null)?.skip();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    return createPortal(
        <div className="wk-ph" role="dialog" aria-modal="true" aria-label={label}>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar adianta a batida; no teclado, Pular (Esc) e Continuar fazem o mesmo */}
            <div ref={host} className="wk-ph-host" onClick={() => scene()?.tap()} />
            {stage === 'skippable' && (
                <button type="button" className="btn ghost small wk-ph-skip" onClick={() => scene()?.skip()}>
                    {t('common.ui.skip')}
                </button>
            )}
            {stage === 'done' && (
                <button type="button" className="btn confirm big wk-ph-go" onClick={onDone}>
                    {t('common.ui.continue')}
                </button>
            )}
        </div>,
        document.body,
    );
}
