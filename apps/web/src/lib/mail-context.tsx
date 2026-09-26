"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface MailboxInfo {
  id: string;
  emailAddress: string;
  storageQuota: string;
  storageUsed: string;
  aliases: Array<{ id: string; aliasAddress: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  settings?: any;
  mailbox: MailboxInfo | null;
  counts: {
    inboxUnread: number;
    drafts: number;
  };
}

export interface ThreadItem {
  id: string;
  subject: string;
  snippet?: string;
  unreadCount: number;
  messageCount: number;
  isStarred: boolean;
  isImportant: boolean;
  isArchived: boolean;
  isSpam: boolean;
  isTrash: boolean;
  lastMessageAt: string;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  messages: Array<{
    from: string;
    to: string;
    sentAt: string;
    attachments: Array<{ id: string; filename: string; mimeType: string; size: number }>;
  }>;
}

export interface ComposeState {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  fromAddress?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  draftId?: string;
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: "success" | "error" | "info" | "warning";
}

interface MailContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  activeLabel?: string;
  setActiveLabel: (label?: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  threads: ThreadItem[];
  setThreads: React.Dispatch<React.SetStateAction<ThreadItem[]>>;
  selectedThreadIds: string[];
  toggleSelectThread: (id: string) => void;
  selectAllThreads: (select: boolean) => void;
  selectedThreadId: string | null;
  setSelectedThreadId: (id: string | null) => void;
  composeState: ComposeState;
  openCompose: (initialData?: Partial<ComposeState>) => void;
  closeCompose: () => void;
  minimizeCompose: () => void;
  maximizeCompose: () => void;
  updateCompose: (data: Partial<ComposeState>) => void;
  isLoading: boolean;
  refreshThreads: () => Promise<void>;
  density: "comfortable" | "compact";
  setDensity: (density: "comfortable" | "compact") => void;
  theme: "dark" | "slate" | "neon" | "light";
  setTheme: (theme: "dark" | "slate" | "neon" | "light") => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  contacts: Array<{ id: string; name: string; email: string }>;
  executeBulkAction: (action: string, labelId?: string) => Promise<void>;
}

const MailContext = createContext<MailContextType | null>(null);

export function MailProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [activeLabel, setActiveLabel] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [theme, setTheme] = useState<"dark" | "slate" | "neon" | "light">("light");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const [composeState, setComposeState] = useState<ComposeState>({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    body: "",
    attachments: [],
  });

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch current user and session
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.settings?.theme) {
          setTheme(data.user.settings.theme);
        }
        if (data.user?.settings?.density) {
          setDensity(data.user.settings.density);
        }
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Fetch contacts for autocomplete
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.warn("Failed to load contacts", e);
    }
  }, []);

  // Fetch thread list
  const refreshThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFolder) params.set("folder", activeFolder);
      if (activeLabel) params.set("label", activeLabel);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/mail/threads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.counts) {
          setUser((prev) => {
            if (!prev) return null;
            if (
              prev.counts?.inboxUnread === data.counts.inboxUnread &&
              prev.counts?.drafts === data.counts.drafts
            ) {
              return prev;
            }
            return { ...prev, counts: data.counts };
          });
        }
      }
    } catch (err) {
      console.error("Failed to load threads", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeFolder, activeLabel, searchQuery]);

  useEffect(() => {
    fetchUser();
    fetchContacts();
  }, [fetchUser, fetchContacts]);

  useEffect(() => {
    if (user?.id) {
      refreshThreads();
    }
  }, [user?.id, refreshThreads]);

  // Real-time Server-Sent Events (SSE) listener for instant email reception
  useEffect(() => {
    if (!user?.id) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    const connectSSE = () => {
      if (!isSubscribed) return;
      try {
        eventSource = new EventSource("/api/events");

        eventSource.addEventListener("new_email", (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            const sender = payload.data?.from || "Someone";
            const subject = payload.data?.subject || "New Message";
            addToast({
              title: `New Email: ${sender}`,
              message: subject,
              type: "info",
            });
            refreshThreads();
          } catch {
            refreshThreads();
          }
        });

        eventSource.addEventListener("thread_updated", () => {
          refreshThreads();
        });

        eventSource.addEventListener("unread_count_updated", (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.data?.counts) {
              setUser((prev) => (prev ? { ...prev, counts: payload.data.counts } : null));
            }
          } catch {}
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectSSE, 5000);
          }
        };
      } catch {
        // SSE not supported or network down
      }
    };

    connectSSE();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user?.id, refreshThreads, addToast]);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-slate", "theme-neon", "theme-light");
    if (theme === "light") {
      root.classList.add("theme-light");
    } else if (theme === "slate") {
      root.classList.add("theme-slate");
    } else if (theme === "neon") {
      root.classList.add("theme-neon");
    } else {
      root.classList.add("theme-dark");
    }
  }, [theme]);

  const toggleSelectThread = (id: string) => {
    setSelectedThreadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllThreads = (select: boolean) => {
    if (select) {
      setSelectedThreadIds(threads.map((t) => t.id));
    } else {
      setSelectedThreadIds([]);
    }
  };

  const openCompose = (initialData?: Partial<ComposeState>) => {
    setComposeState((prev) => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      fromAddress: initialData?.fromAddress || user?.mailbox?.emailAddress,
      ...initialData,
    }));
  };

  const closeCompose = () => {
    setComposeState((prev) => ({ ...prev, isOpen: false }));
  };

  const minimizeCompose = () => {
    setComposeState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const maximizeCompose = () => {
    setComposeState((prev) => ({ ...prev, isMaximized: !prev.isMaximized }));
  };

  const updateCompose = (data: Partial<ComposeState>) => {
    setComposeState((prev) => ({ ...prev, ...data }));
  };

  const executeBulkAction = async (action: string, labelId?: string) => {
    if (selectedThreadIds.length === 0) return;

    // Optimistic UI update
    const previousThreads = [...threads];
    if (action === "read") {
      setThreads((prev) =>
        prev.map((t) => (selectedThreadIds.includes(t.id) ? { ...t, unreadCount: 0 } : t))
      );
    } else if (action === "unread") {
      setThreads((prev) =>
        prev.map((t) => (selectedThreadIds.includes(t.id) ? { ...t, unreadCount: 1 } : t))
      );
    } else if (action === "star") {
      setThreads((prev) =>
        prev.map((t) => (selectedThreadIds.includes(t.id) ? { ...t, isStarred: true } : t))
      );
    } else if (action === "unstar") {
      setThreads((prev) =>
        prev.map((t) => (selectedThreadIds.includes(t.id) ? { ...t, isStarred: false } : t))
      );
    } else if (["archive", "trash", "spam", "deleteForever"].includes(action)) {
      setThreads((prev) => prev.filter((t) => !selectedThreadIds.includes(t.id)));
    }

    try {
      const res = await fetch("/api/mail/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadIds: selectedThreadIds,
          action,
          labelId,
        }),
      });

      if (!res.ok) {
        setThreads(previousThreads);
        addToast({ title: "Action failed", type: "error" });
      } else {
        addToast({
          title: `Updated ${selectedThreadIds.length} conversation${selectedThreadIds.length > 1 ? "s" : ""}`,
          type: "success",
        });
        setSelectedThreadIds([]);
      }
    } catch {
      setThreads(previousThreads);
      addToast({ title: "Network error", type: "error" });
    }
  };

  return (
    <MailContext.Provider
      value={{
        user,
        setUser,
        activeFolder,
        setActiveFolder,
        activeLabel,
        setActiveLabel,
        searchQuery,
        setSearchQuery,
        threads,
        setThreads,
        selectedThreadIds,
        toggleSelectThread,
        selectAllThreads,
        selectedThreadId,
        setSelectedThreadId,
        composeState,
        openCompose,
        closeCompose,
        minimizeCompose,
        maximizeCompose,
        updateCompose,
        isLoading,
        refreshThreads,
        density,
        setDensity,
        theme,
        setTheme,
        toasts,
        addToast,
        removeToast,
        isShortcutsOpen,
        setIsShortcutsOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        contacts,
        executeBulkAction,
      }}
    >
      {children}
    </MailContext.Provider>
  );
}

export function useMail() {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error("useMail must be used within a MailProvider");
  }
  return context;
}
