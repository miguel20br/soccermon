/** Notas da atualização mostradas na Home ("Novidades"). A mais nova primeiro. */
export interface PatchNotes {
    version: string;
    title: string;
    sections: { title: string; lines: string[] }[];
}

export const PATCH_NOTES: PatchNotes[] = [
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
