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

/**
 * A linha da sala (código e "Sair da sala") em cima das telas de página. No resultado não: lá as saídas são só
 * Revanche e Voltar ao início (com a linha eram três jeitos de sair).
 */
export const roomBarShown = (step: string) => step !== 'done';

/**
 * Convite pra montar o próprio time no fim do Duelo: só pro convidado que nunca jogou uma copa (nenhuma copa no save,
 * aberta, guardada ou terminada, nem Copa do Dia), e só com a série acabada (no meio do melhor de 3, o próximo jogo vem
 * primeiro). Das 48 sessões novas que chegaram por convite até 16/11/2026, só 5 começaram uma copa.
 */
export const cupInviteShown = (
    role: string,
    seriesOver: boolean,
    save: { run: unknown; parkedRuns: readonly unknown[]; records: { cups: number }; daily: readonly unknown[] },
) =>
    role === 'guest' &&
    seriesOver &&
    !save.run &&
    save.parkedRuns.length === 0 &&
    !save.records.cups &&
    save.daily.length === 0;

/**
 * Bandeira do Duelo com o time do Time Ultimate (ADR 0005): só no dev e nas prévias (`smoke`), `?lab=duelo-ut` liga
 * na aba até fechar e `?lab=duelo-ut-off` desliga. Em produção fica escondido até o Miguel jogar. A bandeira só
 * esconde o criar sala: quem entra numa sala do UT pelo convite joga com o time dele.
 */
export function duelUtOn(smoke: boolean, search: string, stored: string | null): boolean {
    if (!smoke) return false;
    const q = new URLSearchParams(search).get('lab');
    if (q === 'duelo-ut') return true;
    if (q === 'duelo-ut-off') return false;
    return stored === '1';
}

const UT_KEY = 'soccermon-lab-duelo-ut';
/** Lê e guarda na aba (a sala troca a URL e a bandeira tem que ficar). */
export function readDuelUt(): boolean {
    let stored: string | null = null;
    try {
        stored = sessionStorage.getItem(UT_KEY);
    } catch {
        // aba anônima sem storage: vale só a URL
    }
    const on = duelUtOn(__SMOKE__, window.location.search, stored);
    try {
        sessionStorage.setItem(UT_KEY, on ? '1' : '0');
    } catch {
        // nada
    }
    return on;
}
