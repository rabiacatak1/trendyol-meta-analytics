import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import MetaAds from './components/MetaAds';
import CombinedAnalytics from './components/CombinedAnalytics';

type Page = 'home' | 'trendyol' | 'meta' | 'combined';

function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { username, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Marketing Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Hello, {username}</span>
            <button
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Select a Platform</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('trendyol')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-orange-500"
          >
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-orange-500 mb-2">Trendyol</h3>
            <p className="text-gray-600 text-sm">
              Influencer Center metrics, brand offers, and revenue reports
            </p>
          </button>

          <button
            onClick={() => onNavigate('meta')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-blue-600 mb-2">Meta Ads</h3>
            <p className="text-gray-600 text-sm">
              Facebook & Instagram ads performance, campaigns, and insights
            </p>
          </button>

          <button
            onClick={() => onNavigate('combined')}
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-purple-600 mb-2">Combined Analytics</h3>
            <p className="text-gray-600 text-sm">
              Link Meta Ads with Trendyol data, calculate ROI & ROAS
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  switch (currentPage) {
    case 'trendyol':
      return <Dashboard onBack={() => setCurrentPage('home')} />;
    case 'meta':
      return <MetaAds onBack={() => setCurrentPage('home')} />;
    case 'combined':
      return <CombinedAnalytics onBack={() => setCurrentPage('home')} />;
    default:
      return <HomePage onNavigate={setCurrentPage} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
