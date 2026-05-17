"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ExternalLink, ChefHat, Sparkles, Clock, Users, RefreshCw } from "lucide-react";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRecipeStore, makeYouTubeSearchUrl } from "@/stores/recipeStore";
import { useIngredientStore } from "@/stores/ingredientStore";
import { AddRecipeForm } from "@/components/recipes/AddRecipeForm";
import { getDaysUntilExpiry } from "@/lib/utils/expiry";
import { toast } from "sonner";
import type { RecommendedRecipe } from "@/app/api/recipes/recommend/route";

export default function RecipesPage() {
  const t = useTranslations("recipes");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [aiRecipes, setAiRecipes] = useState<RecommendedRecipe[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCalled, setAiCalled] = useState(false);

  const ingredients = useIngredientStore((s) => s.ingredients);
  const getMatchingRecipes = useRecipeStore((s) => s.getMatchingRecipes);

  const myIngredientNames = ingredients.map((i) => i.name);
  const matchingRecipes = getMatchingRecipes(myIngredientNames);
  const recommended = matchingRecipes.filter((r) => r.matchRate >= 50);
  const all = matchingRecipes;

  const expiringIngredients = ingredients
    .filter((i) => getDaysUntilExpiry(i.expiry_date) <= 7)
    .map((i) => i.name);

  const fetchAiRecipes = async () => {
    if (ingredients.length === 0) {
      toast.error("재료를 먼저 추가해주세요");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/recipes/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: myIngredientNames,
          expiringIngredients,
        }),
      });
      const data = await res.json();
      if (data.recipes) {
        setAiRecipes(data.recipes);
        setAiCalled(true);
      } else {
        toast.error("레시피 추천에 실패했어요");
      }
    } catch {
      toast.error("네트워크 오류가 발생했어요");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-600">내 재료로 만들 수 있는 레시피</h2>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
            <Plus className="w-4 h-4" />
            {t("add")}
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>{t("add")}</SheetTitle>
            </SheetHeader>
            <AddRecipeForm onDone={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="ai">
        <TabsList className="w-full">
          <TabsTrigger value="ai" className="flex-1 gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI 추천
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex-1">
            {t("recommended")} {recommended.length > 0 && `(${recommended.length})`}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">
            {t("myRecipes")} ({all.length})
          </TabsTrigger>
        </TabsList>

        {/* AI 추천 탭 */}
        <TabsContent value="ai" className="mt-4 space-y-3">
          {!aiCalled ? (
            <div className="space-y-4">
              {/* 냉장고 재료 현황 */}
              {ingredients.length === 0 ? (
                <Card className="p-6 text-center border-dashed space-y-2">
                  <p className="text-3xl">🧊</p>
                  <p className="font-medium text-gray-600">냉장고가 비어있어요</p>
                  <p className="text-sm text-gray-400">재료를 먼저 추가해야 추천받을 수 있어요</p>
                </Card>
              ) : (
                <Card className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">📦 현재 냉장고 재료 ({ingredients.length}가지)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ingredients.map((ing) => {
                      const isExpiring = expiringIngredients.includes(ing.name);
                      return (
                        <Badge
                          key={ing.id}
                          variant="outline"
                          className={isExpiring
                            ? "border-orange-300 bg-orange-50 text-orange-700 text-xs"
                            : "border-green-200 bg-green-50 text-green-700 text-xs"
                          }
                        >
                          {isExpiring && "⚠️ "}{ing.name}
                        </Badge>
                      );
                    })}
                  </div>
                  {expiringIngredients.length > 0 && (
                    <p className="text-xs text-orange-500">
                      ⚠️ 표시된 재료 {expiringIngredients.length}가지가 곧 유통기한이 지나요. AI가 우선 활용합니다.
                    </p>
                  )}
                </Card>
              )}

              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">AI 레시피 추천</p>
                  <p className="text-sm text-gray-400 mt-1">
                    위 재료들만으로 만들 수 있는 레시피를 추천해드려요
                  </p>
                </div>
                <Button
                  onClick={fetchAiRecipes}
                  disabled={aiLoading || ingredients.length === 0}
                  className="bg-amber-500 hover:bg-amber-600 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 레시피 추천받기
                </Button>
              </div>
            </div>
          ) : aiLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* 기준 재료 표시 */}
              <Card className="p-3 bg-amber-50 border-amber-200">
                <p className="text-xs font-medium text-amber-700 mb-1.5">🧊 추천 기준 재료</p>
                <div className="flex flex-wrap gap-1">
                  {myIngredientNames.map((name) => (
                    <Badge key={name} variant="outline" className="text-[11px] border-amber-200 bg-white text-amber-700">
                      {name}
                    </Badge>
                  ))}
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">AI가 추천한 레시피 {aiRecipes.length}개</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAiRecipes}
                  disabled={aiLoading}
                  className="text-xs text-amber-600 gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
                  다시 추천
                </Button>
              </div>
              {aiRecipes.map((recipe) => (
                <AiRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </>
          )}
        </TabsContent>

        {/* 재료 매칭 탭 */}
        <TabsContent value="recommended" className="mt-4 space-y-3">
          {recommended.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <ChefHat className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-500 text-sm">
                재료를 더 추가하면 레시피를 추천받을 수 있어요
              </p>
            </div>
          ) : (
            recommended.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </TabsContent>

        {/* 내 레시피 탭 */}
        <TabsContent value="all" className="mt-4 space-y-3">
          {all.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-4xl">📖</p>
              <p className="text-gray-500 text-sm">{t("empty")}</p>
              <p className="text-xs text-gray-400">{t("emptyDesc")}</p>
            </div>
          ) : (
            all.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AiRecipeCard({ recipe }: { recipe: RecommendedRecipe }) {
  const [expanded, setExpanded] = useState(false);

  const difficultyColor = {
    쉬움: "bg-green-100 text-green-700",
    보통: "bg-yellow-100 text-yellow-700",
    어려움: "bg-red-100 text-red-700",
  }[recipe.difficulty];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{recipe.description}</p>
          </div>
          <Badge className={`text-xs shrink-0 ${difficultyColor}`} variant="secondary">
            {recipe.difficulty}
          </Badge>
        </div>

        {/* 메타 정보 */}
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {recipe.cookTime}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {recipe.servings}인분
          </span>
        </div>

        {/* 재료 */}
        <div className="flex flex-wrap gap-1">
          {recipe.ingredients.map((ing) => (
            <Badge
              key={ing.name}
              variant={ing.available ? "outline" : "secondary"}
              className={`text-xs ${
                ing.available
                  ? "text-green-700 border-green-200 bg-green-50"
                  : "opacity-40 line-through"
              }`}
            >
              {ing.name} {ing.amount}
            </Badge>
          ))}
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* 조리 순서 토글 */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-gray-500 border border-dashed"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "조리 순서 닫기 ▲" : "조리 순서 보기 ▼"}
        </Button>

        {expanded && (
          <ol className="space-y-2 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        )}

        {/* 유튜브 검색 버튼 */}
        <a
          href={makeYouTubeSearchUrl(recipe.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors"
        >
          <YoutubeIcon className="w-4 h-4" />
          유튜브에서 &quot;{recipe.title}&quot; 요리 영상 보기
        </a>
      </div>
    </Card>
  );
}

function RecipeCard({
  recipe,
}: {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    source_url: string | null;
    thumbnail_url: string | null;
    matchRate: number;
    missingIngredients: string[];
    recipe_ingredients?: { ingredient_name: string }[];
  };
}) {
  const t = useTranslations("recipes");

  const matchColor =
    recipe.matchRate >= 80
      ? "text-green-600"
      : recipe.matchRate >= 50
      ? "text-amber-500"
      : "text-gray-400";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {recipe.thumbnail_url && (
        <div className="w-full h-36 bg-gray-100 relative">
          <img
            src={recipe.thumbnail_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-xs text-gray-500 mt-1">{recipe.description}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{t("matchRate")}</span>
            <span className={`text-sm font-bold ${matchColor}`}>{recipe.matchRate}%</span>
          </div>
          <Progress value={recipe.matchRate} className="h-1.5" />
        </div>

        {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.recipe_ingredients.map((ri) => {
              const isMissing = recipe.missingIngredients.includes(
                ri.ingredient_name.toLowerCase()
              );
              return (
                <Badge
                  key={ri.ingredient_name}
                  variant={isMissing ? "secondary" : "outline"}
                  className={`text-xs ${
                    isMissing
                      ? "opacity-40 line-through"
                      : "text-green-700 border-green-200 bg-green-50"
                  }`}
                >
                  {ri.ingredient_name}
                </Badge>
              );
            })}
          </div>
        )}

        {recipe.source_url && (() => {
          const isYoutube = recipe.source_url.includes("youtube.com") || recipe.source_url.includes("youtu.be");
          return (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                isYoutube
                  ? "bg-red-50 hover:bg-red-100 text-red-600"
                  : "border border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              {isYoutube ? <YoutubeIcon className="w-4 h-4" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {isYoutube ? "유튜브에서 요리 영상 보기" : t("viewRecipe")}
            </a>
          );
        })()}
      </div>
    </Card>
  );
}
