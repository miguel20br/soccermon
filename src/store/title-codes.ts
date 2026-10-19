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
};

/** Nome dos títulos de código (o resto dos títulos fica no dicionário: profile.titles). */
export const CUSTOM_TITLES: Readonly<Record<string, { pt: string; en: string; look?: 'shine' | 'holo' }>> = {
    gametester: { pt: 'Gametester', en: 'Gametester' },
    goat: { pt: 'GOAT', en: 'GOAT', look: 'shine' },
    criador: { pt: 'Criador do Soccermon', en: 'Soccermon Creator', look: 'holo' },
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
