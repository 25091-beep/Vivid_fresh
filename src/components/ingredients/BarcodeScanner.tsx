"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, CameraOff, Search, Check, RotateCcw, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupBarcodeProduct } from "@/lib/api/food-safety";
import type { BarcodeProduct } from "@/app/api/barcode/lookup/route";
import { CATEGORY_LABELS } from "@/lib/utils/categories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface BarcodeScanResult {
  name: string;
  barcode: string;
  manufacturer: string;
  category: BarcodeProduct["category"];
  unit: string;
  rawMaterials: string;
  expiryHint: string;
}

interface BarcodeScannerProps {
  onConfirm: (data: BarcodeScanResult) => void;
}

export function BarcodeScanner({ onConfirm }: BarcodeScannerProps) {
  const t = useTranslations("ingredients");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [notFound, setNotFound] = useState(false);

  const startScanner = async () => {
    setProduct(null);
    setNotFound(false);
    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (!scannerRef.current) return;

      setScanning(true);
      const scanner = new Html5QrcodeScanner(
        "barcode-scanner",
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
        false
      );
      html5QrCodeRef.current = scanner;

      scanner.render(
        async (decodedText: string) => {
          scanner.clear();
          setScanning(false);
          await fetchProduct(decodedText);
        },
        () => {}
      );
    } catch {
      toast.error("카메라를 시작할 수 없어요. 직접 입력탭을 이용해주세요.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      (html5QrCodeRef.current as { clear: () => Promise<void> }).clear().catch(() => {});
    }
    setScanning(false);
  };

  const fetchProduct = async (barcode: string) => {
    setLoading(true);
    setProduct(null);
    setNotFound(false);
    try {
      const result = await lookupBarcodeProduct(barcode);
      if (result) {
        setProduct(result);
        if (result.source === "mock") {
          toast.info("API 키가 없어 테스트 데이터를 표시합니다");
        }
      } else {
        setNotFound(true);
        toast.warning(t("barcodeNotFound"));
      }
    } catch {
      setNotFound(true);
      toast.error("조회 중 오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async () => {
    const trimmed = manualBarcode.trim();
    if (!trimmed) return;
    await fetchProduct(trimmed);
  };

  const handleConfirm = () => {
    if (!product) return;
    onConfirm({
      name: product.name,
      barcode: product.barcode,
      manufacturer: product.manufacturer,
      category: product.category,
      unit: product.unit,
      rawMaterials: product.rawMaterials,
      expiryHint: product.expiryHint,
    });
  };

  const handleReset = () => {
    setProduct(null);
    setNotFound(false);
    setManualBarcode("");
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  // 제품 찾은 후 미리보기 화면
  if (product) {
    return (
      <ProductPreview
        product={product}
        onConfirm={handleConfirm}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 카메라 스캔 */}
      {!scanning ? (
        <button
          onClick={startScanner}
          className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors"
          disabled={loading}
        >
          <Camera className="w-8 h-8" />
          <span className="font-medium">{t("barcode")}</span>
          <span className="text-xs text-gray-400">{t("scanBarcode")}</span>
        </button>
      ) : (
        <div className="space-y-2">
          <div id="barcode-scanner" ref={scannerRef} className="rounded-xl overflow-hidden" />
          <Button variant="outline" onClick={stopScanner} className="w-full gap-2">
            <CameraOff className="w-4 h-4" />
            스캔 중지
          </Button>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Search className="w-4 h-4 animate-pulse" />
            <span>식품안전나라에서 검색 중...</span>
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      )}

      {/* 못 찾은 경우 */}
      {notFound && !loading && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-700">제품을 찾을 수 없어요</p>
              <p className="text-orange-600 text-xs mt-0.5">
                직접 입력 탭에서 재료명을 입력해주세요
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 바코드 직접 입력 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">바코드 번호 직접 입력</Label>
        <div className="flex gap-2">
          <Input
            placeholder="예: 8801062432366"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
            maxLength={14}
          />
          <Button
            onClick={handleManualLookup}
            disabled={loading || !manualBarcode.trim()}
            className="gap-1"
          >
            <Search className="w-4 h-4" />
            검색
          </Button>
        </div>
        <p className="text-[11px] text-gray-400">
          테스트 바코드: 8801062432366 (신라면)
        </p>
      </div>
    </div>
  );
}

// 제품 미리보기 + 확인 컴포넌트
function ProductPreview({
  product,
  onConfirm,
  onReset,
}: {
  product: BarcodeProduct;
  onConfirm: () => void;
  onReset: () => void;
}) {
  const categoryInfo = CATEGORY_LABELS[product.category];

  return (
    <div className="space-y-4">
      {/* 제품 카드 */}
      <Card className="p-4 space-y-3 border-green-200 bg-green-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">{categoryInfo.icon}</span>
              <h3 className="font-bold text-gray-900 text-base leading-tight">{product.name}</h3>
            </div>
            {product.manufacturer && (
              <p className="text-xs text-gray-500">{product.manufacturer}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {categoryInfo.ko}
          </Badge>
        </div>

        <div className="space-y-1.5 text-xs text-gray-600">
          {product.rawMaterials && (
            <div className="flex gap-1">
              <span className="text-gray-400 shrink-0 w-14">원재료</span>
              <span className="line-clamp-2">{product.rawMaterials}</span>
            </div>
          )}
          {product.expiryHint && (
            <div className="flex gap-1">
              <span className="text-gray-400 shrink-0 w-14">유통기한</span>
              <span className="text-orange-600 font-medium">{product.expiryHint}</span>
            </div>
          )}
          <div className="flex gap-1">
            <span className="text-gray-400 shrink-0 w-14">바코드</span>
            <span className="font-mono">{product.barcode}</span>
          </div>
        </div>

        {product.source === "mock" && (
          <p className="text-[11px] text-gray-400 bg-gray-100 rounded px-2 py-1">
            ℹ️ API 키 미설정 — 테스트 데이터입니다. .env.local에 FOOD_SAFETY_API_KEY를 입력하세요.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          다시 스캔
        </Button>
        <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 gap-2">
          <Check className="w-4 h-4" />
          이 제품으로 추가
        </Button>
      </div>
    </div>
  );
}
