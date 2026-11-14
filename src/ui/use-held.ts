import { useRef } from 'react';

/**
 * O último valor válido. Na troca de tela o estado muda na hora e só a tela espera a animação
 * (src/store/screen-transition.ts): a tela que está saindo continua mostrando o que mostrava em vez de sumir antes do
 * fade. Os botões dela não fazem nada de errado: as ações do store conferem o status.
 */
export function useHeld<T>(value: T | null | undefined): T | null | undefined {
    const last = useRef(value);
    if (value) last.current = value;
    return value ?? last.current;
}

/**
 * A partida e a copa dela juntas: o par só troca quando os dois existem. A tela de resultado que está saindo (fim da
 * copa, "Nova copa") ganha a copa nova na hora, mas a partida vira null: com `useHeld` separado ela montava a copa
 * nova (a Rota nasce sem rivais, `opponents: []`) com a partida velha e quebrava ("Algo deu errado").
 */
export function holdPair<R, M>(
    last: { run: R; match: M } | null,
    run: R | null | undefined,
    match: M | null | undefined,
) {
    return run && match ? { run, match } : last;
}
export function useHeldPair<R, M>(run: R | null | undefined, match: M | null | undefined) {
    const last = useRef<{ run: R; match: M } | null>(null);
    last.current = holdPair(last.current, run, match);
    return last.current;
}
