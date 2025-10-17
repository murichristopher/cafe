import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tasks } = body // array of { id, column_name, position }

    // Update all tasks in a transaction-like manner
    const updates = tasks.map((task: any) =>
      supabase
        .from("kanban_tasks")
        .update({ column_name: task.column_name, position: task.position, updated_at: new Date().toISOString() })
        .eq("id", task.id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
