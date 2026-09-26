"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertOctagon,
  Star,
  Archive,
  Plus,
  PenSquare,
  HardDrive,
  Radio,
  X,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";

export function MailSidebar() {
  const {
    user,
    activeFolder,
    setActiveFolder,
    activeLabel,
    setActiveLabel,
    openCompose,
    addToast,
    refreshThreads,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useMail();

  const [isAddLabelOpen, setIsAddLabelOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#0284c7");

  const unreadCount = user?.counts?.inboxUnread ?? 0;
  const draftsCount = user?.counts?.drafts ?? 0;

  const folderNav = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: unreadCount },
    { id: "starred", label: "Starred", icon: Star },
    { id: "sent", label: "Sent", icon: Send },
    { id: "drafts", label: "Drafts", icon: FileText, count: draftsCount },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "spam", label: "Spam", icon: AlertOctagon },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      });

      if (res.ok) {
        addToast({ title: `Label "${newLabelName}" created`, type: "success" });
        setNewLabelName("");
        setIsAddLabelOpen(false);
        refreshThreads();
      } else {
        addToast({ title: "Failed to create label", type: "error" });
      }
    } catch {
      addToast({ title: "Error creating label", type: "error" });
    }
  };

  const handleFolderClick = (folderId: string) => {
    setActiveLabel(undefined);
    setActiveFolder(folderId);
    setIsMobileSidebarOpen(false);
  };

  const handleLabelClick = (labelName: string, isSelected: boolean) => {
    if (isSelected) {
      setActiveLabel(undefined);
      setActiveFolder("inbox");
    } else {
      setActiveLabel(labelName);
      setActiveFolder("all");
    }
    setIsMobileSidebarOpen(false);
  };

  // Quota calculation (15 GB = 16106127360 bytes)
  const quotaBytes = Number(user?.mailbox?.storageQuota || 16106127360);
  const usedBytes = Number(user?.mailbox?.storageUsed || 48234496);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const quotaGB = (quotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const usagePercentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) || 1;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 select-none h-full transition-transform duration-200 ease-in-out md:static md:w-60 md:translate-x-0 md:bg-[#f8fafd] ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800">
          <Link
            href="/inbox"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm group-hover:bg-sky-500 transition-colors">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">VxMail</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">vxmusic.in</p>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white md:hidden"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compose Button */}
        <div className="p-3">
          <button
            onClick={() => {
              openCompose();
              setIsMobileSidebarOpen(false);
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-between shadow-sm hover:shadow transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <PenSquare className="w-4 h-4 text-white transition-transform group-hover:rotate-6" />
              <span>Compose</span>
            </div>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-sky-700/60 text-white/90 font-mono">
              C
            </kbd>
          </button>
        </div>

        {/* Folders Navigation */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 py-1">
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1.5">
            Mailboxes
          </div>

          {folderNav.map((folder) => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id && !activeLabel;

            return (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 md:py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 font-semibold border-l-2 border-sky-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{folder.label}</span>
                </div>

                {folder.count !== undefined && folder.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-full ${
                      folder.id === "inbox"
                        ? "bg-sky-600 text-white"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Labels Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Labels
              </span>
              <button
                onClick={() => setIsAddLabelOpen(!isAddLabelOpen)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                title="Add Label"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Label Form Inline */}
            {isAddLabelOpen && (
              <form onSubmit={handleCreateLabel} className="p-2 my-1.5 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <input
                  type="text"
                  placeholder="Label name..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 mb-2"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {["#0284c7", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewLabelColor(c)}
                        className={`w-3.5 h-3.5 rounded-full transition-transform ${
                          newLabelColor === c ? "scale-125 ring-2 ring-sky-500" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-[11px] font-medium bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-0.5 mt-1">
              {user?.mailbox?.labels && user.mailbox.labels.length > 0 ? (
                user.mailbox.labels.map((lbl) => {
                  const isSelected = activeLabel === lbl.name;
                  return (
                    <button
                      key={lbl.id}
                      onClick={() => handleLabelClick(lbl.name, isSelected)}
                      className={`w-full flex items-center justify-between px-3 py-2 md:py-1.5 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? "bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span className="truncate">{lbl.name}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-[11px] text-slate-400 px-3 py-1 italic">No labels</p>
              )}
            </div>
          </div>
        </div>

        {/* Storage Quota Meter */}
        <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span>Storage</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {usedMB}MB / {quotaGB}GB
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(usagePercentage, 2)}%` }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
