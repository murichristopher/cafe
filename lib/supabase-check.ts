import { supabase } from "@/lib/supabase"

/**
 * Checks if the Supabase client can access the users table
 * This can help diagnose permission issues
 */
export async function checkSupabaseUsersAccess() {
  console.log("[SUPABASE CHECK] Testing access to users table")

  try {
    // Try to count users
    const { count, error: countError } = await supabase.from("users").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("[SUPABASE CHECK] Error counting users:", countError)
      return {
        success: false,
        message: `Error counting users: ${countError.message}`,
        error: countError,
      }
    }

    console.log(`[SUPABASE CHECK] Successfully counted ${count} users`)

    // Try to get a single user
    const { data, error: selectError } = await supabase.from("users").select("*").limit(1)

    if (selectError) {
      console.error("[SUPABASE CHECK] Error selecting a user:", selectError)
      return {
        success: false,
        message: `Error selecting a user: ${selectError.message}`,
        error: selectError,
      }
    }

    if (!data || data.length === 0) {
      console.warn("[SUPABASE CHECK] No users found in the database")
      return {
        success: true,
        message: "No users found in the database",
        data: [],
      }
    }

    console.log(`[SUPABASE CHECK] Successfully retrieved a user: ${data[0].id}`)

    return {
      success: true,
      message: "Successfully accessed users table",
      data,
    }
  } catch (error) {
    console.error("[SUPABASE CHECK] Unexpected error:", error)
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    }
  }
}

