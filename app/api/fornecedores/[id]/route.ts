import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Fix the warning by using params in an async context
    const fornecedorId = params.id
    const { name, email, phone_number } = await request.json()

    console.log("Updating fornecedor:", fornecedorId)
    console.log("Data:", { name, email, phone_number })

    const { data: allUsers, error: allUsersError }  = await supabase.from("users").select("*").eq("role", "fornecedor")

    if (allUsersError) {
      console.error("Error fetching all users:", allUsersError)
    } else {
      console.log("Sample users in database:", allUsers)
    }

    // Check if the fornecedor exists first, but don't use .single()
    const { data: checkData, error: checkError } = await supabase.from("users").select("*").eq("id", fornecedorId)

    if (checkError) {
      console.error("Error checking if fornecedor exists:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (!checkData || checkData.length === 0) {
      console.error("Fornecedor not found:", fornecedorId)

      // Try to find the fornecedor by email as a fallback
      const { data: emailCheckData, error: emailCheckError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("role", "fornecedor")

      if (emailCheckError) {
        console.error("Error checking fornecedor by email:", emailCheckError)
      } else if (emailCheckData && emailCheckData.length > 0) {
        console.log("Found fornecedor by email instead of ID:", emailCheckData[0])

        // Update using the found ID
        const foundFornecedor = emailCheckData[0]
        const { data: updateData, error: updateError } = await supabase
          .from("users")
          .update({
            name,
            phone_number,
            updated_at: new Date().toISOString(),
          })
          .eq("id", foundFornecedor.id)
          .select()

        if (updateError) {
          console.error("Error updating fornecedor by email:", updateError)
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          data: updateData,
          note: "Fornecedor was found by email instead of ID",
        })
      }

      return NextResponse.json(
        {
          error: "Fornecedor not found",
          debug: {
            id: fornecedorId,
            sampleUsers: allUsers?.slice(0, 3) || [],
          },
        },
        { status: 404 },
      )
    }

    const beforeData = checkData[0]
    console.log("Before update:", beforeData)

    // Update the fornecedor in the database
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        phone_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fornecedorId)
      .select()

    if (error) {
      console.error("Error updating fornecedor:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Update result:", data)

    return NextResponse.json({
      success: true,
      data: data[0],
    })
  } catch (error: any) {
    console.error("Unexpected error updating fornecedor:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

