export type IngredientCategory =
  | "refrigerated"
  | "frozen"
  | "room_temp"
  | "beverage"
  | "condiment"
  | "snack"
  | "other";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Fridge {
  id: string;
  group_id: string | null;
  user_id: string | null;
  name: string;
  created_at: string;
}

export interface Ingredient {
  id: string;
  fridge_id: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  purchase_date: string | null;
  expiry_date: string;
  barcode: string | null;
  image_url: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  thumbnail_url: string | null;
  created_by: string | null;
  group_id: string | null;
  is_public: boolean;
  created_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_name: string;
}

export interface NotificationSetting {
  user_id: string;
  notify_d7: boolean;
  notify_d3: boolean;
  notify_d1: boolean;
  notify_d0: boolean;
  notify_time: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  ingredient_id: string | null;
  type: "d7" | "d3" | "d1" | "d0" | "expired";
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// Supabase Database type shape
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      groups: { Row: Group; Insert: Partial<Group>; Update: Partial<Group> };
      group_members: { Row: GroupMember; Insert: Partial<GroupMember>; Update: Partial<GroupMember> };
      fridges: { Row: Fridge; Insert: Partial<Fridge>; Update: Partial<Fridge> };
      ingredients: { Row: Ingredient; Insert: Partial<Ingredient>; Update: Partial<Ingredient> };
      recipes: { Row: Recipe; Insert: Partial<Recipe>; Update: Partial<Recipe> };
      recipe_ingredients: { Row: RecipeIngredient; Insert: Partial<RecipeIngredient>; Update: Partial<RecipeIngredient> };
      notification_settings: { Row: NotificationSetting; Insert: Partial<NotificationSetting>; Update: Partial<NotificationSetting> };
      push_subscriptions: { Row: PushSubscription; Insert: Partial<PushSubscription>; Update: Partial<PushSubscription> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
    };
  };
}
