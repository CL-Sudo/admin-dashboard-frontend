import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';

export default function StatusBadge({ value }: { value: string }) {
  const v = value.toUpperCase();

  const variant =
    v === 'ACTIVE'
      ? 'default'
      : v === 'DRAFT'
        ? 'secondary'
        : 'outline';

  return (
    <Badge variant={variant as BadgeProps['variant']}>{v}</Badge>
  );
}
