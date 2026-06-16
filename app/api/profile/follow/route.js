import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { target_user_id } = await req.json();
    if (!target_user_id)
      return NextResponse.json(
        { error: "Missing target_user_id" },
        { status: 400 },
      );
    if (target_user_id === session.user.id)
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 },
      );

    const { error } = await supabase
      .from("Follows")
      .insert({ follower_id: session.user.id, following_id: target_user_id });

    if (error) {
      if (error.code === "23505")
        return NextResponse.json(
          { error: "Already following" },
          { status: 409 },
        );
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await Promise.all([
      supabase.rpc("increment_follower_count", { user_id: target_user_id }),
      supabase.rpc("increment_following_count", { user_id: session.user.id }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { target_user_id } = await req.json();
    if (!target_user_id)
      return NextResponse.json(
        { error: "Missing target_user_id" },
        { status: 400 },
      );

    const { error } = await supabase
      .from("Follows")
      .delete()
      .eq("follower_id", session.user.id)
      .eq("following_id", target_user_id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    await Promise.all([
      supabase.rpc("decrement_follower_count", { user_id: target_user_id }),
      supabase.rpc("decrement_following_count", { user_id: session.user.id }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
