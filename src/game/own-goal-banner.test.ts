import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scene = readFileSync('src/game/scenes/MatchScene.ts', 'utf8');

describe('gol contra na tela', () => {
    // playtester, 18/11: "fiz gol e o ponto foi pro rival". Sem os efeitos cinematográficos, a faixa grande dizia só
    // "GOL!" no gol contra, e a faixinha do lado mostrava o rosto do seu Pokémon no seu canto: parecia gol seu
    it('a faixa sem cinema diz GOL CONTRA, como a do cinema', () => {
        const at = scene.indexOf("case 'goal': {");
        const block = scene.slice(at, scene.indexOf('break;', scene.indexOf('this.goalBanner(', at)));
        expect(block).toMatch(/e\.ownGoal \? tr\('battle\.ownGoal'\) : tr\('battle\.goal'\)/);
        expect(block).toMatch(/this\.goalBanner\(color, e\.ownGoal \? tr\('battle\.ownGoal'\) : undefined\)/);
    });
});
