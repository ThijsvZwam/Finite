import { Lock } from "lucide-react";

export default function TimeLimitPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-white">
      <Lock className="h-20 w-20" />
      <h1 className="text-4xl font-thin">You're done for today.</h1>
      <p className="text-white/40 mt-4">Come back tomorrow.</p>
    </div>
  );
}
