import { isSponsorId, MAX_SPONSORS, SPONSOR_FAMILY, type SponsorId } from '../../engine/sponsors';
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

/** Cor de marca de cada Patrocínio (placa da carta, vaga e placa na beira da quadra). */
export const SPONSOR_BRAND: Record<SponsorId, string> = {
    fanclube: '#d9478f',
    cassino: '#c8303a',
    ssanne: '#1f3f8f',
    loja: '#2f9a63',
    cinnabar: '#d9562a',
    creche: '#c98a12',
    safari: '#5f7f22',
    silph: '#2a5fb8',
    bicicletaria: '#1f93c4',
    academia: '#b8681c',
    torcida: '#d93a2b',
    master: '#7238b0',
};

/** Placas da beira da quadra: os Patrocínios da copa com o nome curto e a cor da marca. */
export const sponsorBoards = (sponsors: readonly string[] | undefined) =>
    sponsors?.filter(isSponsorId).map((id) => ({
        text: sponsorText(id).short,
        color: Number.parseInt(SPONSOR_BRAND[id].slice(1), 16),
    }));

/** Valor em ₽ (Pokédólar, só dentro da copa). */
export function Money({ n, className }: { n: number; className?: string }) {
    const { t } = useT();
    return <span className={`money${className ? ` ${className}` : ''}`}>{t('shop.money', { n })}</span>;
}

/**
 * Carta do Patrocínio (os "Jokers" da copa) com cara de patrocínio: em cima a placa da marca (a cor dela, o emblema e o
 * nome curto, como o patch da camisa), embaixo o contrato (família, nome, o efeito e a linha da assinatura).
 */
export function SponsorCard({ id, children }: { id: SponsorId; children?: React.ReactNode }) {
    const { t } = useT();
    const fam = SPONSOR_FAMILY[id];
    const txt = sponsorText(id);
    return (
        <div className={`sp-card fam-${fam}`} style={{ '--brand': SPONSOR_BRAND[id] } as React.CSSProperties}>
            <span className="sp-plate">
                <HudIcon kind={SPONSOR_ICON[id]} />
                <b>{txt.short}</b>
            </span>
            <span className="sp-contract">
                <span className="sp-fam">{t(`shop.family.${fam}`)}</span>
                <b className="sp-name">{txt.name}</b>
                <span className="sp-desc">{txt.desc}</span>
                <span className="sp-sign">{t('shop.contract')}</span>
            </span>
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
                const fam = 'sp-slot';
                const brand = { '--brand': SPONSOR_BRAND[id] } as React.CSSProperties;
                const body = (
                    <>
                        <HudIcon kind={SPONSOR_ICON[id]} />
                        <span className="sp-slot-name">{txt.name}</span>
                    </>
                );
                return (
                    <li key={id} className={onPick ? 'sp-slot-li' : fam} title={txt.desc} style={brand}>
                        {onPick ? (
                            <button type="button" className={fam} style={brand} onClick={() => onPick(id)}>
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
