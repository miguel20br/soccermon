import { createRoot } from 'react-dom/client';
import { useCloud } from '../cloud/cloud';
import { useGame } from '../store/game-store';
import { AddFriendButton } from '../ui/profile/FriendsTab';
import { type AskResult, type FriendRow, type FriendsServer, setFriendsServer } from './api';

/**
 * Servidor de mentira pro `?demo=amigos` (só no dev): lista com amigos, um pedido recebido, um enviado e um desafio
 * do Davi; dá pra adicionar pelo código `CHAR2ZRD` (Gary), aceitar, recusar, remover, bloquear e desafiar (a sala do
 * Duelo é local, sem internet). Mesmas regras do banco no essencial (supabase/migrations/20261020120000_amigos.sql).
 * `&tela=home`: abre na Home (o convite do Davi no cartão do Duelo). `&cartao=1` (ou `anon`): um cartão do treinador de
 * mentira com o botão "Adicionar amigo", como o rival aparece depois de um Duelo.
 */
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const row = (code: string, trainer: string, club: string, color: string, status: FriendRow['status']): FriendRow => ({
    code,
    trainer,
    club,
    club_tag: club.slice(0, 3).toUpperCase(),
    club_color: color,
    status,
    since: ago(60 * 24),
    room: null,
    room_at: null,
});

const KNOWN: Record<string, Omit<FriendRow, 'status' | 'since' | 'room' | 'room_at'>> = {
    CHAR2ZRD: { code: 'CHAR2ZRD', trainer: 'Gary', club: 'Pallet Rival', club_tag: 'RIV', club_color: 'roxo' },
};
const BY_USER: Record<string, (typeof KNOWN)[string]> = {
    'demo-rafa': { code: 'SAFF2RNM', trainer: 'Rafa', club: 'Saffron Mente', club_tag: 'SAF', club_color: 'rosa' },
};

export function startFriendsDemo(params: URLSearchParams) {
    let rows: FriendRow[] = [
        { ...row('VRDN4GRN', 'Davi', 'Viridian Verde', 'verde', 'amigo'), room: 'K7M2QX', room_at: ago(2) },
        row('LVND3RXQ', 'Ana Clara', 'Lavender Assombro', 'roxo', 'amigo'),
        row('PWTR7RCK', 'Gabriel', 'Pewter Rochedo', 'grafite', 'amigo'),
        row('CRLN5BLU', 'Bia', 'Cerulean', 'azul', 'recebido'),
        row('VRML8YLW', 'Lucas', 'Vermilion Voltagem', 'amarelo', 'enviado'),
    ];
    const set = (code: string, status: FriendRow['status'] | null) => {
        rows = rows.filter((r) => r.code !== code);
        const base = Object.values({ ...KNOWN, ...BY_USER }).find((k) => k.code === code) ?? old.get(code);
        if (status && base) rows.push({ ...base, status, since: ago(0), room: null, room_at: null });
    };
    // quem saiu da lista (pra bloquear/desbloquear lembrar o nome)
    const old = new Map(rows.map((r) => [r.code, r]));
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
    };
    setFriendsServer(server);
    useCloud.setState({ user: { name: 'Miguel', avatar: null }, status: 'saved' });
    const p = useGame.getState().profile;
    useGame.setState({
        profile: { ...p, trainerName: p.trainerName || 'Miguel', clubName: p.clubName || 'Pallet FC' },
    });

    const tela = params.get('tela');
    if (tela === 'home') return;
    window.history.replaceState(null, '', `${window.location.pathname}?demo=amigos&perfil=amigos`);
    useGame.getState().go('profile');
    const cartao = params.get('cartao');
    if (cartao) mountCard(cartao === 'anon');
}

/** Cartão do treinador de mentira (o de verdade sai de outra branch): só pra ver o botão no lugar. */
function mountCard(anon: boolean) {
    const host = document.createElement('div');
    host.style.cssText =
        'position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:16px;background:rgb(0 0 0 / 60%)';
    host.addEventListener('click', (e) => e.target === host && host.remove());
    document.body.append(host);
    createRoot(host).render(
        <div
            className="panel bc-surface bc-stripe"
            style={{ width: 'min(100%, 340px)', display: 'grid', gap: 12, padding: 18 }}
        >
            <span className="bc-lbl">Cartão do treinador (de mentira)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'center' }}>
                <img className="pixel" src="assets/cards/65.gif" alt="" style={{ width: 64, height: 64 }} />
                <span style={{ display: 'grid' }}>
                    <b style={{ fontSize: 18 }}>{anon ? 'Visitante' : 'Rafa'}</b>
                    <small className="muted">Saffron Mente · SAF</small>
                </span>
            </div>
            <AddFriendButton peer={{ id: 'demo-rafa', anon }} />
        </div>,
    );
}
