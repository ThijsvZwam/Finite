"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Minus, Plus, Trash } from "lucide-react";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-black/70 border border-zinc-700 rounded-xl p-6 w-80 shadow-xl">
        <p className="text-sm text-white mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("Users")
        .select("time_limit")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setTimeLimit(data.time_limit);
      }
    }

    loadSettings();
  }, []);

  function increaseTimeLimit() {
    if (timeLimit === 720) return;
    setTimeLimit((prev) => prev + 5);
    setSaved(false);
  }

  function decreaseTimeLimit() {
    if (timeLimit === 5) return;

    setTimeLimit((prev) => prev - 5);
    setSaved(false);
  }

  async function saveTimeLimit() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("Users")
      .update({
        time_limit: timeLimit,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to save.");
    } else {
      setSaved(true);
    }

    setSaving(false);
  }

  async function handleDeleteAccount() {
    if (loading) return;
    setLoading(true);
    setConfirmDelete(false);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-w-full w-full bg-black text-white pb-10 flex flex-row justify-center relative">
      <div className="flex-1 flex flex-row justify-start">
        <div className="w-full max-w-2xl flex flex-col gap-10 pl-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Settings
          </h1>

          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Account Settings</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Permanently deletes your account, posts, comments, and votes.
                <span className="block text-xs text-red-400/60 mt-1 font-medium italic">
                  This action is irreversible and all data will be lost.
                </span>
              </p>
            </div>

            <button
              disabled={loading}
              onClick={() => setConfirmDelete(true)}
              className="w-fit flex flex-row items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 backdrop-blur-md border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-red-500/10 group disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete my account"}
              <Trash className="w-4 h-4 transition-transform group-hover:scale-110" />
            </button>
          </div>

          <div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Time Limit</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Configure your maximum time usage on Finite.
              </p>
            </div>

            <div className="flex flex-row gap-2  mt-4">
              <button
                onClick={() => decreaseTimeLimit()}
                className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="w-24 flex flex-col items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 shadow-inner">
                <span className="text-xl font-black text-white tabular-nums leading-none">
                  {timeLimit}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
                  Minutes
                </span>
              </div>

              <button
                onClick={() => increaseTimeLimit()}
                className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={saveTimeLimit}
              disabled={saving || saved}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-black font-bold disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved" : "Save"}
            </button>
          </div>

          {confirmDelete && (
            <ConfirmModal
              message="This will permanently delete your account and all your data. Are you sure?"
              onConfirm={handleDeleteAccount}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
