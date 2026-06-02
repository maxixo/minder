import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-sage-50 transition-colors dark:bg-[#0f1712]">
      <Sidebar />
      <main className="w-full px-4 py-6 pb-28 sm:px-6 lg:pb-8 lg:pl-80 lg:pr-8 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
