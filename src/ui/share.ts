import { track } from '../analytics/track';
import { viewInstance } from '../engine/instance';
import { clubName, dict, fmt, getLang, type Lang } from '../i18n';
import { type DailyEntry, dailyShareText, dailyStreak, winsOf } from '../store/daily';
import { isPerfectCup, type RunState } from '../store/game-store';
import { isFinalStage, isLong } from '../store/long-cup';

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
            : isLong(run)
              ? // Rota Índigo: as fases da Relâmpago não existem ("Rota Índigo · Fim da linha na partida 3", "Vice da Rota Índigo")
                isFinalStage(run, run.results.at(-1)?.stage)
                  ? dict(lang).longCup.runnerUp
                  : `${dict(lang).longCup.title} · ${fmt(dict(lang).longCup.out, { n: (run.results.at(-1)?.stage ?? 0) + 1 })}`
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

/**
 * Origem dos links de Compartilhar (o `utm_source` vira o canal no `npm run stats`): `share` é o desafio (a seed) e
 * `daily` a Copa do Dia (até a 0.9.52 os dois eram `share`; link antigo segue abrindo igual).
 */
export const SHARE_UTM = { seed: 'share', daily: 'daily' } as const;

/** Link do desafio: marca a origem e leva a seed no fim, como a Ajuda explica. */
export function challengeUrl(seed: string): string {
    const params = new URLSearchParams({ utm_source: SHARE_UTM.seed, seed });
    return `${SITE_URL}/?${params}`;
}

/** Link da Copa do Dia no texto de Compartilhar. */
export const DAILY_SHARE_URL = `${SITE_URL}/?utm_source=${SHARE_UTM.daily}`;

/** Texto da Copa do Dia (número do dia, quadradinhos, placares, semana e link), no idioma do jogo. */
export const buildDailyShareText = (e: DailyEntry, list: DailyEntry[], lang: Lang = getLang()) =>
    dailyShareText(
        e,
        dailyStreak(list, e.day),
        dict(lang).liga.daily.shareText,
        (n) => clubName(n, lang),
        DAILY_SHARE_URL,
    );

/** Compartilha a Copa do Dia e conta no `share` (`from`: a tela do dia ou o resultado da última partida). */
export async function shareDaily(e: DailyEntry, list: DailyEntry[], from: 'tela' | 'resultado') {
    const res = await shareText(buildDailyShareText(e, list));
    track('share', { kind: 'daily', result: res, champion: e.champion, wins: winsOf(e), from });
    return res;
}

/**
 * Compartilha pelo menu nativo (celular) ou copia para a área de transferência. Com `image` (card do
 * título, src/ui/share-card.ts) e um navegador que aceite arquivo, a imagem vai junto do texto.
 */
export const shareRun = (run: RunState, image?: Blob | null) => shareText(buildShareText(run), image);

/** Menu nativo (celular) ou área de transferência, com a imagem junto quando o navegador aceita arquivo. */
export async function shareText(text: string, image?: Blob | null): Promise<'shared' | 'copied' | 'failed'> {
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
