import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GroupMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Group {
  id: string;
  name: string;
  invite_code: string;
  members: GroupMember[];
  created_at: string;
}

interface GroupStore {
  groups: Group[];
  createGroup: (name: string) => void;
  joinGroup: (inviteCode: string) => boolean;
  leaveGroup: (id: string) => void;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],

      createGroup: (name) => {
        const newGroup: Group = {
          id: crypto.randomUUID(),
          name,
          invite_code: generateInviteCode(),
          members: [{ id: "demo-user", name: "나", avatar_url: null }],
          created_at: new Date().toISOString(),
        };
        set((state) => ({ groups: [newGroup, ...state.groups] }));
      },

      joinGroup: (inviteCode) => {
        const { groups } = get();
        const found = groups.find((g) => g.invite_code === inviteCode.toUpperCase());
        if (!found) return false;
        const alreadyMember = found.members.some((m) => m.id === "demo-user");
        if (alreadyMember) return true;
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === found.id
              ? { ...g, members: [...g.members, { id: "demo-user", name: "나", avatar_url: null }] }
              : g
          ),
        }));
        return true;
      },

      leaveGroup: (id) => {
        set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
      },
    }),
    { name: "vivifresh-groups" }
  )
);
