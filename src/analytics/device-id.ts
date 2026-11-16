/**
 * Contador anônimo do aparelho (metricas-observabilidade.md, §2.1): um número sorteado no `localStorage`, **fora do
 * save** (o save vai pra nuvem de quem loga e pro backup; aqui o id nunca encontra a conta). Serve pra contar pessoas
 * (D1/D7/D30, novos × recorrentes) em vez de abas. Sem fingerprint: limpar os dados do site zera o id.
 *
 * Não cria com o Global Privacy Control ligado nem sem `localStorage`; desligar as estatísticas apaga (`forgetDevice`).
 */

export const DEVICE_KEY = 'soccermon-aparelho';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
interface Aparelho {
    id: string;
    /** 1º dia (AAAA-MM-DD, calendário do aparelho) */
    first: string;
    /** último dia com sessão */
    last: string;
    /** em quantos dias diferentes jogou */
    days: number;
    /** já tinha save quando o id nasceu: fica fora das coortes */
    legacy: boolean;
}

/** Hoje no calendário do aparelho (AAAA-MM-DD). */
export const localDay = (d = new Date()) => d.toLocaleDateString('en-CA');
const dayNum = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86_400_000;
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const uuid = () =>
    crypto.randomUUID?.() ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

function read(store: Store): Aparelho | null {
    try {
        const a = JSON.parse(store.getItem(DEVICE_KEY) ?? 'null');
        return a && typeof a.id === 'string' && isDay(a.first) && isDay(a.last) && Number.isInteger(a.days)
            ? { id: a.id.slice(0, 40), first: a.first, last: a.last, days: a.days, legacy: a.legacy === true }
            : null;
    } catch {
        return null;
    }
}

/**
 * A sessão de hoje neste aparelho: cria o id na 1ª vez, conta o dia e devolve os campos do `session_start`. Null com
 * o GPC ligado (e apaga um id antigo) ou sem onde guardar.
 */
export function deviceVisit(o: { store: Store | null; today: string; hadSave: boolean; gpc: boolean }) {
    const { store, today } = o;
    if (!store) return null;
    try {
        if (o.gpc) {
            store.removeItem(DEVICE_KEY);
            return null;
        }
        const a = read(store) ?? { id: uuid(), first: today, last: '', days: 0, legacy: o.hadSave };
        const newDay = a.last !== today;
        if (newDay) {
            a.days++;
            a.last = today;
        }
        store.setItem(DEVICE_KEY, JSON.stringify(a));
        return {
            did: a.id,
            first_day: a.first,
            day_n: Math.max(0, dayNum(today) - dayNum(a.first)),
            days: a.days,
            new_day: newDay,
            legacy: a.legacy,
        };
    } catch {
        // sem localStorage (aba anônima, bloqueado, cheio): a sessão vai sem id
        return null;
    }
}

/** Desligou as estatísticas: o id some. */
export function forgetDevice(store: Store | null) {
    try {
        store?.removeItem(DEVICE_KEY);
    } catch {
        // sem storage: não há o que apagar
    }
}

/** O `localStorage`, ou null quando o navegador bloqueia o acesso. */
export function localStore(): Store | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}
