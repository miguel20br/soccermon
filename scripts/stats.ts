/**
 * Placar semanal do jogo no ar: lê os eventos anônimos (`public.game_events`, ver
 * supabase/migrations/20261015150000_estatisticas.sql e src/analytics/track.ts) e imprime um resumo.
 *
 * Uso: npm run stats [-- --dias 7 | --desde 2026-10-15] [--canal reddit] [--md] [--placar]
 *      --placar: só o placar de segunda (10 linhas com meta); no --md ele vem no topo do relatório
 *      npm run stats -- --raridade   (grava public/data/raridade.json para a tela do título; commitar)
 * Conexão: POSTGRES_URL_NON_POOLING do .env.local (nunca é impresso).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import pokemon from '../src/data/pokemon.json' with { type: 'json' };
import { ehMaratona, ehVersaoAntiga, MAX_COPAS, VERSOES_RECENTES, versoesRecentes } from './funil-criterio';

// ---------- opções ----------

const args = process.argv.slice(2);
const opt = (k: string) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
};
const MD = args.includes('--md');
const PLACAR = args.includes('--placar');
const DIAS = Math.max(1, Number(opt('--dias')) || 7);
const DESDE = opt('--desde');
const CANAL = opt('--canal')?.toLowerCase();
if (DESDE && !/^\d{4}-\d{2}-\d{2}$/.test(DESDE)) {
    console.error('--desde precisa ser AAAA-MM-DD (ex.: --desde 2026-10-15)');
    process.exit(1);
}
// Brasil sem horário de verão desde 2019: meia-noite de São Paulo é sempre -03:00
const inicio = DESDE ? new Date(`${DESDE}T00:00:00-03:00`) : new Date(Date.now() - DIAS * 86_400_000);
const fim = new Date();

// ---------- conexão ----------

function dbUrl(): string {
    let url = process.env.POSTGRES_URL_NON_POOLING;
    if (!url) {
        try {
            for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
                const m = line.match(/^POSTGRES_URL_NON_POOLING=(.*)$/);
                if (m) url = m[1].trim().replace(/^"|"$/g, '');
            }
        } catch {
            // sem .env.local: cai no erro abaixo
        }
    }
    if (!url) {
        console.error('Faltou POSTGRES_URL_NON_POOLING no .env.local (rode `vercel env pull .env.local`).');
        process.exit(1);
    }
    // o pg trata sslmode=require como verificação completa; o Supabase usa certificado próprio
    return url.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
}

type Props = Record<string, unknown>;
interface Ev {
    created_at: Date;
    session: string;
    name: string;
    props: Props;
    app_version: string | null;
    device: string | null;
}

/** Uma sessão com o id do aparelho (0.9.53+): `session_start` com `did`, `first_day` e `day_n` (src/analytics/device-id.ts). */
export interface Visita {
    at: Date;
    session: string;
    did: string;
    first: string;
    n: number;
    legacy: boolean;
    props: Props;
}
export function visitaDe(e: Pick<Ev, 'created_at' | 'session' | 'props'>): Visita | null {
    const p = e.props;
    if (typeof p.did !== 'string' || typeof p.first_day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.first_day))
        return null;
    return {
        at: e.created_at,
        session: e.session,
        did: p.did,
        first: p.first_day,
        n: Number(p.day_n) || 0,
        legacy: p.legacy === true || p.legacy === 'true',
        props: p,
    };
}

async function load(): Promise<{ evs: Ev[]; starts: Map<string, Ev>; visitas: Visita[] }> {
    const client = new pg.Client({ connectionString: dbUrl(), ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
        const cols = 'created_at, session, name, props, app_version, device';
        const { rows } = await client.query<Ev>(
            `select ${cols} from public.game_events where created_at >= $1 and created_at <= $2 order by created_at`,
            [inicio, fim],
        );
        // sessões que começaram antes do período: busca o session_start delas (origem, aparelho, novo/voltando)
        const sessions = [...new Set(rows.map((r) => r.session))];
        const old = sessions.length
            ? (
                  await client.query<Ev>(
                      `select ${cols} from public.game_events where name = 'session_start' and session = any($1) and created_at < $2`,
                      [sessions, inicio],
                  )
              ).rows
            : [];
        const starts = new Map<string, Ev>();
        for (const e of [...old, ...rows])
            if (e.name === 'session_start' && !starts.has(e.session)) starts.set(e.session, e);
        // coortes: toda sessão com id de aparelho até o fim do período (são poucas: uma por aba)
        const { rows: comId } = await client.query<Ev>(
            `select created_at, session, props from public.game_events where name = 'session_start' and props ? 'did' and created_at <= $1 order by created_at`,
            [fim],
        );
        return { evs: rows, starts, visitas: comId.flatMap((e) => visitaDe(e) ?? []) };
    } finally {
        await client.end();
    }
}

// ---------- utilidades ----------

const NOMES = new Map<number, string>((pokemon as { id: number; name: string }[]).map((p) => [p.id, p.name]));
const FASES = ['Oitavas', 'Quartas', 'Semi', 'Final'];
const TATICAS: Record<string, string> = {
    balanced: 'equilibrada',
    offensive: 'ofensiva',
    defensive: 'defensiva',
    counter: 'contra-ataque',
};
const ALIAS: Record<string, string> = {
    t: 'x',
    twitter: 'x',
    lnkd: 'linkedin',
    youtu: 'youtube',
    fb: 'facebook',
    // apps do Android (o nome que sobra do id do app)
    googlequicksearchbox: 'google',
    gm: 'gmail',
    zhiliaoapp: 'tiktok',
    ss: 'tiktok',
    katana: 'facebook',
};
/** Começo de id de app do Android (o referrer `android-app://com.google.android.youtube/` vira esse "domínio"). */
const APP_ID = new Set(['com', 'org', 'net', 'br', 'io']);

/**
 * "old.reddit.com", "reddit.com" e utm_source=reddit viram o mesmo canal: "reddit". App do Android pelo nome do app:
 * `com.google.android.googlequicksearchbox` (o app do Google) é "google", `com.google.android.youtube` é "youtube".
 */
export function canal(ref: unknown): string {
    if (typeof ref !== 'string' || !ref) return 'direto';
    // endereço antigo e prévias (soccermon.vercel.app etc.)
    if (ref.toLowerCase().endsWith('vercel.app')) return 'vercel.app';
    const parts = ref.toLowerCase().split('.').filter(Boolean);
    if (parts.length >= 2 && APP_ID.has(parts[0])) {
        const app = parts[1] === 'google' && parts[2] === 'android' && parts[3] ? parts[3] : parts[1];
        return ALIAS[app] ?? app;
    }
    let name = parts[0];
    if (parts.length >= 2) {
        const sld = parts.at(-2) ?? '';
        // exemplo.com.br, exemplo.co.uk
        name = parts.length >= 3 && ['com', 'co', 'org', 'net', 'gov'].includes(sld) ? (parts.at(-3) ?? sld) : sld;
    }
    return ALIAS[name] ?? name;
}

const bool = (v: unknown) => v === true || v === 'true';
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const fmt = (n: number) => n.toLocaleString('pt-BR');
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '–');
const dec = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const bar = (a: number, b: number, w = 16) => '█'.repeat(b ? Math.round((a / b) * w) : 0);
const diaSP = (d: Date) =>
    d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
const dataHoraSP = (d: Date) =>
    d.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

function count<T>(items: T[], key: (t: T) => string): [string, number][] {
    const m = new Map<string, number>();
    for (const it of items) {
        const k = key(it);
        m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Percentil `p` (0 a 1) de uma lista, ou null vazia. */
const pctl = (xs: number[], p: number) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const addDias = (d: string, n: number) =>
    new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** Segunda-feira da semana de `d` (AAAA-MM-DD). */
export const segundaDe = (d: string) => addDias(d, -((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7));
const hojeSP = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

export interface Taxa {
    n: number;
    de: number;
    /** a janela ainda não fechou pra toda a coorte (o número ainda pode subir) */
    parcial: boolean;
}
export interface Coorte {
    semana: string;
    novos: number;
    d1: Taxa | null;
    d7: Taxa | null;
    d30: Taxa | null;
}

/**
 * Coortes semanais (pela segunda-feira do 1º dia do aparelho, sem os `legacy`): D1 = voltou no dia seguinte; D7 e D30
 * "na janela" = voltou em algum dia entre 7–13 e 30–36. Null enquanto nem o 1º dia da coorte chegou na janela.
 */
export function coortes(vs: Visita[], hoje: string): Coorte[] {
    const por = new Map<string, Map<string, Set<number>>>();
    for (const v of vs) {
        if (v.legacy) continue;
        const w = segundaDe(v.first);
        const devs = por.get(w) ?? new Map<string, Set<number>>();
        devs.set(v.did, (devs.get(v.did) ?? new Set()).add(v.n));
        por.set(w, devs);
    }
    return [...por]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([semana, devs]) => {
            const taxa = (lo: number, hi: number): Taxa | null =>
                addDias(semana, lo) > hoje
                    ? null
                    : {
                          n: [...devs.values()].filter((ns) => [...ns].some((x) => x >= lo && x <= hi)).length,
                          de: devs.size,
                          parcial: addDias(semana, 6 + hi) >= hoje,
                      };
            return { semana, novos: devs.size, d1: taxa(1, 1), d7: taxa(7, 13), d30: taxa(30, 36) };
        });
}

// ---------- saída (terminal ou Markdown) ----------

const out: string[] = [];
const bold = (s: string) => (MD ? `**${s}**` : process.stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s);
/** Linha de saída; nunca duas em branco seguidas. */
const line = (s = '') => {
    if (s || out.at(-1)) out.push(s);
};
const titulo = (s: string) => {
    line();
    line(MD ? `## ${s}` : bold(`== ${s} ==`));
};
const nota = (s: string) => {
    // no Markdown, sem a linha em branco a nota grudaria no item de lista anterior
    if (MD && out.at(-1)?.startsWith('- ')) line();
    line(MD ? `_${s}_` : `  ${s}`);
};
const item = (k: string, v: string) => line(MD ? `- **${k}:** ${v}` : `  ${k}: ${v}`);

/** Tabela compacta; colunas numéricas (que não começam com letra) alinham à direita no terminal. */
function tabela(head: string[], rows: (string | number)[][]) {
    if (!rows.length) {
        nota('(nada no período)');
        return;
    }
    const cells = rows.map((r) => r.map((c) => (typeof c === 'number' ? fmt(c) : c)));
    const right = head.map((_, i) => i > 0 && cells.every((r) => /^[\d–+\-.,%]/.test(r[i] ?? '') || !r[i]));
    if (MD) {
        line();
        line(`| ${head.join(' | ')} |`);
        line(`| ${head.map((_, i) => (right[i] ? '---:' : '---')).join(' | ')} |`);
        for (const r of cells) line(`| ${r.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`);
        line();
        return;
    }
    const w = head.map((h, i) => Math.max(h.length, ...cells.map((r) => (r[i] ?? '').length)));
    const fmtRow = (r: string[]) =>
        `  ${r.map((c, i) => (right[i] ? c.padStart(w[i]) : c.padEnd(w[i]))).join('  ')}`.trimEnd();
    line(fmtRow(head));
    line(`  ${w.map((n) => '─'.repeat(n)).join('  ')}`);
    for (const r of cells) line(fmtRow(r));
}

// ---------- relatório ----------

const RUN = new Set(['run_start', 'formation', 'pick', 'match_end', 'run_end', 'reward', 'run_abandon']);

function relatorio(all: Ev[], starts: Map<string, Ev>, todasVisitas: Visita[]) {
    const canalDe = (s: string) => canal(starts.get(s)?.props.ref);
    const alvo = CANAL ? canal(CANAL) : '';
    const evs = CANAL ? all.filter((e) => [alvo, CANAL].some((c) => canalDe(e.session).startsWith(c))) : all;
    const sessions = [...new Set(evs.map((e) => e.session))];
    const by = (name: string) => evs.filter((e) => e.name === name);

    line(MD ? `# Placar do Soccermon` : bold('PLACAR DO SOCCERMON'));
    const taxaTxt = (t: Taxa | null) => (!t ? '–' : `${pct(t.n, t.de)}${t.parcial ? '*' : ''}`);

    // 1. Período e versões
    titulo('1. Período');
    item('De', `${dataHoraSP(inicio)} a ${dataHoraSP(fim)} (horário de Brasília)`);
    if (CANAL) item('Canal', alvo);
    if (!evs.length) {
        line();
        nota(
            CANAL
                ? `Nenhum evento do canal "${alvo}" no período. Tente sem --canal ou com mais --dias.`
                : 'Nenhum evento no período. O jogo só grava estatísticas em soccermon.com (com Estatísticas ligadas).',
        );
        return;
    }
    item('Eventos', fmt(evs.length));
    const versoes = count(sessions, (s) => {
        const vs = evs.filter((e) => e.session === s && e.app_version).map((e) => e.app_version as string);
        return vs.at(-1) ?? '?';
    });
    item('Versões ativas', versoes.map(([v, n]) => `${v} (${pct(n, sessions.length)} das sessões)`).join(', '));
    const posPlacar = out.length;

    // 2. Gente
    titulo('2. Gente');
    const novas = sessions.filter((s) => starts.has(s) && !bool(starts.get(s)?.props.returning));
    const voltando = sessions.filter((s) => bool(starts.get(s)?.props.returning));
    const semStart = sessions.length - novas.length - voltando.length;
    const logins = by('login');
    item('Sessões', fmt(sessions.length));
    item(
        'Novas / voltando',
        `${fmt(novas.length)} (${pct(novas.length, sessions.length)}) / ${fmt(voltando.length)} (${pct(voltando.length, sessions.length)})` +
            (semStart ? ` · ${fmt(semStart)} sem início registrado` : ''),
    );
    item(
        'Logins',
        logins.length
            ? `${fmt(logins.length)} (${fmt(logins.filter((e) => bool(e.props.merged)).length)} levaram o progresso do aparelho para a conta)`
            : '0',
    );
    const aparelhos = count(
        sessions,
        (s) => str(starts.get(s)?.props.device) || str(evs.find((e) => e.session === s)?.device) || '?',
    );
    tabela(
        ['Aparelho', 'Sessões', '%'],
        aparelhos.map(([a, n]) => [a, n, pct(n, sessions.length)]),
    );

    // 2b. Pessoas: o id do aparelho (0.9.53+); sessões de antes ou com GPC/estatística desligada vão sem id
    const diaInicio = inicio.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const naJanela = (v: Visita) => v.at >= inicio && v.at <= fim;
    const visitas = todasVisitas.filter((v) => naJanela(v) && (!CANAL || evs.some((e) => e.session === v.session)));
    const didDe = new Map(visitas.map((v) => [v.session, v.did]));
    const dids = new Set(visitas.map((v) => v.did));
    const legacy = new Set(visitas.filter((v) => v.legacy).map((v) => v.did));
    const novosDids = new Set(visitas.filter((v) => !v.legacy && v.first >= diaInicio).map((v) => v.did));
    const recorrentes = [...dids].filter((d) => !legacy.has(d) && !novosDids.has(d));
    titulo('2b. Pessoas (por aparelho)');
    item(
        'Aparelhos',
        dids.size
            ? `${fmt(dids.size)} · ${fmt(novosDids.size)} novos · ${fmt(recorrentes.length)} recorrentes · ${fmt(legacy.size)} que já jogavam antes do id (fora das coortes)`
            : '0 (o id do aparelho chegou na 0.9.53)',
    );
    if (dids.size) {
        const semId = sessions.filter((s) => starts.has(s) && !didDe.has(s)).length;
        item(
            'Sessões por aparelho',
            `${dec(visitas.length / dids.size)} · ${fmt(semId)} sessões sem id (versão antiga, GPC ou sem armazenamento)`,
        );
        const diasPorDid = new Map<string, number>();
        for (const v of visitas) diasPorDid.set(v.did, Math.max(diasPorDid.get(v.did) ?? 0, num(v.props.days)));
        item(
            'Dias com jogo (média por aparelho, desde o 1º dia)',
            dec([...diasPorDid.values()].reduce((a, b) => a + b, 0) / dids.size),
        );
    }

    // 3. Funil (cada etapa conta quem chegou nela ou além, então nunca cresce)
    const nomesPorSessao = new Map<string, Set<string>>();
    for (const e of evs) {
        const set = nomesPorSessao.get(e.session) ?? new Set();
        set.add(e.name === 'run_end' && bool(e.props.champion) ? 'champion' : e.name);
        nomesPorSessao.set(e.session, set);
    }
    const etapa = (s: string): number => {
        const n = nomesPorSessao.get(s) ?? new Set();
        if (n.has('champion')) return 4;
        if (n.has('run_end')) return 3;
        if (n.has('match_end')) return 2;
        if ([...n].some((x) => RUN.has(x))) return 1;
        return 0;
    };
    // Desde a 0.9.2 não há tela de boas-vindas: "passou das boas-vindas" = "começou a copa", então a etapa saiu.
    const ETAPAS = ['Abriu o jogo', 'Começou a copa', 'Chegou ao apito da 1ª', 'Terminou a copa', 'Campeão'];
    const funil = (ss: string[]) => ETAPAS.map((_, i) => ss.filter((s) => etapa(s) >= i).length);
    // Fora do funil (o evento só guarda `lab` e a origem; user agent não é gravado): ?lab=, quem entrou pelo convite
    // do Duelo (1ª tela vista é a do Duelo) e o navegador de dentro do TikTok/Instagram (origem tiktok/instagram).
    const primeiraTela = (s: string) => str(evs.find((e) => e.session === s && e.name === 'screen')?.props.screen);
    const grupo = (s: string): string => {
        if (starts.get(s)?.props.lab) return 'lab';
        if (/^duel/.test(primeiraTela(s)) || starts.get(s)?.props.entry === 'duelo') return 'convite do Duelo';
        if (
            ['tiktok', 'instagram'].includes(canalDe(s)) ||
            ['tiktok', 'instagram'].includes(str(starts.get(s)?.props.inapp))
        )
            return 'TikTok/Instagram';
        return '';
    };
    const foraDoFunil = sessions.filter((s) => grupo(s) && novas.includes(s));
    // Critério (documentado no título do funil): tira maratona e versão antiga, que distorcem as taxas.
    const recentes = versoesRecentes(evs.flatMap((e) => (e.app_version ? [e.app_version] : [])));
    const versaoDe = (s: string) =>
        evs.filter((e) => e.session === s && e.app_version).at(-1)?.app_version ?? undefined;
    const maratona = (s: string) => ehMaratona(by('run_start').filter((e) => e.session === s).length);
    const foraCriterio = (s: string) => maratona(s) || ehVersaoAntiga(versaoDe(s), recentes);
    const dentro = sessions.filter((s) => !grupo(s) && !foraCriterio(s));
    const foraTodas = sessions.filter((s) => grupo(s)).length;
    const foraCrit = sessions.filter((s) => !grupo(s) && foraCriterio(s)).length;
    const fTodas = funil(dentro);
    const fNovas = funil(dentro.filter((s) => novas.includes(s)));
    titulo('3. Funil por sessão (sem lab, convite do Duelo e TikTok/Instagram)');
    nota(
        `Critério: fora ${fmt(foraCrit)} sessões de maratona (mais de ${MAX_COPAS} copas) ou de versão antiga (fora das ${VERSOES_RECENTES} mais novas: ${[...recentes].join(', ')}). "Chegou ao apito da 1ª" é o evento match_end, não "jogou".`,
    );
    tabela(
        ['Etapa', 'Sessões', '% do total', 'Queda', '', 'Novas', '% novas'],
        ETAPAS.map((nome, i) => [
            nome,
            fTodas[i],
            pct(fTodas[i], fTodas[0]),
            !i ? '' : fTodas[i - 1] === fTodas[i] ? '0%' : `-${pct(fTodas[i - 1] - fTodas[i], fTodas[i - 1])}`,
            bar(fTodas[i], fTodas[0]),
            fNovas[i],
            pct(fNovas[i], fNovas[0]),
        ]),
    );
    nota(`Fora do funil: ${fmt(foraTodas)} sessões (novas e voltando); a tabela de baixo mostra as novas.`);
    nota('"Começou a copa" inclui quem retomou uma copa (sessão voltando); a coluna Novas é a 1ª copa de verdade.');
    line();
    line(MD ? '**Funil por aparelho (só sessões novas)**' : '  Funil por aparelho (só sessões novas)');
    const tipo = (s: string) => {
        const d = str(starts.get(s)?.props.device) || str(evs.find((e) => e.session === s)?.device);
        return d.startsWith('mobile') ? 'celular' : d || '?';
    };
    const funilDe = (ss: string[]) => {
        const f = funil(ss);
        return [f[0], f[1], pct(f[1], f[0]), f[2], pct(f[2], f[1]), pct(f[2], f[0])];
    };
    const novasDentro = dentro.filter((s) => novas.includes(s));
    const FH = [
        'Sessões novas',
        'Começou a copa',
        'Abriu → começou',
        'Chegou ao apito da 1ª',
        'Começou → jogou',
        'Abriu → jogou',
    ];
    tabela(
        ['Aparelho', ...FH],
        count(novasDentro, tipo).map(([a]) => [a, ...funilDe(novasDentro.filter((s) => tipo(s) === a))]),
    );
    // Sem nenhum toque: só o session_start (e o balão que aparece sozinho). Robô que roda JavaScript e quem fecha a aba
    // sem clicar em nada ficam aqui; o tempo na página não dá pra medir (os eventos chegam em lote, created_at é do lote).
    const PASSIVO = new Set(['session_start', 'coach_shown', 'error']);
    const semToque = (s: string) => [...(nomesPorSessao.get(s) ?? [])].every((n) => PASSIVO.has(n));
    line();
    line(MD ? '**Sessões novas por aparelho: toque e origem**' : '  Sessões novas por aparelho: toque e origem');
    tabela(
        ['Aparelho', 'Novas', 'Sem nenhum toque', 'Tocou → começou', 'Origens (novas)'],
        count(novasDentro, tipo).map(([a]) => {
            const ss = novasDentro.filter((s) => tipo(s) === a);
            const tocou = ss.filter((s) => !semToque(s));
            return [
                a,
                ss.length,
                `${ss.length - tocou.length} (${pct(ss.length - tocou.length, ss.length)})`,
                `${tocou.filter((s) => etapa(s) >= 1).length}/${tocou.length}`,
                count(ss, canalDe)
                    .slice(0, 4)
                    .map(([c, n]) => `${c} ${n}`)
                    .join(' · '),
            ];
        }),
    );
    line();
    line(MD ? '**Fora do funil (só sessões novas)**' : '  Fora do funil (só sessões novas)');
    tabela(
        ['Grupo', ...FH],
        count(foraDoFunil, grupo).map(([g]) => [g, ...funilDe(foraDoFunil.filter((s) => grupo(s) === g))]),
    );
    // maior vazamento: pelas novas se tiver gente suficiente (é quem mostra a primeira impressão)
    const base = fNovas[0] >= 5 ? fNovas : fTodas;
    let vaz = { i: 0, perda: 0, pessoas: 0 };
    for (let i = 1; i < base.length; i++) {
        const perda = base[i - 1] ? (base[i - 1] - base[i]) / base[i - 1] : 0;
        // campeão depende de ganhar, não de interface: fica fora do "vazamento"
        if (i < 4 && perda > vaz.perda) vaz = { i, perda, pessoas: base[i - 1] - base[i] };
    }
    if (vaz.i) {
        if (MD) line();
        line(
            `${MD ? '' : '  '}${bold('Maior vazamento')}: ${ETAPAS[vaz.i - 1]} → ${ETAPAS[vaz.i]} (perde ${Math.round(vaz.perda * 100)}%, ${fmt(vaz.pessoas)} sessões${base === fNovas ? ' novas' : ''})`,
        );
    }
    // "Monta pra mim" (0.8.7): de quem começou copa, quantos usaram o atalho e quantos jogaram partida em cada grupo
    const comAuto = new Set(
        by('pick')
            .filter((e) => bool(e.props.auto))
            .map((e) => e.session),
    );
    if (comAuto.size) {
        const comecou = dentro.filter((s) => etapa(s) >= 1);
        const jogou = (ss: string[]) => pct(ss.filter((s) => etapa(s) >= 2).length, ss.length);
        const usou = comecou.filter((s) => comAuto.has(s));
        const naMao = comecou.filter((s) => !comAuto.has(s));
        line(
            `${MD ? '' : '  '}${bold('Monta pra mim')}: ${fmt(usou.length)} de ${fmt(comecou.length)} sessões que começaram copa (${jogou(usou)} jogaram partida; na mão: ${jogou(naMao)})`,
        );
    }

    // 0.9.24: convite do Duelo medido pelo Duelo (duel_join/duel_match_end), não pela copa
    const temEv = (nome: string) => new Set(by(nome).map((e) => e.session));
    const convite = foraDoFunil.filter((s) => grupo(s) === 'convite do Duelo');
    if (convite.length && by('duel_join').length) {
        const [entrou, terminou] = [temEv('duel_join'), temEv('duel_match_end')];
        line(
            `${MD ? '' : '  '}${bold('Convite do Duelo')}: ${fmt(convite.length)} sessões novas, ${fmt(convite.filter((s) => entrou.has(s)).length)} entraram na sala, ${fmt(convite.filter((s) => terminou.has(s)).length)} terminaram um jogo`,
        );
    }
    // 0.9.24: quem toca em "Pular pro fim" (base pra decidir o ritmo da 1ª partida)
    const pulos = by('match_skip');
    if (pulos.length) {
        const na1a = pulos.filter((e) => bool(e.props.first_cup));
        line(
            `${MD ? '' : '  '}${bold('Pular pro fim')}: ${fmt(pulos.length)} toques em ${fmt(new Set(pulos.map((e) => e.session)).size)} sessões (${fmt(na1a.length)} na 1ª copa, ${fmt(na1a.filter((e) => Number(e.props.stage) === 0).length)} na 1ª partida dela)`,
        );
    }

    // first_leave: onde largou quem saiu antes do apito da 1ª partida (tela/passo da copa). Trocar de aba e voltar
    // também manda o evento: conta só sessões sem match_end, e o último passo de cada uma.
    const jogou = new Set(by('match_end').map((e) => e.session));
    const largou = [
        ...new Map(
            by('first_leave')
                .filter((e) => !jogou.has(e.session))
                .map((e) => [e.session, e]),
        ).values(),
    ];
    if (largou.length) {
        const passo = (e: (typeof largou)[number]) =>
            [str(e.props.screen), str(e.props.status)].filter(Boolean).join('/') || '?';
        line(
            `${MD ? '' : '  '}${bold('Saiu antes da 1ª partida')}: ${fmt(new Set(largou.map((e) => e.session)).size)} sessões · ${count(
                largou,
                passo,
            )
                .slice(0, 6)
                .map(([p, n]) => `${p} ${n}`)
                .join(' · ')}`,
        );
    }

    // 3b. Contexto (0.9.53+): idioma, fuso, navegador de dentro do app, porta de entrada e PWA, com o funil de cada um
    const comCampo = sessions.filter((s) => starts.get(s)?.props.lang !== undefined);
    if (comCampo.length) {
        titulo('3b. Contexto (sessões)');
        const recorte = (nome: string, key: (p: Props) => string, max = 8) => {
            line();
            line(MD ? `**${nome}**` : `  ${nome}`);
            const de = (s: string) => key(starts.get(s)?.props ?? {}) || '?';
            tabela(
                [nome, 'Sessões', 'Novas', 'Começa copa', 'Chega ao apito'],
                count(comCampo, de)
                    .slice(0, max)
                    .map(([k]) => {
                        const ss = comCampo.filter((s) => de(s) === k);
                        const f = funil(ss);
                        return [
                            k,
                            ss.length,
                            ss.filter((s) => novas.includes(s)).length,
                            pct(f[1], f[0]),
                            pct(f[2], f[0]),
                        ];
                    }),
            );
        };
        recorte('Idioma do navegador', (p) => str(p.lang));
        recorte('Idioma do jogo', (p) => str(p.ui_lang));
        recorte('Fuso', (p) => str(p.tz));
        recorte('Dentro do app', (p) => str(p.inapp) || 'não');
        recorte('Porta de entrada', (p) => str(p.entry));
        recorte('Instalado (PWA)', (p) => (bool(p.pwa) ? 'sim' : 'não'));
    }

    // 4. Canais
    titulo('4. Canais');
    const porCanal = new Map<string, string[]>();
    for (const s of sessions) {
        const c = canalDe(s);
        porCanal.set(c, [...(porCanal.get(c) ?? []), s]);
    }
    const canais = [...porCanal].sort((a, b) => b[1].length - a[1].length);
    tabela(
        ['Canal', 'Sessões', '% sessões', 'Novas', 'Começa copa', 'Termina copa'],
        canais.map(([c, ss]) => {
            const f = funil(ss);
            return [
                c,
                ss.length,
                pct(ss.length, sessions.length),
                ss.filter((s) => novas.includes(s)).length,
                pct(f[1], f[0]),
                pct(f[3], f[0]),
            ];
        }),
    );
    nota('Canal = utm_source do link ou o site de onde a pessoa veio; "direto" quando não há origem.');

    // 5. Jogo
    titulo('5. Jogo');
    const partidas = by('match_end');
    const copas = by('run_start').length;
    const fins = by('run_end');
    const titulos = fins.filter((e) => bool(e.props.champion));
    const gols = partidas.reduce((s, e) => s + num(e.props.gf) + num(e.props.ga), 0);
    const penaltis = partidas.filter((e) => bool(e.props.shootout)).length;
    item(
        'Copas',
        `${fmt(copas)} iniciadas · ${fmt(fins.length)} terminadas · ${fmt(titulos.length)} títulos (${fmt(titulos.filter((e) => bool(e.props.perfect)).length)} perfeitos)`,
    );
    item(
        'Partidas',
        `${fmt(partidas.length)} · ${partidas.length ? dec(gols / partidas.length) : '–'} gols/jogo · ${fmt(penaltis)} nos pênaltis (${pct(penaltis, partidas.length)})`,
    );
    const abandonos = by('run_abandon');
    item(
        'Copas abandonadas',
        abandonos.length
            ? `${fmt(abandonos.length)} (${count(abandonos, (e) => FASES[num(e.props.stage)] ?? '?')
                  .map(([f, n]) => `${f} ${n}`)
                  .join(', ')})`
            : '0',
    );
    const rewards = by('reward');
    if (rewards.length)
        item(
            'Recompensas',
            `${fmt(rewards.length)} (${pct(rewards.filter((e) => bool(e.props.skipped)).length, rewards.length)} puladas)`,
        );
    // Rota (desde a 0.9.44): quanto se pula em cada tela e o que a etiqueta do Pular deu
    const rota = rewards.filter((e) => str(e.props.screen));
    if (rota.length) {
        const pulou = (k: string) => rota.filter((e) => str(e.props.screen) === k && bool(e.props.skipped)).length;
        item(
            'Rota: puladas por tela',
            count(rota, (e) => str(e.props.screen))
                .map(([k, n]) => `${k} ${pct(pulou(k), n)}`)
                .join(' · '),
        );
        const tags = rota.filter((e) => str(e.props.tag));
        if (tags.length)
            item(
                'Rota: etiquetas do Pular',
                count(tags, (e) => str(e.props.tag))
                    .map(([k, n]) => `${k} ${n}`)
                    .join(' · '),
            );
    }
    // Rota (desde a 0.9.45): a casa escolhida no mapa (o `screen` que sai do mapa leva `casa` e `linha`)
    const casas = by('screen').filter((e) => str(e.props.casa));
    if (casas.length)
        item(
            'Rota: casas escolhidas',
            count(casas, (e) => str(e.props.casa))
                .map(([k, n]) => `${k} ${n}`)
                .join(' · '),
        );
    tabela(
        ['Fase', 'Partidas', '% vitória', 'Gols/jogo', 'Pênaltis'],
        FASES.map((f, i) => {
            const ps = partidas.filter((e) => num(e.props.stage) === i);
            const g = ps.reduce((s, e) => s + num(e.props.gf) + num(e.props.ga), 0);
            return [
                f,
                ps.length,
                pct(ps.filter((e) => bool(e.props.won)).length, ps.length),
                ps.length ? dec(g / ps.length) : '–',
                ps.filter((e) => bool(e.props.shootout)).length,
            ];
        }).filter((r) => r[1] !== 0),
    );
    const listaCurta = (pares: [string, number][], total: number, max = 6) =>
        pares.length
            ? pares
                  .slice(0, max)
                  .map(([k, n]) => `${k} ${pct(n, total)}`)
                  .join(' · ')
            : '–';
    item(
        'Velocidade',
        listaCurta(
            count(partidas, (e) => `${str(e.props.speed) || '?'}x`),
            partidas.length,
        ),
    );
    const forms = by('formation');
    item(
        'Formações (copas)',
        listaCurta(
            count(forms, (e) => str(e.props.formation) || '?'),
            forms.length,
        ),
    );
    item(
        'Táticas (partidas)',
        listaCurta(
            count(partidas, (e) => TATICAS[str(e.props.tactic)] ?? (str(e.props.tactic) || '?')),
            partidas.length,
        ),
    );

    const picks = by('pick');
    const nome = (e: Ev) => NOMES.get(num(e.props.species)) ?? `#${str(e.props.species)}`;
    line();
    line(MD ? '**Pokémon mais escolhidos**' : '  Pokémon mais escolhidos');
    tabela(
        ['#', 'Pokémon', 'Escolhas', '% picks'],
        count(picks, nome)
            .slice(0, 10)
            .map(([p, n], i) => [`${i + 1}`, p, n, pct(n, picks.length)]),
    );
    const caps = picks.filter((e) => bool(e.props.captain));
    item('Capitães', listaCurta(count(caps, nome), caps.length, 5));
    const especiais = picks.filter((e) => e.props.special);
    if (especiais.length)
        item(
            'Edições especiais escolhidas',
            listaCurta(
                count(especiais, (e) => str(e.props.special)),
                especiais.length,
            ),
        );

    const telas = by('screen');
    line();
    line(MD ? '**Telas mais abertas**' : '  Telas mais abertas');
    tabela(
        ['Tela', 'Visitas', 'Sessões'],
        count(telas, (e) => str(e.props.screen) || '?')
            .slice(0, 8)
            .map(([t, n]) => [
                t,
                n,
                new Set(telas.filter((e) => str(e.props.screen) === t).map((e) => e.session)).size,
            ]),
    );
    const settings = by('setting');
    item(
        'Configurações trocadas',
        settings.length
            ? count(settings, (e) => `${str(e.props.key)}=${str(e.props.value)}`)
                  .slice(0, 8)
                  .map(([k, n]) => `${k} (${n})`)
                  .join(' · ')
            : '0',
    );
    const cores = by('club_color');
    if (cores.length) item('Cor do clube trocada', `${fmt(cores.length)}x`);

    // Mercado (0.9.0): o que se compra, Patrocínios e se quem patrocina ganha mais
    const compras = by('shop_buy');
    const saidas = by('shop_leave');
    if (saidas.length) {
        line();
        line(MD ? '**Mercado**' : '  Mercado');
        item(
            'Visitas ao Mercado',
            `${fmt(saidas.length)} (${pct(saidas.filter((e) => num(e.props.bought) === 0).length, saidas.length)} sem comprar)`,
        );
        item(
            'Compras por tipo',
            listaCurta(
                count(compras, (e) => str(e.props.kind)),
                compras.length,
            ),
        );
        const pats = compras.filter((e) => e.props.kind === 'sponsor');
        if (pats.length)
            item(
                'Patrocínios',
                listaCurta(
                    count(pats, (e) => str(e.props.what)),
                    pats.length,
                    12,
                ),
            );
        const guardado = saidas.reduce((a, e) => a + num(e.props.money), 0) / saidas.length;
        item('₽ guardado ao sair (média)', guardado.toFixed(1));
        const fins = by('run_end');
        const com = fins.filter((e) => e.props.sponsors);
        const sem = fins.filter((e) => !e.props.sponsors);
        const tit = (l: Ev[]) => pct(l.filter((e) => bool(e.props.champion)).length, l.length);
        item('Título com / sem Patrocínio', `${tit(com)} (${com.length}) / ${tit(sem)} (${sem.length})`);
    }

    // 6. Erros
    titulo('6. Erros');
    const erros = by('error');
    item(
        'Total',
        erros.length
            ? `${fmt(erros.length)} em ${fmt(new Set(erros.map((e) => e.session)).size)} sessões (${fmt(new Set(erros.map((e) => str(e.props.msg))).size)} mensagens diferentes)`
            : '0',
    );
    // agrupados por tipo, tela e mensagem sem números (desde a 0.9.53: kind, type, screen e at)
    const grupoErro = (e: Ev) =>
        [str(e.props.kind) || '?', str(e.props.screen) || '?', str(e.props.msg).replace(/\d+/g, '#').slice(0, 90)].join(
            '|',
        );
    const grupos = new Map<string, Ev[]>();
    for (const e of erros) grupos.set(grupoErro(e), [...(grupos.get(grupoErro(e)) ?? []), e]);
    tabela(
        ['Vezes', 'Sessões', 'Aparelhos', 'Tipo', 'Tela', 'Versões', 'Última', 'Mensagem (e onde)'],
        [...grupos.values()]
            .sort(
                (a, b) =>
                    new Set(b.map((e) => e.session)).size - new Set(a.map((e) => e.session)).size ||
                    b.length - a.length,
            )
            .slice(0, 12)
            .map((es) => {
                const e = es.at(-1) as Ev;
                return [
                    es.length,
                    new Set(es.map((x) => x.session)).size,
                    new Set(es.flatMap((x) => didDe.get(x.session) ?? [])).size,
                    [str(e.props.kind), str(e.props.type)].filter(Boolean).join(' ') || '?',
                    str(e.props.screen) || '?',
                    [...new Set(es.map((x) => x.app_version ?? '?'))].slice(-3).join(', '),
                    dataHoraSP(e.created_at),
                    `${str(e.props.msg).slice(0, 80)}${e.props.at ? ` @ ${str(e.props.at).split(' ')[0]}` : ''}`,
                ];
            }),
    );

    // 6b. Desempenho: fps da partida (fora do motor, src/game/quality.ts) e o tempo até o jogo ficar pronto
    const comFps = partidas.filter((e) => e.props.fps !== undefined);
    const comLoad = sessions.flatMap((s) => {
        const p = starts.get(s)?.props;
        return p?.load_ms !== undefined ? [{ s, ms: num(p.load_ms) }] : [];
    });
    if (comFps.length || comLoad.length) {
        titulo('6b. Desempenho');
        const tipoEv = (e: Ev) => (str(e.device).startsWith('mobile') ? 'celular' : str(e.device) || '?');
        const minDe = (e: Ev) => (e.props.fps_min != null ? num(e.props.fps_min) : num(e.props.fps_p10));
        tabela(
            [
                'Aparelho',
                'Partidas',
                'fps médio',
                'fps p10',
                'fps mínimo',
                'Mínimo < 30',
                'Carregar p50',
                'Carregar p75',
            ],
            count([...comFps.map(tipoEv), ...comLoad.map(({ s }) => tipo(s))], (t) => t).map(([t]) => {
                const ps = comFps.filter((e) => tipoEv(e) === t);
                const ms = comLoad.filter(({ s }) => tipo(s) === t).map((x) => x.ms);
                const md = (xs: number[]) => pctl(xs, 0.5)?.toString() ?? '–';
                const sec = (v: number | null) => (v === null ? '–' : `${dec(v / 1000)} s`);
                return [
                    t,
                    ps.length,
                    md(ps.map((e) => num(e.props.fps))),
                    md(ps.map((e) => num(e.props.fps_p10))),
                    md(ps.map(minDe)),
                    pct(ps.filter((e) => minDe(e) < 30).length, ps.length),
                    sec(pctl(ms, 0.5)),
                    sec(pctl(ms, 0.75)),
                ];
            }),
        );
        nota(
            'fps: mediana das partidas. Mínimo = pior janela de 1 s (antes da 0.9.53, o p10). Carregar = da página até o save pronto.',
        );
    }

    // 7. Retenção
    titulo('7. Retenção');
    const dias = new Map<
        string,
        { s: Set<string>; novas: number; voltando: number; dids: Set<string>; nov: Set<string> }
    >();
    for (const e of evs) {
        const d = diaSP(e.created_at);
        const r = dias.get(d) ?? { s: new Set(), novas: 0, voltando: 0, dids: new Set(), nov: new Set() };
        if (!r.s.has(e.session)) {
            r.s.add(e.session);
            if (novas.includes(e.session)) r.novas++;
            if (voltando.includes(e.session)) r.voltando++;
        }
        dias.set(d, r);
    }
    for (const v of visitas) {
        const r = dias.get(diaSP(v.at));
        r?.dids.add(v.did);
        if (r && !v.legacy && v.n === 0) r.nov.add(v.did);
    }
    tabela(
        ['Dia', 'Sessões', 'Novas', 'Voltando', '% voltando', 'Aparelhos', 'Aparelhos novos'],
        [...dias].map(([d, r]) => [
            d,
            r.s.size,
            r.novas,
            r.voltando,
            pct(r.voltando, r.s.size),
            r.dids.size,
            r.nov.size,
        ]),
    );
    nota('"Novas/Voltando" é por aba (o aparelho já tinha save); "Aparelhos" conta o id do aparelho (0.9.53+).');
    line();
    line(
        MD
            ? '**Coortes semanais (aparelhos novos, pela semana do 1º dia)**'
            : '  Coortes semanais (aparelhos novos, pela semana do 1º dia)',
    );
    const hoje = hojeSP();
    tabela(
        ['Semana de', 'Novos', 'D1', 'D7 (7–13)', 'D30 (30–36)'],
        coortes(todasVisitas, hoje).map((c) => [
            c.semana.slice(5).split('-').reverse().join('/'),
            c.novos,
            taxaTxt(c.d1),
            taxaTxt(c.d7),
            taxaTxt(c.d30),
        ]),
    );
    nota(
        '* = a janela ainda não fechou pra coorte inteira (o número ainda pode subir). Coorte = aparelhos sem save de antes do id.',
    );

    // Placar de segunda (metricas-observabilidade.md, §7): 10 linhas com meta
    const iniPlacar = out.length;
    {
        const sessDe = new Map<string, string[]>();
        for (const v of visitas) sessDe.set(v.did, [...(sessDe.get(v.did) ?? []), v.session]);
        // antes do id do aparelho (até a 0.9.52) as linhas 1, 3, 4 e 9 caem nas sessões novas, marcadas "(sessões)"
        const porSessao = !dids.size;
        const etapaDid = porSessao ? etapa : (d: string) => Math.max(0, ...(sessDe.get(d) ?? []).map(etapa));
        const primeira = (d: string): Props =>
            porSessao ? (starts.get(d)?.props ?? {}) : (visitas.find((v) => v.did === d)?.props ?? {});
        const novosL = porSessao ? novas : [...novosDids];
        const sufixo = porSessao ? ' (sessões)' : '';
        const ini7 = new Date(inicio.getTime() - (fim.getTime() - inicio.getTime()));
        const antes = new Set(todasVisitas.filter((v) => v.at >= ini7 && v.at < inicio).map((v) => v.did));
        const cs = coortes(todasVisitas, hoje);
        const coorte = (dias: number) => cs.find((c) => c.semana === segundaDe(addDias(hoje, -dias)));
        const c1 = coorte(7)?.d1 ?? null;
        const c7 = coorte(14)?.d7 ?? null;
        const comecou = novosL.filter((d) => etapaDid(d) >= 1).length;
        const jogou = novosL.filter((d) => etapaDid(d) >= 2).length;
        const convidados = novosL.filter((d) =>
            porSessao ? grupo(d) === 'convite do Duelo' : str(primeira(d).entry) === 'duelo',
        );
        const conhecida = novosL.filter((d) => {
            const p = primeira(d);
            return canal(p.ref) !== 'direto' || !!p.inapp || (!!p.entry && p.entry !== 'home');
        });
        const fins = by('run_end').length;
        const shares = by('share').length;
        const comErro = new Set(by('error').map((e) => e.session)).size;
        const fpsCel = pctl(
            partidas
                .filter((e) => str(e.device).startsWith('mobile') && e.props.fps !== undefined)
                .map((e) => (e.props.fps_min != null ? num(e.props.fps_min) : num(e.props.fps_p10))),
            0.5,
        );
        const load75 = pctl(
            sessions.flatMap((s) =>
                starts.get(s)?.props.load_ms !== undefined ? [num(starts.get(s)?.props.load_ms)] : [],
            ),
            0.75,
        );
        const r = (a: number, b: number) => (b ? a / b : null);
        const st = (v: number | null, ok: boolean) => (v === null ? 'sem dado' : ok ? 'ok' : 'abaixo');
        const errMil = sessions.length ? (comErro / sessions.length) * 1000 : null;
        const tx = (t: Taxa | null) => (t ? r(t.n, t.de) : null);
        const linhas: [string, string, string, string][] = [
            [
                'Pessoas novas na semana (aparelhos)',
                fmt(novosL.length) + sufixo,
                '100',
                st(novosL.length, novosL.length >= 100),
            ],
            [
                'Pessoas ativas na semana (WAU)',
                `${fmt(dids.size)}${antes.size ? ` (antes ${fmt(antes.size)}, ${dids.size >= antes.size ? '+' : ''}${pct(dids.size - antes.size, antes.size)})` : ''}`,
                '+10%/semana',
                st(antes.size ? dids.size : null, dids.size >= antes.size * 1.1),
            ],
            [
                '% de novos que começam copa',
                pct(comecou, novosL.length) + sufixo,
                '65%',
                st(r(comecou, novosL.length), (r(comecou, novosL.length) ?? 0) >= 0.65),
            ],
            [
                '% de novos que chegam ao apito da 1ª',
                pct(jogou, novosL.length) + sufixo,
                '45%',
                st(r(jogou, novosL.length), (r(jogou, novosL.length) ?? 0) >= 0.45),
            ],
            [
                `D1 da coorte de ${segundaDe(addDias(hoje, -7)).slice(5).split('-').reverse().join('/')}`,
                taxaTxt(c1),
                '25%',
                st(tx(c1), (tx(c1) ?? 0) >= 0.25),
            ],
            [
                `D7 da coorte de ${segundaDe(addDias(hoje, -14)).slice(5).split('-').reverse().join('/')}`,
                taxaTxt(c7),
                '10%',
                st(tx(c7), (tx(c7) ?? 0) >= 0.1),
            ],
            [
                'Compartilhamentos a cada 100 copas terminadas',
                fins ? dec((shares / fins) * 100) : '–',
                '5',
                st(fins ? shares : null, (shares / Math.max(1, fins)) * 100 >= 5),
            ],
            [
                '% de convidados do Duelo que começam copa',
                `${pct(convidados.filter((d) => etapaDid(d) >= 1).length, convidados.length)} (${fmt(convidados.length)})`,
                '25%',
                st(
                    convidados.length || null,
                    (r(convidados.filter((d) => etapaDid(d) >= 1).length, convidados.length) ?? 0) >= 0.25,
                ),
            ],
            [
                '% de novos com origem conhecida',
                pct(conhecida.length, novosL.length) + sufixo,
                '70%',
                st(r(conhecida.length, novosL.length), (r(conhecida.length, novosL.length) ?? 0) >= 0.7),
            ],
            [
                'Saúde: sessões com erro a cada 1.000 · fps mínimo no celular · carregar p75',
                `${errMil === null ? '–' : dec(errMil)} · ${fpsCel ?? '–'} · ${load75 === null ? '–' : `${dec(load75 / 1000)} s`}`,
                '< 5 · ≥ 30 · < 3 s',
                st(
                    errMil,
                    (errMil ?? 0) < 5 && (fpsCel === null || fpsCel >= 30) && (load75 === null || load75 < 3000),
                ),
            ],
        ];
        titulo('Placar de segunda');
        tabela(
            ['#', 'Métrica', 'Semana', 'Meta', 'Status'],
            linhas.map((l, i) => [`${i + 1}`, ...l]),
        );
        nota(
            'Semana = o período acima. Metas da proposta de 16/11 (revisar depois de 2 semanas de dado). Search Console: no painel do Google.',
        );
    }
    const placar = out.splice(iniPlacar);
    if (PLACAR) {
        // só o placar: o título e o período, e as 10 linhas
        out.splice(posPlacar);
        out.push(...placar);
        return;
    }
    if (MD) out.splice(posPlacar, 0, ...placar);

    // 8. Foco da semana
    titulo('8. Foco da semana');
    // vercel.app é o endereço antigo (e as prévias), não um canal de divulgação
    const melhor = canais
        .filter(([c, ss]) => ss.length >= 5 && c !== 'vercel.app' && c !== 'vercel')
        .map(([c, ss]) => ({ c, n: ss.length, conv: funil(ss)[1] / ss.length }))
        .sort((a, b) => b.conv - a.conv)[0];
    const foco =
        vaz.i && vaz.perda >= 0.4
            ? `tapar o vazamento "${ETAPAS[vaz.i - 1]} → ${ETAPAS[vaz.i]}" (perde ${Math.round(vaz.perda * 100)}%)` +
              (melhor && !CANAL
                  ? `; canal que mais converte: ${melhor.c} (${Math.round(melhor.conv * 100)}% começam copa)`
                  : '')
            : melhor && !CANAL
              ? `investir em ${melhor.c}: ${Math.round(melhor.conv * 100)}% das ${melhor.n} sessões começam copa`
              : vaz.i
                ? `funil saudável; a maior queda é "${ETAPAS[vaz.i - 1]} → ${ETAPAS[vaz.i]}" (${Math.round(vaz.perda * 100)}%)`
                : 'pouco dado ainda: divulgar e esperar mais sessões';
    line(MD ? `> ${foco}` : `  → ${foco}`);
}

/** % dos times campeões (desde sempre) com cada espécie no elenco. Vai como JSON estático, sem API nova. */
async function raridade() {
    const client = new pg.Client({ connectionString: dbUrl(), ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
        const { rows } = await client.query<{ props: Props }>(
            `select props from public.game_events where name = 'run_end' and props->>'champion' = 'true' and props ? 'squad'`,
        );
        const count = new Map<string, number>();
        for (const r of rows)
            for (const id of new Set(
                String(r.props.squad ?? '')
                    .split(',')
                    .filter(Boolean),
            ))
                count.set(id, (count.get(id) ?? 0) + 1);
        const species = Object.fromEntries(
            [...count].map(([id, n]) => [id, Math.round((n / Math.max(1, rows.length)) * 1000) / 10]),
        );
        writeFileSync('public/data/raridade.json', `${JSON.stringify({ champions: rows.length, species })}\n`);
        console.log(`public/data/raridade.json: ${rows.length} times campeões, ${count.size} espécies`);
    } finally {
        await client.end();
    }
}

// importado pelo teste, não roda
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    if (args.includes('--raridade')) await raridade();
    else {
        const { evs, starts, visitas } = await load();
        relatorio(evs, starts, visitas);
        console.log(out.join('\n'));
    }
}
