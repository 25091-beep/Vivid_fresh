import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SUBSCRIPTIONS_FILE = join(process.cwd(), ".push-subscriptions.json");

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function readSubscriptions(): PushSubscriptionData[] {
  try {
    if (!existsSync(SUBSCRIPTIONS_FILE)) return [];
    return JSON.parse(readFileSync(SUBSCRIPTIONS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

// POST /api/push/send
// Body: { title: string, body: string, url?: string }
// Requires CRON_SECRET header for security
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: "VAPID keys are not configured" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      process.env.VAPID_MAILTO || "mailto:admin@vivifresh.local",
      publicKey,
      privateKey
    );

    const { title, body, url = "/dashboard" } = await request.json();

    const subscriptions = readSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions" });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0;
    const failed: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err) {
          failed.push(sub.endpoint);
        }
      })
    );

    return NextResponse.json({ sent, failed: failed.length });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
