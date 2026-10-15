import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useGame } from '../../store/game-store';

/**
 * Se uma tela quebrar, mostra um aviso com saída em vez de deixar a página em branco (o React desmonta tudo
 * num erro de renderização). O save não é tocado: voltar ao início ou recarregar mantém a copa.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state: { error: Error | null } = { error: null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[Soccermon] a tela quebrou', error, info.componentStack);
    }

    private home = () => {
        useGame.getState().go('home');
        this.setState({ error: null });
    };

    render() {
        const { error } = this.state;
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
                </div>
            </div>
        );
    }
}
