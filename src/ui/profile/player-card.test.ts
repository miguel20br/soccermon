import { describe, expect, it } from 'vitest';
import type { Peer } from '../../net/duel-state';
import { peerInfo } from './PlayerCard';

/** Perfil que chega do rival na sala: dado de fora, cada campo tem que passar pela validação. */
const peer = (extra: Record<string, unknown>) =>
    ({
        id: 'x',
        name: 'Gary',
        avatar: 'assets/cards/6.gif',
        avatarGoogle: false,
        trainer: 'blue',
        title: 'Campeão',
        clubName: 'Rival FC',
        clubTag: 'RIV',
        clubColor: 0xe8423f,
        engine: 0,
        app: 'x',
        ...extra,
    }) as unknown as Peer;

describe('cartão do treinador do rival', () => {
    it('fica só com o que vale: treinador, avatar, vitrine e cartas', () => {
        const info = peerInfo(
            peer({
                trainer: '../../evil',
                avatar: 'javascript:alert(1)',
                name: 'G'.repeat(200),
                showcase: ['lixo', 'm:campeao:4'],
                cards: [{ speciesId: 999 }, 'lixo'],
            }),
        );
        expect(info.trainer).toBe('red');
        expect(info.avatar.src).toBe('assets/avatars/25.gif');
        expect(info.name.length).toBeLessThanOrEqual(40);
        expect(info.showcase).toHaveLength(1);
        expect(info.cards).toEqual([]);
        expect(info.other).toBe(true);
    });

    it('mantém o perfil de quem mandou tudo certo', () => {
        const info = peerInfo(peer({}), false);
        expect(info.trainer).toBe('blue');
        expect(info.clubTag).toBe('RIV');
        expect(info.other).toBe(false);
    });
});
