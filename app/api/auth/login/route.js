import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  // Initialize Supabase client
  const supabase = await createClient();

  // Extract credentials from the request body
  const { email, password } = await req.json();

  // Attempt to sign in with email and password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Return an error response if authentication fails
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Return success response with the authenticated user
  return NextResponse.json({
    message: "Login successful",
    user: data.user,
  });
}
