import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type"); // 'users' | 'hashtags' | 'posts'

  if (!q || q.length < 2) return NextResponse.json({ results: [] });
  if (q.length > 100)
    return NextResponse.json({ error: "Query too long" }, { status: 400 });

  try {
    if (type === "users") {
      const { data, error } = await supabase
        .from("Users")
        .select("id, username, avatar_url")
        .ilike("username", `%${q}%`)
        .limit(5);
      if (error) throw error;
      return NextResponse.json({ results: data });
    }

    if (type === "hashtags") {
      const { data, error } = await supabase
        .from("Hashtags")
        .select("id, name, post_count")
        .ilike("name", `%${q}%`)
        .order("post_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return NextResponse.json({ results: data });
    }

    // Default: search posts
    const { data, error } = await supabase
      .from("Posts")
      .select("id, title, content, slug")
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(8);
    if (error) throw error;
    return NextResponse.json({ results: data });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
