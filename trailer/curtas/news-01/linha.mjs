// Soccermon News #1 v10 (16/11): a linha do tempo inteira sai daqui. O index.html lê o news-falas.js (window.LINHA) e a
// música (scripts/musica/pecas/news-plantao.mjs) importa este módulo, então a cena, os blips e a trilha não desencontram.
//   node trailer/curtas/news-01/linha.mjs <pasta>   → <pasta>/news-falas.js e <pasta>/news-voz.wav (os blips)
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

// ===================== o roteiro aprovado (falas exatas) =====================
bloco('gancho', 'PLANTÃO · VOLTORB VIRA RESERVA');
t += 2.5;
bloco('vinheta', null);
t += 2.5; // a vinheta de abertura: a bola-globo, as faixas de luz e o logo montando
bloco('abertura', 'SOCCERMON NEWS #1');
const f1 = fala('f1', 'raichu', '26-happy', 'Boa noite, Kanto! Eu sou o Raichu…', { manchete: true });
const f2 = fala('f2', 'machoke', '67-happy', '…e eu sou o Machoke. Este é o Soccermon News!');
const f3 = fala('f3', 'raichu', '26-determined', 'Hoje: as novidades da semana, e mais.');
beat('bDupla', 0.95, 'a dupla se olha e acena; a câmera abre na bancada');
bloco('escalada', 'HOJE NO SOCCERMON NEWS');
export const CARTELAS = [0, 1, 2, 3].map((k) => r3(t + 0.5 + 1.25 * k)); // a vinheta curta abre (0,5 s), 4 batidas de 1,25 s
t += 5.5;
beat('bCartas', 1.0, 'de volta ao estúdio: 3 cartas viradas caem no telão e a câmera chega perto');
bloco('plantao', 'PLANTÃO');
const f4 = fala('f4', 'raichu', '26', 'Na Copa do Dia e na Relâmpago, a recompensa da vitória mudou.', { manchete: true });
const f5 = fala('f5', 'machoke', '67-determined', 'Em 4 de cada 10 vitórias, uma das opções é um Patrocínio…');
const f6 = fala('f6', 'raichu', '26-joyous', '…um bônus forte que vale pro time inteiro.');
beat('bRua', 1.0, 'a câmera vai pra rua: o telão chia e abre na Rota, o Meowth acena');
bloco('aovivo', 'AO VIVO');
const f8 = fala('f8', 'raichu', '26', 'Agora, ao vivo da Rota Índigo, nosso repórter Meowth.', { manchete: true });
const f9 = fala('f9', 'meowth', '52-happy', 'Boa noite! Aqui na Rota, cada jogo vencido');
const f10 = fala('f10', 'meowth', '52-happy', 'agora paga ₽3 pra gastar no Mercado.');
const f11 = fala('f11', 'meowth', '52-joyous', 'Três vitórias, ₽9. Pay Day!');
beat('payFim', 1.0, 'as moedas assentam e o Meowth faz a pose');
bloco('vestiario', 'VESTIÁRIO');
const f12 = fala('f12', 'machoke', '67-surprised', 'No Vestiário do Pallet FC, uma bola explodiu no treino.', { manchete: true });
pausa('reacao', 1.0); // o Raichu sem graça (o Pikachu do clipe é a pré-evolução dele), sem fala
const f13 = fala('f13', 'raichu', '26-determined', 'Psyduck, o que vocês fizeram com o Voltorb?'); // v10: de volta à bancada
const f14 = fala('f14', 'psyduck', '54-sigh', 'Agora ele é reserva.');
beat('bVoltorb', 1.45, 'o Voltorb sozinho no banco, de colete: pisca, se encolhe, solta uma faísca e olha pros lados');
bloco('vemai', 'VEM AÍ');
const f15 = fala('f15', 'raichu', '26-inspired', 'A partir de agora, sai atualização nova toda semana.', { manchete: true });
const f16 = fala('f16', 'machoke', '67-joyous', 'E na sexta, dia 27, abre o Time Ultimate…');
const f17 = fala('f17', 'raichu', '26-joyous', ['…o modo novo em que você abre pacotes', 'e monta o time da temporada.']);
beat('bRola', 1.0, 'o estúdio aberto: o Voltorb entra rolando no telão e para');
bloco('fecha', 'PRA FECHAR');
const f18 = fala('f18', 'machoke', '67-happy', 'E o Voltorb pediu pra avisar: ele tá bem.', { manchete: true });
beat('bRisada', 1.0, 'a dupla se olha e ri; o Voltorb pisca no telão');
const f19 = fala('f19', 'raichu', '26-happy', 'Muito obrigado pela companhia, e boa noite!');
const f20 = fala('f20', 'todos', 'todos', 'Temos que chutar!');
bloco('final', null);
t += 3.2;
fechaBeat();
export const FIM = r3(t);

// ===================== os instantes de cada animação (a cena e a música usam os mesmos) =====================
M.ver51 = f3.a; // "Hoje": o selo VERSÃO NOVA com o 0.9.51 carimba no H…
M.ver52 = letra(f3, 'novidades'); // …e o + 0.9.52 nas "novidades"
M.vt1 = r3(letra(f4, 'recompensa') - 0.15); // a cabeça da matéria no telão e o corte pro VT da recompensa
M.deal = [0.15, 0.4, 0.65].map((d) => r3(M.vt1 + d));
M.holofote = letra(f4, 'mudou');
M.trofeus = [0, 1, 2, 3].map((k) => r3(letra(f5, 'vitórias') + 0.35 * k));
M.patro = letra(f5, 'Patrocínio');
M.perdendo = r3(f6.a + 0.3);
M.mais4 = [0, 1, 2, 3, 4, 5].map((k) => r3(letra(f6, 'forte') + 0.2 * k));
M.cheia = f9.s; // o corte pro Meowth em tela cheia, na Rota (com o Mercado e a torcida)
M.vitorias = [letra(f10, '₽3'), r3(f10.paginas[0].fim + 0.5), letra(f11, '₽9')];
M.payday = letra(f11, 'Pay');
M.moedas = Array.from({ length: 14 }, (_, k) => r3(M.payday + 0.6 + k * 0.09)); // cada moeda chegando no chão
M.kaboom = letra(f12, 'explodiu');
export const KABOOM_NO_CLIPE = 3.5; // midia/news/bola-fora-longa.mp4
M.vestCena = f13.s; // v10: o plano da bancada com o Psyduck na cadeira de convidado
/** O Voltorb: reage (o pavio) no gancho e no PRA FECHAR; no meio, a gag dele sozinho no banco (o beat bVoltorb). */
M.voltorbReage = [0.45, M.bVoltorb, letra(f18, 'Voltorb')];
M.gag = { pisca: r3(M.bVoltorb + 0.15), encolhe: r3(M.bVoltorb + 0.35), faisca: r3(M.bVoltorb + 0.6), olha: [r3(M.bVoltorb + 0.85), r3(M.bVoltorb + 1.1)], volta: r3(M.bVoltorb + 1.32) };
M.sextas = [0, 1, 2, 3].map((k) => r3(f15.paginas.at(-1).fim + 0.15 + 0.4 * k));
M.ultimate = letra(f16, 'Time');
M.pacote = { cai: r3(f17.s + 0.2), treme: r3(f17.s + 0.45), rasga: letra(f17, 'abre') };
M.pacote.sai = [0, 1, 2, 3, 4].map((k) => r3(M.pacote.rasga + 0.1 + 0.12 * k));
M.pacote.vira = [0, 1, 2, 3].map((k) => r3(f17.paginas[1].ini + 0.12 * k));
M.pacote.mewtwo = letra(f17, 'temporada');
M.pacote.foco = r3(M.pacote.mewtwo + 0.3);
M.bem = letra(f18, 'bem');
M.boaNoite = letra(f19, 'boa noite');
M.grito = [r3(f20.a + 0.3), r3(letra(f20, 'chutar') + 0.25)];
/** v11: as 2 batidas dos papéis na mesa (a dupla alinha os papéis depois do "boa noite", com o tema subindo). */
M.papeis = [r3(f19.paginas[0].fim + 0.45), r3(f19.paginas[0].fim + 0.75)];
export const VARRIDAS = [M.escalada, M.vemai]; // v11: as 2 transições de faixas diagonais (vermelho e amarelo); o resto é troca rápida com whoosh
export const CORTES = [M.vinheta, M.abertura, M.bCartas, M.vt1, M.bRua, M.cheia, M.vestiario, M.reacao, M.bVoltorb, M.bRola, M.final];

/** As trocas de cena e os painéis levam 0,25 s (o clipe do EP 2 fica no ar até a troca terminar). */
export const SAIDA = 0.25;
export const LINHA = { FIM, M, BLOCOS, BEATS, FALAS, CARTELAS, VARRIDAS, CORTES, DT, SAIDA };

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
    h = h.replace(/(<video id="v-bola"[^>]*?)data-start="[\d.]+" data-duration="[\d.]+" data-media-start="[\d.]+"/, `$1data-start="${r2(M.vestiario)}" data-duration="${r2(M.reacao - M.vestiario + SAIDA)}" data-media-start="${r2(KABOOM_NO_CLIPE - (M.kaboom - M.vestiario))}"`);
    writeFileSync(html, h);
    const { blipMachoke, blipMeowth, blipPsyduck, blipRaichu } = await import('../../../scripts/musica/curtas.mjs');
    const { SR, Song } = await import('../../../scripts/musica/synth.mjs');
    const S = new Song({ bpm: 120, bars: Math.ceil(FIM / 2), tail: 1 });
    const BLIP = {
        raichu: S.part('raichu', blipRaichu, { drum: true, gain: 0.32, pan: -0.1 }),
        machoke: S.part('machoke', blipMachoke, { drum: true, gain: 0.42, pan: 0.1 }),
        meowth: S.part('meowth', blipMeowth, { drum: true, gain: 0.3, pan: 0.05 }),
        psyduck: S.part('psyduck', blipPsyduck, { drum: true, gain: 0.4, pan: -0.05 }),
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
    for (const b of BEATS) console.log(String(b.s).padStart(7), 'beat', b.nome.padEnd(9), `${b.s}–${b.z} (${(b.z - b.s).toFixed(2)} s)`, b.oque);
    for (const f of FALAS) console.log(String(f.s).padStart(7), f.id.padEnd(4), f.quem.padEnd(8), `${f.a}–${f.z}`, f.paginas.map((p) => `[${p.fim}]`).join(''));
    console.log('FIM', FIM);
}
