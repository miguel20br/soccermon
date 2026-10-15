import { MOVES, SPECIES, type Species } from '../../engine/data';
import { defaultMoveset, moveProfile } from '../../engine/moves';
import { SIGNATURE } from '../../engine/signature-moves';
import { type FxStyle, fxStyle } from '../../game/move-fx';
import type { Dex, MoveDex } from '../../store/profile';

/**
 * Dados da Golpedex (?lab=golpes): cada golpe do jogo com quem usa, e as regras de "descoberto".
 * Um golpe entra na Golpedex quando aparece em campo numa partida sua (store `moves`, contado no fim da
 * partida). Só contam os golpes que algum Pokémon usa de verdade (moveset padrão dos 151, que já inclui a
 * assinatura); os outros só aparecem no modo revisão.
 */
export interface MoveRow {
    id: string;
    /** Número na Golpedex (ordem por tipo e nome); 0 = fora do jogo (só no modo revisão). */
    num: number;
    name: string;
    type: string;
    kind: string;
    style: FxStyle;
    power: number;
    accuracy: number;
    uses: number;
    desc: string | null;
    /** Espécies que usam por padrão. */
    users: Species[];
    signatureOf: Species[];
    /** Quem faz a animação quando nenhum usuário foi visto ainda. */
    performer: number;
}

export const DITTO = 132;

/** Moveset de cada espécie (o que ela leva para a quadra). */
export const MOVESET: ReadonlyMap<number, string[]> = new Map(SPECIES.map((sp) => [sp.id, defaultMoveset(sp)]));

function build(): MoveRow[] {
    const rows = Object.values(MOVES).map((m) => {
        const prof = moveProfile(m.id);
        const signatureOf = SPECIES.filter((sp) => SIGNATURE[sp.id] === m.id);
        const users = SPECIES.filter((sp) => MOVESET.get(sp.id)?.includes(m.id));
        const learner = SPECIES.find((sp) => sp.learnset.includes(m.id));
        return {
            id: m.id,
            num: 0,
            name: m.name,
            type: m.type,
            kind: prof.kind,
            style: fxStyle(m.id, prof.kind),
            power: m.power,
            accuracy: m.accuracy,
            uses: prof.uses,
            desc: m.descPt,
            users,
            signatureOf,
            performer: (signatureOf[0] ?? users[0] ?? learner ?? SPECIES[24]).id,
        };
    });
    rows.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    let n = 0;
    for (const r of rows) if (r.users.length) r.num = ++n;
    return rows;
}

/** Todos os golpes (164), em ordem de tipo e nome. */
export const ALL_ROWS: MoveRow[] = build();
/** Os que aparecem em campo: o total da Golpedex. */
export const GAME_ROWS: MoveRow[] = ALL_ROWS.filter((r) => r.num > 0);
export const ROW_BY_ID: ReadonlyMap<string, MoveRow> = new Map(ALL_ROWS.map((r) => [r.id, r]));

/**
 * Vezes que o golpe apareceu em campo. Transformar (Ditto) não gera evento de golpe na partida (o Ditto
 * se transforma sozinho no apito), então vale como visto quando o Ditto já jogou.
 */
export function timesSeen(id: string, moves: MoveDex, dex: Dex): number {
    const n = moves[id] ?? 0;
    if (id === 'transform' && n === 0 && (dex[DITTO]?.matches ?? 0) > 0) return dex[DITTO].matches;
    return n;
}

export const pad3 = (n: number) => String(n).padStart(3, '0');

/** Busca sem acento e sem caixa. */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
