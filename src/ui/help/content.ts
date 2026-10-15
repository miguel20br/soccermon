import { type AttrKey, POSITION_LABEL } from '../../engine/attributes';
import { CLUBS, CUP_STAGES } from '../../engine/cup';
import { BENCH_SIZE, DRAFT_PICKS } from '../../engine/draft';
import { TACTIC_MODS } from '../../engine/effective';
import { FORMATIONS } from '../../engine/formations';
import { ITEMS } from '../../engine/items';
import { LINKS } from '../../engine/links';
import { ICON_CHANCE, ICONS, SPECIAL_BONUS } from '../../engine/specials';
import { TACTIC_LABEL, type Tactic } from '../../engine/state';
import { START_REROLLS } from '../../store/game-store';
import { FEEDBACK_URL } from '../links';
import { TYPE_PT } from '../type-colors';

/**
 * Textos da Ajuda. Fica tudo aqui pra ser fácil de editar. Onde dá, os números vêm direto do motor
 * (formações, itens, sinergias, táticas, clubes), então a Ajuda não fica desatualizada quando eles mudam.
 *
 * Formato: `p` = parágrafo; `list` = lista (string, ou [termo, explicação]). `**negrito**` funciona.
 */
export type HelpBlock =
    | { p: string }
    | { list: (string | [string, string])[] }
    | { link: { href: string; label: string } };

export interface HelpSection {
    id: string;
    title: string;
    /** Sprite (id da espécie) que ilustra a seção. */
    sprite: number;
    blocks: HelpBlock[];
}

export interface FaqEntry {
    q: string;
    a: HelpBlock[];
}

const pct = (f: number) => `${f >= 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)}%`;

const ATTR_PT: Record<AttrKey, string> = {
    pace: 'Velocidade',
    dribble: 'Drible',
    shooting: 'Chute',
    passing: 'Passe',
    tackling: 'Desarme',
    strength: 'Força',
    positioning: 'Leitura',
    stamina: 'Fôlego',
    goalkeeping: 'Goleiro',
};

const TACTIC_FEEL: Record<Tactic, string> = {
    balanced: 'o time joga no meio-termo',
    offensive: 'linhas altas e mais chutes, mas abre espaço atrás',
    defensive: 'bloco baixo, ataca pouco',
    counter: 'o Pivô espera lá na frente pra puxar o contra-ataque',
};

function tacticLine(t: Tactic): [string, string] {
    const mods = TACTIC_MODS[t];
    const attrs = Object.entries(mods.attrs)
        .map(([k, f]) => `${ATTR_PT[k as AttrKey]} ${pct(f)}`)
        .join(', ');
    const drain = mods.drain === 1 ? '' : `; cansa ${mods.drain > 1 ? 'mais' : 'menos'} (${pct(mods.drain)})`;
    return [TACTIC_LABEL[t], `${TACTIC_FEEL[t]}. ${attrs}${drain}.`];
}

const formationLines = Object.values(FORMATIONS).map((f): [string, string] => [
    f.name,
    `${f.slots
        .slice(1)
        .map((s) => POSITION_LABEL[s])
        .join(', ')} (e o goleiro). ${f.description}`,
]);

const typeNames = (types: string[]) => types.map((t) => TYPE_PT[t] ?? t).join('/');
const gyms = CLUBS.filter((c) => c.city !== 'Indigo Plateau');
const league = CLUBS.find((c) => c.city === 'Indigo Plateau');

const generalItems = Object.values(ITEMS)
    .filter((i) => i.kind !== 'type')
    .map((i): [string, string] => [i.name, i.desc]);
const typeItemNames = Object.values(ITEMS)
    .filter((i) => i.kind === 'type')
    .map((i) => i.name);

const linkLines = LINKS.map((l): [string, string] => [`${l.name} (${pct(l.bonus)})`, `${l.desc} Combo: ${l.combo}.`]);

const iconCount = Object.keys(ICONS).length;

export const HELP_SECTIONS: HelpSection[] = [
    {
        id: 'basico',
        title: 'O básico',
        sprite: 25,
        blocks: [
            {
                p: 'Soccermon é um draft roguelike com os **151 Pokémon de Kanto** jogando **futsal 5 contra 5**. Cada copa é uma run: você monta o time, encara 4 jogos de mata-mata e tenta levantar a taça.',
            },
            {
                list: [
                    ['Draft', 'escolha a formação, o capitão e depois 1 de 3 Pokémon por vaga.'],
                    ['Escalação', 'ajuste titulares, banco, itens e tática antes de cada jogo.'],
                    ['Partida', 'é simulada. Você é o técnico: tática, substituição e muita torcida.'],
                    ['Copa', `${CUP_STAGES.join(' → ')}. Perdeu, a copa acaba (mas a Pokédex e os recordes ficam).`],
                ],
            },
        ],
    },
    {
        id: 'draft',
        title: 'Draft',
        sprite: 133,
        blocks: [
            {
                p: `São **${DRAFT_PICKS} escolhas**: 5 titulares + ${BENCH_SIZE} reservas.`,
            },
            {
                list: [
                    ['1. Formação', 'define as vagas da quadra (dá pra trocar depois, na escalação).'],
                    [
                        '2. Capitão',
                        'saem 3 candidatos raros, épicos ou lendários, de qualquer posição. Escolha um e toque na vaga em que ele vai jogar (o número na vaga é a nota dele ali).',
                    ],
                    [
                        '3. As outras vagas',
                        'toque numa vaga livre da quadra ou do banco: saem 3 Pokémon que jogam naquela posição (no banco vale qualquer um). Você leva 1.',
                    ],
                ],
            },
            {
                list: [
                    'As 3 opções nunca repetem um Pokémon que você já tem e têm pelo menos 2 tipos diferentes.',
                    'A raridade melhora ao longo do draft. A vaga de Pivô (a posição mais rara) puxa um pouco mais.',
                    'Cada opção avisa se ele é **de origem** na posição, se **também joga** ali ou se vai **improvisado**, e se ativa alguma sinergia de história.',
                ],
            },
            {
                p: `**Sortear de novo (reroll):** troca as 3 opções. Você começa com ${START_REROLLS}, e eles valem pra copa toda: servem no draft e nas recompensas. Pular uma recompensa dá +1.`,
            },
        ],
    },
    {
        id: 'formacoes',
        title: 'Formações',
        sprite: 68,
        blocks: [
            {
                p: 'Todas têm goleiro + 4 na linha. A formação muda as vagas do draft e como o time se posiciona em campo.',
            },
            { list: formationLines },
        ],
    },
    {
        id: 'posicoes',
        title: 'Posições e atributos',
        sprite: 95,
        blocks: [
            {
                p: '**9 atributos** (1 a 99), tirados dos stats base de cada Pokémon: Velocidade (Speed), Drible, Chute, Passe, Desarme, Força, Leitura (de jogo), Fôlego (HP) e Goleiro.',
            },
            {
                p: 'O corpo também conta: quem tem mãos ou braços defende melhor no gol; quadrúpedes, aves e peixes, pior. Os pequenos driblam melhor; os gigantes, pior.',
            },
            {
                list: [
                    ['Goleiro', 'usa o atributo Goleiro (HP, Defesa, Def. Esp. e tamanho).'],
                    ['Fixo', 'o zagueiro: Desarme, Leitura, Força e Passe.'],
                    ['Ala', 'corre pelos lados: Velocidade, Drible, Passe e Fôlego.'],
                    ['Pivô', 'o centroavante trombador: Chute e Força pesam muito, mais Drible e Leitura.'],
                ],
            },
            {
                p: 'Cada Pokémon joga bem em **até 3 posições** (as que ficam perto da melhor nota dele). Na principal rende 100%; nas outras em que joga bem, −2%.',
            },
            {
                p: '**Fora de posição** perde 7% nos atributos da vaga. Se envolver o gol (goleiro na linha ou jogador de linha no gol), perde 25%.',
            },
            {
                p: 'Casos especiais: **Onix** sempre pode ir pro gol, e **Ditto** joga em qualquer vaga, porque em campo vira uma cópia do melhor Pokémon daquela posição.',
            },
        ],
    },
    {
        id: 'cartas',
        title: 'Cartas, nota e edições',
        sprite: 6,
        blocks: [
            {
                p: 'O número grande da carta é a **nota** na posição principal. A cor vem da nota: **Bronze** até 64, **Prata** de 65 a 74, **Ouro** 75 ou mais.',
            },
            {
                p: 'A raridade do Pokémon (comum, incomum, raro, épico, lendário) muda só o acabamento: fosco, brilhante ou a carta própria dos lendários.',
            },
            {
                p: 'Passe o mouse (ou segure o dedo) na carta pra ver o resumo; toque pra abrir a carta completa com atributos, golpes, habilidade e bônus.',
            },
            {
                p: `**Edições especiais** dão +${SPECIAL_BONUS} em todos os atributos (não acumulam) e têm visual próprio:`,
            },
            {
                list: [
                    ['Shiny', 'a cor alternativa, 1 em 64 cartas.'],
                    [
                        'Ícone',
                        `${iconCount} Pokémon famosos com título (Pikachu do Ash, Onix do Brock, Psyduck da Misty…). 1 em ${Math.round(1 / ICON_CHANCE)} quando um deles sai no draft ou na recompensa.`,
                    ],
                    ['Evento', 'o tipo da semana: 1 em 8 cartas desse tipo. Muda toda semana.'],
                    ['Destaque', 'o craque do seu time na partida vira Destaque (se ainda não tiver edição).'],
                ],
            },
        ],
    },
    {
        id: 'tipos',
        title: 'Tipos e efetividade',
        sprite: 9,
        blocks: [
            {
                p: 'Vale a tabela de tipos da franquia, só que suavizada pro futsal: tipo ajuda, mas não ganha jogo sozinho.',
            },
            {
                list: [
                    ['Super efetivo', '+12% (4× = +25%).'],
                    ['Pouco efetivo', '−10% (¼ = −16%).'],
                    ['Imune', '−20%. Nunca zera.'],
                ],
            },
            {
                p: 'Conta nos golpes, nos chutes contra o goleiro, nas divididas (o melhor tipo de quem ataca contra quem defende) e até nos pênaltis. Tinted Lens e Adaptability aumentam o efeito.',
            },
            { p: 'Os poucos Pokémon do tipo Fada ganham **Encanto**: +8% em tudo.' },
        ],
    },
    {
        id: 'golpes',
        title: 'Golpes',
        sprite: 129,
        blocks: [
            {
                p: 'Cada Pokémon leva até 4 golpes: o golpe-assinatura da espécie, um do próprio tipo, um de cobertura e um utilitário. Em campo, o Pokémon usa os golpes sozinho, na hora certa do lance.',
            },
            {
                p: 'Cada golpe tem **1 uso por partida** (golpes de PP alto, 2) e o mesmo Pokémon precisa esperar um pouco entre um golpe e outro.',
            },
            {
                list: [
                    ['Físico', 'com a bola vira chute potente; sem a bola, carrinho forte.'],
                    ['Especial', 'finalização de longe ou chute colocado.'],
                    ['Arrancada', 'golpes de prioridade ou de Velocidade: dispara na quadra.'],
                    ['Reforço', 'sobe atributos por um tempo (Swords Dance, Agility…).'],
                    ['Enfraquecer', 'baixa um atributo do rival mais perto.'],
                    ['Status', 'paralisa, adormece, envenena ou confunde o rival.'],
                    ['Cura', 'recupera fôlego.'],
                    [
                        'Especiais',
                        'efeito próprio: Counter devolve o golpe, Substitute cria um boneco, Teleport foge da marcação, Metronome sorteia um golpe, Leech Seed suga fôlego e por aí vai.',
                    ],
                ],
            },
            {
                list: [
                    ['Prender', 'Bind, Wrap, Clamp, Fire Spin e Constrict deixam o alvo lento e atordoado.'],
                    ['Nocaute', 'Fissure, Guillotine e Horn Drill erram muito, mas quando acertam derrubam o rival.'],
                    [
                        'Com preço',
                        'Explosion e Self-Destruct explodem e deixam quem usou no chão; Hyper Beam fica recarregando; Double-Edge, Take Down e Submission cansam quem usou; Thrash e Petal Dance podem confundir; Jump Kick e High Jump Kick machucam se errar.',
                    ],
                    ['Drenar', 'Absorb, Mega Drain, Leech Life e Dream Eater sugam o fôlego do alvo.'],
                    [
                        'Efeito extra',
                        'turbinado em relação aos jogos: Thunderbolt paralisa, Flamethrower queima, Bite faz hesitar…',
                    ],
                ],
            },
            { p: 'E sim: o Splash do Magikarp é só Splash mesmo. A graça é evoluir.' },
        ],
    },
    {
        id: 'status',
        title: 'Status',
        sprite: 39,
        blocks: [
            {
                list: [
                    ['Paralisado', 'Velocidade −40% e Drible −15%.'],
                    ['Dormindo', 'fica fora do lance por um instante.'],
                    ['Congelado', 'fica parado por um instante.'],
                    ['Envenenado', 'perde fôlego aos poucos.'],
                    ['Queimado', 'Chute e Força −20% e perde fôlego aos poucos.'],
                    ['Confuso', 'Passe −30% e Chute −15%.'],
                    ['Apaixonado', '(Cute Charm) trava por um instante.'],
                    ['Hesitante', '(Bite, King’s Rock…) perde o tempo da jogada.'],
                ],
            },
            {
                p: 'Status passa sozinho depois de um tempo. Habilidades e itens podem evitar ou encurtar (Limber, Insomnia, Lum Berry…).',
            },
        ],
    },
    {
        id: 'habilidades',
        title: 'Habilidades',
        sprite: 94,
        blocks: [
            {
                p: 'Várias habilidades viraram passivas de futsal (a carta completa mostra o efeito). Alguns exemplos:',
            },
            {
                list: [
                    ['Velocidade', 'Swift Swim, Chlorophyll, Run Away, Quick Feet.'],
                    ['Ataque', 'Hustle (Chute +10%, Passe −5%), Sniper, Iron Fist, Technician (golpes fracos +50%).'],
                    ['Reta final', 'Overgrow, Blaze, Torrent e Swarm: +10% em Chute e Drible com o fôlego baixo.'],
                    [
                        'Aura',
                        'Intimidate (rivais perto chutam pior), Unnerve, Stench, Pressure (rivais perto cansam mais).',
                    ],
                    [
                        'Contato',
                        'Static, Poison Point, Flame Body, Effect Spore e Cute Charm: quem desarma pode sair com status.',
                    ],
                    ['Pancada', 'Anger Point, Defiant, Justified, Steadfast: ficam mais fortes ao sofrer desarme.'],
                    ['Com status', 'Guts e Marvel Scale ficam mais fortes quando estão com status.'],
                    ['Fôlego', 'Regenerator, Rain Dish, Ice Body e outras recuperam fôlego durante o jogo.'],
                    ['Imposter', 'o Ditto vira o melhor Pokémon da posição dele em campo.'],
                ],
            },
        ],
    },
    {
        id: 'itens',
        title: 'Itens',
        sprite: 143,
        blocks: [
            {
                p: 'Cada Pokémon segura **1 item**. Eles vêm das recompensas da copa, e na escalação dá pra passar o item de um Pokémon pra outro (toque no jogador e use "Passar para").',
            },
            { list: generalItems },
            {
                p: `**Itens de tipo** (${typeItemNames.join(', ')}): golpes daquele tipo ficam 20% mais fortes.`,
            },
            { p: 'Da semifinal em diante os adversários também entram em quadra com itens.' },
        ],
    },
    {
        id: 'sinergias',
        title: 'Capitão e sinergias',
        sprite: 150,
        blocks: [
            {
                list: [
                    [
                        'Capitão',
                        '+3% em tudo pra ele. A aura dá +3% ao time e +6% a quem divide tipo com ele. Só vale com o capitão em quadra.',
                    ],
                    [
                        'Sinergia de tipo',
                        '2 titulares do mesmo tipo ganham +3%; 3 ou mais, +6%. Vale a melhor sinergia de cada um (não acumula).',
                    ],
                    [
                        'Sinergia de história',
                        'duplas e grupos famosos de Kanto ganham bônus juntos em quadra e podem soltar um **combo**: passe de um, chute do outro, 20% mais forte e mais preciso (1 vez por tempo).',
                    ],
                ],
            },
            { list: linkLines },
            { p: 'Tudo isso é recalculado a cada substituição ou evolução.' },
        ],
    },
    {
        id: 'partida',
        title: 'A partida',
        sprite: 26,
        blocks: [
            {
                p: 'Dois tempos de 20 minutos (no relógio do jogo). A partida é **simulada**: os Pokémon jogam sozinhos e você comanda da beira da quadra.',
            },
            {
                list: [
                    ['Velocidade', '1x, 2x, 4x, 8x ou Lances (só os melhores momentos). Ou pule para o fim.'],
                    ['Tática', 'até 3 mudanças por partida (veja abaixo).'],
                    [
                        'Substituir',
                        'escolha quem sai e quem entra. A troca acontece na próxima bola parada (saída de bola, tiro de meta ou intervalo). Nada é automático no seu time.',
                    ],
                    [
                        'Painel',
                        'toque num Pokémon na quadra (ou na lista do time) pra ver fôlego, barra de evolução, atributos do momento, números da partida e golpes.',
                    ],
                ],
            },
            {
                list: (['balanced', 'offensive', 'defensive', 'counter'] as Tactic[]).map(tacticLine),
            },
            {
                p: '**Fôlego:** cai com o esforço (menos pra quem tem HP alto) e cansado rende menos. O intervalo recupera um pouco. O time rival pode trocar o mais cansado no intervalo.',
            },
            { p: '**Garra:** quem está perdendo por 3 ou mais cresce no jogo. Virada é sempre possível.' },
            {
                p: '**Pênaltis:** empate no fim vai para 5 cobranças por time e depois morte súbita. Batem os melhores chutadores, e o tipo do batedor contra o do goleiro conta.',
            },
            {
                p: 'Saiu no meio? A escalação fica travada e, ao voltar, a mesma partida continua de onde estava.',
            },
        ],
    },
    {
        id: 'evolucao',
        title: 'Evolução em campo',
        sprite: 4,
        blocks: [
            {
                p: 'Quem joga muito acima do normal pra posição dele **evolui no meio da partida**, na próxima bola parada.',
            },
            {
                list: [
                    'A barra junta tudo o que ele fez: gols, assistências, chutes no gol, defesas, desarmes, interceptações, passes e golpes, com peso por posição (assim goleiro e Fixo evoluem tanto quanto o Pivô).',
                    'Um gol sozinho não basta. Evolui no máximo 1 vez por partida.',
                    'A evolução vale pro resto da copa. Ele ganha os golpes da nova forma e mantém a habilidade se a nova forma também tiver.',
                    'Eevee vira uma das três evoluções (sempre a mesma pra aquela carta). Ditto não evolui.',
                    'O rival também pode evoluir durante o jogo!',
                ],
            },
        ],
    },
    {
        id: 'copa',
        title: 'A Copa',
        sprite: 149,
        blocks: [
            {
                p: `${CUP_STAGES.join(' → ')}, sempre mata-mata. Os 3 primeiros adversários são ginásios de Kanto sorteados; a final é sempre contra a **${league?.name ?? 'Liga Índigo'}**. A dificuldade sobe a cada fase.`,
            },
            {
                list: gyms.map((c): [string, string] => [
                    c.name,
                    `tipo ${typeNames(c.types)}, ${FORMATIONS[c.formation].name}, ${TACTIC_LABEL[c.tactic]}.`,
                ]),
            },
            {
                p: 'Antes de cada jogo dá pra ver as cartas do adversário na escalação. Perdeu, a copa acaba. Ganhou a final: campeão! Ganhar sem sofrer gol em nenhum jogo é **copa perfeita**.',
            },
        ],
    },
    {
        id: 'recompensas',
        title: 'Recompensas',
        sprite: 52,
        blocks: [
            { p: 'Depois de cada vitória (menos a final) você escolhe **1 de 3**:' },
            {
                list: [
                    [
                        'Contratar',
                        'um dos melhores Pokémon do time que você acabou de eliminar (sem o item dele). Se não houver ninguém novo pra você, vem um reforço sorteado.',
                    ],
                    ['2 itens', 'itens de tipo tendem a puxar os tipos do seu time.'],
                ],
            },
            {
                list: [
                    'O Pokémon novo entra **no lugar de um reserva** (nunca do capitão) e herda o item de quem saiu.',
                    'O item vai pra qualquer jogador; se ele já tinha um, troca.',
                    'Sortear de novo gasta 1 reroll. **Pular** não pega nada, mas dá +1 reroll.',
                ],
            },
        ],
    },
    {
        id: 'recordes',
        title: 'Recordes e desafios',
        sprite: 151,
        blocks: [
            {
                p: 'A tela inicial guarda seus recordes: copas jogadas, títulos, copas perfeitas, cartas Destaque, evoluções e Ícones.',
            },
            {
                p: '**Desafio:** cada copa tem uma seed. Ao compartilhar, vai um link com ?seed= no fim: quem abre joga a mesma copa, com os mesmos adversários e os mesmos sorteios. Quem vai mais longe?',
            },
        ],
    },
    {
        id: 'pokedex',
        title: 'Pokédex, Golpedex e Perfil',
        sprite: 137,
        blocks: [
            {
                list: [
                    [
                        'Pokédex',
                        '**visto** = apareceu no seu draft, nas recompensas ou no time adversário. **Jogou** = entrou em quadra pelo seu time por pelo menos 1 minuto. Guarda partidas, títulos e a maior nota de cada um.',
                    ],
                    ['Golpedex', 'os golpes entram quando aparecem em campo nas suas partidas (dos dois times).'],
                    ['Perfil', 'nome, sigla e cor do seu clube, seu avatar e os números da sua carreira de técnico.'],
                ],
            },
        ],
    },
    {
        id: 'conta',
        title: 'Conta e nuvem',
        sprite: 132,
        blocks: [
            {
                p: 'Sem conta, tudo fica salvo **neste navegador, neste aparelho**. Toque em **Entrar com Google** na tela inicial pra guardar o save na nuvem e continuar em outro aparelho.',
            },
            {
                list: [
                    'Ao entrar, vale o save mais recente (do aparelho ou da nuvem).',
                    'Recordes, Pokédex, Golpedex e carreira juntam o melhor dos dois: nada de progresso se perde.',
                    'Dá pra apagar a conta e o save da nuvem em Configurações.',
                ],
            },
        ],
    },
];

export const FAQ: FaqEntry[] = [
    {
        q: 'Perdi minha copa?',
        a: [
            {
                p: 'Se você perdeu um jogo, sim: é mata-mata, a copa acaba ali. Recordes, Pokédex e Golpedex continuam.',
            },
            {
                p: 'Se só fechou o jogo, não: a copa fica salva e volta de onde parou (até a partida em andamento). O save some só se você limpar os dados do navegador sem estar com a conta ligada.',
            },
        ],
    },
    {
        q: 'Como salvar em outro aparelho?',
        a: [{ p: 'Entre com Google nos dois aparelhos. O save vai pra nuvem e acompanha sua conta.' }],
    },
    {
        q: 'Posso jogar offline?',
        a: [
            {
                p: 'Precisa de internet pra abrir o jogo e carregar sprites e sons. A partida roda inteira no seu aparelho e o save fica no navegador, então uma queda rápida de conexão não perde nada.',
            },
        ],
    },
    {
        q: 'Por que meu time mais forte perdeu?',
        a: [
            {
                p: 'Em campo a diferença de atributos pesa menos que na carta, de propósito: tem zebra. Tipo, fôlego, tática, golpes e status mudam o jogo.',
            },
        ],
    },
    {
        q: 'É oficial da Nintendo?',
        a: [
            {
                p: 'Não. É um fan game sem fins lucrativos, feito por fã: sem anúncios, sem doações, sem compras. Pokémon é marca da Nintendo, Game Freak e Creatures.',
            },
        ],
    },
    {
        q: 'Achei um bug. E agora?',
        a: [
            { p: 'Conta pra gente! Diga o que aconteceu, em qual tela e, se der, mande um print.' },
            { link: { href: FEEDBACK_URL, label: 'Mandar feedback' } },
        ],
    },
];

/** Texto puro de um bloco (pra busca). */
export function blockText(b: HelpBlock): string {
    if ('p' in b) return b.p;
    if ('list' in b) return b.list.map((i) => (typeof i === 'string' ? i : i.join(' '))).join(' ');
    return b.link.label;
}

/** Normaliza pra busca: minúsculas, sem acento, sem **. */
export function normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\*\*/g, '');
}
