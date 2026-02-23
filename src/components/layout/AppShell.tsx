import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useEffect } from 'react';
import { authEvents } from '@/features/auth/auth.events';

export default function AppShell() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authEvents.onLogout(() => {
      void navigate('/login', { replace: true });
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
