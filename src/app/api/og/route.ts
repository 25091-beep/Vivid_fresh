import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ViviFresh/1.0; +https://vivifresh.app)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ title: "", description: "", image: "", url });
    }

    const html = await res.text();

    const getMetaContent = (name: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, "i"),
        new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, "i"),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
      return "";
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMetaContent("title") || (titleMatch ? titleMatch[1].trim() : "");
    const description = getMetaContent("description");
    const image = getMetaContent("image");

    // YouTube 썸네일 특별 처리
    let thumbnail = image;
    if (!thumbnail && url.includes("youtube.com")) {
      const videoIdMatch = url.match(/v=([a-zA-Z0-9_-]+)/);
      if (videoIdMatch) {
        thumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
      }
    }
    if (!thumbnail && url.includes("youtu.be")) {
      const videoIdMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (videoIdMatch) {
        thumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg`;
      }
    }

    return NextResponse.json({ title, description, image: thumbnail, url });
  } catch {
    return NextResponse.json({ title: "", description: "", image: "", url });
  }
}
