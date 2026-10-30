import { lazy, Suspense } from 'react';
import { reloadForNewVersion } from './chunk-reload';
import type { MatchSceneData } from './game/scenes/MatchScene';

/**
 * Pedaço do Phaser (~1,4 MB: motor gráfico, cenas, efeitos dos golpes). Fica fora da Home: baixa quando a Home fica
 * ociosa (prefetchGame) e roda na Escalação (preloadGame), pra não atrasar o "Jogar"; ou quando a partida abre.
 */
const load = () => import('./game/PhaserCanvas');
const Canvas = lazy(() =>
    load().catch(async (e) => {
        // pedaço que sumiu (versão nova no ar com a aba aberta): recarrega pra pegar a versão nova; senão, aviso de erro
        if (await reloadForNewVersion()) return new Promise<never>(() => {});
        throw e;
    }),
);

export function preloadGame() {
    // sem rede agora: a partida tenta de novo ao abrir
    load().catch(() => {});
}

/**
 * Só baixa e compila o pedaço da partida (`modulepreload`, lista no index.html pelo vite/config.prod.mjs), sem rodar:
 * rodar o Phaser na Home era uma tarefa longa de ~360 ms no celular. Quem roda é o `preloadGame`, já na Escalação.
 * No dev (sem a lista), não faz nada.
 */
export function prefetchGame() {
    const files = document.querySelector<HTMLMetaElement>('meta[name="soccermon-phaser"]')?.content.split(' ') ?? [];
    for (const href of files) {
        if (!href || document.querySelector(`link[href="${href}"]`)) continue;
        const link = document.createElement('link');
        link.rel = href.endsWith('.css') ? 'prefetch' : 'modulepreload';
        link.crossOrigin = '';
        link.href = href;
        document.head.append(link);
    }
}

/** Monta o canvas Phaser da partida. Enquanto o pedaço chega, o VERSUS (que espera a cena) segue na frente. */
export function PhaserGame({ data }: { data: MatchSceneData }) {
    return (
        <Suspense fallback={<div className="phaser-container" />}>
            <Canvas data={data} />
        </Suspense>
    );
}
