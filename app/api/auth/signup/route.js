import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  const supabase = await createClient();
  const { email, password, username, timeLimit } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json({ error: "Fill in all fields" }, { status: 400 });
  }

  // Check username not taken
  const { data: existing } = await supabase
    .from("Users")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 400 },
    );
  }

  // Create Supabase auth user
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Signup failed" },
      { status: 400 },
    );
  }

  // Insert profile row with same UUID
  const { error: profileError } = await supabase.from("Users").insert({
    id: data.user.id,
    email: email.toLowerCase().trim(),
    username: username.trim(),
    time_limit: timeLimit,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Signup successful", user: data.user });
}
