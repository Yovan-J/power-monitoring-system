// frontend/src/components/Sidebar.tsx
import type { ComponentProps } from 'react'; // <-- The fix is adding the word 'type' here

// Define props for our sidebar navigation links
interface NavLinkProps extends ComponentProps<'a'> {
  active?: boolean;
}

function NavLink({ active = false, ...props }: NavLinkProps) {
  const activeClasses = "bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400";
  const inactiveClasses = "hover:bg-slate-200 hover:dark:bg-slate-700";
  return (
    <a 
      className={`block w-full text-left px-4 py-2 rounded-md font-medium ${active ? activeClasses : inactiveClasses}`} 
      {...props} 
    />
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 p-4 shadow-lg flex-col hidden lg:flex">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Navigation</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        <NavLink href="#" active>
          Dashboard
        </NavLink>
        <NavLink href="#">
          Analytics
        </NavLink>
        <NavLink href="#">
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}