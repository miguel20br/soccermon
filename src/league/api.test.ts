import { describe, expect, it } from 'vitest';
import { useCloud } from '../cloud/cloud';
import { DEFAULT_PROFILE, trainerNameOf } from '../store/profile';
import { trainerLabel } from '../ui/profile/club';
import { publicInfo, squadOf } from './api';

describe('squadOf (time no ranking)', () => {
    it('lê os 5 ids e o capitão', () => {
        expect(squadOf({ squad: [1, 4, 7, 25, 150], captain: 2 })).toEqual({ ids: [1, 4, 7, 25, 150], captain: 2 });
    });
    it('sem capitão, -1', () => {
        expect(squadOf({ squad: [1, 4, 7, 25, 150], captain: null })?.captain).toBe(-1);
        expect(squadOf({ squad: [1, 4, 7, 25, 150] })?.captain).toBe(-1);
        expect(squadOf({ squad: [1, 4, 7, 25, 150], captain: 9 })?.captain).toBe(-1);
    });
    it('linha sem time (antiga, ou servidor sem a migração) não mostra ícones', () => {
        expect(squadOf({})).toBeNull();
        expect(squadOf({ squad: null, captain: null })).toBeNull();
        expect(squadOf({ squad: [1, 2, 3], captain: 0 })).toBeNull();
        expect(squadOf({ squad: [1, 2, 3, 4, 0], captain: 0 })).toBeNull();
    });
});

describe('nome do treinador: um só em todo lugar (bug do Caio, 10/11)', () => {
    const caio = { ...DEFAULT_PROFILE, trainerName: '' };
    const login = (name: string | null) => useCloud.setState({ user: name === null ? null : { name, avatar: null } });

    it('sem nome escolhido e logado: ranking, barra e Perfil mostram o 1º nome do Google (nunca o completo)', () => {
        login('Caio Luca Silva Costa');
        expect(publicInfo(caio).trainer).toBe('Caio');
        expect(trainerLabel(caio)).toBe('Caio');
        expect(trainerLabel(caio, useCloud.getState().user?.name)).toBe('Caio');
    });

    it('nome escolhido ganha de tudo; sem conta é "Treinador"; e-mail nunca vira nome', () => {
        login('Caio Luca Silva Costa');
        expect(publicInfo({ ...caio, trainerName: ' Ash ' }).trainer).toBe('Ash');
        expect(trainerLabel({ ...caio, trainerName: 'Ash' })).toBe('Ash');
        login(null);
        expect(publicInfo(caio).trainer).toBe('Treinador');
        login('caio@gmail.com');
        expect(trainerNameOf(caio, 'caio@gmail.com')).toBe('');
        expect(publicInfo(caio).trainer).toBe('Treinador');
        login(null);
    });
});
