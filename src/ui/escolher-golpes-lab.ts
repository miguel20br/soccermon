/**
 * Escolher os golpes (0.9.54, item 8): atrás de `?lab=golpes-escolher`, só no dev e nas prévias (__SMOKE__). Muda o
 * resultado das partidas, então fica fora da produção até o Miguel decidir (docs/planos/escolher-golpes.md).
 * Guarda na aba (entrar na copa troca a URL).
 */
const KEY = 'soccermon-lab-golpes-escolher';

export function escolherGolpesOn(): boolean {
    if (!__SMOKE__) return false;
    const q = new URLSearchParams(window.location.search).get('lab') === 'golpes-escolher';
    try {
        if (q) sessionStorage.setItem(KEY, '1');
        return sessionStorage.getItem(KEY) === '1';
    } catch {
        return q;
    }
}
