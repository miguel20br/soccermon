// Edge Function `liga` (Deno): a Liga ranqueada com times fantasma. O navegador nunca manda placar nem Elo: ele pede
// a próxima partida (o servidor sorteia o fantasma e a seed), joga, e manda só as ordens que deu. Aqui a partida roda
// de novo no mesmo motor (~0,5 s de CPU, o limite é 2 s) e o placar que vale é o daqui.
//
// Antes do deploy: `npm run edge:liga` (gera ./engine.js com o motor da versão atual). Deploy (só com o ok do Miguel):
//   supabase functions deploy liga --project-ref vszcxacbcabohhdwxfpb
// Precisa da migração 20261019180000_copa_do_dia_e_liga.sql aplicada. Plano: docs/planos/liga.md.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';
import * as L from './engine.js';

type Json = Record<string, unknown>;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: Json, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

/** Erro que vai pra tela (código curto; o texto fica no i18n do jogo). */
class Recusa extends Error {}

/** Partida começada ("Jogar") há mais que isso conta como abandono (derrota) quando o jogador pede a próxima. */
const OPEN_MAX_MS = 2 * 60 * 60 * 1000;
/** Teto de partidas por dia por conta (ninguém joga 100 partidas num dia sem ser robô). */
const MAX_PER_DAY = 100;
/** Fantasmas: só times mexidos nos últimos 60 dias. */
const GHOST_FRESH_DAYS = 60;
/** Cartas especiais no time da Liga (como o padrão do Time pronto do duelo). */
const LIGA_SPECIALS = 3;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Nome público: o nome do treinador no jogo (nunca o da conta Google) e o clube. */
function publicInfo(body: Json) {
    const info = (body.info ?? {}) as Json;
    return {
        trainer: str(info.trainer, 40) || 'Treinador',
        club: str(info.club, 22) || 'Pallet FC',
        club_tag: str(info.tag, 3) || 'PAL',
        club_color: str(info.color, 12) || 'vermelho',
    };
}

async function ratingOf(db: SupabaseClient, uid: string, season: string) {
    const { data } = await db
        .from('league_ratings')
        .select('elo, peak, games, wins, losses, season')
        .eq('user_id', uid)
        .in('season', [season, L.prevSeason(season)]);
    const now = data?.find((r) => r.season === season);
    if (now) return now;
    const prev = data?.find((r) => r.season !== season);
    const elo = L.seasonStartElo(prev?.elo ?? null);
    return { elo, peak: elo, games: 0, wins: 0, losses: 0, season };
}

/** Fecha a partida (resultado ou abandono) e grava o Elo novo. Devolve null se outra chamada já fechou. */
async function close(db: SupabaseClient, uid: string, m: Json, won: boolean, extra: Json) {
    const season = m.season as string;
    const r = await ratingOf(db, uid, season);
    const elo = L.eloAfter(r.elo, m.ghost_elo as number, won, r.games);
    const { data: done } = await db
        .from('league_matches')
        .update({ ...extra, won, elo_after: elo, finished_at: new Date().toISOString() })
        .eq('id', m.id)
        .eq('status', 'open')
        .select('id');
    if (!done?.length) return null;
    const { error } = await db.from('league_ratings').upsert({
        user_id: uid,
        season,
        elo,
        peak: Math.max(r.peak, elo),
        games: r.games + 1,
        wins: r.wins + (won ? 1 : 0),
        losses: r.losses + (won ? 0 : 1),
        updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { eloBefore: r.elo, eloAfter: elo, games: r.games + 1 };
}

async function inscrever(db: SupabaseClient, uid: string, body: Json) {
    const problems = L.validarTimeDuelo(body.team, LIGA_SPECIALS);
    if (problems.length) throw new Recusa(`time_invalido: ${problems.slice(0, 3).join('; ')}`);
    const team = L.teamFromRecipe(body.team as never, 'x');
    const ovr = Math.round(team.lineup.reduce((n, p) => n + L.viewInstance(p).overall, 0) / team.lineup.length);
    const { error } = await db.from('league_teams').upsert({
        user_id: uid,
        team: body.team,
        ovr,
        ...publicInfo(body),
        engine_version: L.ENGINE_VERSION,
        updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { ok: true, ovr };
}

// a seed só sai depois do "Jogar" (com ela dá pra simular a partida em casa antes de decidir jogar)
const openOut = (m: Json) => ({
    id: m.id,
    seed: m.started_at ? m.seed : null,
    started: !!m.started_at,
    season: m.season,
    myTeam: m.my_team,
    ghostTeam: m.ghost_team,
    ghost: m.ghost_info,
    ghostElo: m.ghost_elo,
    eloBefore: m.elo_before,
    engine: m.engine_version,
});

async function proxima(db: SupabaseClient, uid: string) {
    const season = L.seasonOf(L.dailyDay());
    const { data: open } = await db.from('league_matches').select('*').eq('user_id', uid).eq('status', 'open');
    const cur = open?.[0];
    if (cur) {
        // recarregar a página devolve a mesma partida (mesmo fantasma, mesma seed); começada e largada = derrota
        if (!cur.started_at || Date.now() - Date.parse(cur.started_at) < OPEN_MAX_MS) return openOut(cur);
        await close(db, uid, cur, false, { status: 'abandoned' });
    }
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await db
        .from('league_matches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('created_at', since);
    if ((count ?? 0) >= MAX_PER_DAY) throw new Recusa('limite_diario');

    const { data: mine } = await db.from('league_teams').select('team').eq('user_id', uid).maybeSingle();
    if (!mine) throw new Recusa('sem_time');
    const me = await ratingOf(db, uid, season);

    const fresh = new Date(Date.now() - GHOST_FRESH_DAYS * 86400000).toISOString();
    const { data: teams } = await db
        .from('league_teams')
        .select('user_id, team, ovr, trainer, club, club_tag, club_color')
        .neq('user_id', uid)
        .gte('updated_at', fresh)
        .limit(300);
    const ids = (teams ?? []).map((t) => t.user_id);
    const { data: elos } = ids.length
        ? await db.from('league_ratings').select('user_id, elo').eq('season', season).in('user_id', ids)
        : { data: [] };
    const eloOf = new Map((elos ?? []).map((r) => [r.user_id, r.elo]));
    const { data: recent } = await db
        .from('league_matches')
        .select('ghost_id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(L.RECENT_GHOSTS);
    const cands = (teams ?? []).map((t) => ({ ...t, id: t.user_id, elo: eloOf.get(t.user_id) ?? L.ELO_START }));
    const ghost = L.pickGhost(
        cands,
        { id: uid, elo: me.elo },
        (recent ?? []).map((r) => r.ghost_id),
        Math.random(),
    );

    const seed = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    // começo da Liga (ninguém inscrito ainda): um clube da Copa faz o papel de fantasma, com Elo de início
    const house = ghost ? null : L.buildCupOpponents(seed)[Math.floor(Math.random() * 4)];
    const row = {
        user_id: uid,
        ghost_id: ghost?.user_id ?? null,
        season,
        seed,
        my_team: mine.team,
        ghost_team: ghost ? ghost.team : L.teamRecipe(house!),
        ghost_info: ghost
            ? { trainer: ghost.trainer, club: ghost.club, tag: ghost.club_tag, color: ghost.club_color, ovr: ghost.ovr }
            : { trainer: null, club: house!.name, tag: null, color: null, ovr: null, house: true },
        ghost_elo: ghost?.elo ?? L.ELO_START,
        elo_before: me.elo,
        engine_version: L.ENGINE_VERSION,
    };
    const { data: made, error } = await db.from('league_matches').insert(row).select('*').single();
    if (error) {
        // duas abas pedindo ao mesmo tempo: a outra criou a partida aberta, devolve ela
        const { data: again } = await db.from('league_matches').select('*').eq('user_id', uid).eq('status', 'open');
        if (again?.[0]) return openOut(again[0]);
        throw error;
    }
    return openOut(made);
}

/** "Jogar": a partida começa valendo (largar = derrota) e a seed sai. Joga com o time inscrito agora. */
async function jogar(db: SupabaseClient, uid: string, body: Json) {
    if (body.engine !== L.ENGINE_VERSION) throw new Recusa('versao');
    const { data: m } = await db
        .from('league_matches')
        .select('*')
        .eq('id', String(body.id ?? ''))
        .eq('user_id', uid)
        .eq('status', 'open')
        .maybeSingle();
    if (!m) throw new Recusa('sem_partida');
    if (m.started_at) return openOut(m);
    const { data: mine } = await db.from('league_teams').select('team').eq('user_id', uid).maybeSingle();
    const { data: started } = await db
        .from('league_matches')
        .update({
            started_at: new Date().toISOString(),
            my_team: mine?.team ?? m.my_team,
            engine_version: L.ENGINE_VERSION,
        })
        .eq('id', m.id)
        .is('started_at', null)
        .select('*')
        .single();
    return openOut(started ?? m);
}

async function resultado(db: SupabaseClient, uid: string, body: Json) {
    if (body.engine !== L.ENGINE_VERSION) throw new Recusa('versao');
    const orders = L.ligaOrders(body.orders);
    if (!orders) throw new Recusa('ordens');
    const { data: m } = await db
        .from('league_matches')
        .select('*')
        .eq('id', String(body.id ?? ''))
        .eq('user_id', uid)
        .eq('status', 'open')
        .maybeSingle();
    if (!m || !m.started_at) throw new Recusa('sem_partida');
    const r = L.simulateLiga(m.my_team, m.ghost_team, m.seed, orders);
    const won = r.winner === 0;
    const elo = await close(db, uid, m, won, {
        status: 'done',
        gf: r.score[0],
        ga: r.score[1],
        shootout: r.shootout,
        orders,
    });
    if (!elo) throw new Recusa('sem_partida');
    return { score: r.score, shootout: r.shootout, won, ...elo };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') return reply({ error: 'metodo' }, 405);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
    });
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data } = await db.auth.getUser(token);
    const user = data?.user;
    // só conta Google (a sessão anônima do duelo não entra na Liga)
    if (!user || user.is_anonymous) return reply({ error: 'precisa_conta' }, 401);
    let body: Json;
    try {
        body = await req.json();
    } catch {
        return reply({ error: 'corpo' }, 400);
    }
    try {
        if (body.action === 'inscrever') return reply(await inscrever(db, user.id, body));
        if (body.action === 'proxima') return reply(await proxima(db, user.id));
        if (body.action === 'jogar') return reply(await jogar(db, user.id, body));
        if (body.action === 'resultado') return reply(await resultado(db, user.id, body));
        return reply({ error: 'acao' }, 400);
    } catch (e) {
        if (e instanceof Recusa) return reply({ error: e.message }, 400);
        console.error('[liga]', e);
        return reply({ error: 'falhou' }, 500);
    }
});
