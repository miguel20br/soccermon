import Phaser from 'phaser';
import { type CSSProperties, useEffect, useState } from 'react';
import { CLUBS } from '../../engine/cup';
import type { LeaderId } from '../../engine/rival-coach';
import { drawCourt, GAME_H, GAME_W } from '../../game/court';
import { COURTS } from '../../game/court-themes';
import { clubName } from '../../i18n';
import { useT } from '../../i18n/react';
import { trainerSrc } from '../../store/missions';
import { MenuHead } from '../components/MenuHead';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Desenha cada quadra uma vez numa cena escondida e devolve as imagens (leve no celular: nada fica rodando). */
function useCourtImages(): Partial<Record<LeaderId, string>> {
    const [imgs, setImgs] = useState<Partial<Record<LeaderId, string>>>({});
    useEffect(() => {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;overflow:hidden';
        document.body.appendChild(host);
        let done = false;
        class Shot extends Phaser.Scene {
            create() {
                const out: Partial<Record<LeaderId, string>> = {};
                for (const club of CLUBS) {
                    const g = drawCourt(this, COURTS[club.leader]);
                    const canvas = document.createElement('canvas');
                    canvas.width = GAME_W;
                    canvas.height = GAME_H;
                    g.generateTexture(canvas, GAME_W, GAME_H);
                    g.destroy();
                    out[club.leader] = canvas.toDataURL('image/png');
                }
                if (!done) setImgs(out);
            }
        }
        const game = new Phaser.Game({
            type: Phaser.CANVAS,
            width: GAME_W,
            height: GAME_H,
            parent: host,
            audio: { noAudio: true },
            banner: false,
            scene: [Shot],
        });
        return () => {
            done = true;
            game.destroy(true);
            host.remove();
        };
    }, []);
    return imgs;
}

/**
 * `?lab=quadras`: os treinadores da copa e a quadra de cada ginásio (o rival joga em casa), com as falas do VERSUS e
 * do fim de jogo. Pra conferir o visual sem jogar a copa inteira.
 */
export function CourtLab({ onExit }: { onExit: () => void }) {
    const { t, d } = useT();
    const imgs = useCourtImages();
    const lab = d.match.courtLab;
    return (
        <div className="court-lab">
            <MenuHead title={lab.title} icon="cards" onBack={onExit} tag={t('common.ui.menu')} />
            <p className="muted court-lab-intro">{lab.intro}</p>
            <div className="court-lab-grid">
                {CLUBS.map((club) => {
                    const l = d.match.leaders[club.leader];
                    return (
                        <article
                            key={club.name}
                            className="panel court-card"
                            style={{ '--c': hex(club.color) } as CSSProperties}
                        >
                            <div className="court-card-img">
                                {imgs[club.leader] ? (
                                    <img src={imgs[club.leader]} alt={lab.alt.replace('{club}', clubName(club.name))} />
                                ) : (
                                    <span className="muted">{t('common.ui.loading')}</span>
                                )}
                            </div>
                            <header>
                                <img className="pixel" src={trainerSrc(club.leader)} alt="" />
                                <span>
                                    <b>{clubName(club.name)}</b>
                                    <small>
                                        {l.name} · {club.city}
                                    </small>
                                </span>
                            </header>
                            <dl>
                                <dt>{lab.pre}</dt>
                                <dd>{l.pre}</dd>
                                <dt>{lab.win}</dt>
                                <dd>{l.win}</dd>
                                <dt>{lab.lose}</dt>
                                <dd>{l.lose}</dd>
                            </dl>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
