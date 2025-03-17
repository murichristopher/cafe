"use server"

import { createClient } from "@supabase/supabase-js"

/**
 * Admin-specific server action to create a fornecedor
 * This uses the service role key for elevated permissions
 */
export async function adminCreateFornecedor(name: string, email: string, phoneNumber: string) {
  try {
    // Create a direct Supabase client using environment variables
    // This will have the same permissions as your service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: existingUsers, error: lookupError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .limit(1)

    if (lookupError) {
      console.error("Error checking for existing user:", lookupError)
      return { success: false, error: lookupError.message }
    }

    // If user already exists, return an error
    if (existingUsers && existingUsers.length > 0) {
      return {
        success: false,
        error: `Um usuário com o email ${email} já existe.`,
      }
    }

    // Generate a random password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // Create auth user using the regular signup method
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name,
          role: "fornecedor",
          phone_number: phoneNumber || "",
        },
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user" }
    }

    const { error: dbError } = await supabase.from("users").upsert(
      {
        id: authData.user.id,
        email,
        name,
        phone_number: phoneNumber || null,
        role: "fornecedor",
      },
      {
        onConflict: "id", // Specify the conflict target
        ignoreDuplicates: false, // Update the record if it exists
      },
    )

    if (dbError) {
      console.error("Error creating user record:", dbError)
      return { success: false, error: dbError.message }
    }

    return {
      success: true,
      error: null,
      message: "Fornecedor criado com sucesso. Um email de confirmação foi enviado.",
    }
  } catch (error: any) {
    console.error("Unexpected error creating fornecedor:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

