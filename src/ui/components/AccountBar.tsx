import { useEffect, useRef, useState } from 'react';
import { cloudEnabled, signInWithGoogle, signInWithGoogleToken, signOut, useCloud } from '../../cloud/cloud';
import { GOOGLE_CLIENT_ID, renderGoogleButton } from '../../cloud/google-button';
import { useGame } from '../../store/game-store';
import { trainerLabel, useAvatar } from '../profile/club';

const STATUS_TEXT = {
    off: '',
    guest: '',
    syncing: 'Salvando…',
    saved: 'Salvo na nuvem ✓',
    error: 'Não deu para salvar na nuvem (o jogo continua salvo neste aparelho)',
} as const;

/** Logo "G" do Google (padrão dos botões "Sign in with Google"). */
function GoogleLogo() {
    return (
        <svg className="g-logo" viewBox="0 0 48 48" aria-hidden>
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
        </svg>
    );
}

/** Entrar com Google / quem está logado. Some quando o Supabase não está configurado. */
export function AccountBar() {
    const { status, user } = useCloud();
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    // script do Google bloqueado (bloqueador de anúncio, rede): volta para o login por redirecionamento
    const [gsiFailed, setGsiFailed] = useState(false);
    const gsiRef = useRef<HTMLDivElement>(null);
    const signedIn = !!user;
    const profile = useGame((s) => s.profile);
    const go = useGame((s) => s.go);
    const avatar = useAvatar();

    useEffect(() => {
        const el = gsiRef.current;
        if (!cloudEnabled || signedIn || !GOOGLE_CLIENT_ID || !el) return;
        let alive = true;
        const width = Math.min(260, Math.max(200, el.parentElement?.clientWidth ?? 260));
        renderGoogleButton(
            el,
            (token, nonce) => {
                setBusy(true);
                setFailed(false);
                signInWithGoogleToken(token, nonce).catch(() => {
                    if (!alive) return;
                    setBusy(false);
                    setFailed(true);
                });
            },
            width,
        ).catch(() => alive && setGsiFailed(true));
        return () => {
            alive = false;
        };
    }, [signedIn]);

    if (!cloudEnabled) return null;

    if (!user) {
        return (
            <div className="account-bar">
                {GOOGLE_CLIENT_ID && !gsiFailed ? (
                    // botão oficial: o Google mostra "Soccermon", não o endereço do Supabase
                    <div ref={gsiRef} className="gsi-slot" aria-busy={busy} />
                ) : (
                    <button
                        type="button"
                        className="btn google-btn"
                        disabled={busy}
                        onClick={() => {
                            setBusy(true);
                            setFailed(false);
                            // deu certo: a página vai para o Google (continua ocupado até sair daqui)
                            signInWithGoogle().catch(() => {
                                setBusy(false);
                                setFailed(true);
                            });
                        }}
                    >
                        <GoogleLogo />
                        Entrar com Google
                    </button>
                )}
                <span className={failed ? 'error-text' : 'muted'}>
                    {failed
                        ? 'Não deu para abrir o login do Google. Confira a internet e tente de novo.'
                        : 'Salve sua copa e seus recordes na nuvem e jogue em qualquer aparelho.'}{' '}
                    <a href="privacidade.html" target="_blank" rel="noopener">
                        Privacidade
                    </a>
                </span>
            </div>
        );
    }
    return (
        <div className="account-bar signed">
            <button type="button" className="account-me" onClick={() => go('profile')} title="Abrir o perfil">
                <img
                    className={`avatar${avatar.google ? '' : ' pixel'}`}
                    src={avatar.src}
                    alt=""
                    referrerPolicy="no-referrer"
                />
                <span className="account-who">
                    <b>{trainerLabel(profile, user.name)}</b>
                    <span className={`muted${status === 'error' ? ' error-text' : ''}`}>{STATUS_TEXT[status]}</span>
                </span>
            </button>
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
