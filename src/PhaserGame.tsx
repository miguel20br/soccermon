import { lazy, Suspense } from 'react';
import { reloadForNewVersion } from './chunk-reload';
import type { MatchSceneData } from './game/scenes/MatchScene';

/**
 * Pedaço do Phaser (~1,4 MB: motor gráfico, cenas, efeitos dos golpes). Fica fora da Home: carrega quando a partida
 * abre, ou antes, em segundo plano, quando a Home fica ociosa (preloadGame), pra não atrasar o "Jogar".
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

/** Monta o canvas Phaser da partida. Enquanto o pedaço chega, o VERSUS (que espera a cena) segue na frente. */
export function PhaserGame({ data }: { data: MatchSceneData }) {
    return (
        <Suspense fallback={<div className="phaser-container" />}>
            <Canvas data={data} />
        </Suspense>
    );
}
