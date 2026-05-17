import { NextRequest, NextResponse } from "next/server";

export interface BarcodeProduct {
  barcode: string;
  name: string;
  manufacturer: string;
  foodGroup: string;         // 식품군 (원본)
  category: IngredientCategory;
  rawMaterials: string;      // 원재료명
  unit: string;              // 자동 추정 단위
  expiryHint: string;        // 유통기한 힌트 (e.g. "냉장보관 제조일로부터 7일")
  source: "api" | "mock";
}

type IngredientCategory =
  | "refrigerated"
  | "frozen"
  | "room_temp"
  | "beverage"
  | "condiment"
  | "snack"
  | "other";

// 식품군 → 카테고리 매핑
const FOOD_GROUP_MAP: Record<string, IngredientCategory> = {
  "음료류": "beverage",
  "탄산음료": "beverage",
  "과일음료": "beverage",
  "유제품": "refrigerated",
  "발효유": "refrigerated",
  "치즈": "refrigerated",
  "빵류": "snack",
  "과자류": "snack",
  "사탕류": "snack",
  "초콜릿류": "snack",
  "빙과류": "frozen",
  "냉동식품": "frozen",
  "양념류": "condiment",
  "장류": "condiment",
  "소스류": "condiment",
  "드레싱": "condiment",
  "조미료": "condiment",
  "식용유": "room_temp",
  "당류": "room_temp",
  "면류": "room_temp",
  "쌀": "room_temp",
  "두류": "room_temp",
};

// 제품명 키워드 → 카테고리 추정
function guessCategoryFromName(name: string, foodGroup: string): IngredientCategory {
  const n = name.toLowerCase();
  const g = foodGroup.toLowerCase();

  // foodGroup 우선 매핑
  for (const [key, cat] of Object.entries(FOOD_GROUP_MAP)) {
    if (g.includes(key.toLowerCase())) return cat;
  }

  // 이름 기반 추정
  if (/음료|주스|콜라|사이다|물|차$|커피|우유|두유/.test(n)) return "beverage";
  if (/과자|쿠키|비스킷|초콜릿|사탕|젤리|캔디/.test(n)) return "snack";
  if (/소스|케첩|마요|드레싱|고추장|된장|간장|식초/.test(n)) return "condiment";
  if (/아이스크림|냉동|만두|피자/.test(n)) return "frozen";
  if (/라면|면|파스타|빵|쌀|오트밀/.test(n)) return "room_temp";
  if (/우유|요거트|치즈|버터|계란|두부|고기|생선|야채|채소/.test(n)) return "refrigerated";

  return "room_temp";
}

// 제품명에서 단위 추정
function guessUnit(name: string, foodGroup: string): string {
  const n = name.toLowerCase();
  if (/ml|l\b|리터/.test(n)) return "ml";
  if (/g\b|kg\b|그램/.test(n)) return "g";
  if (/개$|알$/.test(n)) return "개";
  if (/팩|pack/.test(n)) return "팩";
  if (/캔|can/.test(n)) return "캔";
  if (/병|bottle/.test(n)) return "병";
  if (/봉|봉지/.test(n)) return "봉";
  if (/음료|주스|콜라|사이다/.test(foodGroup)) return "캔";
  if (/유제품|우유/.test(foodGroup)) return "ml";
  return "개";
}

async function fetchFoodSafetyAPI(barcode: string, apiKey: string): Promise<BarcodeProduct | null> {
  // I2570: 식품영양성분DB (바코드 검색 지원)
  const url = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/I2570/json/1/5/BAR_CD=${barcode}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) return null;
  const data = await res.json();

  const rows = data?.I2570?.row;
  if (!rows || rows.length === 0) return null;

  const item = rows[0];
  const name: string = item.PRDLST_NM || item.FOOD_NM || "";
  const manufacturer: string = item.BSSH_NM || item.MAKER_NM || "";
  const foodGroup: string = item.PRDLST_DCNM || item.GROUP_NM || "";
  const rawMaterials: string = item.RAWMTRL_NM || "";

  if (!name) return null;

  return {
    barcode,
    name,
    manufacturer,
    foodGroup,
    category: guessCategoryFromName(name, foodGroup),
    rawMaterials,
    unit: guessUnit(name, foodGroup),
    expiryHint: item.QLTY_MTRL_NM || "",
    source: "api",
  };
}

// 개발/테스트용 목(Mock) 데이터
const MOCK_PRODUCTS: Record<string, Partial<BarcodeProduct>> = {
  "8801062432366": {
    name: "신라면",
    manufacturer: "농심",
    foodGroup: "면류",
    rawMaterials: "밀가루, 팜유, 전분, 고춧가루, 마늘",
    expiryHint: "제조일로부터 5개월",
  },
  "8801115131205": {
    name: "오뚜기 참기름",
    manufacturer: "오뚜기",
    foodGroup: "식용유",
    rawMaterials: "참깨 100%",
    expiryHint: "제조일로부터 18개월",
  },
  "8801234567890": {
    name: "서울우유 1L",
    manufacturer: "서울우유협동조합",
    foodGroup: "유제품",
    rawMaterials: "원유 100%",
    expiryHint: "냉장보관 14일",
  },
  "8801117200027": {
    name: "참이슬 후레쉬 360ml",
    manufacturer: "하이트진로",
    foodGroup: "주류",
    rawMaterials: "정제수, 주정",
    expiryHint: "",
  },
  "8801056007236": {
    name: "코카콜라 355ml",
    manufacturer: "코카콜라",
    foodGroup: "탄산음료",
    rawMaterials: "탄산수, 당류, 카라멜색소, 인산",
    expiryHint: "제조일로부터 12개월",
  },
  "8801063001323": {
    name: "크라운 초코하임",
    manufacturer: "크라운제과",
    foodGroup: "과자류",
    rawMaterials: "밀가루, 설탕, 코코아파우더",
    expiryHint: "제조일로부터 6개월",
  },
};

function getMockProduct(barcode: string): BarcodeProduct {
  const mock = MOCK_PRODUCTS[barcode];
  const name = mock?.name ?? `바코드 ${barcode}`;
  const foodGroup = mock?.foodGroup ?? "";

  return {
    barcode,
    name,
    manufacturer: mock?.manufacturer ?? "",
    foodGroup,
    category: guessCategoryFromName(name, foodGroup),
    rawMaterials: mock?.rawMaterials ?? "",
    unit: guessUnit(name, foodGroup),
    expiryHint: mock?.expiryHint ?? "",
    source: "mock",
  };
}

// GET /api/barcode/lookup?barcode=8801062432366
export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode");

  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: "유효하지 않은 바코드입니다" }, { status: 400 });
  }

  const apiKey = process.env.FOOD_SAFETY_API_KEY;

  // API 키가 있으면 실제 API 호출
  if (apiKey && apiKey !== "your_food_safety_api_key_here") {
    try {
      const product = await fetchFoodSafetyAPI(barcode, apiKey);
      if (product) {
        return NextResponse.json({ product });
      }
      // API에서 못 찾은 경우
      return NextResponse.json({ product: null, message: "제품을 찾을 수 없어요" });
    } catch (err) {
      console.error("Food safety API error:", err);
      // API 오류 시 mock으로 fallback (개발 편의)
      return NextResponse.json({ product: getMockProduct(barcode), fallback: true });
    }
  }

  // API 키 없으면 mock 데이터
  const mockProduct = getMockProduct(barcode);
  return NextResponse.json({ product: mockProduct });
}
