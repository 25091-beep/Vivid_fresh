"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, ChevronRight, RefrigeratorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIngredientStore } from "@/stores/ingredientStore";
import { getDaysUntilExpiry, getExpiryStatus, getExpiryLabel, getExpiryColorClass } from "@/lib/utils/expiry";
import { CATEGORY_LABELS } from "@/lib/utils/categories";
import { cn } from "@/lib/utils";
import { SeedDataButton } from "@/components/debug/SeedDataButton";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const ingredients = useIngredientStore((s) => s.ingredients);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 7);
    return ingredients
      .filter((i) => new Date(i.expiry_date) <= cutoff)
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }, [ingredients]);

  const totalItems = ingredients.length;
  const expiredCount = expiringSoon.filter((i) => getDaysUntilExpiry(i.expiry_date) < 0).length;
  const criticalCount = expiringSoon.filter((i) => {
    const d = getDaysUntilExpiry(i.expiry_date);
    return d >= 0 && d <= 1;
  }).length;

  return (
    <div className="px-4 py-5 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">{t("title")}</h2>
            <p className="text-green-100 text-sm">
              {t("totalItems", { count: totalItems })}
            </p>
          </div>
          <RefrigeratorIcon className="w-12 h-12 text-green-300 opacity-80" />
        </div>
        {(expiredCount > 0 || criticalCount > 0) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {expiredCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                만료됨 {expiredCount}개
              </span>
            )}
            {criticalCount > 0 && (
              <span className="bg-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                오늘/내일 {criticalCount}개
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/ingredients/new">
          <Card className="p-4 flex items-center gap-3 cursor-pointer hover:bg-green-50 transition-colors border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{t("quickAdd")}</span>
          </Card>
        </Link>
        <Link href="/recipes">
          <Card className="p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-50 transition-colors border-amber-100">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">👨‍🍳</span>
            </div>
            <span className="text-sm font-medium text-gray-700">레시피 추천</span>
          </Card>
        </Link>
      </div>

      {/* Expiring Soon */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{t("expiringSoon")}</h3>
          <Link href="/ingredients" className="text-xs text-green-600 flex items-center gap-1">
            전체보기 <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {expiringSoon.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm text-gray-500">{t("noExpiring")}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {expiringSoon.slice(0, 5).map((ingredient) => {
              const status = getExpiryStatus(ingredient.expiry_date);
              const label = getExpiryLabel(ingredient.expiry_date);
              const colorClass = getExpiryColorClass(status);

              return (
                <Link key={ingredient.id} href={`/ingredients/${ingredient.id}`}>
                  <Card className={cn("p-3 flex items-center gap-3 border transition-all hover:shadow-sm", colorClass)}>
                    <div className="text-xl">
                      {CATEGORY_LABELS[ingredient.category].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ingredient.name}</p>
                      <p className="text-xs opacity-70">
                        {ingredient.quantity}{ingredient.unit} · {CATEGORY_LABELS[ingredient.category].ko}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold border shrink-0", colorClass)}
                    >
                      {label}
                    </Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Seed data for demo */}
      {ingredients.length === 0 && <SeedDataButton />}
    </div>
  );
}
