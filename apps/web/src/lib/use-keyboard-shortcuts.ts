"use client";

import { useEffect } from "react";
import { useMail } from "./mail-context";

export function useKeyboardShortcuts() {
  const {
    openCompose,
    closeCompose,
    composeState,
    selectedThreadIds,
    executeBulkAction,
    setIsShortcutsOpen,
    isShortcutsOpen,
  } = useMail();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      // Allow Esc to close modals even inside input
      if (e.key === "Escape") {
        if (composeState.isOpen) {
          closeCompose();
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
      }

      // If typing in input or composing, don't trigger single-key navigation shortcuts
      if (isInput) {
        return;
      }

      switch (e.key) {
        case "c":
        case "C":
          e.preventDefault();
          openCompose();
          break;

        case "/":
          e.preventDefault();
          document.getElementById("vxmail-search-input")?.focus();
          break;

        case "?":
          e.preventDefault();
          setIsShortcutsOpen(true);
          break;

        case "e":
        case "E":
          if (selectedThreadIds.length > 0) {
            e.preventDefault();
            executeBulkAction("archive");
          }
          break;

        case "s":
        case "S":
          if (selectedThreadIds.length > 0) {
            e.preventDefault();
            executeBulkAction("star");
          }
          break;

        case "u":
        case "U":
          if (selectedThreadIds.length > 0) {
            e.preventDefault();
            executeBulkAction("unread");
          }
          break;

        case "#":
          if (selectedThreadIds.length > 0) {
            e.preventDefault();
            executeBulkAction("trash");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    openCompose,
    closeCompose,
    composeState.isOpen,
    selectedThreadIds,
    executeBulkAction,
    setIsShortcutsOpen,
    isShortcutsOpen,
  ]);
}
