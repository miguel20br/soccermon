/**
 * Botão oficial "Fazer login com o Google" (Google Identity Services). O login acontece direto no site e o
 * Supabase só recebe o token (signInWithIdToken). Assim a tela do Google mostra o Soccermon, e não o endereço
 * do projeto no Supabase, como acontece no login por redirecionamento.
 *
 * Nonce: o Google recebe o hash SHA-256 (hex); o Supabase recebe o valor cru e confere com o que veio no token.
 */

/** Client ID do OAuth (Web) do Google. É público por natureza (vai no HTML de qualquer site com o botão). */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

interface GsiButtonOptions {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill';
    locale?: string;
    width?: number;
}

interface Gsi {
    accounts: {
        id: {
            initialize(o: {
                client_id: string;
                callback: (r: { credential: string }) => void;
                nonce: string;
                use_fedcm_for_prompt?: boolean;
                ux_mode?: 'popup' | 'redirect';
                context?: 'signin' | 'signup' | 'use';
            }): void;
            renderButton(el: HTMLElement, o: GsiButtonOptions): void;
        };
    };
}

declare global {
    interface Window {
        google?: Gsi;
    }
}

let scriptPromise: Promise<Gsi> | null = null;

/** Carrega o script do Google uma vez (só quando o botão aparece, na tela inicial para visitante). */
function loadGsi(): Promise<Gsi> {
    if (window.google?.accounts?.id) return Promise.resolve(window.google);
    scriptPromise ??= new Promise<Gsi>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.onload = () => (window.google ? resolve(window.google) : reject(new Error('GSI sem window.google')));
        s.onerror = () => {
            scriptPromise = null;
            reject(new Error('não carregou o script do Google'));
        };
        document.head.appendChild(s);
    });
    return scriptPromise;
}

async function makeNonce() {
    const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hashed = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return { raw, hashed };
}

/**
 * Desenha o botão do Google em `el`. Quando a pessoa escolhe a conta, chama `onToken(idToken, nonceCru)`.
 * Lança erro se o script do Google não carregar (bloqueador, sem internet): aí use o login por redirecionamento.
 */
export async function renderGoogleButton(
    el: HTMLElement,
    onToken: (idToken: string, rawNonce: string) => void,
    width: number,
) {
    const [gsi, nonce] = await Promise.all([loadGsi(), makeNonce()]);
    gsi.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (r) => onToken(r.credential, nonce.raw),
        nonce: nonce.hashed,
        use_fedcm_for_prompt: true,
        ux_mode: 'popup',
        context: 'signin',
    });
    el.replaceChildren();
    gsi.accounts.id.renderButton(el, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        locale: 'pt-BR',
        width,
    });
}
