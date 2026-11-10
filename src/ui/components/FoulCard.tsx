import { type CSSProperties, useEffect } from 'react';
import { playSample } from '../../game/audio';
import { useT } from '../../i18n/react';
import { HudIcon } from './MatchHud';
import '../long-cup.css';

/**
 * Cartão da Copa longa no resultado (docs/planos/copa-longa.md). Amarelo: a 1ª derrota fora da Final; o cartão cai
 * girando, bate e fica. Vermelho: a 2ª; o segundo amarelo encosta no primeiro, os dois viram vermelho e o resto do
 * caminho até a Final é bloqueado, casa por casa. Perdoada (derrota na 1ª partida, `forgivenLoss`): o amarelo cai e
 * apaga, só o contorno fica. Com Reduzir movimento, só o fade (motion.css cuida das animações).
 */
const TEXT = {
    forgiven: ['longCup.forgivenTitle', 'longCup.forgivenHint'],
    yellow: ['longCup.yellowTitle', 'longCup.cardsHint'],
    red: ['longCup.redTitle', 'longCup.redLine'],
} as const;

export function FoulCard({ kind, remaining = 0 }: { kind: 'forgiven' | 'yellow' | 'red'; remaining?: number }) {
    const { t } = useT();
    useEffect(() => {
        playSample('apito-curto', 0.9);
        if (kind === 'red') {
            const id = window.setTimeout(() => playSample('apito'), 700);
            return () => window.clearTimeout(id);
        }
    }, [kind]);
    return (
        <section className={`foul foul-${kind}`} aria-live="polite">
            <div className="foul-cards" aria-hidden>
                <span className="foul-card c1" />
                {kind === 'red' && <span className="foul-card c2" />}
            </div>
            <div className="foul-text">
                <b>{t(TEXT[kind][0])}</b>
                <small>{t(TEXT[kind][1])}</small>
            </div>
            {kind === 'red' && remaining > 0 && (
                <div className="foul-road">
                    {Array.from({ length: remaining }, (_, i) => `r${i}`).map((k, i) => (
                        <span key={k} className="foul-stop" style={{ '--i': i } as CSSProperties}>
                            <HudIcon kind="lock" />
                        </span>
                    ))}
                    <span className="foul-bar" />
                    <span className="foul-blocked">{t('longCup.blocked')}</span>
                </div>
            )}
        </section>
    );
}
