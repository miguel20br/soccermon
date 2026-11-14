import { describe, expect, it, vi } from 'vitest';
import { AGENCY, MAX_FX_PIECES } from '../engine/agency';
import { N3_LOOKS, N3_SIGS } from './n3-story';

// a tabela é pura; o Phaser só entra quando há cena (no Node ele nem carrega)
vi.mock('phaser', () => ({ default: {} }));

describe('N3 contado pelo tipo (n3-story.ts)', () => {
    it('todo efeito de tipo do N3 tem a sua história no voo (tipo novo no motor sem ela cai no Normal)', () => {
        for (const type of Object.keys(MAX_FX_PIECES)) expect(N3_LOOKS).toContain(type);
    });

    it('as 12 assinaturas têm o toque próprio (Body Slam, Hyper Beam, Metronome, Transform...)', () => {
        const sigs = Object.keys(AGENCY.maxSig);
        expect(sigs).toHaveLength(12);
        for (const sig of sigs) expect(N3_SIGS).toContain(sig);
    });
});
