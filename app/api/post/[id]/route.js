import { createClient } from "../../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from("posts")
    .select("*, Users(username, display_name, avatar_url)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;

  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (!post || post.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("posts").delete().eq("id", postId);
  return NextResponse.json({ success: true });
}
