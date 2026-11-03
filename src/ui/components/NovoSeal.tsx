import { useT } from '../../i18n/react';

/** Selo "NOVO": a espécie ainda não estava na Pokédex quando a carta apareceu. */
export function NovoSeal() {
    const { t } = useT();
    return (
        <span className="novo-seal" title={t('team.novoTitle')}>
            {t('team.novo')}
        </span>
    );
}
