// Edge Function `ut` (Deno): troca de cartas entre amigos e ranking do Time Ultimate. NÃO publicada e NÃO ligada em
// produção: precisa do ok do Miguel (docs/planos/troca-e-ranking.md). Mesmo molde da `liga`: o navegador nunca manda
// carta nem placar como verdade. A carta tem que existir no save da nuvem (`saves.data.ultimate.cards`) e o placar é
// refeito aqui no motor empacotado.
//
// Antes do deploy: empacotar ./engine.js (comando no topo de src/store/ultimate/edge-entry.ts). Deploy:
//   supabase functions deploy ut --project-ref vszcxacbcabohhdwxfpb
// Precisa da migração 20270601120000_troca_e_ranking_ut.sql aplicada.
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

const H = 3600 * 1000;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isUuid = (v: unknown): v is string =>
    typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** O save da nuvem: as cartas e a temporada. Sem save (nunca sincronizou) ninguém troca nem entra no ranking. */
async function cloudSave(db: SupabaseClient, uid: string) {
    const { data } = await db.from('saves').select('data').eq('user_id', uid).maybeSingle();
    const u = (data?.data as Json | undefined)?.ultimate as Json | undefined;
    if (!u || !Array.isArray(u.cards)) throw new Recusa('sem_save');
    return u as { season: number; cards: Json[]; locked?: string[]; evos?: { uid: string }[] };
}

const seasonNow = () => L.seasonN(Date.now());

/** O que a tela mostra de uma carta (o resto do JSON fica no banco). */
const cardOut = (c: Json) => ({ uid: c.uid, speciesId: c.speciesId, level: c.level, shiny: !!c.shiny, special: c.special ?? null });

// ------------------------------------------------------------------------------------------------ troca

async function friendOf(db: SupabaseClient, uid: string, code: string) {
    const { data: card } = await db.from('friend_cards').select('user_id').eq('code', code).maybeSingle();
    // código que não existe e quem bloqueou voltam o mesmo erro (bloqueio é silencioso)
    if (!card || card.user_id === uid) throw new Recusa('amigo');
    const to = card.user_id as string;
    const { data: blocked } = await db
        .from('friend_blocks')
        .select('user_id')
        .or(`and(user_id.eq.${uid},blocked_id.eq.${to}),and(user_id.eq.${to},blocked_id.eq.${uid})`);
    if (blocked?.length) throw new Recusa('amigo');
    const { data: link } = await db
        .from('friend_links')
        .select('accepted_at')
        .eq('status', 'accepted')
        .or(`and(from_id.eq.${uid},to_id.eq.${to}),and(from_id.eq.${to},to_id.eq.${uid})`)
        .maybeSingle();
    if (!link) throw new Recusa('amigo');
    if (Date.now() - Date.parse(link.accepted_at) < L.TRADE.friendH * H) throw new Recusa('amizade_nova');
    return to;
}

async function counts(db: SupabaseClient, uid: string, other: string) {
    const day = new Date(Date.now() - 24 * H).toISOString();
    const open = await db
        .from('ut_trades')
        .select('id', { count: 'exact', head: true })
        .eq('from_id', uid)
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - L.TRADE.expireH * H).toISOString());
    const done = await db
        .from('ut_trades')
        .select('from_id, to_id')
        .eq('status', 'done')
        .gte('done_at', day)
        .or(`from_id.eq.${uid},to_id.eq.${uid}`);
    const rows = done.data ?? [];
    return {
        open: open.count ?? 0,
        today: rows.length,
        pair: rows.filter((r) => r.from_id === other || r.to_id === other).length,
    };
}

/** A carta chegou numa troca há pouco? Então ainda não sai de novo (corta corrente entre contas amigas). */
async function recentlyReceived(db: SupabaseClient, uid: string, cardUid: string) {
    if (!cardUid.startsWith('tr-')) return false;
    const { data } = await db
        .from('ut_trades')
        .select('done_at')
        .eq('id', cardUid.slice(3))
        .eq('status', 'done')
        .maybeSingle();
    return !!data && Date.now() - Date.parse(data.done_at) < L.TRADE.regiftH * H;
}

function ownCard(u: { cards: Json[]; locked?: string[]; evos?: { uid: string }[] }, uid: string) {
    const c = u.cards.find((x) => x.uid === uid);
    if (!c) throw new Recusa('sem_carta');
    if (u.locked?.includes(uid) || u.evos?.some((e) => e.uid === uid)) throw new Recusa('carta_presa');
    return c;
}

async function propor(db: SupabaseClient, uid: string, body: Json) {
    const to = await friendOf(db, uid, str(body.code, 8).toUpperCase());
    const mine = await cloudSave(db, uid);
    const offerUid = str(body.offerUid, 80);
    const card = ownCard(mine, offerUid);
    if (await recentlyReceived(db, uid, offerUid)) throw new Recusa('carta_recente');
    const n = await counts(db, uid, to);
    if (!L.canPropose(n.open, n.today, n.pair)) throw new Recusa('limite');
    const { data, error } = await db
        .from('ut_trades')
        .insert({ from_id: uid, to_id: to, season: seasonNow(), offer_uid: offerUid, offer_card: card })
        .select('id')
        .single();
    // índice único: a carta já está noutra oferta aberta
    if (error) throw new Recusa(error.code === '23505' ? 'ja_ofertada' : 'falhou');
    return { id: data.id };
}

async function aceitar(db: SupabaseClient, uid: string, body: Json) {
    if (!isUuid(body.id)) throw new Recusa('troca');
    const { data: t } = await db.from('ut_trades').select('*').eq('id', body.id).eq('to_id', uid).maybeSingle();
    if (!t || t.status !== 'pending') throw new Recusa('troca');
    if (Date.now() - Date.parse(t.created_at) > L.TRADE.expireH * H) {
        await db.from('ut_trades').update({ status: 'expired' }).eq('id', t.id).eq('status', 'pending');
        throw new Recusa('expirada');
    }
    if (t.season !== seasonNow()) throw new Recusa('temporada');
    const giveUid = str(body.giveUid, 80);
    const [mine, theirs] = await Promise.all([cloudSave(db, uid), cloudSave(db, t.from_id)]);
    // as duas pontas ainda têm a carta (o dono pode ter vendido ou gastado depois da oferta)
    const give = ownCard(mine, giveUid);
    const offer = ownCard(theirs, t.offer_uid);
    if (mine.season !== t.season || theirs.season !== t.season) throw new Recusa('temporada');
    if (await recentlyReceived(db, uid, giveUid)) throw new Recusa('carta_recente');
    const problems: string[] = L.tradeProblems(give as never, offer as never);
    if (problems.length) throw new Recusa(`desigual: ${problems.join('; ')}`);
    const n = await counts(db, uid, t.from_id);
    if (n.today >= L.TRADE.perDay || n.pair >= L.TRADE.perPairDay) throw new Recusa('limite');
    // fecha só se ainda está aberta (duas abas aceitando ao mesmo tempo)
    const { data: done } = await db
        .from('ut_trades')
        .update({ status: 'done', give_uid: giveUid, give_card: give, offer_card: offer, done_at: new Date().toISOString() })
        .eq('id', t.id)
        .eq('status', 'pending')
        .select('id');
    if (!done?.length) throw new Recusa('troca');
    return { id: t.id, got: cardOut(offer), uid: L.tradedUid(t.id) };
}

async function recusar(db: SupabaseClient, uid: string, body: Json) {
    if (!isUuid(body.id)) throw new Recusa('troca');
    const { data: t } = await db.from('ut_trades').select('from_id, to_id, status').eq('id', body.id).maybeSingle();
    if (!t || t.status !== 'pending' || (t.from_id !== uid && t.to_id !== uid)) throw new Recusa('troca');
    await db
        .from('ut_trades')
        .update({ status: t.to_id === uid ? 'declined' : 'cancelled' })
        .eq('id', body.id)
        .eq('status', 'pending');
    return { ok: true };
}

/** Ofertas que chegaram, as que você fez e as trocas fechadas que o seu save ainda não aplicou. */
async function listar(db: SupabaseClient, uid: string) {
    const since = new Date(Date.now() - L.TRADE.expireH * H).toISOString();
    const { data } = await db
        .from('ut_trades')
        .select('id, from_id, to_id, status, offer_uid, offer_card, give_uid, give_card, created_at, applied_from, applied_to')
        .or(`from_id.eq.${uid},to_id.eq.${uid}`)
        .or(`and(status.eq.pending,created_at.gte.${since}),and(status.eq.done)`)
        .order('created_at', { ascending: false })
        .limit(50);
    const ids = [...new Set((data ?? []).flatMap((t) => [t.from_id, t.to_id]))].filter((x) => x !== uid);
    const { data: cards } = ids.length
        ? await db.from('friend_cards').select('user_id, trainer, club, code').in('user_id', ids)
        : { data: [] };
    const who = new Map((cards ?? []).map((c) => [c.user_id, { trainer: c.trainer, club: c.club, code: c.code }]));
    const rows = (data ?? []).map((t) => {
        const mineIsFrom = t.from_id === uid;
        return {
            id: t.id,
            dir: mineIsFrom ? 'out' : 'in',
            status: t.status,
            friend: who.get(mineIsFrom ? t.to_id : t.from_id) ?? null,
            offer: cardOut(t.offer_card),
            give: t.give_card ? cardOut(t.give_card) : null,
            created_at: t.created_at,
            // o que o seu save tem que aplicar: tirar `lose` e pôr `gain` (com o uid derivado da troca)
            toApply:
                t.status === 'done' && !(mineIsFrom ? t.applied_from : t.applied_to)
                    ? { lose: mineIsFrom ? t.offer_uid : t.give_uid, gain: mineIsFrom ? t.give_card : t.offer_card }
                    : null,
        };
    });
    return { rows };
}

async function aplicado(db: SupabaseClient, uid: string, body: Json) {
    if (!isUuid(body.id)) throw new Recusa('troca');
    await db.from('ut_trades').update({ applied_from: true }).eq('id', body.id).eq('from_id', uid).eq('status', 'done');
    await db.from('ut_trades').update({ applied_to: true }).eq('id', body.id).eq('to_id', uid).eq('status', 'done');
    return { ok: true };
}

// ------------------------------------------------------------------------------------------------ ranking

const publicInfo = (body: Json) => {
    const info = (body.info ?? {}) as Json;
    return {
        trainer: str(info.trainer, 40) || 'Treinador',
        club: str(info.club, 22) || 'Pallet FC',
        club_tag: str(info.tag, 3) || 'PAL',
        club_color: str(info.color, 12) || 'vermelho',
    };
};

async function inscrever(db: SupabaseClient, uid: string, body: Json) {
    const problems: string[] = L.validarTimeDuelo(body.team, null as never);
    if (problems.length) throw new Recusa(`time_invalido: ${problems.slice(0, 3).join('; ')}`);
    const u = await cloudSave(db, uid);
    const season = seasonNow();
    // o ranking é da temporada em curso; fora de uma temporada (season 0) não há ranking
    if (!season || u.season !== season) throw new Recusa('temporada');
    const fake: string[] = L.recipeMatchesSave(body.team as never, u.cards);
    if (fake.length) throw new Recusa(`carta_falsa: ${fake.slice(0, 3).join('; ')}`);
    const team = L.teamFromRecipe(body.team as never, 'x');
    const ovr = Math.round(team.lineup.reduce((n: number, p: never) => n + L.viewInstance(p).overall, 0) / team.lineup.length);
    const { error } = await db
        .from('ut_rank_teams')
        .upsert({ user_id: uid, season, team: body.team, ovr, ...publicInfo(body), updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true, ovr };
}

const OPEN_MAX_MS = 2 * H;

async function openRound(db: SupabaseClient, uid: string) {
    const { data } = await db.from('ut_rank_rounds').select('*').eq('user_id', uid).eq('status', 'open');
    return data?.[0] ?? null;
}

const roundOut = (m: Json) => ({
    id: m.id,
    level: m.level,
    seed: m.started_at ? m.seed : null,
    started: !!m.started_at,
    myTeam: m.my_team,
    rivalTeam: m.rival_team,
    engine: m.engine_version,
});

/** O servidor sorteia o nível pedido, a seed e o rival; recarregar a página devolve a mesma partida. */
async function proxima(db: SupabaseClient, uid: string, body: Json) {
    const season = seasonNow();
    if (!season) throw new Recusa('temporada');
    const cur = await openRound(db, uid);
    if (cur) {
        // começada e largada vira abandono (0 ponto, conta no teto do dia); só reabre antes disso
        if (!cur.started_at || Date.now() - Date.parse(cur.started_at) < OPEN_MAX_MS) return roundOut(cur);
        await db.from('ut_rank_rounds').update({ status: 'abandoned', finished_at: new Date().toISOString(), points: 0 }).eq('id', cur.id);
    }
    const level = String(body.level ?? 'normal');
    if (!(L.LEVELS as readonly string[]).includes(level)) throw new Recusa('nivel');
    const { count } = await db
        .from('ut_rank_rounds')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('created_at', new Date(Date.now() - 24 * H).toISOString());
    if ((count ?? 0) >= L.RANK_DAILY_MAX) throw new Recusa('limite_diario');
    const { data: mine } = await db.from('ut_rank_teams').select('team').eq('user_id', uid).eq('season', season).maybeSingle();
    if (!mine) throw new Recusa('sem_time');
    const seed = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const strength = L.teamStrength(L.teamFromRecipe(mine.team, 'x'));
    const rival = L.teamRecipe(L.ultimateRival(seed, 0, level, strength));
    const { data: made, error } = await db
        .from('ut_rank_rounds')
        .insert({ user_id: uid, season, level, seed, my_team: mine.team, rival_team: rival, engine_version: L.ENGINE_VERSION })
        .select('*')
        .single();
    if (error) {
        const again = await openRound(db, uid);
        if (again) return roundOut(again);
        throw error;
    }
    return roundOut(made);
}

async function jogar(db: SupabaseClient, uid: string, body: Json) {
    if (body.engine !== L.ENGINE_VERSION) throw new Recusa('versao');
    const m = await openRound(db, uid);
    if (!m || m.id !== body.id) throw new Recusa('sem_partida');
    if (m.started_at) return roundOut(m);
    const { data } = await db
        .from('ut_rank_rounds')
        .update({ started_at: new Date().toISOString() })
        .eq('id', m.id)
        .is('started_at', null)
        .select('*')
        .single();
    return roundOut(data ?? m);
}

async function resultado(db: SupabaseClient, uid: string, body: Json) {
    if (body.engine !== L.ENGINE_VERSION) throw new Recusa('versao');
    const orders = L.ligaOrders(body.orders);
    if (!orders) throw new Recusa('ordens');
    const m = await openRound(db, uid);
    if (!m || m.id !== body.id || !m.started_at) throw new Recusa('sem_partida');
    const r = L.simulateLiga(m.my_team, m.rival_team, m.seed, orders);
    const outcome = L.outcomeOf(r.score);
    const points = L.rankPoints(m.level, outcome);
    const { data: closed } = await db
        .from('ut_rank_rounds')
        .update({ status: 'done', gf: r.score[0], ga: r.score[1], shootout: r.shootout, orders, points, finished_at: new Date().toISOString() })
        .eq('id', m.id)
        .eq('status', 'open')
        .select('id');
    if (!closed?.length) throw new Recusa('sem_partida');
    const { data: cur } = await db.from('ut_ranking').select('points, games, wins').eq('user_id', uid).eq('season', m.season).maybeSingle();
    const { error } = await db.from('ut_ranking').upsert({
        user_id: uid,
        season: m.season,
        points: (cur?.points ?? 0) + points,
        games: (cur?.games ?? 0) + 1,
        wins: (cur?.wins ?? 0) + (outcome === 'win' ? 1 : 0),
        updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { score: r.score, shootout: r.shootout, outcome, points, total: (cur?.points ?? 0) + points };
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
    // só conta Google (a sessão anônima do duelo não tem amigos nem save na nuvem)
    if (!user || user.is_anonymous) return reply({ error: 'precisa_conta' }, 401);
    let body: Json;
    try {
        body = await req.json();
    } catch {
        return reply({ error: 'corpo' }, 400);
    }
    const act: Record<string, () => Promise<Json>> = {
        trocas: () => listar(db, user.id),
        propor: () => propor(db, user.id, body),
        aceitar: () => aceitar(db, user.id, body),
        recusar: () => recusar(db, user.id, body),
        aplicado: () => aplicado(db, user.id, body),
        inscrever: () => inscrever(db, user.id, body),
        proxima: () => proxima(db, user.id, body),
        jogar: () => jogar(db, user.id, body),
        resultado: () => resultado(db, user.id, body),
    };
    const run = typeof body.action === 'string' ? act[body.action] : undefined;
    if (!run) return reply({ error: 'acao' }, 400);
    try {
        return reply(await run());
    } catch (e) {
        if (e instanceof Recusa) return reply({ error: e.message }, 400);
        console.error('[ut]', e);
        return reply({ error: 'falhou' }, 500);
    }
});
