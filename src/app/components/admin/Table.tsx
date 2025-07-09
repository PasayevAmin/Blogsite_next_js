import Link from 'next/link';
import React from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: ReadonlyArray<Column<T>>;
  onUpdate?: (id: number) => void; // Yeni əlavə etdik

  onDelete?: (id: number) => void; // Yeni əlavə etdik
}

export default function Table<T extends { id: number }>({
  data,
  columns,
  onUpdate,
  onDelete,
}: TableProps<T>) {
  return (
    <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              className="px-6 py-3 text-left text-sm font-medium text-gray-700"
            >
              {col.label}
            </th>
          ))}
          <th className="px-6 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-t even:bg-gray-50">
            {columns.map((col) => (
              <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-600">
                {col.render ? col.render(row) : String(row[col.key] ?? '')}
              </td>
            ))}
            <td className="px-6 py-4 text-right text-sm space-x-2">
              {/* Edit və Delete */}
              <Link href={`/admin/posts/edit/${row.id}`} className="text-blue-600 hover:underline">
                Edit
              </Link>
              {onDelete && (
                <button
                  onClick={() => onDelete(row.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
