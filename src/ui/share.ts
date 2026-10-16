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
        fmt(tx.challenge, { url: challengeUrl(run.seed) }),
    ].join('\n');
}

/** Link do desafio: marca a origem (utm_source=share) e leva a seed no fim, como a Ajuda explica. */
export function challengeUrl(seed: string): string {
    const params = new URLSearchParams({ utm_source: 'share', seed });
    return `${SITE_URL}/?${params}`;
}

/**
 * Compartilha pelo menu nativo (celular) ou copia para a área de transferência. Com `image` (card do
 * título, src/ui/share-card.ts) e um navegador que aceite arquivo, a imagem vai junto do texto.
 */
export async function shareRun(run: RunState, image?: Blob | null): Promise<'shared' | 'copied' | 'failed'> {
    const text = buildShareText(run);
    try {
        if (navigator.share) {
            const files = image ? [new File([image], 'soccermon.png', { type: 'image/png' })] : [];
            await navigator.share(files.length && navigator.canShare?.({ files }) ? { files, text } : { text });
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
