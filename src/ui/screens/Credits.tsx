import { useGame } from '../../store/game-store';

export function Credits() {
    const go = useGame((s) => s.go);
    return (
        <div className="panel prose">
            <h2>Créditos</h2>
            <p>
                Soccermon é um fan game <b>sem fins lucrativos</b>, com código aberto sob a licença AGPL-3.0. Pokémon e
                todos os nomes, imagens e sons relacionados são © Nintendo, Game Freak, Creatures Inc. e The Pokémon
                Company. Este projeto não é afiliado nem endossado por eles.
            </p>
            <h3>Sprites e áudio</h3>
            <ul>
                <li>
                    Sprites de campo e retratos:{' '}
                    <a href="https://github.com/PMDCollab/SpriteCollab">PMD Sprite Repository (PMDCollab)</a>, licença
                    CC BY-NC 4.0 — autores por Pokémon nos arquivos CREDITS-PMD.md e CREDITS-PORTRAITS.md do projeto. Sprites originais de
                    Pokémon Mystery Dungeon © Nintendo / Spike Chunsoft.
                </li>
                <li>
                    Sprites animados de Black/White, ícones de itens e ícones de tipo (Pokémon Champions):{' '}
                    <a href="https://github.com/PokeAPI/sprites">PokeAPI/sprites</a>.
                </li>
                <li>
                    Técnicas das cartas holográficas inspiradas em{' '}
                    <a href="https://github.com/simeydotme/pokemon-cards-css">pokemon-cards-css</a> (simeydotme,
                    GPL-3.0).
                </li>
                <li>
                    Gritos: <a href="https://github.com/PokeAPI/cries">PokeAPI/cries</a>.
                </li>
                <li>
                    Partículas de efeito: <a href="https://play.pokemonshowdown.com">Pokémon Showdown</a>.
                </li>
                <li>
                    Efeitos sonoros procedurais: <a href="https://github.com/KilledByAPixel/ZzFX">ZzFX</a> (MIT).
                </li>
                <li>
                    Fonte: <a href="https://github.com/quiple/galmuri">Galmuri</a> (SIL Open Font License).
                </li>
            </ul>
            <h3>Dados e referências</h3>
            <ul>
                <li>
                    Dados de Pokémon, golpes e tipos: <a href="https://github.com/pkmn/ps">@pkmn/dex</a> (MIT), derivado
                    do <a href="https://github.com/smogon/pokemon-showdown">Pokémon Showdown</a>.
                </li>
                <li>
                    Descrições em português:{' '}
                    <a href="https://github.com/pagefaultgames/pokerogue-locales">pokerogue-locales</a> (AGPL-3.0).
                </li>
                <li>
                    Referências de arquitetura:{' '}
                    <a href="https://github.com/keldaanCommunity/pokemonAutoChess">Pokémon Auto Chess</a>,{' '}
                    <a href="https://github.com/tbleckert/football-simulator">tbleckert/football-simulator</a> e o
                    “Simple Soccer” do livro <i>Programming Game AI by Example</i> (Mat Buckland).
                </li>
            </ul>
            <button type="button" className="btn" onClick={() => go('home')}>
                Voltar
            </button>
        </div>
    );
}
