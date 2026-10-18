import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startAnalytics } from './analytics/track';
import { startCloudSync } from './cloud/cloud';
import { importFromOldDomain, moveToNewDomain } from './cloud/domain-move';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { startSettingsSync } from './ui/settings-sync';
import './ui/styles.css';
import './ui/broadcast-kit.css';

// erros fora do React (eventos, timers, promessas): só registra no console com prefixo claro, sem esconder nada
window.addEventListener('error', (e) => {
    console.error('[Soccermon] erro não tratado:', e.error ?? e.message, `${e.filename}:${e.lineno}:${e.colno}`);
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('[Soccermon] promessa rejeitada sem tratamento:', e.reason);
});

// endereço antigo (soccermon.vercel.app) leva o jogador e o save para o soccermon.com
void moveToNewDomain();
void importFromOldDomain();

// contas e save na nuvem (só liga se o Supabase estiver configurado)
startCloudSync();
// volume por canal e "reduzir movimento" (Configurações)
startSettingsSync();
// visitas e velocidade (Vercel, sem cookie) e estatísticas anônimas do jogo (Supabase)
if (import.meta.env.PROD) {
    inject();
    injectSpeedInsights();
}
startAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
