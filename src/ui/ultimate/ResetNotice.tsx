import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { Sheet } from '../kit/Sheet';

/**
 * Aviso do recomeço do Time Ultimate (economia do 1º dia, 27/11/2026): uma vez, pra quem já tinha jogado, na Home ou
 * no próprio modo. Fechar (X, fora ou Entendi) marca como visto.
 */
export function ResetNotice() {
    const { t } = useT();
    const due = useGame((s) => s.ultimate.resetNotice && (s.screen === 'home' || s.screen === 'ultimate'));
    const ack = useGame((s) => s.ultimateAckReset);
    return (
        <Sheet open={due} onClose={ack} title={t('ultimate.reset.title')} className="ut-reset-sheet">
            <p>{t('ultimate.reset.body')}</p>
            <p>{t('ultimate.reset.changes')}</p>
            <p>
                <b>{t('ultimate.reset.gift')}</b>
            </p>
            <button type="button" className="btn confirm wide" onClick={ack}>
                {t('ultimate.reset.ok')}
            </button>
        </Sheet>
    );
}
