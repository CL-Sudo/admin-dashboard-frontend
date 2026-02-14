import { useNavigate } from 'react-router-dom';
import { authStore } from '@/features/auth/auth.store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Topbar() {
  const nav = useNavigate();
  const user = authStore.getUser();

  const logout = () => {
    authStore.logout();
    nav('/login', { replace: true });
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-6">
      <div className="text-sm opacity-80">Enterprise scaffold</div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {user?.email ?? 'Account'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => nav('/')}>
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
