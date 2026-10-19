import { describe, expect, it } from 'vitest';
import { linkConflict } from './cloud';

describe('ligar o Google na conta anônima do duelo', () => {
    it('volta do Google com "esse Google já tem conta" e só depois de pedir pra ligar', () => {
        const back =
            '?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked';
        expect(linkConflict(back, true)).toBe(true);
        expect(linkConflict(`#${back.slice(1)}`, true)).toBe(true);
        // sem ter pedido pra ligar (login normal), ou outro erro: nada de entrar de novo sozinho
        expect(linkConflict(back, false)).toBe(false);
        expect(linkConflict('?error_code=bad_oauth_state', true)).toBe(false);
        expect(linkConflict('?code=abc', true)).toBe(false);
    });
});
