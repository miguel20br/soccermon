import type { Special } from '../engine/specials';

/**
 * Títulos por código (para os primeiros gametesters). O cliente só guarda o SHA-256 do código, nunca o código:
 * quem lê o repositório vê o nome do título, mas não consegue resgatar.
 *
 * ===================== TABELA PROVISÓRIA: troque/complete com os códigos de verdade =====================
 * Para criar um código novo:
 *   1. Escolha o código (o jogo ignora espaços nas pontas e maiúsculas/minúsculas: guarde em MAIÚSCULAS).
 *   2. Gere o hash:  node -e "console.log(require('crypto').createHash('sha256').update('MEU-CODIGO').digest('hex'))"
 *   3. Ponha `'<hash>': '<id do título>'` em CODE_TITLES e o nome do título em CUSTOM_TITLES (pt e en).
 * Vários códigos podem dar o mesmo título. `look` dá um visual próprio: 'shine' (dourado brilhando) ou 'holo'
 * (holográfico: o do criador e os da platina).
 * ========================================================================================================
 */
export const CODE_TITLES: Readonly<Record<string, string>> = {
    // Miguel, o criador (17/10/2026)
    cffbb440db026334b04a1ed02f5b3ee98078cbc0c4d1302cf5809d430c38b93a: 'criador',
    // Davi, 1º gametester (17/10/2026)
    '3ad01be87b2c8319fcd8ebebfb5f701dd2c7bef673d3bcd5ba1dce42b3953776': 'goat',
    // 1º KFC, pedido do Miguel (20/10/2026)
    f52f0051e171d2dafcb7a4fad167d79cbd40310de71f3561cd3b7b939daa84ff: 'kfc1',
    // Tio Fail: código da audiência do canal (kit dos creators, 19/10/2026)
    a37716f67feb879c4cb2a4fa42d0c2d4b4581715023b9014536c5c471e08a512: 'torcidaTioFail',
    // Moracci: código da audiência do canal (kit dos creators, 19/10/2026)
    '93093503d5a89c3eccfba913897207ebc058517a4aaa328e0f2654ad103f8539': 'torcidaMoracci',
    // Farmando Dungeons: código da audiência do canal (kit dos creators, 19/10/2026)
    c1e10ebfb89b1fb1798f20e63e30250e3992e50920fb76a07f5a9f2d243059ec: 'torcidaFarmando',
    // Breno Menezes: código da audiência do canal (kit dos creators, 19/10/2026)
    '6d2ea5093108bf15709f80a91e5a9a7dc33845d236d77fd9df98d29c2dc54594': 'torcidaBreno',
    // LeeGengar: código da audiência do canal (kit dos creators, 19/10/2026)
    ace5d6b207e92e9543d5f58befc7f82ee5efb6bbd5e55491efee9d446f99d701: 'torcidaLeeGengar',
};

/**
 * Códigos de conserto da Pokédex: marcam espécies como "jogou" pra quem perdeu o registro por bug (mesmo esquema
 * dos títulos: só o hash fica no repositório).
 */
export const CODE_DEX: Readonly<Record<string, number[]>> = {
    // Triple M: Pidgey evoluiu em quadra antes do conserto da forma de antes (19/10/2026)
    adef2a8034aaa56f8f99d7ef71c348d78b68fb63b1ec7d24630cc587f75c3afb: [16],
};

/**
 * Códigos de carta devolvida: a carta que alguém perdeu (ganha antes do álbum existir, 19/10/2026 17:50, ela só ficou
 * como figurinha; o álbum desenhava a carta padrão, Destaque I / Ícone sem MVP). Entra no álbum com origem 'resgate',
 * uma vez por save (o `id` vira o uid da carta). Mesmo esquema dos títulos: só o hash fica no repositório.
 */
export interface CardGift {
    id: string;
    speciesId: number;
    shiny: boolean;
    special: Special | null;
}
export const CODE_CARDS: Readonly<Record<string, CardGift>> = {
    // Miguel: Mewtwo Destaque III (21/10/2026)
    '81ec2848f9ed6e6c528955fddf274b71369f79d4dfeba725aba59df5b102a76f': {
        id: 'miguel-mewtwo-d3',
        speciesId: 150,
        shiny: false,
        special: { kind: 'destaque', level: 3 },
    },
    // Davi: Arcanine Shiny Ícone MVP 3, nota 93 (21/10/2026)
    '5ba2815500d6e808e2172e30620d5fd7257e8460393fedc3ab28ad061fa25881': {
        id: 'davi-arcanine-icone3',
        speciesId: 59,
        shiny: true,
        special: { kind: 'icone', level: 3 },
    },
};

/** Nome dos títulos de código (o resto dos títulos fica no dicionário: profile.titles). */
export const CUSTOM_TITLES: Readonly<Record<string, { pt: string; en: string; look?: 'shine' | 'holo' }>> = {
    gametester: { pt: 'Gametester', en: 'Gametester' },
    goat: { pt: 'GOAT', en: 'GOAT', look: 'shine' },
    kfc1: { pt: '1º KFC', en: '1st KFC', look: 'shine' },
    criador: { pt: 'Criador do Soccermon', en: 'Soccermon Creator', look: 'holo' },
    torcidaTioFail: { pt: 'Torcida do Tio Fail', en: 'Tio Fail Supporter' },
    torcidaMoracci: { pt: 'Torcida do Moracci', en: 'Moracci Supporter' },
    torcidaFarmando: { pt: 'Torcida do Farmando Dungeons', en: 'Farmando Dungeons Supporter' },
    torcidaBreno: { pt: 'Torcida do Breno Menezes', en: 'Breno Menezes Supporter' },
    torcidaLeeGengar: { pt: 'Torcida do LeeGengar', en: 'LeeGengar Supporter' },
};

/** Classe do título na tela: os especiais têm visual próprio (dourado ou holográfico). */
/** Títulos das missões lendárias: dourados brilhando, como o GOAT. */
const LEGEND_TITLES = new Set([
    'copaPerfeita',
    'senhorCeus',
    'originalClone',
    'topPercentage',
    'lendaKanto',
    'artilheiroLendario',
    'viradaHistorica',
    'todosJogaram',
    'zeNinguem',
]);

/** Títulos da platina (100% de uma geração): holográficos, como o treinador que vem junto. */
const PLATINUM_TITLES = new Set(['diplomaKanto']);

export const titleClass = (id: string) => {
    const look =
        CUSTOM_TITLES[id]?.look ?? (PLATINUM_TITLES.has(id) ? 'holo' : LEGEND_TITLES.has(id) ? 'shine' : undefined);
    return look ? ` title-${look}` : '';
};

/** Normaliza o que a pessoa digitou (espaços nas pontas e caixa não contam). */
export const normalizeCode = (code: string) => code.trim().toUpperCase();

async function sha256Hex(text: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Título que o código libera, ou null se o código não vale. */
export async function redeemCode(code: string): Promise<string | null> {
    const clean = normalizeCode(code);
    if (!clean) return null;
    return CODE_TITLES[await sha256Hex(clean)] ?? null;
}

/** Espécies que um código de conserto da Pokédex marca como "jogou", ou null. */
export async function redeemDexCode(code: string): Promise<number[] | null> {
    const clean = normalizeCode(code);
    if (!clean) return null;
    return CODE_DEX[await sha256Hex(clean)] ?? null;
}

/** Carta que um código de carta devolvida entrega, ou null. */
export async function redeemCardCode(code: string): Promise<CardGift | null> {
    const clean = normalizeCode(code);
    if (!clean) return null;
    return CODE_CARDS[await sha256Hex(clean)] ?? null;
}
