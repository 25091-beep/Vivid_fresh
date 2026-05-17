"use client";

import { Button } from "@/components/ui/button";
import { useIngredientStore } from "@/stores/ingredientStore";
import { addDays, subDays, format } from "date-fns";
import type { Ingredient } from "@/types/database";

const sampleIngredients: Omit<Ingredient, "id" | "fridge_id" | "created_by" | "created_at" | "updated_at">[] = [
  { name: "우유", category: "refrigerated", quantity: 1, unit: "L", purchase_date: format(subDays(new Date(), 5), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 2), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "두부", category: "refrigerated", quantity: 1, unit: "개", purchase_date: format(subDays(new Date(), 2), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 0), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "계란", category: "refrigerated", quantity: 10, unit: "개", purchase_date: format(subDays(new Date(), 7), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 14), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "당근", category: "refrigerated", quantity: 3, unit: "개", purchase_date: format(subDays(new Date(), 3), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 5), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "냉동 만두", category: "frozen", quantity: 1, unit: "봉", purchase_date: format(subDays(new Date(), 10), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 60), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "고추장", category: "condiment", quantity: 1, unit: "개", purchase_date: format(subDays(new Date(), 30), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), -3), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "파", category: "refrigerated", quantity: 1, unit: "묶음", purchase_date: format(subDays(new Date(), 1), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 6), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
  { name: "콜라", category: "beverage", quantity: 2, unit: "캔", purchase_date: format(subDays(new Date(), 5), "yyyy-MM-dd"), expiry_date: format(addDays(new Date(), 90), "yyyy-MM-dd"), barcode: null, image_url: null, memo: null },
];

export function SeedDataButton() {
  const addIngredient = useIngredientStore((s) => s.addIngredient);

  const handleSeed = () => {
    sampleIngredients.forEach((item) => {
      addIngredient({
        ...item,
        id: crypto.randomUUID(),
        fridge_id: "demo-fridge",
        created_by: "demo-user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  };

  return (
    <div className="text-center py-6 space-y-3">
      <p className="text-sm text-gray-500">데모 데이터로 미리 체험해보세요</p>
      <Button
        onClick={handleSeed}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="sm"
      >
        🌱 샘플 재료 추가하기
      </Button>
    </div>
  );
}
