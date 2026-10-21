import { account } from './pt/account';
import { battle } from './pt/battle';
import { bracket } from './pt/bracket';
import { commentary } from './pt/commentary';
import { common } from './pt/common';
import { duel } from './pt/duel';
import { friends } from './pt/friends';
import { help } from './pt/help';
import { home } from './pt/home';
import { liga } from './pt/liga';
import { longCup } from './pt/longCup';
import { match } from './pt/match';
import { moments } from './pt/moments';
import { profile } from './pt/profile';
import { result } from './pt/result';
import { reward } from './pt/reward';
import { settings } from './pt/settings';
import { shop } from './pt/shop';
import { stats } from './pt/stats';
import { team } from './pt/team';
import { title } from './pt/title';
import { trophies } from './pt/trophies';

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
    account,
    title,
    duel,
    moments,
    liga,
    friends,
    trophies,
    shop,
    longCup,
    bracket,
};

export type Dict = typeof pt;
