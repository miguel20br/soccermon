// Soccermon News #1 v6: as cartas (PokeCard2 Metal, a da galeria ?cards=1) e o pacote ouro (PackArt) desenhados direto
// dos componentes do jogo, com fundo transparente, a 4x. Cada carta é a da galeria: createInstance(id, Rng(`galeria-id`)),
// sem item e sem shiny. Precisa do servidor de dev (npx vite --config vite/config.dev.mjs --port <p> --strictPort).
//   BASE_URL=http://localhost:<p> node trailer/curtas/news-01/cartas.mjs trailer/curtas/midia/news/cartas 25 143 95 26 130 150 pack
// Saída: <id>.png (960x1344), pack.png e pack-aberto.png (o mesmo pacote sem a tampa, pra rasgar no vídeo).
const NPX_PLAYWRIGHT = '/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright').catch(() => import(NPX_PLAYWRIGHT));
const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const [OUT, ...ids] = process.argv.slice(2);
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 900, height: 2400 }, locale: 'pt-BR', deviceScaleFactor: 4 });
p.on('pageerror', (e) => console.error('erro na página:', e.message));
await p.goto(`${BASE}/?cards=1`);
await p.waitForTimeout(5000);
await p.evaluate(async (ids) => {
    // o mesmo React da página (a mesma ?v= do pré-empacotamento do Vite), senão os hooks quebram
    const src = await (await fetch('/src/main.tsx')).text();
    const rd = src.match(/\/node_modules\/\.vite\/deps\/react-dom_client\.js\?v=[a-z0-9]+/)[0];
    const React = (await import(`/node_modules/.vite/deps/react.js?v=${rd.split('v=')[1]}`)).default;
    const RD = await import(rd);
    const createRoot = RD.createRoot ?? RD.default.createRoot;
    const { PokeCard2 } = await import('/src/ui/components/PokeCard2.tsx');
    const { PackArt } = await import('/src/ui/components/CardPack.tsx');
    const { createInstance } = await import('/src/engine/instance.ts');
    const { Rng } = await import('/src/engine/rng.ts');
    document.body.innerHTML = '';
    for (const el of [document.documentElement, document.body]) el.style.background = 'transparent';
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:0;top:0;display:flex;flex-wrap:wrap;gap:40px;padding:40px;width:900px';
    document.body.appendChild(box);
    for (const id of ids) {
        const d = document.createElement('div');
        d.dataset.cap = id;
        box.appendChild(d);
        if (id === 'pack') {
            d.style.setProperty('--fut-w', '240px');
            createRoot(d).render(React.createElement(PackArt, { look: 'gold' }));
        } else {
            const inst = { ...createInstance(Number(id), new Rng(`galeria-${id}`)), shiny: false, item: null };
            createRoot(d).render(React.createElement(PokeCard2, { inst, variant: 'metal' }));
        }
    }
    await new Promise((r) => setTimeout(r, 1500));
}, ids);
// parado (o pacote flutua e o logo pisca): sem animação nenhuma
await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
await p.waitForTimeout(300);
for (const id of ids) await p.locator(`[data-cap="${id}"] > *`).first().screenshot({ path: `${OUT}/${id}.png`, omitBackground: true });
if (ids.includes('pack')) {
    await p.addStyleTag({ content: '.cpack-top{visibility:hidden!important}' });
    await p.locator('[data-cap="pack"] > *').first().screenshot({ path: `${OUT}/pack-aberto.png`, omitBackground: true });
}
console.log(`${ids.length} → ${OUT}`);
await b.close();
