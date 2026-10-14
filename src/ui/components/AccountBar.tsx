import { useState } from 'react';
import { cloudEnabled, signInWithGoogle, signOut, useCloud } from '../../cloud/cloud';

const STATUS_TEXT = {
    off: '',
    guest: '',
    syncing: 'Salvando…',
    saved: 'Salvo na nuvem ✓',
    error: 'Não deu para salvar na nuvem (o jogo continua salvo neste aparelho)',
} as const;

/** Entrar com Google / quem está logado. Some quando o Supabase não está configurado. */
export function AccountBar() {
    const { status, user } = useCloud();
    const [busy, setBusy] = useState(false);
    if (!cloudEnabled) return null;

    if (!user) {
        return (
            <div className="account-bar">
                <button
                    type="button"
                    className="btn google-btn"
                    disabled={busy}
                    onClick={() => {
                        setBusy(true);
                        signInWithGoogle().finally(() => setBusy(false));
                    }}
                >
                    <span className="g-logo" aria-hidden>
                        G
                    </span>
                    Entrar com Google
                </button>
                <span className="muted">Salve sua copa e seus recordes na nuvem e jogue em qualquer aparelho.</span>
            </div>
        );
    }
    return (
        <div className="account-bar signed">
            {user.avatar ? (
                <img className="avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
                <span className="avatar">{user.name.slice(0, 1)}</span>
            )}
            <div className="account-who">
                <b>{user.name}</b>
                <span className={`muted${status === 'error' ? ' error-text' : ''}`}>{STATUS_TEXT[status]}</span>
            </div>
            <button
                type="button"
                className="btn ghost small"
                disabled={busy}
                onClick={() => {
                    setBusy(true);
                    signOut().finally(() => setBusy(false));
                }}
            >
                Sair
            </button>
        </div>
    );
}
