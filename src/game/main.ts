import Phaser from 'phaser';
import { GAME_H, GAME_W, MatchScene, type MatchSceneData } from './scenes/MatchScene';

/** Cria o jogo Phaser só com a cena da partida; o resto da UI é React. */
export default function startGame(parent: HTMLElement, data: MatchSceneData): Phaser.Game {
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: GAME_W,
        height: GAME_H,
        parent,
        pixelArt: true,
        backgroundColor: '#5a3820',
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        audio: { noAudio: true }, // áudio é tocado por HTMLAudio/ZzFX (src/game/audio.ts)
        callbacks: {
            preBoot: (game) => game.registry.set('matchData', data),
        },
        scene: [MatchScene],
    });
    // só no dev: a gravação do trailer (trailer/) pausa o loop e avança quadro a quadro com game.step
    if (import.meta.env.DEV) (window as unknown as { __soccermonGame?: Phaser.Game }).__soccermonGame = game;
    return game;
}
