"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Camera, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useIngredientStore } from "@/stores/ingredientStore";
import { CATEGORY_LABELS, UNIT_OPTIONS } from "@/lib/utils/categories";
import { BarcodeScanner } from "@/components/ingredients/BarcodeScanner";
import type { BarcodeScanResult } from "@/components/ingredients/BarcodeScanner";
import type { IngredientCategory } from "@/types/database";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  IngredientCategory,
  (typeof CATEGORY_LABELS)[IngredientCategory]
][];

export default function NewIngredientPage() {
  const router = useRouter();
  const t = useTranslations("ingredients");
  const addIngredient = useIngredientStore((s) => s.addIngredient);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<IngredientCategory>("refrigerated");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("개");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [memo, setMemo] = useState("");
  const [barcode, setBarcode] = useState<string | null>(null);
  const [tab, setTab] = useState<"manual" | "barcode">("manual");

  // 바코드 스캔 결과로 폼 자동 채우기
  const handleBarcodeScan = (data: BarcodeScanResult) => {
    setName(data.name);
    setCategory(data.category);
    setUnit(data.unit || "개");
    setBarcode(data.barcode);

    // 원재료 → 메모에 저장
    if (data.rawMaterials) {
      setMemo(`원재료: ${data.rawMaterials}`);
    }

    setTab("manual"); // 확인/수정을 위해 직접입력 탭으로 전환
    toast.success(`${data.name} 정보를 가져왔어요! 유통기한을 입력해주세요 📅`);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("재료명을 입력해주세요");
      return;
    }
    if (!expiryDate) {
      toast.error("유통기한을 입력해주세요");
      return;
    }

    addIngredient({
      id: crypto.randomUUID(),
      fridge_id: "demo-fridge",
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      purchase_date: purchaseDate || null,
      expiry_date: expiryDate,
      barcode: barcode,
      image_url: null,
      memo: memo || null,
      created_by: "demo-user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    toast.success(`${name} 추가됐어요! 🎉`);
    router.back();
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">{t("add")}</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "manual" | "barcode")}>
        <TabsList className="w-full">
          <TabsTrigger value="manual" className="flex-1 gap-2">
            <Keyboard className="w-4 h-4" />
            {t("manualInput")}
          </TabsTrigger>
          <TabsTrigger value="barcode" className="flex-1 gap-2">
            <Camera className="w-4 h-4" />
            {t("barcode")}
          </TabsTrigger>
        </TabsList>

        {/* 바코드 탭 */}
        <TabsContent value="barcode" className="mt-4">
          <BarcodeScanner onConfirm={handleBarcodeScan} />
        </TabsContent>

        {/* 직접 입력 탭 */}
        <TabsContent value="manual" className="mt-4 space-y-4">
          {/* 바코드에서 가져온 경우 배너 */}
          {barcode && (
            <Card className="p-3 bg-blue-50 border-blue-200 flex items-center gap-2">
              <span className="text-blue-500 text-lg">📡</span>
              <div className="text-xs text-blue-700">
                <span className="font-medium">식품안전나라 데이터로 자동 입력됨</span>
                <span className="ml-2 font-mono text-blue-400">#{barcode}</span>
              </div>
            </Card>
          )}

          {/* 재료명 */}
          <div className="space-y-1.5">
            <Label>{t("name")} *</Label>
            <Input
              placeholder="예: 우유, 계란, 당근..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1.5">
            <Label>{t("category")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all",
                    category === key
                      ? "border-green-500 bg-green-50 text-green-700 font-medium"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  <span className="text-lg">{val.icon}</span>
                  {val.ko}
                </button>
              ))}
            </div>
          </div>

          {/* 수량 & 단위 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quantity")}</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("unit")}</Label>
              <div className="flex gap-1 flex-wrap">
                {UNIT_OPTIONS.slice(0, 4).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-xs border transition-all",
                      unit === u
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-gray-200"
                    )}
                  >
                    {u}
                  </button>
                ))}
                <Input
                  className="w-14 h-7 text-xs px-2"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="기타"
                />
              </div>
            </div>
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("purchaseDate")}</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                {t("expiryDate")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={cn(!expiryDate && "border-orange-300 focus:ring-orange-300")}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label>{t("memo")}</Label>
            <Input
              placeholder="메모 (선택사항)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {/* 제출 */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold mt-2"
          >
            재료 추가하기
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
