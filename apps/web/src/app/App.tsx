// ============================================================
// App — Uygulama kök bileşeni (v1.5)
// Router, store provider ve genel düzeni içerir.
// ============================================================

import { HashRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Layout } from './Layout';
import { HomePage } from '@/pages/HomePage';
import { GamePage } from '@/pages/GamePage';
import { CampaignPage } from '@/pages/CampaignPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { AchievementsPage } from '@/pages/AchievementsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
    return (
        <Provider store={store}>
            <HashRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/play" element={<GamePage />} />
                        <Route path="/practice" element={<GamePage />} />
                        <Route path="/campaign" element={<CampaignPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/achievements" element={<AchievementsPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </HashRouter>
        </Provider>
    );
}

