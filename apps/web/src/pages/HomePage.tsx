// ============================================================
// HomePage — Ana sayfa
// Oyun modlarını seçme ekranı.
// ============================================================

import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore, ThemeId } from '../features/game-board/model/themeStore';
import { useGameStore } from '../features/game-board/model/gameStore';
import './HomePage.css';

export function HomePage() {
    const { activeTheme, setTheme } = useThemeStore();

    const themes: { id: ThemeId; name: string; icon: string }[] = [
        { id: 'theme-cyberpunk', name: 'Cyberpunk', icon: '⚡' },
        { id: 'theme-plumber', name: 'Tesisatçı', icon: '🔧' },
        { id: 'theme-laser', name: 'Lazer', icon: '✨' },
    ];

    const navigate = useNavigate();
    const startTutorialLevel = useGameStore(s => s.startTutorialLevel);

    const handleStartTutorial = (e: React.MouseEvent) => {
        e.preventDefault();
        startTutorialLevel(0);
        navigate('/play');
    };

    return (
        <div className="home-page animate-fade-in" id="home-page">
            {/* ─── Hero Alanı ──────────────────────────────────── */}
            <section className="hero">
                <h1 className="hero-title" id="hero-title">
                    <span className="hero-icon">⚡</span>
                    FlowState
                </h1>
                <p className="hero-subtitle">
                    Tile'ları döndür. Akışları yönlendir. Bulmacayı çöz.
                </p>
            </section>

            {/* ─── Mod Kartları ────────────────────────────────── */}
            <section className="mode-cards" id="mode-cards">
                <a href="#" onClick={handleStartTutorial} className="mode-card glass-panel neon-border" style={{ borderColor: 'var(--color-yellow)' }}>
                    <div className="mode-icon">🎓</div>
                    <h2 className="mode-title" style={{ color: 'var(--color-yellow)' }}>Nasıl Oynanır?</h2>
                    <p className="mode-desc">
                        Yeni başlayanlar için adım adım temel mekanikler, Mixer ve Portal kullanımı rehberi.
                    </p>
                    <span className="badge" style={{ borderColor: 'var(--color-yellow)', color: 'var(--color-yellow)' }}>Eğitim</span>
                </a>

                <Link to="/play" className="mode-card glass-panel neon-border" id="card-daily">
                    <div className="mode-icon">📅</div>
                    <h2 className="mode-title">Günlük Bulmaca</h2>
                    <p className="mode-desc">
                        Her gün yeni bir bulmaca. Dünya genelinde aynı puzzle, en hızlı çözene liderlik tablosu!
                    </p>
                    <span className="badge">Günlük</span>
                </Link>

                <Link to="/practice" className="mode-card glass-panel neon-border" id="card-practice">
                    <div className="mode-icon">🎯</div>
                    <h2 className="mode-title">Pratik Modu</h2>
                    <p className="mode-desc">
                        Sonsuz bulmaca. Izgara boyutu ve zorluk seviyesini seç, kendi hızında çöz.
                    </p>
                    <span className="badge">Sınırsız</span>
                </Link>

                <Link to="/campaign" className="mode-card glass-panel neon-border" id="card-campaign">
                    <div className="mode-icon">🗺️</div>
                    <h2 className="mode-title">Kampanya</h2>
                    <p className="mode-desc">
                        6 dünya, 100 el yapımı seviye. Her dünya yeni bir mekanik tanıtır.
                    </p>
                    <span className="badge">100 Bölüm</span>
                </Link>
            </section>

            {/* ─── Tema Seçici ─────────────────────────────────── */}
            <section className="theme-selector glass-panel neon-border" style={{ marginTop: '2rem', padding: '1.5rem', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-cyan)', margin: 0 }}>🎨 Tema Seçimi</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {themes.map(t => (
                        <button
                            key={t.id}
                            className={`btn ${activeTheme === t.id ? 'btn-primary' : ''}`}
                            onClick={() => setTheme(t.id)}
                            style={{ flex: 1, minWidth: '150px' }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{t.icon}</span> {t.name}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
