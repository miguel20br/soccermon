/**
 * Recortes e "filmes" de menu pro clipe de atualização da 0.8.4 (TikTok 9:16). Precisa do dev server.
 * Cada peça é o componente sozinho, print do elemento em 3x (celular de 400 px de largura → 1200 px). Animação de
 * menu (título holográfico, VERSUS, pacote abrindo) é gravada quadro a quadro com relógio próprio: timers no
 * relógio do Playwright e animações CSS congeladas (CDP) e avançadas à mão, então sai lisa mesmo em máquina lenta.
 *
 *   BASE_URL=http://localhost:8098 node trailer/atualizacao/recortes.mjs <saida> [secao...]
 *   seções: treinador, versus, draft, mt, cartas, intervalo (padrão: todas)
 *
 * O código do título do criador vem de CODIGO_ARQ (arquivo fora do git) e é resgatado sem nenhum print na tela.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const OUT = process.argv[2];
if (!OUT) throw new Error('use: node recortes.mjs <pasta de saída> [seção...]');
const SECOES = process.argv.slice(3);
const quer = (s) => !SECOES.length || SECOES.includes(s);
mkdirSync(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext(`${OUT}/.perfil-navegador`, {
    headless: true,
    viewport: { width: 400, height: 860 },
    deviceScaleFactor: 3,
    locale: 'pt-BR',
});
const p = ctx.pages()[0] ?? (await ctx.newPage());
p.on('pageerror', (e) => console.log('[página]', e.message));
const wait = (ms) => p.waitForTimeout(ms);
const click = async (t, exato = false) => {
    const ok = await p.evaluate(
        ([t, exato]) => {
            const el = [...document.querySelectorAll('button')].find(
                (e) => e.offsetParent && !e.disabled && (exato ? e.innerText.trim() === t : e.innerText.trim().startsWith(t)),
            );
            el?.click();
            return !!el;
        },
        [t, exato],
    );
    if (!ok) console.log('  (não achei o botão', t, ')');
    await wait(600);
    return ok;
};
const abrir = async (q = '') => {
    await p.goto(`${BASE}/${q}`, { waitUntil: 'networkidle' });
    await wait(1500);
    // passo a passo de boas-vindas (exato: a recompensa tem "Pular (+1 reroll)")
    await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Pular')?.click());
};
/** Caixa do elemento em coordenadas da página (pra print com captureBeyondViewport). */
const caixa = async (sel, pad = 0, alturaMax = null) => {
    const el = await p.$(sel);
    if (!el) throw new Error(`não achei ${sel}`);
    await el.scrollIntoViewIfNeeded();
    await wait(300);
    const r = await el.boundingBox();
    const h = alturaMax ? Math.min(r.height, alturaMax) : r.height;
    return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + 2 * pad, height: h + 2 * pad };
};
const print = async (sel, nome, pad = 0, alturaMax = null) => {
    const clip = await caixa(sel, pad, alturaMax);
    await p.screenshot({ path: `${OUT}/${nome}.png`, clip });
    console.log('ok', nome, Math.round(clip.width * 3), 'x', Math.round(clip.height * 3));
};

/**
 * Filma uma região quadro a quadro: congela as animações CSS (CDP), instala o relógio falso e roda `acao`;
 * depois avança 1000/fps ms por quadro (timers + animações) e tira o print da região.
 */
const filmar = async (nome, clipFn, dur, acao, fps = 30) => {
    const dir = `${OUT}/${nome}`;
    mkdirSync(dir, { recursive: true });
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await p.clock.install();
    // o relógio instalado anda sozinho: parado, só os runFor de cada quadro avançam
    await p.clock.pauseAt(Date.now() + 50);
    await acao?.();
    const clip = await clipFn();
    const dt = 1000 / fps;
    const n = Math.round(dur * fps);
    for (let i = 1; i <= n; i++) {
        await p.evaluate((dt) => {
            for (const an of document.getAnimations()) {
                if (an.__vt === undefined) an.__vt = Number(an.currentTime ?? 0);
                else an.__vt += dt;
                an.currentTime = an.__vt;
            }
        }, dt);
        await p.clock.runFor(dt);
        await wait(25); // React desenha o que os timers mudaram
        await p.evaluate(() => {
            for (const an of document.getAnimations()) if (an.__vt === undefined) an.__vt = Number(an.currentTime ?? 0);
        });
        await p.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.png`, clip });
    }
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await cdp.detach();
    await p.clock.resume(); // o relógio falso fica na página (e nas próximas): volta a andar sozinho
    console.log('filme', nome, n, 'quadros');
};

// ===== 1 · treinador: grade com silhuetas, escolher a Leaf, título do criador brilhando =====
if (quer('treinador')) {
    await abrir();
    await click('Perfil');
    await wait(800);
    const nome = await p.$('.pf-card input.pf-input');
    await nome.fill('Miguel');
    await nome.press('Tab');
    await print('.pf-trainers', 't-grade', 6, 520);
    // o "como conseguir" de perto: Brock, Misty, Lt. Surge… (2ª e 3ª linha)
    await print('.pf-trainers', 't-grade-alta', 6, 1100);
    await print('.pf-trainers', 't-antes', 6, 118); // 1ª linha: Red escolhido
    await click('Leaf', true);
    await wait(500);
    await print('.pf-trainers', 't-depois', 6, 118); // agora a Leaf
    // código do título: resgatado aqui, sem print nenhum enquanto ele está na tela
    const arq = process.env.CODIGO_ARQ;
    if (arq) {
        const codigo = readFileSync(arq, 'utf8').trim();
        const campo = p.locator('#pf-code');
        await campo.fill(codigo);
        await campo.press('Enter');
        await wait(1500);
        const sobrou = await campo.inputValue();
        if (sobrou) {
            await campo.fill('');
            throw new Error('o código não foi aceito; nada gravado');
        }
        console.log('título resgatado:', await p.locator('.pf-code-ok').innerText());
        // o chip do título escolhido (holográfico) e a lista de títulos
        await click('Criador do Soccermon');
    }
    await p.evaluate(() => window.scrollTo(0, 0));
    await wait(500);
    await print('.pf-head', 't-cabecalho', 8);
    await filmar('t-holo', () => caixa('.pf-head', 8), 4);
    await abrir();
}

// ===== 1b · o treinador no VERSUS =====
if (quer('versus')) {
    await abrir('?demo=trailer&cena=golpe&seed=trailer12');
    await filmar(
        'v-versus',
        async () => ({ x: 0, y: 0, width: 400, height: 860 }),
        3.2,
        async () => {
            await click('Jogar ');
        },
    );
    await print('.vsp-scene', 'v-versus-fim', 0);
}

// ===== 2 · pacote do tamanho da carta no draft (e a carta mostrando a nota depois de evoluir) =====
const botoes = async () =>
    console.log('  botões:', (await p.$$eval('button', (bs) => bs.filter((b) => b.offsetParent).map((b) => b.innerText.trim().split('\n')[0]))).join(' | '));
if (quer('draft')) {
    // tela alta: o draft inteiro cabe sem rolar (o pacote só abre à vista e o recorte não se mexe)
    await p.setViewportSize({ width: 400, height: 1800 });
    await abrir();
    await click('Nova copa');
    await click('Sim, começar outra');
    await filmar('d-pacote-capitao', () => caixa('.draft-options', 6), 3, async () => {
        await click('Losango');
        await wait(500);
    });
    await print('.draft-options', 'd-capitaes', 6);
    // capitão: o 1º candidato, na vaga dele; depois a vaga de Pivô abre outro pacote
    await p.evaluate(() => [...document.querySelectorAll('.option button')].find((b) => /capitão/i.test(b.innerText))?.click());
    await wait(600);
    await botoes();
    for (const vaga of ['Fixo', 'Ala', 'Goleiro', 'Pivô']) if (await click(vaga)) break;
    await wait(600);
    for (const [i, vaga] of ['Pivô', 'Ala', 'Goleiro'].entries()) {
        await filmar(`d-pacote-${i + 1}`, () => caixa('.draft-options', 6), 3, async () => {
            await click(vaga);
            await wait(500);
        });
        await print('.draft-options', `d-opcoes-${i + 1}`, 6);
        await botoes();
        // contrata a 1ª opção e segue
        await p.evaluate(() => [...document.querySelectorAll('.option button')].find((b) => /^Escalar/i.test(b.innerText.trim()))?.click());
        await wait(800);
    }
    await p.screenshot({ path: `${OUT}/_draft-1.png` });
    await p.setViewportSize({ width: 400, height: 860 });
}
// ===== 2b · item/MT da recompensa no formato da carta =====
if (quer('mt')) {
    await p.setViewportSize({ width: 400, height: 1800 });
    await abrir('?demo=mt');
    await wait(1500);
    await print('.cpack-stage', 'm-fechado', 10);
    await filmar('m-pacote', () => caixa('.cpack-stage', 10), 3.5, async () => {
        await p.evaluate(() => document.querySelector('.cpack-btn')?.click());
        await wait(400);
    });
    await print('.cpack-stage', 'm-aberto', 10);
    await botoes();
    await p.setViewportSize({ width: 400, height: 860 });
}

// ===== 5 · buffs: a carta de quem subiu (o "antes ⇒ depois" vem da edição) =====
if (quer('cartas')) {
    await abrir('?cards=1');
    for (const nome of ['Mr. Mime', 'Onix', 'Hitmonlee', 'Wigglytuff', 'Vaporeon']) {
        await p.fill('#cg-search', nome);
        await wait(900);
        await print('.cg-stage', `c-${nome.toLowerCase().replace(/[^a-z]/g, '')}`, 0);
    }
}

// ===== 7 · troca no intervalo: o novo já entra no 2º tempo =====
if (quer('intervalo')) {
    await p.setViewportSize({ width: 400, height: 1400 });
    await abrir('?demo=trailer&cena=ditto&seed=trailer315');
    await click('Jogar ');
    for (let i = 0; i < 60 && !(await click('Começar')); i++) await wait(1000);
    await click('8x', true);
    for (let i = 0; i < 400 && !(await p.$('.ht-panel')); i++) await wait(1000);
    await wait(800);
    await print('.ht-panel', 'i-intervalo', 8);
    await click('Substituir');
    await wait(600);
    await print('.sub-panel', 'i-quem-sai', 6);
    // sai o Ditto (ou o 1º da lista), entra o Pikachu do banco
    await p.evaluate(() => {
        const bs = [...document.querySelectorAll('.sub-pick')];
        (bs.find((b) => /Ditto/.test(b.innerText)) ?? bs[0])?.click();
    });
    await wait(600);
    await print('.sub-panel', 'i-quem-entra', 6);
    await p.evaluate(() => {
        const bs = [...document.querySelectorAll('.sub-pick')];
        (bs.find((b) => /Pikachu/.test(b.innerText)) ?? bs[0])?.click();
    });
    await wait(800);
    await botoes();
    await p.screenshot({ path: `${OUT}/_intervalo.png`, fullPage: true });
    await print('.ht-panel', 'i-intervalo-depois', 8).catch((e) => console.log(e.message));
    // 2º tempo: quem entrou já está em quadra na saída de bola. Loop do Phaser parado e um step por quadro (como o
    // scripts/trailer-capture.mjs), lendo o canvas na mesma chamada; sem os nomes em cima dos Pokémon
    await click('1x', true);
    await click('Começar o 2º tempo');
    await p.evaluate(() => {
        window.__soccermonGame.loop.sleep();
        window.__t = performance.now();
    });
    mkdirSync(`${OUT}/i-segundo-tempo`, { recursive: true });
    const { writeFileSync } = await import('node:fs');
    for (let i = 1; i <= 120; i++) {
        const url = await p.evaluate(() => {
            const g = window.__soccermonGame;
            for (const v of g.scene.getScene('Match').players) v.label?.setAlpha(0);
            window.__t += 1000 / 30;
            g.step(window.__t, 1000 / 30);
            return document.querySelector('.pitch-wrap canvas').toDataURL('image/png');
        });
        writeFileSync(`${OUT}/i-segundo-tempo/${String(i).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
    }
    await p.evaluate(() => window.__soccermonGame.loop.wake());
    await print('.team-panel', 'i-time-2t', 6).catch((e) => console.log(e.message));
    await p.setViewportSize({ width: 400, height: 860 });
}

await ctx.close();
console.log('FIM');
