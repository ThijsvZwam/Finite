import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ following: false });

    const { searchParams } = new URL(req.url);
    const target_user_id = searchParams.get("target_user_id");
    if (!target_user_id)
      return NextResponse.json(
        { error: "Missing target_user_id" },
        { status: 400 },
      );

    const { data } = await supabase
      .from("Follows")
      .select("id")
      .eq("follower_id", session.user.id)
      .eq("following_id", target_user_id)
      .maybeSingle();

    return NextResponse.json({ following: !!data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
