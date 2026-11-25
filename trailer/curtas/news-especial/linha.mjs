// Soccermon News: edição especial Time Ultimate (25/11, a partir do News #2): a linha do tempo inteira sai daqui. O index.html lê o especial-falas.js (window.LINHA) e a
// música (scripts/musica/pecas/especial-bancada.mjs) importa este módulo, então a cena, os blips e a trilha não desencontram.
//   node trailer/curtas/news-especial/linha.mjs <pasta>   → <pasta>/especial-falas.js e <pasta>/especial-voz.wav (os blips)
// Regra de leitura (v9): a caixa digita 1 letra a cada 25 ms (2x a v8) e segura 0,15 s depois de pontuação no meio da
// frase; cada fala fica no mínimo 2,7 s na tela contando a digitação e no mínimo 1,8 s inteira depois de digitar; a
// caixa tem a largura toda (~55 letras em 2 linhas), então quase toda fala é 1 página só (a que não cabe vira 2: a de
// antes fica inteira 1,2 s). Cada bloco novo (manchete nova) começa na batida (0,5 s, 120 BPM) e o texto entra 0,3 s
// depois da manchete.
// v10, a regra de ritmo do Miguel: "texto, coisinha, texto". Entre os blocos de fala entra um beat visual (BEATS) de 0,8 a
// 1,5 s sem texto nenhum: a caixa fecha, a manchete sai e só fica a imagem (uma reação, uma gag ou a transição).
// v11: o gancho passa de 2 s pra 2,5 s (a manchete maior); todo o resto anda junto +0,5 s, sem cortar fala nem pausa.
import { readFileSync, writeFileSync } from 'node:fs';

export const DT = 0.025;
export const PAUSA = 0.15;
export const MINIMO = 2.7; // a fala inteira na tela, contando a digitação
export const CHEIA = 1.8; // inteira, depois de digitar
export const PAGINA = 1.2;
export const RESPIRO = 0.3;
export const TROCA = 0.1;
const BATIDA = 0.5;
const SAIDA_ = 0.25; // = SAIDA (o gancho termina 0,25 s antes, pra o vídeo sair seco na vinheta)
const r3 = (x) => +x.toFixed(3);

let t = 0;
/** Instantes marcados (s). */
export const M = {};
/** Os blocos: { nome, manchete, s }. */
export const BLOCOS = [];
/** Os beats sem texto: { nome, s, z, oque }. */
export const BEATS = [];
/** As falas: { id, quem, rostos: [[t, rosto]], s, a, z, paginas: [{ texto, ini, chars, fim, ate }] }. */
export const FALAS = [];

const fechaBeat = () => {
    const b = BEATS.at(-1);
    if (b && b.z == null) b.z = r3(t);
};
function bloco(nome, manchete) {
    t = Math.ceil(t / BATIDA - 1e-6) * BATIDA;
    fechaBeat();
    BLOCOS.push({ nome, manchete, s: r3(t) });
    M[nome] = r3(t);
}
function digita(texto, t0) {
    const cs = Array.from(texto);
    let u = t0;
    const chars = cs.map((c, i) => {
        const at = r3(u);
        u += DT + (/[!,.?:…]/.test(c) && i > 0 && i < cs.length - 1 && cs[i + 1] === ' ' ? PAUSA : 0);
        return at;
    });
    return { chars, fim: r3(u) };
}
/** Uma fala: `rosto` é o retrato do PMD, ou [[rosto, letra], ...] pra trocar a expressão no meio (na letra n da 1ª página). */
function fala(id, quem, rosto, texto, { manchete = false } = {}) {
    fechaBeat();
    const s = t;
    let a = s + (manchete ? RESPIRO : TROCA);
    const pgs = [texto].flat();
    const paginas = pgs.map((tx, k) => {
        const { chars, fim } = digita(tx, a);
        const ate = r3(k === pgs.length - 1 ? Math.max(fim + CHEIA, s + (manchete ? RESPIRO : TROCA) + MINIMO) : fim + PAGINA);
        const p = { texto: tx, ini: r3(a), chars, fim, ate };
        a = ate + TROCA;
        return p;
    });
    const rostos = typeof rosto === 'string' ? [[paginas[0].ini, rosto]] : rosto.map(([r, n]) => [paginas[0].chars[n], r]);
    const f = { id, quem, rostos, s: r3(s), a: paginas[0].ini, z: paginas.at(-1).ate, paginas };
    FALAS.push(f);
    M[id] = f.s;
    t = f.z;
    return f;
}
const pausa = (nome, d) => {
    M[nome] = r3(t);
    t += d;
};
/** Um beat sem texto de `d` s (o bloco seguinte ainda pode esticar até a batida). */
const beat = (nome, d, oque) => {
    fechaBeat();
    BEATS.push({ nome, s: r3(t), z: null, oque });
    M[nome] = r3(t);
    t += d;
};
/** Quando aparece a 1ª letra de `trecho` na fala (procura em todas as páginas). */
export const letra = (f, trecho) => {
    for (const p of f.paginas) {
        if (p.texto.includes(trecho)) return p.chars[Array.from(p.texto.slice(0, p.texto.indexOf(trecho))).length];
    }
    throw new Error(`"${trecho}" não está na fala ${f.id}`);
};

// ===================== o roteiro (edição especial Time Ultimate, roteiro v1 aprovado em 23/11: falas exatas) =====================
// sem manchete no gancho: só o clipe do jogo (o pacote rasgando e o clarão dourado do walkout), corte seco na vinheta
bloco('gancho', null);
t += 2.0;
bloco('vinheta', null);
t += 2.5; // a vinheta C, com a faixa EDIÇÃO ESPECIAL no lugar do #2
bloco('abertura', 'O TIME ULTIMATE ABRIU');
const f1 = fala('f1', 'raichu', '26-happy', ['Boa noite. Hoje à meia-noite,', 'o novo modo Time Ultimate finalmente abriu.'], { manchete: true });
bloco('escalada', 'HOJE NO SOCCERMON NEWS');
export const CARTELAS = [0, 1, 2, 3].map((k) => r3(t + 0.4 + 0.9 * k)); // a vinheta curta abre (0,4 s), 4 cartelas de 0,9 s
t += 4.0;
bloco('plantao', 'PLANTÃO');
const f4 = fala('f4', 'raichu', '26', 'No Time Ultimate, as cartas que você abre ficam no seu clube.', { manchete: true });
const f5 = fala('f5', 'machoke', '67-surprised', 'Então eu não volto pro mato depois da copa?');
const f6 = fala('f6', 'raichu', '26-happy', 'Não volta.');
beat('bChoro', 1.5, 'o Machoke de perto: os olhos enchem d\'água e ele abraça a carta dele (retrato emocionado, sem caixa)');
beat('bRua', 0.8, 'a câmera vai pra Loja: o telão chia e abre no Meowth acenando');
bloco('aovivo', 'AO VIVO');
const f8 = fala('f8', 'raichu', '26', 'Ao vivo da Loja, nosso repórter Meowth.', { manchete: true });
const f9 = fala('f9', 'meowth', '52-happy', 'Boa noite! Estou aqui com o meu primeiro pacote.');
beat('bKarp1', 1.0, 'o pacote rasga (clipe do jogo) e sai um Magikarp bronze: a carta pousa');
const f10 = fala('f10', 'meowth', '52-sigh', '…Esse é o Magikarp.');
beat('bKarp2', 1.1, 'o 2º pacote: outro Magikarp, o selo REPETIDA carimba');
const f11 = fala('f11', 'meowth', '52-determined', 'Vendo por Fichas.');
bloco('materia', 'OS 8 LÍDERES');
const f12 = fala('f12', 'machoke', '67-determined', 'E dá pra enfrentar os oito líderes de Kanto.', { manchete: true });
bloco('vemai', 'VEM AÍ');
const f13 = fala('f13', 'raichu', '26-inspired', ['No dia 15 teremos o evento de Natal,', 'pois as cartas Evento de gelo irão chegar aos pacotes.'], { manchete: true });
beat('bNeve', 0.7, 'a carta Evento de gelo na neve');
const f14 = fala('f14', 'raichu', '26-happy', 'Boa noite, e bons pacotes.');
M.fecha = f14.s;
bloco('final', null);
t += 2.4; // a tela final: no máximo ~2,5 s, com movimento até o fim
fechaBeat();
export const FIM = r3(t);

// ===================== os instantes de cada animação (a cena e a música usam os mesmos) =====================
M.ut = letra(f1, 'Time'); // o adesivo TIME ULTIMATE carimba no telão
M.abriu = letra(f1, 'abriu');
M.clube = r3(letra(f4, 'cartas') - 0.15); // o corte pro VT do Clube
M.mato = letra(f5, 'mato');
M.naoVolta = f6.a;
M.lagrima = r3(M.bChoro + 0.25);
M.abraco = r3(M.bChoro + 0.6);
M.cheia = f9.s; // o Meowth em tela cheia, na Loja, com o clipe do pacote do lado
M.rasga = r3(letra(f9, 'pacote'));
M.karp1 = r3(M.bKarp1 + 0.3); // a 1ª carta pousa
M.karp2 = r3(M.bKarp2 + 0.35); // a 2ª carta pousa
M.repetida = r3(M.bKarp2 + 0.7); // o selo REPETIDA carimba
M.fichas = letra(f11, 'Fichas'); // a carta voa pra trás
M.insig = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => r3(letra(f12, 'enfrentar') + 0.22 * k)); // as 8 insígnias acendendo
M.natal = letra(f13, 'Natal');
M.gelo = letra(f13, 'gelo');
M.boaNoite = f14.a;
export const VARRIDAS = [M.escalada, M.vemai];
export const CORTES = [M.vinheta, M.abertura, M.plantao, M.clube, M.bRua, M.cheia, M.materia, M.vemai, M.final];
/** Os clipes do jogo (gravados headless da v010): o instante, dentro de cada arquivo, do momento que a fala marca. */
export const CLIPES = {
    // o gancho: o pacote rasgando e o clarão dourado do walkout, montado em gancho.mp4 (corte seco na vinheta: sem SAIDA)
    'v-gancho': { arq: 'midia/ut/gancho.mp4', s: 0, z: M.vinheta - SAIDA_, marca: 0, noClipe: 0 },
    // o Meowth rasga o pacote: o clipe abre na tela cheia com o pacote brilhando (PAC_LEAD quadros de vai e volta) e o
    // arrasto (quadro 18 da gravação) cai no começo do bKarp1
    'v-pacote': { arq: 'midia/ut/pacote.mp4', s: M.cheia, z: M.karp1, marca: M.cheia, noClipe: 0 },
    // a Batalha de Treinador contra o Brock: o VERSUS e o começo da partida
    'v-brock': { arq: 'midia/ut/brock.mp4', s: M.materia, z: M.vemai, marca: M.materia, noClipe: 0 },
};

/** Quadros de vai e volta do pacote fechado antes da gravação (clipes.mjs monta o pacote.mp4 com eles). */
export const PAC_LEAD = Math.round((M.bKarp1 - M.cheia) * 30) - 18;

/** As trocas de cena e os painéis levam 0,25 s (o clipe do EP 2 fica no ar até a troca terminar). */
export const SAIDA = 0.25;
export const LINHA = { FIM, M, BLOCOS, BEATS, FALAS, CARTELAS, VARRIDAS, CORTES, CLIPES, DT, SAIDA };

// ===================== os blips (um por letra, baixinhos, um tom por personagem) =====================
if (import.meta.url === `file://${process.argv[1]}`) {
    const OUT = `${process.argv[2] ?? '.'}/`;
    writeFileSync(`${OUT}especial-falas.js`, `window.LINHA = ${JSON.stringify(LINHA)};\n`);
    // as durações fixas do index.html (o HyperFrames lê os data-* antes do script): o vídeo e os clipes do jogo
    const html = new URL('./index.html', import.meta.url);
    const r2 = (x) => String(+x.toFixed(2));
    let h = readFileSync(html, 'utf8');
    h = h.replace(/data-duration="[\d.]+"/g, (m, i) => (/<video id="v-/.test(h.slice(Math.max(0, i - 200), i)) ? m : `data-duration="${r2(FIM)}"`));
    for (const [id, c] of Object.entries(CLIPES))
        h = h.replace(new RegExp(`(<video id="${id}"[^>]*?)data-start="[\\d.]+" data-duration="[\\d.]+" data-media-start="[\\d.]+"`), `$1data-start="${r2(c.s)}" data-duration="${r2(c.z - c.s + SAIDA)}" data-media-start="${r2(Math.max(0, c.noClipe - (c.marca - c.s)))}"`);
    writeFileSync(html, h);
    const { blipMachoke, blipMeowth, blipRaichu } = await import('../../../scripts/musica/curtas.mjs');
    const { SR, Song } = await import('../../../scripts/musica/synth.mjs');
    const S = new Song({ bpm: 120, bars: Math.ceil(FIM / 2), tail: 1 });
    const BLIP = {
        raichu: S.part('raichu', blipRaichu, { drum: true, gain: 0.32, pan: -0.1 }),
        machoke: S.part('machoke', blipMachoke, { drum: true, gain: 0.42, pan: 0.1 }),
        meowth: S.part('meowth', blipMeowth, { drum: true, gain: 0.3, pan: 0.05 }),
    };
    // o desenho de 7 alturas (pra não virar metralhadora); no "Temos que chutar!" os cinco juntos, mais baixinhos
    const DESENHO = [0, 2, 0, -1, 2, 0, -2];
    for (const f of FALAS) {
        const quem = f.quem === 'todos' ? ['raichu', 'machoke', 'meowth'] : [f.quem];
        for (const p of f.paginas)
            Array.from(p.texto).forEach((c, i) => {
                if (!/[\p{L}\p{N}₽]/u.test(c)) return;
                for (const q of quem) BLIP[q].note(p.chars[i] * 8, DESENHO[i % DESENHO.length], 0, (i % 2 ? 0.85 : 1) * (quem.length > 1 ? 0.6 : 1));
            });
    }
    // o WAV linear, sem normalizar (o writeWav do synth satura no tanh): o blip sai limpo e no volume daqui
    const [L, R] = S.render();
    const n = Math.min(L.length, Math.ceil(FIM * SR));
    const wav = Buffer.alloc(44 + n * 4);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(36 + n * 4, 4);
    wav.write('WAVEfmt ', 8);
    for (const [v, o, b] of [[16, 16, 4], [1, 20, 2], [2, 22, 2], [SR, 24, 4], [SR * 4, 28, 4], [4, 32, 2], [16, 34, 2]]) b === 4 ? wav.writeUInt32LE(v, o) : wav.writeUInt16LE(v, o);
    wav.write('data', 36);
    wav.writeUInt32LE(n * 4, 40);
    const q = (x) => Math.max(-32768, Math.min(32767, Math.round(x * 32767)));
    for (let i = 0; i < n; i++) {
        wav.writeInt16LE(q(L[i]), 44 + i * 4);
        wav.writeInt16LE(q(R[i]), 46 + i * 4);
    }
    writeFileSync(`${OUT}especial-voz.wav`, wav);
    for (const b of BLOCOS) console.log(String(b.s).padStart(7), b.nome, b.manchete ?? '');
    for (const b of BEATS) console.log(String(b.s).padStart(7), 'beat', b.nome.padEnd(9), `${b.s}–${b.z} (${(b.z - b.s).toFixed(2)} s)`, b.oque);
    for (const f of FALAS) console.log(String(f.s).padStart(7), f.id.padEnd(4), f.quem.padEnd(8), `${f.a}–${f.z}`, f.paginas.map((p) => `[${p.fim}]`).join(''));
    console.log('FIM', FIM);
}
