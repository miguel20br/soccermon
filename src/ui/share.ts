import { viewInstance } from '../engine/instance';
import { clubName, dict, fmt, getLang, type Lang } from '../i18n';
import { isPerfectCup, type RunState } from '../store/game-store';

export const SITE_URL = 'https://soccermon.com';

/** Resultado da copa em texto curto, estilo Wordle, para colar em qualquer lugar (no idioma do jogo). */
export function buildShareText(run: RunState, lang: Lang = getLang()): string {
    const tx = dict(lang).result.shareText;
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const headline =
        run.status === 'champion'
            ? isPerfectCup(run)
                ? tx.perfect
                : tx.champion
            : fmt(tx.out, { stage: dict(lang).common.stageIn[run.results.at(-1)?.stage ?? 0] ?? tx.outFallback });
    const lines = run.results.map((r) => {
        const pen = r.shootout ? fmt(tx.pens, { a: r.shootout[0], b: r.shootout[1] }) : '';
        return `${r.won ? '🟩' : '🟥'} ${r.score[0]}x${r.score[1]}${pen} ${clubName(r.opponent, lang)}`;
    });
    const squad = run.lineup
        .map((u) => byUid.get(u))
        .filter((p) => !!p)
        .map((p) => `${viewInstance(p).displayName}${p.uid === run.captainUid ? ' (C)' : ''}`)
        .join(', ');
    return [
        `Soccermon ⚽ ${run.teamName} — ${headline}`,
        ...lines,
        fmt(tx.team, { squad }),
        fmt(tx.challenge, { url: `${SITE_URL}/?seed=${run.seed}` }),
    ].join('\n');
}

/** Compartilha pelo menu nativo (celular) ou copia para a área de transferência. */
export async function shareRun(run: RunState): Promise<'shared' | 'copied' | 'failed'> {
    const text = buildShareText(run);
    try {
        if (navigator.share) {
            await navigator.share({ text });
            return 'shared';
        }
    } catch {
        // usuário cancelou o menu nativo: cai para a cópia
    }
    try {
        await navigator.clipboard.writeText(text);
        return 'copied';
    } catch {
        return 'failed';
    }
}
