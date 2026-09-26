"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, ShieldCheck, Mail } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Sync Agreement Received",
      message: "Marcus Vance sent the signed Netflix sync license contract.",
      type: "SUCCESS",
      read: false,
      createdAt: "10 mins ago",
    },
    {
      id: "2",
      title: "Security Verified",
      message: "Stalwart TLS 1.3 & DKIM keys verified for domain vxmusic.in.",
      type: "SECURITY",
      read: false,
      createdAt: "1 hour ago",
    },
    {
      id: "3",
      title: "Mailbox Storage Quota",
      message: "You are currently using 48.2 MB of 15 GB (0.3%).",
      type: "INFO",
      read: true,
      createdAt: "Yesterday",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-dropdown z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-xs">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-full border border-sky-200 dark:border-sky-800">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-slate-500 hover:text-sky-600 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto mt-1">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`py-2.5 px-2 flex items-start gap-2.5 rounded-lg transition-colors ${
                  item.read ? "opacity-75" : "bg-slate-50/60 dark:bg-slate-800/40"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.type === "SUCCESS" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {item.type === "SECURITY" && <ShieldCheck className="w-4 h-4 text-sky-500" />}
                  {item.type === "INFO" && <Mail className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{item.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono">Realtime updates connected</span>
          </div>
        </div>
      )}
    </div>
  );
}
