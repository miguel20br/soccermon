import { useLayoutEffect, useState } from 'react';
import { cupStageName, cupStageShort, dict, type Lang } from '../../i18n';
import { useT } from '../../i18n/react';
import { type RunState, type Screen, useGame } from '../../store/game-store';
import { cupMatchNow, isLong } from '../../store/long-cup';
import { CountUp } from './CountUp';
import { HudIcon } from './MatchHud';

/** Mercado cujo ₽ da vitória já foi contado na barra (a entrada conta uma vez; voltar pra tela não conta de novo). */
let counted: string | null = null;
/** Espera a troca de tela (250 ms) antes de contar. */
const COUNT_AT = 320;
const COUNT_MS = 700;

/**
 * O ₽ da copa. Na entrada do Mercado ele começa sem o ganho da vitória e conta até o total, com tique subindo e o
 * "+₽N" saindo da moeda (cara-de-jogo.md, Mercado). Depois disso, cada compra rola o número até o novo valor.
 */
function CupMoney({ run, screen }: { run: RunState; screen: Screen }) {
    const { t } = useT();
    const money = run.money ?? 0;
    const gain = screen === 'shop' && run.status === 'shop' && run.shop ? run.shop.earned.total : 0;
    const key = gain > 0 ? `${run.seed}:${run.shop!.stage}` : null;
    const [pending, setPending] = useState(() => (key && counted !== key ? gain : 0));
    const [pop, setPop] = useState(0);
    // biome-ignore lint/correctness/useExhaustiveDependencies: só quando entra num Mercado novo
    useLayoutEffect(() => {
        if (!key || counted === key) return;
        setPending(gain);
        // a marca vai no fim (e não aqui): no StrictMode o efeito roda 2x e o 2º cancelaria a contagem
        const id = window.setTimeout(() => {
            counted = key;
            setPending(0);
            setPop(gain);
            const n = Math.min(gain, 8);
            // o áudio só carrega aqui (a barra também vive nos testes de rótulo, sem AudioContext)
            void import('../../game/audio').then(({ playSfx }) => {
                for (let i = 0; i < n; i++)
                    window.setTimeout(() => playSfx('select', 2 ** ((i * 2) / 12)), (i * COUNT_MS) / n);
            });
        }, COUNT_AT);
        return () => clearTimeout(id);
    }, [key]);
    return (
        <span className="k-res k-res-money" role="img" aria-label={t('common.ui.cupMoney', { n: money })}>
            <i className="k-res-coin" aria-hidden>
                ₽
            </i>
            <b className="cb-num">
                <CountUp to={money - pending} ms={pop ? COUNT_MS : 400} />
            </b>
            {pop > 0 && (
                <span className="k-res-gain" aria-hidden onAnimationEnd={() => setPop(0)}>
                    +{t('shop.money', { n: pop })}
                </span>
            )}
        </span>
    );
}

/** "Partida 4 de 8" / "4/8" da Rota: a mesma partida do "Continuar" (`cupMatchNow`). */
export function cupBarStage(run: RunState, screen: Screen, lang: Lang) {
    const at = cupMatchNow({ ...run, played: run.results.length }, screen === 'result');
    return { full: cupStageName(run, at, lang), short: cupStageShort(run, at, dict(lang).match.stageShort) };
}

/**
 * Barra da copa (revamp-ui §2.2, 0.9.23): no lugar do logo, nas telas de dentro da copa. Voltar à esquerda, a fase em
 * placa e o que você tem na copa (₽ e sorteios) com o número contornado.
 */
export function CupBar({ onBack }: { onBack: () => void }) {
    const run = useGame((s) => s.run);
    const screen = useGame((s) => s.screen);
    const { t, d, lang } = useT();
    if (!run) return null;
    const stage = isLong(run) ? cupBarStage(run, screen, lang) : null;
    // ₽ só na Rota (o arcade não tem desde 11/11/2026; uma copa antiga parada no Mercado ainda mostra)
    const money = isLong(run) || run.status === 'shop';
    return (
        <div className="k-cupbar">
            <button type="button" className="k-icon-btn" onClick={onBack} aria-label={t('common.ui.backHome')}>
                <HudIcon kind="prev" />
            </button>
            {/* Relâmpago: o nome curto ("Quartas de final" cortava com ₽ de 2 dígitos); Rota: "Partida 3 de 8" */}
            <span className="k-cupbar-stage">
                {stage ? (
                    <>
                        <span className="k-cupbar-full">{stage.full}</span>
                        {/* 320: "Partida 3 de 8" cortava em "Partida…" ao lado do ₽; lá vai "3/8" */}
                        <span className="k-cupbar-short">{stage.short}</span>
                    </>
                ) : (
                    d.match.stageShort[run.stage]
                )}
            </span>
            {money && <CupMoney run={run} screen={screen} />}
            <span className="k-res" role="img" aria-label={t('common.ui.cupRerolls', { n: run.rerolls })}>
                <HudIcon kind="reroll" />
                <b className="cb-num">{run.rerolls}</b>
            </span>
        </div>
    );
}
