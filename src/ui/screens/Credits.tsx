import { rich, useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { MenuHead } from '../components/MenuHead';

export function Credits() {
    const go = useGame((s) => s.go);
    const { t } = useT();
    return (
        <div className="menu-screen">
            <MenuHead title={t('settings.credits.title')} icon="credits" onBack={() => go('home')} />
            <section className="panel setting-card credits-card credits-hero">
                <img className="pixel" src="assets/cards/25.gif" alt="" />
                <div>
                    <p>
                        {rich(t('settings.credits.createdBy'), {
                            name: <b>Miguel Cunha</b>,
                            link: <a href="https://github.com/miguel20br">@miguel20br</a>,
                        })}
                    </p>
                    <p>{rich(t('settings.credits.nonProfit'), { np: <b>{t('settings.credits.np')}</b> })}</p>
                </div>
            </section>
            <section className="panel setting-card credits-card">
                <h2>{t('settings.credits.spritesTitle')}</h2>
                <ul>
                    <li>
                        {rich(t('settings.credits.pmd'), {
                            link: (
                                <a href="https://github.com/PMDCollab/SpriteCollab">
                                    PMD Sprite Repository (PMDCollab)
                                </a>
                            ),
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.bw'), {
                            link: <a href="https://github.com/PokeAPI/sprites">PokeAPI/sprites</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.holo'), {
                            link: <a href="https://github.com/simeydotme/pokemon-cards-css">pokemon-cards-css</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.cries'), {
                            link: <a href="https://github.com/PokeAPI/cries">PokeAPI/cries</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.particles'), {
                            link: <a href="https://play.pokemonshowdown.com">Pokémon Showdown</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.sfx'), {
                            link: <a href="https://github.com/KilledByAPixel/ZzFX">ZzFX</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.font'), {
                            link: <a href="https://github.com/quiple/galmuri">Galmuri</a>,
                        })}
                    </li>
                </ul>
            </section>
            <section className="panel setting-card credits-card">
                <h2>{t('settings.credits.dataTitle')}</h2>
                <ul>
                    <li>
                        {rich(t('settings.credits.dex'), {
                            pkmn: <a href="https://github.com/pkmn/ps">@pkmn/dex</a>,
                            showdown: <a href="https://github.com/smogon/pokemon-showdown">Pokémon Showdown</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.ptDesc'), {
                            link: <a href="https://github.com/pagefaultgames/pokerogue-locales">pokerogue-locales</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.dexText'), {
                            tcgdex: <a href="https://tcgdex.dev">TCGdex</a>,
                            pokeapi: <a href="https://pokeapi.co">PokeAPI</a>,
                        })}
                    </li>
                    <li>
                        {rich(t('settings.credits.arch'), {
                            pac: <a href="https://github.com/keldaanCommunity/pokemonAutoChess">Pokémon Auto Chess</a>,
                            fs: (
                                <a href="https://github.com/tbleckert/football-simulator">
                                    tbleckert/football-simulator
                                </a>
                            ),
                            book: <i>Programming Game AI by Example</i>,
                        })}
                    </li>
                </ul>
            </section>
        </div>
    );
}
