"use client";

import React, { useState } from "react";
import {
  RotateCw,
  Archive,
  Trash2,
  AlertOctagon,
  Mail,
  MailOpen,
  Star,
  Tag,
  AlignJustify,
  List,
  Inbox,
  PenSquare,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";
import { ThreadRow } from "./ThreadRow";

interface ThreadListProps {
  onSelectThread: (threadId: string) => void;
}

export function ThreadList({ onSelectThread }: ThreadListProps) {
  const {
    threads,
    selectedThreadIds,
    toggleSelectThread,
    selectAllThreads,
    executeBulkAction,
    refreshThreads,
    isLoading,
    density,
    setDensity,
    user,
    activeFolder,
    activeLabel,
    setActiveLabel,
    setActiveFolder,
    openCompose,
  } = useMail();

  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const allSelected = threads.length > 0 && selectedThreadIds.length === threads.length;
  const someSelected = selectedThreadIds.length > 0 && !allSelected;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshThreads();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const categories = [
    { id: "all", label: "All Mail", count: undefined },
    { id: "inbox", label: "Primary", count: user?.counts?.inboxUnread },
    { id: "starred", label: "Starred", count: undefined },
    { id: "VxVIP", label: "VIP", isLabel: true },
    { id: "Projects", label: "Projects", isLabel: true },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          {/* Master Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={(e) => selectAllThreads(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-600 focus:ring-sky-500/30 cursor-pointer"
              title="Select all"
            />
          </div>

          {/* Action buttons shown when items are selected */}
          {selectedThreadIds.length > 0 ? (
            <div className="flex items-center gap-0.5 sm:gap-1 pl-2 border-l border-slate-200 dark:border-slate-800 animate-in fade-in duration-100">
              <button
                onClick={() => executeBulkAction("archive")}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Archive (E)"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => executeBulkAction("trash")}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete to Trash (#)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => executeBulkAction("spam")}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors hidden xs:block"
                title="Report Spam"
              >
                <AlertOctagon className="w-4 h-4" />
              </button>
              <button
                onClick={() => executeBulkAction("read")}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Mark as read"
              >
                <MailOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => executeBulkAction("unread")}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden xs:block"
                title="Mark as unread (U)"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                onClick={() => executeBulkAction("star")}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors hidden sm:block"
                title="Star (S)"
              >
                <Star className="w-4 h-4" />
              </button>

              {/* Apply Label Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Apply Label"
                >
                  <Tag className="w-4 h-4" />
                </button>

                {isLabelMenuOpen && user?.mailbox?.labels && (
                  <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-dropdown z-50 animate-in fade-in">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase px-2 py-1 block">
                      Assign Label
                    </span>
                    {user.mailbox.labels.map((lbl) => (
                      <button
                        key={lbl.id}
                        onClick={() => {
                          executeBulkAction("addLabel", lbl.id);
                          setIsLabelMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lbl.color }} />
                        <span className="truncate">{lbl.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-xs text-slate-500 font-mono ml-2 hidden sm:inline">
                {selectedThreadIds.length} selected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleRefresh}
                className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isRefreshing ? "animate-spin text-sky-600" : ""
                }`}
                title="Refresh inbox"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Synced</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Toolbar Controls: Density Toggle & Counter */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setDensity("comfortable")}
              className={`p-1 rounded text-xs transition-colors ${
                density === "comfortable"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              title="Comfortable Density"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={`p-1 rounded text-xs transition-colors ${
                density === "compact"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              title="Compact Density"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {threads.length} {threads.length === 1 ? "thread" : "threads"}
          </span>
        </div>
      </div>

      {/* Category Pills Bar (Horizontal Scrollable on all screen sizes) */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
        {categories.map((cat) => {
          const isActive = cat.isLabel
            ? activeLabel === cat.id
            : activeFolder === cat.id && !activeLabel;

          return (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.isLabel) {
                  setActiveLabel(cat.id);
                  setActiveFolder("all");
                } else {
                  setActiveLabel(undefined);
                  setActiveFolder(cat.id);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-sky-600 text-white font-semibold shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700"
              }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && cat.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Threads Scrollable Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <RotateCw className="w-5 h-5 animate-spin text-sky-600" />
            <span className="text-xs font-medium">Loading conversations...</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No messages here</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Your {activeLabel ? `label "${activeLabel}"` : activeFolder} is clear.
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              isSelected={selectedThreadIds.includes(thread.id)}
              onSelect={() => toggleSelectThread(thread.id)}
              onClick={() => onSelectThread(thread.id)}
            />
          ))
        )}
      </div>

      {/* Mobile Floating Compose Button */}
      <button
        onClick={() => openCompose()}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-lg flex items-center justify-center md:hidden active:scale-95 transition-all"
        title="Compose email"
      >
        <PenSquare className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
