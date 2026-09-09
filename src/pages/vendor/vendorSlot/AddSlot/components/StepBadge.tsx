import React from "react";
import { HiCheck } from "react-icons/hi2";

interface StepBadgeProps {
  n: number;
  done: boolean;
}

const StepBadge: React.FC<StepBadgeProps> = ({ n, done }) => (
  <div className={`as-step-badge ${done ? "done" : ""}`}>
    {done ? <HiCheck size={13} /> : n}
  </div>
);

export default StepBadge;