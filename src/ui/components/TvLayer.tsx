import { useEffect, useState } from 'react';
import type { Dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { freeBottom, onProgram } from '../tv-lab';
import '../tv-lab.css';

type Program = keyof Dict['home']['tv']['programs'];
/** Colunas (px da tela) que o letreiro ocupa com a faixa aberta: nenhuma pode ter controle embaixo. */
const COLS = [10, 50, 90, 130, 170, 210, 250];
/** Só o bug (sem a faixa). */
const BUG_COLS = [10, 40, 70];
const ROW_H = 30;
/** A faixa entra depois do corte (a tela nova já no lugar) e sai sozinha. */
const SHOW_AFTER_MS = 380;
const HOLD_MS = 2200;

/**
 * Letreiro de canal do ?lab=tv: o bug no canto de baixo (o símbolo e "SMN"; "AO VIVO" na partida) e a faixa amarela
 * com o nome do programa, que sai do bug em cada troca de tela ou de aba e volta pra dentro dele. Fica na linha livre
 * mais baixa acima dos botões sem cobrir texto (`freeBottom`); sem espaço pra faixa, fica só o bug; na partida, no topo à
 * direita, na linha do símbolo (o layout da partida não muda). Só decoração: `aria-hidden` e sem toque.
 */
export function TvLayer() {
    const { d } = useT();
    const screen = useGame((s) => s.screen);
    const live = screen === 'match' || screen === 'liga-match';
    const [prog, setProg] = useState<{ key: Program; n: number } | null>(null);
    const [shown, setShown] = useState(false);
    // onde o letreiro fica: embaixo (`bottom`, com ou sem espaço pra faixa) ou no topo (a partida); null = em lugar nenhum
    const [spot, setSpot] = useState<{ bottom?: number; strip: boolean } | null>(null);
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
            // a partida: a linha de cima, ao lado do símbolo, é a única sem placar, quadra ou narração embaixo
            if (live) return setSpot({ strip: true });
            const full = freeBottom(COLS, ROW_H);
            const bottom = full ?? freeBottom(BUG_COLS, ROW_H);
            setSpot(bottom === null ? null : { bottom, strip: full !== null });
        };
        const a = window.setTimeout(() => {
            place();
            setShown(true);
        }, SHOW_AFTER_MS);
        const b = window.setTimeout(() => setShown(false), SHOW_AFTER_MS + HOLD_MS);
        window.addEventListener('resize', place);
        return () => {
            window.clearTimeout(a);
            window.clearTimeout(b);
            window.removeEventListener('resize', place);
        };
    }, [n]);
    // o menu de modos já é a grade, com o bug no cabeçalho
    if (!prog || !spot || prog.key === 'modes') return null;
    return (
        <div
            className={`tv-row${shown && spot.strip ? ' on' : ''}${spot.bottom === undefined ? ' top' : ''}`}
            style={spot.bottom === undefined ? undefined : { bottom: spot.bottom }}
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
