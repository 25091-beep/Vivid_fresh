import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ingredient, IngredientCategory } from "@/types/database";

type SortOption = "expiry" | "name" | "created";

interface IngredientStore {
  ingredients: Ingredient[];
  filterCategory: IngredientCategory | "all";
  sortBy: SortOption;
  searchQuery: string;
  setIngredients: (items: Ingredient[]) => void;
  addIngredient: (item: Ingredient) => void;
  updateIngredient: (id: string, item: Partial<Ingredient>) => void;
  removeIngredient: (id: string) => void;
  setFilter: (category: IngredientCategory | "all") => void;
  setSort: (sort: SortOption) => void;
  setSearch: (query: string) => void;
  getFiltered: () => Ingredient[];
  getExpiringSoon: (days?: number) => Ingredient[];
}

export const useIngredientStore = create<IngredientStore>()(
  persist(
    (set, get) => ({
      ingredients: [],
      filterCategory: "all",
      sortBy: "expiry",
      searchQuery: "",

      setIngredients: (items) => set({ ingredients: items }),

      addIngredient: (item) =>
        set((state) => ({ ingredients: [item, ...state.ingredients] })),

      updateIngredient: (id, item) =>
        set((state) => ({
          ingredients: state.ingredients.map((i) =>
            i.id === id ? { ...i, ...item, updated_at: new Date().toISOString() } : i
          ),
        })),

      removeIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((i) => i.id !== id),
        })),

      setFilter: (category) => set({ filterCategory: category }),
      setSort: (sort) => set({ sortBy: sort }),
      setSearch: (query) => set({ searchQuery: query }),

      getFiltered: () => {
        const { ingredients, filterCategory, sortBy, searchQuery } = get();
        let filtered = ingredients;

        if (filterCategory !== "all") {
          filtered = filtered.filter((i) => i.category === filterCategory);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
        }

        return [...filtered].sort((a, b) => {
          if (sortBy === "expiry") {
            return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          }
          if (sortBy === "name") {
            return a.name.localeCompare(b.name, "ko");
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      },

      getExpiringSoon: (days = 7) => {
        const { ingredients } = get();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() + days);
        return ingredients
          .filter((i) => {
            const expiry = new Date(i.expiry_date);
            return expiry <= cutoff;
          })
          .sort(
            (a, b) =>
              new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          );
      },
    }),
    { name: "vivifresh-ingredients" }
  )
);
