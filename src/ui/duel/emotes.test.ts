import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPECIES } from '../../engine/data';
import { EMOTES } from '../../net/duel-state';
import { emoteFace } from './emote-faces';

describe('emotes do Duelo', () => {
    it('todo emote de todo capitão tem rosto (a emoção que faltar cai numa parecida ou no normal)', () => {
        for (const sp of SPECIES)
            for (const k of EMOTES) expect(existsSync(`public/${emoteFace(sp.id, k)}`), `${sp.id} ${k}`).toBe(true);
        expect(emoteFace(25, 'golaco')).toBe('assets/portraits/25-joyous.png');
        // Machamp não tem nenhuma emoção: rosto normal
        expect(emoteFace(68, 'bravo')).toBe('assets/portraits/68.png');
    });
});
