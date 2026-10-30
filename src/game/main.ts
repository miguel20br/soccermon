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
        // replay: o clipe 9:16 (src/ui/clip-recorder.ts) copia o quadro do canvas depois de desenhado
        render: { preserveDrawingBuffer: !!data.replay },
        callbacks: {
            preBoot: (game) => game.registry.set('matchData', data),
        },
        scene: [MatchScene],
    });
    // o Phaser guarda num estático a última cena que fez generateTexture (a bola): sem soltar, o jogo inteiro e a
    // cena da partida que acabou ficavam na memória
    game.events.once(Phaser.Core.Events.DESTROY, () => {
        if (Phaser.GameObjects.Graphics.TargetCamera.sceneManager === game.scene)
            // (os tipos dizem Camera; no Phaser é uma BaseCamera)
            Phaser.GameObjects.Graphics.TargetCamera = new Phaser.Cameras.Scene2D.BaseCamera(
                0,
                0,
                0,
                0,
            ) as Phaser.Cameras.Scene2D.Camera;
    });
    // só no dev: a gravação do trailer (trailer/) pausa o loop e avança quadro a quadro com game.step
    if (import.meta.env.DEV) (window as unknown as { __soccermonGame?: Phaser.Game }).__soccermonGame = game;
    return game;
}
