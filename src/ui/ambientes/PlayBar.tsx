import { useT } from '../../i18n/react';
import { HudIcon, type HudIconKind } from '../components/MatchHud';

export type ModeId = 'continue' | 'challenge' | 'quick' | 'long' | 'daily' | 'duel';
export interface Mode {
    id: ModeId;
    title: string;
    sub: string;
    icon: HudIconKind;
    /** O que o JOGAR diz com este modo escolhido ("Jogar" se faltar). */
    verb?: string;
    busy?: boolean;
    go: () => void;
}

/**
 * Os modos do Estádio. O padrão é o mais provável: a copa em andamento, o desafio do link ou a Copa Relâmpago. Na 1ª
 * visita não há seletor: o JOGAR é o único botão (o funil não ganha toque).
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

/** O modo que o JOGAR joga: o escolhido no seletor, se ainda estiver na lista; senão o padrão. */
export const chosenMode = (plan: { main: ModeId; sheet: ModeId[] }, chosen: ModeId | null): ModeId =>
    chosen && plan.sheet.includes(chosen) ? chosen : plan.main;

/** As setas da pílula: o modo vizinho na lista, dando a volta nas pontas. */
export function stepMode(sheet: readonly ModeId[], cur: ModeId, dir: 1 | -1): ModeId {
    const i = sheet.indexOf(cur);
    if (i < 0) return sheet[0] ?? cur;
    return sheet[(i + dir + sheet.length) % sheet.length];
}

/**
 * O rodapé do Estádio (padrão Clash): a pílula do modo escolhido (setas dos lados, toque no meio abre a lista de modos)
 * em cima do JOGAR dourado. Escolher na lista só troca o modo (a lista fecha e a pílula quica); quem joga é o JOGAR.
 */
export function PlayBar({
    main,
    sheet,
    open,
    onOpen,
    onPick,
}: {
    main: Mode;
    sheet: Mode[];
    open: boolean;
    onOpen: (open: boolean) => void;
    onPick: (id: ModeId) => void;
}) {
    const { t } = useT();
    const ids = sheet.map((m) => m.id);
    const pick = (id: ModeId) => {
        onOpen(false);
        onPick(id);
    };
    const pill = sheet.length > 0;
    return (
        <div className={`es-go${pill ? ' has-modes' : ''}`}>
            {pill && (
                <div id="es-modes" className={`es-modes${open ? ' open' : ''}`} inert={!open}>
                    {sheet.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            className={`es-mode m-${m.id}${m.id === main.id ? ' on' : ''}`}
                            aria-current={m.id === main.id}
                            disabled={m.busy}
                            onClick={() => pick(m.id)}
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
            {pill && (
                <div className="es-pick">
                    <button
                        type="button"
                        className="es-arrow cb cb-blue"
                        aria-label={t('home.amb.modePrev')}
                        onClick={() => pick(stepMode(ids, main.id, -1))}
                    >
                        <HudIcon kind="prev" />
                    </button>
                    <button
                        // a key troca com o modo: a pílula nova entra com o quique
                        key={main.id}
                        type="button"
                        className={`es-pill m-${main.id}${open ? ' open' : ''}`}
                        aria-expanded={open}
                        aria-controls="es-modes"
                        onClick={() => onOpen(!open)}
                    >
                        <span className="es-mode-ic">
                            <HudIcon kind={main.icon} />
                        </span>
                        <span className="es-pill-txt">
                            <b>{main.title}</b>
                            <small>{main.sub}</small>
                        </span>
                        <HudIcon kind="up" className="es-pill-caret" />
                    </button>
                    <button
                        type="button"
                        className="es-arrow cb cb-blue"
                        aria-label={t('home.amb.modeNext')}
                        onClick={() => pick(stepMode(ids, main.id, 1))}
                    >
                        <HudIcon kind="next" />
                    </button>
                </div>
            )}
            <button
                type="button"
                data-coach="quick"
                className="btn cb cb-gold es-play"
                disabled={main.busy}
                onClick={() => {
                    onOpen(false);
                    main.go();
                }}
            >
                <i className="cb-shine" aria-hidden />
                <b className="es-play-verb">{main.verb ?? t('home.play')}</b>
                {/* com a pílula, o modo fica nela (e aqui só pro leitor de tela); sem ela, embaixo do JOGAR */}
                <small className={pill ? 'sr-only' : 'es-play-sub'}>
                    {pill ? `${main.title} · ${main.sub}` : main.sub}
                </small>
            </button>
        </div>
    );
}
