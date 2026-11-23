/**
 * Álbum inteiro: um vídeo por faixa + álbum completo com capítulos + descricao.txt do YouTube.
 *   scripts/pesado.sh node scripts/visualizer/album.mjs tracks.json [--saida pasta] [--inicio 20 --dur 30]
 * tracks.json: ver tracks.example.json (a ordem do arquivo é a ordem do álbum). Faixa já renderizada é reaproveitada.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { renderClipe } from './clipe.mjs';
import { renderFaixa } from './render.mjs';

const [lista, ...r] = process.argv.slice(2);
const o = (k, d) => { const i = r.indexOf(`--${k}`); return i < 0 ? d : r[i + 1]; };
const saida = o('saida', `${homedir()}/Vídeos/soccermon-album/vol1`).replace(/^~/, homedir());
const cfg = JSON.parse(readFileSync(lista, 'utf8'));
const dir = cfg.wavs.replace(/^~/, homedir());
mkdirSync(`${saida}/faixas`, { recursive: true });
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const arqs = [];
const caps = [];
let t = 0;
for (const [i, f] of cfg.faixas.entries()) {
    const n = i + 1, out = `${saida}/faixas/${String(n).padStart(2, '0')}-${f.arquivo.replace(/\.wav$/, '')}.mp4`;
    if (!existsSync(out) && f.cena) await renderClipe({ wav: `${dir}/${f.arquivo}`, cena: f.cena, bpm: f.bpm, titulo: f.titulo, n, saida: out, trechos: o('trechos', '') });
    else if (!existsSync(out)) await renderFaixa({ wav: `${dir}/${f.arquivo}`, titulo: f.titulo, n, saida: out, inicio: Number(o('inicio', 0)), dur: Number(o('dur', 0)) });
    arqs.push(out);
    caps.push(`${mmss(t)} ${f.titulo}`);
    t += dur(out);
    console.log(`faixa ${n}: ${f.titulo}`);
}
writeFileSync(`${saida}/lista.txt`, arqs.map((a) => `file '${a.replace(/'/g, "'\\''")}'`).join('\n'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${saida}/lista.txt`, '-c', 'copy', `${saida}/album-completo.mp4`]);
// ponytail: capítulo 1 tem que começar em 0:00 (regra do YouTube); aqui sempre começa.
writeFileSync(`${saida}/descricao.txt`, `Soccermon Songs vol. 1

A trilha sonora do Soccermon, o jogo de navegador de futsal com draft roguelike. Jogue de graça em https://soccermon.com

Faixas
${caps.join('\n')}

Música composta e produzida por Miguel Cunha (soccermon.com).
Projeto de fã, sem fins lucrativos.

#Soccermon #SoccermonSongs #OST #GameMusic #ChiptuneFunk
`);
console.log(`ok: ${saida}/album-completo.mp4 (${mmss(t)}) e descricao.txt`);
