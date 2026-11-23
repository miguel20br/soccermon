import { expect, it } from 'vitest';
import { mascotSrc } from './club';

it('mascote: espécie válida vira sprite; sem campo ou id estragado, nada', () => {
    expect(mascotSrc({ mascot: 25 })).toBe('assets/avatars/25.gif');
    expect(mascotSrc({})).toBeNull();
    expect(mascotSrc({ mascot: 9999 })).toBeNull();
});
