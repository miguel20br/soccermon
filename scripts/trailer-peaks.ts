/**
 * Picos dos clipes do trailer (docs/planos/trailer-plano.md): de que tick a que tick entra a câmera lenta e em que
 * tick vem o flash. Lê os eventos da mesma partida que o navegador grava (mesma seed e mesmo time).
 *
 *   npx tsx scripts/trailer-peaks.ts > trailer/picos.json
 */
import { FUTSAL_5 } from '../src/engine/config';
import { buildCupOpponents } from '../src/engine/cup';
import { runMatch } from '../src/engine/runners/batch-runner';
import type { MatchEvent } from '../src/engine/state';
import { type TrailerScene, trailerTeam } from '../src/ui/trailer-scenes';

type Kind = 'gol' | 'combo' | 'penalti';
const CLIPS: { nome: string; cena: TrailerScene; seed: string; tipo: Kind; perto: number }[] = [
    { nome: '1-gancho-charmander-evolui-e-marca', cena: 'evolucao', seed: 'trailer222', tipo: 'gol', perto: 396.1 },
    { nome: '2-golpe-charizard-fire-blast', cena: 'golpe', seed: 'trailer315', tipo: 'gol', perto: 9.7 },
    { nome: '3-golpe-mewtwo-psychic', cena: 'golpe', seed: 'trailer397', tipo: 'gol', perto: 19.7 },
    { nome: '4-golpe-charizard-flamethrower', cena: 'golpe', seed: 'trailer26', tipo: 'gol', perto: 130.1 },
    { nome: '5-jogada-pikachu-6-passes', cena: 'jogada', seed: 'trailer294', tipo: 'gol', perto: 9.6 },
    { nome: '6-ditto-vira-mewtwo-e-combo', cena: 'ditto', seed: 'trailer315', tipo: 'combo', perto: 4.3 },
    { nome: '7-penaltis-6x5-ultima-cobranca', cena: 'penaltis', seed: 'trailer7', tipo: 'penalti', perto: 428.6 },
];
const R = FUTSAL_5.tickRate;

const out = CLIPS.map((c) => {
    const m = runMatch(
        FUTSAL_5,
        trailerTeam(c.cena, c.seed, 'Pallet FC', 0xe8423f),
        buildCupOpponents(c.seed)[0],
        `${c.seed}-stage-0`,
        {
            snapshots: false,
        },
    );
    const alvo = c.perto * R;
    const perto = <T extends MatchEvent>(evs: T[]) =>
        evs.sort((a, b) => Math.abs(a.tick - alvo) - Math.abs(b.tick - alvo))[0];
    if (c.tipo === 'gol') {
        const g = perto(m.events.filter((e): e is Extract<MatchEvent, { type: 'goal' }> => e.type === 'goal'));
        const shot = [...m.events].reverse().find((e) => e.type === 'shot' && e.by === g.by && e.tick <= g.tick);
        const de = (shot?.tick ?? g.tick - 12) - 6;
        return { ...c, lentoDe: de, lentoAte: g.tick + 5, flash: g.tick };
    }
    if (c.tipo === 'combo') {
        const e = perto(m.events.filter((x) => x.type === 'combo'));
        return { ...c, lentoDe: e.tick - 2, lentoAte: e.tick + 22, flash: e.tick };
    }
    const p = perto(m.events.filter((x) => x.type === 'penalty'));
    return { ...c, lentoDe: p.tick - 20, lentoAte: p.tick + 12, flash: p.tick };
});
console.log(JSON.stringify(out, null, 2));
