import React, { useRef, useState } from "react";
import { HiChevronDown, HiClock } from "react-icons/hi";

interface TimePickerProps {
  value: string;
  onChange: (val: string) => void;
  invalid?: boolean;
  onBlur?: () => void;
  placeholder?: string;
}

const fmt12 = (h: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
};

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  invalid,
  onBlur,
  placeholder = "HH : MM",
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const selectedHour = value ? parseInt(value.split(":")[0]) : -1;
  const selectedMin = value ? parseInt(value.split(":")[1]) : -1;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const selectTime = (h: number, m: number) =>
    onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

  const handleHour = (h: number) =>
    selectTime(h, selectedMin >= 0 ? selectedMin : 0);

  const handleMin = (m: number) => {
    selectTime(selectedHour >= 0 ? selectedHour : 8, m);
    setOpen(false);
    onBlur?.();
  };

  React.useEffect(() => {
    if (!open) return;
    if (selectedHour >= 0 && hourRef.current) {
      const el = hourRef.current.querySelector(`[data-h="${selectedHour}"]`) as HTMLElement;
      el?.scrollIntoView({ block: "center" });
    }
    if (selectedMin >= 0 && minRef.current) {
      const el = minRef.current.querySelector(`[data-m="${selectedMin}"]`) as HTMLElement;
      el?.scrollIntoView({ block: "center" });
    }
  }, [open]);

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
        <HiClock className="as-picker-icon" />
        <span className={value ? "as-picker-value" : "as-picker-placeholder"}>
          {value || placeholder}
        </span>
        <HiChevronDown className={`as-picker-chevron ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="as-time-popup">
          <div className="as-time-popup-header">
            <span>Hour</span>
            <span>Minute</span>
          </div>
          <div className="as-time-columns">
            <div className="as-time-col" ref={hourRef}>
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-h={h}
                  className={`as-time-opt ${selectedHour === h ? "selected" : ""}`}
                  onClick={() => handleHour(h)}
                >
                  {fmt12(h)}
                </button>
              ))}
            </div>
            <div className="as-time-col" ref={minRef}>
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-m={m}
                  className={`as-time-opt ${selectedMin === m ? "selected" : ""}`}
                  onClick={() => handleMin(m)}
                >
                  :{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          {value && (
            <div className="as-time-popup-footer">
              <span className="as-time-selected-display">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimePicker;