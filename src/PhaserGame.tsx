import { lazy, Suspense } from 'react';
import type { MatchSceneData } from './game/scenes/MatchScene';

/**
 * Pedaço do Phaser (~1,4 MB: motor gráfico, cenas, efeitos dos golpes). Fica fora da Home: carrega quando a partida
 * abre, ou antes, em segundo plano, quando a Home fica ociosa (preloadGame), pra não atrasar o "Jogar".
 */
const load = () => import('./game/PhaserCanvas');
const RELOAD_KEY = 'soccermon-chunk-reload';
const Canvas = lazy(() =>
    load().catch((e) => {
        // pedaço que sumiu (versão nova no ar com a aba aberta): recarrega uma vez pra pegar a versão nova; sem rede,
        // ou se já recarregou há pouco, cai no aviso de erro
        try {
            const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
            if (navigator.onLine && Date.now() - last > 60_000) {
                sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
                window.location.reload();
                return new Promise<never>(() => {});
            }
        } catch {
            // sem sessionStorage: não arrisca recarregar em loop
        }
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
