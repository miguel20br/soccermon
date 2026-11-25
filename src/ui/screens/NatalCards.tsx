import { species } from '../../engine/data';
import { createInstance, type PokemonInstance, viewInstance } from '../../engine/instance';
import { Rng } from '../../engine/rng';
import { NATAL_EVENT } from '../../engine/specials';
import { PokeCard2 } from '../components/PokeCard2';
import { METAL, metalOf } from '../rarity';

/**
 * Cartas de Natal na galeria (?cards=1): a edição do Evento de Natal do UT (`special.event = NATAL_EVENT`), a opção
 * D-polida que o Miguel escolheu em 25/11/2026, em bronze, prata e ouro, mais Charizard e Magmar (Pokémon vermelhos
 * em cima do papel vermelho).
 */
const SAMPLES = [86, 25, 144, 6, 126].map((id) => {
    const inst: PokemonInstance = {
        ...createInstance(id, new Rng(`natal-${id}`)),
        shiny: false,
        special: { kind: 'evento', type: 'Ice', event: NATAL_EVENT },
    };
    return { inst, label: `${species(id).name} · ${METAL[metalOf(viewInstance(inst).overall)].label}` };
});

export function NatalCards() {
    return (
        <section className="panel" id="natal">
            <h2>Cartas de Natal</h2>
            <p className="muted">
                Evento de Natal do Time Ultimate (pacotes, Picks e Desafio de Natal). Papel de presente, fita e laço no
                metal da nota, neve, pisca-pisca e uma faixa de luz lenta.
            </p>
            <div className="cg-row">
                {SAMPLES.map(({ inst, label }) => (
                    <figure key={inst.speciesId} className="cg-item">
                        <PokeCard2 inst={inst} variant="metal" tipFocus />
                        <figcaption className="muted">{label}</figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}
