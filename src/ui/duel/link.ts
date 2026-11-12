import { cloudEnabled } from '../../cloud/cloud';

/** Sala local (duas abas, sem internet): sem Supabase configurado ou com `&local=1` no link. */
export const isLocalDuel = () => !cloudEnabled || new URLSearchParams(window.location.search).get('local') === '1';

/** Link da sala; `from` = nome de quem chama (a tela de quem abre sem conta mostra "Fulano te chamou"). */
export const duelLink = (code: string, local: boolean, from?: string) =>
    `${window.location.origin}${window.location.pathname}?duelo=${code}${local ? '&local=1' : ''}${
        from ? `&de=${encodeURIComponent(from.slice(0, 24))}` : ''
    }`;

/** Quanto o convidado espera o anfitrião antes de ver "ninguém abriu essa sala" (com saída pra jogar uma copa). */
export const CONNECT_GIVEUP_MS = 15000;
/** Sem resposta do anfitrião há tempo demais, ou sem conexão com o canal (`left`): o link provavelmente morreu. */
export const roomLooksClosed = (status: string, waitedMs: number) => status === 'left' || waitedMs >= CONNECT_GIVEUP_MS;

/**
 * O balão da entrada sem conta ("Depois você cria a sala e manda o link") é de quem vai criar a sala. Quem chegou pelo
 * convite (`code`) não cria nada: o painel já diz "Fulano te chamou" e o balão cobria o Entrar com Google.
 */
export const entryCoach = (code: string | null) => (code ? null : ('duelo' as const));
