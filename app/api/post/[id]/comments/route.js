import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from("comments")
    .select("*, Users(username, display_name, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content)
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: id, content, user_id: user.id })
    .select("*, Users(username, display_name, avatar_url)")
    .single();

  if (error) {
    console.error("POST comments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment", {
    tbl: "posts",
    col: "comments_count",
    row_id: id,
  });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await params;

  const { data: comment } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (!comment || comment.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase.from("comments").delete().eq("id", commentId);
  return NextResponse.json({ success: true });
}
