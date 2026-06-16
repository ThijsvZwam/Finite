import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    if (!userId)
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("Follows")
      .select(
        "following_id, Users!Follows_following_id_fkey(id, username, display_name, avatar_url, verified)",
      )
      .eq("follower_id", userId);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ users: data.map((f) => f.Users) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
