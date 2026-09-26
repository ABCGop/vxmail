"use client";

import React from "react";
import { Star, Paperclip, Archive, Trash2, Mail, MailOpen } from "lucide-react";
import { ThreadItem, useMail } from "@/lib/mail-context";
import { UserAvatar } from "./UserAvatar";
import { LabelChip } from "./LabelChip";
import { format, isToday, isThisYear } from "date-fns";

interface ThreadRowProps {
  thread: ThreadItem;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

export function ThreadRow({ thread, isSelected, onSelect, onClick }: ThreadRowProps) {
  const { density, executeBulkAction } = useMail();
  const isUnread = thread.unreadCount > 0;

  // Extract latest message info
  const latestMessage = thread.messages?.[0];
  const senderRaw = latestMessage?.from || "Unknown";
  // Extract display name from "Name <email@example.com>"
  const senderMatch = senderRaw.match(/^([^<]+)/);
  const senderName = senderMatch ? senderMatch[1].trim().replace(/^["']|["']$/g, "") : senderRaw;

  // Format date display
  const messageDate = new Date(thread.lastMessageAt);
  let dateDisplay = "";
  try {
    if (isToday(messageDate)) {
      dateDisplay = format(messageDate, "h:mm a");
    } else if (isThisYear(messageDate)) {
      dateDisplay = format(messageDate, "MMM d");
    } else {
      dateDisplay = format(messageDate, "M/d/yy");
    }
  } catch {
    dateDisplay = "Recent";
  }

  const hasAttachments =
    latestMessage?.attachments && latestMessage.attachments.length > 0;

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeBulkAction(thread.isStarred ? "unstar" : "star");
  };

  const handleQuickArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeBulkAction("archive");
  };

  const handleQuickTrash = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeBulkAction("trash");
  };

  const handleQuickReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeBulkAction(isUnread ? "read" : "unread");
  };

  const isCompact = density === "compact";

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer transition-colors select-none border-b border-slate-100 dark:border-slate-800/80 ${
        isSelected
          ? "bg-sky-50/90 dark:bg-sky-950/40 hover:bg-sky-100/70 dark:hover:bg-sky-950/60"
          : isUnread
          ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"
          : "bg-[#fafbfe]/70 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-900"
      }`}
    >
      {/* ================= MOBILE VIEW (< 640px) ================= */}
      <div className="flex sm:hidden p-3.5 gap-3 items-start relative">
        {/* Left unread bar indicator */}
        {isUnread && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-600 rounded-r" />
        )}

        {/* Sender Avatar */}
        <div className="shrink-0 mt-0.5">
          <UserAvatar name={senderName} size="md" />
        </div>

        {/* Content Stream */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <span
              className={`text-xs truncate ${
                isUnread
                  ? "font-bold text-slate-900 dark:text-white"
                  : "font-semibold text-slate-700 dark:text-slate-300"
              }`}
            >
              {senderName}
              {thread.messageCount > 1 && (
                <span className="ml-1 text-[10px] text-slate-400 font-mono">
                  ({thread.messageCount})
                </span>
              )}
            </span>
            <span
              className={`text-[10px] font-mono shrink-0 ${
                isUnread ? "text-sky-600 font-semibold" : "text-slate-400"
              }`}
            >
              {dateDisplay}
            </span>
          </div>

          <p
            className={`text-xs mt-0.5 truncate ${
              isUnread
                ? "font-semibold text-slate-900 dark:text-slate-100"
                : "font-medium text-slate-700 dark:text-slate-300"
            }`}
          >
            {thread.subject || "(no subject)"}
          </p>

          {thread.snippet && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {thread.snippet}
            </p>
          )}

          {/* Tags & Attachments */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {hasAttachments && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                <Paperclip className="w-3 h-3 text-slate-400" />
                <span>attachment</span>
              </span>
            )}
            {thread.labels?.map((tl) => (
              <LabelChip key={tl.label.id} name={tl.label.name} color={tl.label.color} size="sm" />
            ))}
          </div>
        </div>

        {/* Star Button */}
        <button
          type="button"
          onClick={handleStarClick}
          className="p-1 shrink-0 text-slate-300 dark:text-slate-600"
        >
          <Star className={`w-4 h-4 ${thread.isStarred ? "text-amber-400 fill-amber-400" : ""}`} />
        </button>
      </div>

      {/* ================= TABLET & DESKTOP VIEW (>= 640px) ================= */}
      <div
        className={`hidden sm:flex items-center ${
          isCompact ? "py-2 px-3 text-xs" : "py-3 px-4 text-sm"
        }`}
      >
        {/* Unread indicator dot */}
        <div className="w-2 mr-2.5 flex justify-center shrink-0">
          {isUnread ? (
            <span className="w-2 h-2 rounded-full bg-sky-600" />
          ) : (
            <span className="w-2 h-2" />
          )}
        </div>

        {/* Checkbox */}
        <div
          className="mr-3 flex items-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-600 focus:ring-sky-500/30 cursor-pointer"
          />
        </div>

        {/* Star Button */}
        <button
          type="button"
          onClick={handleStarClick}
          className={`mr-3 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors ${
            thread.isStarred ? "text-amber-400" : "text-slate-300 dark:text-slate-600 hover:text-slate-500"
          }`}
          title={thread.isStarred ? "Starred" : "Not starred"}
        >
          <Star className={`w-4 h-4 ${thread.isStarred ? "fill-amber-400" : ""}`} />
        </button>

        {/* Sender Avatar */}
        <div className="mr-3 shrink-0">
          <UserAvatar name={senderName} size={isCompact ? "sm" : "md"} />
        </div>

        {/* Sender Display Name */}
        <div
          className={`w-36 sm:w-44 shrink-0 truncate mr-3 ${
            isUnread
              ? "font-bold text-slate-900 dark:text-white"
              : "font-medium text-slate-700 dark:text-slate-300"
          }`}
        >
          <span>{senderName}</span>
          {thread.messageCount > 1 && (
            <span className="ml-1.5 text-xs text-slate-400 font-mono">
              ({thread.messageCount})
            </span>
          )}
        </div>

        {/* Subject & Snippet */}
        <div className="flex-1 min-w-0 flex items-center gap-2 mr-4 overflow-hidden">
          <span
            className={`truncate ${
              isUnread
                ? "font-semibold text-slate-900 dark:text-slate-100"
                : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {thread.subject || "(no subject)"}
          </span>
          {thread.snippet && (
            <span className="text-slate-400 dark:text-slate-500 truncate hidden md:inline text-xs font-normal">
              — {thread.snippet}
            </span>
          )}
        </div>

        {/* Labels */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 mr-3">
          {thread.labels?.map((tl) => (
            <LabelChip key={tl.label.id} name={tl.label.name} color={tl.label.color} size="sm" />
          ))}
        </div>

        {/* Attachment Icon */}
        {hasAttachments && (
          <div className="mr-3 text-slate-400 shrink-0" title="Has attachment">
            <Paperclip className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Date Display (visible by default) */}
        <div
          className={`text-xs font-mono shrink-0 w-16 text-right group-hover:hidden ${
            isUnread ? "text-sky-600 font-semibold" : "text-slate-400"
          }`}
        >
          {dateDisplay}
        </div>

        {/* Quick Hover Actions (Replaces Date on Hover) */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-auto pl-2">
          <button
            type="button"
            onClick={handleQuickArchive}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleQuickTrash}
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleQuickReadToggle}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            title={isUnread ? "Mark as read" : "Mark as unread"}
          >
            {isUnread ? <MailOpen className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
