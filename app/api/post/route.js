import { createClient } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("posts")
    .select("*, Users(username, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("GET /api/post error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user && data.length > 0) {
    const postIds = data.map((p) => p.id);
    const { data: userVotes } = await supabase
      .from("votes")
      .select("post_id, type")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const voteMap = {};
    userVotes?.forEach((v) => {
      voteMap[v.post_id] = v.type;
    });
    data.forEach((p) => {
      p.user_vote = voteMap[p.id] ?? null;
    });
  }

  return NextResponse.json(data);
}

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, title, image_url } = await req.json();
  if (!content)
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabase
    .from("posts")
    .insert({ content, title, image_url, user_id: user.id })
    .select("*, Users(username, display_name, avatar_url)")
    .single();

  if (error) {
    console.error("POST /api/post error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
