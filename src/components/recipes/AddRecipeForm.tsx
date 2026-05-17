"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRecipeStore } from "@/stores/recipeStore";

interface AddRecipeFormProps {
  onDone: () => void;
}

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
}

export function AddRecipeForm({ onDone }: AddRecipeFormProps) {
  const t = useTranslations("recipes");
  const addRecipe = useRecipeStore((s) => s.addRecipe);

  const [url, setUrl] = useState("");
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");

  const fetchOGData = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.title) {
        setOgData(data);
      } else {
        setOgData({ title: "", description: "", image: "", url });
        toast.info("링크 정보를 가져올 수 없어요. 직접 입력해주세요.");
      }
    } catch {
      setOgData({ title: "", description: "", image: "", url });
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setNewIngredient("");
    }
  };

  const removeIngredient = (name: string) => {
    setIngredients(ingredients.filter((i) => i !== name));
  };

  const handleSave = () => {
    if (!ogData?.title && !url) {
      toast.error("URL을 입력해주세요");
      return;
    }

    const recipeId = crypto.randomUUID();
    addRecipe({
      id: recipeId,
      title: ogData?.title || "레시피",
      description: ogData?.description || null,
      source_url: url || null,
      thumbnail_url: ogData?.image || null,
      created_by: "demo-user",
      group_id: null,
      is_public: true,
      created_at: new Date().toISOString(),
      recipe_ingredients: ingredients.map((name, idx) => ({
        id: crypto.randomUUID(),
        recipe_id: recipeId,
        ingredient_name: name,
      })),
    });

    toast.success("레시피가 저장됐어요! 🍳");
    onDone();
  };

  return (
    <div className="mt-4 space-y-4 overflow-y-auto max-h-[65vh] pb-4">
      {/* URL Input */}
      <div className="space-y-1.5">
        <Label>{t("pasteUrl")}</Label>
        <div className="flex gap-2">
          <Input
            placeholder={t("urlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchOGData()}
          />
          <Button onClick={fetchOGData} disabled={loading || !url.trim()}>
            <Link className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {/* OG Preview */}
      {ogData && !loading && (
        <div className="border rounded-xl overflow-hidden">
          {ogData.image && (
            <img src={ogData.image} alt="" className="w-full h-36 object-cover" />
          )}
          <div className="p-3 space-y-1">
            <Input
              value={ogData.title}
              onChange={(e) => setOgData({ ...ogData, title: e.target.value })}
              placeholder="레시피 제목"
              className="font-medium"
            />
            <Input
              value={ogData.description}
              onChange={(e) => setOgData({ ...ogData, description: e.target.value })}
              placeholder="설명 (선택)"
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className="space-y-2">
        <Label>{t("ingredients")}</Label>
        <div className="flex gap-2">
          <Input
            placeholder="재료명 입력 (예: 계란, 당근...)"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
          />
          <Button onClick={addIngredient} size="icon" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {ingredients.map((ing) => (
            <Badge key={ing} variant="secondary" className="gap-1">
              {ing}
              <button onClick={() => removeIngredient(ing)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        레시피 저장
      </Button>
    </div>
  );
}
