import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startCloudSync } from './cloud/cloud';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import './ui/styles.css';

// contas e save na nuvem (só liga se o Supabase estiver configurado)
startCloudSync();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
