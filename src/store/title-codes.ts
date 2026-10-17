/**
 * Títulos por código (para os primeiros gametesters). O cliente só guarda o SHA-256 do código, nunca o código:
 * quem lê o repositório vê o nome do título, mas não consegue resgatar.
 *
 * ===================== TABELA PROVISÓRIA: troque/complete com os códigos de verdade =====================
 * Para criar um código novo:
 *   1. Escolha o código (o jogo ignora espaços nas pontas e maiúsculas/minúsculas: guarde em MAIÚSCULAS).
 *   2. Gere o hash:  node -e "console.log(require('crypto').createHash('sha256').update('MEU-CODIGO').digest('hex'))"
 *   3. Ponha `'<hash>': '<id do título>'` em CODE_TITLES e o nome do título em CUSTOM_TITLES (pt e en).
 * Vários códigos podem dar o mesmo título. O exemplo abaixo ('SOCCERMON-TESTE') é só para testar: apague antes
 * de distribuir os de verdade.
 * ========================================================================================================
 */
export const CODE_TITLES: Readonly<Record<string, string>> = {
    // SOCCERMON-TESTE (exemplo)
    '2f17e719b34d4ab491a7029424f64fa217b151bcc642fe569093d1fd84d80a04': 'gametester',
};

/** Nome dos títulos de código (o resto dos títulos fica no dicionário: profile.titles). */
export const CUSTOM_TITLES: Readonly<Record<string, { pt: string; en: string }>> = {
    gametester: { pt: 'Gametester', en: 'Gametester' },
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
