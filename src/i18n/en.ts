import { battle } from './en/battle';
import { commentary } from './en/commentary';
import { common } from './en/common';
import { help } from './en/help';
import { home } from './en/home';
import { match } from './en/match';
import { profile } from './en/profile';
import { result } from './en/result';
import { reward } from './en/reward';
import { settings } from './en/settings';
import { stats } from './en/stats';
import { team } from './en/team';
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
};
