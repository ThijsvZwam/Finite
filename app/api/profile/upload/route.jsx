import { createClient } from "@/lib/supabase";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // "avatar" or "banner"

    if (!file || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["avatar", "banner"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    // Get current image URL to delete later
    const column = type === "avatar" ? "avatar_url" : "banner_url";
    const { data: currentUser } = await supabase
      .from("Users")
      .select(column)
      .eq("id", session.user.id)
      .single();

    const oldUrl = currentUser?.[column];

    // Upload new image
    const ext = file.name.split(".").pop();
    const key = `${type}s/${session.user.id}/${Date.now()}.${ext}`;
    const publicUrl = await uploadToR2(file, key);

    // Save new URL to Users table
    const { error } = await supabase
      .from("Users")
      .update({ [column]: publicUrl })
      .eq("id", session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Delete old image from R2 after successful upload
    if (oldUrl) await deleteFromR2(oldUrl);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
