"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[ViviFresh] Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[ViviFresh] Service Worker registration failed:", err);
      });
  }, []);
}
