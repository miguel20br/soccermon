/** Notas da atualização mostradas na Home ("Novidades"). A mais nova primeiro. */
export interface PatchNotes {
    version: string;
    title: string;
    sections: { title: string; lines: string[] }[];
}

export const PATCH_NOTES: PatchNotes[] = [
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
