"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Post from "../../components/Post";
import SecondarySidebar from "../../components/nav/SecondarySidebar";
import { Loader2 } from "lucide-react";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q");
  const type = searchParams.get("type");

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setCurrentUserId(session?.user?.id ?? null);
    }

    init();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      if (type === "user" && query) {
        const { data } = await supabase
          .from("Users")
          .select("id, username, display_name, avatar_url, bio")
          .ilike("username", `%${query}%`)
          .limit(20);

        setUsers(data ?? []);
        setPosts([]);
      } else {
        const url = query ? `/api/explore?q=${query}` : "/api/explore";

        const res = await fetch(url);
        const data = await res.json();

        setPosts(Array.isArray(data) ? data : []);
        setUsers([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [query, type]);

  return (
    <section className="min-w-full w-full bg-black text-white pb-10 flex flex-row justify-center relative">
      <div className="flex-1 flex flex-row justify-center">
        <div className="w-full max-w-4xl flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-4 pt-6 pb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Explore
            </h1>

            {!query && (
              <span className="mt-2 py-1 px-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Most popular: last 7 days
              </span>
            )}

            {query && (
              <>
                <div className="h-8 w-px bg-zinc-800" />

                {type === "user" ? (
                  <p className="text-lg font-medium text-zinc-500 pt-1">
                    Users matching{" "}
                    <span className="text-purple-400">@{query}</span>
                  </p>
                ) : (
                  <p className="text-lg font-medium text-zinc-500 pt-1">
                    All posts tagged with{" "}
                    <span className="text-primary-muted">"{query}"</span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center p-4 gap-2 items-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-primary">Loading explore...</p>
            </div>
          )}

          {/* User Results */}
          {!loading &&
            type === "user" &&
            (users.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No users found for @{query}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => router.push(`/profile/${user.username}`)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer transition-all"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-zinc-700">
                      <img
                        src={user.avatar_url ?? "/Default_Profile.jpg"}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        {user.display_name || user.username}
                      </span>

                      <span className="text-xs text-zinc-500">
                        @{user.username}
                      </span>

                      {user.bio && (
                        <span className="text-xs text-zinc-400 mt-1 line-clamp-1">
                          {user.bio}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Post Results */}
          {!loading &&
            type !== "user" &&
            (posts.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                {query ? `No posts found for #${query}` : "No posts yet."}
              </p>
            ) : (
              posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId}
                />
              ))
            ))}
        </div>
      </div>

      <div className="hidden lg:block sticky top-0 h-fit">
        <SecondarySidebar />
      </div>
    </section>
  );
}