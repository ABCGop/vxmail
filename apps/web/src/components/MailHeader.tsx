"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Settings,
  Shield,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Menu,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";
import { SearchBar } from "./SearchBar";
import { NotificationCenter } from "./NotificationCenter";
import { UserAvatar } from "./UserAvatar";

export function MailHeader() {
  const {
    user,
    theme,
    setTheme,
    setIsShortcutsOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useMail();
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("slate");
    } else if (theme === "slate") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-30 transition-colors">
      {/* Mobile Toggle & Search Input */}
      <div className="flex items-center gap-2 flex-1 max-w-2xl min-w-0">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <SearchBar />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Cycler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Theme: ${theme.toUpperCase()} (Click to change)`}
        >
          {theme === "light" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-sky-400" />
          )}
        </button>

        {/* Notifications */}
        <NotificationCenter />

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <UserAvatar name={user?.displayName || "VxUser"} avatarUrl={user?.avatarUrl} size="sm" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                {user?.displayName || "Alex"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-dropdown z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.displayName}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">{user?.mailbox?.emailAddress}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {user?.role || "USER"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">vxmusic.in</span>
                </div>
              </div>

              {/* Aliases List */}
              {user?.mailbox?.aliases && user.mailbox.aliases.length > 0 && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Aliases
                  </span>
                  <div className="space-y-1">
                    {user.mailbox.aliases.map((al) => (
                      <div key={al.id} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{al.aliasAddress}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-1">
                {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors font-medium"
                  >
                    <Shield className="w-4 h-4 text-sky-600" />
                    <span>Admin Console</span>
                  </Link>
                ) : null}

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Preferences</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
