// Grava os 3 momentos do curta POV na mesma partida (a que o cacar.ts achou): o N1 aceso e o Esperar, o N2 aceso e o
// Esperar, o N3 aceso, o toque na batida e o gol. Quadros do canvas da quadra (968x528, nativo) + meta por quadro
// (tick, câmera, bola, capitão, botão aceso) + print do botão aceso de cada nível (3x).
//   node trailer/curta-pov/gravar.mjs <capitão> <k> <tickN1> <tickN2> <tickN3> <pasta>
// Precisa do dev server (BASE_URL, padrão :8095). Pesado: rode pela fila (scripts/pesado.sh).
import { mkdirSync, writeFileSync } from 'node:fs';
import { abrir, wait } from './jogo.mjs';

const [capitao, k, t1, t2, t3] = process.argv.slice(2, 7).map(Number);
const out = process.argv[7];
const { browser, page, step, speed, click } = await abrir({ capitao, k, dsf: 3 });
// o toque: quantos ticks depois do aceso previsto pelo cacar.ts (o N3 dentro da janela em que vira gol); a montagem
// estica o trecho pra o dedo encostar na batida
const DEPOIS = { n1: 6, n2: 6, n3: 4 };
const FINO = Number(process.env.FINO ?? 1 / 3);
if (process.env.DEPOIS_N3) DEPOIS.n3 = Number(process.env.DEPOIS_N3);
let antes = -1;
let parado = 0;

async function avancar(ate) {
    await speed(8);
    for (;;) {
        const s = await step(false, 3);
        if (s.tick >= ate) return;
        parado = s.tick === antes ? parado + 1 : 0;
        antes = s.tick;
        if (parado > 10) await click('button', '^Começar o 2');
        if (s.fim) throw new Error(`a partida acabou antes do tick ${ate}`);
    }
}

async function gravar(nome, ate, solta) {
    const alvo = ate + DEPOIS[nome];
    const dir = `${out}/${nome}`;
    mkdirSync(dir, { recursive: true });
    await avancar(ate - 50);
    await speed(1);
    const meta = [];
    let aceso = -1;
    let tocou = -1;
    let gol = -1;
    for (let n = 0; n < 1400; n++) {
        // depois do toque no N3, passo menor (FINO do quadro): o especial em câmera lenta lisa na montagem
        const mult = solta && tocou >= 0 && (gol < 0 || n < gol + 60) ? FINO : 1;
        const s = await step(true, mult);
        s.mult = mult;
        writeFileSync(`${dir}/${String(n + 1).padStart(5, '0')}.png`, Buffer.from(s.png.split(',')[1], 'base64'));
        delete s.png;
        meta.push(s);
        if (s.cue && aceso < 0) {
            aceso = n;
            console.log(`${nome}: aceso "${s.cue}" no quadro ${n}, tick ${s.tick.toFixed(1)}`);
        }
        // o print do botão depois da animação de entrada (as animações CSS andam no relógio falso)
        if (aceso >= 0 && n === aceso + 12) {
            // sem a quadra atrás (o print pega o que estiver embaixo das partes transparentes)
            await page.evaluate(() => {
                document.querySelector('.pitch-wrap canvas').style.visibility = 'hidden';
            });
            const el = await page.$('.sl-cue-row');
            await el?.screenshot({ path: `${dir}/botao.png`, omitBackground: true });
            await page.evaluate(() => {
                document.querySelector('.pitch-wrap canvas').style.visibility = '';
            });
            // onde fica cada botão dentro do print (px css; o print é 3x)
            const rects = await page.evaluate(() => {
                const r0 = document.querySelector('.sl-cue-row').getBoundingClientRect();
                const r = (sel) => {
                    const b = document.querySelector(sel)?.getBoundingClientRect();
                    return b ? [b.x - r0.x, b.y - r0.y, b.width, b.height] : null;
                };
                return { linha: [r0.width, r0.height], max: r('.sl-cue-row .sl-cue.lv3'), esperar: r('.sl-cue-row .sl-wait') };
            });
            writeFileSync(`${dir}/botao.json`, JSON.stringify(rects));
        }
        if (aceso >= 0 && tocou < 0 && s.tick >= alvo) {
            tocou = n;
            if (!solta) await click('.sl-cue-row .sl-wait');
            else {
                // na batida (nota PERFEITO): o anel do botão (--beat, 0 logo depois da batida, 1 na próxima) anda no
                // relógio de verdade; espera ele encostar e toca
                const ok = await page.evaluate(async () => {
                    const b = document.querySelector('.sl-cue-row .sl-cue.lv3');
                    if (!b) return false;
                    const anel = [...b.querySelectorAll('*')].find((x) => x.style?.getPropertyValue('--beat'));
                    for (let i = 0; i < 400; i++) {
                        const ph = Number(anel?.style.getPropertyValue('--beat') ?? 0);
                        if (!anel || ph > 0.97 || ph < 0.03) break;
                        await new Promise((r) => requestAnimationFrame(r));
                    }
                    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
                    b.click();
                    return true;
                });
                const t0 = Date.now();
                while ((await page.evaluate(() => window.__trocas)) === 0 && Date.now() - t0 < 20000) await wait(200);
                console.log(`${nome}: soltou (${ok}) no quadro ${n}; partida nova: ${await page.evaluate(() => window.__trocas)}`);
            }
            meta[n].toque = solta ? 'max' : 'esperar';
        }
        if (s.ev.some((e) => e.type === 'goal') && gol < 0) {
            gol = n;
            console.log(`${nome}: gol no quadro ${n}`, JSON.stringify(s.ev));
        }
        if (!solta && tocou >= 0 && n > tocou + 100) break;
        if (solta && gol >= 0 && n > gol + 150) break;
        if (aceso < 0 && n > 400) break;
    }
    writeFileSync(`${dir}/meta.json`, JSON.stringify({ aceso, tocou, gol, meta }));
    console.log(`${nome}: ${meta.length} quadros`);
}

// SO=n3: só o último momento (pra comparar capitães)
if (process.env.SO !== 'n3') {
    await gravar('n1', t1, false);
    await gravar('n2', t2, false);
}
await gravar('n3', t3, true);
await browser.close();
