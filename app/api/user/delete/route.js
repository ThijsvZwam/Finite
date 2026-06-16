import { createClient } from "@/lib/supabase";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(req) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Manually delete in order
  await admin.from("votes").delete().eq("user_id", user.id);
  await admin.from("comments").delete().eq("user_id", user.id);
  await admin.from("notifications").delete().eq("user_id", user.id);
  await admin.from("notifications").delete().eq("actor_id", user.id);
  await admin.from("posts").delete().eq("user_id", user.id);
  await admin.from("Follows").delete().eq("follower_id", user.id);
  await admin.from("Follows").delete().eq("following_id", user.id);
  await admin.from("Users").delete().eq("id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
