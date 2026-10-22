import { useCloud } from '../cloud/cloud';
import type { Peer } from '../net/duel-state';
import { useGame } from '../store/game-store';
import { peerInfo, usePlayerCard } from '../ui/profile/PlayerCard';
import { type AskResult, type FriendRow, type FriendsServer, setFriendsServer, useFriends } from './api';

/**
 * Servidor de mentira pro `?demo=amigos` (só no dev): lista com amigos (Davi e Ana online), um pedido recebido, um
 * enviado e um desafio do Davi; dá pra adicionar pelo código `CHAR2ZRD` (Gary), aceitar, recusar, remover, bloquear e
 * desafiar (a sala do Duelo é local, sem internet). Mesmas regras do banco no essencial
 * (supabase/migrations/20261020120000_amigos.sql).
 * - `&tela=home`: abre na Home (o convite do Davi no cartão do Duelo).
 * - `&tela=config`: abre em Configurações e, 2 s depois, a Ana chama pro Duelo "na hora" (o aviso por cima da tela).
 * - `&cartao=1` (ou `anon`): o cartão do treinador do rival (o de verdade) com o "Adicionar amigo".
 */
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const row = (
    code: string,
    trainer: string,
    club: string,
    color: string,
    status: FriendRow['status'],
    online = false,
): FriendRow => ({
    code,
    trainer,
    club,
    club_tag: club.slice(0, 3).toUpperCase(),
    club_color: color,
    status,
    since: ago(60 * 24),
    room: null,
    room_at: null,
    online,
});

type Card = Pick<FriendRow, 'code' | 'trainer' | 'club' | 'club_tag' | 'club_color'>;
const KNOWN: Record<string, Card> = {
    CHAR2ZRD: { code: 'CHAR2ZRD', trainer: 'Gary', club: 'Pallet Rival', club_tag: 'RIV', club_color: 'roxo' },
};
const BY_USER: Record<string, Card> = {
    'demo-rafa': { code: 'SAFF2RNM', trainer: 'Rafa', club: 'Saffron Mente', club_tag: 'SAF', club_color: 'rosa' },
};

/** O rival do Duelo, como vem da sala (o cartão valida cada campo). */
const RIVAL = {
    id: 'demo-rafa',
    name: 'Rafa',
    avatar: 'assets/cards/65.gif',
    avatarGoogle: false,
    trainer: 'sabrina',
    title: 'Mestre Psíquico',
    clubName: 'Saffron Mente',
    clubTag: 'SAF',
    clubColor: 0xd94fa0,
    showcase: ['m:campeao:2'],
    cards: [],
};

/** A vitrine do Davi (o Gabriel, sem vitrine, mostra o aviso de versão antiga). */
const DAVI = {
    name: 'Davi',
    avatar: 'assets/cards/1.gif',
    avatarGoogle: false,
    trainer: 'brock',
    title: '',
    titleId: 'campeao',
    clubName: 'Viridian Verde',
    clubTag: 'VIR',
    clubColor: 0x3fae5a,
    showcase: ['m:campeao:2', 'm:artilheiro:1'],
    cards: [],
    code: 'VRDN4GRN',
    numbers: { matches: 48, wins: 31, goals: 140, titles: 6, perfect: 1, bestStreak: 3, duelWins: 4, played: 57 },
    hall: [
        {
            date: Date.now() - 864e5,
            club: 'Viridian Verde',
            color: 'verde',
            final: [3, 1],
            perfect: false,
            captain: 3,
            shiny: false,
        },
        {
            date: Date.now() - 3 * 864e5,
            club: 'Viridian Verde',
            color: 'verde',
            final: [2, 0],
            perfect: true,
            captain: 6,
            shiny: true,
        },
    ],
};

export function startFriendsDemo(params: URLSearchParams) {
    let rows: FriendRow[] = [
        { ...row('VRDN4GRN', 'Davi', 'Viridian Verde', 'verde', 'amigo', true), room: 'K7M2QX', room_at: ago(2) },
        row('LVND3RXQ', 'Ana Clara', 'Lavender Assombro', 'roxo', 'amigo', true),
        row('PWTR7RCK', 'Gabriel', 'Pewter Rochedo', 'grafite', 'amigo'),
        row('CRLN5BLU', 'Bia', 'Cerulean', 'azul', 'recebido'),
        row('VRML8YLW', 'Lucas', 'Vermilion Voltagem', 'amarelo', 'enviado'),
    ];
    // quem saiu da lista (pra bloquear/desbloquear lembrar o nome)
    const old = new Map<string, Card>(rows.map((r) => [r.code, r]));
    const set = (code: string, status: FriendRow['status'] | null) => {
        rows = rows.filter((r) => r.code !== code);
        const base = Object.values({ ...KNOWN, ...BY_USER }).find((k) => k.code === code) ?? old.get(code);
        if (status && base) rows.push({ ...base, status, since: ago(0), room: null, room_at: null });
    };
    const tela = params.get('tela');
    const server: FriendsServer = {
        card: async () => 'K7M2QXAB',
        list: async () => rows.map((r) => ({ ...r })),
        ask: async (target): Promise<AskResult> => {
            const card = 'code' in target ? KNOWN[target.code] : BY_USER[target.user];
            if ('code' in target && target.code === 'K7M2QXAB') return { status: 'voce_mesmo' };
            if (!card) return { status: 'nao_achei' };
            const cur = rows.find((r) => r.code === card.code);
            const who = { trainer: card.trainer, club: card.club };
            if (cur?.status === 'amigo') return { status: 'ja_amigos', ...who };
            if (cur?.status === 'enviado') return { status: 'ja_pediu', ...who };
            set(card.code, 'enviado');
            return { status: 'enviado', ...who };
        },
        respond: async (code, accept) => {
            set(code, accept ? 'amigo' : null);
            return accept ? 'amigos' : 'recusado';
        },
        remove: async (code) => set(code, null),
        block: async (code) => set(code, 'bloqueado'),
        unblock: async (code) => set(code, null),
        challenge: async () => 'enviado',
        vitrine: async () => true,
        profile: async (code) => (code === 'VRDN4GRN' ? DAVI : null),
        ping: async () => {},
        listen: (on) => {
            if (tela !== 'config') return () => {};
            // a Ana chama pro Duelo "na hora", como o Realtime faria
            const id = window.setTimeout(() => {
                rows = rows.map((r) => (r.trainer === 'Ana Clara' ? { ...r, room: 'ANA2RX', room_at: ago(0) } : r));
                on('desafio');
            }, 2000);
            return () => window.clearTimeout(id);
        },
    };
    setFriendsServer(server);
    useCloud.setState({ user: { name: 'Miguel', avatar: null }, status: 'saved' });
    const p = useGame.getState().profile;
    useGame.setState({
        profile: { ...p, trainerName: p.trainerName || 'Miguel', clubName: p.clubName || 'Pallet FC' },
    });

    if (tela === 'home') return;
    if (tela === 'config') {
        // o convite antigo do Davi já foi visto: o aviso que aparece é o da Ana, que chega agora
        useFriends.setState({ dismissed: ['K7M2QX'] });
        useGame.getState().go('settings');
        return;
    }
    window.history.replaceState(null, '', `${window.location.pathname}?demo=amigos&perfil=amigos`);
    useGame.getState().go('profile');
    const cartao = params.get('cartao');
    if (cartao) usePlayerCard.getState().open(peerInfo({ ...RIVAL, anon: cartao === 'anon' } as unknown as Peer));
}
