import { MAX_SPONSORS, SPONSOR_FAMILY, type SponsorId } from '../../engine/sponsors';
import { sponsorText } from '../../i18n';
import { useT } from '../../i18n/react';
import { HudIcon, type HudIconKind } from './MatchHud';
import '../shop.css';

export const SPONSOR_ICON: Record<SponsorId, HudIconKind> = {
    fanclube: 'heart',
    cassino: 'dice',
    ssanne: 'ship',
    loja: 'bag',
    cinnabar: 'flask',
    creche: 'egg',
    safari: 'leaf',
    silph: 'building',
    bicicletaria: 'bike',
    academia: 'book',
    torcida: 'shout',
    master: 'crown',
};

/** Valor em ₽ (Pokédólar, só dentro da copa). */
export function Money({ n, className }: { n: number; className?: string }) {
    const { t } = useT();
    return <span className={`money${className ? ` ${className}` : ''}`}>{t('shop.money', { n })}</span>;
}

/** Carta do Patrocínio (os "Jokers" da copa): família na etiqueta, emblema, nome e o efeito. */
export function SponsorCard({ id, children }: { id: SponsorId; children?: React.ReactNode }) {
    const { t } = useT();
    const fam = SPONSOR_FAMILY[id];
    const txt = sponsorText(id);
    return (
        <div className={`sp-card fam-${fam}`}>
            <span className="sp-fam">{t(`shop.family.${fam}`)}</span>
            <span className="sp-emblem">
                <HudIcon kind={SPONSOR_ICON[id]} />
            </span>
            <b className="sp-name">{txt.name}</b>
            <span className="sp-desc">{txt.desc}</span>
            {children}
        </div>
    );
}

const SLOT_KEYS = Array.from({ length: MAX_SPONSORS }, (_, i) => `vaga-${i}`);

/** As 3 vagas de Patrocínio (Escalação e Mercado). `onPick`: escolher qual sai quando as vagas estão cheias. */
export function SponsorSlots({ sponsors, onPick }: { sponsors: readonly string[]; onPick?: (id: string) => void }) {
    const { t } = useT();
    return (
        <ul className="sp-slots" aria-label={t('shop.sponsors')}>
            {SLOT_KEYS.map((slot, i) => {
                const id = sponsors[i] as SponsorId | undefined;
                if (!id)
                    return (
                        <li key={slot} className="sp-slot free" title={t('shop.emptySlot')}>
                            <span className="sp-slot-name">{t('shop.emptySlot')}</span>
                        </li>
                    );
                const txt = sponsorText(id);
                const fam = `sp-slot fam-${SPONSOR_FAMILY[id]}`;
                const body = (
                    <>
                        <HudIcon kind={SPONSOR_ICON[id]} />
                        <span className="sp-slot-name">{txt.name}</span>
                    </>
                );
                return (
                    <li key={id} className={onPick ? 'sp-slot-li' : fam} title={txt.desc}>
                        {onPick ? (
                            <button type="button" className={fam} onClick={() => onPick(id)}>
                                {body}
                            </button>
                        ) : (
                            body
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
