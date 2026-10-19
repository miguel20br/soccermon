// Atualiza a galeria de ícones do brand guide (index.html) a partir do mapa ICONS de src/ui/components/MatchHud.tsx
// e monta uma cópia que abre sozinha em ~/Downloads/soccermon-brand-guide/ (página + os arquivos que ela usa).
//   node docs/marca/montar.mjs            (só atualiza os ícones)
//   node docs/marca/montar.mjs --copiar   (e copia pra ~/Downloads)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '../..');
const pagina = join(aqui, 'index.html');

const hud = readFileSync(join(raiz, 'src/ui/components/MatchHud.tsx'), 'utf8');
const bloco = hud.slice(hud.indexOf('export const ICONS = {'), hud.indexOf('} as const;'));
const icones = [...bloco.matchAll(/^\s+(\w+):\s*\n?\s*'([^']+)'/gm)].map(([, nome, d]) => [nome, d]);
if (icones.length < 30) throw new Error(`só ${icones.length} ícones lidos de MatchHud.tsx`);
const galeria = icones
    .map(([nome, d]) => `<figure><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" /></svg><figcaption>${nome}</figcaption></figure>`)
    .join('');
let html = readFileSync(pagina, 'utf8');
html = html.replace(/<!-- ICONES:[^>]*-->[\s\S]*?<!-- \/ICONES -->/, `<!-- ICONES: gerado por montar.mjs -->${galeria}<!-- /ICONES -->`);
writeFileSync(pagina, html);
console.log(`ok ${icones.length} ícones`);

if (process.argv.includes('--copiar')) {
    const destino = join(homedir(), 'Downloads/soccermon-brand-guide');
    rmSync(destino, { recursive: true, force: true });
    mkdirSync(destino, { recursive: true });
    // tudo que a página usa por ../../ vai pra arquivos/, com o mesmo caminho
    const usados = [...new Set([...html.matchAll(/\.\.\/\.\.\/([^"')\s]+)/g)].map((m) => m[1]))];
    for (const c of usados) {
        mkdirSync(dirname(join(destino, 'arquivos', c)), { recursive: true });
        cpSync(join(raiz, c), join(destino, 'arquivos', c));
    }
    cpSync(join(aqui, 'telas'), join(destino, 'telas'), { recursive: true });
    cpSync(join(aqui, 'brand-guide.md'), join(destino, 'brand-guide.md'));
    writeFileSync(join(destino, 'index.html'), html.replaceAll('../../', 'arquivos/'));
    console.log(`ok ${destino} (${usados.length} arquivos)`);
}
