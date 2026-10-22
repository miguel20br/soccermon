import type { FormationId } from '../../engine/formations';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import { FORMATION_ICON } from '../formation-info';
import { HudIcon } from './MatchHud';

/** Selo da vantagem tática: só o ícone (o nome fica no rótulo pra leitor de tela). */
export function EdgeMark() {
    const { t } = useT();
    return (
        <span className="fi-edge" role="img" aria-label={t('team.lineup.edgeBadge')} title={t('team.lineup.edgeBadge')}>
            <HudIcon kind="edge" />
        </span>
    );
}

/**
 * Ícone + forte/fraco curtos ("+Passe +Vel −Chute"); `phrase` põe a descrição em cima (só na escolha antes do
 * draft); `edge` = encaixa contra a do rival. Só spans: entra também dentro do botão da escolha.
 */
export function FormationIdentity({
    id,
    edge = false,
    phrase = false,
}: {
    id: FormationId;
    edge?: boolean;
    phrase?: boolean;
}) {
    const { lang } = useT();
    const text = formationText(id, lang);
    return (
        <span className="fi" key={id}>
            {phrase && <span className="fi-say">{text.description}</span>}
            <span className="fi-tags">
                <HudIcon kind={FORMATION_ICON[id]} />
                {text.up && <b className="fi-up">{text.up}</b>}
                {text.down && <b className="fi-down">{text.down}</b>}
                {edge && <EdgeMark />}
            </span>
        </span>
    );
}
