import React, { useRef, useState } from "react";
import {
  HiCalendar,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { DAYS, MONTHS } from "../utils/addSlotUtils";

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  invalid?: boolean;
  onBlur?: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  invalid,
  onBlur,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();

  const [viewYear, setViewYear] = useState(
    value ? parseInt(value.split("-")[0]) : today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    value ? parseInt(value.split("-")[1]) - 1 : today.getMonth(),
  );

  const minDate = min ? new Date(min + "T00:00:00") : null;
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(d);
    setOpen(false);
    onBlur?.();
  };

  const isDisabled = (day: number) =>
    minDate ? new Date(viewYear, viewMonth, day) < minDate : false;

  const isSelected = (day: number) =>
    value ===
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={`as-picker-root ${invalid ? "is-invalid" : ""}`} ref={ref}>
      <button
        type="button"
        className={`as-picker-trigger ${open ? "is-open" : ""} ${invalid ? "is-invalid" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <HiCalendar className="as-picker-icon" />
        <span
          className={displayValue ? "as-picker-value" : "as-picker-placeholder"}
        >
          {displayValue ?? "Select a date"}
        </span>
        <HiChevronDown
          className={`as-picker-chevron ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="as-calendar-popup">
          <div className="as-cal-header">
            <button type="button" className="as-cal-nav" onClick={prevMonth}>
              <HiChevronLeft />
            </button>
            <span className="as-cal-month">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className="as-cal-nav" onClick={nextMonth}>
              <HiChevronRight />
            </button>
          </div>
          <div className="as-cal-grid">
            {DAYS.map((d) => (
              <div key={d} className="as-cal-day-label">
                {d}
              </div>
            ))}
            {cells.map((day, i) =>
              day === null ? (
                <div key={`e-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled(day)}
                  className={`as-cal-day ${isSelected(day) ? "selected" : ""} ${isToday(day) ? "today" : ""} ${isDisabled(day) ? "disabled" : ""}`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
