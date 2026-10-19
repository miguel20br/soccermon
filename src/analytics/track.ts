import { cloudApi, isApplyingCloud, takeLoginPending, useCloud } from '../cloud/cloud';
import { type GameState, useGame } from '../store/game-store';
import { seenCount } from '../store/profile';

/**
 * Estatísticas anônimas do jogo, gravadas na tabela `game_events` do Supabase (só inserir; ninguém lê
 * pela API). Sem conta, sem e-mail, sem cookie: cada evento leva só um id de sessão aleatório que vive
 * enquanto a aba está aberta. Desliga em Configurações (`settings.stats`) e no `npm run dev`.
 * Os eventos saem da observação do save (useGame.subscribe), sem espalhar chamadas pelas telas.
 */

type Props = Record<string, string | number | boolean | null>;
interface Row {
    session: string;
    name: string;
    props: Props;
    app_version: string;
    device: string;
}

/** Só no site oficial: prévias da Vercel, staging e o endereço antigo não sujam as estatísticas. */
const ENABLED = import.meta.env.PROD && !!cloudApi && window.location.hostname === 'soccermon.com';
const FLUSH_MS = 8000;
const MAX_QUEUE = 50;

const session = (() => {
    const make = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
        const k = 'soccermon-session';
        const id = sessionStorage.getItem(k) ?? make();
        sessionStorage.setItem(k, id);
        return id;
    } catch {
        return make();
    }
})();

const device = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Math.min(w, h) < 500) return w > h ? 'mobile-land' : 'mobile';
    return w < 1024 ? 'tablet' : 'desktop';
};

let queue: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush(keepalive = false) {
    if (timer) clearTimeout(timer);
    timer = null;
    // desligou as estatísticas depois de os eventos entrarem na fila: não manda nada
    if (!useGame.getState().settings.stats) queue = [];
    if (!queue.length || !cloudApi) return;
    const rows = queue;
    queue = [];
    // keepalive deixa o envio terminar mesmo com a aba fechando
    fetch(`${cloudApi.url}/rest/v1/game_events`, {
        method: 'POST',
        keepalive,
        headers: {
            apikey: cloudApi.key,
            Authorization: `Bearer ${cloudApi.key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
        },
        body: JSON.stringify(rows),
    }).catch(() => {
        // estatística não pode atrapalhar o jogo: perdeu, perdeu
    });
}

export function track(name: string, props: Props = {}) {
    // antes de o save carregar, `stats` ainda é o padrão (pode ser de quem desligou)
    if (!ENABLED || !useGame.persist.hasHydrated() || !useGame.getState().settings.stats) return;
    queue.push({ session, name, props, app_version: __APP_VERSION__, device: device() });
    if (queue.length >= MAX_QUEUE) flush();
    else timer ??= setTimeout(() => flush(), FLUSH_MS);
}

/** Domínio de quem mandou a pessoa (linkedin.com, github.com…), ou o utm_source do link. */
function referrer(): string | null {
    try {
        const utm = new URLSearchParams(window.location.search).get('utm_source');
        if (utm) return utm.slice(0, 40);
        if (!document.referrer) return null;
        const host = new URL(document.referrer).hostname.replace(/^www\./, '');
        return host === window.location.hostname ? null : host.slice(0, 40);
    } catch {
        return null;
    }
}

function onChange(s: GameState, prev: GameState) {
    // mudanças vindas da nuvem (login em outro aparelho) não são ações do jogador
    if (isApplyingCloud()) return;
    if (s.screen !== prev.screen) track('screen', { screen: s.screen });
    if (s.onboarded && !prev.onboarded) track('onboarding_done');

    const run = s.run;
    const old = prev.run;
    // retomar uma copa guardada não é começar copa nova
    if (run && run.seed !== old?.seed && !(prev.parkedRuns ?? []).some((p) => p.seed === run.seed))
        track('run_start', { challenge: new URLSearchParams(location.search).has('seed'), daily: !!run.daily });
    if (run && old && run.seed === old.seed) {
        if (old.status === 'formation' && run.status === 'captain') track('formation', { formation: run.formation });
        if (run.picks.length > old.picks.length) {
            const p = run.picks.at(-1)!;
            track('pick', {
                species: p.speciesId,
                round: old.draftRound,
                captain: run.captainUid === p.uid && old.status === 'captain',
                special: p.special?.kind ?? null,
                rerolls_left: run.rerolls,
                // "Monta pra mim": a escolha saiu do atalho (teste do funil na 0.8.7)
                auto: run.autoFrom !== undefined,
            });
        }
        if (run.results.length > old.results.length) {
            const r = run.results.at(-1)!;
            track('match_end', {
                stage: r.stage,
                won: r.won,
                gf: r.score[0],
                ga: r.score[1],
                shootout: !!r.shootout,
                speed: String(s.settings.speed),
                formation: run.formation,
                tactic: run.tactic,
                // quanto o técnico mexe ao vivo (base pra decidir as mecânicas de agência)
                ...ordersCount(old.live?.orders ?? []),
            });
        }
        if (run.status !== old.status && (run.status === 'champion' || run.status === 'eliminated')) {
            const r = run.results.at(-1);
            track('run_end', {
                champion: run.status === 'champion',
                stage: r?.stage ?? 0,
                perfect: run.status === 'champion' && run.results.every((x) => x.won && x.score[1] === 0),
                // raridade na tela do título ("só 3% dos campeões tinham..."): espécies do elenco e o capitão
                squad: [...run.lineup, ...run.bench]
                    .map((u) => run.picks.find((p) => p.uid === u)?.speciesId)
                    .filter(Boolean)
                    .join(','),
                captain: run.picks.find((p) => p.uid === run.captainUid)?.speciesId ?? null,
                auto_from: run.autoFrom ?? null,
            });
        }
        if (old.status === 'reward' && run.status === 'lineup') {
            track('reward', { stage: old.stage, rerolls_left: run.rerolls, skipped: run.picks === old.picks });
        }
    }
    if (old && !run) track('run_abandon', { stage: old.stage, status: old.status });

    if (s.profile.clubColor !== prev.profile.clubColor) track('club_color', { color: s.profile.clubColor });
    for (const k of Object.keys(s.settings) as (keyof GameState['settings'])[]) {
        if (
            k !== 'volume' &&
            k !== 'criesVolume' &&
            k !== 'sfxVolume' &&
            k !== 'crowdVolume' &&
            s.settings[k] !== prev.settings[k]
        ) {
            track('setting', { key: k, value: String(s.settings[k]) });
        }
    }
}

/** Mensagem de erro curta e sem endereços (URLs podem levar tokens ou dados da sessão). */
const errorText = (e: unknown) =>
    String(e)
        .replace(/https?:\/\/\S+/g, '<url>')
        .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>')
        .slice(0, 160);

/** Liga as estatísticas (uma vez, no início do app). */
export function startAnalytics() {
    if (!ENABLED) return;
    const begin = () => {
        const g = useGame.getState();
        const lab = new URLSearchParams(location.search).get('lab')?.slice(0, 40) ?? null;
        track('session_start', {
            returning: g.onboarded || g.records.cups > 0,
            ref: referrer(),
            device: device(),
            lab,
            cups: g.records.cups,
            dex_seen: seenCount(g.dex),
        });
        useGame.subscribe(onChange);
    };
    // espera o save carregar (senão todo mundo parece novo)
    if (useGame.persist.hasHydrated()) begin();
    else useGame.persist.onFinishHydration(begin);
    useCloud.subscribe((s, prev) => {
        // só o login que a pessoa pediu agora (abrir o jogo já logado não conta), contado quando termina:
        // merged = o progresso do aparelho foi junto para a conta; choice = qual copa continuou (se houve escolha)
        if (s.lastLink && s.lastLink !== prev.lastLink && takeLoginPending()) track('login', { ...s.lastLink });
    });
    window.addEventListener('error', (e) => track('error', { msg: errorText(e.message ?? e.error) }));
    window.addEventListener('unhandledrejection', (e) => track('error', { msg: errorText(e.reason) }));
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush(true));
}

/** Ordens que o técnico deu na partida, por tipo (tática, troca, escanteio, prancheta). */
function ordersCount(orders: readonly { kind?: string }[]) {
    const n = (k: string) => orders.filter((o) => (o.kind ?? 'tactic') === k).length;
    return {
        orders: orders.length,
        o_tactic: n('tactic'),
        o_sub: n('sub'),
        o_corner: n('corner'),
        o_lineup: n('lineup'),
    };
}
