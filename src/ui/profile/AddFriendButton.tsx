import { useState } from 'react';
import { useCloud } from '../../cloud/cloud';
import { type AskResult, type AskTarget, friendAction, friendsOnline } from '../../friends/api';
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
 * Botão "Adicionar amigo" do cartão do treinador (o rival do Duelo). `peer` = quem está na sala: o `id` é o da conta
 * dele (o servidor procura o cartão por ele), `anon` = jogando sem conta Google (não dá pra adicionar).
 */
export function AddFriendButton({ peer }: { peer: { id: string; anon?: boolean } }) {
    const { t } = useT();
    const askText = useAskText();
    const user = useCloud((s) => s.user);
    const [state, setState] = useState<'idle' | 'busy' | AskResult>('idle');
    if (!friendsOnline()) return null;
    const blocked = !user ? t('friends.button.needGoogle') : peer.anon ? t('friends.button.rivalAnon') : null;
    const done = typeof state === 'object' && state.status !== 'offline';
    return (
        <div className="fr-addbtn">
            <button
                type="button"
                className="btn confirm"
                disabled={!!blocked || state === 'busy' || done}
                data-testid="add-friend"
                onClick={async () => {
                    setState('busy');
                    const target: AskTarget = { user: peer.id };
                    setState(await friendAction((s) => s.ask(target)));
                }}
            >
                <HudIcon kind={done ? 'check' : 'addFriend'} />{' '}
                {state === 'busy'
                    ? t('friends.button.sending')
                    : !done
                      ? t('friends.button.add')
                      : state.status === 'amigos' || state.status === 'ja_amigos'
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
