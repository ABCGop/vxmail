"use client";

import React from "react";
import { MailProvider } from "@/lib/mail-context";
import { MailSidebar } from "@/components/MailSidebar";
import { MailHeader } from "@/components/MailHeader";
import { ComposeModal } from "@/components/ComposeModal";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { ToastContainer } from "@/components/ToastContainer";
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";

function MailLayoutContent({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Desktop Left Sidebar */}
      <MailSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <MailHeader />
        <main className="flex-1 flex min-w-0 overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* Modals & Overlays */}
      <ComposeModal />
      <KeyboardShortcutsModal />
      <ToastContainer />
    </div>
  );
}

export default function MailShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MailProvider>
      <MailLayoutContent>{children}</MailLayoutContent>
    </MailProvider>
  );
}
