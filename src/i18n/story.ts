import { getLang, type Lang } from '.';

/**
 * Textos das cenas do Modo história (docs/planos/historia.md). Ficam fora do dicionário principal de propósito: só o
 * pedaço das cenas importa este arquivo, então o primeiro carregamento não cresce. Letreiro: até 4 palavras, caixa
 * alta. Fala: até 12 palavras. Conferido no teste (src/story/director.test.ts).
 */
const pt = {
    'who.blue': 'Blue',
    'who.oak': 'Prof. Carvalho',
    'pallet.title.kanto': 'KANTO, ANOS ATRÁS',
    'pallet.title.liga': 'LIGA ÍNDIGO DE FUTSAL',
    'pallet.title.pallet': 'PALLET',
    'pallet.blue.dirt': 'Campinho de terra? Meu time treina em ginásio.',
    'pallet.oak.call': 'Vocês dois! Venham pro laboratório.',
    'pallet.blue.pick': 'Então eu fico com esse.',
    'pallet.oak.dex': 'Pokémon que jogam juntos ficam mais fortes. Leve esta Pokédex.',
    'pallet.blue.route': 'Monta um time na Rota 1. Te espero no campinho.',
    'pallet.title.route': 'ROTA 1',
} as const;

export type StoryKey = keyof typeof pt;

const en: Record<StoryKey, string> = {
    'who.blue': 'Blue',
    'who.oak': 'Prof. Oak',
    'pallet.title.kanto': 'KANTO, YEARS AGO',
    'pallet.title.liga': 'INDIGO FUTSAL LEAGUE',
    'pallet.title.pallet': 'PALLET TOWN',
    'pallet.blue.dirt': 'A dirt pitch? My team trains in a gym.',
    'pallet.oak.call': 'You two! Come to my lab.',
    'pallet.blue.pick': "Then I'll take this one.",
    'pallet.oak.dex': 'Pokémon that play together get stronger. Take this Pokédex.',
    'pallet.blue.route': "Go build a team on Route 1. I'll be at the pitch.",
    'pallet.title.route': 'ROUTE 1',
};

export const STORY_TEXT: Record<Lang, Record<StoryKey, string>> = { pt, en };

export const storyText = (key: StoryKey, lang: Lang = getLang()) => STORY_TEXT[lang][key];
