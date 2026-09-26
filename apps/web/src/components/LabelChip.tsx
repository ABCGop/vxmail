"use client";

import React from "react";

interface LabelChipProps {
  name: string;
  color?: string;
  size?: "sm" | "md";
  className?: string;
}

export function LabelChip({ name, color = "#0284c7", size = "sm", className = "" }: LabelChipProps) {
  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        isSm ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      } bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
}
