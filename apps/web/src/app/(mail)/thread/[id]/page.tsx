"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ThreadView } from "@/components/ThreadView";

export default function ThreadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="flex-1 flex min-w-0 h-full overflow-hidden">
      <ThreadView
        threadId={params.id}
        onBack={() => router.push("/inbox")}
      />
    </div>
  );
}
