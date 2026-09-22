import { useState } from "react";
import type {
  DataTableColumn,
  DataTableFilter,
  DataTablePaginationInfo,
  DataTableStatPill,
} from "./DataTable.types";
import "../../../styles/DataTable.css";

/* ---------- small internal icons ---------- */

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`dt-chevron ${expanded ? "dt-chevron--open" : ""}`}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path
      d="M21 21l-4.3-4.3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------- reusable status toggle (used inside a column's render) ---------- */

export const DataTableStatusToggle = ({
  active,
  isUpdating,
  onChange,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  isUpdating?: boolean;
  onChange: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    disabled={isUpdating}
    className={`dt-switch ${active ? "dt-switch--on" : "dt-switch--off"} ${isUpdating ? "dt-switch--busy" : ""}`}
    onClick={onChange}
  >
    <span className="dt-switch-track">
      <span className="dt-switch-thumb" />
    </span>
    <span className="dt-switch-label">
      {/* {isUpdating ? "…" : active ? activeLabel : inactiveLabel} */}
      {active ? activeLabel : inactiveLabel}
    </span>
  </button>
);

/* ---------- pagination window helper, e.g. [1,'…',4,5,6,'…',12] ---------- */

export const buildPageWindow = (
  current: number,
  totalPages: number,
): (number | "…")[] => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([
    1,
    totalPages,
    current,
    current - 1,
    current + 1,
  ]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push("…");
    result.push(page);
  });
  return result;
};

/* ---------- tree flattening for expand/collapse rows ---------- */

interface FlatRow<T> {
  item: T;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

function flattenTree<T>(
  items: T[],
  depth: number,
  getId: (item: T) => string,
  getChildren: ((item: T) => T[] | undefined) | undefined,
  expandedIds: Set<string>,
): FlatRow<T>[] {
  const rows: FlatRow<T>[] = [];
  items.forEach((item) => {
    const children = getChildren?.(item);
    const hasChildren = Boolean(children?.length);
    const isExpanded = expandedIds.has(getId(item));
    rows.push({ item, depth, hasChildren, isExpanded });
    if (hasChildren && isExpanded) {
      rows.push(
        ...flattenTree(children!, depth + 1, getId, getChildren, expandedIds),
      );
    }
  });
  return rows;
}

/* ---------- main component ---------- */

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getId: (item: T) => string;
  getChildren?: (item: T) => T[] | undefined;

  title?: string;
  statPills?: DataTableStatPill[];

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  filters?: DataTableFilter[];

  addButtonLabel?: string;
  onAddClick?: () => void;

  headerExtra?: React.ReactNode;

  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  skeletonRows?: number;

  pagination?: DataTablePaginationInfo;
  onPageChange?: (page: number) => void;

  rowClassName?: (item: T, depth: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  getId,
  getChildren,
  title,
  statPills,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  addButtonLabel,
  onAddClick,
  headerExtra,
  isLoading,
  isFetching,
  isError,
  errorMessage = "Something went wrong.",
  onRetry,
  emptyMessage = "No records found.",
  skeletonRows = 10,
  pagination,
  onPageChange,
  rowClassName,
}: DataTableProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // const [expandedIds, setExpandedIds] = useState<Set<string>>(
  //   () => new Set(data.map(getId)),
  // );

  const toggleRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rows = flattenTree(data, 0, getId, getChildren, expandedIds);

  const rangeStart = pagination
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;
  const pageWindow = pagination
    ? buildPageWindow(pagination.page, pagination.totalPages)
    : [];

  const goToPage = (next: number) => {
    if (!pagination || !onPageChange) return;
    if (next < 1 || next > pagination.totalPages) return;
    onPageChange(next);
  };

  const showHeader =
    title ||
    statPills?.length ||
    onSearchChange ||
    filters?.length ||
    onAddClick ||
    headerExtra;

  return (
    <div className="dt-page">
      {showHeader && (
        <div className="card border-0 rounded-3 shadow-sm dt-header-card">
          <div className="card-body p-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                {title && <h1 className="dt-title mb-0">{title}</h1>}
                {statPills && statPills.length > 0 && (
                  <div className="d-flex gap-2 mt-2 flex-wrap">
                    {statPills.map((pill, i) => (
                      <span
                        key={i}
                        className={`dt-stat-pill ${pill.navy ? "dt-stat-pill--navy" : ""}`}
                      >
                        {pill.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2 align-items-center">
                {filters?.map((filter, i) => (
                  <div className="dt-filter-wrap" key={i}>
                    <select
                      className={`form-select dt-filter-select ${filter.className ?? ""}`}
                      value={filter.value}
                      onChange={(e) => filter.onChange(e.target.value)}
                    >
                      {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {onSearchChange && (
                  <div className="dt-search-wrap">
                    <span className="dt-search-icon">
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      className="form-control dt-search-input"
                      value={searchValue ?? ""}
                      onChange={(e) => onSearchChange(e.target.value)}
                    />
                  </div>
                )}

                {headerExtra}

                {onAddClick && (
                  <button
                    type="button"
                    className="dt-create-btn"
                    onClick={onAddClick}
                  >
                    <span className="dt-create-plus">+</span>{" "}
                    {addButtonLabel ?? "Add"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 rounded-3 shadow-sm dt-table-card">
        <div className="dt-table-scroll">
          <table className="dt-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={col.headerClassName}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="dt-row-skeleton">
                    <td colSpan={columns.length}>
                      <div className="dt-skeleton-bar" />
                    </td>
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="dt-state dt-state--error">
                      <p className="mb-2">{errorMessage}</p>
                      {onRetry && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={onRetry}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="dt-state">{emptyMessage}</div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                rows.map(({ item, depth, hasChildren, isExpanded }) => {
                  const id = getId(item);
                  return (
                    <tr
                      key={id}
                      className={`dt-row dt-row--depth-${Math.min(depth, 2)} ${rowClassName?.(item, depth) ?? ""}`}
                    >
                      {columns.map((col) => {
                        const content = col.render(item, depth);
                        if (!col.isPrimary) {
                          return (
                            <td key={col.key} className={col.cellClassName}>
                              {content}
                            </td>
                          );
                        }
                        return (
                          <td key={col.key} className={col.cellClassName}>
                            <div
                              className="dt-name-cell"
                              style={{ paddingLeft: depth * 24 }}
                            >
                              {getChildren &&
                                (hasChildren ? (
                                  <button
                                    type="button"
                                    className="dt-expand-btn"
                                    onClick={() => toggleRow(id)}
                                    aria-label={
                                      isExpanded ? "Collapse" : "Expand"
                                    }
                                  >
                                    <ChevronIcon expanded={isExpanded} />
                                  </button>
                                ) : (
                                  <span className="dt-expand-spacer" />
                                ))}
                              {content}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {isFetching && !isLoading && <div className="dt-refetch-bar" />}

        {pagination && pagination.total > 0 && (
          <div className="dt-pagination">
            <span className="dt-pagination-info">
              Showing <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong>{" "}
              of <strong>{pagination.total}</strong>
            </span>

            <div className="dt-pagination-controls">
              <button
                type="button"
                className="dt-pagination-btn"
                disabled={!pagination.hasPrevPage}
                onClick={() => goToPage(pagination.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </button>

              {pageWindow.map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="dt-pagination-ellipsis"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`dt-pagination-num ${p === pagination.page ? "dt-pagination-num--active" : ""}`}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                className="dt-pagination-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => goToPage(pagination.page + 1)}
                aria-label="Next page"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
