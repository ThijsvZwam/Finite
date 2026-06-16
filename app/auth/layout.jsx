"use client";
import BackgroundGradient from "../../components/BackgroundGradient";

export default function AuthLayout({ children }) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      <BackgroundGradient />

      {children}
    </main>
  );
}
