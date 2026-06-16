"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hash, Bell, User, Settings, Plus, X } from "lucide-react";
import Image from "next/image";
import DefaultAvatar from "../../public/Default_Profile.jpg";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef } from "react";
import { SettingsIcon } from "lucide-react";
import CreatePost from "../CreatePost";

function PostModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 w-full max-w-3xl rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/50">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Create Post
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2">
          <CreatePost onPostCreated={onClose} />
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const menuRef = useRef(null);
  const [trending, setTrending] = useState([]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTrending(data));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData(userId) {
      const { data } = await supabase
        .from("Users")
        .select("id, username, display_name, avatar_url")
        .eq("id", userId)
        .single();
      if (isMounted && data) setUser(data);
      if (isMounted) setLoading(false);
    }

    async function initializeUser() {
      if (initialUser) {
        if (isMounted) setLoading(false);
        return;
      }
      // ✅ getUser() instead of getSession() — authenticates with Supabase server
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await fetchUserData(user.id);
      } else {
        if (isMounted) setLoading(false);
      }
    }

    initializeUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ✅ session.user from onAuthStateChange is safe to use
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialUser]);

  return (
    <aside className="shrink-0 w-72 bg-black z-50 h-full overflow-hidden">
      <div className="w-full h-full overflow-hidden relative flex flex-col items-center justify-start">
        <div className="z-40">
          <div className="absolute -top-20 right-20 bg-purple-900/30 rounded-full w-96 h-96 blur-[130px]" />
          <div className="absolute top-80 right-10 bg-blue-950/20 rounded-full w-96 h-96 blur-[130px]" />
          <div className="absolute top-[720px] left-20 bg-purple-500/20 rounded-full w-96 h-96 blur-[200px]" />
        </div>

        <div className="bg-white/[0.02] border-r border-r-white/15 w-full h-full flex flex-col z-50 relative p-4">
          <div className="flex flex-col gap-8 overflow-y-auto flex-1 pr-1">
            <div className="flex flex-col justify-start">
              <nav className="flex flex-col gap-2">
                <NavItem icon={Home} title="Home" link="/" />
                <NavItem icon={Hash} title="Explore" link="/explore" />
                <NavItem
                  icon={Bell}
                  title="Notifications"
                  link="/notifications"
                />
                {(user || loading) && (
                  <NavItem
                    icon={User}
                    title="Profile"
                    link={user ? `/profile/${user.username}` : "#"}
                  />
                )}
                <NavItem icon={Settings} title="Settings" link="/settings" />
              </nav>
            </div>

            <div className="flex flex-col justify-start">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">
                  Popular on Finite
                </h2>
              </div>
              <nav className="flex flex-col gap-2">
                {trending.length > 0
                  ? trending.map(({ tag, count }) => (
                      <TrendingItem
                        key={`trending-${tag}`}
                        title={tag}
                        amount={count}
                      />
                    ))
                  : Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={`skeleton-${i}`}
                        className="h-12 rounded-xl bg-white/[0.02] animate-pulse"
                      />
                    ))}
              </nav>
            </div>
          </div>

          {user && (
            <button
              onClick={() => setPostModalOpen(true)}
              className="mt-4 w-full flex flex-row items-center justify-center gap-1 px-4 py-3 text-sm font-bold text-white bg-primary/10 hover:bg-primary/20 backdrop-blur-xl border border-white/10 hover:border-primary/50 rounded-xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:shadow-primary/20 group shrink-0"
            >
              <span>New post</span>
              <Plus className="w-5 h-5 text-white transition-colors" />
            </button>
          )}

          <section className="flex flex-row gap-3 items-center px-2 pt-4 mt-auto border-t border-white/5 relative">
            {loading ? (
              <div className="w-full h-12 bg-white/5 animate-pulse rounded-xl" />
            ) : user ? (
              <>
                <div className="shrink-0 w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-gray-800">
                  <Image
                    src={user.avatar_url ?? DefaultAvatar}
                    alt="avatar"
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-row items-center justify-between w-full gap-3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.display_name ?? user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>

                  <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                      onClick={() => setSettingsOpen(!settingsOpen)}
                      className="block p-1 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                      aria-label="Settings"
                    >
                      <SettingsIcon className="w-5 h-5" />
                    </button>

                    {settingsOpen && (
                      <div className="absolute bottom-full right-0 mb-3 w-48 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Link
                          href={user ? `/profile/${user.username}` : "#"}
                          onClick={() => setSettingsOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          My profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setSettingsOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          Settings
                        </Link>
                        <hr className="border-white/5 my-1" />
                        <button
                          onClick={() => {
                            setSettingsOpen(false);
                            logout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500 px-2 text-center">
                Not logged in.{" "}
                <Link className="text-primary" href="/auth/login">
                  Click here to login
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>

      {postModalOpen && <PostModal onClose={() => setPostModalOpen(false)} />}
    </aside>
  );
}

function NavItem({ icon: Icon, title, link, badge }) {
  const pathname = usePathname();
  const isActive = pathname === link;
  return (
    <Link
      href={link}
      className={`flex flex-row gap-4 items-center px-3 py-2.5 rounded-xl transition-all duration-200 dynamic-nav ${
        isActive
          ? "text-white font-bold bg-white/5"
          : "text-gray-300 hover:text-white hover:bg-white/5"
      }`}
    >
      {Icon && (
        <div className="relative">
          <Icon
            className={`w-6 h-6 shrink-0 ${isActive ? "text-primary-muted" : ""}`}
          />
          {badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      )}
      <span className="text-md">{title}</span>
    </Link>
  );
}

function TrendingItem({ title, amount }) {
  return (
    <Link
      href={`/explore?q=${title}`}
      className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] transition-all duration-200 group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary-muted group-hover:text-primary-hover transition-colors">
          #{title}
        </p>
      </div>
      <p className="text-xs text-gray-500 font-light">
        {amount} {amount === 1 ? "message" : "messages"}
      </p>
    </Link>
  );
}
