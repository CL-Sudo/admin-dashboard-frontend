import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/products';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { search }],
    queryFn: () => getProducts({ search, page: 1, limit: 20 }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Products</CardTitle>
        <Input
          placeholder="Search name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-red-500">Failed to load.</div>}

        {data && (
          <div className="space-y-2">
            {data.data.map(p => (
              <div
                key={p.id}
                className="border rounded p-3 flex justify-between"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm opacity-70">{p.sku}</div>
                </div>
                <div className="text-right">
                  <div>
                    {(p.priceCents / 100).toFixed(2)} {p.currency}
                  </div>
                  <div className="text-sm opacity-70">{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
