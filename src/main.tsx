import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startCloudSync } from './cloud/cloud';
import './ui/styles.css';

// contas e save na nuvem (só liga se o Supabase estiver configurado)
startCloudSync();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
