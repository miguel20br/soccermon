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

/**
 * A linha de baixo do JOGAR: o modo (com o seletor) e o detalhe, sem repetir o verbo do botão ("JOGAR HOJE" com
 * "Copa do Dia · Jogar hoje" embaixo, "CONTINUAR" com "Continuar · …").
 */
export function playSub(main: Pick<Mode, 'title' | 'sub' | 'verb'>, rail: boolean): string {
    const verb = main.verb?.toLocaleLowerCase();
    return (rail ? [main.title, main.sub] : [main.sub]).filter((x) => x && x.toLocaleLowerCase() !== verb).join(' · ');
}

/**
 * O rodapé do Estádio: cada modo com o seu lugar (pedido do Miguel, 30/10: o seletor de pílula com setas e lista era
 * burocrático), uma fileira de placas com ícone e nome em cima do JOGAR dourado. Tocar numa placa só escolhe o modo
 * (ela sobe e acende); quem joga é o JOGAR, que diz o modo escolhido embaixo.
 */
export function PlayBar({ main, sheet, onPick }: { main: Mode; sheet: Mode[]; onPick: (id: ModeId) => void }) {
    const { t } = useT();
    const rail = sheet.length > 0;
    return (
        <div className={`es-go${rail ? ' has-modes' : ''}`}>
            {rail && (
                <fieldset className="es-rail" aria-label={t('home.amb.modesAria')}>
                    {sheet.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            aria-pressed={m.id === main.id}
                            className={`es-tile m-${m.id}${m.id === main.id ? ' on' : ''}`}
                            disabled={m.busy}
                            onClick={() => onPick(m.id)}
                        >
                            <span className="es-mode-ic">
                                <HudIcon kind={m.icon} />
                            </span>
                            <b>{m.title}</b>
                        </button>
                    ))}
                </fieldset>
            )}
            <button
                type="button"
                data-coach="quick"
                className="btn cb cb-gold es-play"
                disabled={main.busy}
                onClick={main.go}
            >
                <i className="cb-shine" aria-hidden />
                <b className="es-play-verb">{main.verb ?? t('home.play')}</b>
                <small className="es-play-sub">{playSub(main, rail)}</small>
            </button>
        </div>
    );
}
