import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const userId = searchParams.get("user_id") || null;
  const followingOnly = searchParams.get("following_only") === "true";
  const popular = searchParams.get("popular") === "true";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("posts")
    .select("*, Users(username, display_name, avatar_url)")
    .range(from, to);

  if (popular) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    query = query
      .order("upvotes_count", { ascending: false })
      .gte("created_at", yesterday.toISOString());
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  if (followingOnly && userId) {
    const { data: follows } = await supabase
      .from("Follows")
      .select("following_id")
      .eq("follower_id", userId);

    const followingIds = follows?.map((f) => f.following_id) ?? [];
    followingIds.push(userId);

    if (followingIds.length > 0) {
      query = query.in("user_id", followingIds);
    }
  } else if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: postsData, error: postsError } = await query;

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  if (user && postsData.length > 0) {
    const postIds = postsData.map((p) => p.id);

    const { data: userVotes } = await supabase
      .from("votes")
      .select("post_id, type")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    const voteMap = {};
    userVotes?.forEach((v) => {
      voteMap[v.post_id] = v.type;
    });

    postsData.forEach((p) => {
      p.user_vote = voteMap[p.id] ?? null;
    });
  }

  return NextResponse.json(postsData ?? []);
}
