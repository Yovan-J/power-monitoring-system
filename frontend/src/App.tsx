// frontend/src/App.tsx
import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { HistoricalPage } from './components/HistoricalPage';
// --- THIS IS THE FIX ---
// We import the 'Page' type separately using 'import type'
import { Sidebar } from './components/Sidebar';
import type { Page } from './components/Sidebar';


function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200 flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-slate-800 shadow-md p-4">
          <h1 className="text-3xl font-bold">
            {activePage === 'dashboard' ? 'Live Power Monitoring' : 'Historical Analysis'}
          </h1>
        </header>
        
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {activePage === 'dashboard' && <Dashboard />}
          {activePage === 'analytics' && <HistoricalPage />}
        </main>
      </div>
    </div>
  );
}

export default App;