import { Badge } from '@/components/ui/badge';
import type { UserStatus } from '@/api/users';

export default function UserStatusBadge({
  status,
}: {
  status: UserStatus;
}) {
  const variant = status === 'ACTIVE' ? 'default' : 'outline';
  return <Badge variant={variant as any}>{status}</Badge>;
}
