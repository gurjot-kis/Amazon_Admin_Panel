import React, { useMemo, useRef, useState } from "react";
import { HiChevronDown, HiSearch, HiTag } from "react-icons/hi";
import { HiCheck } from "react-icons/hi2";
import type { PreLeafCategory } from "../utils/addSlotTypes";

interface CategorySelectProps {
  options: PreLeafCategory[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  errored?: boolean;
  invalid?: boolean;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const imgSrc = (path: string): string | null =>
  path
    ? path.startsWith("http")
      ? path
      : `${BASE_URL}/${path.replace(/^\//, "")}`
    : null;

const CategorySelect: React.FC<CategorySelectProps> = ({
  options,
  value,
  onChange,
  loading,
  errored,
  invalid,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.parentName?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = useMemo(
    () => options.find((o) => o._id === value),
    [options, value],
  );

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading) return <div className="as-cat-status">Loading categories…</div>;
  if (errored)
    return (
      <div className="as-field-error">
        Couldn't load categories. Refresh the page.
      </div>
    );

  return (
    <div className={`as-cat-root ${invalid ? "is-invalid" : ""}`} ref={ref}>
      <button
        type="button"
        className={`as-picker-trigger ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            {imgSrc(selected.category_image) && (
              <img
                src={imgSrc(selected.category_image)!}
                alt=""
                className="as-cat-trigger-img"
              />
            )}
            <span className="as-picker-value">{selected.name}</span>
            {selected.parentName && (
              <span className="as-cat-trigger-parent">
                {selected.parentName}
              </span>
            )}
          </>
        ) : (
          <>
            <HiTag className="as-picker-icon" />
            <span className="as-picker-placeholder">
              Select a service category
            </span>
          </>
        )}
        <HiChevronDown
          className={`as-picker-chevron ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="as-cat-dropdown" role="listbox">
          <div className="as-cat-search-wrap">
            <HiSearch className="as-cat-search-icon" />
            <input
              autoFocus
              type="text"
              placeholder="Search categories…"
              className="as-cat-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="as-cat-search-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="as-cat-grid">
              {filtered.map((opt) => {
                const isSel = opt._id === value;
                const src = imgSrc(opt.category_image);
                return (
                  <button
                    key={opt._id}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    className={`as-cat-card ${isSel ? "is-selected" : ""}`}
                    onClick={() => {
                      onChange(opt._id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="as-cat-card-img-wrap">
                      {src ? (
                        <img
                          src={src}
                          alt={opt.name}
                          className="as-cat-card-img"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`as-cat-card-img-fallback ${src ? "hidden" : ""}`}
                      >
                        <HiTag size={22} />
                      </div>
                      {isSel && (
                        <div className="as-cat-card-check">
                          <HiCheck size={12} />
                        </div>
                      )}
                    </div>
                    <div className="as-cat-card-body">
                      {opt.parentName && (
                        <p className="as-cat-card-parent">{opt.parentName}</p>
                      )}
                      <p className="as-cat-card-name">{opt.name}</p>
                      <span className="as-cat-card-level">L{opt.level}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="as-cat-empty">No matching categories</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
