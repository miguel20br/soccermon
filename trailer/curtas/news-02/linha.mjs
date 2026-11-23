// Soccermon News #2 (21/11, a partir do #1 v11): a linha do tempo inteira sai daqui. O index.html lê o news-falas.js (window.LINHA) e a
// música (scripts/musica/pecas/news2-bancada.mjs) importa este módulo, então a cena, os blips e a trilha não desencontram.
//   node trailer/curtas/news-02/linha.mjs <pasta>   → <pasta>/news2-falas.js e <pasta>/news2-voz.wav (os blips)
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

// ===================== o roteiro (News #2, rascunho aprovado em 21/11: falas exatas) =====================
bloco('gancho', 'MACHOKE MAIS FORTE QUE O MACHAMP');
t += 2.5;
bloco('vinheta', null);
t += 2.5; // a vinheta de abertura (a C: a cartinha girando e virando o logo)
bloco('abertura', 'SOCCERMON NEWS #2');
const f1 = fala('f1', 'raichu', '26-happy', 'Boa noite, Kanto! Eu sou o Raichu…', { manchete: true });
const f2 = fala('f2', 'machoke', '67-happy', '…e eu sou o Machoke. Este é o Soccermon News!');
const f3 = fala('f3', 'raichu', '26-determined', 'Hoje: as novidades da semana, e mais.');
beat('bDupla', 0.95, 'a dupla se olha e acena; a câmera abre na bancada');
bloco('escalada', 'HOJE NO SOCCERMON NEWS');
export const CARTELAS = [0, 1, 2, 3].map((k) => r3(t + 0.5 + 1.25 * k)); // a vinheta curta abre (0,5 s), 4 batidas de 1,25 s
t += 5.5;
beat('bCartas', 1.0, 'de volta ao estúdio: 3 cartas viradas caem no telão e a câmera chega perto');
bloco('plantao', 'PLANTÃO');
const f4 = fala('f4', 'raichu', '26', 'Chegou um item novo: a Eviolite.', { manchete: true });
const f5 = fala('f5', 'machoke', '67-determined', 'Quem ainda pode evoluir ganha 30% em todos os atributos.');
const f6 = fala('f6', 'raichu', '26-joyous', ['A nota da carta não muda.', 'O bronze continua bronze, só joga mais.']);
const f6b = fala('f6b', 'machoke', '67-surprised', 'Peraí… eu ainda posso evoluir.');
const f6c = fala('f6c', 'raichu', '26-sigh', 'Eu não.');
// v2 (21/11): o número da notícia, conferível na tela (as cartas da galeria: o Machoke com a Eviolite chega a 99 no gol, com o ▲ roxo; o ↑93 da carta é o selo de evolução, não a Eviolite)
const f6d = fala('f6d', 'raichu', '26-determined', 'Com ela, o Machoke chega a 99 no gol. O Machamp, 91.');
beat('bRua', 1.0, 'a câmera vai pra rua: o telão chia e abre na Rota, o Meowth acena');
bloco('aovivo', 'AO VIVO');
// v5 (23/11): a matéria da quadra, contada como história: o Meowth apresenta as comemorações e o raio do Pikachu acerta ele
const f8 = fala('f8', 'raichu', '26', 'Ao vivo da quadra, nosso repórter Meowth.', { manchete: true });
const f9 = fala('f9', 'meowth', '52-happy', 'Boa noite! Cinco Pokémon ganharam comemoração de gol própria.');
const f10 = fala('f10', 'meowth', '52-joyous', 'Esse é o Magikarp.');
beat('bRaio', 1.6, 'o clipe do Pikachu: gol, o raio pro céu, e o raio sai do clipe e acerta o Meowth');
const f11 = fala('f11', 'meowth', '52-dizzy', '…e esse é o Pikachu.');
beat('bTostado', 0.8, 'o Meowth tostado, o microfone soltando fumaça');
// E MAIS: as outras novidades numa cartela, sem fala (uma linha por batida)
bloco('emais', 'E MAIS');
t += 4.6;
bloco('vemai', 'VEM AÍ');
const f15 = fala('f15', 'raichu', '26-inspired', ['Na sexta teremos um programa especial,', 'pois finalmente o novo modo Time Ultimate irá abrir.'], { manchete: true });
beat('bRola', 1.0, 'o estúdio aberto: o Machamp entra no telão e cruza os braços');
bloco('fecha', 'PRA FECHAR');
const f18 = fala('f18', 'raichu', '26-happy', 'E aí, Machoke, vai querer ser trocado?', { manchete: true });
const f18b = fala('f18b', 'machoke', '67-determined', 'Nem pensar.');
beat('bRisada', 1.0, 'a dupla se olha e ri; o Machamp vira a cara no telão');
const f19 = fala('f19', 'raichu', '26-happy', 'Obrigado pela companhia, e boa noite!');
const f20 = fala('f20', 'todos', 'todos', 'Temos que chutar!');
bloco('final', null);
t += 3.2;
fechaBeat();
export const FIM = r3(t);

// ===================== os instantes de cada animação (a cena e a música usam os mesmos) =====================
M.ver51 = f3.a; // "Hoje": o selo VERSÃO NOVA com o 0.9.53 carimba no H
M.ver52 = letra(f3, 'novidades'); // e pulsa nas "novidades"
M.vt1 = r3(letra(f4, 'item') - 0.15); // o corte pro VT da Eviolite
M.deal = [0.15, 0.4, 0.65].map((d) => r3(M.vt1 + d)); // as 3 faíscas em volta do item
M.holofote = letra(f4, 'Eviolite'); // o item cresce com o holofote
M.trofeus = [0, 1, 2, 3].map((k) => r3(letra(f5, 'evoluir') + 0.3 * k)); // as setas de evolução piscando no Caterpie
M.patro = letra(f5, '30%'); // o selo +30%
M.mais4 = [0, 1, 2, 3, 4, 5].map((k) => r3(letra(f5, 'todos') + 0.2 * k)); // as 6 barras crescendo 30%
M.nota = letra(f6, 'nota'); // o aro na nota da carta
M.bronze = letra(f6, 'bronze'); // o selo BRONZE
M.machoke = letra(f6b, 'evoluir'); // o Machoke estufa e brilha
M.euNao = f6c.a; // o Raichu de perto, sem graça
M.duelo99 = letra(f6d, '99'); // a carta do Machoke: 99 no gol, com o ▲ roxo da Eviolite
M.duelo91 = letra(f6d, '91'); // a do Machamp: 91 no gol
M.cheia = f9.s; // o corte pro Meowth em tela cheia, na quadra, com o clipe das comemorações
M.karp = letra(f10, 'Magikarp'); // no clipe: o "Mas nada aconteceu!"
M.raio = r3(M.bRaio + 1.0); // o raio do Pikachu no clipe: sai do quadro e acerta o Meowth
/** O Machoke brilha (a Eviolite) no gancho; no PRA FECHAR o Machamp se anima no "trocado". */
M.voltorbReage = [0.45, letra(f18, 'trocado')];
M.emaisL = [0, 1, 2, 3].map((k) => r3(M.emais + 0.45 + 0.85 * k)); // as 4 linhas do E MAIS
M.sextas = [0, 1, 2, 3].map((k) => r3(f15.a + 0.15 + 0.3 * k));
M.ultimate = letra(f15, 'Time');
M.bem = letra(f18b, 'pensar'); // o Machoke abraça a Eviolite
M.boaNoite = letra(f19, 'boa noite');
M.grito = [r3(f20.a + 0.3), r3(letra(f20, 'chutar') + 0.25)];
M.papeis = [r3(f19.paginas[0].fim + 0.45), r3(f19.paginas[0].fim + 0.75)];
export const VARRIDAS = [M.escalada, M.vemai];
export const CORTES = [M.vinheta, M.abertura, M.bCartas, M.vt1, M.bRua, M.cheia, M.emais, M.bRola, M.final];
/** Os clipes do jogo (gravados headless da 0.9.53): o instante, dentro de cada arquivo, do momento que a fala marca. */
export const CLIPES = {
    // v5: o Magikarp do f9 ao bRaio, o Pikachu daí até o E MAIS (o raio no M.raio); ao-vivo.mp4 é montado nesses cortes
    'v-aovivo': { arq: 'midia/news/ao-vivo.mp4', s: M.cheia, z: M.emais, marca: M.cheia, noClipe: 0 },
};

/** As trocas de cena e os painéis levam 0,25 s (o clipe do EP 2 fica no ar até a troca terminar). */
export const SAIDA = 0.25;
export const LINHA = { FIM, M, BLOCOS, BEATS, FALAS, CARTELAS, VARRIDAS, CORTES, CLIPES, DT, SAIDA };

// ===================== os blips (um por letra, baixinhos, um tom por personagem) =====================
if (import.meta.url === `file://${process.argv[1]}`) {
    const OUT = `${process.argv[2] ?? '.'}/`;
    writeFileSync(`${OUT}news2-falas.js`, `window.LINHA = ${JSON.stringify(LINHA)};\n`);
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
    writeFileSync(`${OUT}news2-voz.wav`, wav);
    for (const b of BLOCOS) console.log(String(b.s).padStart(7), b.nome, b.manchete ?? '');
    for (const b of BEATS) console.log(String(b.s).padStart(7), 'beat', b.nome.padEnd(9), `${b.s}–${b.z} (${(b.z - b.s).toFixed(2)} s)`, b.oque);
    for (const f of FALAS) console.log(String(f.s).padStart(7), f.id.padEnd(4), f.quem.padEnd(8), `${f.a}–${f.z}`, f.paginas.map((p) => `[${p.fim}]`).join(''));
    console.log('FIM', FIM);
}
