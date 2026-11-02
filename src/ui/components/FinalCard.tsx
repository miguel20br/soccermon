import { type CSSProperties, useState } from 'react';
import { matchMvp } from '../../engine/mvp';
import { winEarnings } from '../../engine/shop';
import { clubName, cupStageName } from '../../i18n';
import { useT } from '../../i18n/react';
import { hasShop, useGame } from '../../store/game-store';
import { isGroupStage, isLong, longWinEarnings } from '../../store/long-cup';
import { Beat, useCascade } from '../kit/Cascade';
import { MomentStage } from '../kit/MomentStage';
import { CountUp } from './CountUp';
import { finalOutcome, HudIcon } from './MatchHud';
import { cardSprite } from './PokeCard';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/**
 * Fim de partida em tela cheia (cara-de-jogo.md, decisão 6): no apito final a cartela cobre a quadra parada e a
 * cascata conta o que a partida deu, uma coisa de cada vez: placar, ₽ da vitória (o mesmo número que o Mercado ou o
 * mapa vão somar), o craque e o próximo rival. Tocar pula pro fim; "Ver a quadra" fecha a cartela e deixa o "Ver
 * resultado" de sempre na barra do polegar. Só mostra; nada muda no jogo.
 */
export function FinalCard({
    score,
    shootout,
    names,
    colors,
    liga,
    onGo,
}: {
    score: [number, number];
    shootout: [number, number] | null;
    names: [string, string];
    colors: [number, number];
    liga: boolean;
    onGo: () => void;
}) {
    const { t } = useT();
    const run = useGame((s) => (liga ? null : s.run));
    const match = useGame((s) => s.match);
    const [open, setOpen] = useState(true);
    const outcome = finalOutcome(score, shootout, 0);
    const won = outcome === 'win';
    const champion = run?.status === 'champion';
    // Rota: caiu no grupo mesmo ganhando a última rodada (a Final não vem)
    const groupOut = !!run && isLong(run) && run.status === 'eliminated' && isGroupStage(run.stage);
    const paid = !!run && won && !champion && !groupOut;
    const prize = !paid
        ? null
        : hasShop(run)
          ? winEarnings(score[0], score[1], run.money ?? 0, run.sponsors ?? []).total
          : isLong(run)
            ? longWinEarnings(score, run.sponsors).total
            : null;
    const star = match ? matchMvp(match, 0) : null;
    const next = paid ? run.opponents[run.stage + 1] : null;
    const gaps = [0, ...(prize ? [500] : []), ...(star ? [450] : []), ...(next ? [500] : [])];
    const c = useCascade(gaps);
    let n = 1;
    const go = (
        <button type="button" className="btn confirm bc-result" onClick={onGo}>
            {t('match.seeResult')}
        </button>
    );
    // aberta, a cartela tem o seu "Ver resultado" (o da barra só volta quando ela fecha)
    if (!open) return go;
    return (
        <MomentStage
            label={t('match.finalCard.aria')}
            className={`k-final ${outcome}`}
            style={{ '--home': hex(colors[0]), '--away': hex(colors[1]) } as CSSProperties}
        >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: tocar pula a contagem; os botões ficam no teclado */}
            <div className="k-final-body" onClick={c.skip}>
                <h1 className={`k-moment-title k-pop ${outcome}`}>{t(`match.final.${outcome}`)}</h1>
                <div className="rh-score k-final-score">
                    <div className="rh-team home">
                        <span>{names[0]}</span>
                    </div>
                    <b className={score[0] > score[1] ? 'lead' : ''}>{score[0]}</b>
                    <span className="rh-x">x</span>
                    <b className={score[1] > score[0] ? 'lead' : ''}>{score[1]}</b>
                    <div className="rh-team away">
                        <span>{names[1]}</span>
                    </div>
                </div>
                {shootout && <div className="rh-pens">{t('match.penalties', { a: shootout[0], b: shootout[1] })}</div>}
                {prize !== null && (
                    <Beat on={c.step > n++} className="k-final-prize">
                        +₽
                        <CountUp from={0} to={c.step >= n ? prize : 0} skip={c.skipped} ms={600} />
                    </Beat>
                )}
                {star && (
                    <Beat on={c.step > n++} className="k-final-star">
                        <img className="pixel" src={cardSprite(star)} alt="" width={64} height={64} />
                        <span className="k-seal">
                            <HudIcon kind="max" />
                            {t('match.finalCard.star')}: {star.name}
                        </span>
                    </Beat>
                )}
                {next && run && (
                    <Beat on={c.step > n++} className="k-final-next">
                        <span className="muted">
                            {t('match.finalCard.next', { stage: cupStageName(run, run.stage + 1) })}
                        </span>
                        <b>{clubName(next.name)}</b>
                        <span className="k-final-sprites">
                            {next.lineup.map((p) => (
                                <img key={p.uid} className="pixel" src={cardSprite(p)} alt="" />
                            ))}
                        </span>
                    </Beat>
                )}
            </div>
            <div className="k-final-actions">
                <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                    {t('match.finalCard.court')}
                </button>
                <button type="button" className="btn confirm big" onClick={onGo} data-autofocus>
                    {t('match.seeResult')}
                    <HudIcon kind="next" />
                </button>
            </div>
        </MomentStage>
    );
}
