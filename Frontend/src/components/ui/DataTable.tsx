import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends { id: number }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Aucune donnée disponible',
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-theme-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-gray-100 last:border-0 dark:border-gray-800 ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                  } transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
