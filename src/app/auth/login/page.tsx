"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  };

  const handleKakaoLogin = async () => {
    setLoading("kakao");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("카카오 로그인을 사용하려면 .env.local에 카카오 앱 키를 설정해주세요.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-3xl mb-4 shadow-lg">
            <span className="text-4xl">🥬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ViviFresh</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">{t("loginDesc")}</p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            variant="outline"
            className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading === "google" ? "로그인 중..." : t("loginWithGoogle")}
          </Button>

          <Button
            onClick={handleKakaoLogin}
            disabled={loading !== null}
            className="w-full h-12 text-base font-medium bg-[#FEE500] hover:bg-[#F6DC00] text-[#191919] border-0 transition-all"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.477 3 2 6.477 2 10.91c0 2.84 1.782 5.334 4.465 6.79L5.38 21l4.755-2.522A11.294 11.294 0 0012 18.818c5.523 0 10-3.477 10-7.908C22 6.477 17.523 3 12 3z"/>
            </svg>
            {loading === "kakao" ? "로그인 중..." : t("loginWithKakao")}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-3 text-gray-400">또는</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full text-gray-500 hover:text-gray-700"
          onClick={() => window.location.href = "/dashboard"}
        >
          {t("continueAsGuest")}
        </Button>

        <p className="text-center text-xs text-gray-400 mt-6">
          로그인 시{" "}
          <span className="underline cursor-pointer">서비스 이용약관</span>
          {" "}및{" "}
          <span className="underline cursor-pointer">개인정보처리방침</span>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
