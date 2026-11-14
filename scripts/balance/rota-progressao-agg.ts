// Junta as saídas do rota-progressao.sim.test.ts: por partida, a média do seu time × a do rival e a vitória.
// Uso: npx tsx scripts/balance/rota-progressao-agg.ts hoje.json teto.json ...
import { readFileSync } from 'node:fs';

const NAMES = ['Rota 1', 'Rota 2', 'Rota 3', 'Rota 4', 'Grupo 1', 'Grupo 2', 'Grupo 3', 'Final'];
for (const file of process.argv.slice(2)) {
    const res: {
        champion: boolean;
        played: number;
        draft: number;
        captain: { ovr: number; icone: boolean };
        stages: { stage: number; me: number; rival: number; won: boolean }[];
    }[] = JSON.parse(readFileSync(file, 'utf8'));
    const n = res.length;
    const pct = (k: number) => `${((100 * k) / n).toFixed(0)}%`;
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    console.log(`\n## ${file.split('/').at(-1)} (${n} Rotas)`);
    console.log(
        `draft: média ${mean(res.map((r) => r.draft)).toFixed(1)} · capitão ${mean(res.map((r) => r.captain.ovr)).toFixed(1)} (85+: ${pct(res.filter((r) => r.captain.ovr >= 85).length)}, Ícone ${pct(res.filter((r) => r.captain.icone).length)})`,
    );
    console.log('| Partida | Seu time | Rival | Diferença | Vitória | Jogos |');
    console.log('|---|---|---|---|---|---|');
    NAMES.forEach((name, s) => {
        const st = res.flatMap((r) => r.stages.filter((x) => x.stage === s));
        if (!st.length) return;
        const me = mean(st.map((x) => x.me));
        const rv = mean(st.map((x) => x.rival));
        const w = st.filter((x) => x.won).length / st.length;
        console.log(
            `| ${name} | ${me.toFixed(1)} | ${rv.toFixed(1)} | ${(me - rv >= 0 ? '+' : '') + (me - rv).toFixed(1)} | ${(100 * w).toFixed(0)}% | ${st.length} |`,
        );
    });
    console.log(
        `chega no Planalto ${pct(res.filter((r) => r.played >= 5).length)} · chega na Final ${pct(res.filter((r) => r.played >= 8).length)} · título ${pct(res.filter((r) => r.champion).length)}`,
    );
}
