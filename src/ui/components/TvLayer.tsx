import { useEffect, useState } from 'react';
import type { Dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { freeBottom, freeTop, onProgram } from '../tv';
import '../tv.css';

type Program = keyof Dict['home']['tv']['programs'];
/** Colunas (px da tela) que o letreiro ocupa com a faixa aberta: nenhuma pode ter controle embaixo. */
const COLS = [10, 50, 90, 130, 170, 210, 250];
/** Só o bug (sem a faixa): "SMN", ou o mais largo "AO VIVO" da partida. */
const BUG_COLS = [10, 40, 70];
const LIVE_COLS = [10, 40, 70, 100, 125];
const ROW_H = 30;
const at = (side: 'bottom' | 'top', v: number | null, strip: boolean) => (v === null ? null : { [side]: v, strip });
/** A faixa entra depois do corte (a tela nova já no lugar) e sai sozinha. */
const SHOW_AFTER_MS = 380;
const HOLD_MS = 2200;

/**
 * Letreiro de canal (sempre ligado desde 0.9.37): o bug (o símbolo e "SMN"; "AO VIVO" na partida) e a faixa amarela com
 * o nome do programa, que sai do bug em cada troca de tela ou de aba e volta pra dentro dele. Fica na linha livre mais
 * baixa à esquerda, acima dos botões e sem cobrir texto (`freeBottom`); sem ela, no topo à direita (`freeTop`, o
 * primeiro lugar na partida); sem espaço pra faixa, só o bug; sem espaço nem pra ele, some. Só decoração:
 * `aria-hidden` e sem toque.
 */
export function TvLayer() {
    const { d } = useT();
    const screen = useGame((s) => s.screen);
    const live = screen === 'match' || screen === 'liga-match';
    const [prog, setProg] = useState<{ key: Program; n: number } | null>(null);
    const [shown, setShown] = useState(false);
    // onde o letreiro fica: embaixo à esquerda (`bottom`) ou no topo à direita (`top`), com ou sem espaço pra faixa;
    // null = em lugar nenhum
    const [spot, setSpot] = useState<{ bottom?: number; top?: number; strip: boolean } | null>(null);
    const set = (key: string | null) =>
        key && setProg((p) => (p?.key === key ? p : { key: key as Program, n: (p?.n ?? 0) + 1 }));
    // a Home (aba dos ambientes, menu de modos) anuncia o programa; as outras telas são o próprio programa
    // biome-ignore lint/correctness/useExhaustiveDependencies: assina uma vez
    useEffect(() => onProgram(set), []);
    // biome-ignore lint/correctness/useExhaustiveDependencies: só na troca de tela
    useEffect(() => {
        if (screen !== 'home') set(screen);
    }, [screen]);
    const n = prog?.n ?? 0;
    // biome-ignore lint/correctness/useExhaustiveDependencies: refaz a cada programa novo (n)
    useEffect(() => {
        if (!n) return;
        setShown(false);
        const place = () => {
            const bug = live ? LIVE_COLS : BUG_COLS;
            // a partida: o topo primeiro (embaixo é a barra e a narração); as outras telas: embaixo primeiro
            const tries: (() => typeof spot)[] = [
                () => at('bottom', freeBottom(COLS, ROW_H), true),
                () => at('bottom', freeBottom(bug, ROW_H), false),
                () => at('top', freeTop(COLS, ROW_H), true),
                () => at('top', freeTop(bug, ROW_H), false),
            ];
            if (live) tries.push(...tries.splice(0, 2));
            const next = tries.reduce<typeof spot>((got, f) => got ?? f(), null);
            setSpot((s) =>
                s && next && s.bottom === next.bottom && s.top === next.top && s.strip === next.strip ? s : next,
            );
        };
        const a = window.setTimeout(() => {
            place();
            setShown(true);
        }, SHOW_AFTER_MS);
        const b = window.setTimeout(() => setShown(false), SHOW_AFTER_MS + HOLD_MS);
        window.addEventListener('resize', place);
        // a tela muda depois da troca (abertura do Campeão, sheet, aviso): confere o lugar de novo a cada segundo
        // ponytail: sondagem de 1 s; um MutationObserver com throttle se pesar
        const c = window.setInterval(place, 1000);
        return () => {
            window.clearInterval(c);
            window.clearTimeout(a);
            window.clearTimeout(b);
            window.removeEventListener('resize', place);
        };
    }, [n]);
    // o menu de modos já diz AO VIVO na fatia do Modo Copa
    if (!prog || !spot || prog.key === 'modes') return null;
    return (
        <div
            // mudou de lugar (a tela mexeu embaixo): monta de novo e entra com fade no lugar novo, sem pular
            key={`${spot.top}-${spot.bottom}`}
            className={`tv-row${shown && spot.strip ? ' on' : ''}${spot.top === undefined ? '' : ' top'}`}
            style={
                spot.top === undefined
                    ? { bottom: spot.bottom }
                    : { top: `max(${spot.top}px, calc(env(safe-area-inset-top) + 8px))` }
            }
            aria-hidden
        >
            <span className={`tv-bug${live ? ' live' : ''}`}>
                <img src="assets/ui/simbolo.svg" alt="" width="24" height="24" />
                <b>{live ? d.home.live : d.home.tv.channel}</b>
            </span>
            <span className="tv-lower">
                <span>{d.home.tv.programs[prog.key]}</span>
            </span>
        </div>
    );
}
