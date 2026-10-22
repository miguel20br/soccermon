import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { useT } from '../../i18n/react';
import { type GameState, useGame } from '../../store/game-store';
import { earnedKeys, freshKeys, medalViewOf, type NewsTab, newsTabOf } from '../../store/news';

/** Quanto tempo o item fica à vista (60% dele na tela) até contar como visto. */
const SEEN_MS = 1000;

let memo: { deps: unknown[]; out: ReadonlySet<string> } | null = null;
/** As novidades do save (ganho e não visto). Memo pelas partes do save que contam: chamar em cada selo é barato. */
export function newsOf(s: GameState): ReadonlySet<string> {
    const deps = [s.profile, s.dex, s.records, s.career, s.hall, s.run, s.parkedRuns, s.duels, s.moves];
    if (memo?.deps.every((d, i) => d === deps[i])) return memo.out;
    // sem `seen` (antes do baseline), nada é novo: nem precisa contar o que foi ganho
    const out = new Set(s.profile.seen ? freshKeys(earnedKeys(medalViewOf(s), s.profile), s.profile.seen) : []);
    memo = { deps, out };
    return out;
}
export const useNews = () => useGame(newsOf);
export const newsCount = (news: ReadonlySet<string>, tab?: NewsTab) =>
    tab ? [...news].filter((k) => newsTabOf(k) === tab).length : news.size;

// vários selos vistos juntos viram uma gravação só
const pending = new Set<string>();
let flushTm = 0;
function flush() {
    flushTm = 0;
    const g = useGame.getState();
    const seen = new Set(g.profile.seen ?? []);
    const add = [...pending].filter((k) => !seen.has(k));
    pending.clear();
    if (add.length) g.updateProfile({ seen: [...seen, ...add] });
}
export function markSeen(keys: Iterable<string>, now = false) {
    for (const k of keys) pending.add(k);
    if (now) return flush();
    if (!flushTm) flushTm = window.setTimeout(flush, 60);
}

/** "Marcar tudo": cada clique esconde os selos que ainda estavam na tela (já vistos, mas mostrados até sair da aba). */
const useCleared = create<{ n: number }>(() => ({ n: 0 }));
export function markAllSeen(tab?: NewsTab) {
    markSeen(
        [...newsOf(useGame.getState())].filter((k) => !tab || newsTabOf(k) === tab),
        true,
    );
    useCleared.setState((s) => ({ n: s.n + 1 }));
}

/**
 * Selo NOVO de um item. À vista por ~1 s, o item conta como visto (o selo fica até sair da aba, pra dar tempo de
 * reparar). Sem `k`: só o selo (resumo de um grupo fechado, como os avatares de uma geração).
 */
export function NewBadge({ k, on, className = '' }: { k?: string | string[]; on?: boolean; className?: string }) {
    const { t } = useT();
    const fresh = useNews();
    const keys = k === undefined ? [] : Array.isArray(k) ? k : [k];
    const id = keys.join(' ');
    const isNew = keys.length ? keys.some((x) => fresh.has(x)) : !!on;
    const cleared = useCleared((s) => s.n);
    const [held, setHeld] = useState<number | null>(null);
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!id || !isNew || !el) return;
        let tm = 0;
        const seen = () => {
            setHeld(useCleared.getState().n);
            markSeen(id.split(' '));
        };
        if (typeof IntersectionObserver === 'undefined') {
            tm = window.setTimeout(seen, SEEN_MS);
            return () => clearTimeout(tm);
        }
        const io = new IntersectionObserver(
            ([e]) => {
                clearTimeout(tm);
                if (e.isIntersecting) tm = window.setTimeout(seen, SEEN_MS);
            },
            { threshold: 0.6 },
        );
        io.observe(el);
        return () => {
            io.disconnect();
            clearTimeout(tm);
        };
    }, [id, isNew]);
    if (!isNew && held !== cleared) return null;
    return (
        <span ref={ref} className={`new-badge ${className}`}>
            {t('profile.news.badge')}
        </span>
    );
}

/** Pontinho de "tem novidade" (botão do Perfil, abas). */
export function NewDot({ on, className = '' }: { on: boolean; className?: string }) {
    const { t } = useT();
    if (!on) return null;
    return (
        <i className={`new-dot ${className}`}>
            <span className="pf-sr">{t('profile.news.dot')}</span>
        </i>
    );
}
