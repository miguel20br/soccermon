import { FUTSAL_5 } from '../engine/config';
import { rivalTrainer } from '../engine/cup-map';
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

/** Líderes (e a Rocket) com tema e partida próprios. */
const OWN: readonly string[] = ['brock', 'misty', 'rocket'];
const ownOf = (opponent?: string) => {
    const who = opponent ? rivalTrainer(opponent) : undefined;
    return who && OWN.includes(who) ? who : null;
};

/**
 * Partida: faixa do rival e do tempo, trecho pela intensidade (cada tempo acelera até o fim; 2º tempo tem Pressão final).
 * Na apresentação (VERSUS) toca o tema do líder, se tiver; no apito final, o trecho `fim`.
 */
export function matchMusic(m: {
    half: number;
    minute: number;
    pressure: boolean;
    opponent?: string;
    intro?: boolean;
    ended?: boolean;
}) {
    const own = ownOf(m.opponent);
    if (m.intro && own) return playMusic(`tema-${own}` as TrackId);
    const h = FUTSAL_5.displayHalfMinutes;
    const k = (m.minute - (m.half - 1) * h) / h;
    const nivel = k < 1 / 3 ? 'nivel1' : k < 2 / 3 ? 'nivel2' : 'nivel3';
    const id = `partida-${own ? `${own}-` : ''}${m.half === 2 ? '2t' : '1t'}` as TrackId;
    playMusic(id, m.ended ? 'fim' : m.half === 2 && m.pressure ? 'pressao' : nivel);
}

/** Faixa da tela; a copa campeã (resultado) e a fase de grupos do Planalto têm a delas. */
function trackOf(s: ReturnType<typeof useGame.getState>): TrackId | null {
    if (s.screen === 'result' && s.run?.status === 'champion') return 'campeao';
    if (s.screen === 'group') return 'planalto-indigo';
    return TRACK[s.screen] ?? null;
}

/** Liga a música às telas (uma vez, no início do app). A partida (`Match.tsx`) cuida da própria faixa. */
export function startMusicSync() {
    startMusicLifecycle();
    playMusic(trackOf(useGame.getState()));
    useGame.subscribe((s, prev) => {
        if (s.screen !== prev.screen || (s.screen !== 'match' && s.run?.status !== prev.run?.status))
            playMusic(trackOf(s));
    });
}
