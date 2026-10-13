import { useEffect, useRef } from 'react';
import startGame from './game/main';
import type { MatchSceneData } from './game/scenes/MatchScene';

/** Monta o canvas Phaser da partida e o destrói ao sair da tela. */
export function PhaserGame({ data }: { data: MatchSceneData }) {
    const container = useRef<HTMLDivElement>(null);
    // os dados só são lidos na criação; trocar de partida remonta o componente (key)
    const initial = useRef(data);

    useEffect(() => {
        let game: ReturnType<typeof startGame> | null = null;
        // cria no próximo ciclo: no StrictMode (dev) a montagem dupla cancela o timer em vez de
        // criar e destruir um jogo que ainda nem iniciou (isso podia deixar a cena travada)
        const timer = window.setTimeout(() => {
            if (container.current) game = startGame(container.current, initial.current);
        }, 0);
        return () => {
            clearTimeout(timer);
            game?.destroy(true);
        };
    }, []);

    return <div ref={container} className="phaser-container" />;
}
