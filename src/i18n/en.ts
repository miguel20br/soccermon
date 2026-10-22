import { account } from './en/account';
import { battle } from './en/battle';
import { bracket } from './en/bracket';
import { commentary } from './en/commentary';
import { common } from './en/common';
import { duel } from './en/duel';
import { friends } from './en/friends';
import { help } from './en/help';
import { home } from './en/home';
import { liga } from './en/liga';
import { longCup } from './en/longCup';
import { match } from './en/match';
import { moments } from './en/moments';
import { profile } from './en/profile';
import { result } from './en/result';
import { reward } from './en/reward';
import { settings } from './en/settings';
import { shop } from './en/shop';
import { stats } from './en/stats';
import { team } from './en/team';
import { title } from './en/title';
import { trophies } from './en/trophies';
import type { Dict } from './pt';

/** English dictionary: same shape as `pt` (a missing key is a compile error). */
export const en: Dict = {
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
