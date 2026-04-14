import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-sage-50">
      <Sidebar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
