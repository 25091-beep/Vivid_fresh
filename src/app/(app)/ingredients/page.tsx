"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIngredientStore } from "@/stores/ingredientStore";
import { getExpiryStatus, getExpiryLabel, getExpiryColorClass } from "@/lib/utils/expiry";
import { CATEGORY_LABELS } from "@/lib/utils/categories";
import type { IngredientCategory } from "@/types/database";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ value: IngredientCategory | "all"; label: string; icon: string }> = [
  { value: "all", label: "전체", icon: "🍽️" },
  { value: "refrigerated", label: "냉장", icon: "🧊" },
  { value: "frozen", label: "냉동", icon: "❄️" },
  { value: "room_temp", label: "상온", icon: "🌡️" },
  { value: "beverage", label: "음료", icon: "🥤" },
  { value: "condiment", label: "양념", icon: "🧂" },
  { value: "snack", label: "간식", icon: "🍪" },
];

export default function IngredientsPage() {
  const t = useTranslations("ingredients");
  const { filterCategory, setFilter, setSearch, searchQuery, sortBy, setSort, getFiltered } = useIngredientStore();
  const filtered = getFiltered();

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="재료 검색..."
          className="pl-9 bg-white"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
              filterCategory === value
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            )}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {(["expiry", "name", "created"] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSort(sort)}
            className={cn(
              "px-2 py-1 rounded-md transition-colors",
              sortBy === sort ? "text-green-600 font-medium bg-green-50" : "hover:bg-gray-100"
            )}
          >
            {sort === "expiry" ? t("sortByExpiry") : sort === "name" ? t("sortByName") : t("sortByDate")}
          </button>
        ))}
      </div>

      {/* Items Count */}
      <p className="text-xs text-gray-400">{filtered.length}가지 재료</p>

      {/* Ingredient List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">📦</p>
          <p className="font-medium text-gray-600">{t("empty")}</p>
          <p className="text-sm text-gray-400">{t("emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ingredient) => {
            const status = getExpiryStatus(ingredient.expiry_date);
            const label = getExpiryLabel(ingredient.expiry_date);
            const colorClass = getExpiryColorClass(status);

            return (
              <Link key={ingredient.id} href={`/ingredients/${ingredient.id}`}>
                <Card className="p-4 flex items-center gap-3 hover:shadow-sm transition-all">
                  <div className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl">
                    {CATEGORY_LABELS[ingredient.category].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ingredient.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ingredient.quantity}{ingredient.unit} · {CATEGORY_LABELS[ingredient.category].ko}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold px-2", colorClass)}
                    >
                      {label}
                    </Badge>
                    <span className="text-[10px] text-gray-400">
                      ~{ingredient.expiry_date}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Link href="/ingredients/new">
        <Button className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 p-0 z-40">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
