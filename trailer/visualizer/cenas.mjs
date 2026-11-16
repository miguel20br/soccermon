// As vinhetas de cena do visualizer: pixel art (grade de 182 × 60, cada pixel = 5 px na tela) que conta a faixa, só
// com objetos e cenários do próprio Soccermon. Cada cena devolve { svg, css?, js }: o `js` acrescenta tweens no `tl`
// da composição (no tempo da música: o andamento e os compassos vêm das peças em scripts/musica/album).
// Sem Pokémon em destaque, sem logo, nome ou símbolo de terceiros.

/** Um retângulo de pixels. */
const px = (x, y, w, h, cor, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor}" ${extra}/>`;
const svg = (corpo) => `<svg viewBox="0 0 182 60" preserveAspectRatio="none">${corpo}</svg>`;

/** A bola de futsal (6 × 6), com os gomos escuros: nunca vermelha e branca. */
const bola = (id, x, y) =>
    `<g id="${id}">${px(x + 1, y, 4, 6, '#f4f1e6')}${px(x, y + 1, 6, 4, '#f4f1e6')}${px(x + 2, y + 2, 2, 2, '#1c2447')}${px(x + 4, y + 1, 1, 1, '#1c2447')}${px(x + 1, y + 4, 1, 1, '#1c2447')}</g>`;

export const CENAS = {
    // 5 · Gotas na caverna (132 BPM, 1 compasso = 1,818 s): estalactites, três gotas pingando no tempo (uma por
    // tempo forte, cada estalactite no seu compasso), o anel na poça, os cristais piscando e uma bola esquecida.
    5: ({ dur }) => {
        const tetos = [
            [0, 0, 182, 6],
            [10, 6, 14, 4],
            [14, 10, 6, 4],
            [16, 14, 2, 3],
            [52, 6, 20, 3],
            [56, 9, 10, 4],
            [59, 13, 4, 4],
            [60, 17, 2, 2],
            [104, 6, 16, 5],
            [108, 11, 8, 4],
            [110, 15, 3, 3],
            [150, 6, 22, 3],
            [156, 9, 10, 5],
            [159, 14, 4, 4],
            [160, 18, 2, 2],
        ];
        const pedras = tetos.map(([x, y, w, h]) => px(x, y, w, h, '#1c2447')).join('');
        const paredes = `${px(0, 6, 8, 46, '#141a33')}${px(8, 20, 4, 30, '#141a33')}${px(174, 6, 8, 44, '#141a33')}${px(170, 24, 4, 26, '#141a33')}${px(30, 30, 14, 22, '#10173a')}${px(126, 34, 18, 18, '#10173a')}`;
        const chao = `${px(0, 52, 182, 8, '#1c2447')}${px(0, 50, 30, 2, '#1c2447')}${px(150, 49, 32, 3, '#1c2447')}`;
        const poca = `${px(40, 51, 100, 2, '#2a4ea0')}${px(46, 53, 88, 1, '#2a4ea0')}`;
        const cristais = [
            [6, 44],
            [24, 47],
            [158, 43],
            [172, 46],
            [84, 8],
        ]
            .map(([x, y], i) => `<g id="vz-cr${i}">${px(x, y, 2, 3, '#9ae6ff')}${px(x + 1, y - 1, 1, 1, '#f4f1e6')}</g>`)
            .join('');
        const GOTAS = [17, 61, 111, 161];
        const gotas = GOTAS.map(
            (x, i) =>
                `${px(x - 0.5, 19, 2, 3, '#9ae6ff', `id="vz-gota${i}" opacity="0"`)}<rect id="vz-anel${i}" x="${x - 3}" y="50" width="7" height="1" fill="none" stroke="#9ae6ff" stroke-width="0.6" opacity="0"/>`,
        ).join('');
        const BAR = (60 / 132) * 4;
        // cada gota cai em 3 batidas e bate na poça; a ordem passeia pelas 4 estalactites
        const js = `
const BAR = ${BAR};
const GOTAS = [${GOTAS.join(', ')}];
for (let k = 0; k * BAR + BAR < ${dur}; k++) {
  const i = [0, 2, 1, 3][k % 4];
  const t = k * BAR;
  tl.fromTo('#vz-gota' + i, { attr: { y: 19 }, opacity: 1 }, { attr: { y: 49 }, duration: BAR * 0.75, ease: 'power2.in', immediateRender: false }, t);
  tl.to('#vz-gota' + i, { opacity: 0, duration: 0.05 }, t + BAR * 0.75);
  tl.fromTo('#vz-anel' + i, { attr: { x: GOTAS[i] - 3, width: 7 }, opacity: 0.9 },
    { attr: { x: GOTAS[i] - 12, width: 25 }, opacity: 0, duration: BAR * 0.9, ease: 'power1.out', immediateRender: false }, t + BAR * 0.75);
}
for (let i = 0; i < 5; i++)
  tl.fromTo('#vz-cr' + i, { opacity: 0.35 }, { opacity: 1, duration: BAR * (1 + i * 0.37), ease: 'sine.inOut', yoyo: true, repeat: Math.floor(${dur} / (BAR * (1 + i * 0.37))) - 1 }, i * 0.3);
`;
        return { svg: svg(`${px(0, 0, 182, 60, '#0b1024')}${paredes}${pedras}${chao}${poca}${cristais}${gotas}${bola('vz-bola', 146, 43)}`), js };
    },

    // 8 · O plano infalível (112 BPM, 1 compasso = 2,143 s): a prancheta do plano na parede (X, O e as setas se
    // desenhando), e três vultos de olho aceso atravessando na ponta do pé, um passinho por batida. No B2 (o plano dá
    // errado), o do meio tropeça no tempo do apito e do "bonk" (compasso 46, linha 11: 100,04 s), a estrela do bonk
    // pisca e os três fogem correndo. No fim, saem de fininho. Vultos genéricos: nenhum personagem nem letra.
    8: ({ dur }) => {
        const BAR = (60 / 112) * 4;
        const BEAT = BAR / 4;
        const TROPECO = (46 + 11 / 16) * BAR;
        const quadro = `${px(10, 8, 64, 36, '#4b5a9a')}${px(12, 10, 60, 32, '#1f4d3a')}${px(41, 10, 1, 32, '#f4f1e6', 'opacity="0.35"')}<rect x="35" y="20" width="12" height="12" fill="none" stroke="#f4f1e6" stroke-width="0.6" opacity="0.35"/>`;
        const marcas = `<g fill="#ffcb05">${px(20, 16, 1, 1, '#ffcb05')}${px(22, 16, 1, 1, '#ffcb05')}${px(21, 17, 1, 1, '#ffcb05')}${px(20, 18, 1, 1, '#ffcb05')}${px(22, 18, 1, 1, '#ffcb05')}</g><g>${px(55, 30, 3, 1, '#f4f1e6')}${px(55, 32, 3, 1, '#f4f1e6')}${px(54, 31, 1, 1, '#f4f1e6')}${px(58, 31, 1, 1, '#f4f1e6')}</g>`;
        const setas = `<path id="vz-seta1" d="M23 19 L33 28 L52 30" fill="none" stroke="#f4f1e6" stroke-width="0.8" stroke-dasharray="2 1.5"/><path id="vz-seta2" d="M24 35 L40 38 L60 22" fill="none" stroke="#ffcb05" stroke-width="0.8" stroke-dasharray="2 1.5"/>`;
        const vulto = (i, h) => {
            const y = 54 - h;
            return `<g id="vz-v${i}">${px(0, y + 2, 7, h - 2, '#04060e')}${px(1, y, 5, 3, '#04060e')}${px(2, y + 2, 1, 1, '#f4f1e6')}${px(4, y + 2, 1, 1, '#f4f1e6')}${px(1, 54, 2, 1, '#04060e')}${px(4, 54, 2, 1, '#04060e')}</g>`;
        };
        const estrela = `<g id="vz-bonk" opacity="0">${px(4, 0, 1, 9, '#ffcb05')}${px(0, 4, 9, 1, '#ffcb05')}${px(2, 2, 5, 5, '#fff3a0')}</g>`;
        const fundo = `${px(0, 0, 182, 60, '#0b1024')}${px(0, 55, 182, 5, '#1c2447')}${px(120, 6, 40, 22, '#141a33')}${px(122, 8, 36, 18, '#1c2447')}${px(139, 8, 2, 18, '#141a33')}`;
        const js = `
const BAR = ${BAR}, BEAT = ${BEAT}, TROPECO = ${TROPECO};
const ALT = [0, 4, 9];
// o plano se desenha a cada 4 compassos
for (let t = 0; t + 4 * BAR <= DUR; t += 4 * BAR) {
  tl.fromTo('#vz-seta1', { strokeDashoffset: 40, opacity: 1 }, { strokeDashoffset: 0, duration: BAR, ease: 'none', immediateRender: false }, t);
  tl.fromTo('#vz-seta2', { strokeDashoffset: 50, opacity: 1 }, { strokeDashoffset: 0, duration: BAR, ease: 'none', immediateRender: false }, t + BAR);
}
// a travessia: 8 compassos da esquerda pra direita, um passinho (sobe e desce 1 pixel) por batida
const travessia = (t0, de, ate, compassos) => {
  for (let i = 0; i < 3; i++) {
    tl.fromTo('#vz-v' + i, { x: de - i * 12, y: 0, rotation: 0 }, { x: ate - i * 12, duration: compassos * BAR, ease: 'none', immediateRender: false }, t0);
    for (let b = 0; b < compassos * 4; b++)
      tl.fromTo('#vz-v' + i, { y: 0 }, { y: -1.2, duration: BEAT / 2, ease: 'sine.out', yoyo: true, repeat: 1, immediateRender: false }, t0 + b * BEAT + i * BEAT / 3);
  }
};
let t = 0;
while (t + 8 * BAR <= TROPECO - BAR) { travessia(t, -30, 200, 8); t += 8 * BAR; }
// a última antes do tropeço chega até o meio e para ali
const ate = TROPECO - t;
travessia(t, -30, -30 + (230 * ate) / (8 * BAR), ate / BAR);
// o tropeço: o do meio cai, a estrela pisca, os três fogem correndo
const xm = -30 + (230 * ate) / (8 * BAR);
tl.to('#vz-v1', { rotation: 80, transformOrigin: '50% 100%', duration: 0.18, ease: 'power2.in' }, TROPECO - 0.2);
tl.fromTo('#vz-bonk', { x: xm - 6, y: 34, opacity: 1, scale: 0.4, transformOrigin: '50% 50%' }, { scale: 1.3, duration: 0.15, immediateRender: false }, TROPECO);
tl.to('#vz-bonk', { opacity: 0, duration: 0.3 }, TROPECO + 0.7);
tl.to('#vz-v1', { rotation: 0, duration: 0.15 }, TROPECO + BEAT * 4);
for (let i = 0; i < 3; i++) tl.to('#vz-v' + i, { x: 220, duration: 0.7, ease: 'power2.in' }, TROPECO + BAR + i * 0.08);
// depois: voltam a atravessar, e no fim saem de fininho (mais devagar)
t = TROPECO + 2 * BAR;
while (t + 8 * BAR <= DUR) { travessia(t, -30, 200, 8); t += 8 * BAR; }
if (DUR - t > BAR) travessia(t, -30, 200, (DUR - t) / BAR);
`;
        return {
            svg: svg(`${fundo}${quadro}${marcas}${setas}${vulto(0, 16)}${vulto(1, 12)}${vulto(2, 14)}${estrela}`),
            js,
        };
    },

    // as outras, até o molde ser aprovado: a quadra com a bola parada no círculo central
    padrao: () => ({
        svg: svg(
            `${px(0, 0, 182, 60, '#0b1024')}${px(10, 10, 162, 44, '#2c3868')}<rect x="10" y="10" width="162" height="44" fill="none" stroke="#f4f1e6" stroke-width="0.6" opacity="0.6"/>${px(90.7, 10, 0.6, 44, '#f4f1e6', 'opacity="0.6"')}${bola('vz-bola', 88, 29)}`,
        ),
        js: '',
    }),
};
