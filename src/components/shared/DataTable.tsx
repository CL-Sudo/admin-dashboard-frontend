import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ColumnDef<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  keyFn,
  emptyText = 'No data.',
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  emptyText?: string;
}) {
  return (
    <div className="border rounded-md">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            {columns.map((c, idx) => (
              <TableHead key={idx} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="opacity-70"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(r => (
              <TableRow key={keyFn(r)}>
                {columns.map((c, idx) => (
                  <TableCell key={idx} className={c.className}>
                    {c.cell(r)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
