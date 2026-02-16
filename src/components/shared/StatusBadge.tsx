import { Badge } from '@/components/ui/badge';

export default function StatusBadge({ value }: { value: string }) {
  const v = value.toUpperCase();

  // Avoid custom colors per your setup; use variants only.
  const variant =
    v === 'ACTIVE'
      ? 'default'
      : v === 'DRAFT'
        ? 'secondary'
        : 'outline';

  return <Badge variant={variant as any}>{v}</Badge>;
}
