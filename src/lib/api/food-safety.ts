/**
 * 식품의약품안전처 식품안전나라 API 클라이언트 (브라우저 → 서버 프록시 경유)
 * 실제 API 호출은 /api/barcode/lookup 서버 라우트에서 처리
 */

import type { BarcodeProduct } from "@/app/api/barcode/lookup/route";

export type { BarcodeProduct };

export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const res = await fetch(`/api/barcode/lookup?barcode=${encodeURIComponent(barcode)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.product ?? null;
  } catch {
    return null;
  }
}
