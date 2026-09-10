import React, { useState, useRef, useEffect } from "react";
import { HiTag, HiChevronDown, HiX } from "react-icons/hi";
import DatePicker from "../AddSlot/components/DatePicker";
import type { PreLeafCategory } from "../AddSlot/utils/addSlotTypes";
import "../../../../styles/vendor/Slotfilters.css";

/* ─── Types ──────────────────────────────────────────────────────────── */

export type SlotStatusFilter = "available" | "blocked" | "";

export interface SlotFiltersValue {
  category_id: string;
  status: SlotStatusFilter;
  date: string;
}

interface SlotFiltersProps {
  value: SlotFiltersValue;
  onChange: (next: SlotFiltersValue) => void;
  categoryOptions: PreLeafCategory[];
  categoriesLoading?: boolean;
}

/* ─── Status options ─────────────────────────────────────────────────── */

const STATUS_OPTIONS: { value: SlotStatusFilter; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "blocked", label: "Unavailable" },
];

/* ─── Tiny dot for status ─────────────────────────────────────────────── */

const StatusDot: React.FC<{ status: SlotStatusFilter }> = ({ status }) => (
  <span
    className={`sf-status-dot ${
      status === "available"
        ? "sf-status-dot--available"
        : status === "blocked"
          ? "sf-status-dot--unavailable"
          : "sf-status-dot--all"
    }`}
  />
);

/* ─── Category Dropdown ──────────────────────────────────────────────── */

const CategoryDropdown: React.FC<{
  options: PreLeafCategory[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
}> = ({ options, value, onChange, loading }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o._id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="sf-dropdown-root" ref={ref}>
      <button
        type="button"
        className={`sf-dropdown-trigger ${open ? "is-open" : ""} ${value ? "has-value" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <HiTag size={14} className="sf-trigger-icon" aria-hidden="true" />
        <span className="sf-trigger-text">
          {loading ? "Loading…" : selected ? selected.name : "All categories"}
        </span>
        {value ? (
          <span
            className="sf-clear-x"
            role="button"
            tabIndex={0}
            aria-label="Clear category filter"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange("");
                setOpen(false);
              }
            }}
          >
            <HiX size={12} />
          </span>
        ) : (
          <HiChevronDown
            size={14}
            className={`sf-trigger-chevron ${open ? "rotated" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <ul className="sf-dropdown-menu" role="listbox">
          <li
            role="option"
            aria-selected={value === ""}
            className={`sf-dropdown-item sf-dropdown-item--all ${value === "" ? "is-selected" : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <span className="sf-item-label">All categories</span>
          </li>

          {loading && (
            <li className="sf-dropdown-item sf-dropdown-item--disabled">
              Loading…
            </li>
          )}

          {!loading &&
            options.map((opt) => (
              <li
                key={opt._id}
                role="option"
                aria-selected={opt._id === value}
                className={`sf-dropdown-item ${opt._id === value ? "is-selected" : ""}`}
                onClick={() => {
                  onChange(opt._id);
                  setOpen(false);
                }}
              >
                <span className="sf-item-icon-wrap" aria-hidden="true">
                  <HiTag size={12} />
                </span>
                <span className="sf-item-label">{opt.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

/* ─── Status Dropdown ────────────────────────────────────────────────── */

const StatusDropdown: React.FC<{
  value: SlotStatusFilter;
  onChange: (v: SlotStatusFilter) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = STATUS_OPTIONS.find((o) => o.value === value)!;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="sf-dropdown-root" ref={ref}>
      <button
        type="button"
        className={`sf-dropdown-trigger ${open ? "is-open" : ""} ${value ? "has-value" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <StatusDot status={value} />
        <span className="sf-trigger-text">{selected.label}</span>
        {value ? (
          <span
            className="sf-clear-x"
            role="button"
            tabIndex={0}
            aria-label="Clear status filter"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onChange("");
                setOpen(false);
              }
            }}
          >
            <HiX size={12} />
          </span>
        ) : (
          <HiChevronDown
            size={14}
            className={`sf-trigger-chevron ${open ? "rotated" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <ul className="sf-dropdown-menu" role="listbox">
          {STATUS_OPTIONS.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`sf-dropdown-item ${opt.value === value ? "is-selected" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <StatusDot status={opt.value} />
              <span className="sf-item-label">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ─── Main SlotFilters ───────────────────────────────────────────────── */

const SlotFilters: React.FC<SlotFiltersProps> = ({
  value,
  onChange,
  categoryOptions,
  categoriesLoading,
}) => {
  const set = (partial: Partial<SlotFiltersValue>) =>
    onChange({ ...value, ...partial });

  const hasAny = value.category_id || value.status || value.date;

  return (
    <div className="sf-root">
      <CategoryDropdown
        options={categoryOptions}
        value={value.category_id}
        onChange={(category_id) => set({ category_id })}
        loading={categoriesLoading}
      />

      <StatusDropdown
        value={value.status}
        onChange={(status) => set({ status })}
      />

      <div className="sf-date-wrap">
        <DatePicker value={value.date} onChange={(date) => set({ date })} />
        {value.date && (
          <button
            type="button"
            className="sf-date-clear"
            aria-label="Clear date filter"
            onClick={() => set({ date: "" })}
          >
            <HiX size={12} />
          </button>
        )}
      </div>

      {hasAny && (
        <button
          type="button"
          className="sf-reset-btn"
          onClick={() => onChange({ category_id: "", status: "", date: "" })}
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default SlotFilters;
