import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({ get: async () => undefined, set: async () => {}, del: async () => {} }));

import { useGame } from '../store/game-store';
import {
    type FriendRow,
    type FriendsServer,
    formatFriendCode,
    groupFriends,
    isFriendCode,
    normalizeFriendCode,
    sendPendingChallenge,
    setFriendsServer,
    useFriends,
} from './api';

const row = (trainer: string, status: FriendRow['status'], room?: string, roomAt?: number): FriendRow => ({
    code: `${trainer.toUpperCase().slice(0, 4).padEnd(4, 'X')}2345`,
    trainer,
    club: 'Pallet FC',
    club_tag: 'PAL',
    club_color: 'vermelho',
    status,
    since: new Date(0).toISOString(),
    room: room ?? null,
    room_at: roomAt === undefined ? null : new Date(roomAt).toISOString(),
});

describe('código de amigo', () => {
    it('aceita o que a pessoa digita (minúscula, espaço, traço) e recusa letra que não existe', () => {
        expect(normalizeFriendCode(' k7m2-qxab ')).toBe('K7M2QXAB');
        expect(isFriendCode(normalizeFriendCode('k7m2 qxab'))).toBe(true);
        // I, O, 0 e 1 ficam fora (confundem ao ditar), igual à sala do Duelo
        expect(isFriendCode('K7M2QXA0')).toBe(false);
        expect(isFriendCode('K7M2QXAI')).toBe(false);
        expect(isFriendCode('K7M2QXA')).toBe(false);
        expect(normalizeFriendCode('K7M2QXAB99')).toHaveLength(8);
        expect(formatFriendCode('K7M2QXAB')).toBe('K7M2 QXAB');
    });
});

describe('lista de amigos', () => {
    const now = Date.parse('2026-10-19T20:00:00Z');
    const min = 60_000;
    it('separa em grupos, em ordem de nome', () => {
        const g = groupFriends(
            [
                row('Davi', 'amigo'),
                row('Ana', 'amigo'),
                row('Bia', 'recebido'),
                row('Lu', 'enviado'),
                row('Zé', 'bloqueado'),
            ],
            now,
        );
        expect(g.friends.map((r) => r.trainer)).toEqual(['Ana', 'Davi']);
        expect(g.received.map((r) => r.trainer)).toEqual(['Bia']);
        expect(g.sent.map((r) => r.trainer)).toEqual(['Lu']);
        expect(g.blocked.map((r) => r.trainer)).toEqual(['Zé']);
        expect(g.challenges).toEqual([]);
    });
    it('quem está online vem primeiro', () => {
        const g = groupFriends(
            [row('Ana', 'amigo'), { ...row('Zé', 'amigo'), online: true }, row('Bia', 'amigo')],
            now,
        );
        expect(g.friends.map((r) => r.trainer)).toEqual(['Zé', 'Ana', 'Bia']);
    });
    it('desafio vale 15 minutos: o mais novo primeiro, o vencido some (sala e botão Entrar)', () => {
        const g = groupFriends(
            [
                row('Davi', 'amigo', 'K7M2QX', now - 2 * min),
                row('Ana', 'amigo', 'ABCDEF', now - 1 * min),
                row('Gabi', 'amigo', 'GHJKLM', now - 16 * min),
            ],
            now,
        );
        expect(g.challenges.map((r) => r.trainer)).toEqual(['Ana', 'Davi']);
        expect(g.friends.find((r) => r.trainer === 'Gabi')?.room).toBeNull();
        expect(g.friends.find((r) => r.trainer === 'Davi')?.room).toBe('K7M2QX');
    });
});

describe('Desafiar', () => {
    it('o amigo escolhido sobrevive à troca pro Duelo, o convite sai com a sala e a resposta fica pra sala mostrar', async () => {
        const sent: string[] = [];
        let answer = 'enviado';
        setFriendsServer({
            challenge: async (code: string, room: string) => {
                sent.push(`${code}:${room}`);
                return answer;
            },
        } as unknown as FriendsServer);
        const gabriel = { code: 'PWTR7RCK', trainer: 'Gabriel' };
        useGame.getState().go('profile');
        useFriends.setState({ challenging: gabriel });
        useGame.getState().go('duel');
        // a troca de tela chega depois do resto do estado: antes, isso apagava o amigo e o convite nunca saía
        expect(useFriends.getState().challenging).toEqual(gabriel);
        expect(await sendPendingChallenge('K7M2QX')).toBe('enviado');
        expect(sent).toEqual(['PWTR7RCK:K7M2QX']);
        expect(useFriends.getState().challengeSent).toEqual({ trainer: 'Gabriel', status: 'enviado' });
        // resposta estranha do servidor vira 'offline' (a sala pede o link)
        answer = 'precisa_conta';
        useFriends.setState({ challenging: gabriel });
        expect(await sendPendingChallenge('ABCDEF')).toBe('offline');
        // saiu do Duelo: nada fica pendurado
        useFriends.setState({ challenging: gabriel });
        useGame.getState().go('home');
        expect(useFriends.getState().challenging).toBeNull();
        expect(useFriends.getState().challengeSent).toBeNull();
    });
});
