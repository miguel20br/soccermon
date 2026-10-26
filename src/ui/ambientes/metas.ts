/**
 * As metas que os ambientes deixam à vista (a de cada lugar): o quadro de missões da Sede e o próximo cinturão da
 * Arena. Só conta, sem tela.
 */
import { MISSIONS, type Mission, missionCount, type SaveView } from '../../store/missions';
import { BELTS } from '../../store/trophies';

export interface Goal {
    m: Mission;
    n: number;
    goal: number;
}

/**
 * As `max` missões abertas mais perto de sair: a maior fração feita primeiro; empatou, a de meta menor (a mais fácil
 * de fechar) e depois a ordem da tabela. Feito sem contador vale 0 de 1. Duas missões com o mesmo contador e a mesma
 * meta (uma dá o treinador, a outra o título) aparecem uma vez só.
 */
export function closestMissions(view: SaveView, max = 3, list: readonly Mission[] = MISSIONS): Goal[] {
    const taken = new Map<Mission['count'], number>();
    return list
        .flatMap((m, i) => {
            if (view.done.has(m.id)) return [];
            const goal = m.goal ?? 1;
            return [{ m, n: m.goal ? missionCount(m, view) : 0, goal, i }];
        })
        .sort((a, b) => b.n / b.goal - a.n / a.goal || a.goal - b.goal || a.i - b.i)
        .filter(({ m, goal }) => {
            if (!m.count) return true;
            if (taken.get(m.count) === goal) return false;
            taken.set(m.count, goal);
            return true;
        })
        .slice(0, max)
        .map(({ m, n, goal }) => ({ m, n, goal }));
}

/** O próximo cinturão do Duelo (vitórias até ele); `null` com o de ouro na mão. */
export function nextBelt(wins: number): { metal: (typeof BELTS)[number]['metal']; n: number; goal: number } | null {
    const b = BELTS.find((x) => wins < x.wins);
    return b ? { metal: b.metal, n: wins, goal: b.wins } : null;
}

/** O pedaço da copa que a Rota usa pra montar o time no mapa. */
interface TeamRun {
    picks: readonly { uid: string; speciesId: number }[];
    lineup: readonly string[];
    captainUid?: string | null;
}

/**
 * Quem anda no mapa da Rota: na Rota aberta, o capitão e os 2 primeiros da escalação; enquanto o time ainda não
 * existe (formação, draft sem escalação), o mesmo de fallback do Estádio: o 1º escolhido ou o seu avatar (Pikachu
 * sem avatar de Pokémon). Nunca vazio: o mapa sem ninguém parecia quebrado.
 */
export function routeTeam(run: TeamRun | null | undefined, longOn: boolean, avatarId: number | null): number[] {
    if (longOn && run) {
        const byUid = new Map(run.picks.map((p) => [p.uid, p]));
        const cap = run.picks.find((p) => p.uid === run.captainUid);
        const rest = run.lineup.flatMap((u) => (u === run.captainUid ? [] : (byUid.get(u) ?? [])));
        const team = [cap, ...rest].flatMap((p) => (p ? [p.speciesId] : [])).slice(0, 3);
        if (team.length) return team;
        if (run.picks[0]) return [run.picks[0].speciesId];
    }
    return [avatarId ?? 25];
}

/** Um slot de meta do Estádio (o "baú" do Clash): quanto já foi e se fechou. */
export interface Slot {
    n: number;
    goal: number;
}

/**
 * A barrinha de um slot: a fração (0 a 1, sem passar) e se fechou. Meta até 8 vira gomos (as lâmpadas da semana, as 8
 * insígnias); acima disso, barra corrida.
 */
export function slotFill({ n, goal }: Slot): { k: number; full: boolean; segs: number } {
    const g = Math.max(1, goal);
    const k = Math.min(1, Math.max(0, n / g));
    return { k, full: k >= 1, segs: g <= 8 ? g : 0 };
}

/**
 * O número que sobe (contador do Clash): de 0 ao alvo em `dur` ms, rápido no começo e assentando no fim; sempre
 * inteiro, nunca passa do alvo nem volta.
 */
export function countAt(target: number, ms: number, dur = 700): number {
    if (ms >= dur || target <= 0) return target;
    const t = Math.max(0, ms) / dur;
    return Math.min(target, Math.floor(target * (1 - (1 - t) ** 3)));
}
