/**
 * As metas que os ambientes deixam à vista (a de cada lugar): o quadro de missões da Sede e o próximo cinturão da
 * Arena. Só conta, sem tela.
 */
import { MISSIONS, type Mission, missionCount, type SaveView } from '../../store/missions';
import type { Avatar } from '../../store/profile';
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

/**
 * Nível do treinador (a barra de topo): as missões cumpridas em degraus que crescem devagar (1, 2, 2, 3, 3, 4, 4…
 * missões por nível), sem XP nem moeda nova. As 63 missões de hoje fecham o nível 15. `n` de `goal` é o caminho até o
 * próximo nível.
 */
export function trainerLevel(done: number): { level: number; n: number; goal: number } {
    let level = 1;
    let left = Math.max(0, Math.floor(done));
    for (let need = 1; left >= need; need = Math.floor(level / 2) + 1) {
        left -= need;
        level++;
    }
    return { level, n: left, goal: Math.floor(level / 2) + 1 };
}

/** O próximo cinturão do Duelo (vitórias até ele); `null` com o de ouro na mão. */
export function nextBelt(wins: number): { metal: (typeof BELTS)[number]['metal']; n: number; goal: number } | null {
    const b = BELTS.find((x) => wins < x.wins);
    return b ? { metal: b.metal, n: wins, goal: b.wins } : null;
}

/** Um Pokémon desenhado num ambiente: a espécie e a folha (shiny ou normal). */
export interface Mon {
    id: number;
    shiny?: boolean;
}

/**
 * O seu avatar como Pokémon dos ambientes (Pikachu pra quem usa a foto do Google), com o brilho: todo lugar que
 * desenha o avatar passa por aqui, senão o shiny some (o Mew shiny aparecia rosa no mapa da Rota).
 */
export const avatarMon = (avatar: Avatar): Mon =>
    avatar.kind === 'pokemon' ? { id: avatar.speciesId, shiny: avatar.shiny === true } : { id: 25 };

/** O pedaço da copa que a Rota usa pra montar o time no mapa. */
interface TeamRun {
    picks: readonly { uid: string; speciesId: number; shiny?: boolean }[];
    lineup: readonly string[];
    captainUid?: string | null;
}

/**
 * Quem anda no mapa da Rota: na Rota aberta, o capitão e os 2 primeiros da escalação; enquanto o time ainda não
 * existe (formação, draft sem escalação), o mesmo de fallback do Estádio: o 1º escolhido ou o seu avatar (Pikachu
 * sem avatar de Pokémon). Nunca vazio: o mapa sem ninguém parecia quebrado.
 */
export function routeTeam(run: TeamRun | null | undefined, longOn: boolean, avatar: Mon): Mon[] {
    const mon = (p: TeamRun['picks'][number]): Mon => ({ id: p.speciesId, shiny: p.shiny === true });
    if (longOn && run) {
        const byUid = new Map(run.picks.map((p) => [p.uid, p]));
        const cap = run.picks.find((p) => p.uid === run.captainUid);
        const rest = run.lineup.flatMap((u) => (u === run.captainUid ? [] : (byUid.get(u) ?? [])));
        const team = [cap, ...rest].flatMap((p) => (p ? [mon(p)] : [])).slice(0, 3);
        if (team.length) return team;
        if (run.picks[0]) return [mon(run.picks[0])];
    }
    return [avatar];
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
