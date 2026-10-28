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
