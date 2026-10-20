import Phaser from 'phaser';
import { memo, useEffect, useRef } from 'react';
import { EventBus } from '../../game/EventBus';
import { ROOM_H, ROOM_W, type RoomSceneData, TrophyRoomScene } from '../../game/scenes/TrophyRoomScene';

/**
 * Palco do Phaser com a sala de troféus (src/game/scenes/TrophyRoomScene.ts). Vem num pedaço à parte (o Phaser só
 * baixa quando a sala abre). `onPick` recebe o objeto tocado; `focus` aproxima a câmera dele (null volta).
 */
export const RoomStage = memo(function RoomStage({
    data,
    focus,
    onPick,
    onHover,
    onHold,
}: {
    data: RoomSceneData;
    focus: string | null;
    onPick: (id: string) => void;
    /** Objeto debaixo do mouse (null = nenhum). */
    onHover?: (id: string | null) => void;
    /** Segurando o dedo/mouse na sala (mostra o nome de tudo). */
    onHold?: (on: boolean) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const pick = useRef(onPick);
    pick.current = onPick;
    const hover = useRef(onHover);
    hover.current = onHover;
    const hold = useRef(onHold);
    hold.current = onHold;
    const ready = useRef(false);
    const pendingFocus = useRef(focus);
    pendingFocus.current = focus;

    // biome-ignore lint/correctness/useExhaustiveDependencies: a cena nasce uma vez por dado (o quarto muda inteiro)
    useEffect(() => {
        const onPickEv = (id: string) => pick.current(id);
        const onReady = () => {
            ready.current = true;
            if (pendingFocus.current) EventBus.emit('room:focus', pendingFocus.current);
        };
        const onHoverEv = (id: string | null) => hover.current?.(id);
        const onHoldEv = (on: boolean) => hold.current?.(on);
        EventBus.on('room:pick', onPickEv);
        EventBus.on('room:ready', onReady);
        EventBus.on('room:hover', onHoverEv);
        EventBus.on('room:hold', onHoldEv);
        let game: Phaser.Game | null = null;
        const timer = window.setTimeout(() => {
            if (!ref.current) return;
            game = new Phaser.Game({
                type: Phaser.WEBGL,
                width: ROOM_W,
                height: ROOM_H,
                parent: ref.current,
                pixelArt: true,
                backgroundColor: '#0e1430',
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
                audio: { noAudio: true },
                // toque no cartão por cima do quarto não pode virar toque no quarto
                input: { windowEvents: false },
                scene: [],
            });
            game.scene.add('TrophyRoom', TrophyRoomScene, true, data);
        }, 0);
        return () => {
            clearTimeout(timer);
            ready.current = false;
            EventBus.off('room:pick', onPickEv);
            EventBus.off('room:ready', onReady);
            EventBus.off('room:hover', onHoverEv);
            EventBus.off('room:hold', onHoldEv);
            game?.destroy(true);
        };
    }, [JSON.stringify(data)]);

    useEffect(() => {
        if (ready.current) EventBus.emit('room:focus', focus);
    }, [focus]);

    return <div ref={ref} className="room-stage" />;
});
