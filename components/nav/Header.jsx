"use client";
import { Clock2, Search, User as UserIcon, Hash } from "lucide-react";
import Image from "next/image";
import Logo from "../../public/Logo.png";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import packageJson from "../../package.json";

export default function Header({ timeUsed, timeLimit: propsTimeLimit, unlimited }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [hashtagResults, setHashtagResults] = useState([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setSearchQuery("");
    setSearching(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchQuery.startsWith("@")) {
      setUserResults([]);
      return;
    }
    const q = searchQuery.slice(1).trim();
    if (!q) {
      setUserResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoadingUsers(true);
      const { data } = await supabase
        .from("Users")
        .select("id, username, avatar_url")
        .ilike("username", `%${q}%`)
        .limit(5);
      setUserResults(data ?? []);
      setLoadingUsers(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.startsWith("@")) return;
    const q = searchQuery.startsWith("#")
      ? searchQuery.slice(1).trim()
      : searchQuery.trim();
    if (!q) {
      setHashtagResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoadingHashtags(true);
      const { data } = await supabase
        .from("Hashtags")
        .select("id, name, post_count")
        .ilike("name", `%${q}%`)
        .order("post_count", { ascending: false })
        .limit(5);
      setHashtagResults(data ?? []);
      setLoadingHashtags(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTimeData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("Users")
        .select("time_limit")
        .eq("id", user.id)
        .single();

      if (profile) setTimeLimit(profile.time_limit);

      const today = new Date().toISOString().split("T")[0];
      const { data: sessions } = await supabase
        .from("Sessions")
        .select("time_used")
        .eq("user_id", user.id)
        .gte("session_started", today);

      const totalUsed = sessions?.reduce((sum, s) => sum + s.time_used, 0) ?? 0;

      if (profile) {
        const remaining = profile.time_limit - totalUsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
        if (totalUsed >= profile.time_limit) router.push("/timelimit");
      }
    };

    fetchTimeData();
    const interval = setInterval(fetchTimeData, 60000);
    return () => clearInterval(interval);
  }, [router]);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (h > 0) {
      const hourPart = `${h} hour${h !== 1 ? "s" : ""}`;
      return m > 0 ? `${hourPart} ${m} minute${m !== 1 ? "s" : ""}` : hourPart;
    }

    return `${m} minute${m !== 1 ? "s" : ""}`;
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (searchQuery.startsWith("@")) {
        const q = searchQuery.slice(1);
        router.push(`/explore?type=user&q=${encodeURIComponent(q)}`);
      } else {
        const q = searchQuery.startsWith("#")
          ? searchQuery.slice(1)
          : searchQuery;
        router.push(`/explore?q=${encodeURIComponent(q)}`);
      }
      setSearching(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex min-h-16 w-full items-center justify-between border-b border-white/15 bg-black px-6 py-3">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-30 -top-5 bg-purple-900/40 rounded-full w-96 h-96 blur-[130px]" />
        <div className="absolute left-100 bg-blue-900/20 rounded-full w-96 h-96 blur-[130px]" />
        <div className="absolute right-30 bg-purple-900/30 rounded-full w-96 h-96 blur-[130px]" />
      </div>

      <Link href="/" className="flex items-center gap-3 w-1/4 min-w-50">
        <Image
          src={Logo}
          alt="App Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-white">
              Finite
            </h1>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-thin text-white">
              version {packageJson.version}
            </span>
          </div>
          <p className="text-xs text-gray-400">Consciously social.</p>
        </div>
      </Link>

      <section className="relative flex w-full max-w-md items-center justify-center">
        <div className="absolute inset-0 -z-10 m-auto h-8 w-4/5 rounded-full bg-purple-500/30 blur-2xl pointer-events-none" />
        <div className="absolute inset-0 -z-10 m-auto h-8 w-4/5 rounded-full bg-primary/30 blur-2xl pointer-events-none" />

        <Search className="absolute left-4 h-5 w-5 text-white/40 pointer-events-none" />
        <input
          onFocus={() => setSearching(true)}
          onBlur={() => setTimeout(() => setSearching(false), 150)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          type="text"
          placeholder="Search anything, @ for users, # for tags"
          className="h-10 w-full rounded-full border border-purple-500/50 bg-black/80 pl-12 pr-4 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />

        <div
          className={`absolute top-full left-0 mt-2 w-full bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-4 z-50 transition-all duration-200
          ${searching ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"}`}
        >
          {searchQuery.length === 0 ? (
            <p className="text-sm text-white/50 italic px-2">
              Type <span className="text-purple-400 font-bold">@</span> for users or <span className="text-purple-400 font-bold">#</span> for hashtags...
            </p>
          ) : searchQuery.startsWith("@") ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
                <UserIcon className="w-3 h-3" />
                <span>People</span>
              </div>
              {loadingUsers ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                    <div className="flex flex-col gap-1">
                      <div className="h-3 w-24 bg-white/20 rounded" />
                      <div className="h-2 w-16 bg-white/10 rounded" />
                    </div>
                  </div>
                ))
              ) : userResults.length > 0 ? (
                userResults.map((user) => (
                  <div
                    key={user.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      router.push(`/profile/${user.username}`);
                      setSearching(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <img
                      src={user.avatar_url ?? "/Default_Profile.jpg"}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <span className="text-sm text-white">@{user.username}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/30 px-2">No users found</p>
              )}

              <div className="p-3 text-xs text-white/30">
                Press{" "}
                <kbd className="font-sans bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                  Enter
                </kbd>{" "}
                to see all users matching @{searchQuery.slice(1)}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider px-2 mb-2">
                <Hash className="w-3 h-3" />
                <span>Search</span>
              </div>

              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  const q = searchQuery.startsWith("#") ? searchQuery.slice(1) : searchQuery;
                  router.push(`/explore?q=${encodeURIComponent(q)}`);
                  setSearching(false);
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-white cursor-pointer hover:bg-purple-500/20 transition-all"
              >
                <Search className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Search for "{searchQuery}"</span>
              </div>

              {loadingHashtags ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-4 h-4 rounded bg-white/10" />
                    <div className="h-3 w-28 bg-white/20 rounded" />
                  </div>
                ))
              ) : hashtagResults.length > 0 ? (
                <div className="pt-1 space-y-1">
                  {hashtagResults.map((tag) => (
                    <div
                      key={tag.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        router.push(`/explore?q=${encodeURIComponent(tag.name)}`);
                        setSearching(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                      {tag.post_count && (
                        <span className="text-xs text-white/20">{tag.post_count} posts</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="p-3 text-xs text-white/30">
                Press{" "}
                <kbd className="font-sans bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                  Enter
                </kbd>{" "}
                to see all results
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex w-1/4 justify-end">
        <div className="flex flex-col items-end gap-0.5 bg-white/5 px-2 py-0.5 rounded-full">
          <div className="flex items-center gap-2 text-white">
            <Clock2 className="h-4 w-4 text-primary" />
            <time className="text-sm">
              {unlimited
                ? "Unlimited"
                : typeof timeLimit === "number"
                  ? `${formatTime(Math.max(timeLimit - timeUsed, 0))} left`
                  : "--:-- left"}
            </time>
          </div>
        </div>
      </div>
    </header>
  );
}