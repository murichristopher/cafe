import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("kanban_tasks")
      .select("*")
      .order("position", { ascending: true })

    if (error) throw error

    return NextResponse.json({ tasks: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, column_name, position, assigned_to } = body

    const { data, error } = await supabase
      .from("kanban_tasks")
      .insert([{ title, description, column_name, position, assigned_to }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ task: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description, column_name, position, assigned_to } = body

    const { data, error } = await supabase
      .from("kanban_tasks")
      .update({ title, description, column_name, position, assigned_to, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ task: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("kanban_tasks").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
