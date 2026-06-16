"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DefaultImage from "../../../public/Default_Profile.jpg";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchProfile,
  fetchFollowStatus,
  followUser,
  unfollowUser,
  editProfile,
} from "@/lib/profileApi";
import {
  Edit2Icon,
  User,
  ShieldCheck,
  Users,
  UserRoundCheck,
  Zap,
  Calendar,
  NewspaperIcon,
} from "lucide-react";
import Post from "@/components/Post";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} username
 * @property {string|null} display_name
 * @property {string|null} bio
 * @property {string|null} website_url
 * @property {string|null} avatar_url
 * @property {string|null} banner_url
 * @property {number} follower_count
 * @property {number} following_count
 * @property {boolean} verified
 */

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function EditModal({ profile, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    bio: profile.bio ?? "",
    website_url: profile.website_url ?? "",
  });
  const [uploading, setUploading] = useState(false);

  function set(key, value) {
    const limits = {
      display_name: 30,
      bio: 200,
      website_url: 100,
    };

    const limit = limits[key];

    if (limit && value.length > limit) {
      return;
    }

    setForm((f) => ({ ...f, [key]: value }));
  }
  async function compressImage(file, maxWidth, maxHeight, quality = 0.85) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          quality,
        );
      };
      img.src = url;
    });
  }

  async function handleImageUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      let fileToUpload = file;
      if (type === "avatar") {
        fileToUpload = await compressImage(file, 400, 400, 0.85);
      } else if (type === "banner") {
        fileToUpload = await compressImage(file, 1600, 600, 0.92);
      }
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("type", type);
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((f) => ({
          ...f,
          [type === "avatar" ? "avatar_url" : "banner_url"]: data.url,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    await onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-black border border-white/10 rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-gray-400">Avatar</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "avatar")}
              className="mt-1 block w-full text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">Banner</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "banner")}
              className="mt-1 block w-full text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
            />
          </div>
          {uploading && <p className="text-xs text-primary">Uploading...</p>}
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-gray-400">Display name</span>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              ({form.display_name.length}/30)
            </p>
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Bio</span>
            <textarea
              rows={3}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
            <p className="text-xs text-zinc-500">({form.bio.length}/200)</p>
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Website</span>
            <input
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.website_url}
              onChange={(e) => set("website_url", e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              ({form.website_url.length}/100)
            </p>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowModal({ profile, initialTab, onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setUsers([]);
      const res = await fetch(`/api/profile/${tab}?user_id=${profile.id}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setLoading(false);
    }
    load();
  }, [tab, profile.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-black/50 backdrop-blur-2xl min-h-100 max-h-100 border border-white/10 rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab("followers")}
            className={[
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === "followers"
                ? "text-white border-b-2 border-primary"
                : "text-gray-400 hover:text-white",
            ].join(" ")}
          >
            Followers
          </button>
          <button
            onClick={() => setTab("following")}
            className={[
              "flex-1 py-3 text-sm font-medium transition-colors",
              tab === "following"
                ? "text-white border-b-2 border-primary"
                : "text-gray-400 hover:text-white",
            ].join(" ")}
          >
            Following
          </button>
          <button
            onClick={onClose}
            className="px-4 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="max-h-100 overflow-y-auto">
          {loading && (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-1">
                    <div className="w-24 h-3 bg-white/10 rounded" />
                    <div className="w-16 h-2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && users.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              {tab === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </p>
          )}
          {!loading &&
            users.map((user) => (
              <a
                key={user.id}
                href={`/profile/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={user.avatar_url ?? DefaultImage}
                    alt={user.username}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-1">
                    {user.display_name || user.username}
                    {user.verified && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-4 h-4 shrink-0"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="var(--color-primary)"
                        />
                        <path
                          d="M6.5 12.5l3.5 3.5 7-7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { username } = useParams();

  /** @type {[Profile|null, Function]} */
  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [followModal, setFollowModal] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const isOwner = currentUserId && profile && currentUserId === profile.id;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          { profile: prof },
          {
            data: { session },
          },
        ] = await Promise.all([
          fetchProfile(username),
          supabase.auth.getSession(),
        ]);

        setProfile(prof);
        const uid = session?.user?.id ?? null;
        setCurrentUserId(uid);

        if (uid && uid !== prof.id) {
          const { following: isFollowing } = await fetchFollowStatus(prof.id);
          setFollowing(isFollowing);
        }

        const postsRes = await fetch(`/api/posts?user_id=${prof.id}`);
        const postsData = await postsRes.json();
        setPosts(Array.isArray(postsData) ? postsData : []);
        setPostsLoading(false);
      } catch (err) {
        console.error(err);
        setError("User not found.");
      } finally {
        setLoading(false);
      }
    }

    if (username) load();
  }, [username]);

  async function toggleFollow() {
    if (!currentUserId || !profile || isOwner || followLoading) return;
    const was = following;
    setFollowLoading(true);
    setFollowing(!was);
    try {
      was ? await unfollowUser(profile.id) : await followUser(profile.id);
      const { profile: updated } = await fetchProfile(username);
      setProfile(updated);
    } catch {
      setFollowing(was);
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleSaveProfile(updates) {
    setSaving(true);
    try {
      const { profile: updated } = await editProfile(updates);
      setProfile(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="text-white min-h-screen bg-black w-full">
      {loading && (
        <div className="animate-pulse w-full">
          {/* Banner Skeleton */}
          <div className="w-full h-50 bg-white/5" />

          {/* Header Info Skeleton */}
          <div className="flex items-start gap-6 px-6 pt-4 pb-6">
            {/* Avatar Skeleton overlap */}
            <div className="shrink-0 -mt-15 z-10 rounded-full border-4 border-black w-40 h-40 bg-neutral-900" />

            <div className="flex-1 min-w-0 pt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  {/* Display Name */}
                  <div className="h-7 w-48 bg-white/10 rounded-lg" />
                  {/* Username */}
                  <div className="h-4 w-24 bg-white/5 rounded-lg" />
                </div>
                {/* Button Skeleton */}
                <div className="h-8 w-28 bg-white/10 rounded-full" />
              </div>

              {/* Stats Skeleton */}
              <div className="flex gap-5 mt-4">
                <div className="h-4 w-20 bg-white/5 rounded" />
                <div className="h-4 w-20 bg-white/5 rounded" />
              </div>

              {/* Bio Skeleton */}
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full max-w-md bg-white/5 rounded" />
                <div className="h-3 w-3/4 max-w-sm bg-white/5 rounded" />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10" />
        </div>
      )}

      {!loading && error && <p className="p-6 text-gray-400">{error}</p>}

      {!loading && profile && (
        <>
          {/* Banner */}
          <div className="relative h-50 w-full overflow-hidden rounded-tr-2xl rounded-t-2xl bg-gray-600">
            {profile.banner_url && (
              <Image
                src={profile.banner_url}
                alt="Banner"
                fill
                className="object-cover"
                priority
                quality={90}
                sizes="100vw"
              />
            )}
          </div>

          {/* Avatar + info row */}
          <div className="flex items-start gap-6 px-6 pt-4 pb-6">
            <div className="shrink-0 -mt-15 z-10 rounded-full overflow-hidden border-4 border-black w-40 h-40">
              <Image
                src={profile.avatar_url ?? DefaultImage}
                alt={profile.display_name ?? profile.username}
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex-1 min-w-0 pt-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight flex items-center gap-2">
                    {profile.display_name || profile.username}
                    {profile.verified && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5 shrink-0"
                        aria-label="Verified"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="12"
                          fill="var(--color-primary)"
                        />
                        <path
                          d="M6.5 12.5l3.5 3.5 7-7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    )}
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">
                    @{profile.username}
                  </p>
                </div>

                {isOwner ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-1 px-4 flex flex-row justify-center items-center gap-1 py-1.5 text-sm border border-white/20 rounded-full text-white bg-primary/20 hover:bg-primary/30 transition-colors shrink-0"
                  >
                    Edit profile
                    <Edit2Icon className="w-3.5 h-3.5" />
                  </button>
                ) : currentUserId ? (
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={[
                      "mt-1 px-4 py-1.5 text-sm rounded-full font-medium transition-colors shrink-0 disabled:opacity-50",
                      following
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-primary hover:bg-primary-hover text-white",
                    ].join(" ")}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                ) : null}
              </div>

              <div className="flex gap-5 mt-3 text-sm">
                <button
                  onClick={() => setFollowModal("followers")}
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors duration-300 text-left"
                >
                  <strong className="text-white">
                    {formatCount(profile.followers_count ?? 0)}
                  </strong>{" "}
                  <span>Followers</span>
                </button>
                <button
                  onClick={() => setFollowModal("following")}
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors duration-300 text-left"
                >
                  <strong className="text-white">
                    {profile.following_count ?? 0}
                  </strong>{" "}
                  <span>Following</span>
                </button>
              </div>

              {profile.bio && (
                <p className="mt-3 text-sm text-gray-300 whitespace-pre-line max-w-xl">
                  {profile.bio}
                </p>
              )}

              {Boolean(profile.website_url) && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-primary hover:text-primary-muted transition-colors"
                >
                  {profile.website_url}
                </a>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Layout Wrapper */}
          <div className="w-full flex flex-row justify-center items-start gap-8 px-6">
            {/* Main Feed */}
            <div className="flex-1 flex flex-row justify-center">
              <div className="w-full max-w-5xl space-y-4 mt-4">
                {postsLoading && (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-zinc-900 rounded-xl border border-zinc-800 p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800" />
                          <div className="space-y-1">
                            <div className="w-24 h-3 bg-zinc-800 rounded" />
                            <div className="w-16 h-2 bg-zinc-800 rounded" />
                          </div>
                        </div>
                        <div className="w-full h-3 bg-zinc-800 rounded mb-2" />
                        <div className="w-3/4 h-3 bg-zinc-800 rounded" />
                      </div>
                    ))}
                  </div>
                )}

                {!postsLoading && posts.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">
                    No posts to show.
                  </p>
                )}

                {!postsLoading &&
                  posts.map((post) => (
                    <Post
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId}
                    />
                  ))}
              </div>
            </div>

            {/* User Info Sidebar */}
            <div className="hidden lg:block sticky top-6 w-80 xl:w-96 shrink-0 py-4">
              <div className="border rounded-xl border-white/15 bg-black/20 backdrop-blur-sm p-5">
                <div className="flex flex-row items-center gap-3 w-full">
                  <NewspaperIcon className="w-6 h-6 text-primary" />
                  <h1 className="text-xl text-white font-semibold">
                    Profile Information
                  </h1>
                </div>
                <p className="text-xs text-zinc-500 pb-4">
                  @{profile.username}'s Finite profile information
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <StatItem
                      icon={ShieldCheck}
                      label="Account"
                      value={profile.verified ? "Verified" : "Regular"}
                    />
                    <StatItem
                      icon={Users}
                      label="Followers"
                      value={formatCount(profile.followers_count ?? 0)}
                    />
                    <StatItem
                      icon={UserRoundCheck}
                      label="Following"
                      value={formatCount(profile.following_count ?? 0)}
                    />
                    <StatItem
                      icon={Zap}
                      label="Posts"
                      value={posts.length.toString()}
                    />
                    {/* placeholder */}
                    <StatItem
                      icon={Calendar}
                      label="Member Since"
                      value="June 2026"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {editing && profile && (
        <EditModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setEditing(false)}
          saving={saving}
        />
      )}

      {followModal && profile && (
        <FollowModal
          profile={profile}
          initialTab={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </section>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/3 transition-colors group">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-zinc-500 transition-colors" />
        <span className="text-sm font-medium text-zinc-500">{label}</span>
      </div>
      <span className={`text-sm font-bold text-primary`}>{value}</span>
    </div>
  );
}
