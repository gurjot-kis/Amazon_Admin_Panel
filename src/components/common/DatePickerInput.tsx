import { useEffect, useRef, useState } from "react";
import "../../styles/Datepicker.css";

interface Props {
  value: string; // "YYYY-MM-DD"
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  minDate?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const today = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
};

const parseVal = (val: string) => {
  if (!val) return null;
  const [y, m, d] = val.split("-").map(Number);
  return { y, m: m - 1, d };
};

const toVal = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

export const DatePickerInput = ({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  hasError = false,
  minDate,
}: Props) => {
  const parsed = parseVal(value);
  const t = today();

  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(parsed?.y ?? t.y);
  const [viewM, setViewM] = useState(parsed?.m ?? t.m);
  const ref = useRef<HTMLDivElement>(null);
  const [openUpward, setOpenUpward] = useState(false);

useEffect(() => {
  if (open && ref.current) {
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const popoverHeight = 320; // approximate
    setOpenUpward(spaceBelow < popoverHeight && spaceAbove > spaceBelow);
  }
}, [open]);

  // sync view when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewY(parsed.y);
      setViewM(parsed.m);
    }
  }, [value]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const minParsed = parseVal(minDate ?? "");

  const isDisabledDay = (y: number, m: number, d: number) => {
    if (!minParsed) return false;
    const cmp =
      y < minParsed.y ||
      (y === minParsed.y && m < minParsed.m) ||
      (y === minParsed.y && m === minParsed.m && d < minParsed.d);
    return cmp;
  };

  const prevMonth = () => {
    if (viewM === 0) {
      setViewM(11);
      setViewY((y) => y - 1);
    } else setViewM((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewM === 11) {
      setViewM(0);
      setViewY((y) => y + 1);
    } else setViewM((m) => m + 1);
  };

  const selectDay = (d: number) => {
    onChange(toVal(viewY, viewM, d));
    setOpen(false);
  };

  const displayValue = parsed
    ? `${String(parsed.d).padStart(2, "0")} ${MONTHS[parsed.m].slice(0, 3)} ${parsed.y}`
    : "";

  const totalDays = daysInMonth(viewY, viewM);
  const startDay = firstDayOfMonth(viewY, viewM);
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div
      className={`dpi-wrap ${disabled ? "dpi-wrap--disabled" : ""}`}
      ref={ref}
    >
      <button
        type="button"
        className={`dpi-trigger ${hasError ? "dpi-trigger--err" : ""} ${open ? "dpi-trigger--open" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span
          className={`dpi-display ${!displayValue ? "dpi-display--placeholder" : ""}`}
        >
          {displayValue || placeholder}
        </span>
        <svg
          className="dpi-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M16 2v4M8 2v4M3 10h18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="dpi-popover"
          style={
            openUpward ? { bottom: "calc(100% + 6px)", top: "auto" } : undefined
          }
        >
          {/* Header */}
          <div className="dpi-nav">
            <button type="button" className="dpi-nav-btn" onClick={prevMonth}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="dpi-month-label">
              {MONTHS[viewM]} {viewY}
            </span>
            <button type="button" className="dpi-nav-btn" onClick={nextMonth}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="dpi-day-labels">
            {DAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Cells */}
          <div className="dpi-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={`e-${i}`} />;
              const isToday = d === t.d && viewM === t.m && viewY === t.y;
              const isSelected =
                parsed &&
                d === parsed.d &&
                viewM === parsed.m &&
                viewY === parsed.y;
              const isOff = isDisabledDay(viewY, viewM, d);
              return (
                <button
                  key={d}
                  type="button"
                  className={`dpi-day
                    ${isToday ? "dpi-day--today" : ""}
                    ${isSelected ? "dpi-day--selected" : ""}
                    ${isOff ? "dpi-day--disabled" : ""}
                  `}
                  disabled={isOff}
                  onClick={() => selectDay(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="dpi-footer">
            <button
              type="button"
              className="dpi-today-btn"
              onClick={() => {
                onChange(toVal(t.y, t.m, t.d));
                setOpen(false);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="dpi-clear-btn"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
