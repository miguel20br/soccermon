/**
 * Como a quadra mostra uma evolução no meio da partida (sem Phaser, para dar teste).
 * - 'mine': a do seu time, em tela cheia (EvolutionOverlay), com a partida parada até ela acabar.
 * - 'rival': a do outro time, na quadra (silhueta branca piscando + faixa "RIVAL EVOLUIU!" na cor dele), curta.
 * - 'skip': retomando a partida (evento antigo): troca a forma sem animação.
 * "Meu time" é o lado de quem está vendo (`mine`): no duelo o convidado é o 1, e a evolução do anfitrião é a do rival.
 * Sem a forma nova carregada, a sua troca direto; a do rival ainda ganha a faixa (o rosto não depende do atlas).
 */
export function evolutionView(team: 0 | 1, mine: 0 | 1, silent: boolean, ready: boolean): 'mine' | 'rival' | 'skip' {
    if (silent) return 'skip';
    if (team !== mine) return 'rival';
    return ready ? 'mine' : 'skip';
}

/** Copa: quanto a evolução do rival segura a quadra (a sua segura até a tela cheia fechar, ~10 s). */
export const RIVAL_EVO_MS = 1500;

/** Piscadas da silhueta (ms entre uma e outra), acelerando, cabendo em `total` ms. */
export function blinkSchedule(total: number): number[] {
    const out: number[] = [];
    let dt = total > 3000 ? 480 : 200;
    let at = 0;
    while (at + dt <= total) {
        out.push(dt);
        at += dt;
        dt = Math.max(50, Math.round(dt * 0.86));
    }
    return out;
}
