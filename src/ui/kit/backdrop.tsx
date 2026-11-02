import { type ComponentProps, lazy, Suspense } from 'react';
import type { ArenaBackdrop as ArenaBg } from '../ambientes/Backdrops';

// a cena e o CSS dos ambientes vêm num pedaço à parte: a tela (no bundle da Home) só carrega o fundo quando abre
const Arena = lazy(() => import('../ambientes/Backdrops').then((m) => ({ default: m.ArenaBackdrop })));

/** A Arena atrás do palco (Duelo, Liga). Enquanto carrega, o fundo da página. */
export function ArenaBackdrop(props: ComponentProps<typeof ArenaBg>) {
    return (
        <Suspense fallback={null}>
            <Arena {...props} />
        </Suspense>
    );
}
