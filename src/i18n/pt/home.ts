/** Tela inicial. */
export const home = {
    soon: [
        { title: 'Modo história', text: 'Ginásios, insígnias e a Liga Índigo' },
        { title: 'Ultimate Team', text: 'Abra pacotes e monte o time da temporada' },
        { title: 'Futebol de campo', text: 'Partidas 11 contra 11' },
        { title: 'Geração 2', text: 'Os Pokémon de Johto' },
    ],
    draftStep: 'Draft · escolha {n} de 7',
    /** Barra da Pokédex que enche ao voltar de uma copa. */
    dex: {
        label: 'Pokédex',
        new: '+{n} novo|+{n} novos',
    },
    choosingReward: 'Escolhendo a recompensa',
    atMarket: 'No Mercado',
    eventWeek: 'Semana do tipo {type}',
    eventText: 'Cartas Evento de {type} podem sair no draft.',
    helpAria: 'Como jogar (ver o passo a passo de novo)',
    helpTitle: 'Como jogar',
    /** Selo da quadra animada do topo (enfeite de transmissão). */
    live: 'AO VIVO',
    tagline: 'Monte seu time com os 151 de Kanto e ganhe a Copa de Futsal.',
    confirmNew: 'Começar outra copa apaga a do {team}. Tem certeza?',
    confirmYes: 'Sim, começar outra',
    inProgress: 'Copa em andamento',
    cupPath: 'Fases da copa',
    resume: 'Continuar',
    teamName: 'Nome do seu time',
    /** 1ª visita: a Home só com este botão. */
    play: 'Jogar',
    playTag: 'Copa Relâmpago · 4 jogos',
    moreModes: 'Mais modos',
    newCup: 'Nova copa',
    quickCup: {
        tag: '4 jogos',
        title: 'Copa Relâmpago',
        line: 'Mata-mata das oitavas à final.',
    },
    longCup: {
        tag: '8 jogos',
        title: 'Rota Índigo',
        line: 'Atravesse Kanto até o Planalto Índigo.',
        go: 'Começar a Rota',
        note: 'A Rota Índigo chega na próxima versão.',
    },
    challenge: 'Aceitar desafio ({seed})',
    tiles: {
        help: 'Ajuda',
        news: 'Novidades',
        settings: 'Configurações',
        credits: 'Créditos',
        feedback: 'Dar feedback',
        cards: 'Cartas (teste)',
    },
    news: 'Novidades',
    doors: {
        profile: ['Perfil', 'Treinador, clube e amigos'],
        collection: ['Coleção', 'Pokédex, Álbum e Golpedex'],
        trophies: ['Sala de troféus', 'Taças, medalhas e números'],
    },
    doorsAria: 'Seu jogo',
    footerAria: 'Mais',
    version: 'Versão {v} · {title}',
    latest: 'Mais recente',
    soonTitle: 'Vem aí',
    soonRibbon: 'Em breve',
    /** Contagem da Liga no cartãozinho do Vem aí. */
    soonDays: '{d}d',
    disclaimer:
        'Soccermon v{v} · Criado por Miguel Cunha · Fan game sem fins lucrativos. Pokémon e todos os nomes, sprites e sons relacionados são © Nintendo, Game Freak, Creatures Inc. e The Pokémon Company. Este projeto não é afiliado nem endossado por eles.',
    privacy: 'Privacidade e termos',
    github: 'Código no GitHub',
    langAria: 'Idioma / Language',
    /** Navegação por ambientes (?lab=ambientes, docs/planos/clash-2x2-menus-arcade.md). */
    amb: {
        tabsAria: 'Lugares',
        tabs: { lab: 'Lab', rota: 'Rota', estadio: 'Estádio', arena: 'Arena', sede: 'Sede' },
        skip: 'Toque pra pular',
        /** Letreiro de LED do Estádio, rolando sem parar (o fim emenda no começo). */
        board: 'COPA RELÂMPAGO · COPA DO DIA · ROTA ÍNDIGO · DUELO AO VIVO · ',
        rotaGo: 'Continuar · {where}',
        labTitle: 'Laboratório do Carvalho',
        /** No celular deitado e estreito o nome inteiro não cabe numa linha. */
        labShort: 'Laboratório',
        arenaTitle: 'Arena',
        sedeTitle: 'Sede do clube',
        soon2x2: 'Dupla 2x2',
        soonArcade: 'Arcade',
        ligaSoon: 'Liga · abre em {d}d',
        /** Laboratório: a meta é a Pokédex; o Carvalho fala quanto falta. */
        labGo: 'Abrir a Pokédex',
        labSeen: '{n} de {total} vistos',
        labTalk: 'Faltam {n} pra completar a Pokédex de Kanto. Quem aparece no draft ou no time rival já conta.',
        labTalkDone: 'Os 151 de Kanto, todos vistos! Agora é encher o Álbum.',
        /** Arena: o Duelo na frente, o cinturão como meta, o resto chegando. */
        /** O Duelo no seletor de modos do Estádio. */
        signDuel: 'Com amigos',
        /** As setas da pílula de modo do Estádio. */
        modePrev: 'Modo anterior',
        modeNext: 'Próximo modo',
        /** As metas à vista no Estádio (os "baús" do Clash). */
        slotsAria: 'Suas metas',
        slotDailyShort: 'Diária',
        slotMission: 'Missão',
        slotBadges: 'Insígnias',
        slotBelt: 'Cinturão',
        /** A barra de cima: títulos ganhos e a Pokédex. */
        resLevel: 'Nível {n} do treinador ({x} de {y} missões pro próximo)',
        resTitles: 'Títulos: {n}',
        resDex: 'Pokédex: {n} de 151 vistos',
        arenaGo: 'Desafiar',
        arenaLine: 'Duelo ao vivo com um amigo',
        neonWeek: 'da semana',
        ligaOpens: 'Abre em {d}d',
        /** Sede: o quadro de missões e a Sala de troféus. */
        sedeOf: 'Sede do {club}',
        sedeBoard: 'Quadro de missões',
        /** Plaquinha na vitrine vazia da Sede (quem ainda não ganhou nada). */
        sedeFirst: 'Seu 1º troféu fica aqui',
        sedeTitles: '{n} título|{n} títulos',
        sedeKit: 'Escudo e uniforme',
    },
};
