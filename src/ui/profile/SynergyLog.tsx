import { LINKS } from '../../engine/links';
import { linkText, secretText } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { combosFoundOf, SECRET_LINKS, SECRET_TOTAL, type SecretLink, TEAM_SECRETS } from '../../store/secret-links';
import { HudIcon } from '../components/MatchHud';
import { speciesGif } from './club';
import './synergy-log.css';

/** Quem aparece no cartão de uma secreta descoberta: o 1º par dela (o espelho mostra o Mewtwo dos dois lados). */
const faces = (s: SecretLink): number[] => (s.pairs === 'mirror' ? [150, 150] : [s.pairs[0][0][0], s.pairs[0][1][0]]);

const STORY = LINKS.filter((l) => !l.secret);

const Shadows = ({ n }: { n: number }) => (
    <span className="sl-faces" aria-hidden>
        {Array.from({ length: n }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: silhuetas iguais
            <i key={i} className="sl-shadow">
                ?
            </i>
        ))}
    </span>
);

const Faces = ({ ids }: { ids: number[] }) => (
    <span className="sl-faces" aria-hidden>
        {ids.map((id, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: o espelho repete a espécie
            <img key={i} className="pixel" src={speciesGif(id)} alt="" loading="lazy" draggable={false} />
        ))}
    </span>
);

/**
 * Registro de Sinergias (Coleção; docs/planos/pesquisas/sinergias-e-animacoes.md, §5): as de história abertas, as
 * secretas como silhueta com a charada até acontecerem em quadra. O nome de uma secreta só aparece depois de descoberta.
 */
export function SynergyLog() {
    const { t, lang } = useT();
    const found = new Set(combosFoundOf({ combosFound: useGame((s) => s.profile.combosFound) }));
    const total = STORY.length + SECRET_TOTAL;
    const known = STORY.length + found.size;
    return (
        <div className="pf-dex sl">
            <div className="pf-dex-progress">
                <div className="pf-dex-counts">
                    <span>{t('common.secretUi.title')}</span>
                    <span>
                        <b>{known}</b>/{total}
                    </span>
                </div>
                <div className="k-bar" role="img" aria-label={t('common.secretUi.count', { n: known, total })}>
                    <i style={{ width: `${(known / total) * 100}%` }} />
                </div>
            </div>

            <h3 className="sl-h">{t('common.secretUi.secret')}</h3>
            <ul className="sl-grid">
                {SECRET_LINKS.map((s) => {
                    const txt = secretText(s.id, lang);
                    const open = found.has(s.id);
                    return (
                        <li key={s.id} className={`sl-card secret${open ? ' found' : ''}`} data-secret={s.id}>
                            {open ? <Faces ids={faces(s)} /> : <Shadows n={s.members} />}
                            <span className="sl-txt">
                                <b>{open ? txt.name : '???'}</b>
                                <small className="sl-tag">
                                    <HudIcon kind="max" /> {t('common.secretUi.rival')}
                                </small>
                                <span className="sl-desc">{open ? txt.desc : txt.riddle}</span>
                            </span>
                        </li>
                    );
                })}
                {TEAM_SECRETS.map((l) => {
                    const id = l.secret!;
                    const txt = secretText(id, lang);
                    const open = found.has(id);
                    return (
                        <li key={id} className={`sl-card secret${open ? ' found' : ''}`} data-secret={id}>
                            {open ? (
                                <Faces ids={l.groups.slice(0, l.need).map((g) => g[g.length - 1])} />
                            ) : (
                                <Shadows n={l.need} />
                            )}
                            <span className="sl-txt">
                                <b>{open ? txt.name : '???'}</b>
                                <small className="sl-tag">
                                    {t('common.secretUi.bonus', { n: Math.round((l.bonus - 1) * 100) })}
                                </small>
                                <span className="sl-desc">{open ? txt.desc : txt.riddle}</span>
                            </span>
                        </li>
                    );
                })}
            </ul>

            <h3 className="sl-h">{t('common.secretUi.story')}</h3>
            <ul className="sl-grid">
                {STORY.map((l) => {
                    const txt = linkText(l.id, lang);
                    return (
                        <li key={l.id} className="sl-card">
                            <Faces ids={l.groups.slice(0, 3).map((g) => g[g.length - 1])} />
                            <span className="sl-txt">
                                <b>{txt.name}</b>
                                <small className="sl-tag">
                                    {t('common.secretUi.bonus', { n: Math.round((l.bonus - 1) * 100) })}
                                </small>
                                <span className="sl-desc">{txt.desc}</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
