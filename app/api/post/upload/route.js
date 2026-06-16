import { createClient } from "@/lib/supabase";
import { uploadToR2 } from "@/lib/r2";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop();
    const key = `posts/${user.id}/${Date.now()}.${ext}`;
    const publicUrl = await uploadToR2(file, key);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("POST /api/post/upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
