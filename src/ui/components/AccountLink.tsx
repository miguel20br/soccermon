import { useState } from 'react';
import { answerLink, declineLink, dismissNotice, type LinkAsk, useCloud } from '../../cloud/cloud';
import type { CupSummary, SaveSummary, Side } from '../../cloud/reconcile-plan';
import { stageName, t } from '../../i18n';
import { useT } from '../../i18n/react';
import './account-link.css';

/** Fase da copa como na tela inicial: "Draft · escolha 3 de 7", "Escolhendo a recompensa", "Semifinal". */
export function cupStep(cup: Pick<CupSummary, 'status' | 'stage' | 'draftRound'>): string {
    if (cup.status === 'formation' || cup.status === 'captain' || cup.status === 'drafting')
        return t('home.draftStep', { n: Math.min(cup.draftRound + 1, 7) });
    if (cup.status === 'reward') return t('home.choosingReward');
    if (cup.status === 'shop') return t('home.atMarket');
    return stageName(cup.stage);
}

/** Resumo de um lado (aparelho ou conta): clube, copa em andamento e fase, copas, títulos e Pokédex. */
function SideCard({
    label,
    s,
    pick,
    pickLabel,
    busy,
}: {
    label: string;
    s: SaveSummary;
    pick?: () => void;
    pickLabel?: string;
    busy: boolean;
}) {
    const { t, tn } = useT();
    return (
        <section className="link-side">
            <h3>{label}</h3>
            {/* o clube só aparece quando não é o mesmo nome da copa (economiza espaço no celular) */}
            {s.club && s.club !== s.cup?.team && (
                <p className="link-club">
                    <span className="muted">{t('account.club')}</span> <b>{s.club}</b>
                </p>
            )}
            {s.cup ? (
                <div className="link-cup">
                    <span className="link-cup-label">{t('account.cupNow')}</span>
                    <b>{s.cup.team}</b>
                    <span>{cupStep(s.cup)}</span>
                </div>
            ) : (
                <p className="link-nocup muted">{t('account.noCup')}</p>
            )}
            <ul className="link-stats">
                <li>{tn('account.cups', s.cups)}</li>
                <li>{tn('account.titles', s.titles)}</li>
                <li>{tn('account.seen', s.seen)}</li>
                {s.parked > 0 && <li>{tn('account.parked', s.parked)}</li>}
            </ul>
            {pick && (
                <button type="button" className="btn primary link-pick" disabled={busy} onClick={pick}>
                    {pickLabel}
                </button>
            )}
        </section>
    );
}

function AskDialog({ ask }: { ask: LinkAsk }) {
    const { t } = useT();
    const [busy, setBusy] = useState(false);
    const answer = (side: Side) => {
        setBusy(true);
        void answerLink(side);
    };
    const decline = () => {
        setBusy(true);
        void declineLink();
    };
    const title =
        ask.kind === 'bring'
            ? t('account.bring.title')
            : ask.kind === 'merge'
              ? t('account.merge.title')
              : t('account.cup.title');
    const lead =
        ask.kind === 'bring'
            ? t('account.bring.text')
            : ask.kind === 'merge'
              ? t('account.merge.text')
              : t('account.cup.text');
    const kept = ask.keep === 'device' ? ask.device.cup : ask.cloud?.cup;

    return (
        <div className="modal-backdrop link-backdrop" role="presentation">
            <div className="modal panel link-modal" role="dialog" aria-modal="true" aria-labelledby="link-title">
                <h2 id="link-title">{title}</h2>
                <p className="link-lead">
                    {lead}
                    {ask.cupChoice && (
                        <>
                            {' '}
                            <b className="link-q">{t('account.which')}</b>
                        </>
                    )}
                </p>
                <div className={`link-sides${ask.cloud ? ' two' : ''}`}>
                    <SideCard
                        label={t('account.device')}
                        s={ask.device}
                        busy={busy}
                        pick={ask.cupChoice ? () => answer('device') : undefined}
                        pickLabel={t('account.pickDevice')}
                    />
                    {ask.cloud && (
                        <SideCard
                            label={t('account.cloud')}
                            s={ask.cloud}
                            busy={busy}
                            pick={ask.cupChoice ? () => answer('cloud') : undefined}
                            pickLabel={t('account.pickCloud')}
                        />
                    )}
                </div>
                {ask.kind === 'bring' && <p className="link-note">{t('account.bring.after')}</p>}
                {ask.kind !== 'bring' && <p className="link-note link-best">{t('account.best')}</p>}
                {ask.cupChoice ? (
                    <p className="link-note">{t('account.parkedNote')}</p>
                ) : (
                    ask.kind === 'merge' &&
                    kept && (
                        <p className="link-note">{t('account.continues', { team: kept.team, step: cupStep(kept) })}</p>
                    )
                )}
                <div className="link-actions">
                    {!ask.cupChoice && (
                        <button
                            type="button"
                            className="btn primary big"
                            disabled={busy}
                            onClick={() => answer(ask.keep)}
                            // biome-ignore lint/a11y/noAutofocus: o foco vai para a resposta principal da janela que acabou de abrir
                            autoFocus
                        >
                            {ask.kind === 'bring' ? t('account.bring.yes') : t('account.merge.yes')}
                        </button>
                    )}
                    <button type="button" className="btn ghost" disabled={busy} onClick={decline}>
                        {t('account.notNow')}
                    </button>
                    <span className="muted link-hint">{t('account.notNowHint')}</span>
                </div>
            </div>
        </div>
    );
}

/** Pergunta depois do login (levar/juntar o progresso do aparelho) e o aviso de save de outra conta. */
export function AccountLink() {
    const ask = useCloud((s) => s.ask);
    const notice = useCloud((s) => s.notice);
    const { t } = useT();
    if (ask) return <AskDialog ask={ask} />;
    if (notice === 'other-account') {
        return (
            <div className="link-toast" role="status">
                <span>{t('account.otherAccount')}</span>
                <button type="button" className="btn small" onClick={dismissNotice}>
                    {t('account.ok')}
                </button>
            </div>
        );
    }
    return null;
}
