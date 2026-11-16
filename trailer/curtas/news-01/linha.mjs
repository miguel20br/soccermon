// Soccermon News #1 v8 (15/11): a linha do tempo inteira sai daqui. O index.html lê o news-falas.js (window.LINHA) e a
// música (scripts/musica/pecas/news-plantao.mjs) importa este módulo, então a cena, os blips e a trilha não desencontram.
//   node trailer/curtas/news-01/linha.mjs <pasta>   → <pasta>/news-falas.js e <pasta>/news-voz.wav (os blips)
// Regra de leitura (aprovada no teste do Golduck): a caixa digita 1 letra a cada 50 ms e segura 0,2 s depois de
// pontuação no meio da frase; cada fala fica inteira no mínimo 2,7 s; no máximo 2 linhas (a fala que não cabe vira 2
// páginas, como nos jogos: a de antes fica inteira 1,2 s). Cada bloco novo (manchete nova) começa na batida (0,5 s, 120 BPM)
// e o texto entra 0,3 s depois da manchete.
import { readFileSync, writeFileSync } from 'node:fs';

export const DT = 0.05;
export const PAUSA = 0.2;
export const CHEIA = 2.7;
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
/** As falas: { id, quem, rostos: [[t, rosto]], s, a, z, paginas: [{ texto, ini, chars, fim, ate }] }. */
export const FALAS = [];

function bloco(nome, manchete) {
    t = Math.ceil(t / BATIDA - 1e-6) * BATIDA;
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
    const s = t;
    let a = s + (manchete ? RESPIRO : TROCA);
    const pgs = [texto].flat();
    const paginas = pgs.map((tx, k) => {
        const { chars, fim } = digita(tx, a);
        const ate = r3(fim + (k === pgs.length - 1 ? CHEIA : PAGINA));
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
/** Quando aparece a 1ª letra de `trecho` na fala (procura em todas as páginas). */
export const letra = (f, trecho) => {
    for (const p of f.paginas) {
        if (p.texto.includes(trecho)) return p.chars[Array.from(p.texto.slice(0, p.texto.indexOf(trecho))).length];
    }
    throw new Error(`"${trecho}" não está na fala ${f.id}`);
};

// ===================== o roteiro aprovado (falas exatas) =====================
bloco('gancho', 'PLANTÃO · VOLTORB VIRA RESERVA');
t += 2;
bloco('vinheta', null);
t += 2;
bloco('abertura', 'SOCCERMON NEWS #1');
const f1 = fala('f1', 'raichu', '26-happy', 'Boa noite, Kanto! Eu sou o Raichu…', { manchete: true });
const f2 = fala('f2', 'machoke', '67-happy', ['…e eu sou o Machoke.', 'Este é o Soccermon News!']);
const f3 = fala('f3', 'raichu', '26-determined', 'Hoje: as novidades da semana, e mais.');
bloco('escalada', 'HOJE NO SOCCERMON NEWS');
export const CARTELAS = [0, 1, 2, 3].map((k) => r3(t + 1.5 * k));
t += 6;
bloco('plantao', 'PLANTÃO');
const f4 = fala('f4', 'raichu', '26', ['Na Copa do Dia e na Relâmpago,', 'a recompensa da vitória mudou.'], { manchete: true });
const f5 = fala('f5', 'machoke', '67-determined', ['Em 4 de cada 10 vitórias,', 'uma das opções é um Patrocínio…']);
const f6 = fala('f6', 'raichu', '26-joyous', '…um bônus forte que vale pro time inteiro.');
const f7 = fala('f7', 'magikarp', '129-determined', ['A gente perdia.', 'A charanga tocou e o time ficou mais forte.']);
bloco('aovivo', 'AO VIVO');
const f8 = fala('f8', 'raichu', '26', ['Agora, ao vivo da Rota Índigo,', 'nosso repórter Meowth.', 'Boa noite, Meowth.'], { manchete: true });
const f9 = fala('f9', 'meowth', [['52-surprised', 0], ['52-happy', 5]], 'Boa noite, Raichu!');
const f10 = fala('f10', 'meowth', '52-happy', ['Aqui na Rota, cada jogo vencido', 'agora paga ₽3 pra gastar no Mercado.']);
const f11 = fala('f11', 'meowth', '52-joyous', 'Três vitórias, ₽9. Pay Day!');
bloco('vestiario', 'VESTIÁRIO');
const f12 = fala('f12', 'machoke', '67-surprised', ['No Vestiário do Pallet FC,', 'uma bola explodiu no treino.'], { manchete: true });
pausa('reacao', 1.2); // o Raichu sem graça (o Pikachu do clipe é a pré-evolução dele), sem fala
const f13 = fala('f13', 'raichu', '26-determined', 'Psyduck, o que vocês fizeram com o Voltorb?');
const f14 = fala('f14', 'psyduck', '54-sigh', 'Agora ele é reserva.');
pausa('voltorbFim', 1.2); // o Voltorb no banco segura depois da caixa fechar
bloco('vemai', 'VEM AÍ');
const f15 = fala('f15', 'raichu', '26-inspired', ['A partir de agora,', 'sai atualização nova toda semana.'], { manchete: true });
const f16 = fala('f16', 'machoke', '67-joyous', ['E na sexta que vem, dia 27,', 'abre o Time Ultimate…']);
const f17 = fala('f17', 'raichu', '26-joyous', ['…o modo novo em que você abre pacotes', 'e monta o time da temporada.']);
bloco('notape', 'NOTA PÉ');
const f18 = fala('f18', 'machoke', '67-happy', 'E o Voltorb pediu pra avisar: ele tá bem.', { manchete: true });
const f19 = fala('f19', 'raichu', '26-happy', 'Muito obrigado pela companhia, e boa noite!');
const f20 = fala('f20', 'todos', 'todos', 'Temos que chutar!');
bloco('final', null);
t += 3.5;
export const FIM = r3(t);

// ===================== os instantes de cada animação (a cena e a música usam os mesmos) =====================
M.ver51 = f3.a; // "Hoje": o selo VERSÃO NOVA com o 0.9.51 carimba no H…
M.ver52 = letra(f3, 'novidades'); // …e o + 0.9.52 nas "novidades"
M.vt1 = r3(letra(f4, 'recompensa') - 0.15); // a cabeça da matéria no telão e o corte pro VT da recompensa
M.deal = [0.15, 0.4, 0.65].map((d) => r3(M.vt1 + d));
M.holofote = letra(f4, 'mudou');
M.trofeus = [0, 1, 2, 3].map((k) => r3(letra(f5, 'vitórias') + 0.45 * k));
M.patro = letra(f5, 'Patrocínio');
M.perdendo = r3(f6.a + 0.3);
M.mais4 = [0, 1, 2, 3, 4, 5].map((k) => r3(letra(f6, 'forte') + 0.25 * k));
M.charanga = letra(f7, 'charanga');
M.split = letra(f8, 'Rota');
M.atraso = [r3(f8.z - 1.3), r3(f8.z + TROCA)]; // o Meowth parado (o quadro congela), com a tarja ATRASO NO SINAL
M.cheia = f10.s; // o Meowth em tela cheia, com a partida rolando atrás
M.vitorias = [letra(f10, '₽3'), r3(f10.paginas[1].fim + 0.6), letra(f11, '₽9')];
M.payday = letra(f11, 'Pay');
M.moedas = Array.from({ length: 14 }, (_, k) => r3(M.payday + 0.6 + k * 0.09)); // cada moeda chegando no chão
M.kaboom = letra(f12, 'explodiu');
export const KABOOM_NO_CLIPE = 3.5; // midia/news/bola-fora-longa.mp4
M.voltorb = r3(f14.paginas[0].fim + 0.5); // o corte pro banco, com a tarja VOLTORB · RESERVA
M.sextas = [0, 1, 2, 3].map((k) => r3(f15.paginas.at(-1).fim + 0.2 + 0.5 * k));
M.ultimate = letra(f16, 'Time');
M.pacote = { cai: r3(f17.s + 0.2), treme: r3(f17.s + 0.45), rasga: letra(f17, 'abre') };
M.pacote.sai = [0, 1, 2, 3, 4].map((k) => r3(M.pacote.rasga + 0.1 + 0.12 * k));
M.pacote.vira = [0, 1, 2, 3].map((k) => r3(f17.paginas[1].ini + 0.12 * k));
M.pacote.mewtwo = letra(f17, 'temporada');
M.pacote.foco = r3(M.pacote.mewtwo + 0.3);
M.boaNoite = letra(f19, 'boa noite');
M.grito = [r3(f20.a + 0.3), r3(letra(f20, 'chutar') + 0.25)];
M.relogio = r3(f10.s); // o relógio do selo vira 19:01 (a metade do vídeo, no corte pra Rota)
export const VARRIDAS = [M.escalada, M.vemai]; // as 2 transições com a cartinha; o resto é corte seco com whoosh
export const CORTES = [M.plantao, M.vt1, f7.s, M.aovivo, M.cheia, M.vestiario, M.reacao, M.voltorb, M.notape, M.final];

export const LINHA = { FIM, M, BLOCOS, FALAS, CARTELAS, VARRIDAS, CORTES, DT };

// ===================== os blips (um por letra, baixinhos, um tom por personagem) =====================
if (import.meta.url === `file://${process.argv[1]}`) {
    const OUT = `${process.argv[2] ?? '.'}/`;
    writeFileSync(`${OUT}news-falas.js`, `window.LINHA = ${JSON.stringify(LINHA)};\n`);
    // as durações fixas do index.html (o HyperFrames lê os data-* antes do script): o vídeo e o clipe do EP 2
    // (bola-fora-longa.mp4 = 20,5 a 28 s do render v7 do ep14, o KABOOM em 3,5 s do arquivo), do VESTIÁRIO até a reação
    const html = new URL('./index.html', import.meta.url);
    const r2 = (x) => String(+x.toFixed(2));
    let h = readFileSync(html, 'utf8');
    h = h.replace(/data-duration="[\d.]+"/g, (m, i) => (h.slice(Math.max(0, i - 200), i).includes('id="v-bola"') ? m : `data-duration="${r2(FIM)}"`));
    h = h.replace(/(<video id="v-bola"[^>]*?)data-start="[\d.]+" data-duration="[\d.]+" data-media-start="[\d.]+"/, `$1data-start="${r2(M.vestiario)}" data-duration="${r2(M.reacao - M.vestiario)}" data-media-start="${r2(KABOOM_NO_CLIPE - (M.kaboom - M.vestiario))}"`);
    writeFileSync(html, h);
    const { blipMachoke, blipMagikarp, blipMeowth, blipPsyduck, blipRaichu } = await import('../../../scripts/musica/curtas.mjs');
    const { SR, Song } = await import('../../../scripts/musica/synth.mjs');
    const S = new Song({ bpm: 120, bars: Math.ceil(FIM / 2), tail: 1 });
    const BLIP = {
        raichu: S.part('raichu', blipRaichu, { drum: true, gain: 0.32, pan: -0.1 }),
        machoke: S.part('machoke', blipMachoke, { drum: true, gain: 0.42, pan: 0.1 }),
        meowth: S.part('meowth', blipMeowth, { drum: true, gain: 0.3, pan: 0.05 }),
        psyduck: S.part('psyduck', blipPsyduck, { drum: true, gain: 0.4, pan: -0.05 }),
        magikarp: S.part('magikarp', blipMagikarp, { drum: true, gain: 0.34 }),
    };
    // o desenho de 7 alturas (pra não virar metralhadora); no "Temos que chutar!" os cinco juntos, mais baixinhos
    const DESENHO = [0, 2, 0, -1, 2, 0, -2];
    for (const f of FALAS) {
        const quem = f.quem === 'todos' ? ['raichu', 'machoke', 'meowth', 'psyduck'] : [f.quem];
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
    writeFileSync(`${OUT}news-voz.wav`, wav);
    for (const b of BLOCOS) console.log(String(b.s).padStart(7), b.nome, b.manchete ?? '');
    for (const f of FALAS) console.log(String(f.s).padStart(7), f.id.padEnd(4), f.quem.padEnd(8), `${f.a}–${f.z}`, f.paginas.map((p) => `[${p.fim}]`).join(''));
    console.log('FIM', FIM);
}
