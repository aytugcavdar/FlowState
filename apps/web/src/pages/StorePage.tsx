// ============================================================
// StorePage — Mağaza Sayfası
// Jeton harcanarak tema ve ipucu satın alınan sayfa.
// ============================================================

import { useState } from 'react';
import { useMetaStore } from '../features/meta/model/metaStore';
import { useThemeStore, ThemeId } from '../features/game-board/model/themeStore';
import './StorePage.css';

interface StoreItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    type: 'theme' | 'hint';
    themeId?: ThemeId;
}

const STORE_ITEMS: StoreItem[] = [
    {
        id: 'theme-plumber',
        name: 'Tesisatçı Teması',
        description: 'Klasik boru bulmacası görünümü.',
        price: 500,
        icon: '🔧',
        type: 'theme',
        themeId: 'theme-plumber'
    },
    {
        id: 'theme-laser',
        name: 'Lazer Teması',
        description: 'Modern, minimalist ve fütüristik.',
        price: 500,
        icon: '🚀',
        type: 'theme',
        themeId: 'theme-laser'
    },
    {
        id: 'hint-pack',
        name: '3x İpucu Paketi',
        description: 'Zorlandığınız anlarda kullanmak için 3 ipucu.',
        price: 50,
        icon: '💡',
        type: 'hint'
    }
];

export function StorePage() {
    const coins = useMetaStore(s => s.coins);
    const spendCoins = useMetaStore(s => s.spendCoins);
    const unlockedThemes = useThemeStore(s => s.unlockedThemes);
    const unlockTheme = useThemeStore(s => s.unlockTheme);
    const activeTheme = useThemeStore(s => s.activeTheme);
    const setTheme = useThemeStore(s => s.setTheme);
    
    // Add multiple hints function in gameStore 
    // Wait, gameStore currently only has hints used count per puzzle, we need a global hint reserve!
    // We will add global hint reserve to metaStore.
    const addHints = useMetaStore(s => s.addHints || (() => {})); // Graceful fallback
    const unspentHints = useMetaStore(s => s.unspentHints || 0);

    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

    const handlePurchase = (item: StoreItem) => {
        setPurchaseError(null);
        setPurchaseSuccess(null);

        if (coins < item.price) {
            setPurchaseError('Yetersiz Jeton!');
            setTimeout(() => setPurchaseError(null), 2000);
            return;
        }

        if (item.type === 'theme' && item.themeId) {
            if (unlockedThemes.includes(item.themeId)) {
                // Zaten alınmış, sadece kuşan
                setTheme(item.themeId);
                return;
            }
            spendCoins(item.price);
            unlockTheme(item.themeId);
            setTheme(item.themeId);
            setPurchaseSuccess(`${item.name} satın alındı ve kuşandı!`);
        } else if (item.type === 'hint') {
            spendCoins(item.price);
            if (addHints) addHints(3);
            setPurchaseSuccess('3 İpucu satın alındı!');
        }

        setTimeout(() => setPurchaseSuccess(null), 3000);
    };

    return (
        <div className="store-page animate-fade-in" id="store-page">
            <div className="store-header">
                <h1>🛒 Mağaza</h1>
                <div className="store-balance glass-panel">
                    <span className="balance-icon">🪙</span>
                    <span className="balance-amount">{coins}</span>
                </div>
            </div>

            {(purchaseError || purchaseSuccess) && (
                <div className={`store-toast ${purchaseError ? 'toast-error' : 'toast-success'}`}>
                    {purchaseError || purchaseSuccess}
                </div>
            )}

            <div className="store-hints-info glass-panel">
                <span>Sahip olduğunuz İpuçları: <strong>{unspentHints}</strong></span>
            </div>

            <div className="store-grid">
                {STORE_ITEMS.map((item) => {
                    const isTheme = item.type === 'theme';
                    const isUnlocked = isTheme && item.themeId ? unlockedThemes.includes(item.themeId) : false;
                    const isActive = isTheme && item.themeId === activeTheme;

                    let buttonText = `${item.price} 🪙`;
                    if (isUnlocked) buttonText = isActive ? 'Kuşanıldı' : 'Kuşan';

                    return (
                        <div key={item.id} className={`store-card glass-panel ${isActive ? 'active-theme' : ''}`}>
                            <div className="store-card-icon">{item.icon}</div>
                            <h3 className="store-card-title">{item.name}</h3>
                            <p className="store-card-desc">{item.description}</p>
                            
                            <button 
                                className={`btn store-buy-btn ${isUnlocked ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={() => handlePurchase(item)}
                                disabled={isActive || (!isUnlocked && coins < item.price)}
                            >
                                {buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
