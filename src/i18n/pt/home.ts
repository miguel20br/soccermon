/** Tela inicial. */
export const home = {
    draftStep: 'Draft · escolha {n} de 7',
    choosingReward: 'Escolhendo a recompensa',
    atMarket: 'No Mercado',
    eventWeek: 'Semana do tipo {type}',
    helpAria: 'Ajuda: como funciona cada modo e as regras',
    helpTitle: 'Como jogar',
    /** Selo da quadra animada do topo (enfeite de transmissão). */
    live: 'AO VIVO',
    tagline: 'Monte seu time com os 151 de Kanto e ganhe a Copa de Futsal.',
    confirmYes: 'Sim, começar outra',
    newTitle: 'Começar outra copa?',
    newText: 'A copa do {team} será apagada.',
    resume: 'Continuar',
    /** O verbo do botão gordo do Estádio. */
    play: 'Jogar',
    dailyNew: 'Copa do Dia',
    dailyNewSub: 'Nova hoje',
    playTag: 'Copa Relâmpago · 4 jogos',
    newCup: 'Nova copa',
    quickCup: {
        tag: '4 jogos',
        title: 'Copa Relâmpago',
    },
    longCup: {
        tag: '8 jogos',
        title: 'Rota Índigo',
        go: 'Começar a Rota',
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
    footerAria: 'Mais',
    version: 'Versão {v} · {title}',
    /** Notícias: o carrossel do topo das Novidades (ui/news.ts). */
    newsFeed: {
        aria: 'Notícias',
        slide: '{i} de {n}',
        new: 'Nova',
        notes: 'Notas da versão',
        tabs: 'Notícias ou notas da versão',
        prev: 'Notícia anterior',
        next: 'Próxima notícia',
        versions: 'Todas as versões',
    },
    latest: 'Mais recente',
    soonRibbon: 'Em breve',
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
        ledDaily: 'COPA DO DIA NOVA',
        ledChamp: 'CAMPEÕES DA {cup} · {club}',
        ledLiga: 'LIGA ABRE EM {d} DIAS',
        labTitle: 'Laboratório do Carvalho',
        /** No celular deitado e estreito o nome inteiro não cabe numa linha. */
        labShort: 'Laboratório',
        arenaTitle: 'Arena',
        sedeTitle: 'Sede do clube',
        soonArcade: 'Arcade',
        ligaSoon: 'Liga · abre em {d}d',
        /** O letreiro da Liga no muro da Arena, embaixo do nome. */
        ligaSign: 'abre em {d}d',
        /** Laboratório: a meta é a Pokédex; o Carvalho fala quanto falta. */
        labGo: 'Abrir a Pokédex',
        beltCount: '{n}/{goal} vitórias',
        labLeft: 'Faltam {n}',
        labFull: 'Pokédex completa',
        labTalk: 'Faltam {n} pra fechar a Pokédex. Draft e rival já contam.',
        labTalkDone: 'Os 151 de Kanto, todos vistos! Agora é encher o Álbum.',
        /** Arena: o Duelo na frente, o cinturão como meta, o resto chegando. */
        /** O Duelo no seletor de modos do Estádio. */
        signDuel: 'Com amigos',
        /** As setas da pílula de modo do Estádio. */
        modePrev: 'Modo anterior',
        modeNext: 'Próximo modo',
        modesAria: 'Modos de jogo',
        arenaGo: 'Desafiar',
        arenaLine: 'Duelo ao vivo com um amigo',
        neonWeek: 'da semana',
        /** Sede: o quadro de missões e a Sala de troféus. */
        sedeOf: 'Sede do {club}',
        sedeBoard: 'Quadro de missões',
        /** Missões e medalhas numa folha só, na Sede. */
        sedeMetas: 'Metas',
        /** Plaquinha na vitrine vazia da Sede (quem ainda não ganhou nada). */
        sedeFirst: 'Seu 1º troféu fica aqui',
        /** Plaquinha da vitrine (abre a Sala de troféus). */
        sedeTrophies: 'Troféus',
        sedeTitles: '{n} título|{n} títulos',
        sedeKit: 'Escudo e uniforme',
        /** A estrela do nível na barra de cima. */
        resLevel: 'Nível {n} do treinador ({x} de {y} missões pro próximo)',
    },
    /**
     * Menu de modos (antes da Home, pra quem já jogou): nomes fechados em 29/10/2026 (Copa, Treinador, História); o Treinador virou Time Ultimate em 30/10.
     * `when` é a placa do modo trancado; `topics`, os itens do cartão.
     */
    modes: {
        aria: 'Modos de jogo',
        /** Botão de voltar da Home pro menu de modos. */
        back: 'Modos de jogo',
        last: 'ÚLTIMO JOGADO',
        /** Selo do Time Ultimate com a bandeira ?lab=ultimate (só dev e prévias). */
        preview: 'PRÉVIA',
        play: 'JOGAR',
        atual: {
            name: 'Modo Clássico',
            tag: 'Escolha 1 de 3 e monte o time pra copa',
            /** A Liga (a última) só entra quando aparece no jogo (`modeTopics`, ModeMenu.tsx). */
            topics: ['Copa Relâmpago', 'Rota Índigo', 'Duelo', 'Liga'],
        },
        ultimate: {
            name: 'Time Ultimate',
            when: 'Chega fim de novembro',
            tag: 'Abra pacotes e monte o time da temporada',
            topics: ['Time da temporada', 'Abra pacotes', 'Zera a cada temporada'],
        },
        historia: {
            name: 'Modo História',
            when: 'Chega em 2027',
            tag: 'Os 8 ginásios, com o Blue de rival',
            topics: ['Os 8 ginásios', 'Insígnias de Kanto', 'Blue de rival'],
        },
        /** A provocação do Blue na cena do Modo História. */
        rival: 'Até mais, perdedor!',
        /** Contagem do cartão do Ultimate (até `ULTIMATE_AT`, ModeMenu.tsx). */
        countdown: 'Falta {n} dia|Faltam {n} dias',
        gym: 'GINÁSIO',
        /** Selo dos modos trancados (com a data, `soonDate` em ModeMenu.tsx) e o botão de baixo com um deles aberto. */
        soon: 'EM BREVE',
        arrives: 'Chega em {date}',
        backTo: 'Voltar pro {name}',
    },
};
