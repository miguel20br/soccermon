import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '../../i18n';
import { useGame } from '../../store/game-store';
import { FEEDBACK_URL } from '../links';

/** Texto do erro para o jogador colar onde quiser (issue, Discussions, mensagem). */
function crashReport(error: Error, stack: string | null): string {
    return [
        `Soccermon ${__APP_VERSION__}`,
        `${t('settings.crash.reportError')}: ${error.message}`,
        `${t('settings.crash.reportPage')}: ${window.location.href}`,
        `${t('settings.crash.reportBrowser')}: ${navigator.userAgent}`,
        error.stack ? `\n${error.stack}` : '',
        stack ? `\n${t('settings.crash.reportComponents')}:${stack}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}

/** Copia texto com a API moderna e cai para o textarea + execCommand em navegadores mais antigos. */
async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand('copy');
            area.remove();
            return ok;
        } catch {
            return false;
        }
    }
}

type CrashState = { error: Error | null; stack: string | null; copied: 'ok' | 'fail' | null };

/**
 * Se uma tela quebrar, mostra um aviso com saída em vez de deixar a página em branco (o React desmonta tudo
 * num erro de renderização). O save não é tocado: voltar ao início ou recarregar mantém a copa.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, CrashState> {
    state: CrashState = { error: null, stack: null, copied: null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[Soccermon] a tela quebrou', error, info.componentStack);
        this.setState({ stack: info.componentStack ?? null });
    }

    private home = () => {
        useGame.getState().go('home');
        this.setState({ error: null, stack: null, copied: null });
    };

    private copy = async () => {
        const { error, stack } = this.state;
        if (!error) return;
        const ok = await copyText(crashReport(error, stack));
        this.setState({ copied: ok ? 'ok' : 'fail' });
    };

    render() {
        const { error, copied } = this.state;
        if (!error) return this.props.children;
        return (
            <div className="app">
                <div className="panel center crash-panel" role="alert">
                    <h2>{t('settings.crash.title')}</h2>
                    <p className="muted">{t('settings.crash.saved')}</p>
                    <div className="row crash-actions">
                        <button type="button" className="btn confirm" onClick={this.home}>
                            {t('settings.crash.home')}
                        </button>
                        <button type="button" className="btn ghost" onClick={() => window.location.reload()}>
                            {t('settings.crash.reload')}
                        </button>
                    </div>
                    <p className="muted crash-detail">
                        {t('settings.crash.ifRepeats')}{' '}
                        <a
                            href="https://github.com/miguel20br/soccermon/issues/new?template=bug.yml"
                            target="_blank"
                            rel="noopener"
                        >
                            {t('settings.crash.tellUs')}
                        </a>{' '}
                        {t('settings.crash.withMessage')} <code>{error.message}</code>
                    </p>
                    <p className="muted crash-detail">
                        {t('settings.crash.noGithub')}{' '}
                        <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                            {t('settings.crash.discussions')}
                        </a>
                        .
                    </p>
                    <div className="row crash-actions">
                        <button type="button" className="btn ghost small" onClick={this.copy}>
                            {t('settings.crash.copy')}
                        </button>
                    </div>
                    {copied && (
                        <p className="muted crash-detail" aria-live="polite">
                            {copied === 'ok' ? t('settings.crash.copied') : t('settings.crash.copyFailed')}
                        </p>
                    )}
                </div>
            </div>
        );
    }
}
