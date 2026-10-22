import { useState } from 'react';
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
/**
 * Carta do Patrocínio. `price` (Mercado): o preço fica no contrato, como uma etiqueta; `lack` = quanto falta (apaga
 * e leva o cadeado, igual aos outros itens).
 */
export function SponsorCard({
    id,
    price,
    lack = 0,
    children,
}: {
    id: SponsorId;
    price?: number;
    lack?: number;
    children?: React.ReactNode;
}) {
    const { t } = useT();
    const fam = SPONSOR_FAMILY[id];
    const txt = sponsorText(id);
    return (
        <div className={`sp-card fam-${fam}`} style={{ '--brand': SPONSOR_BRAND[id] } as React.CSSProperties}>
            <span className="sp-plate">
                <span className="sp-ribbon">{t('shop.kind.sponsor')}</span>
                <HudIcon kind={SPONSOR_ICON[id]} />
                <b>{txt.short}</b>
            </span>
            <span className="sp-contract">
                <span className="sp-fam">{t(`shop.family.${fam}`)}</span>
                <b className="sp-name">{txt.name}</b>
                <span className="sp-desc">{txt.desc}</span>
                <span className="sp-sign">
                    {t('shop.contract')}
                    {price !== undefined && (
                        <b className={`sp-price${lack > 0 ? ' lack' : ''}`}>
                            {lack > 0 && <HudIcon kind="lock" />}
                            {lack > 0 ? t('shop.priceShort', { price, n: lack }) : t('shop.money', { n: price })}
                        </b>
                    )}
                </span>
            </span>
            {children}
        </div>
    );
}

const SLOT_KEYS = Array.from({ length: MAX_SPONSORS }, (_, i) => `vaga-${i}`);

/** As 3 vagas de Patrocínio (Escalação e Mercado). `onPick`: escolher qual sai quando as vagas estão cheias. */
export function SponsorSlots({ sponsors, onPick }: { sponsors: readonly string[]; onPick?: (id: string) => void }) {
    const { t } = useT();
    // sem `onPick`: tocar num Patrocínio mostra o que ele faz (no celular não tem o "passar o mouse")
    const [open, setOpen] = useState<SponsorId | null>(null);
    const shown = open && sponsors.includes(open) ? open : null;
    return (
        <>
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
                    const brand = { '--brand': SPONSOR_BRAND[id] } as React.CSSProperties;
                    return (
                        <li key={id} className="sp-slot-li" title={txt.desc} style={brand}>
                            <button
                                type="button"
                                className={`sp-slot${shown === id ? ' on' : ''}`}
                                style={brand}
                                aria-label={txt.name}
                                aria-expanded={onPick ? undefined : shown === id}
                                onClick={() => (onPick ? onPick(id) : setOpen(shown === id ? null : id))}
                            >
                                <HudIcon kind={SPONSOR_ICON[id]} />
                                <span className="sp-slot-name">{txt.name}</span>
                                <span className="sp-slot-short" aria-hidden="true">
                                    {txt.short}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            {shown && (
                <p className="sp-slot-desc" style={{ '--brand': SPONSOR_BRAND[shown] } as React.CSSProperties}>
                    <b>{sponsorText(shown).name}:</b> {sponsorText(shown).desc}
                </p>
            )}
        </>
    );
}
