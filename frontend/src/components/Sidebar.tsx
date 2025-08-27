// frontend/src/components/Sidebar.tsx
import type { ComponentProps } from 'react';

// Define the pages our app can have
export type Page = 'overview' | 'live' | 'analysis';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

interface NavLinkProps extends ComponentProps<'a'> {
  active?: boolean;
}

function NavLink({ active = false, ...props }: NavLinkProps) {
  const activeClasses = "bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400";
  const inactiveClasses = "hover:bg-slate-200 hover:dark:bg-slate-700";
  return (
    <a 
      className={`block w-full text-left px-4 py-2 rounded-md font-medium cursor-pointer ${active ? activeClasses : inactiveClasses}`} 
      {...props} 
    />
  );
}

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 p-4 shadow-lg flex-col hidden lg:flex">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Navigation</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        <NavLink onClick={() => setActivePage('overview')} active={activePage === 'overview'}>
          Overview
        </NavLink>
        <NavLink onClick={() => setActivePage('live')} active={activePage === 'live'}>
          Live Monitoring
        </NavLink>
        <NavLink onClick={() => setActivePage('analysis')} active={activePage === 'analysis'}>
          Historical Analysis
        </NavLink>
        <NavLink>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}