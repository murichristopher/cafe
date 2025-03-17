"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types"

/**
 * Server action to create a user in the users table
 * This bypasses RLS policies because it runs on the server
 */
export async function createUserRecord(
  userId: string,
  email: string,
  name: string,
  role: "admin" | "fornecedor",
  phoneNumber: string,
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    const userData = {
      id: userId,
      email,
      name,
      role,
      phone_number: phoneNumber,
    }

    const { error } = await supabase.from("users").insert([userData])

    if (error) {
      console.error("Error creating user record:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error creating user record:", error)
    return { success: false, error }
  }
}

