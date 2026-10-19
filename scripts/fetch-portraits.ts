/**
 * Retratos (o "rostinho" 40×40) do PMDCollab/SpriteCollab (CC BY-NC 4.0), usados na faixa de gol/defesa da partida e
 * nos emotes do Duelo (o capitão com a cara do emote). Baixa o Normal e, quando existe, cada emoção abaixo.
 *
 * Saídas:
 *   public/assets/portraits/{id}.png, {id}-happy.png, {id}-determined.png, {id}-joyous.png...
 *   src/data/portraits.json   quais emoções existem por espécie
 *   CREDITS-PORTRAITS.md      autores por Pokémon (crédito obrigatório da licença)
 *
 * Uso: npm run assets:portraits
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import pokemon from '../src/data/pokemon.json' with { type: 'json' };
import { fetchBuffer, fetchText, ids151, pmdCreditNames } from './lib/download';

const REPO = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait';
const OUT = 'public/assets/portraits';
const EMOTIONS = [
    ['Happy', 'happy'],
    ['Determined', 'determined'],
    // emotes do Duelo (src/ui/duel/Emotes.tsx)
    ['Joyous', 'joyous'],
    ['Surprised', 'surprised'],
    ['Sigh', 'sigh'],
    ['Inspired', 'inspired'],
    ['Shouting', 'shouting'],
    ['Crying', 'crying'],
    ['Angry', 'angry'],
] as const;

await mkdir(OUT, { recursive: true });
const pad = (id: number) => String(id).padStart(4, '0');
const index: Record<number, string[]> = {};
const credits: string[] = [];
const missing: number[] = [];

async function grab(id: number, file: string, dest: string): Promise<boolean> {
    if (existsSync(dest)) return true;
    const buf = await fetchBuffer(`${REPO}/${pad(id)}/${file}.png`);
    if (!buf) return false;
    await writeFile(dest, buf);
    return true;
}

const NAMES = await pmdCreditNames();

let next = 0;
async function worker() {
    while (next < ids151.length) {
        const id = ids151[next++];
        if (!(await grab(id, 'Normal', `${OUT}/${id}.png`))) {
            missing.push(id);
            continue;
        }
        const has: string[] = [];
        for (const [file, key] of EMOTIONS) {
            if (await grab(id, file, `${OUT}/${id}-${key}.png`)) has.push(key);
        }
        index[id] = has;
        const txt = await fetchText(`${REPO}/${pad(id)}/credits.txt`);
        const authors = [
            ...new Set(
                (txt ?? '')
                    .split('\n')
                    .map((l) => l.split('\t')[1]?.trim())
                    .filter((a): a is string => Boolean(a))
                    .map((a) => NAMES.get(a) ?? a),
            ),
        ];
        const name = (pokemon as { id: number; name: string }[]).find((p) => p.id === id)?.name ?? `#${id}`;
        credits[id] = `- #${id} ${name}: ${authors.join(', ') || 'PMDCollab'}`;
    }
}
await Promise.all(Array.from({ length: 8 }, worker));

await writeFile('src/data/portraits.json', `${JSON.stringify(index)}\n`);
await writeFile(
    'CREDITS-PORTRAITS.md',
    [
        '# Retratos',
        '',
        'Retratos de [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licença',
        '[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Usados sem alteração.',
        '',
        ...credits.filter(Boolean),
        '',
    ].join('\n'),
);
console.log(`retratos: ${Object.keys(index).length}/151`);
if (missing.length) console.error('sem retrato:', missing.join(', '));
