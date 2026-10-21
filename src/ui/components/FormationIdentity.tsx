import type { FormationId } from '../../engine/formations';
import { formationText } from '../../i18n';
import { useT } from '../../i18n/react';
import { edgePct, FORMATION_ICON, formationLines } from '../formation-info';
import { HudIcon } from './MatchHud';

/** (Só spans: entra também dentro do botão da escolha de formação.) Frase, ponto forte e fraco da formação; `edge` = encaixa contra a do rival (selo "Vantagem tática"). */
export function FormationIdentity({ id, edge = false }: { id: FormationId; edge?: boolean }) {
    const { t, lang } = useT();
    const { up, down } = formationLines(id, lang);
    return (
        <span className="fi" key={id}>
            <span className="fi-say">
                <HudIcon kind={FORMATION_ICON[id]} />
                <span>{formationText(id, lang).description}</span>
                {edge && (
                    <span className="fi-edge" title={t('team.lineup.edgeHint', { pct: edgePct(lang) })}>
                        {t('team.lineup.edgeBadge')}
                    </span>
                )}
            </span>
            {up.length > 0 && <span className="fi-up">+ {up.join(' · ')}</span>}
            {down.length > 0 && <span className="fi-down">− {down.join(' · ')}</span>}
        </span>
    );
}
