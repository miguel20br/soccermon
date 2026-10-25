/**
 * Onde a sessão NOVA some entre "Começou a copa" e "Jogou a 1ª partida" (só leitura de public.game_events).
 * Uso: npx tsx scripts/funil-draft.ts [--desde 2026-10-24] [--json]
 * Conexão: POSTGRES_URL_NON_POOLING do .env.local (nunca impresso). Tempo: o created_at é a hora do lote
 * (a cada 8 s), então durações têm ~8 s de erro.
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';

const a = process.argv.slice(2);
const DESDE = a[a.indexOf('--desde') + 1]?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '2026-10-24';
let url = process.env.POSTGRES_URL_NON_POOLING ?? '';
if (!url)
    for (const l of readFileSync(process.env.ENV_LOCAL ?? '.env.local', 'utf8').split(/\r?\n/)) {
        const m = l.match(/^POSTGRES_URL_NON_POOLING=(.*)$/);
        if (m) url = m[1].trim().replace(/^"|"$/g, '');
    }
url = url.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');

interface Ev {
    created_at: Date;
    session: string;
    name: string;
    props: Record<string, unknown>;
    device: string | null;
    app_version: string | null;
}
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const { rows } = await c.query<Ev>(
    'select created_at, session, name, props, device, app_version from public.game_events where created_at >= $1 order by created_at, id',
    [new Date(`${DESDE}T00:00:00-03:00`)],
);
await c.end();

const by = new Map<string, Ev[]>();
for (const e of rows) (by.get(e.session) ?? by.set(e.session, []).get(e.session)!).push(e);

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '-');
const med = (xs: number[]) => (xs.length ? [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)] : NaN);
const tipo = (d: string) => (d?.startsWith('mobile') ? 'celular' : d || '?');

const novas: { s: string; dev: string; evs: Ev[] }[] = [];
for (const [s, evs] of by) {
    const st = evs.find((e) => e.name === 'session_start');
    if (!st || st.props.returning === true || st.props.lab) continue;
    // maratona automática/teste (dezenas de copas na mesma sessão, ex.: 70 copas em 42 min no 0.9.13): não é entrada de jogador
    if (evs.filter((e) => e.name === 'run_start').length >= 10) {
        console.log(
            `  (fora: sessão com ${evs.filter((e) => e.name === 'run_start').length} copas, ${st.app_version}, ${st.props.device})`,
        );
        continue;
    }
    if (/^duel/.test(String(evs.find((e) => e.name === 'screen')?.props.screen ?? ''))) continue;
    if (['tiktok', 'instagram'].includes(String(st.props.ref ?? ''))) continue;
    novas.push({ s, dev: tipo(String(st.props.device)), evs });
}
const comecou = novas.filter((n) => n.evs.some((e) => e.name === 'run_start'));
const jogou = comecou.filter((n) => n.evs.some((e) => e.name === 'match_end'));
console.log(`desde ${DESDE}: novas ${novas.length}, começaram ${comecou.length}, jogaram ${jogou.length}`);

// por sessão que começou e NÃO jogou: último evento relevante, picks, tempo
const rowsOut: string[] = [];
const ultimaTela = new Map<string, number>();
const picksDist = new Map<number, number>();
const durSaiu: number[] = [];
const durJogou: number[] = [];
const porDev = new Map<string, { c: number; j: number; sai: number }>();
let autoSai = 0;
let autoJog = 0;

for (const n of comecou) {
    const i0 = n.evs.findIndex((e) => e.name === 'run_start');
    const after = n.evs.slice(i0);
    const jogouAqui = after.some((e) => e.name === 'match_end');
    const picks = after.filter((e) => e.name === 'pick');
    const auto = picks.some((p) => p.props.auto === true);
    const t0 = after[0].created_at.getTime();
    const tEnd = (jogouAqui ? after.find((e) => e.name === 'match_end')! : after.at(-1)!).created_at.getTime();
    const d = n.dev;
    const o = porDev.get(d) ?? { c: 0, j: 0, sai: 0 };
    o.c++;
    if (jogouAqui) {
        o.j++;
        durJogou.push((tEnd - t0) / 1000);
        if (auto) autoJog++;
    } else {
        o.sai++;
        durSaiu.push((tEnd - t0) / 1000);
        if (auto) autoSai++;
        const screens = after.filter((e) => e.name === 'screen').map((e) => String(e.props.screen));
        const abandon = after.find((e) => e.name === 'run_abandon');
        const last = abandon ? `abandon@${abandon.props.status}` : `tela:${screens.at(-1) ?? 'run_start'}`;
        ultimaTela.set(last, (ultimaTela.get(last) ?? 0) + 1);
        picksDist.set(picks.length, (picksDist.get(picks.length) ?? 0) + 1);
        rowsOut.push(
            `${d.padEnd(8)} picks=${picks.length} auto=${auto ? 's' : 'n'} dur=${Math.round((tEnd - t0) / 1000)}s ${last} fmt=${after.find((e) => e.name === 'formation')?.props.formation ?? '-'} coach=${
                after
                    .filter((e) => e.name.startsWith('coach'))
                    .map((e) => e.name.slice(6))
                    .join('/') || '-'
            } v=${after[0].app_version}`,
        );
    }
    porDev.set(d, o);
}
console.log('\npor aparelho (começou / jogou / saiu):');
for (const [d, o] of porDev) console.log(`  ${d.padEnd(8)} ${o.c} / ${o.j} / ${o.sai} (${pct(o.sai, o.c)} saem)`);
console.log('\núltimo ponto de quem saiu:');
for (const [k, v] of [...ultimaTela].sort((x, y) => y[1] - x[1])) console.log(`  ${k.padEnd(28)} ${v}`);
console.log(
    '\npicks feitos por quem saiu:',
    [...picksDist]
        .sort((x, y) => x[0] - y[0])
        .map(([k, v]) => `${k}:${v}`)
        .join('  '),
);
console.log(
    `\nMonta pra mim (algum pick auto): saíram ${autoSai}/${durSaiu.length}, jogaram ${autoJog}/${durJogou.length}`,
);
console.log(
    `tempo run_start->último evento (saiu) mediana ${med(durSaiu)}s; run_start->1º match_end (jogou) mediana ${med(durJogou)}s`,
);
console.log('\nsessões que saíram:');
console.log(rowsOut.join('\n'));

// ---- a 1ª partida: velocidade, tempo no jogo e quem mexeu na velocidade ----
console.log('\n== 1ª partida (sessões novas que chegaram na tela match) ==');
const t = (e: Ev) => e.created_at.getTime() / 1000;
const naPartida = comecou.filter((n) => n.evs.some((e) => e.name === 'screen' && e.props.screen === 'match'));
const fim: Record<string, { n: number; seg: number[]; draft: number[]; vel: Map<string, number> }> = {
    jogou: { n: 0, seg: [], draft: [], vel: new Map() },
    saiu: { n: 0, seg: [], draft: [], vel: new Map() },
};
for (const n of naPartida) {
    const i0 = n.evs.findIndex((e) => e.name === 'run_start');
    const aft = n.evs.slice(i0);
    const m0 = aft.find((e) => e.name === 'screen' && e.props.screen === 'match')!;
    const me = aft.find((e) => e.name === 'match_end');
    const g = fim[me ? 'jogou' : 'saiu'];
    g.n++;
    g.draft.push(t(m0) - t(aft[0]));
    if (me) {
        g.seg.push(t(me) - t(m0));
        const v = String(me.props.speed);
        g.vel.set(v, (g.vel.get(v) ?? 0) + 1);
    }
    // velocidade só até o 1º apito (ou até sumir); o último toque na velocidade é o piso do tempo que ficou na partida
    const sp = aft.filter(
        (e) => e.name === 'setting' && e.props.key === 'speed' && t(e) >= t(m0) && (!me || t(e) <= t(me)),
    );
    console.log(
        `  ${me ? 'jogou' : 'saiu '} ${n.dev.padEnd(7)} toques na vel.: ${sp.length} (${sp.map((e) => e.props.value).join('>') || '-'})${me ? ` apito em ${Math.round(t(me) - t(m0))}s` : ` último toque na vel. em ${sp.length ? Math.round(t(sp.at(-1)!) - t(m0)) : '-'}s; sem eventos depois, ficou no mín. isso`}`,
    );
}
for (const [k, g] of Object.entries(fim))
    console.log(
        `  ${k}: ${g.n} · run_start->tela match mediana ${med(g.draft)}s · tela match->apito mediana ${med(g.seg)}s · velocidade ${[...g.vel].map(([v, c]) => `${v}x:${c}`).join(' ') || '-'}`,
    );

// ---- erros e linha do tempo de quem saiu na partida ----
console.log('\n== quem saiu na partida: erros e eventos depois da tela match ==');
for (const n of naPartida) {
    const aft = n.evs.slice(n.evs.findIndex((e) => e.name === 'run_start'));
    if (aft.some((e) => e.name === 'match_end')) continue;
    const m0 = aft.find((e) => e.name === 'screen' && e.props.screen === 'match')!;
    const dep = n.evs
        .filter((e) => t(e) >= t(m0) && e.name !== 'setting' && e.name !== 'pick')
        .map(
            (e) =>
                `${e.name}${e.name.startsWith('coach') ? `[${e.props.id ?? e.props.coach}:${e.props.step}]` : ''}${e.name === 'screen' ? `[${e.props.screen}]` : ''}${e.name === 'error' ? `(${String(e.props.msg).slice(0, 60)})` : ''}`,
        );
    console.log(`  ${n.dev.padEnd(7)} ${dep.join(' > ')}`);
}
const erros = new Map<string, number>();
for (const n of comecou)
    for (const e of n.evs)
        if (e.name === 'error')
            erros.set(String(e.props.msg).slice(0, 70), (erros.get(String(e.props.msg).slice(0, 70)) ?? 0) + 1);
console.log('erros em sessões que começaram copa:', [...erros].map(([k, v]) => `${v}x ${k}`).join(' | ') || 'nenhum');
