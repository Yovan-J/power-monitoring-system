// frontend/src/App.tsx
import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HistoricalPage } from './components/HistoricalPage';
import { LiveMonitoringPage } from './components/LiveMonitoringPage';
// --- THIS IS THE FIX ---
import { Sidebar } from './components/Sidebar';
import type { Page } from './components/Sidebar';

function getPageTitle(page: Page): string {
    switch (page) {
        case 'overview': return 'Campus Overview';
        case 'live': return 'Live Node Monitoring';
        case 'analysis': return 'Historical Analysis';
        default: return 'Dashboard';
    }
}

function App() {
  const [activePage, setActivePage] = useState<Page>('overview');

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200 flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-slate-800 shadow-md p-4">
          <h1 className="text-3xl font-bold">{getPageTitle(activePage)}</h1>
        </header>
        
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {activePage === 'overview' && <Dashboard />}
          {activePage === 'live' && <LiveMonitoringPage />}
          {activePage === 'analysis' && <HistoricalPage />}
        </main>
      </div>
    </div>
  );
}

export default App;