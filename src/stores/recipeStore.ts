import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Recipe, RecipeIngredient } from "@/types/database";

interface RecipeWithIngredients extends Recipe {
  recipe_ingredients?: RecipeIngredient[];
}

interface RecipeStore {
  recipes: RecipeWithIngredients[];
  addRecipe: (recipe: RecipeWithIngredients) => void;
  removeRecipe: (id: string) => void;
  getMatchingRecipes: (myIngredients: string[]) => Array<RecipeWithIngredients & { matchRate: number; missingIngredients: string[] }>;
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: getInitialRecipes(),

      addRecipe: (recipe) =>
        set((state) => ({ recipes: [recipe, ...state.recipes] })),

      removeRecipe: (id) =>
        set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) })),

      getMatchingRecipes: (myIngredients) => {
        const { recipes } = get();
        const mySet = new Set(myIngredients.map((i) => i.toLowerCase()));

        return recipes
          .map((recipe) => {
            const needed = recipe.recipe_ingredients?.map((i) => i.ingredient_name.toLowerCase()) ?? [];
            if (needed.length === 0) return { ...recipe, matchRate: 0, missingIngredients: [] };

            const matched = needed.filter((i) => mySet.has(i));
            const missing = needed.filter((i) => !mySet.has(i));
            const matchRate = Math.round((matched.length / needed.length) * 100);

            return { ...recipe, matchRate, missingIngredients: missing };
          })
          .sort((a, b) => b.matchRate - a.matchRate);
      },
    }),
    {
      name: "vivifresh-recipes",
      version: 2,
      migrate: () => ({ recipes: getInitialRecipes() }),
    }
  )
);

/** 레시피명으로 유튜브 검색 URL 생성 */
export function makeYouTubeSearchUrl(title: string): string {
  const query = encodeURIComponent(`${title} 만들기 레시피`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

function getInitialRecipes(): RecipeWithIngredients[] {
  return [
    {
      id: "r1",
      title: "계란 볶음밥",
      description: "냉장고 속 재료로 만드는 간단 볶음밥",
      source_url: makeYouTubeSearchUrl("계란 볶음밥"),
      thumbnail_url: null,
      created_by: null,
      group_id: null,
      is_public: true,
      created_at: new Date().toISOString(),
      recipe_ingredients: [
        { id: "ri1", recipe_id: "r1", ingredient_name: "계란" },
        { id: "ri2", recipe_id: "r1", ingredient_name: "파" },
        { id: "ri3", recipe_id: "r1", ingredient_name: "당근" },
      ],
    },
    {
      id: "r2",
      title: "두부 된장찌개",
      description: "구수하고 따뜻한 된장찌개",
      source_url: makeYouTubeSearchUrl("두부 된장찌개"),
      thumbnail_url: null,
      created_by: null,
      group_id: null,
      is_public: true,
      created_at: new Date().toISOString(),
      recipe_ingredients: [
        { id: "ri4", recipe_id: "r2", ingredient_name: "두부" },
        { id: "ri5", recipe_id: "r2", ingredient_name: "파" },
        { id: "ri6", recipe_id: "r2", ingredient_name: "고추장" },
      ],
    },
    {
      id: "r3",
      title: "당근 라페",
      description: "프렌치 스타일 당근 샐러드",
      source_url: makeYouTubeSearchUrl("당근 라페"),
      thumbnail_url: null,
      created_by: null,
      group_id: null,
      is_public: true,
      created_at: new Date().toISOString(),
      recipe_ingredients: [
        { id: "ri7", recipe_id: "r3", ingredient_name: "당근" },
      ],
    },
  ];
}
