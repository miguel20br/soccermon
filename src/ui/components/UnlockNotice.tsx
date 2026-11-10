import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { dict, t } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { KANTO_BADGES, missionById, type TrainerId } from '../../store/missions';
import { KantoBadge } from './BadgeCase';
import '../animacoes.css';
import { useWipeBusy } from '../kit/wipe-store';
import { missionText, titleName, trainerName } from '../profile/club';
import { MedalIcon } from '../profile/icons';
import { TrainerSprite } from '../profile/TrainerTab';

/** O que o aviso diz: o prêmio ("Título novo: Original e Clone") e a tarefa cumprida. */
export function noticeLines(id: string): { head: string; task: string } | null {
    const m = missionById(id);
    if (!m) return null;
    const head = m.trainer
        ? t('profile.unlocked.trainer', { name: trainerName(m.trainer) })
        : t('profile.unlocked.title', { name: titleName(m.title ?? '') });
    return { head, task: missionText(m) };
}

/** Quanto o selo fica na tela (batida, pausa e saída); o próximo da fila vem depois. */
const SEAL_MS = 1200;
const OUT_MS = 220;
/** A insígnia batendo: o jingle de 2 s (scripts/musica/pecas/insignia.mjs), a batida aos 560 ms. */
const BADGE_MS = 2300;
/** As faíscas da batida, em volta (graus). */
const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Missão cumprida (treinador ou título novo): o selo dourado batendo com o sprite em cima (cara-de-jogo.md, Modais
 * e avisos), por 1,2 s, um de cada vez. Só na volta pro menu (Home), nunca durante outra comemoração: o Campeão e o
 * Resultado não mostram nada, a fila espera; com a tela coberta por uma transição (momento, porta) ou o passo a passo
 * aberto, espera também. Não pega toque.
 */
export function UnlockNotice() {
    useT(); // troca de idioma redesenha
    const id = useGame((s) => s.unlockQueue[0]);
    const shift = useGame((s) => s.shiftUnlock);
    const free = useGame((s) => s.screen === 'home' && !s.tour);
    const busy = useWipeBusy();
    const [out, setOut] = useState(false);
    // tocou pra pular: a fila anda pelo toque (o relógio da batida não anda de novo)
    const skipped = useRef(false);
    const on = !!id && free && !busy;
    // insígnia de Kanto (1ª vitória contra o líder, no máximo 8 por save): entra girando e bate, com o jingle
    const badge = !!id && (KANTO_BADGES as readonly string[]).includes(id);
    const ms = badge ? BADGE_MS : SEAL_MS;
    // biome-ignore lint/correctness/useExhaustiveDependencies: cada selo da fila (id) ganha o seu tempo
    useEffect(() => {
        if (!on) return;
        setOut(false);
        skipped.current = false;
        if (badge) {
            // a música vai pro fundo enquanto o jingle toca (sob demanda: o áudio cria o AudioContext ao carregar)
            void import('../../game/music').then((m) => m.duckMusic());
            void import('../../game/audio').then((a) => a.playBadgeJingle());
        }
        const fade = window.setTimeout(() => setOut(true), ms - OUT_MS);
        const next = window.setTimeout(() => skipped.current || shift(), ms);
        return () => {
            if (badge) void import('../../game/music').then((m) => m.unduckMusic(false));
            clearTimeout(fade);
            clearTimeout(next);
        };
    }, [on, id, shift]);
    const lines = id ? noticeLines(id) : null;
    const m = id ? missionById(id) : undefined;
    if (!on || !lines) return null;
    if (badge && id)
        return createPortal(
            // toque pula (o jingle termina sozinho)
            <button
                type="button"
                key={id}
                className={`badge-slam${out ? ' out' : ''}`}
                onClick={() => {
                    if (skipped.current) return;
                    skipped.current = true;
                    setOut(true);
                    window.setTimeout(shift, OUT_MS);
                }}
            >
                <span className="bs-badge">
                    <i className="bs-ring" aria-hidden />
                    {SPARKS.map((a) => (
                        <i key={a} className="bs-spark" style={{ '--a': `${a}deg` } as CSSProperties} aria-hidden />
                    ))}
                    <KantoBadge leader={id as TrainerId} earned />
                </span>
                <b className="bs-text k-seal" role="status">
                    {t('profile.badges.won', { name: dict().profile.badges.names[id] ?? '' })}
                </b>
                <small className="bs-sub">{lines.head}</small>
            </button>,
            document.body,
        );
    return createPortal(
        <div key={id} className={`unlock-seal${out ? ' out' : ''}`} role="status">
            {m?.trainer ? <TrainerSprite id={m.trainer} /> : <MedalIcon />}
            <b className="k-seal">{lines.head}</b>
        </div>,
        document.body,
    );
}
