import { viewInstance } from '../engine/instance';
import { isPerfectCup, type RunState, stageLabel } from '../store/game-store';

export const SITE_URL = 'https://soccermon.vercel.app';

/** Resultado da copa em texto curto, estilo Wordle, para colar em qualquer lugar. */
export function buildShareText(run: RunState): string {
    const byUid = new Map(run.picks.map((p) => [p.uid, p]));
    const headline =
        run.status === 'champion'
            ? isPerfectCup(run)
                ? '🏆 COPA PERFEITA!'
                : '🏆 Campeão!'
            : `Caiu nas ${stageLabel(run.results.at(-1)?.stage ?? 0).toLowerCase()}`;
    const lines = run.results.map((r) => {
        const pen = r.shootout ? ` (pên. ${r.shootout[0]}x${r.shootout[1]})` : '';
        return `${r.won ? '🟩' : '🟥'} ${r.score[0]}x${r.score[1]}${pen} ${r.opponent}`;
    });
    const squad = run.lineup
        .map((u) => byUid.get(u))
        .filter((p) => !!p)
        .map((p) => `${viewInstance(p).displayName}${p.uid === run.captainUid ? ' (C)' : ''}`)
        .join(', ');
    return [
        `Soccermon ⚽ ${run.teamName} — ${headline}`,
        ...lines,
        `Time: ${squad}`,
        `Desafie a mesma copa: ${SITE_URL}/?seed=${run.seed}`,
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
