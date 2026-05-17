"use client";

import { useExpiryCheck } from "@/hooks/useExpiryCheck";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function AppInitializer() {
  useServiceWorker();
  useExpiryCheck();
  return null;
}
