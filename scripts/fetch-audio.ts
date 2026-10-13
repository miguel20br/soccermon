/**
 * Gritos (legacy 8-bit da Gen 1 + latest) do PokeAPI/cries e partículas de efeito do Pokémon Showdown.
 * Tudo é hospedado localmente (sem hotlink).
 * Uso: npm run assets:audio
 */
import { downloadAll, ids151 } from './lib/download';

const CRIES = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';
const FX = 'https://play.pokemonshowdown.com/fx';

// Partículas usadas pelos efeitos de golpe (game/move-fx.ts). Faltas são toleradas: o efeito cai num círculo colorido.
export const FX_NAMES = [
    'fireball',
    'bluefireball',
    'electroball',
    'lightning',
    'shadowball',
    'energyball',
    'leaf1',
    'leaf2',
    'petal',
    'waterwisp',
    'mudwisp',
    'poisonwisp',
    'wisp',
    'iceball',
    'icicle',
    'rock1',
    'rock2',
    'rock3',
    'impact',
    'hitmarker',
    'fist',
    'foot',
    'sword',
    'feather',
    'mistball',
    'web',
    'shine',
    'heart',
    'angry',
];

const cryJobs = ids151.flatMap((id) => [
    { url: `${CRIES}/legacy/${id}.ogg`, dest: `public/assets/cries/legacy/${id}.ogg` },
    { url: `${CRIES}/latest/${id}.ogg`, dest: `public/assets/cries/latest/${id}.ogg` },
]);
const fxJobs = FX_NAMES.map((name) => ({ url: `${FX}/${name}.png`, dest: `public/assets/fx/${name}.png` }));

const failedCries = await downloadAll(cryJobs);
const failedFx = await downloadAll(fxJobs, 4);
console.log(
    `cries: ${cryJobs.length - failedCries.length}/${cryJobs.length} · fx: ${fxJobs.length - failedFx.length}/${fxJobs.length}`,
);
if (failedFx.length)
    console.warn(
        'fx ausentes (ok, usam fallback):',
        failedFx.map((u) => u.split('/').pop()),
    );
if (failedCries.length) {
    console.error('gritos que falharam:', failedCries);
    process.exit(1);
}
