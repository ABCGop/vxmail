"use client";

import React from "react";
import { X, Keyboard } from "lucide-react";
import { useMail } from "@/lib/mail-context";

export function KeyboardShortcutsModal() {
  const { isShortcutsOpen, setIsShortcutsOpen } = useMail();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: "C", description: "Compose email" },
    { key: "/", description: "Search bar" },
    { key: "E", description: "Archive" },
    { key: "S", description: "Star / unstar" },
    { key: "U", description: "Mark unread" },
    { key: "#", description: "Delete to trash" },
    { key: "R", description: "Quick reply" },
    { key: "A", description: "Reply all" },
    { key: "F", description: "Forward" },
    { key: "Esc", description: "Close window" },
    { key: "?", description: "Shortcuts menu" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-modal relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
              <p className="text-[11px] text-slate-400">Standard keystrokes for quick actions</p>
            </div>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3 overflow-y-auto">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
            >
              <span className="text-xs text-slate-600 dark:text-slate-300">{s.description}</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">Press <kbd className="font-mono font-medium">Esc</kbd> anytime to dismiss</p>
        </div>
      </div>
    </div>
  );
}
