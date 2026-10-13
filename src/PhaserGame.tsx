import { useEffect, useRef } from 'react';
import startGame from './game/main';
import type { MatchSceneData } from './game/scenes/MatchScene';

/** Monta o canvas Phaser da partida e o destrói ao sair da tela. */
export function PhaserGame({ data }: { data: MatchSceneData }) {
    const container = useRef<HTMLDivElement>(null);
    // os dados só são lidos na criação; trocar de partida remonta o componente (key)
    const initial = useRef(data);

    useEffect(() => {
        if (!container.current) return;
        const game = startGame(container.current, initial.current);
        return () => game.destroy(true);
    }, []);

    return <div ref={container} className="phaser-container" />;
}
