import type { AbilityEffect } from './abilities';
import type { Shout } from './agency';
import type { Attributes, AttrKey, Position } from './attributes';
import type { MatchConfig } from './config';
import type { Species, TypeName } from './data';
import type { Formation, FormationId } from './formations';
import type { PokemonInstance } from './instance';
import type { MoveKind, StatusKind } from './moves';
import type { CoachCall, LeaderId } from './rival-coach';
import type { Rng } from './rng';
import type { Vec2 } from './vec';

export type Tactic = 'balanced' | 'offensive' | 'defensive' | 'counter';
export const TACTIC_LABEL: Record<Tactic, string> = {
    balanced: 'Equilibrado',
    offensive: 'Ofensivo',
    defensive: 'Retranca',
    counter: 'Contra-ataque',
};

/** Instrução de escanteio do técnico: muda o peso do sorteio da jogada, nunca trava uma só. */
export type CornerPlan = 'area' | 'short' | 'mixed';
/** Jogada de escanteio: bola alta na área (2ª trave), curta pro chute de fora ou rasteira forte na 1ª trave. */
export type CornerPlay = 'area' | 'short' | 'near';

export interface TeamSetup {
    name: string;
    /** Exatamente `teamSize` jogadores, na ordem das vagas da formação. */
    lineup: PokemonInstance[];
    bench: PokemonInstance[];
    tactic: Tactic;
    color: number;
    /** Padrão: losango 1-2-1. */
    formation?: FormationId;
    /** uid do capitão (dá aura ao time). */
    captainUid?: string | null;
    /** Só o técnico troca (time do jogador): sem substituição automática no intervalo. */
    manualSubs?: boolean;
    /** Instrução de escanteio (padrão: Variar). */
    corner?: CornerPlan;
    /** uid de quem cobra os escanteios (padrão: o melhor passe fora do pivô). */
    cornerTakerUid?: string | null;
    /**
     * Técnico IA que reage ao vivo (rival da Copa com a beira da quadra ligada; src/engine/rival-coach.ts). Sem ele
     * a partida é a de sempre.
     */
    coach?: LeaderId;
}

/** Mudança de tática agendada (tática ao vivo: a partida é resimulada com a agenda). */
export interface TacticChange {
    tick: number;
    team: 0 | 1;
    /** Contagem por time (duelo ao vivo): desempata ordens do mesmo tick. Ordens antigas da copa não têm. */
    seq?: number;
    kind?: 'tactic';
    tactic: Tactic;
}

/** Substituição pedida pelo técnico: entra na próxima saída de bola depois de `tick`. */
export interface SubOrder {
    tick: number;
    team: 0 | 1;
    seq?: number;
    kind: 'sub';
    outUid: string;
    inUid: string;
}

/** Troca da instrução de escanteio durante a partida (vale no início do tick, como a tática). */
export interface CornerOrder {
    tick: number;
    team: 0 | 1;
    seq?: number;
    kind: 'corner';
    corner: CornerPlan;
}

/**
 * Mudança de prancheta: formação nova e quem joga em cada vaga (`order[i]` = uid de quem vai pra vaga i, uma
 * permutação de quem está em quadra). Entra na próxima bola parada depois de `tick`, como a substituição; sem limite,
 * mas só uma pendente por time (a nova substitui a que ainda não entrou). Quem saiu numa troca vale como quem entrou
 * no lugar dele (troca e prancheta na mesma bola parada dão o mesmo resultado em qualquer ordem).
 */
export interface LineupOrder {
    tick: number;
    team: 0 | 1;
    seq?: number;
    kind: 'lineup';
    formation: FormationId;
    order: string[];
}

/**
 * Agência do técnico (experimento, src/engine/agency.ts): grito (vale na hora), pedido de tempo e goleiro-linha (na
 * próxima bola parada), golpe máximo do capitão (na hora, se a barra estiver cheia) e a ordem dos cobradores de
 * pênalti (uids, guardada até a disputa). Sem essas ordens a partida é a de sempre.
 */
export type AgencyOrder =
    | { tick: number; team: 0 | 1; seq?: number; kind: 'shout'; shout: Shout }
    | { tick: number; team: 0 | 1; seq?: number; kind: 'timeout' }
    | { tick: number; team: 0 | 1; seq?: number; kind: 'flyGk'; on: boolean }
    | { tick: number; team: 0 | 1; seq?: number; kind: 'max' }
    | { tick: number; team: 0 | 1; seq?: number; kind: 'penalties'; order: string[] };
export type AgencyKind = AgencyOrder['kind'];
export const AGENCY_KINDS: readonly AgencyKind[] = ['shout', 'timeout', 'flyGk', 'max', 'penalties'];

/** Ordens do técnico durante a partida (a partida é resimulada com a agenda inteira). */
export type MatchOrder = TacticChange | SubOrder | CornerOrder | LineupOrder | AgencyOrder;
export const isSubOrder = (o: MatchOrder): o is SubOrder => o.kind === 'sub';
export const isLineupOrder = (o: MatchOrder): o is LineupOrder => o.kind === 'lineup';
export const isCornerOrder = (o: MatchOrder): o is CornerOrder => o.kind === 'corner';
export const isTacticOrder = (o: MatchOrder): o is TacticChange => !o.kind || o.kind === 'tactic';
export const isAgencyOrder = (o: MatchOrder): o is AgencyOrder => AGENCY_KINDS.includes(o.kind as AgencyKind);

/** Códigos de ação para o render escolher a animação. */
export const Action = {
    Idle: 0,
    Run: 1,
    Kick: 2,
    Shoot: 3,
    Tackle: 4,
    Hurt: 5,
    Celebrate: 6,
    Charge: 7,
    Dive: 8,
} as const;
export type Action = (typeof Action)[keyof typeof Action];

export interface Buff {
    attr: AttrKey;
    factor: number;
    timer: number;
    /** Golpe que deu o reforço, quando ele pode acabar antes do tempo (Bide). */
    src?: string;
}

export interface PendingBonus {
    power: number;
    accuracy: number;
    moveType: string;
    moveId: string;
    timer: number;
    /** Dano fixo (Sonic Boom, Dragon Rage...): velocidade do chute em m/s, sem depender do atributo. */
    fixedSpeed?: number;
    /** Golpe carregado (Solar Beam, Sky Attack...): já passou pela carga. */
    charged?: boolean;
}

/** Estado dos traços de golpe (src/engine/moves.ts → MOVE_TRAITS) em cada jogador. */
export interface TraitState {
    /** Focus Energy: próximo chute/carrinho crítico garantido. */
    focus: boolean;
    /** Carregando um golpe (Solar Beam, Skull Bash...): parado até soltar. */
    charging: { moveId: string; t: number; armor: boolean } | null;
    /** Voando (Fly) ou cavando (Dig): fora do alcance de todo mundo. */
    air: { kind: 'fly' | 'dig'; moveId: string; t: number; from: Vec2; to: Vec2; prey: number | null } | null;
    /** Mira atrapalhada (Sand Attack, Kinesis, Flash): erro do chute/passe multiplicado. */
    aim: { factor: number; t: number; once: boolean } | null;
    /** Toxic: segundos desde o envenenamento (o dreno cresce). */
    toxic: number;
    rage: { t: number; stacks: number } | null;
    bide: { t: number; hits: number } | null;
    /** Double Team: clones que ainda aguentam um carrinho/golpe. */
    decoys: number;
    /** Segundos até os clones sumirem. */
    decoyT: number;
    /** Minimize: segundos pequenininho. */
    mini: number;
    /** Ninguém tira a bola dele (Skull Bash carregando, Clamp, Withdraw, Acid Armor). */
    guard: number;
    /** Golpe que deu a proteção (para a narração). */
    guardMove: string;
    /** Defense Curl: o próximo carrinho sofrido não tira a bola. */
    curl: number;
    /** Conversion: tipo copiado por um tempo. */
    typeCopy: { types: TypeName[]; t: number } | null;
    /** Roar: fugindo para o próprio campo. */
    flee: { dir: Vec2; t: number } | null;
}

/** Zona no chão (Smokescreen, Fire Spin, muro do Barrier). */
export interface Zone {
    kind: 'smoke' | 'fire' | 'wall';
    pos: Vec2;
    r: number;
    t: number;
    team: 0 | 1;
    by: number;
}

export interface PlayerStats {
    goals: number;
    assists: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passesCompleted: number;
    tackles: number;
    tacklesWon: number;
    interceptions: number;
    saves: number;
    movesUsed: number;
}

export interface PlayerState {
    idx: number;
    team: 0 | 1;
    slot: number;
    role: Position;
    inst: PokemonInstance;
    /** Ditto transformado: a instância original (a `inst` vira a cópia). */
    origin?: PokemonInstance;
    sp: Species;
    name: string;
    /** Atributos já com nível, posição e habilidade (sem fadiga/buffs). */
    attr: Attributes;
    ability: AbilityEffect;
    pos: Vec2;
    vel: Vec2;
    heading: Vec2;
    facing: number;
    energy: number;
    action: Action;
    actionTimer: number;
    kickCooldown: number;
    tackleCooldown: number;
    moveCooldown: number;
    stun: number;
    evade: number;
    status: { kind: StatusKind | 'infatuation'; timer: number } | null;
    buffs: Buff[];
    moveUses: number[];
    shotBonus: PendingBonus | null;
    tackleBonus: PendingBonus | null;
    clutchAnnounced: boolean;
    captain: boolean;
    /** Já evoluiu nesta partida (no máximo uma vez por partida). */
    evolved: boolean;
    /** Leech Seed: perde fôlego aos poucos para quem plantou. */
    seeded: { by: number; timer: number } | null;
    /** Substitute: segundos em que o boneco ainda aguenta um golpe/carrinho. */
    substitute: number;
    /** Traços de golpe ativos (crítico, carga, voo, clones...). */
    fx: TraitState;
    /** Item segurado e se o efeito de uso único já foi gasto. */
    item: string | null;
    itemUsed: boolean;
    /** Memória da IA. */
    ai: { nextDecision: number; holdUntil: number };
    stats: PlayerStats;
}

export interface ShotInfo {
    by: number;
    xg: number;
    moveId: string | null;
    moveType: string;
    gkChecked: boolean;
    blockedBy: number[];
    onTarget: boolean;
    /** Drill Peck/Cut: já furou o primeiro bloqueio. */
    pierced?: boolean;
}

export interface BallState {
    pos: Vec2;
    vel: Vec2;
    /** Altura (m) e velocidade vertical: passe longo vai pelo alto ("bola cruzada"). */
    z: number;
    vz: number;
    owner: number | null;
    lastTouch: number | null;
    lastKick: { by: number; kind: 'pass' | 'shot' | 'clear'; tick: number; receiverId?: number } | null;
    shot: ShotInfo | null;
    /** Último passador do time que tem a bola (para assistências). */
    assistCandidate: number | null;
}

export type Phase = 'kickoff' | 'play' | 'goal' | 'restart' | 'corner' | 'halftime' | 'fulltime';

/** Escanteio em andamento: a jogada sorteada e a disputa que vem quando a bola chega. */
export interface SetPiece {
    team: 0 | 1;
    play: CornerPlay;
    taker: number;
    /** Onde a bola chega (já com o erro da cobrança). */
    at: Vec2;
    /** Tick da disputa (bola chegando); 0 = sem disputa (curta). */
    contestTick: number;
    /** Quem corre pro ponto da disputa. */
    runners: number[];
    /**
     * Papéis do molde (índices dos jogadores): 2ª trave, 1ª trave e marca dos 10 m (recebe a curta e chuta de
     * primeira) no ataque; quem marca cada um, quem fica na 1ª trave e o goleiro na defesa.
     */
    roles: {
        far: number | null;
        near: number | null;
        outside: number | null;
        markFar: number | null;
        markNear: number | null;
        post: number | null;
        closer: number | null;
        gk: number | null;
    };
    /** Golpe do cobrador (Swift, Egg Bomb, Gust, Whirlwind). */
    moveId: string | null;
    /** A jogada acaba aqui (a curta não fica valendo pra sempre). */
    until: number;
}

export interface TeamRuntime {
    setup: TeamSetup;
    formation: Formation;
    tactic: Tactic;
    /**
     * Quem está em cada vaga agora (muda com substituição e evolução). Sinergias, duplas de história e a aura
     * do capitão contam por aqui, não pela escalação inicial. Ditto conta como Ditto (a carta dele).
     */
    lineup: PokemonInstance[];
    bench: PokemonInstance[];
    possessionTicks: number;
    /** Sinergias de história que já soltaram o combo neste tempo (1 combo por sinergia por tempo). */
    combosUsed: string[];
    /** Paredes do time (segundos restantes): Light Screen (golpes especiais), Reflect (físicos), Mist (enfraquecer). */
    screens: { light: number; reflect: number; mist: number };
    /** Instrução de escanteio agora (muda com a ordem do técnico). */
    corner: CornerPlan;
    /** Agência do técnico (experimento): só muda com as ordens novas. */
    agency: AgencyRuntime;
}

export interface AgencyRuntime {
    shout: { kind: Shout; until: number } | null;
    shoutsUsed: number;
    /** Próximo grito só a partir deste tick (recarga). */
    shoutReadyAt: number;
    /** Pedido de tempo já usado em cada tempo, e o que espera a próxima bola parada. */
    timeouts: [boolean, boolean];
    timeoutPending: boolean;
    /** Goleiro-linha ligado agora e a troca que espera a próxima bola parada (null = nenhuma). */
    flyGk: boolean;
    flyGkPending: boolean | null;
    /** Golpe máximo solto: quem (índice do capitão) e até que tick a janela vale. */
    max: { idx: number; until: number } | null;
    /** Ordem dos cobradores de pênalti (uids; null = pelo chute, como sempre). */
    penaltyOrder: string[] | null;
}

export interface MatchEventBase {
    tick: number;
    half: 1 | 2;
    /** Minuto exibido no relógio (0..40). */
    minute: number;
}

export type MatchEvent = MatchEventBase &
    (
        | { type: 'kickoff'; team: 0 | 1 }
        | { type: 'pass'; by: number; to: number | null }
        | { type: 'interception'; by: number; from: number }
        | { type: 'tackle'; by: number; victim: number; success: boolean }
        | { type: 'skill'; by: number }
        | { type: 'shot'; by: number; xg: number; moveId: string | null }
        | { type: 'save'; by: number; shooter: number; caught: boolean }
        | { type: 'block'; by: number; shooter: number }
        | { type: 'post'; shooter: number }
        | { type: 'wide'; shooter: number }
        /** Bola saiu pela linha de fundo: tiro de meta do goleiro `by` (time `team`). */
        | { type: 'goalkick'; team: 0 | 1; by: number }
        /** Último toque da defesa pela linha de fundo: escanteio do time `team`, cobrado por `by`. */
        | { type: 'corner'; team: 0 | 1; by: number; play: CornerPlay }
        /**
         * Disputa da bola do escanteio (`high`: no alto). `by` ganhou: cabeçada/voleio/desvio (ataque), afastou
         * (defesa) ou segurou/socou (goleiro). `moveId`: golpe usado na disputa.
         */
        | {
              type: 'aerial';
              by: number;
              team: 0 | 1;
              high: boolean;
              kind: 'header' | 'volley' | 'flick' | 'clear' | 'catch' | 'punch';
              moveId: string | null;
          }
        | { type: 'cornerPlan'; team: 0 | 1; plan: CornerPlan }
        | { type: 'goal'; by: number; assist: number | null; team: 0 | 1; score: [number, number]; ownGoal: boolean }
        | {
              type: 'move';
              by: number;
              moveId: string;
              kind: MoveKind;
              target: number | null;
              effectiveness: number | null;
              hit: boolean;
              /** Golpe usado com a bola (vira chute) ou sem (dividida/rajada). */
              withBall: boolean;
              /** Goleiro usou o golpe pra defender o chute que vinha (vira bônus de goleiro por um instante). */
              save?: boolean;
          }
        | {
              type: 'status';
              target: number;
              status: StatusKind | 'infatuation' | 'flinch' | 'seed';
              by: number | null;
              source: string;
          }
        | { type: 'knockback'; target: number; by: number; moveId: string }
        | { type: 'tactic'; team: 0 | 1; tactic: Tactic }
        | { type: 'item'; by: number; item: string; effect: 'save' | 'cure' | 'crit' | 'endure' }
        /** `blocked`: a habilidade de `by` segurou o status que `target` tentou passar (Limber, Insomnia...). */
        | { type: 'ability'; by: number; ability: string; target: number | null; blocked?: boolean }
        | { type: 'transform'; by: number; into: number; target: number }
        | { type: 'combo'; by: number; partner: number; link: string }
        /** `role`: a vaga em que ele evoluiu (a forma nova herda como secundária). */
        | { type: 'evolve'; by: number; team: 0 | 1; uid: string; from: number; into: number; role: Position }
        /** O boneco do Substitute aguentou o golpe/carrinho no lugar de `by`. */
        | { type: 'decoy'; by: number; attacker: number }
        /** Haze: tirou status e reforços de quem estava em volta. */
        | { type: 'haze'; by: number; cleared: number[] }
        /** Teleport: `by` sumiu de um ponto e apareceu em outro. */
        | { type: 'teleport'; by: number }
        /**
         * Efeito de um traço de golpe (src/engine/moves.ts → MOVE_TRAITS) para a cena e a narração mostrarem:
         * crítico, carga, voo, clones, muro... `n` é um número do efeito (acertos, vítimas); `x/y/r/dur` são a
         * zona no chão.
         */
        | {
              type: 'trait';
              by: number;
              fx: TraitFx;
              moveId: string;
              target: number | null;
              n?: number;
              x?: number;
              y?: number;
              r?: number;
              dur?: number;
          }
        | { type: 'halftime'; score: [number, number] }
        | {
              type: 'sub';
              team: 0 | 1;
              out: string;
              in: string;
              outIdx: number;
              outUid: string;
              inUid: string;
              outSpeciesId: number;
              inSpeciesId: number;
              inShiny: boolean;
          }
        /** Mudança de prancheta: a formação nova e o jogador (`idx`) em cada vaga, na ordem das vagas. */
        | { type: 'lineup'; team: 0 | 1; formation: FormationId; idx: number[] }
        | { type: 'fulltime'; score: [number, number] }
        | { type: 'penalty'; by: number; gk: number; scored: boolean; round: number; shootout: [number, number] }
        | { type: 'end'; winner: 0 | 1 | null; score: [number, number]; shootout: [number, number] | null }
        // agência do técnico (experimento)
        | { type: 'shout'; team: 0 | 1; shout: Shout }
        | { type: 'timeout'; team: 0 | 1 }
        /** Goleiro-linha ligou/desligou (`by` = o goleiro). */
        | { type: 'flyGk'; team: 0 | 1; on: boolean; by: number }
        /** Golpe máximo: abriu a janela, saiu (`hit`: o chute, ou a janela do goleiro) ou passou sem sair (`miss`). */
        | { type: 'max'; team: 0 | 1; by: number; phase: 'start' | 'hit' | 'miss'; moveId?: string | null }
        /** Técnico IA avisou a ordem (vale `RIVAL_COACH.leadTicks` depois; src/engine/rival-coach.ts). */
        | ({ type: 'coach'; team: 0 | 1; leader: LeaderId } & CoachCall)
    );

export type MatchEventType = MatchEvent['type'];

export type TraitFx =
    | 'crit'
    | 'focusBug'
    | 'charge'
    | 'chargeLost'
    | 'noRecharge'
    | 'fly'
    | 'dig'
    | 'land'
    | 'priority'
    | 'area'
    | 'pierce'
    | 'sureHit'
    | 'lob'
    | 'blind'
    | 'fixed'
    | 'halfEnergy'
    | 'throw'
    | 'trip'
    | 'multi'
    | 'rebound'
    | 'reach'
    | 'wrap'
    | 'clampHold'
    | 'zone'
    | 'toxic'
    | 'rageUp'
    | 'bide'
    | 'clones'
    | 'clone'
    | 'mini'
    | 'guard'
    | 'curl'
    | 'wall'
    | 'wallBlock'
    | 'flee'
    | 'blowBall'
    | 'bulldoze'
    | 'typeCopy'
    | 'teamHeal'
    | 'coins';

/** Valores por jogador em `MatchSnapshot.p`: x, y, facing, action, status, flags, fôlego (0..1). */
export const SNAP_STRIDE = 7;
export const STATUS_CODE: Record<string, number> = {
    par: 1,
    slp: 2,
    psn: 3,
    brn: 4,
    frz: 5,
    confusion: 6,
    infatuation: 7,
};
/** Bits de `flags`: buff ativo, debuff ativo, golpe carregado para o próximo chute/desarme. */
export const FLAG_BUFF = 1;
export const FLAG_DEBUFF = 2;
export const FLAG_CHARGED = 4;
/** Traços de golpe visíveis no sprite: voando, cavando, carregando, clones, pequenininho, protegido, fúria. */
export const FLAG_FLY = 8;
export const FLAG_DIG = 16;
export const FLAG_CHARGING = 32;
export const FLAG_CLONES = 64;
export const FLAG_MINI = 128;
export const FLAG_GUARD = 256;
export const FLAG_RAGE = 512;

/** Snapshot compacto para o render. `p` = SNAP_STRIDE valores por jogador. */
export interface MatchSnapshot {
    tick: number;
    half: 1 | 2;
    minute: number;
    phase: Phase;
    bx: number;
    by: number;
    /** Altura da bola (m): o render aumenta a bola e afasta da sombra. */
    bz: number;
    owner: number;
    /** Tipo do golpe do chute em andamento (rastro colorido na bola), ou ''. */
    bfx: string;
    score: [number, number];
    p: number[];
}

export interface MatchState {
    cfg: MatchConfig;
    rng: Rng;
    /**
     * Seed de cada trecho de 2 minutos (duelo ao vivo: compromisso e revelação). Com elas, o `rng` é recriado no
     * começo de cada trecho; sem elas (null), é um stream só desde o apito. Seed que falta = segue o stream atual.
     */
    segmentSeeds: readonly string[] | null;
    /** Trecho atual (ver `segmentTicks` em config.ts). */
    segment: number;
    tick: number;
    half: 1 | 2;
    /** Segundos de simulação dentro do tempo atual. */
    time: number;
    phase: Phase;
    phaseTimer: number;
    kickoffTeam: 0 | 1;
    teams: [TeamRuntime, TeamRuntime];
    players: PlayerState[];
    /** Índices dos jogadores com habilidade de aura (Intimidate…) — evita varrer todos a cada cálculo. */
    auraHolders: number[];
    /** Nenhum golpe (de nenhum time) antes deste tick: golpes ficam espaçados e especiais. */
    nextMoveTick: number;
    /** Jogadores substituídos (com as estatísticas que fizeram antes de sair). */
    subbedOut: PlayerState[];
    /** Pedido de tempo: a bola parada não anda até este tick (0 = sem parada). */
    pauseUntil: number;
    /** Substituições e mudanças de prancheta pedidas esperando a próxima bola parada. */
    pendingSubs: (SubOrder | LineupOrder)[];
    /** Último golpe usado por cada time (Mirror Move/Mimic copiam o do rival). */
    lastMove: [string | null, string | null];
    /** Zonas no chão (fumaça, anel de fogo, muro). */
    zones: Zone[];
    /** Escanteio em andamento (cobrança e disputa). */
    setPiece: SetPiece | null;
    ball: BallState;
    score: [number, number];
    shootout: [number, number] | null;
    events: MatchEvent[];
    finished: boolean;
    winner: 0 | 1 | null;
}
