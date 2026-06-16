"use client";
import Image from "next/image";

import Login_BG from "../../../public/Login_BG2.jpg";
import Logo from "../../../public/Logo.png";
import Link from "next/link";
import { useState } from "react";
import { EyeIcon, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import BackgroundGradient from "../../../components/BackgroundGradient";
import packageJson from "../../../package.json";

export default function Page() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    setMessage(""); // Reset message bij nieuwe poging
    setIsLoading(true);
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/");
    } else {
      setIsLoading(false);
      setMessage(`${data.error}`);
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <BackgroundGradient />
      </div>
      <section className="relative z-10 flex flex-row w-full max-w-4xl h-140 rounded-4xl border bg-black/50 backdrop-blur-3xl border-white/8 shadow-2xl overflow-hidden">
        <div className="relative shrink-0 p-6 h-full w-100">
          <div className="relative w-full h-full overflow-hidden rounded-tl-2xl drop-shadow-2xl drop-shadow-black rounded-bl-2xl">
            <Image
              src={Login_BG}
              alt="Login"
              draggable={false}
              fill
              priority
              className="object-left"
            />
          </div>

          <div className="absolute top-15 left-15 z-10">
            <Image
              src={Logo}
              alt="Logo"
              draggable={false}
              height={50}
              width={50}
              priority
            />
          </div>

          <div className="absolute bottom-15 left-15 z-10">
            <div className="flex flex-row gap-2">
              <h2 className={"text-4xl"}>Finite</h2>
              <div className="flex flex-row items-center">
                <span className="bg-white/5 rounded-full px-2 text-sm font-thin text-white">
                  version {packageJson.version}
                </span>
              </div>
            </div>
            <h3 className={"text-xl font-thin"}>Consciously social.</h3>
          </div>
        </div>

        <div className="relative grow p-12 h-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between h-full w-full"
          >
            <div className="relative z-20 w-full">
              <div>
                <h2 className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase">
                  Welcome back
                </h2>
                <h1 className="text-white text-4xl font-thin mt-2">
                  Please sign in
                </h1>
              </div>

              <div className="mt-10">
                <div className="flex flex-col gap-4 pb-4">
                  <label className="group flex flex-row items-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-3xl p-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                    <input
                      className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 font-light"
                      type="email"
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="E-mail"
                    />
                  </label>

                  <label className="group flex flex-row items-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-3xl p-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                    <input
                      className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 font-light"
                      type={passwordVisible ? "text" : "password"}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="Password"
                    />

                    {!passwordVisible && (
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(true)}
                      >
                        <EyeOff className="w-5 h-5 text-white/60" />
                      </button>
                    )}

                    {passwordVisible && (
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(false)}
                      >
                        <EyeIcon className="w-5 h-5 text-white/60" />
                      </button>
                    )}
                  </label>
                  {message && (
                    <p className="text-red-400 text-xs pl-1 -mt-2">
                      {message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pb-4">
                  <label className="flex items-center text-gray-400 font-light cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mr-2 w-4 h-4 accent-primary bg-white/5 border-white/10 rounded"
                    />
                    <span className="text-sm group-hover:text-white transition-colors">
                      Remember me
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-sm text-primary-muted/80 hover:text-primary-muted transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full mt-auto relative z-20">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>

              <div className="w-full h-px bg-white/10 mt-8" />

              <p className="text-white/40 text-sm text-center mt-6">
                Don't have an account?{" "}
                <Link
                  href="../../auth/signup"
                  className="text-primary-muted hover:text-primary-muted font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
      <div className="absolute inset-0 opacity-[0.2] pointer-events-none mix-blend-overlay bg-[url('/noise.svg')] bg-repeat" />
    </>
  );
}
