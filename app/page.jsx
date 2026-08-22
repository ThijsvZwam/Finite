"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Post from "../components/Post";
import CreatePost from "../components/CreatePost";
import SecondarySidebar from "../components/nav/SecondarySidebar";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  async function loadPosts(userId) {
  setLoading(true);

  try {
    if (!userId) {
      setPosts([]);
      return;
    }

    const res = await fetch(
      `/api/posts?page=1&limit=20&following_only=true&user_id=${userId}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load posts");
    }

    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setCurrentUserId(uid);
      await loadPosts(uid);
    }
    init();
  }, []);

  return (
    <section className="min-w-full w-full bg-black text-white pb-10 flex flex-row justify-center relative">
      <div className="flex-1 flex flex-row justify-center">
        <div className="w-full max-w-4xl">
          {loading && (
            <div className="flex justify-center p-4 gap-2 items-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-primary">Loading posts...</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-zinc-400 text-sm">No posts yet.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Follow some people to see their posts here.
              </p>
            </div>
          )}

          {!loading &&
            posts.map((post) => (
              <Post key={post.id} post={post} currentUserId={currentUserId} />
            ))}
        </div>
      </div>

      <div className="hidden lg:block sticky top-0 h-fit">
        <SecondarySidebar />
      </div>
    </section>
  );
}
