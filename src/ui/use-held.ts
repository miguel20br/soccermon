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
