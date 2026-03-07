// ============================================================
// FlowState — Uygulama giriş noktası
// React ağacını DOM'a bağlar.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './app/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
