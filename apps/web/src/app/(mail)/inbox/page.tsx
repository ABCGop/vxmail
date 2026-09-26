"use client";

import React from "react";
import { ThreadList } from "@/components/ThreadList";
import { ThreadView } from "@/components/ThreadView";
import { useMail } from "@/lib/mail-context";

export default function InboxPage() {
  const { selectedThreadId, setSelectedThreadId } = useMail();

  return (
    <div className="flex-1 flex min-w-0 h-full overflow-hidden">
      {selectedThreadId ? (
        <ThreadView
          threadId={selectedThreadId}
          onBack={() => setSelectedThreadId(null)}
        />
      ) : (
        <ThreadList onSelectThread={(id) => setSelectedThreadId(id)} />
      )}
    </div>
  );
}
