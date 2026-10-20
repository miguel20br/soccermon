import { useEffect, useState } from 'react';
import { useT } from '../../i18n/react';
import { reduceMotionOn } from '../settings-sync';

/** Letras por segundo do texto que vai aparecendo (como nos jogos). */
const CPS = 60;

/**
 * Caixa de diálogo do móvel tocado, dentro do próprio quarto (a caixa de texto dos jogos, a mesma da abertura do
 * trailer): o texto vai aparecendo letra a letra (tocar completa), e um botão leva pra onde aquilo mora. Nada leva a
 * página pra baixo sem a pessoa pedir.
 */
export function RoomDialog({
    text,
    action,
    onClose,
}: {
    text: string;
    action?: { label: string; run: () => void };
    onClose: () => void;
}) {
    const { t } = useT();
    const [n, setN] = useState(() => (reduceMotionOn() ? text.length : 0));
    useEffect(() => {
        setN(reduceMotionOn() ? text.length : 0);
        if (reduceMotionOn()) return;
        const start = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const k = Math.min(text.length, Math.floor(((now - start) / 1000) * CPS));
            setN(k);
            if (k < text.length) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [text]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    const done = n >= text.length;
    return (
        <div className="room-dialog" role="status" data-exit>
            <button
                type="button"
                className="room-dialog-text"
                onClick={() => (done ? onClose() : setN(text.length))}
                aria-label={text}
            >
                <span aria-hidden>{text.slice(0, n)}</span>
                {done && <i className="room-dialog-next" aria-hidden />}
            </button>
            {/* o botão já ocupa o lugar dele (o texto não pula) e aparece com fade quando o texto acaba */}
            {action && (
                <button
                    type="button"
                    className={`btn small room-dialog-go${done ? ' ready' : ''}`}
                    disabled={!done}
                    onClick={action.run}
                >
                    {action.label}
                </button>
            )}
            <span className="pf-sr">{t('trophies.say.close')}</span>
        </div>
    );
}
