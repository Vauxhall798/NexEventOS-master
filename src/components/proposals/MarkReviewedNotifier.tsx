"use client";

import { useEffect } from "react";

export default function MarkReviewedNotifier({ id }: { id: string }) {
  useEffect(() => {
    try {
      const channel = new BroadcastChannel("nexeventos-proposals");
      channel.postMessage({ type: "reviewed", id });
      channel.close();
    } catch (e) {
      try {
        // fallback: storage event
        localStorage.setItem("nexeventos:proposal-reviewed", JSON.stringify({ id, t: Date.now() }));
      } catch (er) {
        // ignore
      }
    }
  }, [id]);

  return null;
}
