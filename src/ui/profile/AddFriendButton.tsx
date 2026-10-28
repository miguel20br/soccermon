import { useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { type AskResult, type AskTarget, friendAction, friendsOnline, useFriends } from '../../friends/api';
import type { TKey } from '../../i18n';
import { useT } from '../../i18n/react';
import { HudIcon } from '../components/MatchHud';
import './friends.css';

/** Texto do resultado de um pedido ("Pedido enviado pra Davi."). */
export function useAskText() {
    const { t } = useT();
    return (r: AskResult) => t(`friends.ask.${r.status}` as TKey, { name: r.trainer ?? '' });
}

/**
 * Botão "Adicionar amigo" do cartão do treinador. `peer.id` = a conta de quem está na sala do Duelo (o servidor procura
 * o cartão por ela); sem id, pelo código de amigo (ranking, histórico). `anon` = jogando sem conta Google. Com o código,
 * a sua lista diz se o pedido já foi (fica marcado) ou se ele te pediu (o botão vira Aceitar).
 */
export function AddFriendButton({ peer }: { peer: { id?: string; code?: string; anon?: boolean } }) {
    const { t } = useT();
    const askText = useAskText();
    const user = useCloud((s) => s.user);
    const rel = useFriends((s) => (peer.code ? s.rows?.find((r) => r.code === peer.code)?.status : undefined));
    const [state, setState] = useState<'idle' | 'busy' | AskResult>('idle');
    if (!friendsOnline()) return null;
    const blocked = !user ? t('friends.button.needGoogle') : peer.anon ? t('friends.button.rivalAnon') : null;
    const done = (typeof state === 'object' && state.status !== 'offline') || rel === 'enviado' || rel === 'amigo';
    return (
        <div className="fr-addbtn">
            <button
                type="button"
                className="btn confirm"
                disabled={!!blocked || state === 'busy' || done}
                data-testid="add-friend"
                onClick={async () => {
                    setState('busy');
                    const target: AskTarget = peer.id ? { user: peer.id } : { code: peer.code ?? '' };
                    setState(await friendAction((s) => s.ask(target)));
                }}
            >
                <HudIcon kind={done ? 'check' : 'addFriend'} />{' '}
                {state === 'busy'
                    ? t('friends.button.sending')
                    : !done
                      ? rel === 'recebido'
                          ? t('friends.accept')
                          : t('friends.button.add')
                      : rel === 'amigo' ||
                          (typeof state === 'object' && (state.status === 'amigos' || state.status === 'ja_amigos'))
                        ? t('friends.listTitle')
                        : t('friends.sentLine')}
            </button>
            {(blocked || typeof state === 'object') && (
                <small className="fr-hint" role="status">
                    {blocked ?? askText(state as AskResult)}
                </small>
            )}
        </div>
    );
}
