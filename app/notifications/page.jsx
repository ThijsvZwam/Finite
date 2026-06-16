"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import SecondarySidebar from "../../components/nav/SecondarySidebar";

export default function Page() {
  const [notifications, setNotifications] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let channel;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:Users!actor_id(username, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) console.error("notifications fetch error:", error);

      const fetched = data ?? [];
      setNotifications(fetched);

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      // Trim oldest beyond 10
      if (fetched.length > 10) {
        const toDelete = fetched.slice(10).map((n) => n.id);
        await supabase.from("notifications").delete().in("id", toDelete);
      }

      channel = supabase
        .channel(`notifications-${user.id}-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => {
              const updated = [payload.new, ...prev];
              // Trim to 10 on new insert too
              return updated.slice(0, 10);
            });
          },
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  function label(n) {
    const name = (
      <a
        href={`/profile/${n.actor?.username}`}
        className="font-semibold text-white hover:underline"
      >
        {n.actor?.username}
      </a>
    );
    if (n.type === "follow") return <span>{name} followed you</span>;
    if (n.type === "comment") return <span>{name} commented on your post</span>;
    if (n.type === "upvote") return <span>{name} upvoted your post</span>;
  }

  return (
    <section className="min-w-full w-full bg-black text-white pb-10 flex flex-row justify-center relative">
      <div className="flex-1 flex flex-row justify-start pl-3">
        <div className="w-full max-w-2xl flex flex-col gap-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Notifications
          </h1>

          <div className="space-y-3">
            {notifications.length === 0 && (
              <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                <p className="text-zinc-500 text-sm">
                  There are <span className="font-bold">no notifications</span>{" "}
                  to show.
                </p>
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
                  n.read
                    ? "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <img
                  src={n.actor?.avatar_url ?? "/Default_Profile.jpg"}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                  alt="avatar"
                />
                <div className="flex-1">
                  <div className="text-sm text-zinc-200 leading-snug">
                    {label(n)}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block sticky top-0 h-fit">
        <SecondarySidebar />
      </div>
    </section>
  );
}
