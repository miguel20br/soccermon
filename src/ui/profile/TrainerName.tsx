import { useState } from 'react';
import { type FriendRow, friends, friendsOnline, isFriendCode, useFriends } from '../../friends/api';
import { useT } from '../../i18n/react';
import type { Peer } from '../../net/duel-state';
import { useGame } from '../../store/game-store';
import { clubColorHex } from '../../store/profile';
import { friendInfo, type PlayerInfo, peerInfo, usePlayerCard } from './PlayerCard';
import './friends.css';

/**
 * Nome de treinador que abre o perfil dele (ranking, histórico do Duelo, lista e convites de amigo). Abre o cartão do
 * treinador (PlayerCardModal, a sheet que sobe de baixo): amigo = a vitrine com Desafiar; outro = nome e clube com
 * "Adicionar amigo" (a vitrine só amigo lê). O seu nome abre o seu Perfil. Sem código de amigo, fica só o texto.
 */
export interface TrainerRef {
    trainer: string;
    club?: string;
    club_tag?: string;
    club_color?: string;
    /** Código de amigo, quando o dado traz (rankings depois da migração 20261028200000, histórico do Duelo). */
    code?: string | null;
    /** É você. */
    me?: boolean;
}

/** Nome e clube que ninguém trocou: muita gente igual, não dá pra saber quem é pelo nome. */
const DEFAULT_NAMES = (who: TrainerRef) => who.trainer === 'Treinador' || who.club === 'Pallet FC';

/**
 * O código do nome: o que veio no dado. Só quando o dado não traz o campo (`undefined`: fantasma da Liga, histórico
 * antigo do Duelo) procura alguém da sua lista com o mesmo nome e clube (como o headToHead), e nunca com o nome
 * padrão. `null` quer dizer "essa pessoa não tem cartão de amigo": fica só o texto (senão "Treinador / Pallet FC" do
 * ranking abria o perfil de um amigo seu com o mesmo nome, e o Desafiar chamava ele).
 */
export function trainerCode(who: TrainerRef, rows: FriendRow[] | null): string | null {
    if (who.code && isFriendCode(who.code)) return who.code;
    if (who.code !== undefined || !who.club || DEFAULT_NAMES(who)) return null;
    return rows?.find((r) => r.trainer === who.trainer && r.club === who.club)?.code ?? null;
}

/** Quem não é amigo: só o nome e o clube (o que o ranking já mostra), com o botão de pedir amizade. */
export function strangerInfo(who: TrainerRef, code: string): PlayerInfo {
    const base = peerInfo({
        id: '',
        name: who.trainer,
        clubName: who.club ?? '',
        clubTag: who.club_tag ?? '',
        clubColor: clubColorHex(who.club_color),
    } as Peer);
    return { ...base, id: undefined, code, bare: true };
}

export async function openTrainer(who: TrainerRef) {
    if (who.me) {
        useGame.getState().go('profile');
        return;
    }
    const rows = useFriends.getState().rows;
    const code = trainerCode(who, rows);
    if (!code) return;
    const row = rows?.find((r) => r.code === code);
    if (row?.status === 'amigo') usePlayerCard.getState().open(friendInfo(row, await friends().profile(code)));
    else usePlayerCard.getState().open(strangerInfo(row ?? who, code));
}

export function TrainerName({ who }: { who: TrainerRef }) {
    const { t } = useT();
    const rows = useFriends((s) => s.rows);
    const [busy, setBusy] = useState(false);
    if (!who.me && !(friendsOnline() && trainerCode(who, rows))) return <>{who.trainer}</>;
    return (
        <button
            type="button"
            className="trainer-link"
            aria-busy={busy}
            aria-label={t('profile.card.openAria', { name: who.trainer })}
            data-testid="trainer-link"
            onClick={async (e) => {
                e.stopPropagation();
                if (busy) return;
                setBusy(true);
                try {
                    await openTrainer(who);
                } finally {
                    setBusy(false);
                }
            }}
        >
            {who.trainer}
        </button>
    );
}
