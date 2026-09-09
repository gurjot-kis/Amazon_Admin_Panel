import React from "react";
import { minutesOf } from "../utils/addSlotUtils";

interface TimeRangeBarProps {
  start: string;
  end: string;
}

const TimeRangeBar: React.FC<TimeRangeBarProps> = ({ start, end }) => {
  if (!start || !end) return null;

  const s = minutesOf(start);
  const e = minutesOf(end);
  if (e <= s) return null;

  const dayStart = 7 * 60;
  const dayEnd = 23 * 60;
  const range = dayEnd - dayStart;
  const left = Math.max(0, ((s - dayStart) / range) * 100);
  const width = Math.min(100 - left, ((e - s) / range) * 100);
  const duration = e - s;

  return (
    <div className="as-time-bar-wrap">
      <div className="as-time-bar-track">
        <div
          className="as-time-bar-fill"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <div className="as-time-bar-labels">
        <span>07:00</span>
        <span className="as-time-bar-duration">{duration} min slot</span>
        <span>23:00</span>
      </div>
    </div>
  );
};

export default TimeRangeBar;