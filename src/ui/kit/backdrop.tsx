import { type ComponentProps, lazy, Suspense } from 'react';
import type {
    ArenaBackdrop as ArenaBg,
    CourtStands as CourtStandsBg,
    EstadioBackdrop as EstadioBg,
} from '../ambientes/Backdrops';

// a cena e o CSS dos ambientes vêm num pedaço à parte: a tela (no bundle da Home) só carrega o fundo quando abre
const Arena = lazy(() => import('../ambientes/Backdrops').then((m) => ({ default: m.ArenaBackdrop })));
const Estadio = lazy(() => import('../ambientes/Backdrops').then((m) => ({ default: m.EstadioBackdrop })));

/** A Arena atrás do palco (Duelo, Liga). Enquanto carrega, o fundo da página. */
export function ArenaBackdrop(props: ComponentProps<typeof ArenaBg>) {
    return (
        <Suspense fallback={null}>
            <Arena {...props} />
        </Suspense>
    );
}

/** O Estádio atrás do palco (Copa do Dia). */
export function EstadioBackdrop(props: ComponentProps<typeof EstadioBg>) {
    return (
        <Suspense fallback={null}>
            <Estadio {...props} />
        </Suspense>
    );
}

const Stands = lazy(() => import('../ambientes/Backdrops').then((m) => ({ default: m.CourtStands })));

/** A torcida nas bandas da quadra inteira (partida no celular em pé). */
export function CourtStands(props: ComponentProps<typeof CourtStandsBg>) {
    return (
        <Suspense fallback={null}>
            <Stands {...props} />
        </Suspense>
    );
}
