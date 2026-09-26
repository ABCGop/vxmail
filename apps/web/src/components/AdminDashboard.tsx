"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users,
  Mail,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";
import { APP_CONFIG } from "@vxmail/config";

interface AdminData {
  stats: {
    userCount: number;
    mailboxCount: number;
    threadCount: number;
    messageCount: number;
  };
  mailboxes: Array<{
    id: string;
    emailAddress: string;
    status: string;
    storageQuota: string;
    storageUsed: string;
    user: {
      username: string;
      displayName: string;
      role: string;
    };
    aliases: Array<{ aliasAddress: string }>;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    details: string;
    createdAt: string;
    message?: {
      subject: string;
      from: string;
      to: string;
    };
  }>;
  loginAttempts: Array<{
    id: string;
    ipAddress: string;
    identifier: string;
    success: boolean;
    failureReason?: string;
    createdAt: string;
  }>;
}

export function AdminDashboard() {
  const { user, addToast } = useMail();
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "mailboxes" | "queues" | "delivery" | "security">("overview");

  useEffect(() => {
    async function loadAdminData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          addToast({ title: "Admin privileges required", type: "error" });
        }
      } catch {
        addToast({ title: "Failed to load admin metrics", type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, [addToast]);

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafd] dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-600" />
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Administration &bull; {APP_CONFIG.domain}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 hidden sm:inline">Environment:</span>
          <span className="text-sky-700 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-[10px] sm:text-[11px]">
            Stalwart
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="h-11 px-4 sm:px-6 border-b border-slate-200/70 dark:border-slate-800 bg-[#f8fafd] dark:bg-slate-900/50 flex items-center gap-2 shrink-0 text-xs overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "mailboxes", label: "Mailboxes", icon: Mail },
          { id: "queues", label: "Queues", icon: Layers },
          { id: "delivery", label: "Delivery", icon: CheckCircle2 },
          { id: "security", label: "Security", icon: AlertTriangle },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-6xl w-full mx-auto">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading admin metrics...</span>
          </div>
        ) : (
          <>
            {activeTab === "overview" && data && (
              <div className="space-y-6 animate-in fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Users className="w-4 h-4 text-sky-600" />
                      <span>Total Users</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{data.stats.userCount}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Active Mailboxes</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{data.stats.mailboxCount}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Conversations</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{data.stats.threadCount}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <span>Total Messages</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{data.stats.messageCount}</p>
                  </div>
                </div>

                {/* Mail Server Status Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Server className="w-4 h-4 text-emerald-600" />
                      <span>Stalwart Mail Infrastructure Health</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono border border-emerald-200 dark:border-emerald-800">
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">INBOUND MX</span>
                      <span className="font-semibold">mail.vxmusic.in (Port 25)</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">SUBMISSION SMTP</span>
                      <span className="font-semibold">mail.vxmusic.in (Port 587 STARTTLS)</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">IMAP4 / JMAP</span>
                      <span className="font-semibold">mail.vxmusic.in (Port 993 SSL)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "mailboxes" && data && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Configured Mailboxes</h2>
                  <span className="text-xs text-slate-400 font-mono">{data.mailboxes.length} active</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Address</th>
                        <th className="py-2.5 px-4">User</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Aliases</th>
                        <th className="py-2.5 px-4">Storage Used</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-mono">
                      {data.mailboxes.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{m.emailAddress}</td>
                          <td className="py-3 px-4 font-sans">{m.user?.displayName || m.user?.username}</td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {m.user?.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {m.aliases?.length > 0 ? (
                              <span className="text-[11px] text-sky-600">
                                {m.aliases.map((a) => a.aliasAddress).join(", ")}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {(Number(m.storageUsed) / (1024 * 1024)).toFixed(1)} MB
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "queues" && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Background Queues (BullMQ)</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: "email-send", desc: "Outbound SMTP routing via Stalwart", latency: "12ms", state: "Active" },
                    { name: "email-receive", desc: "Inbound webhook ingestion & thread parser", latency: "8ms", state: "Active" },
                    { name: "attachment-processing", desc: "MIME inspection & storage sync", latency: "24ms", state: "Active" },
                    { name: "notification", desc: "Realtime update broadcast", latency: "4ms", state: "Active" },
                    { name: "search-index", desc: "Fulltext query reindexing", latency: "15ms", state: "Active" },
                    { name: "security", desc: "Rate limiting & anomaly analysis", latency: "6ms", state: "Active" },
                  ].map((q) => (
                    <div key={q.name} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{q.name}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {q.state}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{q.desc}</p>
                      </div>
                      <span className="text-xs font-mono text-slate-400">Latency: {q.latency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "delivery" && data && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Email Delivery Events</h2>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Event</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4">From</th>
                        <th className="py-2.5 px-4">Details</th>
                        <th className="py-2.5 px-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {data.recentEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {evt.eventType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-900 dark:text-white">{evt.message?.subject || "Email"}</td>
                          <td className="py-3 px-4 text-slate-500">{evt.message?.from || "—"}</td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{evt.details}</td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(evt.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "security" && data && (
              <div className="space-y-4 animate-in fade-in">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Security & Login Logs</h2>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Identifier</th>
                        <th className="py-2.5 px-4">IP Address</th>
                        <th className="py-2.5 px-4">Result</th>
                        <th className="py-2.5 px-4">Failure Reason</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {data.loginAttempts.map((la) => (
                        <tr key={la.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                          <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">{la.identifier}</td>
                          <td className="py-3 px-4 text-slate-500">{la.ipAddress}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                la.success
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {la.success ? "SUCCESS" : "FAILED"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{la.failureReason || "—"}</td>
                          <td className="py-3 px-4 text-slate-400">
                            {new Date(la.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
