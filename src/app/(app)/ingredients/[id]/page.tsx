"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Trash2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useIngredientStore } from "@/stores/ingredientStore";
import { getExpiryStatus, getExpiryLabel, getExpiryColorClass, getDaysUntilExpiry } from "@/lib/utils/expiry";
import { CATEGORY_LABELS, UNIT_OPTIONS } from "@/lib/utils/categories";
import type { IngredientCategory } from "@/types/database";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [IngredientCategory, typeof CATEGORY_LABELS[IngredientCategory]][];

export default function IngredientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const t = useTranslations("ingredients");
  const ingredient = useIngredientStore((s) => s.ingredients.find((i) => i.id === id));
  const updateIngredient = useIngredientStore((s) => s.updateIngredient);
  const removeIngredient = useIngredientStore((s) => s.removeIngredient);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(ingredient?.name ?? "");
  const [category, setCategory] = useState<IngredientCategory>(ingredient?.category ?? "refrigerated");
  const [quantity, setQuantity] = useState(String(ingredient?.quantity ?? 1));
  const [unit, setUnit] = useState(ingredient?.unit ?? "개");
  const [expiryDate, setExpiryDate] = useState(ingredient?.expiry_date ?? "");
  const [memo, setMemo] = useState(ingredient?.memo ?? "");

  if (!ingredient) {
    return (
      <div className="px-4 py-5 text-center">
        <p className="text-gray-500">재료를 찾을 수 없어요</p>
        <Button variant="link" onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  const status = getExpiryStatus(ingredient.expiry_date);
  const label = getExpiryLabel(ingredient.expiry_date);
  const colorClass = getExpiryColorClass(status);
  const days = getDaysUntilExpiry(ingredient.expiry_date);

  const handleSave = () => {
    updateIngredient(id, {
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      expiry_date: expiryDate,
      memo: memo || null,
    });
    setEditing(false);
    toast.success("저장됐어요!");
  };

  const handleDelete = () => {
    removeIngredient(id);
    toast.success(`${ingredient.name} 삭제됐어요`);
    router.back();
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">{ingredient.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" />
              }
            >
              <Trash2 className="w-4 h-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("deleteConfirm")}</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">취소</Button>
                <Button variant="destructive" onClick={handleDelete}>삭제</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expiry Status Banner */}
      <Card className={cn("p-4 border-2", colorClass)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">유통기한</p>
            <p className="text-xl font-bold">{ingredient.expiry_date}</p>
          </div>
          <div className="text-right">
            <Badge className={cn("text-lg font-bold px-3 py-1", colorClass)} variant="outline">
              {label}
            </Badge>
            {days >= 0 && (
              <p className="text-xs mt-1 opacity-70">{days === 0 ? "오늘 만료!" : `${days}일 남음`}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Info / Edit Form */}
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("category")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs",
                    category === key ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200"
                  )}
                >
                  <span className="text-lg">{val.icon}</span>
                  {val.ko}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quantity")}</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("unit")}</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("expiryDate")}</Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("memo")}</Label>
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">취소</Button>
            <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
              <Save className="w-4 h-4" /> 저장
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-4 space-y-3">
          {[
            { label: t("category"), value: `${CATEGORY_LABELS[ingredient.category].icon} ${CATEGORY_LABELS[ingredient.category].ko}` },
            { label: t("quantity"), value: `${ingredient.quantity}${ingredient.unit}` },
            { label: t("purchaseDate"), value: ingredient.purchase_date ?? "—" },
            { label: t("expiryDate"), value: ingredient.expiry_date },
            { label: t("memo"), value: ingredient.memo ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
