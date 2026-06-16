import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, commentId } = await params;

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error }, { status: 500 });

  await supabase.rpc("decrement", {
    tbl: "posts",
    col: "comments_count",
    row_id: id,
  });

  return NextResponse.json({ message: "Deleted" });
}
