import { describe, expect, it, vi } from 'vitest';
import { createSpeciesAnims } from './animation-manager';

describe('animações dos sprites', () => {
    it('sem a folha carregada não cria nada (a animação vazia ficava guardada e quebrava o play)', () => {
        const created = new Set<string>();
        const create = vi.fn((c: { key: string }) => created.add(c.key));
        let loaded = false;
        const scene = {
            textures: { exists: () => loaded },
            anims: { exists: (k: string) => created.has(k), create },
        } as unknown as Parameters<typeof createSpeciesAnims>[0];
        createSpeciesAnims(scene, 25);
        expect(create).not.toHaveBeenCalled();
        loaded = true;
        createSpeciesAnims(scene, 25);
        expect(create).toHaveBeenCalled();
        expect(created.has('25/Idle/0')).toBe(true);
    });
});
