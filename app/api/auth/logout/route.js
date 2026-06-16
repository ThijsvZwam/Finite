import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }

  return NextResponse.json({ message: "Logged out" }, { status: 200 });
}
