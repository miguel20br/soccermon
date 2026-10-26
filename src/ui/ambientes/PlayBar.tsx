import { useT } from '../../i18n/react';
import { HudIcon, type HudIconKind } from '../components/MatchHud';

export type ModeId = 'continue' | 'challenge' | 'quick' | 'long' | 'daily' | 'duel';
export interface Mode {
    id: ModeId;
    title: string;
    sub: string;
    icon: HudIconKind;
    busy?: boolean;
    go: () => void;
}

/**
 * O que o JOGAR faz e o que o seletor de modos mostra. O JOGAR é sempre o mais provável: a copa em andamento, o
 * desafio do link ou a Copa Relâmpago. Na 1ª visita não há seletor: o JOGAR é o único botão (o funil não ganha toque).
 */
export function playModes(s: { inProgress: boolean; challenge: string | null; firstVisit: boolean }): {
    main: ModeId;
    sheet: ModeId[];
} {
    const main: ModeId = s.inProgress ? 'continue' : s.challenge ? 'challenge' : 'quick';
    if (s.firstVisit && !s.challenge) return { main, sheet: [] };
    const sheet: ModeId[] = [];
    if (s.inProgress) sheet.push('continue');
    if (s.challenge) sheet.push('challenge');
    sheet.push('quick', 'long', 'daily', 'duel');
    return { main, sheet };
}

/**
 * O rodapé do Estádio (padrão Clash): um JOGAR grande com o modo escrito nele e, ao lado, o gatilho "Modos" que
 * desdobra (sobe, 250 ms) os modos, todos com o mesmo peso e cara de botão. Escolher um modo entra direto nele: o
 * JOGAR não muda de função escondido (sem estado pra lembrar), e cada opção faz o que diz.
 */
export function PlayBar({
    main,
    sheet,
    open,
    onOpen,
}: {
    main: Mode;
    sheet: Mode[];
    open: boolean;
    onOpen: (open: boolean) => void;
}) {
    const { t } = useT();
    const pick = (m: Mode) => {
        onOpen(false);
        m.go();
    };
    return (
        <div className={`es-go${sheet.length ? ' has-modes' : ''}`}>
            {sheet.length > 0 && (
                <div id="es-modes" className={`es-modes${open ? ' open' : ''}`} inert={!open}>
                    {sheet.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            className={`es-mode m-${m.id}`}
                            disabled={m.busy}
                            onClick={() => pick(m)}
                        >
                            <span className="es-mode-ic">
                                <HudIcon kind={m.icon} />
                            </span>
                            <b>{m.title}</b>
                            <small>{m.sub}</small>
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                data-coach="quick"
                className="btn big cup-go es-play primary"
                disabled={main.busy}
                onClick={() => pick(main)}
            >
                <span className="cup-go-txt">
                    <b>{main.title}</b>
                    <small>{main.sub}</small>
                </span>
                <HudIcon kind="next" />
            </button>
            {sheet.length > 0 && (
                <button
                    type="button"
                    className={`btn es-modes-btn${open ? ' open' : ''}`}
                    aria-expanded={open}
                    aria-controls="es-modes"
                    onClick={() => onOpen(!open)}
                >
                    <HudIcon kind="up" />
                    <span>{t('home.amb.modes')}</span>
                </button>
            )}
        </div>
    );
}
