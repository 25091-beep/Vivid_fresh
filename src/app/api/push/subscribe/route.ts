import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const SUBSCRIPTIONS_FILE = join(process.cwd(), ".push-subscriptions.json");

function readSubscriptions(): PushSubscriptionData[] {
  try {
    if (!existsSync(SUBSCRIPTIONS_FILE)) return [];
    return JSON.parse(readFileSync(SUBSCRIPTIONS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeSubscriptions(subs: PushSubscriptionData[]) {
  writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
}

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    const subs = readSubscriptions();
    const existing = subs.findIndex((s) => s.endpoint === subscription.endpoint);

    const newSub: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      createdAt: new Date().toISOString(),
    };

    if (existing >= 0) {
      subs[existing] = newSub;
    } else {
      subs.push(newSub);
    }

    writeSubscriptions(subs);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    const subs = readSubscriptions().filter((s) => s.endpoint !== endpoint);
    writeSubscriptions(subs);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
