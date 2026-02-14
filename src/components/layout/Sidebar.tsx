import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGate } from '@/components/auth/RoleGate';

const linkBase =
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background">
      <div className="p-4 border-b">
        <div className="font-semibold">Admin Dashboard</div>
        <div className="text-xs opacity-70">NestJS + React</div>
      </div>

      <nav className="p-3 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(linkBase, isActive && 'bg-muted')
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            cn(linkBase, isActive && 'bg-muted')
          }
        >
          <Package className="h-4 w-4" />
          Products
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) =>
            cn(linkBase, isActive && 'bg-muted')
          }
        >
          <Tags className="h-4 w-4" />
          Categories
        </NavLink>

        <RoleGate allow={['ADMIN', 'STAFF']}>
          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              cn(linkBase, isActive && 'bg-muted')
            }
          >
            <ScrollText className="h-4 w-4" />
            Audit Logs
          </NavLink>
        </RoleGate>
      </nav>
    </aside>
  );
}
