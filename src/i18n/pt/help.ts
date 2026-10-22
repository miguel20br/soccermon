/**
 * Ajuda ("Como jogar"), dicas e passo a passo de boas-vindas.
 *
 * Blocos das seções: `p` = parágrafo; `list` = lista (texto, ou [termo, explicação]); `dyn` = lista montada
 * com os números do motor (src/ui/help/content.ts); `link` = botão para o feedback. `**negrito**` funciona e
 * `{nome}` é trocado pelos números do jogo.
 */
export type HelpDictBlock =
    | { p: string }
    | { list: (string | [string, string])[] }
    | { dyn: 'formations' | 'items' | 'links' | 'tactics' | 'gyms' }
    | { link: string };

export type HelpSectionId =
    | 'basico'
    | 'draft'
    | 'formacoes'
    | 'posicoes'
    | 'cartas'
    | 'tipos'
    | 'golpes'
    | 'golpesJogos'
    | 'status'
    | 'habilidades'
    | 'itens'
    | 'sinergias'
    | 'partida'
    | 'evolucao'
    | 'copa'
    | 'recompensas'
    | 'recordes'
    | 'pokedex'
    | 'conta';

export interface HelpDictSection {
    title: string;
    blocks: HelpDictBlock[];
}

const sections: Record<HelpSectionId, HelpDictSection> = {
    basico: {
        title: 'O básico',
        blocks: [
            {
                p: 'Soccermon é um draft roguelike com os **151 Pokémon de Kanto** jogando **futsal 5 contra 5**. Cada copa é uma run: você monta o time, encara 4 jogos de mata-mata e tenta levantar a taça.',
            },
            {
                list: [
                    ['Draft', 'escolha a formação, o capitão e depois 1 de 3 Pokémon por vaga.'],
                    ['Escalação', 'ajuste titulares, banco, itens e tática antes de cada jogo.'],
                    ['Partida', 'é simulada. Você é o técnico: tática, substituição e muita torcida.'],
                    ['Copa', '{stages}. Perdeu, a copa acaba (mas a Pokédex e os recordes ficam).'],
                ],
            },
        ],
    },
    draft: {
        title: 'Draft',
        blocks: [
            { p: 'São **{picks} escolhas**: 5 titulares + {bench} reservas.' },
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
                p: '**Sortear de novo:** troca as 3 opções. Você começa com {rerolls}, e eles valem pra copa toda: servem no draft e nas recompensas. Pular uma recompensa dá +1.',
            },
        ],
    },
    formacoes: {
        title: 'Formações',
        blocks: [
            {
                p: 'Todas têm goleiro + 4 na linha. A formação muda as vagas do draft e como o time se posiciona em campo.',
            },
            { dyn: 'formations' },
        ],
    },
    posicoes: {
        title: 'Posições e atributos',
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
    cartas: {
        title: 'Cartas, nota e edições',
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
                p: '**Edições especiais** dão +{bonus} em todos os atributos e têm visual próprio. O shiny vai por cima de qualquer uma (+1) e o selo MVP soma +1 por nível (até o 3). Atributo nenhum passa de 99:',
            },
            {
                list: [
                    ['Shiny', 'a cor alternativa, 1 em 64 cartas.'],
                    [
                        'Ícone',
                        '{iconCount} Pokémon famosos com título (Pikachu do Ash, Onix do Brock, Psyduck da Misty…). 1 em {iconOdds} quando um deles sai no draft ou na recompensa.',
                    ],
                    ['Evento', 'o tipo da semana: 1 em 8 cartas desse tipo. Muda toda semana.'],
                    [
                        'Destaque',
                        'o craque do seu time na vitória ganha o selo MVP: carta comum vira Destaque; Ícone e Evento continuam e ganham o selo. Com nota 8+ o selo sobe, até o MVP 3.',
                    ],
                ],
            },
        ],
    },
    tipos: {
        title: 'Tipos e efetividade',
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
    golpes: {
        title: 'Golpes',
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
                    [
                        'Prender',
                        'Bind, Wrap, Clamp e Fire Spin atordoam o alvo um instante e deixam lento; Constrict só deixa lento. Cada um tem ainda um jeito próprio (veja "Golpes que fazem o que faziam nos jogos").',
                    ],
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
    golpesJogos: {
        title: 'Golpes que fazem o que faziam nos jogos',
        blocks: [
            {
                p: 'Muitos golpes ganharam o jeito que tinham na Gen 1, adaptado à quadra. A carta completa e a Golpedex explicam cada um.',
            },
            {
                list: [
                    [
                        'Área',
                        'Earthquake, Surf, Blizzard, Rock Slide, Growl, Leer… pegam todos os rivais em volta (Earthquake e Surf, até companheiro). Quem está com a bola e leva, solta.',
                    ],
                    [
                        'Crítico',
                        'Slash, Karate Chop, Razor Leaf, Crabhammer: chute mais forte e certeiro, e carrinho crítico ganha direto. **Focus Energy** garante o próximo crítico (e às vezes falha, como o bug da Gen 1).',
                    ],
                    [
                        'Carga',
                        'Solar Beam, Skull Bash, Sky Attack, Razor Wind: param um instante carregando e saem mais fortes. Levou carrinho na carga, perdeu o golpe. Hyper Beam que vira gol não recarrega.',
                    ],
                    [
                        'Fly e Dig',
                        'somem por um instante (ninguém alcança): com a bola, avançam e finalizam; sem a bola, caem em cima de quem conduz.',
                    ],
                    [
                        'Prioridade',
                        'Quick Attack desarma na hora, sem esperar; com a bola, arrancada e chute de primeira. Agility dura mais.',
                    ],
                    [
                        'Mira',
                        'Swift nunca erra e jogador de linha não bloqueia; Drill Peck e Cut furam o bloqueio; Egg Bomb vai por cima. Sand Attack, Kinesis, Flash e Smokescreen entortam a mira do rival.',
                    ],
                    [
                        'Dano fixo',
                        'Sonic Boom, Dragon Rage, Night Shade, Seismic Toss: chute de velocidade fixa, sem depender de atributo nem de tipo. Super Fang tira metade do fôlego; Low Kick derruba mais quem é pesado.',
                    ],
                    [
                        'Multi-acerto',
                        'Double Kick, Fury Swipes, Double Slap, Pin Missile…: de 2 a 5 tentativas de desarme seguidas. Bonemerang, Barrage e companhia podem devolver a bola ao pé de quem chutou.',
                    ],
                    [
                        'Prender',
                        'Wrap e Bind prendem os dois e a bola sobra; Clamp rouba e segura; Fire Spin deixa um anel de fogo no chão; Constrict deixa lento.',
                    ],
                    [
                        'Toxic, Rage e Bide',
                        'Toxic piora com o tempo; Rage fica mais forte a cada pancada; Bide aguenta firme e depois solta tudo em quem está perto.',
                    ],
                    [
                        'Clones e muro',
                        'Double Team cria clones que levam os próximos golpes; Minimize, Acid Armor, Withdraw e Defense Curl protegem a bola; Barrier ergue um muro que segura um chute.',
                    ],
                    [
                        'Controle de campo',
                        'Roar faz o rival fugir e largar a bola; Whirlwind e Gust sopram a bola; Strength empurra; Conversion copia o tipo do rival; Soft-Boiled cura um companheiro; Pay Day faz todo mundo parar para olhar as moedas.',
                    ],
                ],
            },
        ],
    },
    status: {
        title: 'Status',
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
    habilidades: {
        title: 'Habilidades',
        blocks: [
            {
                p: 'Várias habilidades viraram passivas de futsal (a carta completa mostra o efeito). Alguns exemplos:',
            },
            {
                list: [
                    ['Velocidade', 'Swift Swim, Chlorophyll, Run Away, Quick Feet.'],
                    ['Ataque', 'Hustle (Chute +15%, Passe −8%), Sniper, Iron Fist, Technician (golpes fracos +50%).'],
                    ['Reta final', 'Overgrow, Blaze, Torrent e Swarm: +15% em Chute e Drible com o fôlego baixo.'],
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
    itens: {
        title: 'Itens',
        blocks: [
            {
                p: 'Cada Pokémon segura **1 item**. Eles vêm das recompensas da copa, e na escalação dá pra passar o item de um Pokémon pra outro (toque no jogador e use "Passar para").',
            },
            { dyn: 'items' },
            { p: '**Itens de tipo** ({typeItems}): golpes daquele tipo ficam 20% mais fortes.' },
            { p: 'Da semifinal em diante os adversários também entram em quadra com itens.' },
        ],
    },
    sinergias: {
        title: 'Capitão e sinergias',
        blocks: [
            {
                list: [
                    [
                        'Capitão',
                        '+3% em tudo pra ele. A aura dá +3% ao time e +6% a quem divide tipo com ele. Só vale com o capitão em quadra.',
                    ],
                    [
                        'Sinergia de tipo',
                        '2 titulares do mesmo tipo ganham +3%; 3, +6%; 4, +8%; 5, +10%. Vale a melhor sinergia de tipo de cada um.',
                    ],
                    [
                        'Sinergia de história',
                        'duplas e grupos famosos de Kanto ganham bônus juntos em quadra e podem soltar um **combo**: passe de um, chute do outro, 20% mais forte e mais preciso (1 vez por tempo). As **especiais** (os 3 Pássaros Lendários, os 3 iniciais, Mew + Mewtwo) completas dão mais e as cartas brilham juntas. Tipo + história somam até +15%.',
                    ],
                ],
            },
            { dyn: 'links' },
            { p: 'Tudo isso é recalculado a cada substituição ou evolução.' },
        ],
    },
    partida: {
        title: 'A partida',
        blocks: [
            {
                p: 'Dois tempos de 20 minutos (no relógio do jogo). A partida é **simulada**: os Pokémon jogam sozinhos e você comanda da beira da quadra.',
            },
            {
                list: [
                    ['Velocidade', '1x, 2x, 4x, 8x ou Lances (só os melhores momentos). Ou pule para o fim.'],
                    ['Tática', 'mude quantas vezes quiser durante a partida (veja abaixo).'],
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
            { dyn: 'tactics' },
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
    evolucao: {
        title: 'Evolução em campo',
        blocks: [
            {
                p: 'Quem joga muito acima do normal pra posição dele **evolui no meio da partida**, na próxima bola parada.',
            },
            {
                list: [
                    'A barra junta tudo o que ele fez: gols, assistências, chutes no gol, defesas, desarmes, interceptações, passes e golpes, com peso por posição (assim goleiro e Fixo evoluem tanto quanto o Pivô).',
                    'Um gol sozinho não basta. Evolui no máximo 1 vez por partida.',
                    'A evolução vale pro resto da copa. Ele ganha os golpes da nova forma e mantém a habilidade se a nova forma também tiver.',
                    'Golpe ensinado por MT continua depois de evoluir (se a forma nova também aprende).',
                    'Eevee vira uma das três evoluções (sempre a mesma pra aquela carta). Ditto não evolui.',
                    'O rival também pode evoluir durante o jogo!',
                ],
            },
        ],
    },
    copa: {
        title: 'A Copa',
        blocks: [
            {
                p: '{stages}, sempre mata-mata. Os 3 primeiros adversários são ginásios de Kanto sorteados; a final é sempre contra a **{league}**. A dificuldade sobe a cada fase.',
            },
            { dyn: 'gyms' },
            {
                p: 'Antes de cada jogo dá pra ver as cartas do adversário na escalação. Perdeu, a copa acaba. Ganhou a final: campeão! Ganhar sem sofrer gol em nenhum jogo é **copa perfeita**.',
            },
        ],
    },
    recompensas: {
        title: 'Recompensas',
        blocks: [
            { p: 'Depois de cada vitória (menos a final) você escolhe **1 de 3**:' },
            {
                list: [
                    [
                        'Contratar',
                        'um dos melhores Pokémon do time que você acabou de eliminar (sem o item dele). Se não houver ninguém novo pra você, vem um reforço sorteado.',
                    ],
                    ['2 itens', 'itens de tipo tendem a puxar os tipos do seu time.'],
                    [
                        'MT do ginásio',
                        'em {tmOdds}% das vitórias, um dos itens vira a MT que o líder dava na Gen 1 (Brock: Bide, Misty: BubbleBeam, Lt. Surge: Thunderbolt, Erika: Mega Drain, Koga: Toxic, Sabrina: Psywave, Blaine: Fire Blast, Giovanni: Fissure). Se ninguém do seu time aprende, vem um golpe raro, que nenhum Pokémon leva de fábrica.',
                    ],
                ],
            },
            {
                list: [
                    'O Pokémon novo entra **no lugar de um reserva** (nunca do capitão) e herda o item de quem saiu.',
                    'O item vai pra qualquer jogador; se ele já tinha um, o item antigo é substituído (e some).',
                    'Sortear de novo gasta 1 sorteio. **Pular** não pega nada, mas dá +1 sorteio.',
                ],
            },
            {
                list: [
                    'MT: você escolhe quem aprende (só quem aprende o golpe nos jogos) e qual golpe ele esquece. O golpe-assinatura nunca é esquecido.',
                    'O golpe ensinado continua depois da evolução (se a forma nova também aprende).',
                    'Os ginásios rivais também entram em quadra com a MT do líder (até 2 Pokémon por time).',
                ],
            },
        ],
    },
    recordes: {
        title: 'Recordes e desafios',
        blocks: [
            {
                p: 'A tela inicial guarda seus recordes: copas jogadas, títulos, copas perfeitas, cartas Destaque, evoluções e Ícones.',
            },
            {
                p: '**Desafio:** cada copa tem uma seed. Ao compartilhar, vai um link com ?seed= no fim: quem abre joga a mesma copa, com os mesmos adversários e os mesmos sorteios. Quem vai mais longe?',
            },
        ],
    },
    pokedex: {
        title: 'Perfil, Coleção e Sala de troféus',
        blocks: [
            {
                list: [
                    [
                        'Pokédex',
                        '**visto** = apareceu no seu draft, nas recompensas ou no time adversário. **Jogou** = entrou em quadra pelo seu time por pelo menos 1 minuto. Guarda partidas, títulos e a maior nota de cada um.',
                    ],
                    ['Golpedex', 'os golpes entram quando aparecem em campo nas suas partidas (dos dois times).'],
                    [
                        'Três portas na tela inicial',
                        '**Perfil** (treinador, título, clube e amigos), **Coleção** (Pokédex, Álbum e Golpedex) e **Sala de troféus** (taças, medalhas e números da carreira).',
                    ],
                ],
            },
        ],
    },
    conta: {
        title: 'Conta e nuvem',
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
};

const faq: { q: string; a: HelpDictBlock[] }[] = [
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
            { link: 'Mandar feedback' },
        ],
    },
];

export const help = {
    sections,
    faq,
    /** Pedaços das listas montadas com os números do motor. */
    gen: {
        tacticFeel: {
            balanced: 'o time joga no meio-termo',
            offensive: 'linhas altas e mais chutes, mas abre espaço atrás',
            defensive: 'bloco baixo, ataca pouco',
            counter: 'o Pivô espera lá na frente pra puxar o contra-ataque',
        } as Record<string, string>,
        tacticLine: '{feel}. {attrs}{drain}.',
        drainMore: '; cansa mais ({pct})',
        drainLess: '; cansa menos ({pct})',
        formationLine: '{positions} (e o goleiro). {description}',
        linkTerm: '{name} ({pct})',
        linkLine: '{desc} Combo: {combo}.',
        gymLine: 'tipo {types}, {formation}, {tactic}.',
    },
    screen: {
        title: 'Ajuda',
        replay: 'Ver o passo a passo de novo',
        tipsBack: 'Dicas de volta nas telas',
        tipsShow: 'Mostrar as dicas de novo',
        searchLabel: 'Buscar na ajuda',
        searchPlaceholder: 'Buscar: evolução, pênaltis, itens…',
        nothing: 'Nada encontrado pra “{query}”.',
        notFound: 'Não achou o que queria?',
        askUs: 'Pergunta pra gente',
        faq: 'Perguntas frequentes',
    },
    tip: {
        label: 'Dica:',
        close: 'Fechar dica',
    },
    onboarding: {
        count: 'Como jogar · {n}/{total}',
        skip: 'Pular',
        carousel: 'carrossel',
        step: 'passo',
        stepOf: '{n} de {total}',
        goToStep: 'Ir para o passo {n}: {title}',
        prev: 'Anterior',
        next: 'Próximo',
        go: 'Bora jogar',
        welcomeTitle: 'Bem-vindo ao Soccermon',
        welcomeText: 'Os **151 de Kanto** num futsal 5 contra 5. Monte o time e ganhe a copa.',
        draftTitle: 'Draft: 1 de 3',
        draftText: 'Toque numa vaga: saem 3 Pokémon e você leva 1. Não gostou? **Sorteie de novo**.',
        coachTitle: 'Você é o técnico',
        coachText: 'Mude a tática e troque quem cansar. Quem joga muito **evolui no meio do jogo**!',
        tactic: 'Tática',
        sub: 'Substituir',
    },
};
