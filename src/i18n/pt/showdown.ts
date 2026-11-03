/**
 * Falas do duelo da bicuda (motor 21: a bicuda N3 do goleiro capitão segura o N3 do rival e a partida para numa
 * cutscene). `s` = quem chutou, `g` = o goleiro; a última fala é sempre o grito do goleiro na bicuda. A escolha
 * (src/ui/showdown-lines.ts) vai nessa ordem: par notável (`pairs`, chave "quem chutou-goleiro" pelo número da
 * Pokédex), mesma linha evolutiva (`up`: o goleiro é a pré-evolução; `down`: o goleiro é o evoluído), fala de um
 * Pokémon sozinho (`solo`) e as genéricas. `{s}` e `{g}` viram os nomes. Até 10 palavras por fala.
 */
export type ShowdownWho = 's' | 'g';
export type ShowdownScript = readonly (readonly [ShowdownWho, string])[];
export interface ShowdownSolo {
    /** Quando ele chutou (a reação depois de o goleiro segurar). */
    shot: readonly string[];
    /** Quando ele é o goleiro: a resposta e o grito da bicuda. */
    gk: readonly string[];
    shout: readonly string[];
}

export const showdown = {
    tag: 'Duelo da bicuda',
    /** A 2ª faixa do gol do duelo (o nome do goleiro vai antes do `goalSub`). */
    goal: 'BICUDA!',
    goalSub: 'de gol a gol',
    /**
     * O letreiro do duelo na defesa e na bicuda (o nome do golpe Counter, que devolve o golpe; "contra-ataque" é a tática)
     * e a etiqueta dele na defesa.
     */
    counter: 'COUNTER!',
    caught: 'Segurou o N3',
    pairs: {
        // Charizard × Charmander
        '6-4': [
            ['s', 'Charmander? Você segurou o meu fogo?'],
            ['g', 'Minha cauda também queima, sabia?'],
            ['s', 'Eu era assim. Pequeno e teimoso.'],
            ['g', 'Segura, grandão!'],
        ],
        '4-6': [
            ['s', 'Pegou com uma mão só?'],
            ['g', 'Eu já tive essa chama, pequeno.'],
            ['s', 'Um dia eu chego aí.'],
            ['g', 'Hoje não!'],
        ],
        // Blastoise × Squirtle
        '9-7': [
            ['s', 'Dois canhões e um Squirtle me parou?'],
            ['g', 'Meu casco aguenta pancada, grandão.'],
            ['s', 'Coisa do Esquadrão Squirtle, aposto.'],
            ['g', 'Squirtle!'],
        ],
        '7-9': [
            ['s', 'Ei! Você nem pulou!'],
            ['g', 'Nem precisei. Eu já fui você.'],
            ['g', 'Canhão!'],
        ],
        // Venusaur × Bulbasaur
        '3-1': [
            ['s', 'Bulbasaur? Seu bulbo nem abriu ainda.'],
            ['g', 'Mas já segura bola.'],
            ['s', 'Hmpf. Floresce aí, então.'],
            ['g', 'Bulba!'],
        ],
        '1-3': [
            ['s', 'Treinei esse chute no sol o dia inteiro.'],
            ['g', 'Eu também. Por isso cresci tanto.'],
            ['g', 'Desabrocha!'],
        ],
        // Mewtwo × Mew
        '150-151': [
            ['s', 'Fui criado pra ser mais forte que você.'],
            ['g', 'Mew? Mew!'],
            ['s', 'Pare de brincar com a bola.'],
            ['g', 'Meeew!'],
        ],
        '151-150': [
            ['s', 'Mew?'],
            ['g', 'Eu nasci de você. Conheço seus truques.'],
            ['s', 'Mew mew!'],
            ['g', 'Minha vez.'],
        ],
        // Raichu × Pikachu
        '26-25': [
            ['s', 'Ainda sem a Thunder Stone, Pikachu?'],
            ['g', 'Pika! Gosto de mim assim.'],
            ['s', 'Mais lento e mais fraco.'],
            ['g', 'Pika... CHU!'],
        ],
        '25-26': [
            ['s', 'Pika? Pegou o meu raio?'],
            ['g', 'Eu sou o que vem depois da pedra.'],
            ['g', 'Rai... CHU!'],
        ],
        // Gyarados × Magikarp
        '130-129': [
            ['s', 'Um Magikarp segurou o meu chute?'],
            ['g', 'Todo Gyarados já foi Magikarp.'],
            ['s', 'Eu só pulava. Lembro bem.'],
            ['g', 'Splash!'],
        ],
        '129-130': [
            ['s', 'Foi o chute mais forte da minha vida!'],
            ['g', 'Lembro desse tempo. Eu só pulava.'],
            ['g', 'Sai, peixinho!'],
        ],
        // Hitmonchan × Hitmonlee
        '107-106': [
            ['s', 'Segurou meu chute? Com o pé?'],
            ['g', 'Perna alcança mais que braço.'],
            ['s', 'A gente resolve isso no ringue.'],
            ['g', 'High Jump Kick!'],
        ],
        '106-107': [
            ['s', 'Parado por uma luva de boxe?'],
            ['g', 'Treinei defesa a vida inteira.'],
            ['s', 'Mas chutar você não sabe.'],
            ['g', 'Sei sim!'],
        ],
        // Nidoking × Nidoqueen
        '34-31': [
            ['s', 'Até você, Nidoqueen?'],
            ['g', 'Em casa a gente conversa.'],
            ['g', 'Agora sai!'],
        ],
        '31-34': [
            ['s', 'Você nunca segura nada em casa.'],
            ['g', 'Hoje eu segurei. Anota aí.'],
            ['g', 'Pro gol!'],
        ],
        // Gengar × Alakazam
        '94-65': [
            ['s', 'Como você viu a minha bola fantasma?'],
            ['g', 'Vi o chute antes de você chutar.'],
            ['s', 'Hehehe... trapaça psíquica.'],
            ['g', 'Previsto!'],
        ],
        '65-94': [
            ['s', 'Calculei tudo. Você não estava na conta.'],
            ['g', 'Hehehe. Fantasma não entra em conta.'],
            ['g', 'Bu!'],
        ],
        // Machamp × Machop
        '68-66': [
            ['s', 'Quatro braços e um Machop me parou?'],
            ['g', 'Dois braços deram conta.'],
            ['s', 'Treinou, hein, pequeno?'],
            ['g', 'Muito!'],
        ],
        '66-68': [
            ['s', 'Treinei esse chute mil vezes!'],
            ['g', 'Eu treinei com quatro braços.'],
            ['g', 'Força!'],
        ],
        // Charizard × Blastoise (os rivais do laboratório)
        '6-9': [
            ['s', 'De novo você, Blastoise?'],
            ['g', 'Água apaga fogo. Sempre foi assim.'],
            ['s', 'Desde o laboratório do Carvalho.'],
            ['g', 'Apagou!'],
        ],
        '9-6': [
            ['s', 'Segurou água com fogo?'],
            ['g', 'Segurei com a mão, Blastoise.'],
            ['g', 'Queima!'],
        ],
        // Golduck × Psyduck
        '55-54': [
            ['s', 'Psyduck? Você segurou?'],
            ['g', 'Ai, minha cabeça... segurei?'],
            ['s', 'Eu também tinha essa dor de cabeça.'],
            ['g', 'Psy... DUCK!'],
        ],
        '54-55': [
            ['s', 'Ai... minha cabeça. Não entrou?'],
            ['g', 'Passou a dor de cabeça? A minha passou.'],
            ['g', 'Vai!'],
        ],
        // Slowbro × Slowpoke
        '80-79': [
            ['s', 'Slowpoke... segurou... o meu chute?'],
            ['g', '.........'],
            ['s', 'Ainda tá pensando, né?'],
            ['g', '...Lá vai.'],
        ],
        '79-80': [
            ['s', '.........'],
            ['g', 'Já segurei faz tempo, Slowpoke.'],
            ['s', '...Chutei?'],
            ['g', 'Minha vez!'],
        ],
        // Pikachu × Meowth (a Equipe Rocket)
        '25-52': [
            ['s', 'Pika! Equipe Rocket no gol?'],
            ['g', 'Hoje eu pego o Pikachu de vez.'],
            ['s', 'Pika pika...'],
            ['g', 'Meowth, é isso aí!'],
        ],
        '52-25': [
            ['s', 'Miau! Era o plano perfeito!'],
            ['g', 'Pika pika!'],
            ['s', 'A Equipe Rocket decolando de novo...'],
            ['g', 'Pikachu!'],
        ],
        // Jigglypuff × Snorlax
        '39-143': [
            ['s', 'Era pra você dormir com a minha música!'],
            ['g', 'Eu já tava dormindo.'],
            ['g', 'Acordei!'],
        ],
        '143-39': [
            ['s', 'Zzz... hã? Segurou?'],
            ['g', 'Dormiu no jogo? Vai levar rabisco.'],
            ['g', 'Puf!'],
        ],
        // Onix × Pikachu (o ginásio de Pewter)
        '95-25': [
            ['s', 'Choque não faz nada em pedra.'],
            ['g', 'Pika! Ainda bem que é bicuda.'],
            ['g', 'Pika... CHU!'],
        ],
    } as Record<string, ShowdownScript>,
    /** O goleiro é a pré-evolução de quem chutou. */
    up: [
        [
            ['s', 'Logo você, {g}, me segurou?'],
            ['g', 'Pequeno, mas segurei.'],
            ['g', 'Lá vai!'],
        ],
        [
            ['s', 'Eu já fui {g}. Sei como você joga.'],
            ['g', 'Então sabe o que vem agora.'],
            ['g', 'Segura!'],
        ],
        [
            ['s', 'Evoluí pra não perder pra você.'],
            ['g', 'Pelo visto não deu.'],
            ['s', 'Espera, {g}...'],
            ['g', 'Toma!'],
        ],
    ] as readonly ShowdownScript[],
    /** O goleiro é a evolução de quem chutou. */
    down: [
        [
            ['s', 'Meu chute mais forte, e você pegou.'],
            ['g', 'Eu já fui {s}. Conheço esse chute.'],
            ['g', 'Aprende!'],
        ],
        [
            ['s', 'Um dia eu evoluo e passo você.'],
            ['g', 'Até lá, eu te ensino.'],
            ['g', 'Olha só!'],
        ],
        [
            ['s', 'Achei que dava, {g}.'],
            ['g', 'Quase. Eu chutava igualzinho.'],
            ['s', 'E agora?'],
            ['g', 'Minha vez!'],
        ],
    ] as readonly ShowdownScript[],
    solo: {
        143: { shot: ['Zzz... hã? Ele segurou?'], gk: ['Hmm... me acordaram pra isso?'], shout: ['Acordei!'] },
        150: {
            shot: ['Impossível. Ninguém segura o meu poder.'],
            gk: ['Previsível. Agora é a minha vez.'],
            shout: ['Psychic!'],
        },
        25: { shot: ['Pika? Pegou o meu raio?'], gk: ['Pika pika!'], shout: ['Pikachu!'] },
        129: { shot: ['Meu melhor chute... e nada.'], gk: ['Dessa vez o Splash funcionou!'], shout: ['Splash!'] },
        132: {
            shot: ['Copiei o chute certinho. Como pegou?'],
            gk: ['Copiei a defesa de um goleiro bom.'],
            shout: ['Copiei!'],
        },
        54: {
            shot: ['Ai... minha cabeça. Não entrou?'],
            gk: ['Psy... ai, que dor de cabeça.'],
            shout: ['Psy... DUCK!'],
        },
        79: { shot: ['......... Hã? Ele segurou?'], gk: ['......... Ah. Peguei a bola?'], shout: ['...Lá vai.'] },
        94: { shot: ['Hehehe... era pra atravessar você.'], gk: ['Hehehe. Sua bola agora é minha.'], shout: ['Bu!'] },
        151: { shot: ['Mew?'], gk: ['Mew mew!'], shout: ['Meeew!'] },
        39: { shot: ['Puf! Você nem dormiu?'], gk: ['Quem dormir leva rabisco na cara.'], shout: ['Puf!'] },
        52: {
            shot: ['Miau! Era o plano perfeito!'],
            gk: ['Essa bola agora é da Equipe Rocket!'],
            shout: ['Meowth, é isso aí!'],
        },
        83: { shot: ['Nem com o alho-poró deu?'], gk: ['Defendi com o alho-poró!'], shout: ['Alho-poró!'] },
        63: { shot: ['Zzz...'], gk: ['Zzz...'], shout: ['Teleport!'] },
        133: { shot: ['Vee! Você pegou?'], gk: ['Ainda nem escolhi a minha pedra.'], shout: ['Eevee!'] },
    } as Record<string, ShowdownSolo>,
    /** Genéricas: quem chutou reage, o goleiro responde, às vezes quem chutou de novo (`more`) e o grito. */
    shot: [
        'Como você pegou isso?',
        'Era o meu chute mais forte!',
        'Não acredito. Segurou?',
        'Pegou com uma mão só?',
        'Esse era pra entrar!',
        'Meu golpe máximo... parado?',
        'Ei! Devolve a bola!',
        'Tava no ângulo! Como?',
    ],
    gk: [
        'Treinei a vida inteira pra isso.',
        'Agora é a minha vez.',
        'Segurei. Agora olha só.',
        'Você chutou forte. Eu chuto mais.',
        'Viu? Goleiro também ataca.',
        'Corre pra trás, que lá vai.',
        'Fica olhando daí.',
        'Pulei certo dessa vez.',
    ],
    more: [
        'Daí do gol? Não alcança.',
        'Espera, você vai chutar daí?',
        'Pessoal, volta! Volta!',
        'Ninguém chuta de gol a gol.',
    ],
    shout: ['Lá vai!', 'Bicuda!', 'Levou!', 'Segura essa!', 'Pro gol!', 'Daqui mesmo!', 'Toma!', 'Vai!'],
};
