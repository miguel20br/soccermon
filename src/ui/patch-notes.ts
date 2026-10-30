/** Notas da atualização mostradas na Home ("Novidades"). A mais nova primeiro. */
export interface PatchNotes {
    version: string;
    /** Dia do lançamento, AAAA-MM-DD (da tag). */
    date: string;
    title: string;
    sections: { title: string; lines: string[] }[];
}

export const PATCH_NOTES: PatchNotes[] = [
    {
        version: '0.9.29',
        date: '2026-10-31',
        title: 'Rota nova',
        sections: [
            {
                title: 'Rota Índigo',
                lines: [
                    'Cada ramo do mapa tem os seus tipos, e todo Jogo mostra o prêmio antes de você ir',
                    'Toda vitória num Jogo contrata 1 de 3 do time rival, e depois vem o prêmio da casa',
                    'Ginásio mais difícil (rival +2), com a carta do líder garantida, a MT dele e um item',
                    'Até 2 Mercados por caminho, e a linha do Baú pode ser um Centro Pokémon, que tira o amarelo ou traz de volta quem estava fora',
                    'Eventos novos: Fósseis do Mt. Moon, Pássaro lendário, Assalto da Equipe Rocket, Aposta do Blue, Juiz da Liga e Ovo da Creche',
                    'Nos eventos e no Treino, tocar marca e um botão confirma',
                ],
            },
            {
                title: 'Menu de modos',
                lines: [
                    'Os três modos em fatias, estilo tela de seleção de luta, com o seu capitão saindo da borda',
                    'O Modo Treinador agora se chama Time Ultimate, e os modos que ainda não chegaram mostram a data',
                ],
            },
            {
                title: 'Pênaltis',
                lines: [
                    'Na ordem dos cobradores, cada um mostra o chute',
                    'No celular, a câmera da disputa não corta mais o gol',
                ],
            },
        ],
    },
    {
        version: '0.9.28',
        date: '2026-10-30',
        title: 'Golpe caprichado',
        sections: [
            {
                title: 'Golpe máximo',
                lines: [
                    'O anel agora fecha em cima de um anel-alvo parado, que acende na hora do perfeito',
                    'O toque responde na hora: no perfeito, clarão, estrelas, moedas e a quadra treme',
                    'Sons novos para o toque e para cada nível',
                    'O N3 chega mais rápido: cada nível da barra pede 10 pontos em vez de 12',
                ],
            },
            {
                title: 'Menus',
                lines: [
                    'Música nova nos menus, mais calma e com o SOC-CER-MON de leve',
                    'O logo pisca o SOC-CER-MON no ritmo da música em todas as telas',
                    'Toda tela de menu tem a mesma barra em cima, com o voltar sempre no mesmo lugar, e o treinador ficou maior',
                    'As Novidades ficam no canto de cima, com um pontinho quando sai versão nova',
                    'No Estádio, cada modo tem a sua placa em cima do JOGAR',
                    'Da Sede, uma porta abre pra Sala de troféus, e o voltar volta pra Sede',
                    'O Duelo ganhou a cara das outras telas de menu',
                    'O símbolo do Soccermon entrou no lugar da pokébola nas taças e nos escudos',
                ],
            },
            {
                title: 'Mais leve',
                lines: [
                    'A partida e a Rota gastam bem menos processador no celular, e os menus usam metade da memória',
                    'O jogo abre mais rápido',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'O mapa da Rota contava a partida de dois jeitos diferentes',
                    'A barra da copa não some mais ao rolar o mapa',
                    'A Ajuda e os Créditos voltam pra tela de onde você abriu',
                    'Vender o capitão que estava no banco deixava um fantasma no time',
                    'Com o celular deitado, o botão de ir pra casa do mapa da Rota ficava fora da tela',
                    'A Final mostrava o nome do Planalto Índigo em inglês',
                ],
            },
        ],
    },
    {
        version: '0.9.27',
        date: '2026-10-30',
        title: 'Modos de jogo',
        sections: [
            {
                title: 'Modos de jogo',
                lines: [
                    'Quem já jogou começa num menu de modos: Modo Copa (tudo o que já existe), Modo Treinador (chega no fim de novembro) e Modo História (2027)',
                ],
            },
            {
                title: 'Golpe máximo',
                lines: [
                    'Um anel fecha uma vez no ritmo da música: toque quando ele encostar. Cada nível tem cara e som próprios, e o perfeito tem som de perfeito',
                    'Na hora do golpe a música abaixa e a quadra desacelera',
                    'Chame o capitão: o botão acende em todo ataque do seu time e a bola procura ele. O fixo chamado conduz até a zona e chuta de lá',
                    'O pivô solta o golpe de mais longe, igual ao ala',
                    'A defesa máxima só gasta a barra quando defende: sem chute, a barra volta inteira. O goleiro capitão usa no N3',
                ],
            },
            {
                title: 'Sede e Laboratório',
                lines: [
                    'Os Pokémon desviam dos móveis e param de vez em quando',
                    'Toque várias vezes seguidas num Pokémon e ele cai de costas',
                ],
            },
            {
                title: 'Corrigido',
                lines: ['O Mew shiny do seu treinador aparece shiny no mapa da Rota'],
            },
        ],
    },
    {
        version: '0.9.26',
        date: '2026-10-29',
        title: 'Escudos',
        sections: [
            {
                title: 'Amigos',
                lines: ['Cada amigo aparece com o escudo de verdade do clube dele: formato, símbolo e cores'],
            },
            {
                title: 'Corrigido',
                lines: [
                    'O acento de letras como o Í de Índigo não fica mais cortado nos letreiros e nos nomes',
                    'No computador, a Sede e o Laboratório preenchem a tela',
                    'Depois de uma atualização, o jogo aberto há muito tempo recarrega sozinho em vez de dar erro',
                ],
            },
        ],
    },
    {
        version: '0.9.25',
        date: '2026-10-29',
        title: 'Amigos',
        sections: [
            {
                title: 'Amigos',
                lines: [
                    'Toque no nome de qualquer treinador (rankings, Liga, Duelo, lista de amigos) pra ver o perfil, pedir amizade ou desafiar',
                    'O escudo do clube aparece ao lado do nome dos seus amigos',
                ],
            },
            {
                title: 'Duelo',
                lines: ['O Desafiar da lista de amigos voltou a mandar o convite. Na sala aparece se ele chegou'],
            },
            {
                title: 'Corrigido',
                lines: ['As gavetas sobem mais suaves no celular'],
            },
        ],
    },
    {
        version: '0.9.24',
        date: '2026-10-28',
        title: 'Beira da quadra',
        sections: [
            {
                title: 'Partida nova',
                lines: [
                    'No celular em pé, a quadra ficou com o dobro do tamanho e a câmera acompanha a bola',
                    'Tática, Trocar, Tempo e Lances viraram 4 botões perto do polegar',
                    'Em Configurações você escolhe até que velocidade a câmera fica de perto',
                ],
            },
            {
                title: 'Duelo',
                lines: ['Se a sala do link demora pra abrir, aparece o botão Jogar uma copa enquanto você espera'],
            },
            {
                title: 'Menus',
                lines: ['O logo do Soccermon voltou pra tela inicial'],
            },
            {
                title: 'Corrigido',
                lines: [
                    'No computador, a barra de velocidade cabe inteira na tela',
                    'Com o celular deitado, o intervalo cabe sem texto cortado',
                    'O zoom no escanteio não mostra mais o fundo escuro fora da quadra',
                ],
            },
        ],
    },
    {
        version: '0.9.23.3',
        date: '2026-10-27',
        title: 'Pedidos dos jogadores',
        sections: [
            {
                title: 'Golpe Máximo',
                lines: [
                    'O chute do nível 3 ficou quase indefensável: 57% ⇒ 82% de gol. A defesa máxima do goleiro ainda pode parar',
                ],
            },
            {
                title: 'Partida',
                lines: [
                    'Substituição pede confirmação e mostra a nota de quem sai e de quem entra naquela vaga',
                    'No Duelo, as abas de baixo também ficam fechadas até você tocar',
                ],
            },
            {
                title: 'Menus',
                lines: [
                    'A Sede tem os Pokémon que você mais usa andando pela sala. Toque no artilheiro pra ver os gols',
                    'Escalação no celular: o botão Carta abre a carta de quem está selecionado',
                    'Cartão do treinador no celular com as 3 cartas lado a lado',
                    'Copa do Dia: o ranking de hoje fica embaixo do JOGAR, e depois de jogar o botão leva pra ele',
                    'Cartas do pacote no ritmo da música virou opção em Configurações (vem desligada)',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Retomar uma copa guardada ficava trocando de copa sem sair do lugar',
                    'Escalação com o celular deitado cabe sem rolar',
                ],
            },
        ],
    },
    {
        version: '0.9.23.2',
        date: '2026-10-27',
        title: 'Faxina',
        sections: [
            {
                title: 'Menos coisa na tela',
                lines: [
                    'Painéis mais leves: borda fina, sem moldura grossa e sem caixa dentro de caixa',
                    'Instruções e dicas só aparecem na primeira copa. Depois elas ficam na Ajuda (?)',
                    'A barra de cima mostra só o treinador. Troféus, Pokédex e insígnias ficam no lugar de cada um',
                    'O Estádio perdeu os 4 quadros de metas, e o logo grande só aparece na primeira visita',
                    'O Prof. Carvalho fala uma vez só. A Sede mostra a missão mais perto de sair, e a Arena junta a Liga numa linha',
                ],
            },
            {
                title: 'Copa',
                lines: [
                    'Escalação: a formação abre numa janela com os bônus, o rival vira uma linha e a carta só aparece quando você toca num Pokémon',
                    'Resultado mais curto: posse, chutes e a chave ficam em Estatísticas, e o treinador desbloqueado vira um aviso que some',
                    'Mercado: o que a vitória rendeu cabe numa frase',
                    'Partida no celular: uma coisa por vez em cima da quadra (o gol primeiro), e as abas de baixo ficam fechadas até você tocar',
                ],
            },
            {
                title: 'Em toda tela',
                lines: [
                    'Monitor grande: tudo fica maior, sem a coluninha perdida no meio',
                    'Celular deitado: a Escalação, o Draft e o Resultado cabem na tela',
                    'Nada de nome cortado em celular pequeno',
                    'Avatar shiny agora aparece shiny no Estádio e na Arena',
                ],
            },
        ],
    },
    {
        version: '0.9.23.1',
        date: '2026-10-26',
        title: 'Ajustes nos lugares',
        sections: [
            {
                title: 'Corrigido',
                lines: [
                    'Tocar num Pokémon fazia ele pular de lugar. Agora ele só dá o pulinho, e quem precisa mudar de lugar some e reaparece',
                    'A quadra da Arena ganhou as áreas, os gols e os escanteios',
                    'Fechar uma janela (Tática, carta, confirmação) não pisca mais escuro',
                    'As cartas do draft voltaram a mostrar os atributos como antes',
                ],
            },
            {
                title: 'Golpe Máximo',
                lines: [
                    'O botão fica aceso mais tempo e o jogo quase para enquanto ele brilha, até no 8x e no Duelo',
                    'O chute do golpe vai em câmera lenta com a bola brilhando, e o nome do golpe de nível 3 fica mais tempo na tela',
                ],
            },
        ],
    },
    {
        version: '0.9.23',
        date: '2026-10-26',
        title: 'Vestiário',
        sections: [
            {
                title: 'Escalação no vestiário',
                lines: [
                    'A escalação fica numa lousa de tática: a Chave e a Tática são quadros pendurados, cada um abre a sua janela',
                    'A prancheta encosta na lousa e o time inteiro aparece na primeira tela do celular',
                    'Na copa, a barra de cima mostra a fase, os ₽ e os sorteios',
                ],
            },
            {
                title: 'Mais simples',
                lines: [
                    'Janelas sobem de baixo no celular, com o X redondo. Toda confirmação virou uma janela curta',
                    'O pacote da vitória abre sozinho, e Pular e Sortear de novo ficam juntos embaixo',
                    'O fim de jogo espera você tocar em Ver resultado',
                    'Treinador ou título novo aparece logo abaixo do placar',
                    'Mercado mais curto: os Patrocínios ficam numa linha que abre a janela',
                    'Draft sem a mesma instrução repetida, e os atributos das cartas maiores',
                    'O Golpe Máximo fica sempre à vista na barra de baixo da partida. Tocar antes da hora explica quando acende',
                ],
            },
            {
                title: 'Visual novo',
                lines: [
                    'Estádio: as metas sobem pra arquibancada e o botão de jogar fica embaixo, com a quadra livre',
                    'Começar a copa, entrar em quadra e virar campeão ganham uma transição com papel de parede (um desenho diferente a cada vez)',
                    'Perfil, Coleção, Sala de troféus, Ajuda e Configurações com a barra de cima, abas de pasta e barras de progresso novas',
                    'Intervalo, ordem dos pênaltis e Campeão no mesmo estilo dos botões',
                    'O aviso rápido desce do topo: verde quando deu certo, vermelho quando deu errado',
                ],
            },
            {
                title: 'Novo',
                lines: [
                    'Jogar como app: nas Configurações, Instalar põe o Soccermon na tela inicial do Android, em tela cheia (no iPhone, Compartilhar e Adicionar à Tela de Início)',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'A tela não pisca mais preta ao trocar de menu',
                    'O Esperar do Golpe Máximo saía da tela em celular pequeno',
                ],
            },
        ],
    },
    {
        version: '0.9.22',
        date: '2026-10-26',
        title: 'Botão de apertar',
        sections: [
            {
                title: 'Visual novo',
                lines: [
                    'Botões com relevo no jogo inteiro: afundam e quicam no toque, com som',
                    'A cor diz o que o botão faz: dourado joga, verde segue ou compra, azul é o resto, vermelho só pra apagar ou sair',
                    'Um botão grande por tela, o do próximo passo. Comprar e Escalar viraram um selo na própria carta',
                    'Painéis com moldura grossa e o título numa placa, igual ao Estádio',
                    'O que está escolhido fica sempre em azul',
                ],
            },
            {
                title: 'Melhorado',
                lines: [
                    'Nível de treinador na barra de cima: sobe com as missões cumpridas',
                    'Draft: as 3 cartas cabem na primeira tela do celular',
                    'Monta pra mim ficou mais discreto: quem quer escolher escolhe',
                    'O aviso rápido não cobre mais o botão de baixo',
                    'A confirmação de Abandonar copa não fica mais atrás da barra do Jogar',
                ],
            },
        ],
    },
    {
        version: '0.9.21',
        date: '2026-10-25',
        title: 'Cada modo no seu lugar',
        sections: [
            {
                title: 'Nova tela inicial',
                lines: [
                    'A tela inicial virou cinco lugares, numa barra embaixo: Laboratório, Rota Índigo, Estádio, Arena e Sede. Toque ou arraste de lado pra trocar',
                    'Estádio: um JOGAR dourado, a pílula pra escolher o modo e quatro metas à vista (Copa do Dia, missão, insígnias e cinturão)',
                    'Rota Índigo: o mapa de Kanto com as insígnias e o seu time onde parou',
                    'Laboratório do Carvalho: Pokédex, Álbum e Golpedex',
                    'Arena: Duelo e Liga',
                    'Sede do clube: Sala de troféus, perfil e o quadro de missões',
                    'Pokémon selvagens andam, dormem e brincam em cada lugar. Toque neles',
                    'O céu acompanha a hora do dia',
                ],
            },
            {
                title: 'Alterado',
                lines: [
                    'Novidades, Ajuda, Créditos e o resto do rodapé ficaram nas Configurações',
                    'Quem prefere a tela antiga ainda abre com ?lab=off no endereço',
                ],
            },
        ],
    },
    {
        version: '0.9.20',
        date: '2026-10-25',
        title: 'Textos revistos e a 1ª partida',
        sections: [
            {
                title: 'Melhorado',
                lines: [
                    'Textos do jogo revistos (Home, draft, partida e narração): frases mais curtas e naturais, "pra" no lugar de "para"',
                    'Os golpes aparecem com o nome oficial em inglês em todo o jogo',
                    'Tática Equilibrada mostra o número certo (+4% / +3%)',
                    'A dica do intervalo ficou mais clara',
                ],
            },
            {
                title: 'Corrigido',
                lines: ['O balão "Mude a tática…" agora aparece só depois do 1º gol ou no intervalo da 1ª partida'],
            },
        ],
    },
    {
        version: '0.9.19',
        date: '2026-10-24',
        title: 'Rota Índigo e celular deitado',
        sections: [
            {
                title: 'Adicionado',
                lines: ['Depois da 1ª copa, um balão na tela inicial apresenta a Rota Índigo (aparece uma vez só)'],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Celular deitado pequeno: as recompensas depois da partida cabem na tela sem rolar',
                    'Celular deitado pequeno: os botões do intervalo (Substituir e Começar o 2º tempo) ficam sempre à vista',
                ],
            },
        ],
    },
    {
        version: '0.9.18',
        date: '2026-10-24',
        title: 'Assinaturas e primeira visita',
        sections: [
            {
                title: 'Assinaturas do nível 3',
                lines: [
                    '12 Pokémon trocam o efeito do tipo no golpe máximo nível 3 por um golpe só deles, com animação e faixa próprias',
                    'Dragonite, Hiper Raio: fura todos os bloqueios. Alcance do goleiro rival x0,8 ⇒ x0,85 (Fúria do dragão ⇒ raio)',
                    'Snorlax, Pancada: se joga no chute e quem estiver a até 4 m dele cai 1 s e fica paralisado',
                    'Snorlax no gol, Soneca: na defesa máxima nível 3 deita na frente do gol. Alcance x1,4 ⇒ x1,8',
                    'Arcanine, Estrela de fogo: estoura na frente do gol e quem estiver a até 4 m dela cai 0,6 s e se queima',
                    'Articuno, Nevasca: a área rival inteira congela 1,2 s (antes, só quem estava na linha do chute, 1 s)',
                    'Blastoise, Dois canhões: o 1º não entrou? A bola volta pra ele e ele emenda de qualquer distância',
                    'Charizard, Voo em chamas: voa até 2 m rumo ao gol, chuta por cima e queima o goleiro que defender',
                    'Pikachu, Raio em cadeia: o raio salta do goleiro pros 2 rivais mais perto e paralisa 1,5 s',
                    'Gengar, Come-sonho: o goleiro cochila, alcance x0,8 ⇒ x0,75, até goleiro Normal (antes ele não caía)',
                    'Mewtwo, Telecinese: a bola curva até ~11° pro canto longe do goleiro (antes ~8°) e o goleiro fica com alcance x0,9',
                    'Gyarados, Tsunami: empurra todos os rivais 3 m (antes só a linha do chute, 2,5 m) e fica em fúria por 6 s',
                    'Mew, Metrônomo: sorteia um dos 16 efeitos de tipo a cada golpe máximo',
                    'Ditto, Transformação: copia o efeito do capitão rival, até a assinatura dele',
                    'Evoluiu pra forma final no meio da copa? A assinatura vem junto',
                    'Golpe que pega vários de uma vez (a Pancada do Snorlax) mostra PARALISADO uma vez só, no do meio; os outros ficam com o ícone',
                    'A caixa de batalha sai da frente quando entra o gol ou a faixa do nível 3',
                    'Nome comprido na faixa (PANCADA DO SNORLAX) encolhe pra caber no celular em pé',
                ],
            },
            {
                title: 'Primeira visita',
                lines: [
                    'Quem chega pela 1ª vez vê a Home com um botão só: Jogar (Copa Relâmpago, 4 jogos). Os outros modos ficam em Mais modos',
                    'Na 1ª copa, Monta pra mim vira o botão principal do draft, e o balão explica ele antes de ensinar a montar na mão',
                    'Quem já jogou continua caindo na Home de sempre',
                ],
            },
            {
                title: 'Celular e consertos',
                lines: [
                    'Celular em pé: quando dois nomes se encostam na quadra, o nome encurta pra 5 letras antes de sumir',
                    'Save que carregava antes da tela: o balão do tutorial sumia e a Home de quem voltou ficava sem os modos',
                    'Celular em pé: depois de escolher a ordem dos pênaltis, a quadra volta pra tela (a disputa ficava fora da vista)',
                ],
            },
        ],
    },
    {
        version: '0.9.17',
        date: '2026-10-23',
        title: 'Nível 3 de especial e quem leva o golpe',
        sections: [
            {
                title: 'Golpe máximo nível 3',
                lines: [
                    'A quadra congela 0,3 s na cor do tipo e uma faixa atravessa a tela com o retrato do capitão',
                    'Na faixa: o golpe, o efeito do tipo ("Hyper Beam · efeito Dragão") e a nota do toque, PERFEITO! ou BOM',
                    'No gol, na defesa, no bloqueio ou na trave sai uma onda de choque na cor do tipo',
                ],
            },
            {
                title: 'Golpes em quadra',
                lines: [
                    'Quem é atingido por um golpe de efeito é empurrado pra trás e ganha a palavra na cor do tipo: QUEIMADO, CONFUSO, DERRUBADO',
                    'Rasteira, arremesso, carrinho com golpe e o nível 3 de Normal e Terrestre derrubam: o Pokémon tomba e fica com estrelinhas',
                    'O status virou um ícone com um anel que mostra quanto falta, no lugar de PAR e BRN',
                    'No painel do jogador: quem causou o status e quanto falta ("Zubat foi confundido por Psychic (2 s)")',
                    'Chute com golpe: o rastro da bola agora tem a partícula do tipo (fogo sobe, água pinga). Antes saía sempre a estrelinha do Normal',
                ],
            },
            {
                title: 'Celular e tutorial',
                lines: [
                    'Celular deitado de tela baixa: golpe máximo e Esperar ficam lado a lado, sem tampar a quadra',
                    'Tocar fora do balão do tutorial fecha o balão e já vale pro botão tocado',
                    'Na 1ª visita, o balão não rola mais a página à toa e o logo da Home não some',
                ],
            },
        ],
    },
    {
        version: '0.9.16',
        date: '2026-10-23',
        title: 'Golpe máximo por tipo e 4 Patrocínios',
        sections: [
            {
                title: 'Golpe máximo por tipo',
                lines: [
                    'No nível 3, o golpe máximo ganha o efeito do tipo do capitão: um efeito pra cada um dos 16 tipos',
                    'Charizard solta a Bola em chamas, Blastoise empurra a defesa com a Onda e Gengar atravessa o zagueiro com a Bola fantasma',
                    'Alakazam curva a bola, Dugtrio derruba os zagueiros a até 6 m do gol e Scyther solta o Enxame: o goleiro pode pular na isca',
                    'Pikachu solta o Raio: bola x1,15 mais rápida e quem bloquear ou defender fica paralisado por 1,5 s',
                    'O ícone do tipo aparece no botão: apagado nos níveis 1 e 2, aceso no 3',
                    'Botão Esperar: guarda o golpe máximo pro próximo nível sem câmera lenta',
                    'Capitão de dois tipos: vale o tipo do golpe máximo, se for um dos tipos dele',
                    'Os líderes rivais também usam o efeito do capitão deles',
                    'O chute do nível 3 mira mais pro meio do gol: bem menos bola pra fora',
                ],
            },
            {
                title: 'Patrocínios',
                lines: [
                    '4 Patrocínios novos no Mercado, ₽10 cada',
                    'Olheiro de Viridian: Pokémon avulsos e pacotes do Mercado com a raridade da fase seguinte',
                    'Preparador de Lavender: +6 de fôlego pro time todo',
                    'Charanga de Pewter: +4 em tudo enquanto o time perde. Quando ela entra, aparece "A CHARANGA ENTROU" na quadra',
                    'Clube Formador de Pallet: pontos pro seu time evoluir 14 ⇒ 10',
                ],
            },
        ],
    },
    {
        version: '0.9.15',
        date: '2026-10-23',
        title: 'Rota de baby',
        sections: [
            {
                title: 'Rota Índigo',
                lines: [
                    'A Rota começa na forma-base: o capitão e o draft saem como Charmander, Machop, Magikarp, e o time evolui pelo caminho',
                    'Nota média do time no começo da Rota: 79,5 ⇒ 64,6',
                    'Os mais fortes sem evolução (Snorlax, Lapras, lendários) só aparecem de reforço, depois do começo',
                    'Sair da Rota e voltar traz o mesmo sorteio: a Rota só muda quando você termina uma',
                    'Os rivais do começo ficaram mais fracos: 1ª partida -1 ⇒ -2 e 2ª partida 0 ⇒ -1',
                ],
            },
        ],
    },
    {
        version: '0.9.14',
        date: '2026-10-23',
        title: 'Golpe máximo em 3 níveis, na batida',
        sections: [
            {
                title: 'Golpe máximo',
                lines: [
                    'A barra agora tem 3 níveis e enche de novo depois de usar: golpe máximo por partida 1 ⇒ vários (a barra recarrega)',
                    'Solte no nível 1 ou segure pro nível 3, o chute mais forte do jogo: força do chute x1,55 ⇒ x1,25 / x1,55 / x2,2 (níveis 1 / 2 / 3)',
                    'No nível 3 o goleiro rival fica com alcance x0,7 nesse chute',
                    'Toque quando o anel fechar no botão, na batida da música: PERFEITO! sai mais forte',
                    'Sem som, o anel segue um pulso na tela',
                    'Tocou um pouco antes de acender? O golpe sai no próximo chute',
                    'Os líderes também tocam na batida, e o Lance quase sempre acerta',
                ],
            },
            {
                title: 'Defesa máxima',
                lines: [
                    'Com o capitão no gol, o nível dá mais tempo de defesa: 4 s ⇒ 0,75 s / 4 s / 6 s (níveis 1 / 2 / 3)',
                    'O toque perfeito segura a bola',
                ],
            },
        ],
    },
    {
        version: '0.9.13',
        date: '2026-10-22',
        title: 'Novidades mais fáceis de ler',
        sections: [
            {
                title: 'Novidades',
                lines: [
                    'A versão mais nova fica no topo, em destaque, com a data',
                    'As antigas ficam recolhidas: toque para abrir',
                ],
            },
        ],
    },
    {
        version: '0.9.12',
        date: '2026-10-22',
        title: 'No ritmo da música',
        sections: [
            {
                title: 'Música',
                lines: [
                    'A logo pisca no SOC-CER-MON de qualquer música, não só na Abertura',
                    'As cartas do draft viram na batida da música',
                ],
            },
        ],
    },
    {
        version: '0.9.11',
        date: '2026-10-22',
        title: 'Viradas na música e temas dos líderes',
        sections: [
            {
                title: 'Música',
                lines: [
                    'Avançar na copa troca a música com virada de bateria e uma ponte',
                    'Cada ponte tem o som da tela que entra',
                    'O VERSUS entra com virada, ponte e prato',
                    'Voltar pra Home continua trocando só no tempo da batida',
                ],
            },
            {
                title: 'Líderes',
                lines: ['Erika, Koga, Sabrina, Blaine e Giovanni ganharam tema próprio antes da partida'],
            },
        ],
    },
    {
        version: '0.9.10',
        date: '2026-10-22',
        title: 'Time no ranking e acabamento',
        sections: [
            {
                title: 'Copa do Dia',
                lines: [
                    'O ranking mostra o time de cada treinador, com o capitão marcado',
                    'A formação avisa quando a tentativa não entra no ranking',
                ],
            },
            {
                title: 'Rota Índigo',
                lines: [
                    'Final perdida aparece como vice, e o segundo amarelo como cartão vermelho',
                    'Patrocínios do mapa com ícone e nome no celular',
                    'A formação da Rota tem botão de voltar',
                ],
            },
            {
                title: 'Acabamento',
                lines: [
                    'Tecla M dispara o golpe máximo',
                    'O volume da música não estala mais ao mexer',
                    'Na Sala de troféus a fala não tampa as taças no celular',
                    'Derrota perdoada fica amarela na barra da Home',
                ],
            },
        ],
    },
    {
        version: '0.9.9',
        date: '2026-10-22',
        title: 'Música no tempo e voltar do Android',
        sections: [
            {
                title: 'Música',
                lines: [
                    'A logo da Abertura pisca a cada SOC-CER-MON da música',
                    'A música troca de tela no tempo da batida',
                    'Disputa de pênaltis com música própria até a cobrança decisiva',
                    'Os Créditos tocam "A última partida"',
                    'Lt. Surge ganhou tema próprio antes da partida',
                    'A Pressão final segura a música até o apito',
                    'Saiu a vinheta da virada no placar',
                ],
            },
            {
                title: 'Celular',
                lines: [
                    'O botão voltar do Android sai da tela em vez de fechar o jogo',
                    'Resultado e escalação mais curtos, com partes que abrem e fecham',
                    'No draft em pé, as vagas do time ficam fixas no topo',
                ],
            },
        ],
    },
    {
        version: '0.9.8',
        date: '2026-10-22',
        title: 'Gritos mais baixos',
        sections: [
            {
                title: 'Som',
                lines: [
                    'Escolher no draft agora é silencioso: só a música toca',
                    'Os gritos dos Pokémon ficaram bem mais baixos, atrás da música',
                ],
            },
        ],
    },
    {
        version: '0.9.7',
        date: '2026-10-22',
        title: 'Música no jogo e Rota com escolhas',
        sections: [
            {
                title: 'Música',
                lines: [
                    'Trilha própria em todas as telas: Abertura, draft, escalação, Mercado, partidas, Planalto e Sala de troféus',
                    'Brock, Misty e Equipe Rocket têm tema e música de partida próprios',
                    'Rota 1, Mt. Moon e Cerulean tocam a música da região no mapa',
                    'Virou o placar no 2º tempo? Toca a vinheta da virada',
                    'Volume da música nas Configurações (zero desliga)',
                ],
            },
            {
                title: 'Rota Índigo',
                lines: [
                    'O mapa agora tem bifurcações de verdade: quase toda rota tem escolha',
                    'Os treinadores da Rota jogam com o tipo deles (Ornitólogo tem pássaro)',
                    'Treino sem ninguém pra evoluir vira Treino de técnica: escolha um item ou MT',
                    'Resultado mostra o ₽ ganho, e o evento diz o que aconteceu',
                    'Mapa melhor no celular, em pé e deitado',
                    'Quem cai no grupo não vê mais "Vitória!"',
                    'Quem estava no meio de uma Rota pode ver rivais diferentes nas próximas casas',
                ],
            },
            {
                title: 'Primeira vez',
                lines: ['Balões curtos mostram onde tocar na primeira vez em cada modo; dá pra pular e rever na Ajuda'],
            },
            {
                title: 'Acessibilidade e consertos',
                lines: [
                    'Jogo inteiro pelo teclado, com foco visível, e o golpe máximo avisa o leitor de tela',
                    '"Sorteio" é o nome único pra sortear de novo',
                    'O Duelo ganhou cabeçalho e botão de voltar',
                ],
            },
        ],
    },
    {
        version: '0.9.6',
        date: '2026-10-22',
        title: 'Beira da quadra e MTs mais fortes',
        sections: [
            {
                title: 'Beira da quadra',
                lines: [
                    'Golpe máximo: a barra enche com os lances do time e o botão acende na hora do chute do capitão',
                    'A zona do chute muda com a posição do capitão: pivô 15 m, ala 18 m, fixo 22 m',
                    'Capitão no gol vira defesa máxima: o próximo chute que ele alcança é defesa',
                    'Goleiro-linha: o goleiro sobe e o time ataca com 5 contra 4, com o gol vazio atrás',
                    'Pedido de tempo: 1 por tempo, o time recupera fôlego e as trocas valem na hora',
                    'O treinador rival da Copa usa as mesmas armas',
                    'Troca e prancheta valem na hora, com a bola rolando; os gritos do técnico saíram',
                ],
            },
            {
                title: 'MTs',
                lines: [
                    'O golpe ensinado por MT sai mais vezes, bate mais forte e ganha o selo MT',
                    'Mega Drain 40 ⇒ 100 de poder, BubbleBeam 65 ⇒ 100, Fissure acerta 30% ⇒ 50%',
                ],
            },
        ],
    },
    {
        version: '0.9.5',
        date: '2026-10-21',
        title: 'Cada formação joga de um jeito',
        sections: [
            {
                title: 'Formações',
                lines: [
                    'Losango: triângulos e passe curto por dentro',
                    'Quadrado: a bola vai pelos lados',
                    'Linha de 3: o pivô vem buscar, faz a parede e quem chega bate de primeira',
                    'Rodízio: os quatro trocam de vaga o tempo todo e saem rápido no contra-ataque',
                    'Dois pivôs: jogo direto, chute logo depois de roubar a bola',
                    'Ferrolho: bloco baixo e fechado, saída rápida',
                    'Cada formação leva vantagem contra outra; o ícone na escalação mostra quando encaixa',
                ],
            },
            {
                title: 'Golpes',
                lines: [
                    'Nidorino, Venonat, Bellsprout, Weepinbell, Victreebel, Slowbro, Chansey e Jolteon têm golpes próprios',
                ],
            },
        ],
    },
    {
        version: '0.9.4',
        date: '2026-10-21',
        title: 'Duelo melhor de 3 e Rota polida',
        sections: [
            {
                title: 'Duelo',
                lines: [
                    'Melhor de 3 com o mesmo time: a série tem placar de jogos no quadro',
                    'Jogo anulado é jogado de novo; sair entre os jogos dá vitória por W.O. pra quem ficou',
                ],
            },
            {
                title: 'Rota Índigo',
                lines: [
                    'Textos revistos: cartão amarelo explicado em uma regra só, "Fim da linha" e eventos mais curtos',
                    'O mapa usa a tela toda no PC',
                    'Quem está fora aparece com o motivo (lesão, creche ou cansaço) e não entra em quadra',
                    'Hall da Fama separado em Copa Relâmpago e Rota Índigo, com taça índigo própria',
                ],
            },
        ],
    },
    {
        version: '0.9.3.2',
        date: '2026-10-21',
        title: 'Rota Índigo na frente',
        sections: [
            {
                title: 'Tela inicial',
                lines: [
                    'Rota Índigo e Copa Relâmpago lado a lado no PC, com a Rota maior e o selo NOVO',
                    'Duelo e Copa do Dia embaixo, um do lado do outro',
                    'No celular, o botão da Rota ocupa a largura toda',
                ],
            },
        ],
    },
    {
        version: '0.9.3.1',
        date: '2026-10-21',
        title: 'Pokédex com texto e Pokémon com mais caras',
        sections: [
            {
                title: 'Coleção',
                lines: ['A ficha do Pokémon e a carta aberta do Álbum trazem o texto da Pokédex'],
            },
            {
                title: 'Pokémon mais vivos',
                lines: [
                    'O Pokémon grita quando você escolhe no draft, no VERSUS e na carta grande do pacote',
                    'Sala de troféus: à noite ele dorme de verdade; de dia às vezes senta ou come',
                    'Rota Índigo: o time cochila no Descanso, faz cara de dor no carrinho e fica tonto no treino puxado',
                    'Eliminado: o time aparece caído e o capitão com lágrima',
                ],
            },
            {
                title: 'Rota Índigo e Copa Relâmpago',
                lines: [
                    'O mapa mostra o capitão rival em cada casa de partida e o time dele em ícones',
                    'A chave da copa mostra o capitão de cada clube',
                ],
            },
        ],
    },
    {
        version: '0.9.3',
        date: '2026-10-21',
        title: 'Golpes revisados',
        sections: [
            {
                title: 'Cada um com o seu tipo',
                lines: [
                    'Todo Pokémon leva pelo menos 1 golpe de cada tipo dele (quando a Gen 1 deixa)',
                    'Gengar: Confuse Ray ⇒ Sludge (Dream Eater, Hypnosis, Night Shade, Sludge)',
                    'Gastly e Haunter: Hypnosis ⇒ Toxic',
                    'Zubat e Golbat: Supersonic ⇒ Toxic',
                    'Nidoran♂, Nidorino e Nidoking: Focus Energy ⇒ Toxic; Nidoqueen: Counter ⇒ Toxic',
                    'Beedrill: Agility ⇒ Toxic',
                    'Charizard: Fire Blast ⇒ Fly',
                    'Hitmonchan: Agility ⇒ Counter',
                    'Gyarados: Splash ⇒ Hyper Beam',
                ],
            },
            {
                title: 'Sem golpe repetido',
                lines: [
                    'Charmander e Charmeleon: Fire Blast ⇒ Dragon Rage',
                    'Raichu: Thunderbolt ⇒ Agility',
                    'Arcanine: Flamethrower ⇒ Take Down',
                    'Hitmonlee: Jump Kick ⇒ Double Kick',
                    'Staryu: Hydro Pump ⇒ Psychic',
                    'Omanyte: Hydro Pump ⇒ Surf',
                ],
            },
            {
                title: 'Golpes que agora fazem o que prometem',
                lines: [
                    'Harden segura a bola no próximo carrinho (como o Defense Curl)',
                    'Slam alcança mais longe (2,8 m)',
                    'Amnesia sobe passe, chute e leitura',
                    'Tri Attack pode queimar, congelar ou paralisar',
                    'Explosion pega todo mundo a 4 m',
                    'Light Screen e Reflect não dão mais chute escondido',
                    'Fly e Dig com a bola levam ela 2 m (era 4)',
                ],
            },
            {
                title: 'Textos',
                lines: [
                    'Todo golpe explica o que faz em quadra com os números (quanto tempo, quem é imune, quanto acerta, o preço pra quem usa)',
                ],
            },
        ],
    },
    {
        version: '0.9.2.2',
        date: '2026-10-21',
        title: 'A Rota Índigo volta',
        sections: [
            {
                title: 'Rota Índigo',
                lines: [
                    'A Rota está de volta: a 1ª partida quebrava a escalação (consertado) e ela foi jogada inteira antes de voltar',
                    'Continuar num evento "?" volta pro evento (antes caía na escalação e repetia a partida)',
                    'Cartão amarelo e derrota no grupo dizem DERROTA (não Fim da linha); o vermelho só sai na 2ª derrota no mapa',
                    'A copa salva, o campeão (x/8), o gol da copa e o card do título falam da partida da Rota, não das Oitavas',
                    'Nova copa no fim de uma Rota começa outra Rota',
                    'Titular machucado: o aviso aparece do lado do Jogar',
                ],
            },
        ],
    },
    {
        version: '0.9.2.1',
        date: '2026-10-21',
        title: 'Álbum leve e vitrine fácil',
        sections: [
            {
                title: 'Álbum',
                lines: [
                    'O Álbum não trava mais ao abrir e virar a página (só a página à vista é montada e o brilho holo anima só na carta em foco)',
                    'As cartas empilhadas atrás de uma figurinha aparecem só pela borda',
                ],
            },
            {
                title: 'Vitrine',
                lines: [
                    'Vitrine cheia: Pôr na vitrine pede a carta que sai e troca num toque',
                    'Um x no canto tira a carta da vitrine',
                    'Arraste uma carta sobre a outra (ou toque numa e depois na outra) pra mudar a ordem; vale no Perfil, no perfil do amigo e no Duelo',
                    'No PC, a vitrine do cartão do Perfil ficou maior e centralizada',
                ],
            },
        ],
    },
    {
        version: '0.9.2',
        date: '2026-10-21',
        title: 'Casa arrumada',
        sections: [
            {
                title: 'Tela inicial',
                lines: [
                    'Nova copa grande e no topo; Duelo e Copa do Dia lado a lado, do tamanho do conteúdo',
                    'Vem aí: o que está pra chegar numa faixa de cartõezinhos (toque pra ver o que é)',
                    'Perfil, Coleção e Sala de troféus como três portas; o "?" leva pra Ajuda',
                    'O botão de idioma não pula mais de lugar ao trocar',
                    'Quem chega pela 1ª vez já cai no jogo (o passo a passo está na Ajuda)',
                ],
            },
            {
                title: 'Na copa',
                lines: [
                    'A ação principal fica embaixo, na barra do polegar, em todas as telas da copa',
                    'Um botão vermelho por tela; os outros viram contorno',
                    'A chave da copa abre num toque (Ver a chave) na escalação e no resultado',
                    'Dicas só na 1ª copa, perto do que explicam',
                    'Eliminado: Nova copa num toque e quanto faltou',
                ],
            },
            {
                title: 'Mercado',
                lines: [
                    'Com o pacote aberto, o seu time aparece junto pra comparar',
                    'O que não dá pra comprar tem cadeado e mostra quanto falta',
                    'Trocar vitrine virou Novas ofertas (vitrine agora é só a das cartas)',
                    'Textos dos Patrocínios reescritos, mais curtos e com o número do efeito; o preço aparece no contrato',
                ],
            },
            {
                title: 'Partida',
                lines: [
                    'Aba Time no PC: nome e posição inteiros',
                    'Substituir não aparece mais duas vezes no intervalo',
                ],
            },
            {
                title: 'Toque e som',
                lines: [
                    'Cada tipo de botão tem o seu som (avançar, voltar, sair, apagar)',
                    'Abandonar copa, sair do Duelo e apagar dados têm uma saída triste, com animação e som',
                    'Vibração curta no Android (dá pra desligar em Configurações → Mais opções)',
                    'Configurações mais curtas: o resto fica em Mais opções',
                ],
            },
            {
                title: 'Sala de troféus',
                lines: [
                    'O Pokémon que passeia não fica mais esticado nem passa por dentro dos móveis',
                    'O PC aparece inteiro, a TV na frente do móvel e as fotos das cartas sem esticar',
                    'A câmera não fica mais presa aproximada depois de um toque rápido',
                ],
            },
        ],
    },
    {
        version: '0.9.1.1',
        date: '2026-10-21',
        title: 'Cartas de volta',
        sections: [
            {
                title: 'Consertos',
                lines: [
                    'A vitrine mostra a sua melhor carta de verdade daquele Pokémon (antes podia ficar presa na versão padrão, Destaque I ou Ícone sem MVP)',
                    'Mudança só no Álbum agora sobe pra nuvem',
                    'Carta perdida de antes do Álbum (19/10) volta por código: Perfil → Treinador → Resgatar código',
                ],
            },
        ],
    },
    {
        version: '0.9.1',
        date: '2026-10-21',
        title: 'Rota Índigo',
        sections: [
            {
                title: 'Rota Índigo (modo novo)',
                lines: [
                    'A copa longa: um mapa de Kanto de baixo pra cima (Rota 1, Floresta de Viridian, Mt. Moon, Cerulean, Estrada da Vitória, Planalto Índigo), com partidas, Ginásios, Mercado, Baú, Treino e eventos "?"',
                    'Três atos: eliminatórias no mapa, fase de grupos no Planalto (2 primeiros vão pra Final) e a Final contra a Liga Índigo',
                    'Cartão amarelo: a 1ª derrota fora da Final não elimina; a 2ª é vermelho',
                    'Treinadores da Rota com falas no VERSUS e no fim do jogo',
                ],
            },
            {
                title: 'Copa Relâmpago',
                lines: [
                    'A Copa rápida virou Copa Relâmpago, com a chave de 16 clubes na tela: você sobe na chave a cada vitória',
                    'Missões de gols numa copa contam a melhor sequência de 4 jogos (vale igual na Relâmpago e na Rota)',
                ],
            },
            {
                title: 'Partida',
                lines: [
                    'Acréscimos de 1 a 3 minutos por tempo, com a plaquinha no placar',
                    'Pressão final: do minuto 37 em diante, quem está perdendo ganha um empurrão (chute, passe, drible e velocidade) e sobe o time, igual pros dois lados',
                ],
            },
            {
                title: 'Copa do Dia',
                lines: [
                    'Dias seguidos e o próximo marco na tela do dia',
                    'Figurinha do dia: o mesmo Pokémon pra todo mundo, carta Evento no Álbum ao terminar',
                    'Marcos: 7 dias (título Fiel da Copa) e 30 dias (treinadora Garota Dourada)',
                ],
            },
            {
                title: 'Contas',
                lines: ['Nome de treinador e de clube são únicos (quem já tinha fica com o nome)'],
            },
        ],
    },
    {
        version: '0.9.0.5',
        date: '2026-10-21',
        title: 'Tudo na prancheta',
        sections: [
            {
                title: 'Toque direto',
                lines: [
                    'Substituição: toque em quem sai e em quem entra na prancheta e a troca já vale, com as cartas deslizando (sai o painel de lista)',
                    'Recompensa e Mercado: quem recebe o Pokémon ou o item é escolhido tocando na prancheta',
                    'Escalação: Passar pra outro e tocar em quem recebe o item',
                    'Pênaltis: toque em dois cobradores pra trocar a ordem',
                ],
            },
            {
                title: 'Mercado e Perfil',
                lines: [
                    'Pacote aberto pode ser fechado sem pegar nenhuma carta (Não quero nenhuma, seguir)',
                    'A vitrine de cartas aparece no cartão do Perfil',
                ],
            },
        ],
    },
    {
        version: '0.9.0.4',
        date: '2026-10-21',
        title: 'Golpes e Patrocínios explicados',
        sections: [
            {
                title: 'Mais claro',
                lines: [
                    'MT: ao escolher qual golpe esquecer, cada golpe mostra o que faz em quadra',
                    'Carta completa: a nota em campo, com capitão, sinergias e Patrocínios (o número grande é a carta sozinha)',
                    'Toque num Patrocínio das suas vagas pra ver o que ele faz',
                ],
            },
            {
                title: 'Mercado',
                lines: [
                    'No Mercado antes da Final só aparecem Patrocínios de campo (os de ₽ não teriam mais onde valer)',
                ],
            },
        ],
    },
    {
        version: '0.9.0.3',
        date: '2026-10-21',
        title: 'Pacote e Patrocínios',
        sections: [
            {
                title: 'Mercado',
                lines: [
                    'O pacote comprado abre de verdade: rasga e as cartas saem uma a uma, e o desenho do tipo ficou nítido',
                    'Dois Patrocínios pra escolher em cada Mercado',
                    'O preço mostra quanto falta (₽10 · falta ₽1)',
                ],
            },
        ],
    },
    {
        version: '0.9.0.2',
        date: '2026-10-21',
        title: 'Ajustes da semana',
        sections: [
            {
                title: 'Consertos',
                lines: [
                    'Sala de troféus: se o seu avatar é shiny, o Pokémon que passeia na sala também é',
                    'VERSUS: o Começar só aparece depois da apresentação dos times',
                    'A tela não pisca mais ao entrar e sair da partida e da Sala de troféus',
                ],
            },
            {
                title: 'Mercado',
                lines: [
                    'A carta do Patrocínio diz que é Patrocínio, e a prateleira explica as 3 vagas (Pokémon, pacote e item não ocupam vaga)',
                ],
            },
        ],
    },
    {
        version: '0.9.0.1',
        date: '2026-10-21',
        title: 'Mercado organizado',
        sections: [
            {
                title: 'Mercado',
                lines: [
                    'O Mercado ficou em prateleiras: Contratações, Pacote e item, e Patrocínios (com as suas 3 vagas logo embaixo)',
                    'A carta do Patrocínio fica na horizontal, pra não se confundir com as cartas de Pokémon',
                ],
            },
        ],
    },
    {
        version: '0.9.0',
        date: '2026-10-20',
        title: 'Mercado e Patrocínios',
        sections: [
            {
                title: 'Mercado',
                lines: [
                    'Depois da recompensa de cada vitória, a Copa ganha um Mercado: gaste ₽ (Pokédólar) em Pokémon, pacote de tipo, item, MT ou Patrocínio',
                    'Cada vitória rende ₽: 5 da vitória, 1 por gol (até 3) e 2 se não sofrer gol. Guardar rende juros: ₽1 a cada ₽5, até ₽3',
                    'Pacote de tipo: 3 cartas do tipo da semana ou do seu capitão, você fica com 1. Abre como o pacote da recompensa, na cor do tipo',
                    'Trocar a vitrine custa ₽2 e sobe ₽1 a cada troca no mesmo Mercado',
                    'O ₽ só vale dentro da copa e some quando ela acaba. A Copa do Dia continua sem Mercado',
                ],
            },
            {
                title: 'Patrocínios',
                lines: [
                    '12 Patrocínios de Kanto, com até 3 por copa: valem até o fim dela',
                    'Economia: Fã-Clube Pokémon, Cassino de Celadon, S.S. Anne e Loja de Departamentos mexem no ₽ e na vitrine',
                    'Recompensa: Laboratório de Cinnabar (4 opções na recompensa), Creche Pokémon (1ª troca grátis) e Safari Zone (pacote com 4 cartas)',
                    'Campo: Silph Co., Bicicletaria de Cerulean, Academia de Saffron, Torcida de Vermilion e Patrocínio Master dão bônus em quadra, que a carta mostra',
                    'Os seus Patrocínios aparecem nas placas da beira da quadra',
                ],
            },
            {
                title: 'Menus',
                lines: [
                    'A tela inicial separa os dois modos da Copa: a Copa rápida (a de sempre, 4 partidas) e a Copa longa, com mapa, eventos e tesouros (em breve)',
                    'Tudo mora no Perfil: a Sala de troféus e a Coleção abrem logo abaixo do seu cartão',
                ],
            },
        ],
    },
    {
        version: '0.8.9',
        date: '2026-10-20',
        title: 'Sala de troféus e menus novos',
        sections: [
            {
                title: 'Sala de troféus',
                lines: [
                    'Uma sala de verdade, em pixel art, pra tudo que você ganhou: taças da Copa (bronze, prata e ouro pela campanha), a Liga, medalhões da Copa do Dia, cinturões do Duelo, broches das medalhas, o diploma da Platina e o Hall da Fama em polaroids',
                    'De noite (18 h às 6 h) os holofotes acendem nas vitrines, a lareira e a TV piscam; de dia, a sala fica clara',
                    'O seu Pokémon do avatar mora lá: passeia, vai até o que você toca e dorme no tapete de madrugada',
                    'Toque em qualquer coisa: a câmera chega perto e um cartão diz o que é, quantos você tem, como ganhar e o histórico. Ou use os botões embaixo da sala',
                    'Segure na sala pra ver o nome de tudo. Na primeira visita, um tutorial curto mostra cada parte',
                    'A sala sobe de nível com os títulos: quarto em Pallet, sala do clube, sala do estádio',
                ],
            },
            {
                title: 'Menus em três portas',
                lines: [
                    'A tela inicial ficou com os modos de jogo e três portas: Perfil (quem você é), Coleção (o que você coleciona) e Sala de troféus (o que você ganhou)',
                    'Perfil: o topo é o seu cartão público; abas Treinador (com as missões que liberam cada treinador e título), Clube e Amigos',
                    'Coleção: Pokédex, Álbum e Golpedex juntos. Os selos de carreira ficam na ficha de cada Pokémon, com "Destacar"',
                    'Configurações na engrenagem do canto de cima, em toda tela de menu. Notas da versão, Ajuda, Créditos e feedback no rodapé',
                    'O NOVO some sozinho quando a coisa aparece na tela (sem as barras de "Marcar como visto")',
                ],
            },
            {
                title: 'Amigos',
                lines: [
                    'Toque num amigo pra ver o perfil dele: cartão, vitrine, números, últimos títulos e o retrospecto de vocês no Duelo',
                    'Ranking da Copa do Dia com Todos ou só Amigos',
                ],
            },
            {
                title: 'Nada pula',
                lines: [
                    'Toda troca de tela tem transição; as abas deslizam; janelas saem com fade; no draft, a carta contratada voa até a vaga',
                    'Celular em pé: nomes de Pokémon colados na quadra somem com fade em vez de se embolar',
                ],
            },
        ],
    },
    {
        version: '0.8.8.4',
        date: '2026-10-20',
        title: 'Álbum em livro',
        sections: [
            {
                title: 'Álbum de figurinhas',
                lines: [
                    'O álbum virou livro: uma estante com o Álbum da Geração 1 (Kanto). Toque na capa e ele abre',
                    'A folha vira de verdade, pela lombada, arrastando pro lado ou nas setas',
                    'Um espaço por Pokémon, na ordem da Pokédex, com a carta da frente colada. As bolinhas embaixo mostram quais edições você tem (Normal, Shiny, Evento, Ícone, Destaque)',
                    'Tem mais de uma versão? Elas aparecem empilhadas atrás. Toque e todas se espalham na tela, do tamanho de ler',
                    'Escolha qual fica na frente ("Mostrar na frente"). Sem escolher, fica a melhor',
                    'Figurinha nova cai e cola no espaço quando a página dela aparece',
                ],
            },
            {
                title: 'Correções',
                lines: ['"Ver todos na Pokédex" (Números) agora sobe até a Pokédex em vez de abrir no meio da lista'],
            },
        ],
    },
    {
        version: '0.8.8.3',
        date: '2026-10-19',
        title: 'Cartas em camadas e álbum de figurinhas',
        sections: [
            {
                title: 'Cartas em camadas',
                lines: [
                    'O shiny vai por cima de qualquer edição e soma +1: Shiny Ícone, Shiny Evento, Shiny Destaque',
                    'Selo MVP no canto da carta, em bronze, prata e ouro. Ícone e Evento também levam, e cada nível soma +1 em tudo',
                    'Carta Destaque mais bonita a cada nível: filete e brilho no 2, raios e pó dourado no 3',
                    'Evento com o desenho do tipo, na cor dele: chamas no Fogo, ondas na Água, raios no Elétrico e mais 11 tipos',
                    'Passe o mouse ou segure o dedo nos selos, na etiqueta da edição, na Pokédex e nas medalhas pra ver o que cada um quer dizer',
                    'Atributo nenhum passa de 99: o bônus que sobra sobe só os que ainda estão abaixo',
                    'Partida salva no meio de um jogo recomeça do 0 a 0 (o motor mudou)',
                ],
            },
            {
                title: 'Álbum de figurinhas',
                lines: [
                    'Álbum de figurinhas na Pokédex, de papel: a carta de verdade colada em cada espaço, uma de cada edição especial',
                    'Espaço vazio com nome, silhueta e número; tocar abre a ficha. No desktop, duas páginas abertas',
                    'Toque na figurinha pra ver todas as versões que você já teve dela. Qualquer uma vai pra vitrine',
                    'Página Raridades no fim do álbum: Shiny Ícone, Shiny Evento, MVP 3 e Destaque III',
                    'Na Pokédex, cada Pokémon mostra quantas figurinhas tem (3/5); as cartas ficam no álbum',
                    'Vitrine de cartas no seu perfil público: o rival vê no Duelo',
                    'Título das cartas Ícone (Charizard Rebelde e cia.) menor, numa linha só',
                ],
            },
            {
                title: 'Perfil',
                lines: [
                    'Botão do Perfil no canto de cima, com o seu avatar',
                    'Toque no rival no Duelo (sala, VERSUS ou placar) pra ver o perfil dele, com as cartas grandes',
                    'Selo NOVO no que você ganhou e ainda não viu (treinador, título, medalha, avatar, figurinha), pontinho no botão do Perfil e "Marcar como visto"',
                ],
            },
            {
                title: 'Amigos',
                lines: [
                    'Adicionar amigo pelo perfil do rival depois do Duelo, ou pelo código de amigo de 8 letras',
                    'Aba Amigos no Perfil: pedidos pra aceitar, quem está online agora e o botão Desafiar',
                    'Desafiou? O convite chega na hora, por cima de qualquer tela, e vale 15 minutos',
                    'Sem chat e sem busca por nome. Remover e bloquear em um toque (quem foi bloqueado não fica sabendo)',
                ],
            },
            {
                title: 'Correções',
                lines: [
                    'VERSUS: o botão só deixa começar com a quadra carregada (antes levava a uma partida vazia). Se demorar, aparece "Tentar de novo"',
                ],
            },
        ],
    },
    {
        version: '0.8.8.2',
        date: '2026-10-19',
        title: 'Logo novo e faixas da torcida',
        sections: [
            {
                title: 'Logo novo',
                lines: [
                    'Logo novo: a carta holo com a bola (também na aba do navegador, no ícone do celular e na prévia do link)',
                    'Pacote de cartas com o logo novo',
                    'Ícones padronizados: fechar, setas, estrela, sortear e o resto desenhados no mesmo traço em todo o jogo',
                ],
            },
            {
                title: 'Torcida',
                lines: [
                    'Faixas da torcida novas: "Aqui é {clube}", "ABAIXA QUE É HYPER BEAM", "Hoje Magikarp, amanhã Gyarados", "Sua insígnia é minha!" e outras',
                ],
            },
            {
                title: 'Liga',
                lines: ['Liga ranqueada fechada por enquanto: o timer na Home mostra quando ela abre'],
            },
        ],
    },
    {
        version: '0.8.8.1',
        date: '2026-10-19',
        title: 'Melhores momentos, Copa do Dia e medalhas',
        sections: [
            {
                title: 'Copa do Dia',
                lines: [
                    'Copa do Dia: a mesma copa pra todo mundo (mesmo draft, mesmos rivais), uma tentativa por dia e ranking do dia. Sem conta, você joga fora do ranking',
                    'Compartilhe a sua Copa do Dia com os quadradinhos de cada partida e acompanhe os dias jogados na semana',
                    'A Liga ranqueada volta quando tiver mais gente jogando',
                ],
            },
            {
                title: 'Balanceamento: Ala e Pivô',
                lines: [
                    'A nota do Ala agora conta o chute e a do Pivô, a velocidade (o jogo já usava os dois em quadra)',
                    'Nerf e ajuste: Jolteon Ala 92 ⇒ 88, Alakazam Ala 87 ⇒ 83, Electrode Ala 84 ⇒ 80, Gengar Ala 86 ⇒ 83, Pikachu Ala 66 ⇒ 63, Dragonite Pivô 90 ⇒ 89',
                    'Buff: Tauros Pivô 75 ⇒ 77, Scyther Pivô 79 ⇒ 80, Victreebel Pivô 75 ⇒ Ala 76',
                    'Mudam de posição: Kingler, Cloyster, Kabutops e Exeggutor viram Fixo; Rapidash, Dugtrio e Primeape viram Pivô; Mr. Mime vira Goleiro',
                    'Duelo: Eevee evolui pra mesma forma que a carta mostra',
                    'Partida salva no meio de um jogo recomeça do 0 a 0 (o motor mudou)',
                ],
            },
            {
                title: 'Melhores momentos',
                lines: [
                    'Depois da partida, reveja os gols e lances em câmera lenta na própria quadra',
                    'Gol da copa: no fim da copa, o seu gol mais bonito ganha replay e o porquê da escolha',
                    'Exporte um clipe vertical (9:16) do lance pra mandar ou postar no TikTok',
                ],
            },
            {
                title: 'Mais fácil de jogar',
                lines: [
                    'Aba Tática com textos simples e uma régua de ataque e defesa em cada estilo',
                    'A aba Prancheta virou Posições, sem o botão "Mudar prancheta"',
                    'No intervalo, o jogo sugere uma troca pelo fôlego do 2º tempo (a escolha é sua)',
                    'Fim de jogo: vai sozinho pro resultado em 3 s; um toque na quadra segura',
                    'Evolução do rival mais clara: mais longa, com zoom, nome e cor do time e um lembrete no Resultado',
                    'Gritos dos Pokémon: os Modernos viraram o padrão, com o mesmo volume pra todos (os Clássicos 8-bit continuam em Configurações)',
                    'Textos mais simples no jogo todo e boas-vindas em 3 páginas, com dicas na hora certa',
                    'Experimento beira da quadra: o grito "Pra cima!" virou "Ataca!"',
                ],
            },
            {
                title: 'Vestiário e pronto',
                lines: [
                    'Intervalo vira vestiário: várias trocas de uma vez, cada uma com desfazer, e o aviso de quem o rival trocou',
                    'Duelo: o pronto dá pra desfazer na escolha do time, na escalação e no intervalo',
                    'O fôlego do intervalo é o mesmo em todo lugar: o com que cada um começa o 2º tempo',
                ],
            },
            {
                title: 'Tela inicial',
                lines: [
                    'Tela inicial com mais vida: selo AO VIVO na quadra, logo respirando e os blocos entrando em cascata (para com "reduzir movimento")',
                    'Página de erro nova: o Psyduck perdeu a bola pra fora da quadra',
                ],
            },
            {
                title: 'Medalhas e clube',
                lines: [
                    '20 medalhas com degraus (bronze, prata, ouro e platina) em Perfil → Medalhas. Já contam tudo o que você jogou',
                    'Vitrine: escolha até 3 destaques (medalha, coleção completa ou selo); aparecem no seu cartão e no VERSUS do Duelo, e o melhor vira a moldura do avatar',
                    'Escudo montável (formato, símbolo e duas cores) e uniforme com padrão, no placar, no VERSUS e na quadra. Símbolos e padrões novos saem com coleções e medalhas',
                    'Avatares por geração, e o Pokémon que você já jogou shiny vira avatar shiny',
                ],
            },
            {
                title: 'Conquistas',
                lines: [
                    'Tudo que você ganha agora mostra a tarefa cumprida: no aviso, na escolha de treinador e na de título',
                    'Nova Platina da Gen 1: faça 100% de tudo e ganhe o Prof. Carvalho holográfico e o título Diploma de Kanto',
                    'A tarefa dos treinadores aparece inteira no celular',
                ],
            },
            {
                title: 'Treinadores e quadras',
                lines: [
                    'Os líderes de ginásio agora falam antes e depois do jogo, e cada clube joga na quadra do seu ginásio',
                    'Com o experimento beira da quadra ligado, o técnico rival reage do jeito dele: grita, pede tempo, sobe o goleiro, chama o golpe máximo e muda a tática. A narração avisa 10 s antes de valer',
                ],
            },
            {
                title: 'Emotes e conta',
                lines: [
                    "Emotes: o capitão evoluído muda de cara, tocar no emote do rival silencia (com Desfazer), o 'Vamooo!' faz o capitão posar em quadra e o líder da Copa reage aos seus gols",
                    'Quem jogou Duelo sem conta pode ligar o Google e continuar na mesma conta',
                ],
            },
            {
                title: 'Consertos',
                lines: [
                    'Prof. Carvalho agora pede ver os 151 Pokémon na Pokédex (era 100); quem já tinha ganhado continua com ele',
                    'O Prof. Carvalho dourado conta "jogou" igual à Pokédex (quem tinha 151 jogados e via 150/151 agora ganha)',
                    'Pokémon que evolui em quadra conta como "jogou" nas duas formas na Pokédex (a de antes até a evolução, a nova depois)',
                    'A sequência de títulos zera ao começar uma copa nova por cima de outra em andamento',
                    'A sequência de títulos não volta mais ao juntar o save do celular e do PC',
                    'O Ícone que chega como reforço na recompensa também conta nos Ícones escalados',
                    'Duelo (Time pronto): cartas evoluídas levam o bônus de evolução, espécie repetida por evolução é aceita e quem não tem time não trava a sala',
                    'Duelo: a troca feita no fim do intervalo não volta mais no tempo',
                    'Conserto de um erro raro da quadra quando a animação de um Pokémon ainda não tinha carregado',
                    "O Duelo agora conta na Pokédex: quem joga pelo seu time vira 'jogou'",
                    'Copas guardadas dão o "jogou" da forma de antes de quem evoluiu em quadra',
                    'Pokémon shiny aparecem shiny nas estatísticas: destaques, tabela, prêmios e final',
                    'Duelo (Time pronto): capitão no banco é aceito, e o aviso de time inválido sai no idioma do jogo',
                    'Evolução em quadra conta as duas formas mesmo quando uma ficou só segundos (evoluir logo no começo ou no último minuto)',
                    'Barra de evolução cheia da partida anterior: o Pokémon entra com a forma de antes e evolui depois de fazer algo (antes a quadra já abria com ele evoluído)',
                    'Contadores iguais em todo lugar: Pokédex, Golpedex, missões, medalhas, platina e Perfil contam do mesmo jeito (o Transformar do Ditto agora vale nas missões de golpes)',
                    'Títulos e copas perfeitas do Hall da Fama aparecem no Perfil e na tela inicial depois de juntar o save de dois aparelhos',
                    'Avatar shiny: toque no Pokémon com o brilho no canto e escolha a versão normal ou a shiny',
                    'Avatares centralizados e o shiny não passa mais da borda',
                ],
            },
        ],
    },
    {
        version: '0.8.8',
        date: '2026-10-19',
        title: 'Ícone MVP e conquistas retroativas',
        sections: [
            {
                title: 'Consertos',
                lines: [
                    'Carta Ícone agora pode ser o craque da partida: continua Ícone (com o fundo de galáxia), ganha o selo "MVP", "MVP 2" e "MVP 3" e +1 em todos os atributos por selo (até +5). Antes o prêmio pulava pro próximo jogador',
                    'Quem foi campeão com Mew e Mewtwo, com os 3 pássaros lendários ou com um Rattata antes dessas missões existirem agora ganha a conquista ao abrir o jogo (sai do Hall da Fama)',
                ],
            },
        ],
    },
    {
        version: '0.8.7',
        date: '2026-10-19',
        title: 'Emotes, selos e faixa da torcida',
        sections: [
            {
                title: 'Duelo',
                lines: [
                    'Emotes novos: o seu capitão aparece grandão com cara de alegria, choro ou bronca, e grita junto. 8 emotes, com "Nãão!" e "Grrr!" novos',
                    'Partida curta na criação da sala: a mesma partida, tocada em dobro',
                    'A sala gasta bem menos internet (manda só o que mudou)',
                    'Quem está com o jogo desatualizado recebe o aviso pra atualizar a página em vez de entrar numa partida que não fecha',
                ],
            },
            {
                title: 'Coleção e clube',
                lines: [
                    'Selos de carreira na Pokédex: Folha (10 partidas), Holo (25 gols), Prisma (5 títulos) e Ouro escuro (Prisma + Kanto completo). Já contam tudo o que você jogou',
                    'Faixa da torcida: escolha a frase do seu clube em Perfil → Meu clube; ela aparece na beira da quadra, na cor do clube',
                ],
            },
            {
                title: 'Copa',
                lines: [
                    'Monta pra mim: no draft, um toque completa o time com a melhor carta pra cada vaga (você ainda troca na escalação)',
                ],
            },
            {
                title: 'Experimento: beira da quadra',
                lines: [
                    'Ligue em Configurações → Experimentos (vale na Copa e, pelo dono da sala, no Duelo)',
                    'Gritos do técnico (3 por jogo): Pra cima!, Fecha a casinha!, Calma! e Abafa!',
                    'Pedido de tempo (1 por tempo): +5% de fôlego pro seu time e +3% pro rival, e uma pausa pra trocar e mexer na prancheta',
                    'Goleiro-linha, golpe máximo do capitão (a barra enche mais rápido quando você está perdendo) e a ordem dos pênaltis',
                ],
            },
        ],
    },
    {
        version: '0.8.6',
        date: '2026-10-18',
        title: 'Lendas douradas e prancheta ao vivo',
        sections: [
            {
                title: 'Missões lendárias',
                lines: [
                    '6 treinadores dourados por feitos absurdos: Ash (copa perfeita, sem sofrer gol), Lance (campeão com os 3 pássaros na final), Joey (campeão com um Rattata), Red (5 copas seguidas), Blue (virar a final depois de perder por 3) e Prof. Carvalho (jogar com os 151)',
                    '9 títulos lendários brilhando, como Senhor dos Céus, Original e Clone, Artilheiro Lendário (12 gols de um Pokémon numa copa) e Zé Ninguém (campeão com 5 titulares bronze)',
                    'Treinador dourado brilha e ganha moldura de ouro no perfil, VERSUS, duelo, Hall da Fama e card do título',
                    'A missão do Ash ficou possível: ser campeão sofrendo até 5 gols na copa (título Muralha). A copa perfeita, sem sofrer gol, agora dá o Ash dourado',
                ],
            },
            {
                title: 'Coleção',
                lines: [
                    'Álbum de figurinhas na Pokédex: Normal, Shiny, Evento, Ícone e Destaque de cada espécie (622 no total), colando quando a carta joga',
                    'Fita de campeão na Pokédex com quantas vezes cada espécie foi campeã com você',
                    '9 coleções temáticas com título próprio: Iniciais, Pássaros, Fósseis, Eeveelutions, Lendários, Hitmons, Nidos e os times do Brock e da Misty',
                    'Grito de gol: o capitão grita junto com a torcida no seu gol (dá pra desligar em Configurações)',
                ],
            },
            {
                title: 'Prancheta no meio da partida',
                lines: [
                    'Mude a formação e troque Pokémon de vaga durante o jogo, na Copa e no Duelo',
                    'A mudança entra na próxima bola parada, como a substituição; sem limite',
                    'Qualquer um pode ir pro gol (fora de posição perde nota)',
                ],
            },
            {
                title: 'Partida com cara de transmissão',
                lines: [
                    'Placar de TV com a cor dos times, barra de pressão a cada 2 minutos e a narração numa faixa em cima da quadra',
                    'Painel do técnico em abas (Tática, Prancheta, Time, Lances) e, no celular, velocidade e Pular numa barra fixa embaixo',
                    'Tática e escanteio sem limite de mudanças',
                    'Substituir já mostra o banco: dá pra começar por quem entra ou por quem sai',
                ],
            },
            {
                title: 'Evolução',
                lines: [
                    'Carta que evolui ganha +2 em todos os atributos por evolução: Charmander que vira Charizard fica 89, o Charizard pronto é 85',
                    'Evolução do rival com animação e faixa próprias (RIVAL EVOLUIU!), diferente da sua',
                    'No Duelo os dois lados evoluem com a mesma barra (antes quem entrava pelo link evoluía mais fácil)',
                ],
            },
            {
                title: 'Duelo',
                lines: [
                    'Revanche de um toque: os dois aceitam e já vão pro draft, sem voltar pra sala',
                    'Placar geral contra o mesmo amigo no resultado',
                    'Quem recarrega a página volta pro minuto certo, e a tela avisa quando está esperando o rival',
                    'Rival que sai na tela de resultado aparece como saiu (a revanche não fica esperando pra sempre)',
                    'Clubes com o mesmo nome aparecem com o nome do treinador',
                    'Mais proteção contra placar e time trocados por quem mexe no navegador',
                    'Ícone próprio pro grito do capitão e textos mais claros',
                ],
            },
            {
                title: 'Partida',
                lines: [
                    'Defesa do goleiro: a bola defendida não passa mais por trás dele, e a espalmada pra escanteio sai pelo lado da mão',
                    'Recompensa: item novo pra quem já segura um pergunta pra quem vai o antigo (antes ele sumia)',
                    'Título do treinador em selo no VERSUS, no saguão e no placar do duelo',
                    'O relógio mostra Intervalo no intervalo',
                    'Quem joga pela primeira vez começa em 1x; a velocidade que você escolher fica salva',
                    'Partida que estava no meio na hora da atualização recomeça do 0 a 0 (a copa e o time ficam)',
                ],
            },
            {
                title: 'Mais leve e mais claro',
                lines: [
                    'O jogo abre bem mais rápido no celular: o primeiro acesso caiu de 2,5 MB pra 0,4 MB',
                    'Média do time no VERSUS igual à da escalação (pela nota de cada um na vaga)',
                    'Item e MT da recompensa com botão Escolher, como o Pokémon',
                    'Ajuda sem cortar no celular, aviso de desbloqueio sem cobrir o topo e botões maiores pra tocar',
                    'Treinadores lendários bloqueados com brilho dourado, pra dar vontade de caçar',
                ],
            },
        ],
    },
    {
        version: '0.8.5',
        date: '2026-10-18',
        title: 'Escanteio e duelo ao vivo',
        sections: [
            {
                title: 'Duelo ao vivo (BETA)',
                lines: [
                    'Desafie um amigo por link: os dois veem a mesma partida ao mesmo tempo',
                    'Não precisa de conta: quem recebe o link digita o nome e toca em Jogar agora (com Google, o histórico fica guardado na nuvem)',
                    '3 modos: Disputa (draft alternado, 4 cartas por vaga, uma pra cada e 2 queimam), Cada um com seus pacotes (pacotes próprios, escolhas escondidas) e Time pronto (o time da copa ou um campeão do Hall, com limite de cartas especiais escolhido por quem cria a sala)',
                    'Convite com Compartilhar, WhatsApp, QR code e código da sala',
                    'O mesmo caminho da copa: escalação, VERSUS com os dois treinadores, partida e resultado',
                    'Velocidade da sala: um pede, o outro aceita ou recusa',
                    'Trocas e tática que o rival vê na hora, emotes e revanche',
                    'Escalações e escolhas lacradas: ninguém vê a jogada do outro antes da hora',
                ],
            },
            {
                title: 'Escanteio',
                lines: [
                    'Nasce da espalmada pra fora e do desvio no bloqueio: 3 a 4 por jogo',
                    'Disputa no alto pela força, pelo tamanho e pelo posicionamento, com faixa ESCANTEIO e NO ALTO!',
                    'Instrução do técnico (Na área, Curta, Variar), trocável como a tática, e o cobrador na escalação',
                    'Golpe na bola parada (gasta PP) e gol olímpico raro, só com golpe de vento',
                    'Selo Jogo aéreo no painel do Pokémon',
                ],
            },
            {
                title: 'Partida',
                lines: [
                    'Prancheta do time ao vivo: formação com nota, fôlego e banco; toque num jogador pra substituir',
                    'No desktop a prancheta fica ao lado da quadra e a tabela do time começa recolhida',
                    'Golpe no chute aparece mais (de quase nunca pra ~1,5 por jogo)',
                    'A mesma partida em todo navegador (contas próprias no motor)',
                    'Partida que estava no meio na hora da atualização recomeça do 0 a 0 (a copa e o time ficam)',
                ],
            },
        ],
    },
    {
        version: '0.8.4',
        date: '2026-10-17',
        title: 'Balanceamento geral e o seu treinador',
        sections: [
            {
                title: 'Seu treinador',
                lines: [
                    '38 treinadores de Kanto (Red, Leaf, líderes de ginásio, Elite 4, Prof. Carvalho, Equipe Rocket...) destravados por 42 missões',
                    'Títulos embaixo do nome, também ganhos nas missões',
                    'O treinador aparece no Perfil, no VERSUS, no Hall da Fama e no card de compartilhar',
                    'Bloqueado mostra a silhueta, o nome e como conseguir',
                ],
            },
            {
                title: 'Regras do jogo',
                lines: [
                    'O Fixo vira a cobertura: fica entre o atacante e o gol, e quem posiciona bem corta e bloqueia mais. A nota do Fixo agora pesa em campo',
                    'Táticas reequilibradas: as 4 vencem entre 49% e 52%; a ofensiva volta a ter mais gols e a defensiva menos',
                    '3-1 e ferrolho marcam mais à frente; a 1-1-2 recua um pouco',
                    'Copa com clímax: rival estreante nas oitavas, rival com itens mais cedo (1 nas quartas, 3 na final) e a Liga Índigo como chefe final',
                ],
            },
            {
                title: 'Draft e evolução',
                lines: [
                    'Toda rodada do draft tem pelo menos uma prata na vaga',
                    'Toda rodada tem uma opção que vira ouro naquela vaga ao evoluir',
                    'A carta mostra a nota depois de evoluir, com seta verde (sobe) ou vermelha (cai)',
                    'Evoluir ficou um pouco mais fácil (barra 15 ⇒ 14)',
                    'A evolução herda a vaga: quem evolui jogando de Ala continua podendo jogar de Ala',
                    'Barra de evolução com nome na carta completa; na escalação ficou roxa, com setinha',
                ],
            },
            {
                title: 'Golpes, habilidades e itens',
                lines: [
                    'Goleiro usa golpe: defende com o golpe de ataque e usa golpes de suporte. Body Slam, Submission, Petal Dance, Horn Drill e Soft-Boiled finalmente saem',
                    'Dream Eater: com a bola é chute; sem a bola suga o fôlego do rival mais perto (o dobro se ele estiver dormindo)',
                    'Soft-Boiled alcança 5 ⇒ 8 m; Bone Club desarma de longe',
                    'Habilidades mais fortes (+5% ⇒ +8%), e Cursed Body, Flash Fire, Drought, Sand Veil, Arena Trap, Sand Force, Soundproof, Aftermath, Dry Skin e Lightning Rod ganharam efeito. O nome sobe na quadra quando ela segura um status',
                    "Quick Claw 10% ⇒ 15%, Scope Lens 15% ⇒ 20%, King's Rock 25% ⇒ 30%",
                ],
            },
            {
                title: 'Pokémon: buff',
                lines: [
                    'Mr. Mime: joga no gol (75) e Ala 78 ⇒ 80',
                    'Mew: joga em todas as posições (Goleiro 79, Fixo 84, Pivô 81)',
                    'Onix: Fixo 63 ⇒ 70 · Hitmonlee: Pivô 70 ⇒ 75 · Beedrill: vira Pivô 65 (era Ala 63)',
                    'Rhydon ganha Fixo (74) e Pivô (72), Golem ganha Pivô (75), Poliwrath ganha Ala (70); Venonat, Metapod e Kakuna ganham Ala',
                    'Chansey 73 ⇒ 76, Sandslash 73 ⇒ 75, Wigglytuff 66 ⇒ 71, Vaporeon 76 ⇒ 79, Seaking 70 ⇒ 72, Gyarados 81 ⇒ 83, Lapras 81 ⇒ 83, Exeggutor 80 ⇒ 82, Electrode 83 ⇒ 84',
                    'Mesma nota, rendem mais em campo: Pinsir e Flareon (velocidade), Electrode, Jynx e Pikachu (chute)',
                ],
            },
            {
                title: 'Pokémon: nerf e ajuste',
                lines: [
                    'Tauros: Pivô 76 ⇒ 75, Fixo 76 ⇒ 73 · Aerodactyl: Pivô 77 ⇒ 76 · Snorlax: Goleiro 93 ⇒ 91 (ganha força)',
                    'Rapidash vira Ala 83 (era Pivô 81) · Nidorina vira Fixo 58 · Nidorino vira Pivô 58',
                    'Serpentes (Ekans, Dratini, Dragonair) medem o porte pelo peso, não pelo comprimento',
                ],
            },
            {
                title: 'Visual e corrigido',
                lines: [
                    'Pacote do tamanho da carta: no draft ficou maior e dá pra ver abrir',
                    'Item e MT da recompensa no formato da carta',
                    'Substituição no intervalo entra no vestiário (não mais na 1ª bola parada do 2º tempo)',
                    'Draft no celular deitado: faixa numa linha só e cartas alinhadas',
                    'Partida que estava no meio na hora da atualização recomeça do 0 a 0 (a copa e o time ficam)',
                ],
            },
        ],
    },
    {
        version: '0.8.3',
        date: '2026-10-16',
        title: 'Partida com peso, pacote de cartas e torcida',
        sections: [
            {
                title: 'Partida',
                lines: [
                    'Torcida de verdade: murmúrio que cresce quando a bola chega perto do gol, grito no gol, "uuuh" na trave e na defesa e palmas no fim; o apito é de juiz de verdade',
                    'Bola e Pokémon com peso: movimento suave, estalo e poeira no chute, quique, e a condução refeita (quanto melhor o drible, mais colada no pé)',
                    'Gol, trave e defesa ficam em câmera lenta igual, até no 8x: não dá mais pra adivinhar o gol',
                    'Rastro na bola com a cor e o efeito do tipo do golpe, e uma explosão do tipo quando o golpe vira gol',
                    'Dá pra ler o lance: "DESARME!", "CORTOU!", defesa agarrada ou espalmada e aviso de tiro de meta',
                    'Goleiro segura a bola nas mãos, e a bola não aparece mais atrás dele numa defesa',
                    'Marcação mais esperta: o defensor chega rápido, freia perto e acompanha de lado',
                    'Intervalo de verdade: a partida para com placar, fôlego e uma dica; tática e substituição a um toque',
                    'Substituição mostra a posição, a nota na vaga e o fôlego de cada um',
                    'Lances: só os lances importantes em velocidade normal, o resto passa voando',
                    'Shiny aparece shiny em campo (149 dos 151)',
                    'Placar pula na cor do time no gol, faixa de fim de jogo e pênalti decisivo com peso',
                ],
            },
            {
                title: 'Cartas e evolução',
                lines: [
                    'Pacote de cartas com o logo: na recompensa e no draft as cartas saem uma a uma com o tom subindo; ouro e Shiny seguram mais, edição especial tem entrada própria',
                    'O pacote dá pista do que tem dentro: borda dourada pra carta ouro, brilho holográfico pra edição especial',
                    'Barra de evolução não zera mais entre partidas: evolui quem joga bem a copa toda',
                    'A carta mostra a nota na posição em que o Pokémon joga',
                    'Números contam subindo no draft e no resultado',
                ],
            },
            {
                title: 'Visual',
                lines: [
                    'VERSUS novo, estilo jogo de luta, com o VS no meio da tela',
                    'Setinha em cima do seu time maior, com tamanho a escolher em Configurações',
                    'Nomes na quadra não se embolam mais',
                    'Janelas, telas e botões com transições e resposta ao toque',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Evolução do rival não é mais comemorada como se fosse sua',
                    'Média do time no draft conta a nota na vaga',
                    'Carta Destaque só vem com vitória',
                    'Rival sem itens que não existem na Gen 1',
                    'Telas que ganhavam rolagem pro lado no celular',
                ],
            },
            {
                title: 'Ajustes (17/10)',
                lines: [
                    'Torcida do seu lado: grito no seu gol, vaia no gol do rival e "uuuh" quando você quase marca, com sons variados; volume próprio em Configurações',
                    'Nova opção: velocidade nas chances de gol (1x, 2x, 4x ou não muda)',
                    'Sinergia de tipo continua subindo: 4 do mesmo tipo dão +8% e 5 dão +10%',
                    'Sinergias especiais completas brilham juntas na formação: os 3 Pássaros Lendários dão +10%, os 3 iniciais +8%, Mew + Mewtwo +8% (tipo + história somam até +15%)',
                    'Destaque com nível: o craque que já é Destaque sobe de nível com nota 8+ (até +4); senão o prêmio vai pro próximo craque',
                    'A nota numa posição secundária não passa mais da posição principal',
                    'Marcador não gasta mais golpe dando bote de longe',
                    'Som das cartas saindo do pacote corrigido',
                ],
            },
        ],
    },
    {
        version: '0.8.2',
        date: '2026-10-16',
        title: 'Hall da Fama e o título do jeito que merece',
        sections: [
            {
                title: 'Tela de campeão',
                lines: [
                    'Hall da Fama: no título, o elenco desfila um por um com o grito, como no Red/Blue, e a copa fica guardada para sempre na aba Hall da Fama do Perfil',
                    'Prêmios da copa: Bola de Ouro, Chuteira de Ouro, Luva de Ouro, Garçom, Muralha, Pulmão e Mestre dos Golpes',
                    'Seleção da copa na quadra, na formação que você usou',
                    'Recordes do título: o número do título e da copa perfeita, a melhor nota de cada Pokémon, o primeiro título de cada espécie e quanto tempo levou',
                    'Gols da campanha minuto a minuto, mapa de onde saíram os gols, golpes mais usados, a final lado a lado e a nota de cada Pokémon jogo a jogo',
                    'Compartilhar agora leva uma imagem do título pronta para os Stories, e dá para baixar em 9:16 ou 1:1',
                ],
            },
            {
                title: 'Celular deitado',
                lines: [
                    'Nova copa, draft, partida, pênaltis, substituição, Movedex e campeão cabem na tela',
                    'A partida abre com o placar e a quadra inteiros (antes abria rolada lá embaixo)',
                    'Botões pequenos ficaram maiores para o dedo',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Mimic como na Gen 1: o golpe copiado fica no lugar dele até o fim da partida',
                    'Movedex não passa mais da largura da tela no celular',
                ],
            },
        ],
    },
    {
        version: '0.8.1',
        date: '2026-10-15',
        title: 'Ajustes do lançamento',
        sections: [
            {
                title: 'Corrigido',
                lines: ['As marcas de tipo no fundo das cartas voltaram a aparecer (a imagem não carregava no site)'],
            },
        ],
    },
    {
        version: '0.8.0',
        date: '2026-10-15',
        title: 'Perfil, Pokédex e golpes novos',
        sections: [
            {
                title: 'Golpes novos',
                lines: [
                    'Os golpes agora fazem o que faziam nos jogos: Earthquake e Surf pegam todo mundo em volta (até companheiro), Slash e Karate Chop dão crítico, Solar Beam e Sky Attack carregam, Fly e Dig somem do mapa, Swift nunca erra, Night Shade e Dragon Rage dão dano fixo, Toxic piora com o tempo, Double Team cria clones e muito mais',
                    'MT do ginásio: depois de vencer, uma recompensa pode ser a MT do líder (Brock dá Bide, Misty dá Bubble Beam...) ou um golpe raro; você escolhe quem aprende e o que esquece, e a assinatura fica protegida',
                    'O golpe ensinado continua depois da evolução, e os rivais também entram com a MT do líder deles',
                    'Golpedex com os 164 golpes do jogo',
                ],
            },
            {
                title: 'English',
                lines: [
                    'O jogo inteiro em inglês, com os nomes oficiais dos jogos: troque em PT | EN na tela inicial ou em Configurações',
                ],
            },
            {
                title: 'Adicionado',
                lines: [
                    'Perfil: seu nome de treinador, avatar (um Pokémon que já jogou no seu time ou a foto do Google), nome fixo do clube, sigla de 3 letras e cor do clube',
                    'Cor do clube no placar, no VERSUS, no resultado e nos gráficos; se o rival tiver uma cor parecida, ele entra com o uniforme reserva',
                    'Pokédex dos 151: visto (apareceu no draft, nas recompensas ou no time rival) e jogou (entrou em quadra pelo seu time), com a carreira de cada espécie: partidas, gols, assistências, títulos e a melhor carta',
                    'Números da carreira: vitórias, gols, artilheiros e os mais escalados',
                    'Golpedex: os golpes se revelam quando alguém usa em campo numa partida sua; dá para ver por golpe ou por Pokémon, com a animação de cada um',
                    'Como jogar: passo a passo na primeira visita (e no botão de interrogação da tela inicial), seção Ajuda com todas as mecânicas e dicas curtas no draft, na escalação e nas recompensas',
                    'Botão Dar feedback na tela inicial e no fim da copa',
                ],
            },
            {
                title: 'Configurações',
                lines: [
                    'Volume separado para gritos e efeitos',
                    'Velocidade inicial da partida e nomes na quadra (todos, só do seu time ou nenhum)',
                    'Reduzir movimento: menos tremida, flash e zoom',
                    'Confirmação antes de sair de uma partida em andamento',
                    'Baixar e restaurar backup do save, e apagar os dados do aparelho',
                    'Estatísticas anônimas (sem conta e sem cookie), com opção de desligar',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Entrar na conta depois de jogar como visitante não perde mais os recordes da nuvem',
                    'Descrição da tática Equilibrado: ela dá +3% de passe e posicionamento',
                ],
            },
        ],
    },
    {
        version: '0.7.3',
        date: '2026-10-14',
        title: 'Beta aberta',
        sections: [
            {
                title: 'Lançamento',
                lines: [
                    'O Soccermon agora é beta aberta: o jogo está completo e segue recebendo ajustes',
                    'Código aberto no GitHub (link no rodapé): dá para ler o código, relatar bugs e sugerir ideias',
                ],
            },
            {
                title: 'Adicionado',
                lines: [
                    'Painel do time na partida: fôlego, status, gols, assistências e nota parcial de cada um, mais o banco (do seu time e do rival); tocar num jogador abre o painel dele',
                    'Escalação com o visual das cartas: bronze, prata, ouro, lendário e edições especiais',
                    'Tela inicial com cenas novas na quadra: tabelinha, gol e embaixadinhas, com Pokémon sorteados',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Ditto no painel da partida mostra a forma que copiou (espécie, nível, golpes e habilidade), não mais o Ditto original',
                    'Tela de resultado: os Pokémon do time não saem mais cortados nas bordas no celular',
                    'Se uma tela der erro, aparece um aviso com saída em vez da página em branco (a copa continua salva)',
                    'Bola da tela inicial redesenhada: agora é uma bola de futsal de verdade',
                ],
            },
            {
                title: 'Celular',
                lines: ['Ícone próprio ao adicionar o jogo à tela inicial', 'Novidades com as versões separadas'],
            },
        ],
    },
    {
        version: '0.7.2',
        date: '2026-10-14',
        title: 'Trocas que contam e privacidade',
        sections: [
            {
                title: 'Alterado',
                lines: [
                    'Quem entra na troca passa a contar para sinergia de tipo, duplas de história e capitão',
                    'Quem sai leva o bônus junto; capitão substituído leva a aura',
                    'Evoluir muda o tipo na conta das sinergias do time',
                ],
            },
            {
                title: 'Adicionado',
                lines: [
                    'Apagar minha conta, em Configurações: remove login, perfil e save da nuvem',
                    'Página de privacidade e termos',
                ],
            },
        ],
    },
    {
        version: '0.7.1',
        date: '2026-10-14',
        title: 'Revisão completa',
        sections: [
            {
                title: 'Corrigido',
                lines: [
                    'Save na nuvem: abrir o jogo em outro aparelho não apaga mais a copa salva',
                    'Outra conta Google no mesmo aparelho não herda a copa nem os recordes',
                    'Evoluir no meio da partida não cura status nem devolve golpes já usados',
                    'Saves antigos não fazem mais substituição automática no seu time',
                    'Voltar no meio da disputa de pênaltis não passa todas as cobranças de uma vez',
                    'Tocar na carta dentro da carta completa sumia com os botões Escolher e Contratar',
                    'Textos: "Eliminado na semifinal", "1 gol", "1 copa", vice-campeão ao perder a final',
                    'Nidoran♀ e Nidoran♂ com o nome certo',
                ],
            },
            {
                title: 'Celular',
                lines: [
                    'Estatísticas da copa e topo do resultado cabem em telas de 320px',
                    'Quadra cabe na tela com o celular deitado',
                    'Selo de capitão não cobre mais o "Goleiro" na escalação',
                    'Gráficos sem emoji: bolinhas desenhadas marcam os gols',
                    'Esc e teclado funcionam na evolução e nas Novidades',
                ],
            },
        ],
    },
    {
        version: '0.7',
        date: '2026-10-14',
        title: 'Contas, evolução e golpes de verdade',
        sections: [
            {
                title: 'Adicionado',
                lines: [
                    'Entrar com Google: copa e recordes salvos na nuvem',
                    'Tela de campeão: a taça, o caminho do título e o elenco inteiro com as estatísticas de cada um',
                    'Três formações novas: Rodízio (4-0), Dois pivôs (1-1-2) e Ferrolho (3 fixos)',
                    'Evolução no meio da partida, em tela cheia',
                    'Substituição ao vivo: a troca entra na próxima saída de bola',
                    'Toque num Pokémon em campo para ver fôlego, status, golpes e barra de evolução',
                    'Estatísticas completas da partida e da copa: notas, gráficos e mapa de chutes',
                    'Faixa com o rosto do Pokémon em gols, defesas, substituições e evoluções',
                    'Animação própria para cada um dos 164 golpes',
                    'Golpe-assinatura para os 151 Pokémon',
                    'Setinhas de bônus e penalidade nas cartas',
                    'Bola cruzada nos passes longos e rastro na bola',
                    'Velocidade 8x',
                    'Tela de vitória e VERSUS novos',
                    'Página de golpes (botão Golpes)',
                    'No draft, quem joga fora de origem mostra a posição principal e se também joga na vaga',
                ],
            },
            {
                title: 'Alterado',
                lines: [
                    'Todo golpe agora faz algo em campo: Counter, Haze, Teleport, Leech Seed, Metronome, Transform e mais',
                    'Golpes de vários acertos mais fortes; golpes muito fortes agora têm preço (recuo, recarga, explosão)',
                    'Zebras mais frequentes e Garra para quem perde por 3 ou mais',
                    'Fixo sobe para o ataque e arrisca chutes de longe',
                    'Goleiro mergulha na bola e só defende chute que ia no gol',
                    'Cartas Ícone mais raras',
                    'Sair e voltar retoma a partida do mesmo ponto',
                    'Menu principal, Configurações e Créditos com visual novo',
                    'Com mais de um fixo, só um sobe para o ataque; o outro faz a cobertura',
                ],
            },
            {
                title: 'Corrigido',
                lines: [
                    'Defesa contada com a bola já dentro do gol',
                    'Cobrança de pênalti a mais depois da disputa decidida',
                    'Bola atrás da linha no tiro de meta',
                    'Pokémon voadores flutuando acima da bola',
                ],
            },
        ],
    },
];

/** Notes in English (same versions; a version missing here falls back to Portuguese). */
export const PATCH_NOTES_EN: PatchNotes[] = [
    {
        version: '0.9.29',
        date: '2026-10-31',
        title: 'New Route',
        sections: [
            {
                title: 'Indigo Route',
                lines: [
                    'Each branch of the map has its own types, and every Match shows its prize before you go',
                    "Every Match win signs 1 of 3 from the rival team, then comes the space's prize",
                    "Tougher Gym (rival +2), with the leader's card guaranteed, their TM and an item",
                    'Up to 2 Markets per path, and the Chest row can be a Pokémon Center that clears the yellow card or brings back who was out',
                    "New events: Mt. Moon Fossils, Legendary bird, Team Rocket ambush, Blue's bet, League referee and Day Care Egg",
                    'In events and Training, a tap selects and a button confirms',
                ],
            },
            {
                title: 'Mode menu',
                lines: [
                    'The three modes as slices, fighting-game select style, with your captain popping out',
                    'Trainer Mode is now Team Ultimate, and the modes that are not out yet show their date',
                ],
            },
            {
                title: 'Penalties',
                lines: [
                    "The taker order shows each one's shooting",
                    'On phones, the shootout camera no longer cuts off the goal',
                ],
            },
        ],
    },
    {
        version: '0.9.28',
        date: '2026-10-30',
        title: 'Polished max move',
        sections: [
            {
                title: 'Max move',
                lines: [
                    'The ring now closes onto a fixed target ring that lights up at the perfect moment',
                    'Your tap answers right away: on a perfect, a flash, stars, coins and the court shakes',
                    'New sounds for the tap and for each level',
                    'L3 comes sooner: each level of the bar takes 10 points instead of 12',
                ],
            },
            {
                title: 'Menus',
                lines: [
                    'New menu music, calmer, with a light SOC-CER-MON',
                    'The logo flashes SOC-CER-MON to the beat on every screen',
                    'Every menu screen has the same top bar, with back always in the same spot, and the trainer badge is bigger',
                    'News lives in the top corner, with a dot when a new version is out',
                    'In the Stadium, each mode has its own tile above PLAY',
                    'From the Club, a door opens to the Trophy room, and back returns to the Club',
                    'Duel now looks like the other menu screens',
                    'The Soccermon symbol replaces the Poké Ball on trophies and crests',
                ],
            },
            {
                title: 'Lighter',
                lines: [
                    'Matches and the Indigo Road use much less CPU on phones, and the menus use half the memory',
                    'The game opens faster',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'The Indigo Road map counted the match in two different ways',
                    'The cup bar no longer scrolls away on the map',
                    'Help and Credits go back to the screen you opened them from',
                    'Selling a captain who was on the bench left a ghost in the team',
                    'With the phone sideways, the button to enter an Indigo Road map node was off screen',
                    'The Final showed the Indigo Plateau name in Portuguese',
                ],
            },
        ],
    },
    {
        version: '0.9.27',
        date: '2026-10-30',
        title: 'Game modes',
        sections: [
            {
                title: 'Game modes',
                lines: [
                    'If you have played before, you start at a mode menu: Cup Mode (everything that exists today), Trainer Mode (coming late November) and Story Mode (2027)',
                ],
            },
            {
                title: 'Max move',
                lines: [
                    'A ring closes once to the beat of the music: tap when it lands. Each level has its own look and sound, and a perfect sounds like one',
                    'When the max move comes, the music dips and the court slows down',
                    'Call your captain: the button lights up on every attack and the ball looks for them. A called fixo carries the ball to their zone and shoots from there',
                    'The pivô unleashes it from farther out, like the ala',
                    'The max save only spends the bar when it saves: with no shot, the bar comes back full. A keeper captain uses it at L3',
                ],
            },
            {
                title: 'Club and Lab',
                lines: [
                    'Pokémon walk around the furniture and stop now and then',
                    'Tap a Pokémon many times in a row and it falls on its back',
                ],
            },
            {
                title: 'Fixed',
                lines: ["Your trainer's shiny Mew shows up shiny on the Road map"],
            },
        ],
    },
    {
        version: '0.9.26',
        date: '2026-10-29',
        title: 'Crests',
        sections: [
            {
                title: 'Friends',
                lines: ["Each friend shows their club's real crest: shape, symbol and colors"],
            },
            {
                title: 'Fixed',
                lines: [
                    'Accents on capital letters are no longer cut off on signs and names',
                    'On desktop, the Club and the Lab fill the screen',
                    'After an update, a game left open for a long time reloads by itself instead of showing an error',
                ],
            },
        ],
    },
    {
        version: '0.9.25',
        date: '2026-10-29',
        title: 'Friends',
        sections: [
            {
                title: 'Friends',
                lines: [
                    "Tap any trainer's name (rankings, League, Duel, friends list) to see their profile, add them or challenge them",
                    "Your friends' club crest shows next to their name",
                ],
            },
            {
                title: 'Duel',
                lines: ['Challenge from the friends list sends the invite again. The room shows whether it arrived'],
            },
            {
                title: 'Fixed',
                lines: ['Sheets slide up more smoothly on phones'],
            },
        ],
    },
    {
        version: '0.9.24',
        date: '2026-10-28',
        title: 'Courtside',
        sections: [
            {
                title: 'New match screen',
                lines: [
                    'On a phone held upright, the court is twice as big and the camera follows the ball',
                    'Tactics, Swap, Time and Plays are now 4 buttons near your thumb',
                    'In Settings you pick up to which speed the camera stays close',
                ],
            },
            {
                title: 'Duel',
                lines: ['If the room from a link takes a while to open, a Play a cup button shows up while you wait'],
            },
            {
                title: 'Menus',
                lines: ['The Soccermon logo is back on the home screen'],
            },
            {
                title: 'Fixed',
                lines: [
                    'On desktop, the speed bar fits on screen',
                    'With the phone sideways, halftime fits without cut-off text',
                    'The corner kick zoom no longer shows the dark area outside the court',
                ],
            },
        ],
    },
    {
        version: '0.9.23.3',
        date: '2026-10-27',
        title: 'Player requests',
        sections: [
            {
                title: 'Max Move',
                lines: [
                    'The level 3 shot is now almost unstoppable: 57% ⇒ 82% goals. The keeper max save can still stop it',
                ],
            },
            {
                title: 'Match',
                lines: [
                    'Substitutions ask for confirmation and show the rating of who leaves and who comes in at that spot',
                    'In Duels the bottom tabs also stay closed until you tap',
                ],
            },
            {
                title: 'Menus',
                lines: [
                    'The Club has your most used Pokémon walking around. Tap the top scorer to see the goals',
                    'Lineup on phones: the Card button opens the selected Pokémon card',
                    'Trainer card on phones with the 3 cards side by side',
                    "Daily Cup: today's ranking sits under PLAY, and after playing the button takes you there",
                    'Pack cards on the music beat is now an option in Settings (off by default)',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'Resuming a saved cup kept swapping cups without leaving the screen',
                    'Lineup with the phone in landscape fits without scrolling',
                ],
            },
        ],
    },
    {
        version: '0.9.23.2',
        date: '2026-10-27',
        title: 'Cleanup',
        sections: [
            {
                title: 'Less on screen',
                lines: [
                    'Lighter panels: thin borders, no heavy frames and no boxes inside boxes',
                    'Instructions and tips only show in your first cup. After that they live in Help (?)',
                    'The top bar shows just the trainer. Trophies, Pokédex and badges stay in their own places',
                    'The Stadium lost the 4 goal boards, and the big logo only shows on your first visit',
                    'Prof. Oak speaks only once. The Club shows the mission closest to done, and the Arena puts the League in one line',
                ],
            },
            {
                title: 'Cup',
                lines: [
                    'Lineup: the formation opens in a sheet with its bonuses, the rival is one line and the card only shows when you tap a Pokémon',
                    'Shorter result: possession, shots and the bracket are in Stats, and a new trainer is a notice that fades away',
                    'Market: what the win paid fits in one sentence',
                    'Match on phones: one thing at a time over the court (goals first), and the bottom tabs stay closed until you tap',
                ],
            },
            {
                title: 'Every screen',
                lines: [
                    'Big monitors: everything is bigger, no more tiny column in the middle',
                    'Phone in landscape: Lineup, Draft and Result fit the screen',
                    'No more cut names on small phones',
                    'A shiny avatar now shows shiny in the Stadium and the Arena',
                ],
            },
        ],
    },
    {
        version: '0.9.23.1',
        date: '2026-10-26',
        title: 'Place fixes',
        sections: [
            {
                title: 'Fixed',
                lines: [
                    'Tapping a Pokémon made it jump to another spot. Now it just hops, and anyone who needs to move fades out and back in',
                    'The Arena court now has the boxes, the goals and the corners',
                    'Closing a panel (Tactics, card, confirmation) no longer flashes dark',
                    'Draft cards show their stats like before again',
                ],
            },
            {
                title: 'Max Move',
                lines: [
                    'The button stays lit longer and the game nearly stops while it glows, even at 8x and in Duels',
                    "The move's shot flies in slow motion with a glowing ball, and the level 3 move name stays on screen longer",
                ],
            },
        ],
    },
    {
        version: '0.9.23',
        date: '2026-10-26',
        title: 'Locker room',
        sections: [
            {
                title: 'Lineup in the locker room',
                lines: [
                    'The lineup sits on a tactics board: the Bracket and Tactics are boards on the wall, each one opens its own panel',
                    'The clipboard sits right below, and the whole team fits on the first phone screen',
                    'During a cup, the top bar shows the round, your ₽ and your rerolls',
                ],
            },
            {
                title: 'Simpler',
                lines: [
                    'Panels slide up from the bottom on phones, with a round X. Every confirmation is a short panel',
                    'The victory pack opens by itself, and Skip and Reroll sit together at the bottom',
                    'Full time waits for you to tap See result',
                    'A new trainer or title shows right below the score',
                    'Shorter Market: Sponsors sit on one line that opens a panel',
                    'Draft without the same instruction repeated, and bigger card attributes',
                    'The Max Move is always in view on the bottom bar of the match. Tapping it early tells you when it lights up',
                ],
            },
            {
                title: 'New look',
                lines: [
                    'Stadium: goals move up to the stands and the play button sits at the bottom, leaving the court clear',
                    'Starting a cup, walking on court and winning the title get a wallpaper transition (a different drawing each time)',
                    'Profile, Collection, Trophy room, Help and Settings with the top bar, folder tabs and new progress bars',
                    'Halftime, penalty order and Champion in the same style as the buttons',
                    'Quick notices drop from the top: green when it worked, red when it failed',
                ],
            },
            {
                title: 'New',
                lines: [
                    'Play as an app: in Settings, Install puts Soccermon on your Android home screen, full screen (on iPhone, Share and Add to Home Screen)',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'The screen no longer flashes black when switching menus',
                    'The Max Move Wait button went off screen on small phones',
                ],
            },
        ],
    },
    {
        version: '0.9.22',
        date: '2026-10-26',
        title: 'Press the button',
        sections: [
            {
                title: 'New look',
                lines: [
                    'Raised buttons across the whole game: they sink and bounce when tapped, with sound',
                    'The color tells what a button does: gold plays, green moves on or buys, blue is everything else, red only to delete or leave',
                    'One big button per screen, for the next step. Buy and Pick became a tag on the card itself',
                    'Panels with a thick frame and the title on a plaque, like the Stadium',
                    'Whatever is selected is always blue',
                ],
            },
            {
                title: 'Improved',
                lines: [
                    'Trainer level on the top bar: it goes up with the missions you complete',
                    'Draft: the 3 cards fit on the first phone screen',
                    'Auto-draft is more low-key now: if you want to pick, you pick',
                    'The quick notice no longer covers the bottom button',
                    'The Leave cup confirmation no longer hides behind the Play bar',
                ],
            },
        ],
    },
    {
        version: '0.9.21',
        date: '2026-10-25',
        title: 'Every mode in its own place',
        sections: [
            {
                title: 'New home screen',
                lines: [
                    'The home screen is now five places on a bottom bar: Lab, Road, Stadium, Arena and Club. Tap or swipe to switch',
                    'Stadium: a big golden PLAY, a pill to pick the mode and four goals in view (Daily Cup, mission, badges and belt)',
                    'Indigo Road: the Kanto map with your badges and your team where you stopped',
                    "Oak's Lab: Pokédex, Album and Movedex",
                    'Arena: Duel and League',
                    'Club house: Trophy room, profile and the mission board',
                    'Wild Pokémon walk, nap and play in every place. Tap them',
                    'The sky follows the time of day',
                ],
            },
            {
                title: 'Changed',
                lines: [
                    "What's new, Help, Credits and the rest of the footer moved to Settings",
                    'The old home screen still opens with ?lab=off in the address',
                ],
            },
        ],
    },
    {
        version: '0.9.20',
        date: '2026-10-25',
        title: 'Reworded texts and the 1st match',
        sections: [
            {
                title: 'Improved',
                lines: [
                    'Game texts reviewed (home, draft, match and commentary): shorter, more natural lines',
                    'Moves show their official English names across the whole game',
                    'The Balanced tactic shows the right numbers (+4% / +3%)',
                    'The halftime tip is clearer',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'The "Change the tactic..." tip now shows only after the 1st goal or at halftime of the 1st match',
                ],
            },
        ],
    },
    {
        version: '0.9.19',
        date: '2026-10-24',
        title: 'Indigo Road and landscape phones',
        sections: [
            {
                title: 'Added',
                lines: ['After your 1st cup, a tip on the home screen introduces the Indigo Road (shown only once)'],
            },
            {
                title: 'Fixed',
                lines: [
                    'Small phones in landscape: the post-match rewards fit on screen without scrolling',
                    'Small phones in landscape: the halftime buttons (Substitute and Start the 2nd half) are always visible',
                ],
            },
        ],
    },
    {
        version: '0.9.18',
        date: '2026-10-24',
        title: 'Signatures and first visit',
        sections: [
            {
                title: 'Level 3 signatures',
                lines: [
                    '12 Pokémon swap the type effect of their level 3 max move for one of their own, with its own animation and banner',
                    "Dragonite, Hyper Beam: pierces every block. Rival keeper's reach x0.8 ⇒ x0.85 (Dragon Fury ⇒ beam)",
                    'Snorlax, Snorlax Slam: throws itself into the shot and anyone within 4 m falls for 1 s and is paralyzed',
                    'Snorlax in goal, Goal Nap: on a level 3 max save it lies down in front of the goal. Reach x1.4 ⇒ x1.8',
                    'Arcanine, Fire Star: a fire star bursts in front of the goal and anyone within 4 m of it falls for 0.6 s and is burned',
                    'Articuno, Blizzard: the whole rival box freezes for 1.2 s (before, only players on the shot line, 1 s)',
                    "Blastoise, Twin Cannons: the first one didn't go in? The ball comes back and it fires again from any distance",
                    'Charizard, Flaming Flight: flies up to 2 m toward goal, shoots high and burns the keeper who saves it',
                    'Pikachu, Chain Lightning: the bolt jumps from the keeper to the 2 closest rivals and paralyzes for 1.5 s',
                    'Gengar, Dream Eater: the keeper dozes off, reach x0.8 ⇒ x0.75, even a Normal keeper (it used to be immune)',
                    'Mewtwo, Telekinesis: the ball curves up to ~11° to the far corner (before ~8°) and the keeper gets reach x0.9',
                    'Gyarados, Tsunami: pushes every rival 3 m (before only the shot line, 2.5 m) and goes into a 6 s rage',
                    'Mew, Metronome: rolls one of the 16 type effects on every max move',
                    "Ditto, Transform: copies the rival captain's effect, signature included",
                    'Evolved into the final form mid-cup? The signature comes along',
                    'A move that hits several at once (Snorlax Slam) shows PARALYZED only once, on the middle one; the others keep the icon',
                    'The battle box gets out of the way when a goal or the level 3 banner comes in',
                    'Long names on the banner (SNORLAX SLAM) shrink to fit a phone in portrait',
                ],
            },
            {
                title: 'First visit',
                lines: [
                    'First-time players see a Home with a single button: Play (Lightning Cup, 4 matches). The other modes sit under More modes',
                    'In the first cup, Auto-draft becomes the main draft button, and the tip explains it before teaching how to pick by hand',
                    'Returning players still land on the usual Home',
                ],
            },
            {
                title: 'Phone and fixes',
                lines: [
                    'Phone in portrait: when two names touch on the court, the name shortens to 5 letters before hiding',
                    'Save loading before the screen: the tutorial tip disappeared and returning players saw a Home without the modes',
                    'Phone in portrait: after picking the penalty order, the court scrolls back into view (the shootout used to happen off screen)',
                ],
            },
        ],
    },
    {
        version: '0.9.17',
        date: '2026-10-23',
        title: 'Level 3 special and who takes the hit',
        sections: [
            {
                title: 'Max move level 3',
                lines: [
                    "The court freezes for 0.3 s in the type's color and a banner crosses the screen with the captain's portrait",
                    'On the banner: the move, the type effect ("Hyper Beam · Dragon effect") and your timing, PERFECT! or GOOD',
                    "A goal, save, block or post sends out a shockwave in the type's color",
                ],
            },
            {
                title: 'Moves on the court',
                lines: [
                    "Whoever is hit by an effect move is pushed back and gets the word in the type's color: BURNED, CONFUSED, KNOCKED DOWN",
                    'Low kicks, throws, tackles with a move and Normal and Ground level 3 knock players down: the Pokémon falls and sees stars',
                    'Status is now an icon with a ring showing how long is left, instead of PAR and BRN',
                    'On the player panel: who caused the status and how long is left ("Zubat became confused from Psychic (2 s)")',
                    "Shot with a move: the ball trail now has the type's particle (fire rises, water drips). Before, it was always Normal's little star",
                ],
            },
            {
                title: 'Phone and tutorial',
                lines: [
                    'Short phone screen in landscape: max move and Wait sit side by side, without covering the court',
                    'Tapping outside the tutorial balloon closes it and also counts for the button you tapped',
                    'On the first visit, the balloon no longer scrolls the page for nothing and the Home logo stays',
                ],
            },
        ],
    },
    {
        version: '0.9.16',
        date: '2026-10-23',
        title: 'Max move by type and 4 Sponsors',
        sections: [
            {
                title: 'Max move by type',
                lines: [
                    "At level 3, the max move gets the effect of the captain's type: one effect for each of the 16 types",
                    'Charizard fires the Fireball, Blastoise pushes the defense with the Wave and Gengar goes through the defender with the Ghost Ball',
                    'Alakazam curves the ball, Dugtrio knocks down the defenders within 6 m of the goal and Scyther sends the Swarm: the keeper may take the bait',
                    'Pikachu fires Lightning: the ball is x1.15 faster and whoever blocks or saves it is paralyzed for 1.5 s',
                    'The type icon shows on the button: dim at levels 1 and 2, lit at 3',
                    'Wait button: save the max move for the next level, no slow motion',
                    "Dual-type captain: the max move's type counts, if it is one of the captain's types",
                    "Rival leaders also use their captain's effect",
                    'The level 3 shot aims closer to the middle of the goal: far fewer shots go wide',
                ],
            },
            {
                title: 'Sponsors',
                lines: [
                    '4 new Sponsors in the Market, ₽10 each',
                    'Viridian Scout: single Pokémon and packs in the Market with the next stage rarity',
                    'Lavender Trainer: +6 stamina for the whole team',
                    'Pewter Drum Band: +4 to everything while your team is losing. When it starts, "THE DRUMS KICK IN" shows on the court',
                    'Pallet Youth Club: points for your team to evolve 14 ⇒ 10',
                ],
            },
        ],
    },
    {
        version: '0.9.15',
        date: '2026-10-23',
        title: 'Baby route',
        sections: [
            {
                title: 'Indigo Route',
                lines: [
                    'The Route starts at base forms: the captain and the draft come out as Charmander, Machop, Magikarp, and the team evolves along the way',
                    'Average team rating at the start of the Route: 79.5 ⇒ 64.6',
                    'The strongest Pokémon with no evolution (Snorlax, Lapras, legendaries) only show up as reinforcements, after the start',
                    'Leave the Route and come back to the same draw: the Route only changes when you finish one',
                    'The early rivals got weaker: match 1 -1 ⇒ -2 and match 2 0 ⇒ -1',
                ],
            },
        ],
    },
    {
        version: '0.9.14',
        date: '2026-10-23',
        title: 'Max move in 3 levels, on the beat',
        sections: [
            {
                title: 'Max move',
                lines: [
                    'The bar now has 3 levels and refills after use: max moves per match 1 ⇒ several (the bar recharges)',
                    'Release at level 1 or hold for level 3, the strongest shot in the game: shot power x1.55 ⇒ x1.25 / x1.55 / x2.2 (levels 1 / 2 / 3)',
                    'At level 3 the rival keeper has x0.7 reach on that shot',
                    'Tap when the ring closes on the button, on the beat of the music: PERFECT! hits harder',
                    'With no sound, the ring follows an on-screen pulse',
                    'Tapped a bit before it lit up? The move comes out on the next shot',
                    'Leaders also tap on the beat, and Lance almost always nails it',
                ],
            },
            {
                title: 'Max save',
                lines: [
                    'With the captain in goal, the level gives more save time: 4 s ⇒ 0.75 s / 4 s / 6 s (levels 1 / 2 / 3)',
                    'A perfect tap holds the ball',
                ],
            },
        ],
    },
    {
        version: '0.9.13',
        date: '2026-10-22',
        title: 'Patch notes that are easier to read',
        sections: [
            {
                title: 'Patch notes',
                lines: [
                    'The newest version sits on top, highlighted, with its date',
                    'Older ones are collapsed: tap to open',
                ],
            },
        ],
    },
    {
        version: '0.9.6',
        date: '2026-10-22',
        title: 'Touchline and stronger TMs',
        sections: [
            {
                title: 'Touchline',
                lines: [
                    "Max move: your team's plays fill the bar and the button lights up when your captain can shoot",
                    'The shooting zone depends on the captain: pivot 15 m, winger 18 m, defender 22 m',
                    'A captain in goal gets a max save: the next shot he can reach is saved',
                    'Flying keeper: the keeper joins the attack for 5 against 4, leaving the goal empty',
                    'Time-out: 1 per half, the team gets its breath back and subs apply right away',
                    'Cup rival coaches use the same tools',
                    'Subs and board changes apply right away, with the ball in play; coach shouts are gone',
                ],
            },
            {
                title: 'TMs',
                lines: [
                    'A move taught by TM comes out more often, hits harder and gets the TM badge',
                    'Mega Drain 40 ⇒ 100 power, BubbleBeam 65 ⇒ 100, Fissure accuracy 30% ⇒ 50%',
                ],
            },
        ],
    },
    {
        version: '0.9.5',
        date: '2026-10-21',
        title: 'Every formation plays its own way',
        sections: [
            {
                title: 'Formations',
                lines: [
                    'Diamond: triangles and short passes through the middle',
                    'Square: the ball goes down the flanks',
                    'Back Three: the pivot drops, lays it off and the runner shoots first time',
                    'Rotation: all four swap spots all the time and break fast',
                    'Twin Pivots: direct play, shooting right after winning the ball',
                    'Lockdown: low, compact block and a quick break',
                    'Each formation has an edge over another; the icon on the lineup shows when it fits',
                ],
            },
            {
                title: 'Moves',
                lines: [
                    'Nidorino, Venonat, Bellsprout, Weepinbell, Victreebel, Slowbro, Chansey and Jolteon have their own moves',
                ],
            },
        ],
    },
    {
        version: '0.9.4',
        date: '2026-10-21',
        title: 'Best-of-3 Duel and a polished Road',
        sections: [
            {
                title: 'Duel',
                lines: [
                    'Best of 3 with the same team: the scoreboard shows the series score',
                    'A voided game is replayed; leaving between games is a walkover win for whoever stayed',
                ],
            },
            {
                title: 'Indigo Road',
                lines: [
                    'Rewritten texts: one yellow card rule, "End of the road" and shorter events',
                    'The map uses the whole screen on desktop',
                    'Players who are out show why (injury, daycare or tired) and stay off the court',
                    'Hall of Fame split into Lightning Cup and Indigo Road, with its own indigo trophy',
                ],
            },
        ],
    },
    {
        version: '0.9.3.2',
        date: '2026-10-21',
        title: 'Indigo Road up front',
        sections: [
            {
                title: 'Home screen',
                lines: [
                    'Indigo Road and Lightning Cup side by side on desktop, with the Road bigger and a NEW tag',
                    'Duel and Daily Cup below, next to each other',
                    'On phones, the Road button takes the full width',
                ],
            },
        ],
    },
    {
        version: '0.9.3.1',
        date: '2026-10-21',
        title: 'Pokédex entries and more faces',
        sections: [
            {
                title: 'Collection',
                lines: ['The Pokémon sheet and the open Album card show the Pokédex entry'],
            },
            {
                title: 'Livelier Pokémon',
                lines: [
                    'Pokémon cry when you pick them in the draft, in the VERSUS and on the big pack card',
                    'Trophy room: at night it really sleeps; in the day it sometimes sits or eats',
                    'Indigo Road: the team naps at Rest, winces on a tackle and gets dizzy in hard training',
                    'Knocked out: the team lies on the floor and the captain sheds a tear',
                ],
            },
            {
                title: 'Indigo Road and Lightning Cup',
                lines: [
                    'The map shows the rival captain on each match node and their team as icons',
                    'The cup bracket shows each club captain',
                ],
            },
        ],
    },
    {
        version: '0.9.3',
        date: '2026-10-21',
        title: 'Moves reviewed',
        sections: [
            {
                title: 'Each one with its own type',
                lines: [
                    'Every Pokémon has at least 1 move of each of its types (when Gen 1 allows it)',
                    'Gengar: Confuse Ray ⇒ Sludge (Dream Eater, Hypnosis, Night Shade, Sludge)',
                    'Gastly and Haunter: Hypnosis ⇒ Toxic',
                    'Zubat and Golbat: Supersonic ⇒ Toxic',
                    'Nidoran♂, Nidorino and Nidoking: Focus Energy ⇒ Toxic; Nidoqueen: Counter ⇒ Toxic',
                    'Beedrill: Agility ⇒ Toxic',
                    'Charizard: Fire Blast ⇒ Fly',
                    'Hitmonchan: Agility ⇒ Counter',
                    'Gyarados: Splash ⇒ Hyper Beam',
                ],
            },
            {
                title: 'No repeated moves',
                lines: [
                    'Charmander and Charmeleon: Fire Blast ⇒ Dragon Rage',
                    'Raichu: Thunderbolt ⇒ Agility',
                    'Arcanine: Flamethrower ⇒ Take Down',
                    'Hitmonlee: Jump Kick ⇒ Double Kick',
                    'Staryu: Hydro Pump ⇒ Psychic',
                    'Omanyte: Hydro Pump ⇒ Surf',
                ],
            },
            {
                title: 'Moves that now do what they promise',
                lines: [
                    'Harden keeps the ball on the next tackle (like Defense Curl)',
                    'Slam reaches further (2.8 m)',
                    'Amnesia raises passing, shooting and reading',
                    'Tri Attack can burn, freeze or paralyze',
                    'Explosion hits everyone within 4 m',
                    'Light Screen and Reflect no longer give hidden shooting',
                    'Fly and Dig with the ball carry it 2 m (was 4)',
                ],
            },
            {
                title: 'Texts',
                lines: [
                    'Every move explains what it does on the court with numbers (how long, who is immune, how often it hits, the cost to the user)',
                ],
            },
        ],
    },
    {
        version: '0.9.2.2',
        date: '2026-10-21',
        title: 'Indigo Road is back',
        sections: [
            {
                title: 'Indigo Road',
                lines: [
                    'The Road is back: the 1st match broke the lineup screen (fixed) and it was played start to finish before coming back',
                    'Continuing on a "?" event goes back to the event (it used to open the lineup and replay the match)',
                    'A yellow card or a group loss says DEFEAT (not End of the line); the red card only comes on the 2nd loss on the map',
                    'The saved cup, champion screen (x/8), goal of the cup and title card name the Road match, not the Round of 16',
                    'New cup at the end of a Road starts another Road',
                    'Injured starter: the warning shows next to Play',
                ],
            },
        ],
    },
    {
        version: '0.9.2.1',
        date: '2026-10-21',
        title: 'Light album, easy showcase',
        sections: [
            {
                title: 'Album',
                lines: [
                    'The Album no longer stutters when opening and turning pages (only the visible page is built and the holo shine only moves on the card in focus)',
                    'Cards stacked behind a sticker show only by their edge',
                ],
            },
            {
                title: 'Showcase',
                lines: [
                    'Full showcase: Add to showcase asks which card leaves and swaps in one tap',
                    'An x in the corner removes a card from the showcase',
                    'Drag a card onto another (or tap one, then the other) to change the order; it applies to your Profile, your friend view and the Duel',
                    'On desktop, the showcase on the Profile card is bigger and centred',
                ],
            },
        ],
    },
    {
        version: '0.9.2',
        date: '2026-10-21',
        title: 'House in order',
        sections: [
            {
                title: 'Home screen',
                lines: [
                    'New cup big and on top; Duel and Daily Cup side by side, sized to their content',
                    'Coming up: what is on the way in a strip of small cards (tap to see what it is)',
                    'Profile, Collection and Trophy room as three doors; the "?" opens Help',
                    'The language button no longer jumps around when you switch',
                    'First-time players go straight into the game (the walkthrough is in Help)',
                ],
            },
            {
                title: 'In the cup',
                lines: [
                    'The main action sits at the bottom, in the thumb bar, on every cup screen',
                    'One red button per screen; the others are outlined',
                    'The cup bracket opens with a tap (See the bracket) on the lineup and result screens',
                    'Tips only in your 1st cup, next to what they explain',
                    'Knocked out: New cup in one tap and how close you came',
                ],
            },
            {
                title: 'Market',
                lines: [
                    'With a pack open, your team shows alongside to compare',
                    'What you cannot afford has a lock and shows how much is missing',
                    'Reroll stock is now New offers',
                    'Sponsor texts rewritten, shorter and with the effect number; the price shows on the contract',
                ],
            },
            {
                title: 'Match',
                lines: [
                    'Team tab on desktop: full names and positions',
                    'Substitute no longer shows twice at half-time',
                ],
            },
            {
                title: 'Touch and sound',
                lines: [
                    'Each kind of button has its own sound (go on, back, leave, delete)',
                    'Abandoning a cup, leaving a Duel and deleting data get a sad exit, with animation and sound',
                    'Short vibration on Android (turn it off in Settings → More options)',
                    'Shorter Settings: the rest lives in More options',
                ],
            },
            {
                title: 'Trophy room',
                lines: [
                    'The Pokémon walking around is no longer stretched and no longer walks through furniture',
                    'The PC shows whole, the TV sits in front of its stand and card photos are not stretched',
                    'The camera no longer gets stuck zoomed in after a quick tap',
                ],
            },
        ],
    },
    {
        version: '0.9.1.1',
        date: '2026-10-21',
        title: 'Cards back',
        sections: [
            {
                title: 'Fixes',
                lines: [
                    'The showcase shows your best real card of that Pokémon (it could get stuck on the default version, Star Player I or Icon without MVP)',
                    'Changes only in the Album now sync to the cloud',
                    'A card lost from before the Album (Oct 19) comes back with a code: Profile → Trainer → Redeem code',
                ],
            },
        ],
    },
    {
        version: '0.9.1',
        date: '2026-10-21',
        title: 'Indigo Road',
        sections: [
            {
                title: 'Indigo Road (new mode)',
                lines: [
                    'The long cup: a Kanto map from bottom to top (Route 1, Viridian Forest, Mt. Moon, Cerulean, Victory Road, Indigo Plateau), with matches, Gyms, Market, Chest, Training and "?" events',
                    'Three acts: knockouts on the map, a group stage at the Plateau (top 2 reach the Final) and the Final against the Indigo League',
                    'Yellow card: your 1st loss outside the Final does not knock you out; the 2nd is a red',
                    'Route trainers talk in the VERSUS and at full time',
                ],
            },
            {
                title: 'Lightning Cup',
                lines: [
                    'The Quick Cup is now the Lightning Cup, with the 16-club bracket on screen: you climb it with every win',
                    'Goal missions in a cup count your best run of 4 matches (same for Lightning and Indigo Road)',
                ],
            },
            {
                title: 'Match',
                lines: [
                    'Stoppage time of 1 to 3 minutes per half, with the board on the scoreboard',
                    'Final push: from minute 37 on, the team that is behind gets a boost (shooting, passing, dribbling and speed) and pushes up, the same for both sides',
                ],
            },
            {
                title: 'Daily Cup',
                lines: [
                    'Day streak and the next milestone on the daily screen',
                    'Sticker of the day: the same Pokémon for everyone, an Event card in the Album when you finish',
                    'Milestones: 7 days (Daily Devotee title) and 30 days (Golden Lass trainer)',
                ],
            },
            {
                title: 'Accounts',
                lines: ['Trainer and club names are unique (whoever already had one keeps it)'],
            },
        ],
    },
    {
        version: '0.9.0.5',
        date: '2026-10-21',
        title: 'Everything on the board',
        sections: [
            {
                title: 'Direct taps',
                lines: [
                    'Substitutions: tap who comes off and who comes on in the board and the swap is set, with the cards sliding (the list panel is gone)',
                    'Reward and Market: pick who gets the Pokémon or the item by tapping the board',
                    'Lineup: Give to another and tap who gets the item',
                    'Penalties: tap two takers to swap their order',
                ],
            },
            {
                title: 'Market and Profile',
                lines: [
                    "An opened pack can be closed without taking any card (I don't want any, move on)",
                    'Your card showcase shows on the Profile card',
                ],
            },
        ],
    },
    {
        version: '0.9.0.4',
        date: '2026-10-21',
        title: 'Moves and Sponsors explained',
        sections: [
            {
                title: 'Clearer',
                lines: [
                    'TM: when picking which move to forget, each move shows what it does on the court',
                    'Full card: the rating on the court, with captain, synergies and Sponsors (the big number is the card alone)',
                    'Tap a Sponsor in your slots to see what it does',
                ],
            },
            {
                title: 'Market',
                lines: [
                    'The Market before the Final only offers field Sponsors (₽ ones would have nowhere left to pay off)',
                ],
            },
        ],
    },
    {
        version: '0.9.0.3',
        date: '2026-10-21',
        title: 'Packs and Sponsors',
        sections: [
            {
                title: 'Market',
                lines: [
                    'Bought packs really open: they tear and the cards come out one by one, and the type art is sharp',
                    'Two Sponsors to choose from in every Market',
                    'Prices show how much you still need (₽10 · need ₽1)',
                ],
            },
        ],
    },
    {
        version: '0.9.0.2',
        date: '2026-10-21',
        title: 'Weekly fixes',
        sections: [
            {
                title: 'Fixes',
                lines: [
                    'Trophy room: if your avatar is shiny, the Pokémon walking around is shiny too',
                    'VERSUS: Start only shows up after the teams are introduced',
                    'The screen no longer flickers when entering or leaving a match and the Trophy room',
                ],
            },
            {
                title: 'Market',
                lines: [
                    'The Sponsor card says it is a Sponsor, and the shelf explains the 3 slots (Pokémon, packs and items do not take one)',
                ],
            },
        ],
    },
    {
        version: '0.9.0.1',
        date: '2026-10-21',
        title: 'Tidier Market',
        sections: [
            {
                title: 'Market',
                lines: [
                    'The Market is now split into shelves: Signings, Pack and item, and Sponsors (with your 3 slots right below)',
                    "The Sponsor card is laid out sideways so it doesn't get mixed up with Pokémon cards",
                ],
            },
        ],
    },
    {
        version: '0.9.0',
        date: '2026-10-20',
        title: 'Market and Sponsors',
        sections: [
            {
                title: 'Market',
                lines: [
                    'After the reward of every win, the Cup now has a Market: spend ₽ (Pokédollars) on Pokémon, type packs, items, TMs or Sponsors',
                    'Every win pays ₽: 5 for the win, 1 per goal (up to 3) and 2 for a clean sheet. Saving pays interest: ₽1 per ₽5, up to ₽3',
                    "Type pack: 3 cards of the weekly type or your captain's type, keep 1. It opens like the reward pack, in the type's colors",
                    'Rerolling the stock costs ₽2, plus ₽1 for each reroll in the same Market',
                    '₽ only exists inside the cup and is gone when it ends. The Daily Cup has no Market for now',
                ],
            },
            {
                title: 'Sponsors',
                lines: [
                    '12 Kanto Sponsors, up to 3 per cup: they last until the end of it',
                    'Economy: Pokémon Fan Club, Celadon Game Corner, S.S. Anne and Celadon Dept. Store boost your ₽ and the stock',
                    'Reward: Cinnabar Lab (4 reward options), Pokémon Day Care (first reroll free) and Safari Zone (4-card packs)',
                    'Field: Silph Co., Cerulean Bike Shop, Saffron Dojo, Vermilion Fans and Master Sponsor give on-court bonuses, shown on the card',
                    'Your Sponsors show up on the boards along the court',
                ],
            },
            {
                title: 'Menus',
                lines: [
                    'The home screen splits the two Cup modes: the Quick Cup (the usual one, 4 matches) and the Long Cup, with a map, events and treasure (coming soon)',
                    'Everything lives in the Profile: the Trophy room and the Collection open right below your card',
                ],
            },
        ],
    },
    {
        version: '0.8.9',
        date: '2026-10-20',
        title: 'Trophy room and new menus',
        sections: [
            {
                title: 'Trophy room',
                lines: [
                    'A real pixel art room for everything you won: Cup trophies (bronze, silver and gold by how you won), the League, Daily Cup medallions, Duel belts, medal pins, the Platinum diploma and the Hall of Fame in polaroids',
                    'At night (6 pm to 6 am) the spotlights turn on over the cases and the fireplace and TV flicker; by day the room is bright',
                    'Your avatar Pokémon lives there: it walks around, goes to what you tap and sleeps on the rug late at night',
                    'Tap anything: the camera moves in and a card tells you what it is, how many you have, how to earn it and the history. Or use the buttons below the room',
                    'Hold on the room to see every name. On your first visit, a short tutorial shows each part',
                    'The room levels up with your titles: Pallet bedroom, club room, stadium room',
                ],
            },
            {
                title: 'Menus in three doors',
                lines: [
                    'The start screen has the game modes and three doors: Profile (who you are), Collection (what you collect) and Trophy room (what you won)',
                    'Profile: the top is your public card; Trainer (with the missions that unlock each trainer and title), Club and Friends tabs',
                    'Collection: Pokédex, Album and Movedex together. Career seals live on each Pokémon page, with "Highlight"',
                    'Settings in the gear at the top corner of every menu screen. Patch notes, Help, Credits and feedback in the footer',
                    'NEW disappears by itself once you see the item (no more "Mark as seen" bars)',
                ],
            },
            {
                title: 'Friends',
                lines: [
                    'Tap a friend to see their profile: card, showcase, numbers, latest titles and your Duel record against each other',
                    'Daily Cup ranking with Everyone or Friends only',
                ],
            },
            {
                title: 'Nothing jumps',
                lines: [
                    'Every screen change has a transition; tabs slide; windows fade out; in the draft, the signed card flies to its slot',
                    'Phone in portrait: Pokémon names that overlap on the court fade out instead of piling up',
                ],
            },
        ],
    },
    {
        version: '0.8.8.4',
        date: '2026-10-20',
        title: 'The album is a book',
        sections: [
            {
                title: 'Sticker album',
                lines: [
                    'The album is now a book: a shelf with the Generation 1 (Kanto) album. Tap the cover and it opens',
                    'Pages really turn, over the spine, by swiping or with the arrows',
                    'One slot per Pokémon, in Pokédex order, with the front card stuck in. The dots below show which editions you have (Regular, Shiny, Event, Icon, Star Player)',
                    'More than one version? They stack up behind it. Tap and they all spread across the screen, big enough to read',
                    'Pick which one goes on the front ("Put on the front"). If you never pick, the best one shows',
                    'A new sticker falls and sticks into its slot when its page shows up',
                ],
            },
            {
                title: 'Fixes',
                lines: ['"See all in the Pokédex" (Numbers) now scrolls up to the Pokédex instead of landing mid-list'],
            },
        ],
    },
    {
        version: '0.8.8.3',
        date: '2026-10-19',
        title: 'Layered cards and sticker album',
        sections: [
            {
                title: 'Layered cards',
                lines: [
                    'Shiny goes on top of any edition and adds +1: Shiny Icon, Shiny Event, Shiny Star Player',
                    'MVP seal on the corner of the card, in bronze, silver and gold. Icon and Event cards get it too, and each level adds +1 to everything',
                    'Star Player cards look better at each level: trim and shine at 2, gold rays and dust at 3',
                    'Event cards show their type, in its color: flames for Fire, waves for Water, bolts for Electric and 11 more types',
                    'Hover or hold your finger on the seals, the edition tag, the Pokédex and the medals to see what each one means',
                    'No attribute goes past 99: the leftover bonus only raises the ones still below',
                    'A match saved midway restarts at 0-0 (the engine changed)',
                ],
            },
            {
                title: 'Sticker album',
                lines: [
                    'Paper sticker album in the Pokédex: the real card stuck in each slot, one of each special edition',
                    'Empty slots show the name, silhouette and number; tap to open the entry. On desktop, two pages open side by side',
                    'Tap a sticker to see every version of it you have had. Any of them can go on your showcase',
                    'Rarities page at the end of the album: Shiny Icon, Shiny Event, MVP 3 and Star Player III',
                    'In the Pokédex, each Pokémon shows how many stickers it has (3/5); the cards live in the album',
                    'Card showcase on your public profile: your Duel rival sees it',
                    'Icon card titles (Rebel Charizard and co.) are smaller, on a single line',
                ],
            },
            {
                title: 'Profile',
                lines: [
                    'Profile button in the top corner, with your avatar',
                    'Tap your rival in the Duel (room, VERSUS or scoreboard) to see their profile, with the cards in full size',
                    'NEW tag on what you earned and have not seen yet (trainer, title, medal, avatar, sticker), a dot on the Profile button and "Mark as seen"',
                ],
            },
            {
                title: 'Friends',
                lines: [
                    "Add a friend from your rival's profile after a Duel, or with an 8-letter friend code",
                    'Friends tab in the Profile: requests to accept, who is online now and the Challenge button',
                    'Challenged someone? The invite shows up right away, on top of any screen, and lasts 15 minutes',
                    "No chat and no search by name. Remove and block in one tap (blocked players aren't told)",
                ],
            },
            {
                title: 'Fixes',
                lines: [
                    'VERSUS: the button only lets you start once the court has loaded (it used to open an empty match). If it takes too long, "Try again" shows up',
                ],
            },
        ],
    },
    {
        version: '0.8.8.2',
        date: '2026-10-19',
        title: 'New logo and fan banners',
        sections: [
            {
                title: 'New logo',
                lines: [
                    'New logo: the holo card with the ball (also on the browser tab, the phone icon and the link preview)',
                    'Card pack with the new logo',
                    'Standardized icons: close, arrows, star, reroll and the rest drawn with the same stroke across the game',
                ],
            },
            {
                title: 'Fans',
                lines: [
                    'New fan banners: "This is {club}", "DUCK, IT\'S HYPER BEAM", "Magikarp today, Gyarados tomorrow", "Your badge is mine!" and more',
                ],
            },
            {
                title: 'League',
                lines: ['Ranked League closed for now: the timer on the home screen shows when it opens'],
            },
        ],
    },
    {
        version: '0.8.8.1',
        date: '2026-10-19',
        title: 'Highlights, Daily Cup and medals',
        sections: [
            {
                title: 'Daily Cup',
                lines: [
                    'Daily Cup: the same cup for everyone (same draft, same rivals), one try per day and a daily ranking. Without an account, you play outside the ranking',
                    'Share your Daily Cup with a square for each match and keep track of the days you played this week',
                    'The Ranked League comes back when more people are playing',
                ],
            },
            {
                title: 'Balance: Winger and Pivot',
                lines: [
                    "The Winger rating now counts shooting and the Pivot's counts pace (the game already used both on court)",
                    'Nerf and tweak: Jolteon Winger 92 ⇒ 88, Alakazam Winger 87 ⇒ 83, Electrode Winger 84 ⇒ 80, Gengar Winger 86 ⇒ 83, Pikachu Winger 66 ⇒ 63, Dragonite Pivot 90 ⇒ 89',
                    'Buff: Tauros Pivot 75 ⇒ 77, Scyther Pivot 79 ⇒ 80, Victreebel Pivot 75 ⇒ Winger 76',
                    'Position changes: Kingler, Cloyster, Kabutops and Exeggutor become Defender; Rapidash, Dugtrio and Primeape become Pivot; Mr. Mime becomes Goalkeeper',
                    'Duel: Eevee evolves into the same form the card shows',
                    'A match saved midway restarts at 0-0 (the engine changed)',
                ],
            },
            {
                title: 'Highlights',
                lines: [
                    'After the match, rewatch the goals and big plays in slow motion on the court itself',
                    'Goal of the cup: at the end of the cup, your best goal gets a replay and the reason it was picked',
                    'Export a vertical clip (9:16) of the play to send or post on TikTok',
                ],
            },
            {
                title: 'Easier to play',
                lines: [
                    'Tactics tab with plain texts and an attack and defense meter on each style',
                    'The Board tab is now Positions, without the "Change board" button',
                    'At halftime the game suggests a sub based on second-half stamina (your call)',
                    'Full time: goes to the result on its own in 3 s; one tap on the court holds it',
                    "The rival's evolution is clearer: longer, with zoom, the team's name and color and a reminder on the Result",
                    'Pokémon cries: Modern is now the default, with the same volume for all (Classic 8-bit is still in Settings)',
                    'Simpler texts across the game and a 3-page welcome, with tips at the right time',
                    'Touchline experiment: the "Push up!" shout is now "Attack!"',
                ],
            },
            {
                title: 'Locker room and ready',
                lines: [
                    'Halftime becomes a locker room: several subs at once, each with undo, and a note on who the rival subbed',
                    'Duel: you can undo ready when picking the team, in the lineup and at halftime',
                    'Halftime stamina is the same everywhere: the stamina each player starts the 2nd half with',
                ],
            },
            {
                title: 'Home screen',
                lines: [
                    'A livelier home screen: LIVE badge on the court, a breathing logo and blocks that cascade in (stops with "reduce motion")',
                    'New error page: Psyduck kicked the ball off the court',
                ],
            },
            {
                title: 'Medals and club',
                lines: [
                    '20 tiered medals (bronze, silver, gold and platinum) in Profile → Medals. Everything you already played counts',
                    'Showcase: pick up to 3 highlights (medal, completed collection or seal); they show on your card and on the Duel VERSUS, and the best one becomes your avatar frame',
                    'Build your crest (shape, symbol and two colors) and a kit with a pattern, on the scoreboard, the VERSUS and the court. New symbols and patterns unlock with collections and medals',
                    'Avatars by generation, and any Pokémon you have played shiny becomes a shiny avatar',
                ],
            },
            {
                title: 'Achievements',
                lines: [
                    'Everything you unlock now shows the task you completed: in the notice and when picking a trainer or a title',
                    'New Gen 1 Platinum: get 100% of everything and earn the holographic Prof. Oak and the Kanto Diploma title',
                    'The trainer task now shows in full on phones',
                ],
            },
            {
                title: 'Coaches and courts',
                lines: [
                    'Gym leaders now talk before and after the match, and each club plays on its own gym court',
                    'With the touchline experiment on, the rival coach reacts in their own style: yells, calls time-outs, sends the keeper up, calls the max move and changes tactics. The commentary warns you 10 s before it kicks in',
                ],
            },
            {
                title: 'Emotes and account',
                lines: [
                    "Emotes: an evolved captain changes face, tapping the rival's emote mutes it (with Undo), 'Let's gooo!' makes your captain pose on court and the Cup leader reacts to your goals",
                    'If you played Duel without an account, you can link Google and keep the same account',
                ],
            },
            {
                title: 'Fixes',
                lines: [
                    'Prof. Oak now asks you to see all 151 Pokémon in the Pokédex (was 100); anyone who already earned him keeps him',
                    'Golden Prof. Oak counts "played" the same way as the Pokédex (players at 151 played who saw 150/151 now get it)',
                    'A Pokémon that evolves on court counts as "played" in both forms in the Pokédex (the old one until it evolves, the new one after)',
                    'The title streak resets when you start a new cup over one in progress',
                    'The title streak no longer comes back when merging the phone and PC saves',
                    'An Icon that joins as a reward also counts toward fielded Icons',
                    'Duel (Ready team): evolved cards get their evolution bonus, a species repeated through evolution is accepted and a player without a team no longer stalls the room',
                    'Duel: a sub made at the end of halftime no longer goes back in time',
                    "Fixed a rare court error when a Pokémon's animation hadn't loaded yet",
                    "Duel now counts in the Pokédex: whoever plays for your team becomes 'played'",
                    'Saved cups give "played" to the earlier form of whoever evolved on court',
                    'Shiny Pokémon show as shiny in the stats: highlights, table, awards and final',
                    'Duel (Ready team): a benched captain is accepted, and the invalid team notice shows in the game language',
                    'A Pokémon that evolves on court counts in both forms even when one only lasted seconds (evolving right at the start or in the last minute)',
                    'Evolution bar full from the previous match: the Pokémon starts in its earlier form and evolves after doing something (before, the court already opened with it evolved)',
                    "Counters match everywhere: Pokédex, Movedex, missions, medals, platinum and Profile count the same way (Ditto's Transform now counts in the move missions)",
                    'Hall of Fame titles and perfect cups show in the Profile and home screen after merging the saves of two devices',
                    'Shiny avatar: tap the Pokémon with the sparkle in the corner and pick the normal or the shiny version',
                    'Avatars are centered and shiny ones no longer spill over the border',
                ],
            },
        ],
    },
    {
        version: '0.8.8',
        date: '2026-10-19',
        title: 'Icon MVP and retroactive achievements',
        sections: [
            {
                title: 'Fixes',
                lines: [
                    'Icon cards can now be the star player: they stay Icons (galaxy background), get the "MVP", "MVP 2" and "MVP 3" seal and +1 to every attribute per seal (up to +5). Before, the award skipped to the next player',
                    'Anyone who won the cup with Mew and Mewtwo, the 3 legendary birds or a Rattata before those missions existed now gets the achievement when opening the game (it comes from the Hall of Fame)',
                ],
            },
        ],
    },
    {
        version: '0.8.7',
        date: '2026-10-19',
        title: 'Emotes, seals and supporter banners',
        sections: [
            {
                title: 'Duel',
                lines: [
                    'New emotes: your captain pops up big, cheering, crying or fuming, and lets out a cry. 8 emotes, including the new "Noooo!" and "Grrr!"',
                    'Short match when creating the room: the same match, played at double speed',
                    'Rooms use much less data (only what changed is sent)',
                    'Players on an outdated version get asked to refresh instead of joining a match that would fall apart',
                ],
            },
            {
                title: 'Collection and club',
                lines: [
                    "Career seals in the Pokédex: Foil (10 matches), Holo (25 goals), Prism (5 titles) and Dark Gold (Prism + Kanto complete). Everything you've already played counts",
                    'Supporter banner: pick your club phrase in Profile → My club; it hangs by the court in your club color',
                ],
            },
            {
                title: 'Cup',
                lines: [
                    'Auto-draft: one tap fills the rest of your team with the best card for each slot (you can still swap in the lineup)',
                ],
            },
            {
                title: 'Experiment: touchline',
                lines: [
                    'Turn it on in Settings → Experiments (works in the Cup and, set by the room host, in the Duel)',
                    'Coach shouts (3 per match): Push up!, Lock it down!, Calm down! and Press high!',
                    'Timeout (1 per half): +5% stamina for your team and +3% for the rival, plus a pause to sub and change the board',
                    "Flying keeper, the captain's max move (the bar fills faster when you're losing) and penalty order",
                ],
            },
        ],
    },
    {
        version: '0.8.6',
        date: '2026-10-18',
        title: 'Golden legends and live tactics board',
        sections: [
            {
                title: 'Legendary missions',
                lines: [
                    '6 golden trainers for absurd feats: Ash (perfect cup, no goals conceded), Lance (win with the 3 legendary birds starting the final), Joey (win with a Rattata), Red (5 cups in a row), Blue (come back from 3 down in the final) and Prof. Oak (play with all 151)',
                    '9 shining legendary titles, like Lord of the Skies, Original and Clone, Legendary Striker (12 goals from one Pokémon in a cup) and Underdog (win with 5 bronze starters)',
                    'A golden trainer glows and gets a gold frame on the profile, VERSUS, duel, Hall of Fame and title card',
                    "Ash's mission is now doable: win the cup conceding 5 goals or fewer (title: The Wall). The perfect cup, without conceding, now gives Golden Ash",
                ],
            },
            {
                title: 'Collection',
                lines: [
                    'Sticker album in the Pokédex: Normal, Shiny, Event, Icon and Star Player for each species (622 in all), stuck when the card plays',
                    'Champion ribbon in the Pokédex showing how many times each species won with you',
                    '9 themed collections with their own title: Starters, Birds, Fossils, Eeveelutions, Legendaries, Hitmons, Nidos and the Brock and Misty teams',
                    'Goal cry: your captain cries out with the crowd when you score (turn it off in Settings)',
                ],
            },
            {
                title: 'Tactics board mid-match',
                lines: [
                    'Change formation and swap Pokémon between spots during the match, in the Cup and in Duels',
                    'The change happens at the next restart, like a substitution; no limit',
                    'Anyone can go in goal (out of position costs rating)',
                ],
            },
            {
                title: 'Match as a broadcast',
                lines: [
                    'TV scoreboard in team colors, a pressure bar every 2 minutes and the commentary in a strip above the pitch',
                    'Coach panel in tabs (Tactics, Board, Team, Plays) and, on phones, speed and Skip in a bar fixed at the bottom',
                    'No limit on tactic and corner changes',
                    'Substitute shows the bench right away: start with who comes on or who comes off',
                ],
            },
            {
                title: 'Evolution',
                lines: [
                    'A card that evolves gets +2 to every stat per evolution: a Charmander that becomes Charizard is 89, a ready-made Charizard is 85',
                    'Rival evolution has its own animation and banner (RIVAL EVOLVED!), different from yours',
                    'In Duels both sides need the same evolution bar (the player who joined by link used to evolve faster)',
                ],
            },
            {
                title: 'Duel',
                lines: [
                    'One-tap rematch: both accept and go straight to the draft, no lobby',
                    'Head-to-head record against the same friend on the result screen',
                    'Reloading the page takes you back to the right minute, and the screen tells you when it is waiting for your rival',
                    'A rival who leaves on the result screen shows as gone (the rematch no longer waits forever)',
                    'Clubs with the same name show the trainer name instead',
                    'More protection against scores and teams being swapped by someone tampering in the browser',
                    'Its own icon for the captain shout and clearer texts',
                ],
            },
            {
                title: 'Match',
                lines: [
                    "Goalkeeper saves: a saved ball no longer goes behind the keeper, and a parry for a corner goes out on the hand's side",
                    'Rewards: giving an item to someone already holding one asks who gets the old one (it used to vanish)',
                    'Trainer title as a badge on the VERSUS, in the lobby and on the duel scoreboard',
                    'The clock shows Half-time during the break',
                    'First-time players start at 1x; the speed you pick is saved',
                    'A match in progress during the update restarts at 0-0 (your cup and team stay)',
                ],
            },
            {
                title: 'Lighter and clearer',
                lines: [
                    'The game opens much faster on phones: the first load went from 2.5 MB to 0.4 MB',
                    'Team average on the VERSUS matches the lineup (by each rating in their spot)',
                    'Reward items and TMs have a Choose button, like Pokémon',
                    'Help no longer cut off on phones, unlock notices no longer cover the top, and bigger tap targets',
                    'Locked legendary trainers glow gold, so you want to chase them',
                ],
            },
        ],
    },
    {
        version: '0.8.5',
        date: '2026-10-18',
        title: 'Corners and live duels',
        sections: [
            {
                title: 'Live duel (BETA)',
                lines: [
                    'Challenge a friend with a link: both of you watch the same match at the same time',
                    'No account needed: whoever gets the link types a name and taps Play now (sign in with Google to keep your history in the cloud)',
                    '3 modes: Snake draft (4 cards per slot, one each and 2 burn), Own packs (your own packs, hidden picks) and Ready team (your cup team or a Hall of Fame champion, with a special card limit set by the host)',
                    'Invite with Share, WhatsApp, QR code and room code',
                    'Same path as the cup: lineup, VERSUS with both trainers, match and result',
                    'Room speed: one asks, the other accepts or declines',
                    'Subs and tactics the rival sees right away, emotes and rematch',
                    'Sealed lineups and picks: nobody sees the other move early',
                ],
            },
            {
                title: 'Corners',
                lines: [
                    'They come from saves pushed wide and blocked shots: 3 to 4 per match',
                    'Aerial duels by strength, size and positioning, with CORNER and IN THE AIR! banners',
                    'Coach instruction (In the box, Short, Mix it up), changeable like tactics, and the taker in the lineup',
                    'Moves on set pieces (they spend PP) and a rare olympic goal, only with a wind move',
                    'Aerial game badge on the player panel',
                ],
            },
            {
                title: 'Match',
                lines: [
                    'Live team board: formation with rating, stamina and bench; tap a player to sub',
                    'On desktop the board sits beside the pitch and the team table starts collapsed',
                    'Moves on shots show up more (from almost never to ~1.5 per match)',
                    'The same match in every browser (the engine does its own math)',
                    'A match left halfway when the update lands restarts at 0-0 (the cup and the team stay)',
                ],
            },
        ],
    },
    {
        version: '0.8.4',
        date: '2026-10-17',
        title: 'Full rebalance and your trainer',
        sections: [
            {
                title: 'Your trainer',
                lines: [
                    '38 Kanto trainers (Red, Leaf, Gym Leaders, Elite Four, Prof. Oak, Team Rocket...) unlocked through 42 missions',
                    'Titles under your name, also earned from missions',
                    'Your trainer shows up in the Profile, the VERSUS screen, the Hall of Fame and the share card',
                    'Locked trainers show their silhouette, name and how to unlock them',
                ],
            },
            {
                title: 'Game rules',
                lines: [
                    "The Fixo is now the cover: it stays between the attacker and the goal, and good positioning means more cuts and blocks. The Fixo's rating now matters on the court",
                    'Tactics rebalanced: all 4 win between 49% and 52%; offensive brings more goals again and defensive fewer',
                    '3-1 and the lock defend higher up the court; 1-1-2 drops back a little',
                    'A cup with a climax: a rookie rival in the round of 16, rivals get items sooner (1 in the quarterfinals, 3 in the final) and the Indigo League is the final boss',
                ],
            },
            {
                title: 'Draft and evolution',
                lines: [
                    'Every draft round has at least one silver card for the slot',
                    'Every round has an option that turns gold in that slot when it evolves',
                    'Cards show their rating after evolving, with a green (up) or red (down) arrow',
                    'Evolving is a bit easier (bar 15 ⇒ 14)',
                    'Evolutions keep the slot: a Pokémon that evolves while playing Ala can still play Ala',
                    'The evolution bar is labeled on the full card; in the lineup it is purple with a small arrow',
                ],
            },
            {
                title: 'Moves, abilities and items',
                lines: [
                    'Goalkeepers use moves: they save with their attacking move and use support moves. Body Slam, Submission, Petal Dance, Horn Drill and Soft-Boiled finally show up',
                    'Dream Eater: with the ball it is a shot; without it, it drains the stamina of the closest rival (double if they are asleep)',
                    'Soft-Boiled reaches 5 ⇒ 8 m; Bone Club tackles from range',
                    'Stronger abilities (+5% ⇒ +8%), and Cursed Body, Flash Fire, Drought, Sand Veil, Arena Trap, Sand Force, Soundproof, Aftermath, Dry Skin and Lightning Rod now do something. The name pops up on the court when it blocks a status',
                    "Quick Claw 10% ⇒ 15%, Scope Lens 15% ⇒ 20%, King's Rock 25% ⇒ 30%",
                ],
            },
            {
                title: 'Pokémon: buffs',
                lines: [
                    'Mr. Mime: plays in goal (75) and Ala 78 ⇒ 80',
                    'Mew: plays every position (Goalkeeper 79, Fixo 84, Pivô 81)',
                    'Onix: Fixo 63 ⇒ 70 · Hitmonlee: Pivô 70 ⇒ 75 · Beedrill: now a Pivô 65 (was Ala 63)',
                    'Rhydon gains Fixo (74) and Pivô (72), Golem gains Pivô (75), Poliwrath gains Ala (70); Venonat, Metapod and Kakuna gain Ala',
                    'Chansey 73 ⇒ 76, Sandslash 73 ⇒ 75, Wigglytuff 66 ⇒ 71, Vaporeon 76 ⇒ 79, Seaking 70 ⇒ 72, Gyarados 81 ⇒ 83, Lapras 81 ⇒ 83, Exeggutor 80 ⇒ 82, Electrode 83 ⇒ 84',
                    'Same rating, better on the court: Pinsir and Flareon (speed), Electrode, Jynx and Pikachu (shooting)',
                ],
            },
            {
                title: 'Pokémon: nerfs and tweaks',
                lines: [
                    'Tauros: Pivô 76 ⇒ 75, Fixo 76 ⇒ 73 · Aerodactyl: Pivô 77 ⇒ 76 · Snorlax: Goalkeeper 93 ⇒ 91 (gains strength)',
                    'Rapidash becomes an Ala 83 (was Pivô 81) · Nidorina becomes a Fixo 58 · Nidorino becomes a Pivô 58',
                    'Serpents (Ekans, Dratini, Dragonair) measure their size by weight, not length',
                ],
            },
            {
                title: 'Visuals and fixes',
                lines: [
                    'Card packs are card-sized: in the draft the pack is bigger and you can watch it open',
                    'Items and TMs in rewards look like cards',
                    'Halftime substitutions happen in the locker room (no longer at the first stoppage of the 2nd half)',
                    'Draft on a phone in landscape: the banner fits in one line and cards line up',
                    'A match that was in progress during the update restarts at 0-0 (your cup and team stay)',
                ],
            },
        ],
    },
    {
        version: '0.8.3',
        date: '2026-10-16',
        title: 'Weighty matches, card packs and a crowd',
        sections: [
            {
                title: 'Matches',
                lines: [
                    'A real crowd: a murmur that grows as the ball nears the goal, a roar on goals, an "oooh" on posts and saves and applause at the end; the whistle is a real referee’s',
                    'Ball and Pokémon with weight: smooth movement, a pop and dust on kicks, bounces, and reworked dribbling (better dribblers keep it closer to the foot)',
                    'Goals, posts and saves all get the same slow motion, even at 8x: no more guessing the goal',
                    'The ball leaves a trail in the move’s type, and bursts in that type when the move becomes a goal',
                    'Plays you can read: "TACKLE!", "CUT OUT!", caught or parried saves and goal kick calls',
                    'Keepers hold the ball in their hands, and the ball no longer shows up behind them on a save',
                    'Smarter marking: defenders close in fast, brake near the ball carrier and shadow them',
                    'A real halftime: the match stops with the score, stamina and a tip; tactics and subs one tap away',
                    'Subs show position, rating in that slot and stamina',
                    'Highlights: only the big moments at normal speed, the rest flies by',
                    'Shinies are shiny on the court (149 of 151)',
                    'The score pops in the team color on goals, a full-time banner and a decisive penalty that hits hard',
                ],
            },
            {
                title: 'Cards and evolution',
                lines: [
                    'Card pack with the logo: in rewards and the draft, cards come out one by one with a rising tone; gold and Shiny hold longer, special editions get their own walkout',
                    'The pack hints at what’s inside: gold edge for a gold card, holo shine for a special edition',
                    'The evolution bar no longer resets between matches: whoever plays well all cup evolves',
                    'Cards show the rating in the position the Pokémon plays',
                    'Numbers count up in the draft and on the result screen',
                ],
            },
            {
                title: 'Visuals',
                lines: [
                    'New fighting-game VERSUS screen, with the VS in the middle',
                    'Bigger arrow over your team, with a size option in Settings',
                    'Names on the court no longer overlap',
                    'Windows, screens and buttons with transitions and tap feedback',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'A rival evolution is no longer celebrated as if it were yours',
                    'Draft team average uses the rating in each slot',
                    'Star Player cards only come with a win',
                    'Rivals no longer hold items that don’t exist in Gen 1',
                    'Screens that scrolled sideways on phones',
                ],
            },
            {
                title: 'Tweaks (Oct 17)',
                lines: [
                    'The crowd is on your side: cheers on your goals, boos on the rival’s and an "oooh" when you nearly score, with varied sounds; its own volume in Settings',
                    'New option: speed on scoring chances (1x, 2x, 4x or no change)',
                    'Type synergy keeps growing: 4 of the same type give +8% and 5 give +10%',
                    'Complete special synergies glow together in the formation: all 3 Legendary Birds give +10%, all 3 starters +8%, Mew + Mewtwo +8% (type + story add up to +15%)',
                    'Star Player levels: a Star Player who keeps starring levels up with a rating of 8+ (up to +4); otherwise the prize goes to the next best player',
                    'A secondary position rating no longer beats the main one',
                    'Markers no longer waste moves lunging from too far away',
                    'Fixed the sound of cards coming out of the pack',
                ],
            },
        ],
    },
    {
        version: '0.8.2',
        date: '2026-10-16',
        title: 'Hall of Fame and a title screen worth the trophy',
        sections: [
            {
                title: 'Champion screen',
                lines: [
                    'Hall of Fame: when you win, your squad parades one by one with their cries, like in Red/Blue, and the cup is saved forever in the Hall of Fame tab of your Profile',
                    'Cup awards: Golden Ball, Golden Boot, Golden Glove, Playmaker, The Wall, Engine and Move Master',
                    'Team of the Cup on the court, in the formation you used',
                    'Title records: title number, perfect cup number, each Pokémon’s best rating, each species’ first title and how long it took',
                    'Goals of the run minute by minute, where the goals came from, most used moves, the final side by side and each Pokémon’s rating per match',
                    'Share now sends a title image ready for Stories, and you can download it in 9:16 or 1:1',
                ],
            },
            {
                title: 'Landscape phones',
                lines: [
                    'New cup, draft, match, penalties, substitutions, Movedex and the champion screen fit the screen',
                    'Matches open with the scoreboard and the whole court in view (they used to open scrolled down)',
                    'Small buttons got bigger for your thumb',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'Mimic works like in Gen 1: the copied move stays in its slot for the rest of the match',
                    'The Movedex no longer overflows the screen width on phones',
                ],
            },
        ],
    },
    {
        version: '0.8.1',
        date: '2026-10-15',
        title: 'Launch fixes',
        sections: [
            {
                title: 'Fixed',
                lines: ['The type marks on card backgrounds show up again (the image failed to load on the site)'],
            },
        ],
    },
    {
        version: '0.8.0',
        date: '2026-10-15',
        title: 'Profile, Pokédex and new moves',
        sections: [
            {
                title: 'New moves',
                lines: [
                    'Moves now do what they did in the games: Earthquake and Surf hit everyone around (teammates too), Slash and Karate Chop land critical hits, Solar Beam and Sky Attack charge up, Fly and Dig vanish from the court, Swift never misses, Night Shade and Dragon Rage deal fixed damage, Toxic gets worse over time, Double Team makes clones and much more',
                    "Gym TMs: after a win, a reward can be the leader's TM (Brock gives Bide, Misty gives Bubble Beam...) or a rare move; you pick who learns it and what it forgets, and the signature move is protected",
                    "Taught moves stay after evolving, and rival gyms bring their leader's TM too",
                    'Movedex with all 164 moves in the game',
                ],
            },
            {
                title: 'English',
                lines: [
                    'The whole game in English, with the official names from the games: switch with PT | EN on the home screen or in Settings',
                ],
            },
            {
                title: 'Added',
                lines: [
                    'Profile: your trainer name, avatar (a Pokémon that has played for your team, or your Google photo), a fixed club name, 3-letter tag and club color',
                    'Club color on the scoreboard, the VERSUS screen, the result and the charts; if the rival has a similar color, they wear their away kit',
                    'Pokédex of all 151: seen (showed up in the draft, the rewards or a rival team) and played (took the court for your team), with each species’ career: matches, goals, assists, titles and the best card',
                    'Career numbers: wins, goals, top scorers and most picked',
                    'Movedex: moves are revealed when someone uses them on the court in one of your matches; browse by move or by Pokémon, with each animation',
                    'How to play: a walkthrough on your first visit (and on the question mark button on the start screen), a Help section with every mechanic and short tips in the draft, the lineup and the rewards',
                    'Give feedback button on the start screen and at the end of the cup',
                ],
            },
            {
                title: 'Settings',
                lines: [
                    'Separate volume for cries and effects',
                    'Starting match speed and names on the court (all, my team only or none)',
                    'Reduce motion: less shake, flash and zoom',
                    'Confirmation before leaving a match in progress',
                    'Download and restore a save backup, and erase the data on this device',
                    'Anonymous statistics (no account, no cookie), with an option to turn them off',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'Signing in after playing as a guest no longer loses your cloud records',
                    'Balanced tactic description: it gives +3% passing and positioning',
                ],
            },
        ],
    },
    {
        version: '0.7.3',
        date: '2026-10-14',
        title: 'Open beta',
        sections: [
            {
                title: 'Launch',
                lines: [
                    'Soccermon is now an open beta: the game is complete and keeps getting tweaks',
                    'Open source on GitHub (link in the footer): read the code, report bugs and suggest ideas',
                ],
            },
            {
                title: 'Added',
                lines: [
                    'Team panel during the match: stamina, status, goals, assists and live rating of each player, plus the bench (yours and the rival’s); tapping a player opens their panel',
                    'Lineup with the card look: bronze, silver, gold, legendary and special editions',
                    'Start screen with new scenes on the court: one-twos, goals and keepy-uppies, with random Pokémon',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'Ditto in the match panel shows the form it copied (species, level, moves and Ability), not the original Ditto anymore',
                    'Result screen: your team’s Pokémon are no longer cut off at the edges on phones',
                    'If a screen crashes, a notice with a way out shows up instead of a blank page (your cup stays saved)',
                    'Start screen ball redrawn: now it is a real futsal ball',
                ],
            },
            {
                title: 'Mobile',
                lines: ['Proper icon when adding the game to the home screen', 'Patch notes with separate versions'],
            },
        ],
    },
    {
        version: '0.7.2',
        date: '2026-10-14',
        title: 'Substitutions that count and privacy',
        sections: [
            {
                title: 'Changed',
                lines: [
                    'Whoever comes on as a sub now counts for type synergy, story duos and the captain',
                    'Whoever goes off takes the bonus with them; a substituted captain takes the aura',
                    'Evolving changes the type in the team synergy count',
                ],
            },
            {
                title: 'Added',
                lines: [
                    'Delete my account, in Settings: removes the login, profile and cloud save',
                    'Privacy and terms page',
                ],
            },
        ],
    },
    {
        version: '0.7.1',
        date: '2026-10-14',
        title: 'Full review',
        sections: [
            {
                title: 'Fixed',
                lines: [
                    'Cloud save: opening the game on another device no longer erases the saved cup',
                    'Another Google account on the same device no longer inherits the cup or the records',
                    'Evolving mid-match no longer cures status or restores moves already used',
                    'Old saves no longer make automatic substitutions on your team',
                    'Going back during a penalty shootout no longer skips all the kicks at once',
                    'Tapping the card inside the full card made the Pick and Sign buttons disappear',
                    'Texts: "Knocked out in the semi-final", "1 goal", "1 cup", runner-up when losing the final',
                    'Nidoran♀ and Nidoran♂ with the right name',
                ],
            },
            {
                title: 'Mobile',
                lines: [
                    'Cup statistics and the top of the result fit 320px screens',
                    'The court fits the screen with the phone in landscape',
                    'The captain badge no longer covers "Goalkeeper" in the lineup',
                    'Charts without emoji: drawn dots mark the goals',
                    'Esc and keyboard work in the evolution and in the patch notes',
                ],
            },
        ],
    },
    {
        version: '0.7',
        date: '2026-10-14',
        title: 'Accounts, evolution and real moves',
        sections: [
            {
                title: 'Added',
                lines: [
                    'Sign in with Google: cup and records saved to the cloud',
                    'Champion screen: the trophy, the road to the title and the whole squad with each player’s stats',
                    'Three new formations: Rotation (4-0), Twin Pivots (1-1-2) and Lockdown (3 DEF)',
                    'Mid-match evolution, full screen',
                    'Live substitutions: the change happens at the next restart',
                    'Tap a Pokémon on the court to see stamina, status, moves and the evolution bar',
                    'Full match and cup statistics: ratings, charts and a shot map',
                    'Banner with the Pokémon’s face on goals, saves, substitutions and evolutions',
                    'A unique animation for each of the 164 moves',
                    'A signature move for all 151 Pokémon',
                    'Bonus and penalty arrows on the cards',
                    'Lofted ball on long passes and a trail on the ball',
                    '8x speed',
                    'New victory and VERSUS screens',
                    'Moves page (Moves button)',
                    'In the draft, players out of their usual role show their main position and whether they also fit the slot',
                ],
            },
            {
                title: 'Changed',
                lines: [
                    'Every move now does something on the court: Counter, Haze, Teleport, Leech Seed, Metronome, Transform and more',
                    'Multi-hit moves are stronger; very strong moves now have a price (recoil, recharge, self-destruct)',
                    'Upsets are more frequent, and Grit for whoever is losing by 3 or more',
                    'The defender pushes forward and tries long-range shots',
                    'The goalkeeper dives for the ball and only saves shots that were going in',
                    'Icon cards are rarer',
                    'Leaving and coming back resumes the match from the same point',
                    'Main menu, Settings and Credits with a new look',
                    'With more than one defender, only one pushes forward; the other covers',
                ],
            },
            {
                title: 'Fixed',
                lines: [
                    'Save counted with the ball already inside the goal',
                    'An extra penalty kick after the shootout was decided',
                    'Ball behind the line on goal kicks',
                    'Flying Pokémon floating above the ball',
                ],
            },
        ],
    },
];

/** Notas no idioma do jogo (versão sem tradução cai para o português). */
export function patchNotes(lang: 'pt' | 'en'): PatchNotes[] {
    if (lang === 'pt') return PATCH_NOTES;
    return PATCH_NOTES.map((n) => PATCH_NOTES_EN.find((e) => e.version === n.version) ?? n);
}
