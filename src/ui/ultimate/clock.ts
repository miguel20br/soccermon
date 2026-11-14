import { useEffect, useState } from 'react';
import { utNow } from '../../store/ultimate/clock';

/** O relógio da tela (pras contagens do próximo pacote, dos objetivos e da temporada): anda a cada segundo. */
export function useNow() {
    const [now, setNow] = useState(utNow);
    useEffect(() => {
        const id = window.setInterval(() => setNow(utNow()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

/** "11h 05m" / "4m 09s"; mais de um dia vira "2d 03h". */
export const hms = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const dd = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (dd) return `${dd}d ${String(h).padStart(2, '0')}h`;
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s % 60).padStart(2, '0')}s`;
};
