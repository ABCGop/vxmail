"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Star,
  Archive,
  Trash2,
  AlertOctagon,
  Reply,
  Printer,
  ShieldCheck,
  Eye,
  Paperclip,
  Download,
  Send,
  Maximize2,
  Clock,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";
import { UserAvatar } from "./UserAvatar";
import { LabelChip } from "./LabelChip";
import { format } from "date-fns";

interface MessageItem {
  id: string;
  messageId: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  safeHtmlBody?: string;
  sentAt: string;
  dkimVerified: boolean;
  spfVerified: boolean;
  deliveryStatus: string;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    storageKey?: string;
  }>;
}

interface ThreadDetail {
  id: string;
  subject: string;
  isStarred: boolean;
  isImportant: boolean;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  messages: MessageItem[];
}

interface ThreadViewProps {
  threadId: string;
  onBack: () => void;
}

export function ThreadView({ threadId, onBack }: ThreadViewProps) {
  const { openCompose, addToast, refreshThreads, user } = useMail();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRemoteImages, setShowRemoteImages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadThread() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/mail/threads/${threadId}`);
        if (res.ok) {
          const data = await res.json();
          setThread(data);
          const expanded: Record<string, boolean> = {};
          data.messages?.forEach((msg: MessageItem, idx: number) => {
            expanded[msg.id] = idx === data.messages.length - 1 || data.messages.length <= 2;
          });
          setExpandedMessages(expanded);
        } else {
          addToast({ title: "Failed to load conversation", type: "error" });
        }
      } catch (err) {
        addToast({ title: "Error fetching thread", type: "error" });
      } finally {
        setIsLoading(false);
      }
    }
    loadThread();
  }, [threadId, addToast]);

  const toggleExpand = (msgId: string) => {
    setExpandedMessages((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleQuickReply = async () => {
    if (!replyText.trim() || !thread || !user) return;

    setIsSendingReply(true);
    const lastMessage = thread.messages[thread.messages.length - 1];

    let recipient = lastMessage.from;
    const match = recipient.match(/<([^>]+)>/);
    if (match) recipient = match[1];

    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: user.mailbox?.emailAddress || user.email,
          to: [recipient],
          subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`,
          textBody: replyText,
          htmlBody: `<p>${replyText.replace(/\n/g, "<br/>")}</p>`,
          threadId: thread.id,
          inReplyTo: lastMessage.messageId,
        }),
      });

      if (res.ok) {
        addToast({ title: "Reply dispatched via Stalwart", type: "success" });
        setReplyText("");
        const updated = await fetch(`/api/mail/threads/${threadId}`).then((r) => r.json());
        setThread(updated);
        refreshThreads();
      } else {
        const err = await res.json();
        addToast({ title: err.error || "Failed to send reply", type: "error" });
      }
    } catch {
      addToast({ title: "Network error sending reply", type: "error" });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handlePopoutReply = () => {
    if (!thread || !user) return;
    const lastMessage = thread.messages[thread.messages.length - 1];
    let recipient = lastMessage.from;
    const match = recipient.match(/<([^>]+)>/);
    if (match) recipient = match[1];

    openCompose({
      to: [recipient],
      subject: thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`,
      body: replyText ? `<p>${replyText.replace(/\n/g, "<br/>")}</p>` : "",
      threadId: thread.id,
      inReplyTo: lastMessage.messageId,
    });
  };

  const handleAction = async (action: string) => {
    try {
      await fetch("/api/mail/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadIds: [threadId],
          action,
        }),
      });
      addToast({ title: `Conversation updated`, type: "success" });
      refreshThreads();
      if (["archive", "trash", "spam"].includes(action)) {
        onBack();
      }
    } catch {
      addToast({ title: "Action failed", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafd] dark:bg-slate-950 text-slate-400">
        <Clock className="w-5 h-5 animate-spin text-sky-600 mr-2" />
        <span className="text-xs font-medium">Loading conversation...</span>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500">
        <p className="text-sm">Conversation not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-medium"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafd] dark:bg-slate-950 overflow-hidden">
      {/* Top Action Toolbar */}
      <div className="h-12 border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to inbox (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => handleAction("archive")}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Archive (E)"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAction("trash")}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete (#)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAction("spam")}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            title="Report Spam"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleAction(thread.isStarred ? "unstar" : "star")}
            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              thread.isStarred ? "text-amber-400" : "text-slate-400 hover:text-slate-700"
            }`}
            title="Star conversation"
          >
            <Star className={`w-4 h-4 ${thread.isStarred ? "fill-amber-400" : ""}`} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
            title="Print conversation"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {/* Subject Header & Labels */}
        <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {thread.subject}
            </h1>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {thread.labels?.map((tl) => (
                <LabelChip key={tl.label.id} name={tl.label.name} color={tl.label.color} size="md" />
              ))}
            </div>
          </div>

          {/* Security Banner */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-xs">
            <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="font-medium text-[11px]">DKIM &bull; SPF Verified &bull; TLS 1.3</span>
            </div>
            {!showRemoteImages && (
              <button
                onClick={() => setShowRemoteImages(true)}
                className="flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-300 font-medium hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show remote images</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Cards Chain */}
        <div className="space-y-3">
          {thread.messages.map((message, idx) => {
            const isExpanded = expandedMessages[message.id] ?? true;
            const fromDisplay = message.from;
            const parsedTo = (() => {
              try {
                return JSON.parse(message.to);
              } catch {
                return [message.to];
              }
            })();

            return (
              <div
                key={message.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-subtle transition-all"
              >
                {/* Message Header Bar */}
                <div
                  onClick={() => toggleExpand(message.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={fromDisplay} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {fromDisplay}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {message.deliveryStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        to: {parsedTo.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {format(new Date(message.sentAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>

                {/* Collapsible Message Content */}
                {isExpanded && (
                  <div className="px-3.5 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {/* Message Body */}
                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans pt-2">
                      {message.htmlBody ? (
                        <div
                          className="prose prose-slate max-w-none text-sm space-y-2"
                          dangerouslySetInnerHTML={{
                            __html: showRemoteImages
                              ? message.htmlBody
                              : message.safeHtmlBody || message.htmlBody,
                          }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.textBody}</p>
                      )}
                    </div>

                    {/* Attachments Tray */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{message.attachments.length} Attachment{message.attachments.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {message.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-sky-500 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{att.filename}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {(att.size / 1024).toFixed(0)} KB &bull; {att.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                                </p>
                              </div>
                              <button
                                onClick={() => addToast({ title: `Downloaded ${att.filename}`, type: "info" })}
                                className="p-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-200 shadow-sm"
                                title="Download attachment"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Inline Reply Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-3 mt-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Reply className="w-4 h-4 text-sky-600" />
              <span>
                Reply as <strong className="text-slate-800 dark:text-white font-medium">{user?.mailbox?.emailAddress}</strong>
              </span>
            </div>
            <button
              onClick={handlePopoutReply}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[11px] transition-colors"
              title="Pop out to full composer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pop out</span>
            </button>
          </div>

          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:bg-white outline-none resize-none transition-colors"
          />

          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleQuickReply}
              disabled={isSendingReply || !replyText.trim()}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingReply ? "Sending..." : "Send Reply"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
