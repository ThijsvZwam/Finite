import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

async function getPostCounts(supabase, postId) {
  const { data } = await supabase
    .from("posts")
    .select("upvotes_count, downvotes_count")
    .eq("id", postId)
    .single();
  return data;
}

export async function POST(req, { params }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const { type } = await req.json();
  const user_id = user.id;

  const { data: existing } = await supabase
    .from("votes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (!type || (existing && existing.type === type)) {
    if (existing) {
      await supabase.from("votes").delete().eq("id", existing.id);
    }
    const counts = await getPostCounts(supabase, postId);
    return NextResponse.json({ user_vote: null, ...counts });
  }

  if (existing) {
    await supabase.from("votes").update({ type }).eq("id", existing.id);
    const counts = await getPostCounts(supabase, postId);
    return NextResponse.json({ user_vote: type, ...counts });
  }

  await supabase.from("votes").insert({ post_id: postId, user_id, type });
  const counts = await getPostCounts(supabase, postId);
  return NextResponse.json({ user_vote: type, ...counts });
}
