import type Phaser from 'phaser';
import { type CSSProperties, memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { species } from '../../engine/data';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { cardTypeOf, editionOf } from '../../engine/specials';
import { duckMusic, unduckMusic } from '../../game/music';
import type { WalkoutData, WalkoutScene } from '../../game/scenes/WalkoutScene';
import {
    dayCount,
    type Jogada,
    jogadaOf,
    revealOf,
    upgradeOf,
    WALK_SKIP_AT,
    type WalkPlan,
    walkoutPlan,
    walkoutToday,
    walkTier,
} from '../../game/walkout-plan';
import { wkSound } from '../../game/walkout-sound';
import { typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { FutCard } from '../components/FutCard';
import { readCount, writeCount } from '../local-count';
import { editionLabel } from '../rarity';
import { reduceMotionOn } from '../reduce-motion';
import { TYPE_COLOR } from '../type-colors';
import { uiZoom } from '../ui-zoom';
import './walkout.css';

/**
 * O walkout final (ut-walkout.md, "Escolha depois dos vídeos lado a lado"): o estádio, os telões, a silhueta, a entrada
 * com bola e o vidro quebrando são a cena do Phaser (`WalkoutScene`, import dinâmico: o Phaser fica fora da Home); por
 * cima, em React, a placa da edição e a carta de verdade (`FutCard`) girando, sem a foto, com a nota contando. Tudo lê
 * o relógio da cena (evento 'wk-tick'), então tocar, Pular e a gravação quadro a quadro mexem num relógio só.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const outCubic = (k: number) => 1 - (1 - k) ** 3;
const outBack = (k: number) => 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2;

/** Cor da luz (o brilho atrás da carta) por edição; sem edição, o metal do nível. */
const LIGHT: Record<string, [string, string]> = {
    icone: ['#b48cff', '#ff50be'],
    destaque: ['#d9b23c', '#ffe08a'],
    shiny: ['#ffb3e0', '#b3dcff'],
    ouro: ['#e8c24a', '#ffe9a0'],
};

const Card = memo(function Card({ inst }: { inst: PokemonInstance }) {
    return <FutCard inst={inst} />;
});

interface WkWindow {
    __wkManual?: boolean;
    __walkoutGame?: Phaser.Game;
    __wkPlan?: WalkPlan;
}
const wkw = () => window as unknown as WkWindow;

export function WalkoutStage({
    inst,
    plan,
    jogada,
    onDone,
}: {
    inst: PokemonInstance;
    plan: WalkPlan;
    /** Força a jogada (laboratório); sem, a da espécie. */
    jogada?: Jogada;
    onDone: () => void;
}) {
    const { t: tr, d } = useT();
    const view = viewInstance(inst);
    const type = cardTypeOf(inst);
    const edition = editionOf(inst);
    const host = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const scene = () => gameRef.current?.scene.getScene('walkout') as WalkoutScene | null | undefined;
    const [t, setT] = useState(0);
    const [on, setOn] = useState(false);
    // o aquecimento: a carta, a placa e as luzes montadas quase invisíveis antes do 1º quadro, pro navegador rasterizar
    // (e compilar os shaders da GPU) agora e não no meio do walkout (a travada de ~150 ms quando a carta aparecia)
    const [warm, setWarm] = useState(true);
    const warmRef = useRef<HTMLDivElement>(null);
    const typeColor = TYPE_COLOR[inst.special?.type ?? type] ?? '#3a7bd5';

    // o palco: baixa o Phaser e a cena, cria o jogo a 2x (pixel art) e escuta o relógio dela
    const make = useRef<WalkoutData>({
        plan,
        edition,
        speciesId: inst.speciesId,
        shiny: inst.shiny,
        posShort: d.common.posShort[view.naturalPosition],
        posLong: d.common.pos[view.naturalPosition],
        type,
        typeLabel: typeName(type),
        typeColor: Number.parseInt(typeColor.slice(1), 16),
        who: d.ultimate.walkout.who,
        jogada: jogada ?? jogadaOf(inst.speciesId),
        reveal: revealOf(edition, species(inst.speciesId).types),
        cries: useGame.getState().settings.cries,
    });
    useEffect(() => {
        let game: Phaser.Game | null = null;
        let dead = false;
        wkw().__wkPlan = make.current.plan;
        void (async () => {
            const [{ default: P }, { WalkoutScene: Scene }] = await preloadWalkout();
            if (dead || !host.current) return;
            await Promise.all(
                [...(warmRef.current?.querySelectorAll('img') ?? [])].map((im) => im.decode().catch(() => undefined)),
            );
            for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
            if (dead || !host.current) return;
            setWarm(false);
            // a pixel art é em px do jogo (2 px de CSS); o canvas tem `res` px por px do jogo, o múltiplo inteiro que
            // casa com a tela (DPR 1: 2; DPR 2: 4; DPR 3: 3), e os telões e textos nítidos usam essa resolução
            // (tela grande com DPR alto cai pra 2: acima de ~2,4 milhões de px o preenchimento derruba o FPS)
            const dpr = window.devicePixelRatio || 1;
            const gw = Math.floor(window.innerWidth / 2);
            const gh = Math.floor(window.innerHeight / 2);
            let res = dpr >= 2.5 ? 3 : dpr >= 1.5 ? 4 : 2;
            if (gw * gh * res * res > 2.4e6) res = 2;
            make.current.res = res;
            game = new P.Game({
                type: P.AUTO,
                width: gw * res,
                height: gh * res,
                parent: host.current,
                pixelArt: true,
                backgroundColor: '#000000',
                scale: { mode: P.Scale.NONE, zoom: 2 / res },
                audio: { noAudio: true },
            });
            const manual = wkw().__wkManual;
            game.events.on('wk-tick', (ms: number) => (manual ? flushSync(() => setT(ms)) : setT(ms)));
            game.scene.add('walkout', Scene, true, make.current);
            gameRef.current = game;
            // gravação quadro a quadro e medida de FPS (só dev e prévias)
            if (__SMOKE__) wkw().__walkoutGame = game;
            setOn(true);
        })();
        return () => {
            dead = true;
            game?.destroy(true);
        };
    }, []);
    // a música do menu abaixa no especial
    useEffect(() => {
        if (plan.tier !== 'especial') return;
        duckMusic(true);
        return () => unduckMusic(false);
    }, [plan.tier]);
    // Pular: a cena vai pro fim (a carta pronta); se ela ainda nem montou (Phaser baixando), fecha o walkout
    const skip = () => scene()?.skip() || onDone();
    const skipRef = useRef(skip);
    skipRef.current = skip;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && skipRef.current();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    // o Pular aparece com 1 s de relógio de verdade, mesmo se o celular estiver lento pra montar ou rodar a cena (a
    // gravação quadro a quadro segue o relógio da cena)
    const [skipOk, setSkipOk] = useState(false);
    useEffect(() => {
        if (wkw().__wkManual) return;
        const id = window.setTimeout(() => setSkipOk(true), WALK_SKIP_AT);
        return () => clearTimeout(id);
    }, []);

    // tamanho da carta: o palco de 360x640 unidades no meio da tela
    const [u, setU] = useState(1);
    useLayoutEffect(() => {
        const measure = () => {
            const z = uiZoom();
            setU(Math.min(window.innerWidth / z / 360, window.innerHeight / z / 640));
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    // a nota contando (direto no texto da carta: a carta não redesenha), com um tique por número
    const cardRef = useRef<HTMLDivElement>(null);
    const ovr = view.overall;
    const from = Math.max(40, ovr - 32);
    const shown = plan.count
        ? Math.round(lerp(from, ovr, 1 - (1 - ramp(t, plan.card + 200, plan.card + 200 + plan.count)) ** 2))
        : ovr;
    const lastTick = useRef(-1000);
    const hit = plan.card + 200 + plan.count;
    const hitK = ramp(t, hit, hit + 300);
    useLayoutEffect(() => {
        const el = cardRef.current?.querySelector<HTMLElement>('.m-ovr');
        if (!el) return;
        // a nota bate (cresce e carimba de volta) quando termina de contar
        if (plan.count)
            el.style.scale = String(
                t < hit ? 1 : hitK < 0.2 ? lerp(1, 1.8, hitK / 0.2) : lerp(1.8, 1, outBack((hitK - 0.2) / 0.8)),
            );
        const txt = String(shown);
        if (el.textContent === txt) return;
        el.textContent = txt;
        if (plan.tier !== 'raro' && plan.count && t - lastTick.current >= 45) {
            lastTick.current = t;
            wkSound({ k: 'zz', name: 'tick' }, t, inst.speciesId, make.current.cries);
        }
    });

    // ---------------------------------------------------------------- quadro
    const calm = plan.kind === 'calmo';
    // sem edição a carta é ouro (75+): a luz é ouro também no 85+ (antes saía prata e destoava do fundo)
    const lightKey = edition && LIGHT[edition] ? edition : edition === 'evento' ? '' : 'ouro';
    const [l1, l2] = lightKey ? LIGHT[lightKey] : [typeColor, '#ffffff'];
    const plateText =
        edition === 'evento'
            ? `${editionLabel('evento')} · ${typeName(inst.special?.type ?? type)}`
            : edition
              ? editionLabel(edition)
              : d.common.metal.ouro;
    const plateIn = plan.plate === undefined ? 0 : ramp(t, plan.plate, plan.plate + 220);
    const plateOut = plan.plateOut === undefined ? 0 : ramp(t, plan.plateOut, plan.plateOut + 220);
    const spin = plan.tier === 'especial' ? 1400 : plan.tier === 'muitoraro' && plan.kind === 'cheio' ? 800 : 500;
    const cardK = ramp(t, plan.card, plan.card + (calm ? 200 : spin));
    const landed = plan.card + spin;
    let cardTf = '';
    let cardOp = 1;
    if (calm) cardOp = cardK;
    else if (spin > 500) {
        const e = outCubic(cardK);
        const turns = plan.tier === 'especial' ? 1080 : 720;
        const thump = 1 + 0.07 * Math.sin(Math.PI * ramp(t, landed, landed + 220));
        cardTf = `rotateY(${lerp(turns, 0, e)}deg) scale(${lerp(0.2, 1, e) * thump})`;
    } else {
        cardTf = `translateY(${lerp(80, 0, outBack(cardK)) * u}px) scale(${lerp(0.8, 1, outBack(cardK))})`;
        cardOp = ramp(t, plan.card, plan.card + 160);
    }
    const artK = plan.art === undefined ? 1 : ramp(t, plan.art, plan.art + 320);
    const shineAt = plan.art ?? landed;
    const shineK = ramp(t, shineAt, shineAt + 650);
    const flash = plan.art !== undefined && t >= plan.art ? 1 - ramp(t, plan.art, plan.art + 260) : 0;
    const done = t >= plan.end;
    const shakeK = !calm && plan.count && t >= hit ? 1 - hitK : 0;
    const edgeK = calm ? 0 : ramp(t, landed, landed + 300);
    const raysK = calm ? 0 : ramp(t, landed - 300, landed + 200);

    const rootStyle = { '--u': `${u}px`, '--l1': l1, '--l2': l2, '--c1': typeColor } as CSSProperties;
    return createPortal(
        <div className="wk-ph" role="dialog" aria-modal="true" aria-label={view.displayName} style={rootStyle}>
            {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar adianta a batida; no teclado, Pular (Esc) e Continuar fazem o mesmo */}
            <div ref={host} className="wk-ph-host" onClick={() => scene()?.tap()} />
            {on && plateIn > 0 && plateOut < 1 && !calm && (
                <span
                    className={`wk-seal wk-seal-${edition ?? 'ouro'} wk-plate`}
                    style={{
                        opacity: Math.min(1, plateIn * 3) * (1 - plateOut),
                        transform: `translate(-50%, -50%) rotate(-4deg) scale(${lerp(3, 1, outBack(plateIn)) * (1 - 0.15 * plateOut)})`,
                    }}
                >
                    {plateText}
                </span>
            )}
            {on && t >= plan.card && (
                <div
                    ref={cardRef}
                    className={`wk-card${plan.art !== undefined ? ' wk-card-noart' : ''}`}
                    style={
                        {
                            opacity: cardOp,
                            '--wk-art': artK,
                            transform: shakeK
                                ? `translate(${7 * u * shakeK * Math.sin(t / 11)}px, ${5 * u * shakeK * Math.cos(t / 13)}px)`
                                : undefined,
                        } as CSSProperties
                    }
                >
                    {raysK > 0 && (
                        <i
                            className="wk-card-rays"
                            style={{
                                opacity: raysK * (0.75 + 0.25 * shakeK),
                                transform: `translate(-50%, -50%) rotate(${t / 45}deg) scale(${0.8 + 0.2 * raysK + 0.15 * shakeK})`,
                            }}
                        />
                    )}
                    <i
                        className="wk-card-glow"
                        style={{
                            transform: `translate(-50%, -50%) scale(${1 + (calm ? 0.06 : 0.1) * Math.sin(t / 220) + 0.25 * shakeK})`,
                        }}
                    />
                    <div className="wk-card-spin" style={{ transform: cardTf }}>
                        {edgeK > 0 && (
                            <div className="wk-card-edge" style={{ opacity: edgeK }}>
                                <i style={{ transform: `translate(-50%, -50%) rotate(${t * 0.36}deg)` }} />
                            </div>
                        )}
                        <div className="wk-card-face">
                            <Card inst={inst} />
                            {shineK > 0 && shineK < 1 && (
                                <i
                                    className="wk-card-shine"
                                    style={{ transform: `translateX(${lerp(-130, 130, shineK)}%)` }}
                                />
                            )}
                            {flash > 0 && <i className="wk-card-flash" style={{ opacity: flash }} />}
                        </div>
                        {spin > 500 && (
                            <div className="wk-card-back">
                                <img src="assets/ui/simbolo.svg" alt="" />
                            </div>
                        )}
                    </div>
                    {calm && <span className={`wk-seal wk-seal-${edition ?? 'ouro'} wk-seal-calm`}>{plateText}</span>}
                </div>
            )}
            {warm && (
                <div ref={warmRef} className="wk-warm" aria-hidden="true">
                    <span className={`wk-seal wk-seal-${edition ?? 'ouro'} wk-plate`}>{plateText}</span>
                    <div className={`wk-card${plan.art !== undefined ? ' wk-card-noart' : ''}`}>
                        <i className="wk-card-rays" />
                        <i className="wk-card-glow" style={{ transform: 'translate(-50%, -50%)' }} />
                        <div className="wk-card-spin" style={{ transform: 'rotateY(30deg) scale(0.9)' }}>
                            <div className="wk-card-edge">
                                <i />
                            </div>
                            <div className="wk-card-face">
                                <Card inst={inst} />
                                <i className="wk-card-shine" />
                                <i className="wk-card-flash" />
                            </div>
                            <div className="wk-card-back">
                                <img src="assets/ui/simbolo.svg" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {(skipOk || t >= WALK_SKIP_AT) && !done && !calm && (
                <button type="button" className="btn ghost small wk-ph-skip" onClick={skip}>
                    {tr('common.ui.skip')}
                </button>
            )}
            {on && done && (
                <button type="button" className="btn confirm big wk-ph-go" onClick={onDone}>
                    {tr('common.ui.continue')}
                </button>
            )}
        </div>,
        document.body,
    );
}

/**
 * Baixa o Phaser, a cena e as fontes antes da hora (o pacote chama enquanto as cartas saem em leque): sem isso a tela
 * do walkout ficava preta, sem Pular, enquanto o Phaser baixava. O navegador guarda o módulo: chamar de novo é de graça.
 */
export const preloadWalkout = () =>
    Promise.all([
        import('phaser'),
        import('../../game/scenes/WalkoutScene'),
        document.fonts.load('11px Galmuri11'),
        document.fonts.load('bold 11px Galmuri11'),
        document.fonts.load('28px Galmuri14'),
    ]);

/**
 * O walkout de uma carta do pacote (UT e Mercado da Copa; quem escolhe a carta é `walkoutPick`): o nível pela edição e
 * pela nota, encolhido pela contagem do dia (Brasília) daquele nível, guardada neste navegador e a mesma nos dois modos.
 */
export function Walkout({ inst, onDone }: { inst: PokemonInstance; onDone: () => void }) {
    const [walk] = useState(() => {
        const tier = walkTier(editionOf(inst), viewInstance(inst).overall) ?? 'raro';
        const key = `soccermon:walkout-${tier}`;
        const day = dayCount(readCount(key), walkoutToday());
        const plan = walkoutPlan(tier, { nth: day.nth, reduce: reduceMotionOn(), upgrade: upgradeOf(inst) });
        return { key, store: day.store, plan };
    });
    // grava depois (o StrictMode chama o useState duas vezes: gravar lá faria o 1º do dia nascer encolhido)
    useEffect(() => writeCount(walk.key, walk.store), [walk]);
    return <WalkoutStage inst={inst} plan={walk.plan} onDone={onDone} />;
}
