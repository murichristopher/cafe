import { NextResponse } from "next/server"
import { sendEventReminders } from "@/lib/reminder-notification"

// Secret key to protect the endpoint
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  try {
    // Verify the request is authorized
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    // if (secret !== CRON_SECRET) {
    // console.error("[CRON] Unauthorized access attempt to daily reminders")
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    console.log("[CRON] Starting daily event reminders")

    // Send reminders for tomorrow's events
    const result = await sendEventReminders()

    if (!result.success) {
      console.error("[CRON] Error sending reminders:", result.message)
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    console.log("[CRON] Daily reminders completed successfully")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[CRON] Unexpected error in daily reminders:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

