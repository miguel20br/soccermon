import type { MaxGrade } from '../engine/state';
import { MAX_PEAK, MAX_TAP } from '../game/max-sfx';
import { beatNow, duckMusic, heardAt, nextBarIn, unduckMusic } from '../game/music';
import { maxBurst } from './max-burst';

/**
 * QTE de um tiro só do golpe máximo (29/10/2026, B2 + B3 da proposta): quando o botão acende, um anel nasce grande e
 * fecha UMA vez, no 1 do compasso da música a pelo menos `minLeadMs` (sem música, em `silentMs`). Perfeito só até
 * encostar (`perfectBefore` antes, `perfectAfter` depois), bom até `goodMs` dos dois lados, senão fora. `offsetMs`
 * acerta o fone (positivo = o toque chega depois do que se ouve). A nota continua dado da ordem: o motor não muda.
 */
export const MAX_BEAT = {
    perfectBefore: 70,
    perfectAfter: 30,
    goodMs: 150,
    offsetMs: 0,
    minLeadMs: 1000,
    silentMs: 1500,
};

/** O áudio entra sob demanda (o ZzFX cria o AudioContext ao ser importado; os testes não têm áudio). */
const sfx = () => import('../game/audio');

/** Anel da vez: quando nasceu e quando encosta (ms, `performance.now`). Fica depois de sumir (a quadra lê o fim). */
let ring: { start: number; at: number } | null = null;
let users = 0;
let tapped = false;
/** O anel da vez abaixou a música (só na hora certa). */
let ducking = false;

/** Espera (ms) até o 1 de compasso que se ouve a pelo menos `minLeadMs`; sem música, `silentMs`. */
function leadMs(): number {
    const bar = nextBarIn();
    const b = beatNow();
    if (bar === null || !b) return MAX_BEAT.silentMs;
    const barMs = (b.beats * 60000) / b.bpm;
    let ms = bar * 1000;
    while (ms < MAX_BEAT.minLeadMs) ms += barMs;
    return ms;
}

/**
 * Um anel na tela (o botão grande e o da barra de baixo dividem o mesmo): o primeiro arma o anel e, na hora certa
 * (`duck`), põe a música no fundo; o último a sair solta a música (sem toque, devagar). No "chamar o capitão" a música
 * fica: abaixar em todo ataque cansava. Devolve a hora em que o anel nasceu e encosta.
 */
export function holdRing(duck = true): { start: number; at: number; release: () => void } {
    if (users++ === 0) {
        const now = performance.now();
        ring = { start: now, at: now + leadMs() };
        tapped = false;
        ducking = duck;
        if (duck) duckMusic();
        void sfx().then((a) => a.loadMaxSfx());
    }
    const r = ring as { start: number; at: number };
    return {
        ...r,
        release: () => {
            if (--users > 0) return;
            if (!tapped && ducking) unduckMusic(false);
        },
    };
}

/** O anel da vez (pra quadra segurar o bullet time até ele fechar), ou null se nenhum nasceu ainda. */
export const maxRing = () => ring;

/** Nota do toque a `ms` do encontro do anel com o botão (negativo = antes). */
export function gradeDelta(ms: number): MaxGrade {
    if (ms >= -MAX_BEAT.perfectBefore && ms <= MAX_BEAT.perfectAfter) return 2;
    return Math.abs(ms) <= MAX_BEAT.goodMs ? 1 : 0;
}

/** Nota agora (sem anel na tela, fora). */
export function maxGradeNow(now = performance.now()): MaxGrade {
    return ring && users > 0 ? gradeDelta(now - MAX_BEAT.offsetMs - ring.at) : 0;
}

/**
 * O toque valeu: a nota, o som dela (o perfeito cai na batida, quando o toque vem antes do anel encostar) e a música
 * volta com a virada.
 */
export function maxTap(now = performance.now()): MaxGrade {
    const q = maxGradeNow(now);
    if (users > 0 && !tapped) {
        tapped = true;
        const wait = q === 2 && ring ? Math.max(0, ring.at - now) / 1000 : 0;
        const at = wait ? heardAt(wait) : undefined;
        void sfx().then((a) => a.playMax(MAX_TAP[q], MAX_PEAK.tap, at));
        unduckMusic(true);
        maxBurst(q);
    }
    return q;
}
