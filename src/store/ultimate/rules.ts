import type { Metal } from '../../ui/rarity';

/**
 * Números do Time Ultimate (docs/planos/ultimate-team.md, "Proposta de números"). Todos num lugar só.
 *
 * PROPOSTA, FALTA O OK DO MIGUEL: nada aqui está aprovado. Mudou um número? Atualize a tabela do plano junto.
 */

/** Pacote Mini grátis: um a cada 12 h. */
export const PACK_INTERVAL_MS = 12 * 60 * 60 * 1000;
/**
 * Quantos pacotes grátis o relógio guarda em Meus pacotes (cheio, ele para): 6 = 3 dias fora (ultimate-fc.md, decidido
 * com o Miguel em 09/11/2026; era 2, e o relógio parado obrigava a abrir).
 */
export const PACK_MAX = 6;
/** Pacotes Mini de boas-vindas (save novo e temporada nova), junto do Pick "Seu primeiro craque". */
export const PACK_START = 2;
/** Cartas no Pacote Mini. */
export const PACK_SIZE = 3;

/** Chance de cada metal, por carta (soma 1). */
export const METAL_ODDS: Record<Metal, number> = { bronze: 0.62, prata: 0.28, ouro: 0.1 };
/** Piso: todo pacote tem pelo menos 1 carta deste metal ou melhor (se não saiu, a última vira esta). */
export const FLOOR_METAL: Metal = 'prata';

/** Edições por carta (por cima do metal): Shiny e Ícone (só os 20 da lista de Ícones). Evento fica pros eventos. */
export const SHINY_ODDS = 1 / 64;
export const ICON_ODDS = 1 / 100;

/**
 * Venda rápida (a repetida dos Pendentes, ou carta do Clube fora do time e destrancada): pontos de pacote pelo metal.
 * Repetida não entra no Clube: fica em Pendentes até você vender ou trocar (decidido em 02/11/2026).
 */
export const REPEAT_POINTS: Record<Metal, number> = { bronze: 1, prata: 3, ouro: 8 };
/** Pendentes (repetidas e prêmios a resgatar): cheio, o pacote pede pra resolver antes de abrir. */
export const PENDING_MAX = 30;

/** Time: 5 titulares + 2 no banco. Até ter o time cheio, o pacote não repete espécie que você já tem. */
export const TEAM_SIZE = 7;
export const STARTERS = 5;

/** Níveis do jogo contra a IA, do mais fácil ao mais difícil. */
export const LEVELS = ['facil', 'normal', 'dificil', 'mestre'] as const;
export type Level = (typeof LEVELS)[number];

/** O rival acompanha a média do seu time: média dos titulares dele = a sua + isto. */
export const LEVEL_GAP: Record<Level, number> = { facil: -6, normal: 0, dificil: 4, mestre: 8 };
/** O clube do rival só entra no sorteio se monta um time com média a até isto do alvo (`ultimateRival`). */
export const RIVAL_TOLERANCE = 2;

export type Outcome = 'win' | 'draw' | 'loss';
/** Fichas por resultado e nível (o fácil nunca paga zero). Empate = placar igual no tempo normal. */
export const FICHAS: Record<Level, Record<Outcome, number>> = {
    facil: { win: 30, draw: 15, loss: 10 },
    normal: { win: 50, draw: 25, loss: 10 },
    dificil: { win: 80, draw: 40, loss: 15 },
    mestre: { win: 120, draw: 60, loss: 20 },
};

// ------------------------------------------------------------------------------------------- 0.9.32

/** Pontos de pacote por pacote aberto, além das repetidas (proteção contra azar, como no TCG Pocket). */
export const OPEN_POINTS = 5;
/** Preço em pontos de pacote pra escolher uma carta Normal (sem Shiny). Ícone e Evento ficam fora. */
export const PICK_PRICE: Record<Metal, number> = { bronze: 15, prata: 40, ouro: 100 };
/** Pacote Mini extra comprado com Fichas. */
export const FICHAS_PACK_PRICE = 150;
/** Ponte da Copa: cada título da Copa vale 1 Pacote Mini no Time Ultimate, até isto por dia (Brasília). */
export const CUP_BRIDGE_DAY_MAX = 2;

/** Evoluções (ou Treinos) em andamento ao mesmo tempo. */
export const EVO_ACTIVE_MAX = 2;
/**
 * Objetivo de cada passo da Evolução e do Treino, com a carta: partidas jogadas, gols (o goleiro conta defesas) e
 * vezes que foi o craque do seu time na partida.
 */
export const EVO_STEP = { played: 3, goals: 2, saves: 6, mvp: 1 } as const;
/** Treino (quem não evolui mais): até 3 subidas; cada uma vale o mesmo que uma evolução (+2 em tudo). */
export const TRAIN_STEPS = 3;

/** O que um objetivo conta numa partida do Time Ultimate. */
export type ObjectiveKind = 'play' | 'win' | 'goals' | 'winHard' | 'winNoGold';
export interface Objective {
    id: string;
    /** 'event' = só durante o evento (EVENTS). */
    period: 'day' | 'week' | 'event';
    kind: ObjectiveKind;
    goal: number;
    fichas: number;
    /** Pacotes Mini. */
    packs: number;
    /** Pacotes Grandes (0.9.33: os da semana pagam Grande no lugar do Mini). */
    big: number;
}
/**
 * Objetivos diários e semanais (viram à meia-noite de Brasília; a semana começa na segunda). Pagam sozinhos quando
 * completam. "Sem Ouro" (titulares sem carta Ouro) é o objetivo com restrição, que paga a mais.
 */
export const OBJECTIVES: Objective[] = [
    { id: 'd-play', period: 'day', kind: 'play', goal: 2, fichas: 30, packs: 0, big: 0 },
    { id: 'd-win', period: 'day', kind: 'win', goal: 1, fichas: 40, packs: 0, big: 0 },
    { id: 'd-goals', period: 'day', kind: 'goals', goal: 4, fichas: 0, packs: 1, big: 0 },
    { id: 'w-play', period: 'week', kind: 'play', goal: 12, fichas: 100, packs: 0, big: 1 },
    { id: 'w-win', period: 'week', kind: 'win', goal: 6, fichas: 0, packs: 0, big: 2 },
    { id: 'w-hard', period: 'week', kind: 'winHard', goal: 3, fichas: 0, packs: 0, big: 2 },
    { id: 'w-nogold', period: 'week', kind: 'winNoGold', goal: 2, fichas: 100, packs: 0, big: 1 },
];

// ------------------------------------------------------------------------------------------- 0.9.33

/** Meia-noite de Brasília (UTC−3 fixo desde 2019) do dia `d/m/y`, em ms. */
const brt = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 3);

/**
 * Temporadas (semestrais, decidido em 01/11/2026): começo e fim (meia-noite de Brasília). Antes da T1 é a prévia
 * (temporada 0). No fim, zera time, cartas do modo, Fichas, pontos de pacote e passe; fica no Perfil a medalha, o
 * título (passe completo) e a carta mais jogada como Lenda. O tema muda o que sai nos pacotes e os desafios, não o motor.
 */
export interface Season {
    n: number;
    start: number;
    end: number;
    theme: 'kanto' | 'lideres';
}
export const SEASONS: Season[] = [
    { n: 1, start: brt(2026, 11, 27), end: brt(2027, 6, 1), theme: 'kanto' },
    { n: 2, start: brt(2027, 6, 1), end: brt(2027, 12, 1), theme: 'lideres' },
];

/** Pacote Grande (objetivos da semana, passe, líderes): 5 cartas, pelo menos 2 Prata ou melhor. */
export const BIG_PACK_SIZE = 5;
export const BIG_FLOOR_N = 2;

/**
 * Passe grátis da temporada: pontos por partida (o difícil não muda: quem joga pouco não fica pra trás), com teto
 * por dia (Brasília), como os 850/dia do FC 27. A cada PASS_STEP pontos, um marco (PASS_MARKS no total).
 */
export const PASS_POINTS: Record<Outcome, number> = { win: 40, draw: 25, loss: 15 };
/** Desafio de líder vale o dobro no passe. */
export const PASS_GYM_MULT = 2;
export const PASS_DAY_MAX = 150;
export const PASS_STEP = 150;
export const PASS_MARKS = 40;
/** A carta de abertura da T1 (Kanto clássico): Pikachu, no marco 1. Cresce a cada PASS_GROW_EVERY marcos. */
export const PASS_CARD = 25;
export const PASS_GROW_EVERY = 5;

export interface PassReward {
    fichas: number;
    packs: number;
    big: number;
    /** 'card' = ganha a carta de abertura; 'grow' = ela sobe (+2 em tudo, a mesma conta do Treino). */
    card?: 'card' | 'grow';
    /** Pokémon Pick (marcos 20 e 40). */
    pick?: PickSpec;
}
/** O prêmio do marco `k` (1..PASS_MARKS): 10 e 30 dão Pacote Grande; 20 e 40, Pick de Ouro (decidido em 09/11). */
export function passReward(k: number): PassReward {
    if (k === 1) return { fichas: 0, packs: 0, big: 0, card: 'card' };
    if (k % 20 === 0) return { fichas: 0, packs: 0, big: 0, pick: GOLD_PICK, card: 'grow' };
    if (k % PASS_GROW_EVERY === 0) return { fichas: 0, packs: 0, big: k % 10 === 0 ? 1 : 0, card: 'grow' };
    return k % 2 ? { fichas: 100, packs: 0, big: 0 } : { fichas: 0, packs: 1, big: 0 };
}

/**
 * Pokémon Pick (ultimate-fc.md, decidido com o Miguel em 09/11/2026): escolha 1 de `n`, as outras somem. `min` é o
 * piso de cada opção (o metal sorteado abaixo dele vira ele, como o piso do pacote); `exact` = só aquele metal (o
 * Pick comprado com pontos); `type` = só do tipo (o Pick do líder); `event` = toda opção sai Evento (o do Natal).
 * Nunca oferece espécie que você já tem.
 */
export interface PickSpec {
    n: number;
    min: Metal;
    exact?: boolean;
    type?: string;
    event?: string;
}
/** "Seu primeiro craque": save novo e temporada nova, junto dos 2 Mini (o dia 1 do FC termina num 1 de 5). */
export const FIRST_PICK: PickSpec = { n: 5, min: 'prata' };
/** Marcos 20 e 40 do passe. */
export const GOLD_PICK: PickSpec = { n: 3, min: 'ouro', exact: true };
/** Pick com pontos de pacote em Comprar (1 de 3 daquele metal), mais barato que escolher a espécie (PICK_PRICE). */
export const PICK_POINTS: Record<Metal, number> = { bronze: 10, prata: 25, ouro: 60 };
export const PICK_BUY_N = 3;

/**
 * Desafios dos líderes de ginásio (contra a IA, sem servidor): o clube do líder no nível Difícil e uma regra pro seu
 * time titular. Pagam GYM_FICHAS_MULT vezes as Fichas do Difícil; a 1ª vitória de cada líder na temporada dá a
 * insígnia e um Pacote Grande.
 */
export type GymRule = { kind: 'type'; type: string; min: number } | { kind: 'metal'; metal: Metal; min: number };
export interface Gym {
    id: string;
    club: string;
    rule: GymRule;
}
export const GYMS: Gym[] = [
    { id: 'brock', club: 'Pewter Rochedo', rule: { kind: 'type', type: 'Rock', min: 2 } },
    { id: 'misty', club: 'Cerulean Cascata', rule: { kind: 'type', type: 'Water', min: 5 } },
    { id: 'ltsurge', club: 'Vermilion Voltagem', rule: { kind: 'type', type: 'Electric', min: 2 } },
    { id: 'erika', club: 'Celadon Arco-Íris', rule: { kind: 'type', type: 'Grass', min: 3 } },
    { id: 'koga', club: 'Fuchsia Ninjas', rule: { kind: 'type', type: 'Poison', min: 3 } },
    { id: 'sabrina', club: 'Saffron Mentes', rule: { kind: 'metal', metal: 'prata', min: 5 } },
    { id: 'blaine', club: 'Cinnabar Vulcão', rule: { kind: 'type', type: 'Fire', min: 2 } },
    { id: 'giovanni', club: 'Viridian Terra', rule: { kind: 'type', type: 'Ground', min: 3 } },
];
export const GYM_LEVEL: Level = 'dificil';
export const GYM_FICHAS_MULT = 2;
/**
 * Pick do líder (no lugar do Pacote Grande, decidido em 09/11): a 1ª vitória contra cada um dá 1 de 3 Prata ou melhor
 * do tipo dele (Sabrina, que pede o time Prata, sem tipo).
 */
export const gymPick = (g: Gym): PickSpec => ({
    n: 3,
    min: 'prata',
    ...(g.rule.kind === 'type' && { type: g.rule.type }),
});

/**
 * Eventos da temporada (um de cada vez, 2 a 3 semanas). Desligados por data: fora de [start, end) não existem. Cada
 * um traz cartas Evento nos pacotes (a edição Evento de sempre, pintada do tipo do evento: +2, um degrau acima da
 * Normal), objetivos próprios e um enfeite que fica no Perfil quando você completa todos.
 */
export interface UtEvent {
    id: string;
    start: number;
    end: number;
    /** O tipo que pinta a carta Evento. */
    type: string;
    /** Chance de cada carta do pacote sair Evento durante o evento. */
    cardOdds: number;
    objectives: Objective[];
    /**
     * Pick de Evento: cumprir todos os objetivos do evento (o enfeite) dá também 1 de 3 cartas Evento, Prata ou melhor.
     * Aprovado pelo Miguel em 09/11.
     */
    pick?: PickSpec;
}
export const EVENTS: UtEvent[] = [
    {
        id: 'natal-2026',
        start: brt(2026, 12, 15),
        end: brt(2027, 1, 5),
        type: 'Ice',
        cardOdds: 1 / 12,
        pick: { n: 3, min: 'prata', event: 'natal-2026' },
        objectives: [
            { id: 'e-play', period: 'event', kind: 'play', goal: 10, fichas: 150, packs: 0, big: 0 },
            { id: 'e-goals', period: 'event', kind: 'goals', goal: 25, fichas: 0, packs: 2, big: 0 },
            { id: 'e-win', period: 'event', kind: 'win', goal: 6, fichas: 0, packs: 0, big: 1 },
        ],
    },
];

/**
 * Meus pacotes avisa o evento que vem: "pacote aberto no Natal pode trazer carta Evento" (o convite pra guardar, como o
 * TOTY do FC) aparece este tanto de dias antes e durante o evento. Aprovado pelo Miguel em 09/11.
 */
export const EVENT_HINT_DAYS = 14;

// ------------------------------------------------------------------------------------------- 27/11

/**
 * Primeiros passos (o 1º dia, ensinam o modo; fc-ut-sistema.md, "Foundations"): cada um paga as Fichas dele uma vez,
 * na hora em que você faz. Os 5 somam 150 Fichas = 1 Pacote Mini na loja (FICHAS_PACK_PRICE). Recomeçam na temporada nova.
 */
export const FIRST_STEPS = [
    { id: 'pack', fichas: 20 },
    { id: 'lineup', fichas: 20 },
    { id: 'play', fichas: 30 },
    { id: 'win', fichas: 30 },
    { id: 'evo', fichas: 50 },
] as const;
export type FirstStepId = (typeof FIRST_STEPS)[number]['id'];
