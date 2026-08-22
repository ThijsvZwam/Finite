import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    const { username } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("Users")
      .select(
        "id, username, display_name, bio, website_url, avatar_url, banner_url, followers_count, following_count, verified",
      )
      .eq("username", username)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
