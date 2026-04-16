import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { ColorsPage } from './pages/Colors';
import { OutgoingPage } from './pages/Outgoing';
import { ReturnsPage } from './pages/Returns';
import { ReportsPage } from './pages/Reports';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('ardis_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('ardis_auth', 'true');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UsersPage />;
      case 'colors': return <ColorsPage />;
      case 'outgoing': return <OutgoingPage />;
      case 'returns': return <ReturnsPage />;
      case 'reports': return <ReportsPage />;
      default: return <Dashboard />;
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderPage()}
    </Layout>
  );
}

export default App;
