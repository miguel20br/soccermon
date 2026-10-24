// O store salva no IndexedDB, que o Node não tem: um pedido que nunca responde basta (a caça não lê o save).
(globalThis as { indexedDB?: unknown }).indexedDB ??= { open: () => ({}) };
