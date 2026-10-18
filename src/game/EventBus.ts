// Eventos entre as telas React e as cenas Phaser. Sem importar o Phaser: o EventBus é usado já na Home (duelo,
// painéis) e o Phaser só carrega quando a partida abre. Mesma assinatura do Events.EventEmitter (on/off/emit com
// contexto), que é o que o jogo usa.
type Fn = (...args: never[]) => void;
type Listener = { fn: Fn; ctx: unknown };

const map = new Map<string, Listener[]>();

export const EventBus = {
    on(event: string, fn: Fn, ctx?: unknown) {
        map.set(event, [...(map.get(event) ?? []), { fn, ctx }]);
        return EventBus;
    },
    /** Sem `ctx`, tira o `fn` de qualquer contexto (como no Phaser). */
    off(event: string, fn: Fn, ctx?: unknown) {
        const next = (map.get(event) ?? []).filter((l) => l.fn !== fn || (ctx !== undefined && l.ctx !== ctx));
        if (next.length) map.set(event, next);
        else map.delete(event);
        return EventBus;
    },
    emit(event: string, ...args: unknown[]) {
        const ls = map.get(event);
        if (!ls) return false;
        // lista copiada no on/off: quem sai no meio do emit não pula ninguém
        for (const l of ls) (l.fn as (...a: unknown[]) => void).apply(l.ctx, args);
        return true;
    },
};
