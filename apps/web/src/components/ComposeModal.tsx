"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Paperclip,
  Trash2,
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Code,
  Quote,
} from "lucide-react";
import { useMail } from "@/lib/mail-context";
import { APP_CONFIG } from "@vxmail/config";

export function ComposeModal() {
  const {
    composeState,
    closeCompose,
    minimizeCompose,
    maximizeCompose,
    updateCompose,
    user,
    addToast,
    refreshThreads,
    contacts,
  } = useMail();

  const [toInput, setToInput] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<Array<{ name: string; email: string }>>([]);

  const editorRef = useRef<HTMLDivElement>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available sender addresses (primary + aliases)
  const availableSenders = [
    user?.mailbox?.emailAddress || user?.email || "user@vxmusic.in",
    ...(user?.mailbox?.aliases?.map((a) => a.aliasAddress) || []),
  ];

  const selectedFrom = composeState.fromAddress || availableSenders[0];

  // Contact autocomplete for "To"
  useEffect(() => {
    if (!toInput.trim()) {
      setAutoCompleteSuggestions([]);
      return;
    }
    const query = toInput.toLowerCase();
    const matches = contacts.filter(
      (c) =>
        c.email.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    );
    setAutoCompleteSuggestions(matches.slice(0, 5));
  }, [toInput, contacts]);

  // Debounced Autosave Draft
  useEffect(() => {
    if (!composeState.isOpen || composeState.isMinimized) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (!composeState.subject && !composeState.body && composeState.to.length === 0) {
        return;
      }

      try {
        const res = await fetch("/api/mail/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: composeState.draftId,
            threadId: composeState.threadId,
            to: composeState.to,
            cc: composeState.cc,
            bcc: composeState.bcc,
            subject: composeState.subject,
            body: composeState.body,
            attachments: composeState.attachments,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.draft?.id) {
            updateCompose({ draftId: data.draft.id });
          }
          const now = new Date();
          setLastSaved(
            now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          );
        }
      } catch (e) {
        // silent fail for background autosave
      }
    }, APP_CONFIG.limits.draftAutosaveDebounceMs);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    composeState.isOpen,
    composeState.isMinimized,
    composeState.to,
    composeState.cc,
    composeState.bcc,
    composeState.subject,
    composeState.body,
    composeState.attachments,
    composeState.draftId,
    composeState.threadId,
    updateCompose,
  ]);

  if (!composeState.isOpen) return null;

  const handleAddRecipient = (field: "to" | "cc" | "bcc", val: string) => {
    const trimmed = val.trim().replace(/,/g, "");
    if (!trimmed) return;
    const current = composeState[field] || [];
    if (!current.includes(trimmed)) {
      updateCompose({ [field]: [...current, trimmed] });
    }
    if (field === "to") setToInput("");
    if (field === "cc") setCcInput("");
    if (field === "bcc") setBccInput("");
    setAutoCompleteSuggestions([]);
  };

  const handleRemoveRecipient = (field: "to" | "cc" | "bcc", email: string) => {
    const current = composeState[field] || [];
    updateCompose({ [field]: current.filter((e) => e !== email) });
  };

  const handleAddAttachmentMock = () => {
    const dummyNames = ["contract_final.pdf", "stems_mixdown.wav", "cover_art.png", "release_notes.txt"];
    const chosen = dummyNames[Math.floor(Math.random() * dummyNames.length)];
    const newAtt = {
      filename: chosen,
      mimeType: chosen.endsWith(".pdf") ? "application/pdf" : chosen.endsWith(".wav") ? "audio/wav" : "image/png",
      size: Math.floor(Math.random() * 2000000) + 150000,
    };
    updateCompose({ attachments: [...composeState.attachments, newAtt] });
    addToast({ title: `Attached ${chosen}`, type: "info" });
  };

  const handleRemoveAttachment = (index: number) => {
    const updated = [...composeState.attachments];
    updated.splice(index, 1);
    updateCompose({ attachments: updated });
  };

  const handleSend = async () => {
    if (composeState.to.length === 0 && !toInput.trim()) {
      addToast({ title: "Please specify at least one recipient", type: "error" });
      return;
    }

    const finalTo = [...composeState.to];
    if (toInput.trim() && !finalTo.includes(toInput.trim())) {
      finalTo.push(toInput.trim());
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: selectedFrom,
          to: finalTo,
          cc: composeState.cc,
          bcc: composeState.bcc,
          subject: composeState.subject || "(no subject)",
          textBody: composeState.body.replace(/<[^>]+>/g, ""),
          htmlBody: composeState.body || `<p></p>`,
          threadId: composeState.threadId,
          inReplyTo: composeState.inReplyTo,
          references: composeState.references,
          attachments: composeState.attachments,
        }),
      });

      if (res.ok) {
        addToast({ title: "Email dispatched via Stalwart relay", type: "success" });
        if (composeState.draftId) {
          fetch(`/api/mail/drafts/${composeState.draftId}`, { method: "DELETE" });
        }
        closeCompose();
        refreshThreads();
      } else {
        const err = await res.json();
        addToast({ title: err.error || "Failed to send email", type: "error" });
      }
    } catch {
      addToast({ title: "Network error sending email", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleDiscard = async () => {
    if (composeState.draftId) {
      await fetch(`/api/mail/drafts/${composeState.draftId}`, { method: "DELETE" });
    }
    closeCompose();
    refreshThreads();
    addToast({ title: "Draft discarded", type: "info" });
  };

  const execFormat = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      updateCompose({ body: editorRef.current.innerHTML });
    }
  };

  // If minimized, show small floating dock tab
  if (composeState.isMinimized) {
    return (
      <div className="fixed bottom-0 right-8 z-50 w-72 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-xl shadow-lg flex items-center justify-between px-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
        <span
          onClick={minimizeCompose}
          className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate flex-1"
        >
          {composeState.subject || "New Message"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={minimizeCompose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={closeCompose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const isMaximized = composeState.isMaximized;

  return (
    <div
      className={`fixed z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-modal overflow-hidden animate-in fade-in duration-200 ${
        isMaximized
          ? "inset-0 sm:inset-6 md:inset-10 sm:rounded-2xl"
          : "inset-0 sm:inset-auto sm:bottom-0 sm:right-6 md:right-8 sm:w-full sm:max-w-2xl sm:h-[560px] sm:rounded-t-2xl"
      }`}
    >
      {/* Compose Header Bar */}
      <div className="h-11 px-4 bg-slate-50 dark:bg-slate-850 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-white">New Message</span>
          {lastSaved && (
            <span className="text-[10px] text-slate-400 font-mono">
              (Draft saved {lastSaved})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={minimizeCompose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-200/50 dark:hover:bg-slate-800"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={maximizeCompose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-200/50 dark:hover:bg-slate-800"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={closeCompose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-200/50 dark:hover:bg-slate-800"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recipient & Subject Fields */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
        {/* From address selector */}
        <div className="flex items-center text-xs">
          <span className="w-14 text-slate-400 shrink-0">From:</span>
          <select
            value={selectedFrom}
            onChange={(e) => updateCompose({ fromAddress: e.target.value })}
            className="bg-transparent text-slate-800 dark:text-slate-200 font-mono text-xs outline-none cursor-pointer hover:text-sky-600"
          >
            {availableSenders.map((addr) => (
              <option key={addr} value={addr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {addr}
              </option>
            ))}
          </select>
        </div>

        {/* To Recipients with Autocomplete */}
        <div className="relative flex items-center flex-wrap gap-1.5 text-xs">
          <span className="w-14 text-slate-400 shrink-0">To:</span>
          <div className="flex-1 flex flex-wrap items-center gap-1.5">
            {composeState.to.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRecipient("to", email)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <input
              type="text"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "," || e.key === " ") {
                  e.preventDefault();
                  handleAddRecipient("to", toInput);
                }
              }}
              placeholder={composeState.to.length === 0 ? "Recipients..." : ""}
              className="bg-transparent text-slate-900 dark:text-white text-xs outline-none min-w-[140px] flex-1 py-1"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="hover:text-slate-800 dark:hover:text-white hover:underline"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-slate-800 dark:hover:text-white hover:underline"
              >
                Bcc
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {autoCompleteSuggestions.length > 0 && (
            <div className="absolute top-full left-14 mt-1 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-dropdown z-50 animate-in fade-in">
              <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 block">
                Suggested Contacts
              </span>
              {autoCompleteSuggestions.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => handleAddRecipient("to", c.email)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex flex-col"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{c.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CC Field */}
        {showCc && (
          <div className="flex items-center flex-wrap gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="w-14 text-slate-400 shrink-0">Cc:</span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {composeState.cc.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient("cc", email)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddRecipient("cc", ccInput);
                  }
                }}
                className="bg-transparent text-slate-900 dark:text-white text-xs outline-none flex-1 py-1"
                placeholder="Cc recipients..."
              />
            </div>
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div className="flex items-center flex-wrap gap-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="w-14 text-slate-400 shrink-0">Bcc:</span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {composeState.bcc.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient("bcc", email)}
                    className="hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddRecipient("bcc", bccInput);
                  }
                }}
                className="bg-transparent text-slate-900 dark:text-white text-xs outline-none flex-1 py-1"
                placeholder="Bcc recipients..."
              />
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={composeState.subject}
            onChange={(e) => updateCompose({ subject: e.target.value })}
            placeholder="Subject"
            className="w-full bg-transparent text-slate-900 dark:text-white text-sm font-semibold outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Rich Text Editor Toolbar */}
      <div className="px-4 py-1.5 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-1 shrink-0 text-slate-500 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => execFormat("bold")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execFormat("italic")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execFormat("underline")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <div className="h-3 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => execFormat("insertUnorderedList")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execFormat("insertOrderedList")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execFormat("formatBlock", "pre")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Code block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => execFormat("formatBlock", "blockquote")}
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
          title="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[140px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={(e) => updateCompose({ body: e.currentTarget.innerHTML })}
          dangerouslySetInnerHTML={{ __html: composeState.body }}
          className="w-full h-full text-sm text-slate-800 dark:text-slate-200 outline-none leading-relaxed prose prose-slate max-w-none font-sans"
        />
      </div>

      {/* Attachments Preview in Composer */}
      {composeState.attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap gap-2">
          {composeState.attachments.map((att, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <Paperclip className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px]">{att.filename}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({(att.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="hover:text-rose-500 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="h-14 px-4 bg-slate-50 dark:bg-slate-850 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? "Sending..." : "Send"}</span>
          </button>

          <button
            type="button"
            onClick={handleAddAttachmentMock}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Attach file (Max 25MB)"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleDiscard}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title="Discard draft"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
