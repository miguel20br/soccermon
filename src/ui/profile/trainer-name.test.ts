import { afterEach, describe, expect, it } from 'vitest';
import { type FriendRow, type FriendsServer, friends, setFriendsServer } from '../../friends/api';
import { usePlayerCard } from './PlayerCard';
import { openTrainer, strangerInfo, trainerCode } from './TrainerName';

const davi: FriendRow = {
    code: 'VRDN4GRN',
    trainer: 'Davi',
    club: 'Viridian Verde',
    club_tag: 'VIR',
    club_color: 'verde',
    status: 'amigo',
    since: new Date(0).toISOString(),
    room: null,
    room_at: null,
};

describe('nome de treinador que abre o perfil', () => {
    it('usa o código que veio no dado (e recusa código inválido)', () => {
        expect(trainerCode({ trainer: 'Gary', club: 'Pallet Rival', code: 'CHAR2ZRD' }, null)).toBe('CHAR2ZRD');
        expect(trainerCode({ trainer: 'Gary', club: 'Pallet Rival', code: 'char2zrd' }, null)).toBeNull();
        expect(trainerCode({ trainer: 'Gary', club: 'Pallet Rival', code: 'I0I0I0I0' }, [davi])).toBeNull();
    });

    it('sem código (ranking de servidor sem a migração), acha o amigo pelo nome e pelo clube', () => {
        expect(trainerCode({ trainer: 'Davi', club: 'Viridian Verde' }, [davi])).toBe('VRDN4GRN');
        // mesmo nome, outro clube: não é ele
        expect(trainerCode({ trainer: 'Davi', club: 'Pallet FC' }, [davi])).toBeNull();
        // sem clube não dá pra conferir
        expect(trainerCode({ trainer: 'Davi' }, [davi])).toBeNull();
        expect(trainerCode({ trainer: 'Davi', club: 'Viridian Verde' }, null)).toBeNull();
    });

    it('code null (a pessoa não tem cartão) e nome padrão nunca viram um amigo seu com o mesmo nome', () => {
        expect(trainerCode({ trainer: 'Davi', club: 'Viridian Verde', code: null }, [davi])).toBeNull();
        const padrao = { ...davi, code: 'PLLT4FCX', trainer: 'Treinador', club: 'Pallet FC' };
        expect(trainerCode({ trainer: 'Treinador', club: 'Pallet FC' }, [padrao])).toBeNull();
    });

    it('quem não é amigo abre só com nome e clube, pedindo amizade pelo código (nunca o id da conta)', () => {
        const info = strangerInfo(
            { trainer: 'Gary', club: 'Pallet Rival', club_tag: 'RIV', club_color: 'roxo' },
            'CHAR2ZRD',
        );
        expect(info).toMatchObject({ name: 'Gary', clubName: 'Pallet Rival', clubTag: 'RIV', code: 'CHAR2ZRD' });
        expect(info.bare).toBe(true);
        expect(info.other).toBe(true);
        expect(info.id).toBeUndefined();
        expect(info.cards).toEqual([]);
    });

    /** O que o perfil_publico manda pra quem não é amigo: a vitrine sem a foto (o banco já tirou). */
    const vitrine = {
        name: 'Gary',
        avatarGoogle: false,
        trainer: 'blue',
        titleId: 'campeao',
        clubName: 'Pallet Rival',
        clubTag: 'RIV',
        clubColor: 0x8e44ad,
        crestShape: 'diamante',
        showcase: ['m:campeao:3'],
        numbers: { matches: 92, wins: 61, goals: 288, titles: 4, perfect: 1, bestStreak: 5, duelWins: 9, played: 88 },
        hall: [],
    };
    const gary = { trainer: 'Gary', club: 'Pallet Rival', code: 'CHAR2ZRD' };
    const real = friends();
    afterEach(() => {
        setFriendsServer(real);
        usePlayerCard.getState().close();
    });

    it('com o perfil público, abre o cartão completo com os números, o Pikachu no lugar da foto e o pedir amizade', () => {
        const info = strangerInfo(gary, 'CHAR2ZRD', vitrine);
        expect(info.bare).toBeUndefined();
        expect(info.stranger).toBe(true);
        expect(info.other).toBe(true);
        expect(info).toMatchObject({ name: 'Gary', trainer: 'blue', clubTag: 'RIV', code: 'CHAR2ZRD' });
        expect(info.look.shape).toBe('diamante');
        expect(info.showcase).toHaveLength(1);
        expect(info.friend?.numbers?.titles).toBe(4);
        expect(info.avatar).toEqual({ src: 'assets/avatars/25.gif', google: false });
        expect(info.id).toBeUndefined();
    });

    it('vitrine com lixo não passa: foto sem a marca de Google, número absurdo e personagem inventado', () => {
        const info = strangerInfo(gary, 'CHAR2ZRD', {
            ...vitrine,
            avatar: 'https://lh3.googleusercontent.com/x',
            trainer: '../evil',
            numbers: { titles: -5, matches: 1e99 },
        });
        expect(info.avatar.google).toBe(false);
        expect(info.trainer).toBe('red');
        expect(info.friend?.numbers?.titles).toBe(0);
        expect(info.friend?.numbers?.matches).toBe(1e7);
    });

    it('a chamada falha ou não vem nada (prévia sem a migração): volta pro cartão só com nome e clube', async () => {
        setFriendsServer({
            publicProfile: async () => {
                throw new Error('function perfil_publico does not exist');
            },
        } as unknown as FriendsServer);
        await openTrainer(gary);
        expect(usePlayerCard.getState().info).toMatchObject({ name: 'Gary', bare: true, code: 'CHAR2ZRD' });

        setFriendsServer({ publicProfile: async () => null } as unknown as FriendsServer);
        await openTrainer(gary);
        expect(usePlayerCard.getState().info?.bare).toBe(true);

        setFriendsServer({ publicProfile: async () => vitrine } as unknown as FriendsServer);
        await openTrainer(gary);
        expect(usePlayerCard.getState().info?.stranger).toBe(true);
    });
});
