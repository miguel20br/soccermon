/**
 * Falas do duelo da bicuda (motor 21: o goleiro capitão para o N3 do rival no pé, o tempo congela e, no fim, ele devolve
 * de bicuda). `s` = quem chutou, `g` = o goleiro; a última fala é sempre a do goleiro na bicuda. A escolha
 * (src/ui/showdown-lines.ts) vai nessa ordem: par notável (`pairs`, chave "quem chutou-goleiro" pelo número da
 * Pokédex), mesma linha evolutiva (`up`: o goleiro é a pré-evolução; `down`: o goleiro é o evoluído), a conversa de um
 * Pokémon no gol (`solo[id].keeper`), a de quem chutou (`solo[id].shooter`) e as genéricas. `{s}` e `{g}` viram os
 * nomes. Até 10 palavras por fala. Tom (Miguel, 03/11/2026): piadinha besta pode, drama de novela não; o goleiro parou a
 * bola com o pé (nada de "segurou" ou "pegou").
 */
export type ShowdownWho = 's' | 'g';
export type ShowdownScript = readonly (readonly [ShowdownWho, string])[];
export interface ShowdownSolo {
    /** Ele no gol (quem chutou é um qualquer): a conversa inteira. */
    keeper?: readonly ShowdownScript[];
    /** Ele chutou (o goleiro é um qualquer). */
    shooter?: readonly ShowdownScript[];
}

export const showdown = {
    tag: 'Duelo da bicuda',
    /** A 2ª faixa do gol do duelo (o nome do goleiro vai antes do `goalSub`). */
    goal: 'BICUDA!',
    goalSub: 'de gol a gol',
    /**
     * O letreiro do duelo no contato e na bicuda (o nome do golpe Counter, que devolve o golpe; "contra-ataque" é a
     * tática) e a etiqueta dele no contato.
     */
    counter: 'COUNTER!',
    back: 'Devolve o N3',
    pairs: {
        // Charizard × Charmander
        '6-4': [
            ['s', 'Charmander? Sério que foi você?'],
            ['g', 'Fui. Pode tirar foto.'],
            ['s', 'Isso não sai daqui, hein.'],
            ['g', 'Já saiu. Bicuda!'],
        ],
        '4-6': [
            ['s', 'Você parou isso de costas?'],
            ['g', 'Faço tudo de costas. Pergunta pro Ash.'],
            ['s', 'Ele vive reclamando de você.'],
            ['g', 'Bicuda!'],
        ],
        // Blastoise × Squirtle
        '9-7': [
            ['s', 'Dois canhões e um Squirtle me parou?'],
            ['g', 'Foi o óculos escuro. Ajuda muito.'],
            ['s', 'Isso nem é do uniforme.'],
            ['g', 'Esquadrão Squirtle!'],
        ],
        '7-9': [
            ['s', 'Ei, você nem pulou!'],
            ['g', 'Com esse casco? Nem tento.'],
            ['g', 'Canhão de pé!'],
        ],
        // Venusaur × Bulbasaur
        '3-1': [
            ['s', 'Um Bulbasaur? Cadê o resto do jardim?'],
            ['g', 'Tô crescendo ainda. Paciência.'],
            ['s', 'Meu chute tinha Solar Beam!'],
            ['g', 'O meu também. Bicuda!'],
        ],
        '1-3': [
            ['s', 'Você parou com a flor?'],
            ['g', 'A flor é só enfeite.'],
            ['s', 'Que enfeite pesado.'],
            ['g', 'Bicuda!'],
        ],
        // Mewtwo × Mew
        '150-151': [
            ['s', 'Sou um clone melhorado. Explica isso.'],
            ['g', 'Mew!'],
            ['s', 'Isso não explica nada.'],
            ['g', 'Meeew!'],
        ],
        '151-150': [
            ['s', 'Mew? Mew mew?'],
            ['g', 'Li sua mente. Era só "mew".'],
            ['s', 'Mew!'],
            ['g', 'Bicuda!'],
        ],
        // Raichu × Pikachu
        '26-25': [
            ['s', 'Pikachu? Cadê a Thunder Stone?'],
            ['g', 'Pika. Tô bem assim.'],
            ['s', 'Lembra do ginásio do Lt. Surge?'],
            ['g', 'Lembro. Ganhei. Pika... CHU!'],
        ],
        '25-26': [
            ['s', 'Pika? Parou meu Thunderbolt?'],
            ['g', 'Choque em Raichu? Faz cosquinha.'],
            ['g', 'Rai... CHU!'],
        ],
        // Gyarados × Magikarp
        '130-129': [
            ['g', 'Splash.'],
            ['s', 'Splash não faz nada! Eu sei, eu usava.'],
            ['g', 'SPLASH!'],
        ],
        '129-130': [
            ['s', 'Gyarados? Me ajuda, primo!'],
            ['g', 'Primo? A gente nem se fala mais.'],
            ['s', 'Desde que você evoluiu!'],
            ['g', 'Bicuda!'],
        ],
        // Hitmonchan × Hitmonlee
        '107-106': [
            ['s', 'Parou com o pé? Que falta de classe.'],
            ['g', 'É futebol, irmão. Pé.'],
            ['s', 'Eu sou de soco. Por que eu chutei?'],
            ['g', 'High Jump Kick!'],
        ],
        '106-107': [
            ['s', 'Hitmonchan usando o pé? Tá doente?'],
            ['g', 'Hoje deu vontade.'],
            ['s', 'Isso é traição de família.'],
            ['g', 'Mega Kick!'],
        ],
        // Nidoking × Nidoqueen
        '34-31': [
            ['s', 'Amor? Você parou meu chute?'],
            ['g', 'Parei. Em casa a gente conversa.'],
            ['s', 'Vou dormir no sofá, né?'],
            ['g', 'Vai. Bicuda!'],
        ],
        '31-34': [
            ['s', 'Na frente de todo mundo, amor?'],
            ['g', 'Desculpa. É trabalho.'],
            ['g', 'Bicuda!'],
        ],
        // Gengar × Alakazam
        '94-65': [
            ['s', 'Como você viu minha bola fantasma?'],
            ['g', 'Vi ontem. Sou psíquico.'],
            ['s', 'Hehehe... isso é trapaça.'],
            ['g', 'Previsto. Bicuda!'],
        ],
        '65-94': [
            ['s', 'Calculei tudo. Você não tava na conta.'],
            ['g', 'Hehehe. Eu tava atrás de você.'],
            ['s', 'Desde quando?'],
            ['g', 'Bu!'],
        ],
        // Machamp × Machop
        '68-66': [
            ['s', 'Quatro braços e um Machop me parou?'],
            ['g', 'Com o pé. Os braços tavam ocupados.'],
            ['s', 'Ocupados com o quê?'],
            ['g', 'Dia de perna!'],
        ],
        '66-68': [
            ['s', 'Treinei esse chute mil vezes!'],
            ['g', 'Que fofo. Eu treino quatro mil.'],
            ['g', 'Toma, baixinho!'],
        ],
        // Charizard × Blastoise (os iniciais do Red e do Blue)
        '6-9': [
            ['s', 'Você de novo, Blastoise?'],
            ['g', 'O rival sempre escolhe o tipo certo.'],
            ['s', 'Isso é muito injusto.'],
            ['g', 'Tá na tabela. Bicuda!'],
        ],
        '9-6': [
            ['s', 'Fogo parou água? Tá errado isso.'],
            ['g', 'Eu nunca li a tabela de tipos.'],
            ['g', 'Voa, bola!'],
        ],
        // Golduck × Psyduck
        '55-54': [
            ['s', 'Psyduck? Você parou isso?'],
            ['g', 'Ai, minha cabeça... parei o quê?'],
            ['s', 'Eu tinha essa dor de cabeça também.'],
            ['g', 'Psy... DUCK!'],
        ],
        '54-55': [
            ['s', 'Ai... minha cabeça. Entrou?'],
            ['g', 'Não. E a dor, passou?'],
            ['s', 'Piorou.'],
            ['g', 'Desculpa. Bicuda!'],
        ],
        // Slowbro × Slowpoke
        '80-79': [
            ['s', 'Slowpoke... você... parou?'],
            ['g', '.........'],
            ['s', 'Ele ainda nem sabe que parou.'],
            ['g', '...bicuda.'],
        ],
        '79-80': [
            ['s', '...'],
            ['g', 'Ele ainda tá chutando, gente.'],
            ['s', '...chutei?'],
            ['g', 'Chutou. Ontem. Bicuda!'],
        ],
        // Pikachu × Meowth (a Equipe Rocket)
        '25-52': [
            ['s', 'Pika! A Equipe Rocket no gol?'],
            ['g', 'A bola é nossa. O Pikachu é o próximo.'],
            ['s', 'Pika pika...'],
            ['g', 'Meowth, é isso aí!'],
        ],
        '52-25': [
            ['s', 'Miau! Era o plano perfeito!'],
            ['g', 'Pika pika.'],
            ['s', 'A Equipe Rocket decolando de novo...'],
            ['g', 'Pika... CHU!'],
        ],
        // Jigglypuff × Snorlax
        '39-143': [
            ['s', 'Eu cantei e você parou?'],
            ['g', 'Zzz...'],
            ['s', 'Ele dormiu antes da música!'],
            ['g', 'Zzz... BICUDA... zzz'],
        ],
        '143-39': [
            ['s', 'Zzz... hã? Não entrou?'],
            ['g', 'Dormiu no jogo? Vai levar rabisco.'],
            ['g', 'Puf!'],
        ],
        // Onix × Pikachu (o ginásio de Pewter)
        '95-25': [
            ['s', 'Choque não faz nada em pedra.'],
            ['g', 'Pika. Por isso é bicuda.'],
            ['g', 'Pika... CHU!'],
        ],
    } as Record<string, ShowdownScript>,
    /** O goleiro é a pré-evolução de quem chutou. */
    up: [
        [
            ['s', 'Logo você, {g}?'],
            ['g', 'Logo eu. Surpresa!'],
            ['g', 'Bicuda!'],
        ],
        [
            ['s', 'Perdi pro meu eu de criança?'],
            ['g', 'Seu eu de criança treinava mais.'],
            ['s', 'Isso foi pessoal.'],
            ['g', 'Bicuda!'],
        ],
        [
            ['s', 'Evoluí pra isso?'],
            ['g', 'Pelo visto, à toa.'],
            ['g', 'Toma!'],
        ],
    ] as readonly ShowdownScript[],
    /** O goleiro é a evolução de quem chutou. */
    down: [
        [
            ['s', 'Eu ia te passar um dia.'],
            ['g', 'Senta aí que eu te ensino.'],
            ['g', 'Lá vai!'],
        ],
        [
            ['s', '{g}, pega leve!'],
            ['g', 'Leve? Eu evoluí pra quê?'],
            ['g', 'Bicuda!'],
        ],
        [
            ['s', 'Achei que dava, {g}.'],
            ['g', 'Quase. Faltou evoluir.'],
            ['s', 'E agora?'],
            ['g', 'Agora corre.'],
        ],
    ] as readonly ShowdownScript[],
    solo: {
        143: {
            keeper: [
                [
                    ['s', 'Ele tá dormindo?'],
                    ['g', 'Zzz...'],
                    ['g', 'Zzz... BICUDA... zzz'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Zzz... hã? Não entrou?'],
                    ['g', 'Você chutou dormindo, cara.'],
                    ['g', 'Acorda!'],
                ],
            ],
        },
        129: {
            keeper: [
                [
                    ['g', 'Splash.'],
                    ['s', '...Ele usou Splash e funcionou?'],
                    ['g', 'SPLASH!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Foi meu melhor Splash!'],
                    ['g', 'Foi seu único golpe.'],
                    ['s', 'Isso é verdade.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        79: {
            keeper: [
                [
                    ['s', 'Ele parou mesmo?'],
                    ['g', '.........'],
                    ['s', 'Ainda tá carregando.'],
                    ['g', '...bicuda.'],
                ],
            ],
            shooter: [
                [
                    ['s', '...'],
                    ['s', '...peraí, eu chutei?'],
                    ['g', 'Faz três segundos. Bicuda!'],
                ],
            ],
        },
        25: {
            keeper: [
                [
                    ['s', 'Parou meu chute? Um rato?'],
                    ['g', 'Pika.'],
                    ['s', 'Rato elétrico, desculpa.'],
                    ['g', 'Pika... CHU!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Pika?'],
                    ['g', 'Seu Thunderbolt? Senti um choquinho.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        150: {
            keeper: [
                [
                    ['s', 'Ele parou com a mente?'],
                    ['g', 'Com o pé. A mente tá de folga.'],
                    ['g', 'Bicuda!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Impossível. Calculei tudo.'],
                    ['g', 'Esqueceu de me calcular.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        151: {
            keeper: [
                [
                    ['s', 'Era só um Mew...'],
                    ['g', 'Mew!'],
                    ['g', 'Meeew!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Mew?'],
                    ['g', 'Chega de rir, Mew.'],
                    ['s', 'Mew mew!'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        132: {
            keeper: [
                [
                    ['s', 'Ei, esse chute é meu!'],
                    ['g', 'Copiei. Ficou até melhor.'],
                    ['g', 'Bicuda!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Copiei o chute de um craque!'],
                    ['g', 'Copiou errado, então.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        54: {
            keeper: [
                [
                    ['s', 'Ele parou sem nem olhar?'],
                    ['g', 'Ai, minha cabeça...'],
                    ['g', 'Psy... DUCK!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Ai... minha cabeça. Entrou?'],
                    ['g', 'Nem perto. Melhora aí.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        94: {
            keeper: [
                [
                    ['s', 'Como você chegou aí?'],
                    ['g', 'Hehehe. Eu sempre tô aí.'],
                    ['g', 'Bu!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Hehehe... era pra atravessar você.'],
                    ['g', 'Eu sou de carne e osso.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        39: {
            keeper: [
                [
                    ['s', 'Por que ela tá com uma caneta?'],
                    ['g', 'Quem dormir leva rabisco.'],
                    ['g', 'Puf!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Você não dormiu com a música?'],
                    ['g', 'Eu tava de fone.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        52: {
            keeper: [
                [
                    ['s', 'A Equipe Rocket no gol?'],
                    ['g', 'Essa bola agora é da Equipe Rocket!'],
                    ['g', 'Meowth, é isso aí!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Miau! Era o plano perfeito!'],
                    ['g', 'Nunca é, Meowth.'],
                    ['s', 'A Equipe Rocket decolando de novo...'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        83: {
            keeper: [
                [
                    ['s', 'Ele parou com um alho-poró?'],
                    ['g', 'Alho-poró de competição.'],
                    ['g', 'Bicuda!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Nem com o alho-poró?'],
                    ['g', 'Era pra usar o pé.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
        63: {
            keeper: [
                [
                    ['s', 'Ele tá dormindo no gol?'],
                    ['g', 'Zzz...'],
                    ['g', 'Teleport!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Zzz...'],
                    ['g', 'Chutou e foi dormir?'],
                    ['g', 'Acorda, Abra!'],
                ],
            ],
        },
        133: {
            keeper: [
                [
                    ['s', 'Um Eevee? Cadê a evolução?'],
                    ['g', 'Ainda tô escolhendo a pedra.'],
                    ['g', 'Eevee!'],
                ],
            ],
            shooter: [
                [
                    ['s', 'Vee! Achei que era gol!'],
                    ['g', 'Evolui primeiro, depois a gente conversa.'],
                    ['g', 'Bicuda!'],
                ],
            ],
        },
    } as Record<string, ShowdownSolo>,
    /** Genéricas: quem chutou reage, o goleiro responde, às vezes quem chutou de novo (`more`) e a bicuda (`shout`). */
    shot: [
        'Esse era o meu melhor chute.',
        'Parou com o pé?',
        'Ei, isso era gol!',
        'Como assim, parou?',
        'Meu golpe máximo... no pé dele?',
        'Tava no ângulo!',
        'Alguém viu isso?',
        'Treinei isso a semana inteira!',
    ],
    gk: [
        'Dava pra ver.',
        'Treinei a semana inteira também.',
        'Agora é minha vez.',
        'Bonito. Agora olha o meu.',
        'Goleiro também chuta, sabia?',
        'Corre pra trás que lá vai.',
        'Foi bom. Pena que voltou.',
        'Obrigado pelo passe.',
    ],
    more: [
        'Daí do gol? Não alcança.',
        'Pessoal, volta! Volta!',
        'Ninguém chuta de gol a gol.',
        'Peraí, você vai chutar daí?',
    ],
    shout: [
        'Toma de volta!',
        'Bicuda!',
        'Devolvendo!',
        'Volta pra casa!',
        'Lá vai!',
        'Segura essa!',
        'De primeira!',
        'Recebe!',
    ],
};
