// useTimeTracker.js
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

let sessionStarted = false;
let globalSessionId = null;

export function useTimeTracker() {
  const [timeUsed, setTimeUsed] = useState(0);
  const [timeLimit, setTimeLimit] = useState(null);
  const [unlimited, setUnlimited] = useState(false);
  const [showLockoutModal, setShowLockoutModal] = useState(false);

  useEffect(() => {
    let intervalId;

    const fetchAndCheck = async (user) => {
      const today = new Date().toISOString().split("T")[0];

      const { data: profile } = await supabase
        .from("Users")
        .select("time_limit, unlimited_time")
        .eq("id", user.id)
        .single();

      const { data: sessions } = await supabase
        .from("Sessions")
        .select("time_used")
        .eq("user_id", user.id)
        .gte("session_started", today);

      const totalUsed = sessions?.reduce((sum, s) => sum + s.time_used, 0) ?? 0;
      if (!profile) return;

      setTimeUsed(totalUsed);
      setTimeLimit(profile.time_limit);
      setUnlimited(profile.unlimited_time === true);

      if (profile.unlimited_time) return; // skip the lockout check entirely

      const alreadyShown =
        sessionStorage.getItem("timeLimitModalShown") === "true";
      if (totalUsed >= profile.time_limit && !alreadyShown) {
        setShowLockoutModal(true);
        sessionStorage.setItem("timeLimitModalShown", "true");
      }
    };

    const start = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("[timeTracker] no user, aborting");
        return;
      }

      if (!sessionStarted) {
        sessionStarted = true;
        const today = new Date().toISOString().split("T")[0];

        const { data: existing, error: existingError } = await supabase
          .from("Sessions")
          .select("id")
          .eq("user_id", user.id)
          .gte("session_started", today)
          .limit(1)
          .maybeSingle();

        if (existingError)
          console.error(
            "[timeTracker] existing session lookup failed:",
            existingError,
          );

        if (existing) {
          globalSessionId = existing.id;
          console.log("[timeTracker] resuming session", globalSessionId);
        } else {
          const { data: session, error: insertError } = await supabase
            .from("Sessions")
            .insert({ user_id: user.id, time_used: 0 })
            .select()
            .single();

          if (insertError)
            console.error("[timeTracker] session insert failed:", insertError);
          if (session) {
            globalSessionId = session.id;
            console.log("[timeTracker] created session", globalSessionId);
          }
        }
      }

      if (!globalSessionId) {
        console.warn(
          "[timeTracker] no globalSessionId set, increments will be skipped",
        );
      }

      await fetchAndCheck(user);

      intervalId = setInterval(async () => {
        if (!globalSessionId) {
          console.warn("[timeTracker] tick skipped, no globalSessionId");
          return;
        }

        const { error: rpcError } = await supabase.rpc("increment_time_used", {
          session_id: globalSessionId,
        });

        if (rpcError) {
          console.error("[timeTracker] increment_time_used failed:", rpcError);
          return;
        }

        console.log("[timeTracker] incremented session", globalSessionId);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) await fetchAndCheck(user);
      }, 60000);
    };

    start();
    return () => clearInterval(intervalId);
  }, []);

  return {
    timeUsed,
    timeLimit,
    unlimited,
    showLockoutModal,
    dismissModal: () => setShowLockoutModal(false),
  };
}
