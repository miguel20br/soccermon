import { describe, expect, it } from 'vitest';
import { pt } from '../../i18n/pt';
import { CONNECT_GIVEUP_MS, cupInviteShown, duelUtOn, entryCoach, roomBarShown, roomLooksClosed } from './link';

describe('duelUtOn', () => {
    it('liga pra todo mundo; na prévia ?lab=duelo-ut-off esconde na aba', () => {
        expect(duelUtOn(false, '', null)).toBe(true);
        expect(duelUtOn(true, '', null)).toBe(true);
        expect(duelUtOn(true, '?lab=duelo-ut', null)).toBe(true);
        expect(duelUtOn(true, '?duelo=ABC', '1')).toBe(true);
        expect(duelUtOn(true, '?lab=duelo-ut-off', '1')).toBe(false);
    });
});

describe('roomLooksClosed', () => {
    it('espera o anfitrião até o limite e só então oferece a saída', () => {
        expect(roomLooksClosed('connecting', 0)).toBe(false);
        expect(roomLooksClosed('connecting', CONNECT_GIVEUP_MS - 1)).toBe(false);
        expect(roomLooksClosed('connecting', CONNECT_GIVEUP_MS)).toBe(true);
    });
    it('sem canal (left) a saída aparece na hora', () => {
        expect(roomLooksClosed('left', 0)).toBe(true);
    });
});

describe('entryCoach', () => {
    it('quem vai criar a sala vê o balão; quem chegou pelo convite não (ele não cria sala nenhuma)', () => {
        expect(entryCoach(null)).toBe('duelo');
        expect(entryCoach('K7M2QX')).toBeNull();
    });
});

describe('roomBarShown', () => {
    it('no resultado a linha da sala sai: só Revanche e Voltar ao início', () => {
        expect(roomBarShown('done')).toBe(false);
        expect(roomBarShown('match')).toBe(true);
        expect(roomBarShown('preview')).toBe(true);
    });
});

describe('nome dos modos do Duelo', () => {
    // o bloco dizia "Pacotes" e o "?" e a sala, "Cada um com seus pacotes": agora um nome só, de `duel.modes`
    it('Pacotes tem um nome só, em todo lugar', () => {
        expect(pt.duel.modes.pacotes[0]).toBe('Pacotes');
        expect(JSON.stringify(pt.duel)).not.toContain('Cada um com seus pacotes');
        expect('modeShort' in pt.duel).toBe(false);
    });
});

describe('cupInviteShown (convite pra montar o time no fim do Duelo)', () => {
    const novo = { run: null, parkedRuns: [], records: { cups: 0 }, daily: [] };
    it('aparece pro convidado que nunca jogou uma copa, com a série acabada', () => {
        expect(cupInviteShown('guest', true, novo)).toBe(true);
    });
    it('não aparece pro anfitrião nem no meio do melhor de 3', () => {
        expect(cupInviteShown('host', true, novo)).toBe(false);
        expect(cupInviteShown('guest', false, novo)).toBe(false);
    });
    it('não aparece pra quem já tem copa no save: aberta, guardada, terminada ou Copa do Dia', () => {
        expect(cupInviteShown('guest', true, { ...novo, run: {} })).toBe(false);
        expect(cupInviteShown('guest', true, { ...novo, parkedRuns: [{}] })).toBe(false);
        expect(cupInviteShown('guest', true, { ...novo, records: { cups: 1 } })).toBe(false);
        expect(cupInviteShown('guest', true, { ...novo, daily: [{}] })).toBe(false);
    });
});
