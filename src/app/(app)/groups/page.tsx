"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Plus, Copy, Check, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useGroupStore } from "@/stores/groupStore";

export default function GroupsPage() {
  const t = useTranslations("groups");
  const { groups, createGroup, joinGroup, leaveGroup } = useGroupStore();
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!createName.trim()) {
      toast.error("그룹 이름을 입력해주세요");
      return;
    }
    createGroup(createName.trim());
    toast.success(t("created"));
    setCreateName("");
    setCreateOpen(false);
  };

  const handleJoin = () => {
    const result = joinGroup(joinCode.toUpperCase().trim());
    if (result) {
      toast.success(t("joined"));
      setJoinCode("");
      setJoinOpen(false);
    } else {
      toast.error("유효하지 않은 초대 코드예요");
    }
  };

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("코드가 복사됐어요!");
  };

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-16 flex-col gap-1 border-green-200 hover:bg-green-50">
              <Plus className="w-5 h-5 text-green-600" />
              <span className="text-sm">{t("create")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("create")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>{t("groupName")}</Label>
                <Input
                  placeholder="예: 우리 가족, 자취방 냉장고"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} className="w-full bg-green-600 hover:bg-green-700">
                {t("create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-16 flex-col gap-1 border-blue-200 hover:bg-blue-50">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span className="text-sm">{t("join")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("join")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>{t("enterCode")}</Label>
                <Input
                  placeholder="8자리 초대 코드 입력"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="text-center text-lg font-mono tracking-widest uppercase"
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <Button onClick={handleJoin} className="w-full bg-blue-600 hover:bg-blue-700">
                {t("join")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">{t("myGroups")}</h3>
        {groups.length === 0 ? (
          <Card className="p-8 text-center border-dashed space-y-3">
            <Users className="w-12 h-12 mx-auto text-gray-300" />
            <p className="font-medium text-gray-500">{t("noGroups")}</p>
            <p className="text-sm text-gray-400">{t("noGroupsDesc")}</p>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{group.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t("members")}: {group.members.length}명
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-600 text-xs"
                  onClick={() => {
                    leaveGroup(group.id);
                    toast.success("그룹에서 나왔어요");
                  }}
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  나가기
                </Button>
              </div>

              <Separator />

              {/* Invite Code */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs text-gray-500">{t("inviteCode")}</p>
                  <p className="font-mono font-bold text-gray-800 tracking-widest">{group.invite_code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(group.invite_code, group.id)}
                  className="gap-1"
                >
                  {copiedId === group.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Members */}
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map((member, idx) => (
                  <Avatar key={idx} className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                      {member.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {group.members.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-500">+{group.members.length - 5}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
