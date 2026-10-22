import { FUTSAL_5 } from '../engine/config';
import { playMusic, startMusicLifecycle, type TrackId } from '../game/music';
import { type Screen, useGame } from '../store/game-store';

/** Faixa de cada tela (sem entrada = silêncio). A partida escolhe a dela por `matchMusic`. */
const TRACK: Partial<Record<Screen, TrackId>> = {
    home: 'abertura-gancho',
    settings: 'abertura-gancho',
    credits: 'abertura-gancho',
    help: 'abertura-gancho',
    profile: 'abertura-gancho',
    collection: 'abertura-gancho',
    trophies: 'abertura-gancho',
    daily: 'abertura-gancho',
    liga: 'abertura-gancho',
    shop: 'mercado-funk',
    map: 'estrada-da-vitoria',
    group: 'estrada-da-vitoria',
    treino: 'estrada-da-vitoria',
    event: 'estrada-da-vitoria',
};

/** Partida: faixa do tempo e trecho pela intensidade (cada tempo acelera até o fim; 2º tempo tem Pressão final). */
export function matchMusic(half: number, minute: number, pressure: boolean) {
    const h = FUTSAL_5.displayHalfMinutes;
    const k = (minute - (half - 1) * h) / h;
    const nivel = k < 1 / 3 ? 'nivel1' : k < 2 / 3 ? 'nivel2' : 'nivel3';
    playMusic(half === 2 ? 'partida-2t' : 'partida-1t', half === 2 && pressure ? 'pressao' : nivel);
}

/** Liga a música às telas (uma vez, no início do app). A partida (`Match.tsx`) cuida da própria faixa. */
export function startMusicSync() {
    startMusicLifecycle();
    playMusic(TRACK[useGame.getState().screen] ?? null);
    useGame.subscribe((s, prev) => {
        if (s.screen !== prev.screen) playMusic(TRACK[s.screen] ?? null);
    });
}
