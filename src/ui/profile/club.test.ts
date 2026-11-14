import { describe, expect, it } from 'vitest';
import { peerMon } from './club';

// a sala cheia mostrava a silhueta com "?" mesmo com o rival dentro: a cena usa o Pokémon do avatar dele
describe('peerMon', () => {
    it('lê o sprite do avatar que veio do rival (normal e shiny)', () => {
        expect(peerMon({ avatar: 'assets/cards/6.gif' })).toEqual({ id: 6, shiny: false });
        expect(peerMon({ avatar: 'assets/cards/shiny/151.gif' })).toEqual({ id: 151, shiny: true });
    });
    it('foto do Google, espécie que não existe ou lixo viram o Pikachu', () => {
        for (const avatar of ['https://x/foto.jpg', 'assets/cards/999.gif', 42, undefined])
            expect(peerMon({ avatar })).toEqual({ id: 25, shiny: false });
    });
});
