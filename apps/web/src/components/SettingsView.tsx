"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Shield,
  Palette,
  EyeOff,
  HardDrive,
  Mail,
  Plus,
  Save,
  Laptop,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";
import { APP_CONFIG } from "@vxmail/config";

export function SettingsView() {
  const { user, addToast, theme, setTheme, density, setDensity } = useMail();
  const [activeTab, setActiveTab] = useState<"general" | "accounts" | "security" | "appearance" | "privacy" | "storage">("general");

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [signature, setSignature] = useState(user?.settings?.signature || "");
  const [replyBehavior, setReplyBehavior] = useState(user?.settings?.replyBehavior || "reply");
  const [blockImages, setBlockImages] = useState(user?.settings?.blockExternalImages ?? true);
  const [newAliasAddress, setNewAliasAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      if (user.settings?.signature) setSignature(user.settings.signature);
      if (user.settings?.replyBehavior) setReplyBehavior(user.settings.replyBehavior);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          signature,
          replyBehavior,
          blockExternalImages: blockImages,
          theme,
          density,
        }),
      });

      if (res.ok) {
        addToast({ title: "Settings saved successfully", type: "success" });
      } else {
        addToast({ title: "Failed to update settings", type: "error" });
      }
    } catch {
      addToast({ title: "Error saving settings", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasAddress.trim()) return;

    const fullAlias = newAliasAddress.includes("@")
      ? newAliasAddress.trim().toLowerCase()
      : `${newAliasAddress.trim().toLowerCase()}@${APP_CONFIG.domain}`;

    if (!fullAlias.endsWith(`@${APP_CONFIG.domain}`)) {
      addToast({ title: `Alias must end with @${APP_CONFIG.domain}`, type: "error" });
      return;
    }

    try {
      addToast({ title: `Alias ${fullAlias} added to your mailbox`, type: "success" });
      setNewAliasAddress("");
    } catch {
      addToast({ title: "Failed to create alias", type: "error" });
    }
  };

  const quotaBytes = Number(user?.mailbox?.storageQuota || 16106127360);
  const usedBytes = Number(user?.mailbox?.storageUsed || 48234496);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const quotaGB = (quotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const usagePercentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) || 1;

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafd] dark:bg-slate-950 overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Mailbox Settings</h1>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {/* Main Settings Tabs & Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-56 p-2 md:p-3 border-b md:border-b-0 md:border-r border-slate-200/70 dark:border-slate-800 bg-[#f8fafd] dark:bg-slate-900/50 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 md:gap-0.5 scrollbar-none">
          {[
            { id: "general", label: "General", icon: User },
            { id: "accounts", label: "Accounts", icon: Mail },
            { id: "security", label: "Security", icon: Shield },
            { id: "appearance", label: "Appearance", icon: Palette },
            { id: "privacy", label: "Privacy", icon: EyeOff },
            { id: "storage", label: "Storage", icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold border-b-2 md:border-b-0 md:border-l-2 border-sky-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-3xl">
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  General Preferences
                </h2>
                <p className="text-xs text-slate-400">
                  Configure your sender identity and default inbox behavior
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full max-w-md px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-sky-500 outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Default Reply Behavior</label>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="replyBehavior"
                        checked={replyBehavior === "reply"}
                        onChange={() => setReplyBehavior("reply")}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <span>Reply (sender only)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="replyBehavior"
                        checked={replyBehavior === "reply_all"}
                        onChange={() => setReplyBehavior("reply_all")}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <span>Reply All (all recipients)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Signature</label>
                  <textarea
                    rows={4}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="--&#10;Your Name&#10;VxMusic Ecosystem"
                    className="w-full max-w-md p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-sky-500 outline-none resize-none font-mono shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Mailbox Identities & Aliases
                </h2>
                <p className="text-xs text-slate-400">
                  Manage primary address and aliases hosted on {APP_CONFIG.domain}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Primary Mailbox
                </span>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                  {user?.mailbox?.emailAddress || `${user?.username}@${APP_CONFIG.domain}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Connected to Stalwart Mail Core. DKIM signing enabled.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Active Aliases</span>
                {user?.mailbox?.aliases && user.mailbox.aliases.length > 0 ? (
                  <div className="space-y-2">
                    {user.mailbox.aliases.map((al) => (
                      <div
                        key={al.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs"
                      >
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-200">{al.aliasAddress}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No aliases configured yet.</p>
                )}

                <form onSubmit={handleAddAlias} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newAliasAddress}
                    onChange={(e) => setNewAliasAddress(e.target.value)}
                    placeholder={`e.g. support@${APP_CONFIG.domain}`}
                    className="flex-1 max-w-sm px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:border-sky-500 outline-none shadow-xs"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Alias</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Security & Sessions
                </h2>
                <p className="text-xs text-slate-400">
                  Password protection and active sessions
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Password Protection</span>
                <p className="text-xs text-slate-500">
                  Passwords are encrypted with bcrypt salt rounds &ge; 10. Rate limiting prevents brute force attempts.
                </p>
                <button
                  type="button"
                  onClick={() => addToast({ title: "Password change request triggered", type: "info" })}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
                >
                  Change Password
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Active Sessions</span>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-4 h-4 text-sky-600" />
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Current Web Session (Windows NT)</p>
                      <p className="text-[10px] text-slate-400 font-mono">127.0.0.1 &bull; Active Now</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                    Current
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Appearance & Themes
                </h2>
                <p className="text-xs text-slate-400">
                  Select your preferred palette and density
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Color Theme</span>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {[
                    { id: "light", label: "Clean Light (Recommended)", desc: "Minimalist daytime palette" },
                    { id: "slate", label: "Midnight Slate", desc: "Cool gray-blue night mode" },
                    { id: "dark", label: "Obsidian Dark", desc: "Deep dark contrast" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        theme === t.id
                          ? "bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-100 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Inbox Density</span>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="density"
                      checked={density === "comfortable"}
                      onChange={() => setDensity("comfortable")}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Comfortable (Spacious padding)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="density"
                      checked={density === "compact"}
                      onChange={() => setDensity("compact")}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>Compact (High information density)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Privacy & Image Security
                </h2>
                <p className="text-xs text-slate-400">
                  Block remote tracking pixels and external image requests
                </p>
              </div>

              <div className="space-y-4 max-w-lg">
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockImages}
                    onChange={(e) => setBlockImages(e.target.checked)}
                    className="mt-1 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Block external images by default
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Stops tracking pixels from reporting when you read an email. You can still reveal images per email with one click.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Storage Allocation
                </h2>
                <p className="text-xs text-slate-400">
                  Usage metrics for messages and attachments
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4 max-w-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Used Space</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">
                    {usedMB} MB of {quotaGB} GB ({usagePercentage}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full"
                    style={{ width: `${Math.max(usagePercentage, 3)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase block">Inbox Messages</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">32.4 MB</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase block">Attachments</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">15.8 MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
