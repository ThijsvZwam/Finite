import { createClient } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase();


  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  let posts = [];

  if (query) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .ilike("content", `%#${query}%`)
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    posts = data ?? [];
  } else {
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*")
      .gte("created_at", oneWeekAgo)
      .order("upvotes_count", { ascending: false });

    if (recentPosts && recentPosts.length > 0) {
      posts = recentPosts;
    } else {
      const { data: fallback } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      posts = fallback ?? [];
    }
  }

  // Attach user data
  if (posts.length > 0) {
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const { data: users } = await supabase
      .from("Users")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    const userMap = Object.fromEntries(users?.map((u) => [u.id, u]) ?? []);
    posts = posts.map((p) => ({ ...p, Users: userMap[p.user_id] ?? null }));
  }

  // Attach current user's votes
  if (posts.length > 0 && userId) {
    const postIds = posts.map((p) => p.id);

    const { data: votes } = await supabase
      .from("votes")
      .select("post_id, type")
      .eq("user_id", userId)
      .in("post_id", postIds);

    const voteMap = Object.fromEntries(
      votes?.map((v) => [v.post_id, v.type]) ?? [],
    );

    posts = posts.map((p) => ({
      ...p,
      user_vote: voteMap[p.id] ?? null,
    }));
  }

  return NextResponse.json(posts);
}
