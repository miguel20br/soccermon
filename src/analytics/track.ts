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

/**
 * Robô não é jogador: navegador automatizado (Playwright, Puppeteer, Selenium: `navigator.webdriver`, inclusive os
 * nossos testes no ar, que abrem em 1280x720 e contavam como "desktop novo") e os rastreadores que rodam JavaScript.
 * Pela lista de nomes, não por "bot" solto: celular CUBOT tem "bot" no user agent, e o app de busca da Yandex
 * (gente) tem "YandexSearch"; os robôs dela trazem "yandex.com/bots".
 */
export const isBot = (nav: { webdriver?: boolean; userAgent?: string }) =>
    nav.webdriver === true ||
    /googlebot|google-inspectiontool|bingbot|yandex\.com\/bots|baiduspider|duckduckbot|applebot|ahrefs|semrush|petalbot|bytespider|gptbot|claudebot|headlesschrome|lighthouse|crawler|spider/i.test(
        nav.userAgent ?? '',
    );

/** Só no site oficial: prévias da Vercel, staging e o endereço antigo não sujam as estatísticas. Robô também não. */
const ENABLED = import.meta.env.PROD && !!cloudApi && window.location.hostname === 'soccermon.com' && !isBot(navigator);
const FLUSH_MS = 8000;

/**
 * Nomes que o banco aceita (`game_events_name_check`, última migração em `supabase/migrations/`). Um nome fora da
 * lista faz o POST do lote inteiro dar 400 e o lote some; por isso `track` só aceita estes e confere de novo na hora.
 */
export const EVENT_NAMES = [
    'session_start',
    'screen',
    'onboarding_done',
    'run_start',
    'formation',
    'pick',
    'match_end',
    'run_end',
    'reward',
    'run_abandon',
    'club_color',
    'setting',
    'login',
    'error',
    'share',
    'shop_buy',
    'shop_leave',
    'coach_shown',
    'coach_next',
    'coach_skip',
    'match_skip',
    'duel_join',
    'duel_match_end',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/**
 * Balões do tutorial (`coach_*`): ligados desde que a migração `20261022180000_eventos_tutorial.sql` entrou em produção
 * (22/10/2026). Nome novo de evento: migração antes, senão o servidor recusa.
 */
export const COACH_EVENTS = true;

/** Vai pro banco: está na lista e, se é do tutorial, a migração já entrou. */
export const sendable = (name: string) =>
    (EVENT_NAMES as readonly string[]).includes(name) && (COACH_EVENTS || !name.startsWith('coach_'));
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

type Run = NonNullable<GameState['run']>;

/** Qual das recompensas oferecidas entrou no time (o store não guarda o índice escolhido). */
export function pickedReward(old: Run, run: Run): Run['rewards'][number] | null {
    const before = new Map(old.picks.map((p) => [p.uid, p]));
    return (
        old.rewards.find((r) =>
            run.picks.some((p) => {
                const was = before.get(p.uid);
                if (r.kind === 'pokemon') return p.uid === r.inst.uid && !was;
                if (r.kind === 'tm') return !!was && p.moves.includes(r.move) && !was.moves.includes(r.move);
                return !!was && p.item === r.item && was.item !== r.item;
            }),
        ) ?? null
    );
}

export function track(name: EventName, props: Props = {}) {
    // antes de o save carregar, `stats` ainda é o padrão (pode ser de quem desligou)
    if (!ENABLED || !sendable(name) || !useGame.persist.hasHydrated() || !useGame.getState().settings.stats) return;
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
        track('run_start', {
            challenge: new URLSearchParams(location.search).has('seed'),
            daily: !!run.daily,
            // Rota Índigo ('longa'): 8 partidas, então `stage` não é a fase da Relâmpago
            mode: run.mode ?? null,
        });
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
                mode: run.mode ?? null,
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
                mode: run.mode ?? null,
                perfect: run.status === 'champion' && run.results.every((x) => x.won && x.score[1] === 0),
                // raridade na tela do título ("só 3% dos campeões tinham..."): espécies do elenco e o capitão
                squad: [...run.lineup, ...run.bench]
                    .map((u) => run.picks.find((p) => p.uid === u)?.speciesId)
                    .filter(Boolean)
                    .join(','),
                captain: run.picks.find((p) => p.uid === run.captainUid)?.speciesId ?? null,
                auto_from: run.autoFrom ?? null,
                sponsors: (run.sponsors ?? []).join(',') || null,
            });
        }
        // Mercado: cada compra (o Patrocínio vai no `what`) e a saída com o ₽ guardado
        const shop = run.shop ?? old.shop;
        if (old.status === 'shop' && shop && (run.shop?.sold.length ?? 0) > (old.shop?.sold.length ?? 0)) {
            const o = shop.offers[run.shop!.sold.at(-1)!];
            track('shop_buy', {
                stage: run.stage,
                kind: o.kind,
                what:
                    o.kind === 'sponsor'
                        ? o.id
                        : o.kind === 'pokemon'
                          ? o.inst.speciesId
                          : o.kind === 'pack'
                            ? o.type
                            : o.kind === 'item'
                              ? o.item
                              : o.move,
                price: o.price,
                money: run.money ?? 0,
            });
        }
        if (old.status === 'shop' && run.status !== 'shop')
            track('shop_leave', {
                stage: old.stage,
                money: run.money ?? 0,
                bought: old.shop?.sold.length ?? 0,
                rerolls: old.shop?.rerolls ?? 0,
                sponsors: (run.sponsors ?? []).join(','),
            });
        if (old.status === 'reward' && (run.status === 'lineup' || run.status === 'shop')) {
            const got = pickedReward(old, run);
            track('reward', {
                stage: old.stage,
                rerolls_left: run.rerolls,
                skipped: run.picks === old.picks,
                kind: got?.kind ?? null,
                what: got
                    ? got.kind === 'pokemon'
                        ? got.inst.speciesId
                        : got.kind === 'tm'
                          ? got.move
                          : got.item
                    : null,
            });
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
            k !== 'musicVolume' &&
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
