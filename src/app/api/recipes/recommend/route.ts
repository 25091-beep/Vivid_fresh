import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface RecommendedRecipe {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  difficulty: "쉬움" | "보통" | "어려움";
  servings: number;
  ingredients: { name: string; amount: string; available: boolean }[];
  steps: string[];
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients, expiringIngredients = [] } = await request.json();

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "재료가 없습니다" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ recipes: getMockRecipes(ingredients, expiringIngredients) });
    }

    const ingredientList = ingredients.join(", ");
    const expiringList =
      expiringIngredients.length > 0
        ? `\n🚨 유통기한 임박 재료 (최우선 소진 필요): ${expiringIngredients.join(", ")}`
        : "";

    const PANTRY_STAPLES = ["소금", "후추", "설탕", "간장", "참기름", "식용유", "물", "마늘", "생강"];

    const prompt = `당신은 한국 요리 전문가입니다. 사용자의 냉장고 재료로 만들 수 있는 레시피 3개를 추천해주세요.

━━━ 냉장고 보유 재료 ━━━
${ingredientList}${expiringList}

━━━ 기본 양념 (항상 있다고 가정) ━━━
${PANTRY_STAPLES.join(", ")}

━━━ 절대 규칙 ━━━
1. [냉장고 보유 재료] + [기본 양념]만으로 완성 가능한 레시피를 추천하세요.
2. 위 목록에 없는 재료가 필요한 레시피는 절대 추천하지 마세요.
3. 유통기한 임박 재료가 있으면 해당 재료를 반드시 사용하는 레시피를 우선 추천하세요.
4. 레시피의 모든 재료 항목에서 available 필드를 정확히 표시하세요:
   - 보유 재료 목록 또는 기본 양념에 있으면 → "available": true
   - 그 외 재료 → "available": false (이런 재료가 있으면 해당 레시피는 추천하면 안 됩니다)

━━━ 응답 형식 (JSON만) ━━━
{
  "recipes": [
    {
      "id": "r1",
      "title": "레시피 이름",
      "description": "이 레시피에서 주로 사용하는 보유 재료를 언급한 한 문장 설명",
      "cookTime": "20분",
      "difficulty": "쉬움",
      "servings": 2,
      "ingredients": [
        { "name": "재료명", "amount": "2개", "available": true }
      ],
      "steps": [
        "구체적인 1단계 설명",
        "구체적인 2단계 설명"
      ],
      "tags": ["한식", "간단"]
    }
  ]
}

추가 지침:
- difficulty: "쉬움" / "보통" / "어려움" 중 하나
- 한국 가정식 중심, 현실적으로 만들 수 있는 요리
- 레시피 id는 고유 (r1, r2, r3)
- steps는 최소 3단계 이상, 구체적으로 작성`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      const detail = getReadableGeminiError(errorBody);
      console.error("Gemini recipe API error:", errorBody);

      return NextResponse.json({
        recipes: getMockRecipes(ingredients, expiringIngredients),
        warning: `Gemini API 호출 실패: ${detail}`,
        source: "fallback",
      });
    }

    const result = await geminiResponse.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini recipe API empty response:", result);
      return NextResponse.json({
        recipes: getMockRecipes(ingredients, expiringIngredients),
        warning: "Gemini 응답이 비어있어 기본 추천을 표시합니다",
        source: "fallback",
      });
    }

    try {
      // JSON 파싱 - 마크다운 코드블록 제거
      const jsonText = extractJsonText(text);
      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed.recipes) || parsed.recipes.length === 0) {
        throw new Error("Invalid recipe response shape");
      }

      return NextResponse.json({ ...parsed, source: "gemini" });
    } catch (parseError) {
      console.error("Gemini recipe parse error:", parseError, text);
      return NextResponse.json({
        recipes: getMockRecipes(ingredients, expiringIngredients),
        warning: "Gemini 응답 형식이 맞지 않아 기본 추천을 표시합니다",
        source: "fallback",
      });
    }
  } catch (err) {
    console.error("Recipe recommend error:", err);
    return NextResponse.json(
      { error: "레시피 추천 실패", detail: err instanceof Error ? err.message : "알 수 없는 오류" },
      { status: 500 }
    );
  }
}

function extractJsonText(text: string): string {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function getReadableGeminiError(errorBody: string): string {
  try {
    const parsed = JSON.parse(errorBody);
    return parsed.error?.message ?? "Gemini API 설정을 확인해주세요";
  } catch {
    return "Gemini API 설정을 확인해주세요";
  }
}

function getMockRecipes(ingredients: string[], expiringIngredients: string[]): RecommendedRecipe[] {
  const prioritized = [...new Set([...expiringIngredients, ...ingredients])];
  const main = prioritized.slice(0, 4);
  const hasEnough = main.length >= 2;

  const makeIngredient = (name: string, amount = "적당량"): { name: string; amount: string; available: boolean } => ({
    name,
    amount,
    available: true,
  });

  return [
    {
      id: "mock-r1",
      title: hasEnough ? `${main[0]} 볶음` : "간단 볶음",
      description: hasEnough
        ? `${main.slice(0, 2).join(", ")}을(를) 활용한 빠른 볶음 요리`
        : "냉장고 재료를 활용한 볶음",
      cookTime: "15분",
      difficulty: "쉬움",
      servings: 2,
      ingredients: [
        ...main.map((name) => makeIngredient(name, "적당량")),
        makeIngredient("소금", "약간"),
        makeIngredient("식용유", "1큰술"),
        makeIngredient("간장", "1큰술"),
      ],
      steps: [
        `${main[0] ?? "재료"}를 먹기 좋은 크기로 썰어주세요.`,
        "팬에 식용유를 두르고 중불로 가열하세요.",
        main.length > 1
          ? `${main[0]}을(를) 먼저 넣고 2분간 볶다가 ${main[1]}을(를) 추가하세요.`
          : `${main[0] ?? "재료"}를 넣고 볶아주세요.`,
        "간장 1큰술, 소금으로 간을 맞추고 1분 더 볶아 완성하세요.",
      ],
      tags: ["간단", "볶음", "냉장고 활용"],
    },
    {
      id: "mock-r2",
      title: hasEnough ? `${main[0]} 국` : "간단 국",
      description: hasEnough
        ? `${main.slice(0, 2).join(", ")}으로 만드는 따뜻한 국`
        : "냉장고 재료로 만드는 국",
      cookTime: "20분",
      difficulty: "쉬움",
      servings: 2,
      ingredients: [
        ...main.slice(0, 3).map((name) => makeIngredient(name, "1개")),
        makeIngredient("물", "500ml"),
        makeIngredient("소금", "약간"),
        makeIngredient("간장", "1큰술"),
        makeIngredient("마늘", "1쪽"),
      ],
      steps: [
        `${main[0] ?? "재료"}를 한입 크기로 썰어주세요.`,
        "냄비에 물 500ml를 넣고 끓여주세요.",
        `물이 끓으면 ${main.slice(0, 2).join(", ")}을(를) 넣어주세요.`,
        "마늘, 간장, 소금으로 간을 맞추고 10분간 더 끓여주세요.",
        "기호에 맞게 간을 조절하고 완성하세요.",
      ],
      tags: ["한식", "국물", "건강식"],
    },
    {
      id: "mock-r3",
      title: hasEnough ? `${main[0] ?? ""} 무침` : "간단 무침",
      description: `${main.slice(0, 2).join(", ")}을(를) 참기름으로 버무린 건강 반찬`,
      cookTime: "10분",
      difficulty: "쉬움",
      servings: 2,
      ingredients: [
        ...main.slice(0, 2).map((name) => makeIngredient(name, "100g")),
        makeIngredient("참기름", "1큰술"),
        makeIngredient("소금", "약간"),
        makeIngredient("마늘", "1쪽"),
        makeIngredient("간장", "1작은술"),
      ],
      steps: [
        `${main[0] ?? "재료"}를 깨끗이 씻어 준비하세요.`,
        "끓는 물에 30초~1분간 데쳐 찬물에 식혀주세요.",
        "물기를 꼭 짜고 마늘을 곱게 다져주세요.",
        "참기름, 소금, 간장, 다진 마늘을 넣고 조물조물 무쳐주세요.",
      ],
      tags: ["반찬", "건강식", "간단"],
    },
  ];
}
