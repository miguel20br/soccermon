import { setUtNow } from '../../store/ultimate/clock';

/**
 * Bandeira do Time Ultimate (ADR 0005, docs/planos/ultimate-team.md): `?lab=ultimate` liga na aba até fechar,
 * `?lab=ultimate-off` desliga. Só no dev e nas prévias (`__SMOKE__`): em produção o cartão continua EM BREVE até 27/11,
 * com ou sem a bandeira.
 */
const KEY = 'soccermon-lab-ultimate';

export function ultimateOn(smoke: boolean, search: string, stored: string | null): boolean {
    if (!smoke) return false;
    const q = new URLSearchParams(search).get('lab');
    if (q === 'ultimate') return true;
    if (q === 'ultimate-off') return false;
    return stored === '1';
}

/**
 * Relógio da prévia: `?utnow=2026-12-20` (ou um instante ISO) faz o Time Ultimate viver naquela data, pra jogar a
 * Temporada 1 e o Natal antes da hora. Só no dev e nas prévias; data inválida não muda nada.
 */
export function utClockOf(smoke: boolean, search: string): number | null {
    if (!smoke) return null;
    const q = new URLSearchParams(search).get('utnow');
    const at = q ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(q) ? `${q}T12:00:00-03:00` : q) : Number.NaN;
    return Number.isFinite(at) ? at : null;
}

/** Lê (e guarda na aba) a bandeira: entrar no modo troca a tela, voltar pro menu tem que lembrar. */
export function readUltimate(): boolean {
    setUtNow(utClockOf(__SMOKE__, window.location.search));
    let stored: string | null = null;
    try {
        stored = sessionStorage.getItem(KEY);
    } catch {
        // aba anônima sem storage: vale só a URL
    }
    const on = ultimateOn(__SMOKE__, window.location.search, stored);
    try {
        sessionStorage.setItem(KEY, on ? '1' : '0');
    } catch {
        // nada
    }
    return on;
}
