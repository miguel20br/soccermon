import { create } from 'zustand';

/**
 * Jogo instalável (PWA, 26/10): o Chrome do Android avisa que dá pra instalar (`beforeinstallprompt`) e a gente guarda
 * o aviso pra abrir no botão "Instalar" das Configurações. No iPhone não existe o aviso: lá vai a dica de Compartilhar
 * › Adicionar à Tela de Início. Aberto como app (`display-mode: standalone`), o botão some.
 */
interface InstallPrompt extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useInstall = create<{ prompt: InstallPrompt | null; installed: boolean }>(() => ({
    prompt: null,
    installed: false,
}));

const standalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhone/iPad no navegador (sem o aviso de instalar). */
export const iosBrowser = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone();

export function startInstall() {
    useInstall.setState({ installed: standalone() });
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        useInstall.setState({ prompt: e as InstallPrompt });
    });
    window.addEventListener('appinstalled', () => useInstall.setState({ prompt: null, installed: true }));
}

export async function promptInstall() {
    const p = useInstall.getState().prompt;
    if (!p) return;
    await p.prompt();
    const { outcome } = await p.userChoice;
    useInstall.setState({ prompt: null, installed: outcome === 'accepted' });
}
