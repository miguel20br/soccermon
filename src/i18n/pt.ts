import { battle } from './pt/battle';
import { commentary } from './pt/commentary';
import { common } from './pt/common';
import { help } from './pt/help';
import { home } from './pt/home';
import { match } from './pt/match';
import { profile } from './pt/profile';
import { result } from './pt/result';
import { reward } from './pt/reward';
import { settings } from './pt/settings';
import { stats } from './pt/stats';
import { team } from './pt/team';

/**
 * Dicionário em português: a fonte da verdade. Cada área fica num arquivo em ./pt/ e tem o par em ./en/
 * com o mesmo tipo (faltou chave em inglês = erro de compilação).
 *
 * Convenções: `{nome}` é trocado pelo valor em `t(chave, { nome })`; "um|vários" é plural (`tn`).
 */
export const pt = {
    common,
    home,
    team,
    match,
    commentary,
    battle,
    result,
    reward,
    help,
    settings,
    profile,
    stats,
};

export type Dict = typeof pt;
