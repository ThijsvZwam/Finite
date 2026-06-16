"use client";
import {
  NewspaperIcon,
  MessageSquare,
  Globe,
  Loader2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function SecondarySidebar() {
  return (
    <aside className="h-full flex flex-col gap-4">
      <div className="w-80 xl:w-96 h-fit border rounded-xl mx-4 border-white/15 bg-black/20 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex flex-row items-center gap-3 w-full">
            <NewspaperIcon className="w-6 h-6 text-primary" />
            <h1 className="text-xl text-white font-semibold">Latest News</h1>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-zinc-500">
              Stay updated with the latest trends on Finite.
            </p>
            {/* News items */}
            <News />
          </div>
        </div>
      </div>
      <div className="w-80 xl:w-96 h-fit border rounded-xl mx-4 border-white/15 bg-black/20 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex flex-row items-center gap-3 w-full">
            <UserPlus className="w-6 h-6 text-primary" />
            <h1 className="text-xl text-white font-semibold">
              Suggested People
            </h1>
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-xs text-zinc-500">
              People who you might want to follow
            </p>
            <SuggestedUsers />
          </div>
        </div>
      </div>
    </aside>
  );
}

function SuggestedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const usernames = ["keano", "finite", "thijsvzwam"];

  useEffect(() => {
    async function fetchSuggested() {
      try {
        const results = await Promise.all(
          usernames.map(async (u) => {
            const res = await fetch(`/api/profile/${u}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.profile;
          }),
        );
        setUsers(results.filter((user) => user !== null));
      } catch (err) {
        console.error("Error fetching suggested users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggested();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.username}
          className="flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 shrink-0">
              <Image
                src={user.avatar_url ?? "/Default_Profile.jpg"}
                alt="Avatar"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/profile/${user.username}`}
                className="text-sm font-semibold text-white hover:underline truncate"
              >
                {user.display_name || user.username}
              </Link>
              <span className="text-[10px] text-zinc-500">
                @{user.username}
              </span>
            </div>
          </div>
          <Link
            href={`/profile/${user.username}`}
            className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-bold hover:bg-zinc-200 transition-colors"
          >
            View
          </Link>
        </div>
      ))}
    </div>
  );
}

function News() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch news");
        return res.json();
      })
      .then((data) => {
        setNewsItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  if (error)
    return <p className="text-xs text-red-400 px-2">Could not load news.</p>;

  return (
    <>
      {newsItems.map((item, index) => (
        <NewsItem
          key={index}
          title={item.title}
          description={item.description}
          image={item.urlToImage}
          url={item.url}
        />
      ))}
    </>
  );
}

function NewsItem({ title, description, image, url }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-row gap-3">
      <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-lg items-center">
        <img
          src={image}
          alt="News thumbnail"
          className="object-cover"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm text-white font-bold truncate">{title}</h1>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
            <Globe className="w-3 h-3 text-zinc-400" />
            <Link
              href={url}
              className="text-[10px] text-zinc-400 font-medium truncate max-w-[120px]"
            >
              {url ? new URL(url).hostname : "news.com"}
            </Link>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary-muted hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all duration-200 group"
          >
            <MessageSquare className="w-3 h-3 transition-transform" />
            Post
          </Link>
        </div>
      </div>
    </div>
  );
}
