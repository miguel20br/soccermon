import { Rng } from '../engine/rng';

/**
 * As animações das casas da Rota (rota-indigo-2.md, R6, R11, R12): o roteiro de cada uma em ms, puro e testável. O
 * resultado já veio sorteado pelo jogo (`gambleWon`); aqui só se escolhe como mostrar (que símbolo cai em cada rolo,
 * onde a roleta para, quantas vezes a bola balança), pela seed da casa: a mesma copa mostra a mesma cena. Com Reduzir
 * movimento, só o quadro final (`REDUCED_MS`).
 */

/** Quanto o resultado fica na tela antes de voltar pro mapa (e depois de pular com um toque). */
export const HOLD_MS = 800;
/** Reduzir movimento: o quadro final direto, por este tempo. */
export const REDUCED_MS = 900;

/** Os símbolos do caça-níquel: a estrela paga; os outros são os da máquina de Celadon (moeda, Pikachu, Psyduck, Slowpoke). */
export const REEL_SYMS = ['star', 'coin', 'pika', 'psy', 'slow'] as const;
export type ReelSym = (typeof REEL_SYMS)[number];

export interface SlotPlan {
    /** O símbolo em que cada rolo para. */
    stops: [ReelSym, ReelSym, ReelSym];
    /** Os 2 primeiros bateram: o 3º rolo demora mais (o "quase"). */
    near: boolean;
    /** Quando cada rolo para (ms desde o giro). */
    at: [number, number, number];
    /** Duração total, com o resultado na tela. */
    total: number;
}

/** Os rolos param um por um, 300 ms entre eles; com os 2 primeiros iguais, o 3º leva mais 650 ms. */
const REEL_FIRST = 650;
const REEL_GAP = 300;
const REEL_NEAR = 650;

export function slotPlan(won: boolean, key: string): SlotPlan {
    const rng = new Rng(key, 'slot');
    const others = REEL_SYMS.filter((s) => s !== 'star');
    let stops: [ReelSym, ReelSym, ReelSym];
    if (won) stops = ['star', 'star', 'star'];
    // metade das derrotas é o "quase": duas estrelas e o 3º escorrega
    else if (rng.chance(0.5)) stops = ['star', 'star', others[rng.int(0, others.length - 1)]];
    else {
        // desencontrados: os 2 primeiros diferentes (iguais seria o "quase")
        const a = REEL_SYMS[rng.int(0, REEL_SYMS.length - 1)];
        const rest = REEL_SYMS.filter((s) => s !== a);
        const b = rest[rng.int(0, rest.length - 1)];
        stops = [a, b, REEL_SYMS[rng.int(0, REEL_SYMS.length - 1)]];
    }
    const near = stops[0] === stops[1];
    const at: [number, number, number] = [
        REEL_FIRST,
        REEL_FIRST + REEL_GAP,
        REEL_FIRST + 2 * REEL_GAP + (near ? REEL_NEAR : 0),
    ];
    return { stops, near, at, total: at[2] + HOLD_MS };
}

export interface WheelPlan {
    /** Ângulo (graus) da fatia verde, a partir do topo no sentido horário: o tamanho da chance. */
    slice: number;
    /** Quanto a roleta gira até parar (graus): o ponteiro do topo cai dentro da fatia certa. */
    turn: number;
    /** Quando ela para e quando a carta desce. */
    stopAt: number;
    total: number;
}

const WHEEL_SPIN = 2000;
const CARD_DROP = 350;

export function wheelPlan(chance: number, won: boolean, key: string): WheelPlan {
    const rng = new Rng(key, 'roleta');
    const slice = chance * 360;
    // onde a roleta para (no desenho dela): dentro da fatia verde se ganhou, na vermelha se perdeu, longe da borda
    const [from, to] = won ? [0, slice] : [slice, 360];
    const landing = from + (to - from) * (0.15 + 0.7 * rng.next());
    // o ponteiro fica no topo: girar `turn` põe o ângulo `landing` da roda embaixo dele
    const turn = 4 * 360 + (360 - landing);
    return { slice, turn, stopAt: WHEEL_SPIN, total: WHEEL_SPIN + CARD_DROP + HOLD_MS };
}

export interface SafariPlan {
    /** Quantas vezes a bola balança (pegou: 3 e o clique; fugiu: 1 a 3). */
    shakes: number;
    /** A bola sai da mão, chega no Pokémon, ele entra, a bola cai no chão. */
    hitAt: number;
    landAt: number;
    /** Começo de cada balançada. */
    shakeAt: number[];
    /** O clique (pegou) ou a bola abrindo (fugiu). */
    resultAt: number;
    total: number;
}

const THROW = 450;
const ABSORB = 300;
const DROP = 200;
const SHAKE = 450;

export function safariPlan(won: boolean, key: string): SafariPlan {
    const shakes = won ? 3 : new Rng(key, 'safari').int(1, 3);
    const landAt = THROW + ABSORB + DROP;
    const shakeAt = Array.from({ length: shakes }, (_, i) => landAt + 100 + i * SHAKE);
    const resultAt = landAt + 100 + shakes * SHAKE;
    // fugiu: ele ainda corre pro mato antes do texto ficar
    return { shakes, hitAt: THROW, landAt, shakeAt, resultAt, total: resultAt + (won ? HOLD_MS : HOLD_MS + 300) };
}

export interface HealPlan {
    /** Quando cada bola pousa na máquina. */
    ballAt: number[];
    /** O jingle (2 s) e as bolas piscando juntas. */
    jingleAt: number;
    /** O efeito (o amarelo rasgando, quem estava fora acordando) e o "volte sempre". */
    effectAt: number;
    doneAt: number;
    total: number;
}

const BALL_FIRST = 150;
const BALL_GAP = 140;
const JINGLE = 2000;

/** Centro Pokémon: as bolas do time pousam uma a uma (até 6, como a máquina dos jogos), o jingle, o efeito. */
export function healPlan(balls: number): HealPlan {
    const n = Math.max(1, Math.min(6, balls));
    const ballAt = Array.from({ length: n }, (_, i) => BALL_FIRST + i * BALL_GAP);
    const jingleAt = ballAt[n - 1] + 200;
    // o efeito cai no acorde final do jingle (a resposta pousando), o rabo soa por baixo do "volte sempre"
    const effectAt = jingleAt + JINGLE - 600;
    const doneAt = effectAt + 400;
    return { ballAt, jingleAt, effectAt, doneAt, total: doneAt + HOLD_MS };
}
