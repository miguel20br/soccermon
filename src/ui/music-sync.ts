import { FUTSAL_5 } from '../engine/config';
import { type MapRegion, nodeById, regionOfRow, rivalTrainer } from '../engine/cup-map';
import type { MatchEvent } from '../engine/state';
import { playMusic, startMusicLifecycle, type TrackId } from '../game/music';
import { type Screen, useGame } from '../store/game-store';

/** Faixa de cada tela (sem entrada = silêncio). A partida escolhe a dela por `matchMusic`. */
const TRACK: Partial<Record<Screen, TrackId>> = {
    home: 'abertura-gancho',
    settings: 'abertura-gancho',
    credits: 'ultima-partida',
    help: 'abertura-gancho',
    profile: 'abertura-gancho',
    collection: 'abertura-gancho',
    trophies: 'sala',
    daily: 'abertura-gancho',
    liga: 'abertura-gancho',
    shop: 'mercado-funk',
    draft: 'draft',
    lineup: 'escalacao',
    reward: 'recompensa',
};

/** Região do mapa da Rota Índigo com faixa própria (as outras tocam a Estrada da Vitória). */
const REGION_TRACK: Partial<Record<MapRegion, TrackId>> = { rota1: 'rota-1', mtmoon: 'mt-moon', cerulean: 'cerulean' };

/** Líderes (e a Rocket) com partida própria; Surge, Erika, Koga, Sabrina, Blaine e Giovanni só têm o tema (a partida dele é a padrão). */
const OWN: readonly string[] = ['brock', 'misty', 'rocket'];
const THEME: readonly string[] = [...OWN, 'ltsurge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni'];
const trainerOf = (opponent?: string) => (opponent ? rivalTrainer(opponent) : undefined);

/** Fase da música na disputa de pênaltis (depois do apito final): espera, ou o fim na cobrança decisiva. */
export function penaltyMusic(events: readonly MatchEvent[], tick: number): 'espera' | 'ganhou' | 'perdeu' | null {
    const pens = events.filter((e): e is Extract<MatchEvent, { type: 'penalty' }> => e.type === 'penalty');
    const last = pens[pens.length - 1];
    if (!last) return null;
    if (tick < last.tick) return 'espera';
    return last.shootout[0] > last.shootout[1] ? 'ganhou' : 'perdeu';
}

/**
 * A Pressão final começou neste 2º tempo: a música fica no trecho `pressao` até o apito, mesmo que o placar empate e a
 * pressão do motor acabe (a tensão segura até o fim). Só a música lembra disso; o motor não muda.
 */
let pressaoFica = false;

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
    penaltis?: 'espera' | 'ganhou' | 'perdeu' | null;
}) {
    if (m.penaltis) return playMusic(`penaltis-${m.penaltis}`);
    const who = trainerOf(m.opponent);
    const own = who && OWN.includes(who) ? who : null;
    pressaoFica = m.half === 2 && !m.intro && (pressaoFica || m.pressure);
    if (m.intro && who && THEME.includes(who)) return playMusic(`tema-${who}` as TrackId);
    const h = FUTSAL_5.displayHalfMinutes;
    const k = (m.minute - (m.half - 1) * h) / h;
    const nivel = k < 1 / 3 ? 'nivel1' : k < 2 / 3 ? 'nivel2' : 'nivel3';
    const id = `partida-${own ? `${own}-` : ''}${m.half === 2 ? '2t' : '1t'}` as TrackId;
    playMusic(id, m.ended ? 'fim' : pressaoFica ? 'pressao' : nivel);
}

/**
 * Faixa da tela. Resultado: campeão, eliminado da copa, ou a vinheta da vitória ou da derrota da partida. Mapa da Rota
 * (e as paradas dele): a região da próxima linha no mapa, a da casa atual no Evento e no Treino.
 */
export function trackOf(s: ReturnType<typeof useGame.getState>): TrackId | null {
    const run = s.run;
    if (s.screen === 'result') {
        if (run?.status === 'champion') return 'campeao';
        if (run?.status === 'eliminated') return 'eliminado';
        const last = run?.results.find((r) => r.stage === run.stage);
        return last ? (last.won ? 'vitoria-gancho' : 'derrota') : null;
    }
    if (s.screen === 'group') return 'planalto-indigo';
    if (s.screen === 'map' || s.screen === 'event' || s.screen === 'treino') {
        const at = run?.map && run.at ? nodeById(run.map, run.at) : undefined;
        const row = !at ? 0 : s.screen === 'map' ? at.row + 1 : at.row;
        return REGION_TRACK[regionOfRow(row).id] ?? 'estrada-da-vitoria';
    }
    return TRACK[s.screen] ?? null;
}

/** Liga a música às telas (uma vez, no início do app). A partida (`Match.tsx`) cuida da própria faixa. */
export function startMusicSync() {
    startMusicLifecycle();
    playMusic(trackOf(useGame.getState()));
    useGame.subscribe((s, prev) => {
        // a partida pede a dela (`matchMusic`): sem o silêncio no meio, a troca da Escalação cai no tempo
        if (s.screen === 'match') return;
        if (s.screen !== prev.screen || s.run?.status !== prev.run?.status) playMusic(trackOf(s));
    });
}
