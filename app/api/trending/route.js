import { createClient } from "../../../lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("content")
    .gte("created_at", oneWeekAgo);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const tagCounts = {};
  for (const post of data ?? []) {
    const tags = post.content?.match(/#(\w+)/g) ?? [];
    for (const tag of tags) {
      const key = tag.slice(1).toLowerCase();
      tagCounts[key] = (tagCounts[key] ?? 0) + 1;
    }
  }

  const trending = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count })); // ✅ returns { tag, count }

  return NextResponse.json(trending);
}
