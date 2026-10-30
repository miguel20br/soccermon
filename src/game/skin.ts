import shinyMissing from '../data/pmd-shiny-missing.json';

/**
 * "Skin" do sprite em campo: o número da espécie, ou espécie + SHINY_SKIN para a folha shiny de verdade
 * (scripts/build-pmd-shiny.ts; mesma disposição da normal, então reusa o JSON). Espécie sem shiny no PMDCollab
 * fica com a normal (e a tinta amarelada de antes). Fora do animation-manager: a tela da partida usa sem levar o
 * pmd-anims.json (~260 KB) pro pedaço da Home.
 */
export const SHINY_SKIN = 10000;
const NO_SHINY = new Set(shinyMissing as number[]);
export const skinOf = (speciesId: number, shiny: boolean) =>
    shiny && !NO_SHINY.has(speciesId) ? speciesId + SHINY_SKIN : speciesId;
export const baseOf = (skin: number) => skin % SHINY_SKIN;
export const isShinySkin = (skin: number) => skin >= SHINY_SKIN;
