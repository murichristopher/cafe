import { NextResponse } from "next/server"
import { sendEventReminders } from "@/lib/reminder-notification"

// Secret key to protect the endpoint
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    // Verify the request is authorized
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    // For testing purposes, we'll make this endpoint more accessible
    // but still log unauthorized attempts
    if (secret !== CRON_SECRET) {
      console.warn("[TEST-CRON] Unauthorized access attempt, but allowing for testing")
    }

    console.log("[TEST-CRON] Starting test event reminders")

    // Send reminders for tomorrow's events
    const result = await sendEventReminders()

    console.log("[TEST-CRON] Test reminders completed with result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[TEST-CRON] Unexpected error in test reminders:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

