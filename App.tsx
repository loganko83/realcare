import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { Calculators } from './pages/Calculators';
import { Contract } from './pages/Contract';
import { Subscription } from './pages/Subscription';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');

  const renderScreen = () => {
    switch (currentTab) {
      case 'home': return <Home />;
      case 'calc': return <Calculators />;
      case 'contract': return <Contract />;
      case 'subscription': return <Subscription />;
      case 'settings': return <Settings />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
        <main className="h-full overflow-y-auto no-scrollbar">
          {renderScreen()}
        </main>
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    </div>
  );
};

export default App;