/**
 * Ajuda: "Como funciona" de cada modo, as regras que não aparecem na tela e as perguntas frequentes.
 *
 * Blocos das seções: `p` = parágrafo; `list` = lista (texto, ou [termo, explicação]); `dyn` = lista montada
 * com os números do motor (src/ui/help/content.ts); `link` = botão para o feedback. `**negrito**` funciona e
 * `{nome}` é trocado pelos números do jogo.
 */
export type HelpDictBlock =
    | { p: string }
    | { list: (string | [string, string])[] }
    | { dyn: 'links' | 'tactics' | 'maxLevels' | 'maxTypes' }
    | { link: string };

export type HelpSectionId =
    | 'posicoes'
    | 'cartas'
    | 'tipos'
    | 'golpes'
    | 'status'
    | 'sinergias'
    | 'partida'
    | 'golpeMax'
    | 'evolucao';

export interface HelpDictSection {
    title: string;
    blocks: HelpDictBlock[];
}

const sections: Record<HelpSectionId, HelpDictSection> = {
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
                        'Bind, Wrap, Clamp e Fire Spin atordoam o alvo um instante e deixam lento; Constrict só deixa lento. Cada um tem ainda um jeito próprio (veja na Golpedex).',
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
    status: {
        title: 'Status',
        blocks: [
            {
                list: [
                    ['Paralisado', 'Velocidade −40% e Drible −15% por 6 s.'],
                    ['Dormindo', 'fica fora do lance por 2,5 s.'],
                    ['Congelado', 'fica parado por 2,5 s.'],
                    ['Envenenado', 'perde fôlego por 10 s.'],
                    ['Queimado', 'Chute e Força −20% e perde fôlego por 8 s.'],
                    ['Confuso', 'Passe −30% e Chute −15% por 4 s.'],
                    ['Apaixonado', '(Cute Charm) trava por 1,5 s.'],
                    ['Hesitante', '(Bite, King’s Rock…) perde o tempo da jogada.'],
                ],
            },
            {
                p: 'Status passa sozinho depois de um tempo. Habilidades e itens podem evitar ou encurtar (Limber, Insomnia, Lum Berry…).',
            },
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
                        'duplas e grupos famosos de Kanto ganham bônus juntos em quadra e podem soltar um **combo**: passe de um, chute do outro, 20% mais forte e 50% mais preciso (1 vez por tempo). As **especiais** (os 3 Pássaros Lendários, os 3 iniciais, Mew + Mewtwo) completas dão mais e as cartas brilham juntas. Tipo + história somam até +15%.',
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
            { dyn: 'tactics' },
            {
                p: '**Fôlego:** cai com o esforço (menos pra quem tem HP alto) e cansado rende menos (−28% nos atributos com o fôlego zerado). O intervalo recupera 30% do fôlego. O time rival pode trocar o mais cansado no intervalo.',
            },
            {
                p: '**Garra:** perdendo por 3 gols ou mais, o time ganha +6% em todos os atributos, mais 3% por gol de diferença acima de 3 (máximo +14%).',
            },
            {
                p: '**Pênaltis:** empate no fim vai pra 5 cobranças por time e depois morte súbita. Batem os melhores chutadores, e o tipo do batedor contra o do goleiro conta.',
            },
            {
                p: 'Saiu no meio? A escalação fica travada e, ao voltar, a mesma partida continua de onde estava.',
            },
        ],
    },
    golpeMax: {
        title: 'Golpe máximo do capitão',
        blocks: [
            {
                p: 'Todo capitão tem um **golpe máximo**, com 3 níveis: **N1**, **N2** e **N3**. {maxWho}',
            },
            { p: '{maxFill}' },
            { dyn: 'maxLevels' },
            {
                p: '**Na hora certa:** com capitão de linha, o botão acende com a bola no pé dele perto do gol, e o golpe sai na hora. {maxTiming} Atalho: M. **Esperar** guarda pro próximo nível.',
            },
            {
                p: '**Capitão no gol:** o golpe dele é a **bicuda**. O botão acende só no chute do rival que ele vai alcançar. No toque, em vez de defender, ele devolve: no N1 e no N2 num lançamento pro ataque (o N2 derruba quem estiver no caminho); no N3, chutando no gol rival. Toque fora da hora: a bicuda sai do mesmo jeito, só que mais fraca.',
            },
            {
                p: 'O status do N1 e o efeito do N3 vêm do tipo do golpe, se ele for de um tipo do Pokémon (senão, do 1º tipo dele):',
            },
            { dyn: 'maxTypes' },
            { p: 'Na carta completa de cada Pokémon tem a seção **Golpe máximo**, com o que ele faz em cada nível.' },
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
        a: [
            { p: 'Entre com Google nos dois aparelhos. O save vai pra nuvem e acompanha sua conta.' },
            {
                p: 'Ao entrar, vale o save mais recente. Recordes, Pokédex e carreira juntam o melhor dos dois. A conta se apaga em Configurações.',
            },
        ],
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
        linkTerm: '{name} ({pct})',
        linkLine: '{desc} Combo: {combo}.',
        /** Golpe máximo: os 3 níveis em geral (o da carta é o de cada Pokémon). */
        maxRow: [
            'chute com {pw} de força e o status do tipo em quem bloquear ou defender.',
            'chute com {pw} e derruba quem estiver no caminho (o goleiro não cai).',
            'chute com {pw}, sempre no alvo, com a cena do especial e o efeito do tipo (12 Pokémon têm assinatura própria).',
        ],
        maxTypeLine: 'N1 {st} quem bloquear ou defender · N3: {fx}.',
    },
    screen: {
        title: 'Ajuda',
        tipsBack: 'As dicas voltaram à tela.',
        tipsShow: 'Mostrar as dicas de novo',
        searchLabel: 'Buscar na ajuda',
        searchPlaceholder: 'Buscar: evolução, pênaltis, status…',
        nothing: 'Nada encontrado pra “{query}”.',
        notFound: 'Não achou o que queria?',
        askUs: 'Pergunta pra gente',
        groups: { team: 'Montar o time', match: 'A partida' },
        faq: 'Perguntas frequentes',
    },
    /** Leitor de tela: o carrossel de formações. */
    carousel: 'carrossel',
    tip: {
        label: 'Dica:',
        close: 'Fechar dica',
    },
    coach: {
        skip: 'Pular',
        next: 'Próximo',
        done: 'Entendi',
        count: '{n} de {total}',
        label: 'Dica do tutorial',
        intro: ['Primeira vez? Comece pela Copa Relâmpago: 4 jogos, uns 10 minutos.', 'As regras ficam aqui.'],
        rota: [
            'Toque numa casa acesa e depois em Ir.',
            'A 1ª partida não dá cartão. Depois, uma derrota vale amarelo e a segunda, vermelho.',
            'Vitória dá ₽ (o Jogo paga mais). Gaste no Mercado ou guarde pra render juros.',
        ],
        rotaGrupo: ['Aqui a derrota não dá cartão.'],
        rotaNova: ['Agora tem a Rota Índigo: copa longa pelos ginásios de Kanto.'],
        relampago: ['Mata-mata de 4 jogos: perdeu, acabou. Escolha a formação.'],
        relampagoDraft: ['Toque numa vaga: saem 3 e você leva 1.'],
        relampagoVestiario: ['Toque em dois pra trocar. A chave abre no cartaz do rival.'],
        relampagoJogo: ['Mude a tática e troque jogadores. Quem joga muito evolui.'],
        duelo: ['Entre sem conta. Depois você cria a sala e manda o link.'],
        dueloSala: ['Em Regras: velocidade, duração e Melhor de 3.', 'Crie a sala e mande o link pro amigo.'],
        dia: ['Mesmo draft e mesmos rivais pra todo mundo hoje.', 'Só a primeira tentativa conta pro ranking.'],
        liga: [
            'Ganhar sobe o Elo, perder desce.',
            'Você enfrenta o time salvo de outro treinador. Ele não precisa estar online.',
        ],
        golpe: ['Barra no N1: o golpe máximo do capitão liberou.', 'Toque quando o círculo verde fechar.'],
        utRepetida: ['Repetida não entra no Clube: venda ou troque pela que você já tem.'],
        /** "Como funciona" na Ajuda: o que cada um é, numa linha (embaixo do nome). */
        replayLine: {
            intro: 'A tela inicial: escolha o modo e jogue.',
            rota: 'Copa longa por Kanto, de ginásio em ginásio.',
            rotaGrupo: 'O fim da Rota: grupo de 3 jogos e a Final.',
            relampago: 'Mata-mata de 4 jogos: perdeu, acabou.',
            golpe: 'O chute especial do capitão, em 3 níveis.',
            duelo: 'Ao vivo contra um amigo, pelo link. Sem conta.',
            dia: 'A mesma copa pra todo mundo hoje, com ranking.',
            liga: 'Contra o time salvo de outro treinador. Vale Elo.',
        } as Record<string, string>,
        replay: {
            title: 'Como funciona',
            hint: 'Os balões voltam na próxima vez que você entrar no modo.',
            done: 'Vai aparecer de novo',
            intro: 'Estádio',
            rota: 'Rota Índigo',
            rotaGrupo: 'Planalto',
            relampago: 'Copa Relâmpago',
            duelo: 'Duelo',
            dia: 'Copa do Dia',
            liga: 'Liga',
            golpe: 'Golpe máximo',
        },
    },
};
