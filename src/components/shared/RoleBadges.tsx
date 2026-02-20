import { Badge } from '@/components/ui/badge';
import type { RoleName } from '@/api/users';

export default function RoleBadges({ roles }: { roles: RoleName[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => (
        <Badge key={r} variant="secondary">
          {r}
        </Badge>
      ))}
    </div>
  );
}
