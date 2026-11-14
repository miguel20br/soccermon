import { describe, expect, it } from 'vitest';
import type { FriendRow } from '../../friends/api';
import { strangerInfo, trainerCode } from './TrainerName';

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
});
