import { useCloud } from '../cloud/cloud';
import { type GameStore, useGame } from '../store/game-store';
import { type DailyReport, league } from './api';

/**
 * Manda cada partida da Copa do Dia pro ranking, na ordem, logo depois do apito (com o time escalado e as ordens, pra
 * auditoria). Sem rede, tenta de novo; recarregou antes de mandar, manda o placar sem o time (o servidor aceita).
 */
const queue: DailyReport[] = [];
let sending = false;
const RETRY_MS = 8000;

async function flush() {
    if (sending) return;
    sending = true;
    queue.sort((a, b) => (a.day === b.day ? a.stage - b.stage : a.day < b.day ? -1 : 1));
    try {
        while (queue.length) {
            const a = queue[0];
            const entry = useGame.getState().daily.find((e) => e.day === a.day);
            if (!entry?.ranked || (entry.reported ?? 0) > a.stage) {
                queue.shift();
                continue;
            }
            if (!(await league().dailyReport(a))) {
                window.setTimeout(() => void flush(), RETRY_MS);
                return;
            }
            useGame.getState().markDailyReported(a.day, a.stage + 1);
            queue.shift();
        }
    } finally {
        sending = false;
    }
}

/** Partidas que ficaram sem mandar (a página fechou antes). */
function pendingFromSave(s: Pick<GameStore, 'daily'>) {
    for (const e of s.daily) {
        if (!e.ranked) continue;
        for (let stage = e.reported ?? 0; stage < e.results.length; stage++) {
            if (queue.some((q) => q.day === e.day && q.stage === stage)) continue;
            const r = e.results[stage];
            queue.push({ day: e.day, stage, score: r.score, shootout: r.shootout, team: {}, orders: [] });
        }
    }
}

export function startLeagueSync() {
    useGame.subscribe((s, prev) => {
        const run = s.run;
        const old = prev.run;
        if (!run?.daily || old?.seed !== run.seed || run.results.length <= old.results.length) return;
        const stage = run.results.length - 1;
        const r = run.results[stage];
        // o time e as ordens ainda estão no estado de antes do apito (o resultado limpa os dois)
        queue.push({
            day: run.daily,
            stage,
            score: [r.score[0], r.score[1]],
            shootout: r.shootout,
            team: old.lockedTeam ?? {},
            orders: old.live?.orders ?? [],
        });
        void flush();
    });
    // logou (ou a sessão voltou): manda o que ficou pra trás
    useCloud.subscribe((c, prev) => {
        if (c.user && !prev.user) {
            pendingFromSave(useGame.getState());
            void flush();
        }
    });
}
