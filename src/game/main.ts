import Phaser from 'phaser';
import { COURTS, WOOD } from './court-themes';
import { GAME_H, GAME_W, MatchScene, type MatchSceneData } from './scenes/MatchScene';
import { type SharpGame, sharpCanvas } from './sharp-canvas';

/** Cria o jogo Phaser só com a cena da partida; o resto da UI é React. */
export default function startGame(parent: HTMLElement, data: MatchSceneData): Phaser.Game {
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: GAME_W,
        height: GAME_H,
        parent,
        // a cor em volta da quadra do ginásio enquanto a cena carrega (antes era o marrom da madeira em toda quadra: na
        // Final da Rota, uma placa marrom piscava antes da quadra roxa)
        backgroundColor: (data.court ? COURTS[data.court] : WOOD).surround,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        audio: { noAudio: true }, // áudio é tocado por HTMLAudio/ZzFX (src/game/audio.ts)
        // replay: o clipe 9:16 (src/ui/clip-recorder.ts) copia o quadro do canvas depois de desenhado
        // smoothPixelArt (e não pixelArt): pixel quadrado com a borda entre pixels suave. O sprite entra em escala quebrada
        // (1.8x), e com o vizinho mais próximo do pixelArt linhas inteiras dele sumiam no celular (revisão de arte, F6).
        // A nitidez vem do canvas na resolução da tela (sharpCanvas, logo abaixo)
        render: { smoothPixelArt: true, preserveDrawingBuffer: !!data.replay },
        callbacks: {
            preBoot: (game) => game.registry.set('matchData', data),
            postBoot: (game) => sharpCanvas(game as unknown as SharpGame),
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
