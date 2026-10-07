import { ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
}

export function AdminDataTable<T extends { id?: string; _id?: string }>({
  columns,
  data,
  loading = false,
  search,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  actions,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  emptyAction,
  pagination,
}: AdminDataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition-colors">
      {/* Table Toolbar */}
      {(onSearchChange || filters || actions) && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onSearchChange && (
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            )}
            {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-5 py-4">
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl mb-3">
                      <Inbox className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200">{emptyTitle}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">{emptyDescription}</p>
                    {emptyAction && <div className="mt-4">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || (row as any)._id || rIdx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-5 py-4 ${col.className || ''}`}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? (row[col.accessor] as unknown as ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/50">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}
            </span>{' '}
            of <span className="font-semibold text-slate-900 dark:text-slate-200">{pagination.totalItems}</span> results
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
              {pagination.currentPage} / {pagination.totalPages}
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
