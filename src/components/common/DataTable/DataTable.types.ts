import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  isPrimary?: boolean;
  render: (item: T, depth: number) => ReactNode;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
  image?: string | null;
  icon?: ReactNode;
  badgeDot?: string;
}

export interface DataTableFilter {
  value: string;
  onChange: (value: string) => void;
  options: DataTableFilterOption[];
  className?: string;
  placeholder?: string;
}

export interface DataTableStatPill {
  label: string;
  navy?: boolean;
}

export interface DataTablePaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DataTableProps<T> {
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