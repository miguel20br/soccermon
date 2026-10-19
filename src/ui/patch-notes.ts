/** Notas da atualização mostradas na Home ("Novidades"). A mais nova primeiro. */
export interface PatchNotes {
    version: string;
    title: string;
    sections: { title: string; lines: string[] }[];
}

export const PATCH_NOTES: PatchNotes[] = [
    {
        version: '0.8.8',
        title: 'Ícone MVP, melhores momentos, medalhas e treinadores',
        sections: [
            {
                title: 'Copa do Dia e Liga',
                lines: [
                    'Copa do Dia: a mesma copa pra todo mundo (mesmo draft, mesmos rivais), uma tentativa por dia e ranking do dia. Sem conta, você joga fora do ranking',
                    'Compartilhe a sua Copa do Dia com os quadradinhos de cada partida e acompanhe os dias jogados na semana',
                    'Liga ranqueada: o time da sua copa vira um fantasma que outros enfrentam; você joga contra os deles e sobe no Elo, com divisões (Bronze, Prata, Ouro e Lenda) e temporada mensal (precisa de conta Google)',
                    'Na Liga o placar que vale é o do servidor: ele refaz a partida com as suas ordens',
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
                    'Logo novo: a carta holo com a bola (também na aba do navegador, no ícone do celular e na prévia do link)',
                    'Ícones padronizados: fechar, setas, estrela, sortear e o resto desenhados no mesmo traço em todo o jogo',
                ],
            },
            {
                title: 'Medalhas e clube',
                lines: [
                    '20 medalhas com degraus (bronze, prata, ouro e platina) em Perfil → Medalhas. Já contam tudo o que você jogou',
                    'Vitrine: escolha até 3 destaques (medalha, coleção completa ou selo); aparecem no seu cartão e no VERSUS do Duelo, e o melhor vira a moldura do avatar',
                    'Fichário: todas as cartas raras que você tirou, num lugar só',
                    'Vitrine de cartas no Perfil e no Duelo',
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
                    'Faixas da torcida novas: "Aqui é {clube}", "ABAIXA QUE É HYPER BEAM", "Hoje Magikarp, amanhã Gyarados", "Sua insígnia é minha!" e outras',
                    'Prof. Carvalho agora pede ver os 151 Pokémon na Pokédex (era 100); quem já tinha ganhado continua com ele',
                    'O Prof. Carvalho dourado conta "jogou" igual à Pokédex (quem tinha 151 jogados e via 150/151 agora ganha)',
                    'Carta Ícone agora pode ser o craque da partida: continua Ícone (com o fundo de galáxia), ganha o selo "MVP", "MVP 2" e "MVP 3" e +1 em todos os atributos por selo (até +5). Antes o prêmio pulava pro próximo jogador',
                    'Quem foi campeão com Mew e Mewtwo, com os 3 pássaros lendários ou com um Rattata antes dessas missões existirem agora ganha a conquista ao abrir o jogo (sai do Hall da Fama)',
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
        version: '0.8.7',
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
        version: '0.8.8',
        title: 'Icon MVP, highlights, medals and coaches',
        sections: [
            {
                title: 'Daily Cup and League',
                lines: [
                    'Daily Cup: the same cup for everyone (same draft, same rivals), one try per day and a daily ranking. Without an account, you play outside the ranking',
                    'Share your Daily Cup with a square for each match and keep track of the days you played this week',
                    'Ranked League: your cup team becomes a ghost others play against; you face theirs and climb the Elo, with divisions (Bronze, Silver, Gold and Legend) and a monthly season (needs a Google account)',
                    'In the League the server score is the one that counts: it replays the match with your orders',
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
                    'New logo: the holo card with the ball (also on the browser tab, the phone icon and the link preview)',
                    'Standardized icons: close, arrows, star, reroll and the rest drawn with the same stroke across the game',
                ],
            },
            {
                title: 'Medals and club',
                lines: [
                    '20 tiered medals (bronze, silver, gold and platinum) in Profile → Medals. Everything you already played counts',
                    'Showcase: pick up to 3 highlights (medal, completed collection or seal); they show on your card and on the Duel VERSUS, and the best one becomes your avatar frame',
                    'Binder: every rare card you pulled, all in one place',
                    'Card showcase on your Profile and in the Duel',
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
                    'New fan banners: "This is {club}", "DUCK, IT\'S HYPER BEAM", "Magikarp today, Gyarados tomorrow", "Your badge is mine!" and more',
                    'Prof. Oak now asks you to see all 151 Pokémon in the Pokédex (was 100); anyone who already earned him keeps him',
                    'Golden Prof. Oak counts "played" the same way as the Pokédex (players at 151 played who saw 150/151 now get it)',
                    'Icon cards can now be the star player: they stay Icons (galaxy background), get the "MVP", "MVP 2" and "MVP 3" seal and +1 to every attribute per seal (up to +5). Before, the award skipped to the next player',
                    'Anyone who won the cup with Mew and Mewtwo, the 3 legendary birds or a Rattata before those missions existed now gets the achievement when opening the game (it comes from the Hall of Fame)',
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
        version: '0.8.7',
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
