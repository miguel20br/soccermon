/**
 * Bolsa do técnico (docs/planos/itens-ativos.md, etapa A1): itens de reforço usados da beira da quadra, 1 por tempo por
 * time. O item segurado (items.ts) é outra coisa: o da Bolsa é do técnico e some ao usar. Sem ordem `bag` (ou sem
 * `TeamSetup.bag`) a partida é bit a bit a de sempre.
 */
export type BagItem = 'potion' | 'xattack' | 'xdefense' | 'fullheal';
export const BAG_ITEMS: readonly BagItem[] = ['potion', 'xattack', 'xdefense', 'fullheal'];
export const isBagItem = (x: unknown): x is BagItem => BAG_ITEMS.includes(x as BagItem);
/** Só a Poção tem alvo (1 do seu time); os outros valem pro time em quadra. */
export const bagNeedsTarget = (item: BagItem) => item === 'potion';

/**
 * Números PADRÃO do plano (1' de relógio = 9 s de motor). A coluna "forte" do plano (`scripts/balance/coach.ts` com
 * FORTE=1) dobra as durações e põe +15% de fôlego nos outros 4 na Poção.
 */
export const BAG = {
    /** Poção: o fôlego do alvo volta a isto; os outros do time ganham `potionTeam`. */
    potionEnergy: 1,
    potionTeam: 0,
    /** X Attack: chute e drible; X Defense: desarme e posicionamento (goleiro: defesa). Segundos de motor (5'). */
    xTime: 45,
    xAttack: 1.3,
    xDefense: 1.25,
    xDefenseGk: 1.1,
    /** Cura Total: imune a status (de rival) por esse tempo (5'). */
    safeguardTime: 45,
};

/** Preço no Mercado da Rota (₽). */
export const BAG_PRICE: Record<BagItem, number> = { potion: 2, xattack: 3, xdefense: 3, fullheal: 2 };

/** O que ainda dá pra usar: a Bolsa do time menos os já usados (um de cada por uso). */
export function bagLeft(bag: readonly BagItem[] | undefined, used: readonly (BagItem | null)[]): BagItem[] {
    const left = [...(bag ?? [])];
    for (const u of used) {
        const i = u ? left.indexOf(u) : -1;
        if (i >= 0) left.splice(i, 1);
    }
    return left;
}
