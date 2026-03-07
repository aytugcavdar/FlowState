// ============================================================
// NotFoundPage — 404 sayfası
// ============================================================

import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 80px)',
            gap: '1.5rem', textAlign: 'center', padding: '2rem'
        }} id="not-found-page">
            <div style={{ fontSize: '5rem' }}>🔌</div>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--color-cyan)', margin: 0 }}>404</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '320px' }}>
                Bu sayfa bulunamadı. Belki bulmacada kaybolmuş olabilir.
            </p>
            <Link to="/" className="btn btn-primary" id="not-found-home">
                🏠 Ana Sayfaya Dön
            </Link>
        </div>
    );
}
