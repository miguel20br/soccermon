import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useGame } from '../../store/game-store';
import { FEEDBACK_URL } from '../links';

/** Texto do erro para o jogador colar onde quiser (issue, Discussions, mensagem). */
function crashReport(error: Error, stack: string | null): string {
    return [
        `Soccermon ${__APP_VERSION__}`,
        `Erro: ${error.message}`,
        `Página: ${window.location.href}`,
        `Navegador: ${navigator.userAgent}`,
        error.stack ? `\n${error.stack}` : '',
        stack ? `\nComponentes:${stack}` : '',
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
                    <h2>Algo deu errado nesta tela</h2>
                    <p className="muted">Sua copa e seus recordes continuam salvos.</p>
                    <div className="row crash-actions">
                        <button type="button" className="btn primary" onClick={this.home}>
                            Voltar ao início
                        </button>
                        <button type="button" className="btn ghost" onClick={() => window.location.reload()}>
                            Recarregar
                        </button>
                    </div>
                    <p className="muted crash-detail">
                        Se continuar acontecendo,{' '}
                        <a
                            href="https://github.com/miguel20br/soccermon/issues/new?template=bug.yml"
                            target="_blank"
                            rel="noopener"
                        >
                            conte pra gente no GitHub
                        </a>{' '}
                        com esta mensagem: <code>{error.message}</code>
                    </p>
                    <p className="muted crash-detail">
                        Sem conta no GitHub?{' '}
                        <a href={FEEDBACK_URL} target="_blank" rel="noopener">
                            Ou mande pelo Discussions
                        </a>
                        .
                    </p>
                    <div className="row crash-actions">
                        <button type="button" className="btn ghost small" onClick={this.copy}>
                            Copiar detalhes do erro
                        </button>
                    </div>
                    {copied && (
                        <p className="muted crash-detail" aria-live="polite">
                            {copied === 'ok'
                                ? 'Copiado! Cole onde quiser.'
                                : 'Não deu pra copiar. Mande um print desta tela.'}
                        </p>
                    )}
                </div>
            </div>
        );
    }
}
