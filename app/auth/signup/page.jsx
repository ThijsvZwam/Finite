"use client";
import Image from "next/image";

import Login_BG from "../../../public/Login_BG2.jpg";
import Logo from "../../../public/Logo.png";
import Link from "next/link";
import { ArrowRight, EyeIcon, EyeOff, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundGradient from "../../../components/BackgroundGradient";
import { supabase } from "../../../lib/supabaseClient";
import packageJson from "../../../package.json";

export default function Page() {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [message, setMessage] = useState("");
  const router = useRouter();

  const interests = [
    "Design",
    "Development",
    "Politics",
    "AI",
    "Gaming",
    "Music",
  ];

  const [timeLimit, setTimeLimit] = useState(60);

  const increaseTimeLimit = () => setTimeLimit((prev) => prev + 5);
  const decreaseTimeLimit = () => setTimeLimit((prev) => Math.max(5, prev - 5));

  const [fieldErrors, setFieldErrors] = useState({ username: "", email: "" });

  const checkAvailability = async () => {
    let errors = { username: "", email: "" };
    let hasError = false;

    if (!form.username.trim()) {
      errors.username = "Username is required.";
      hasError = true;
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email format.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      return false;
    }

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", form.username.trim())
      .maybeSingle();

    if (existingUsername) errors.username = "Username is already taken.";

    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", form.email.trim())
      .maybeSingle();

    if (existingEmail) errors.email = "Email is already in use.";

    setFieldErrors(errors);
    return !errors.username && !errors.email;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("clicked submit");

    if (step === 3) {
      if (form.password !== confirmPassword) {
        setMessage("Passwords don't match");
        console.log("Passwords don't match");
        return;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, timeLimit }),
      });
      console.log(res);
      const data = await res.json();
      if (res.ok) {
        router.push("/");
        console.log("done");
      } else {
        setMessage("Error");
        console.log(`${data.error}`);
      }
    } else {
      console.log("can't sign up yet, step is not 3");
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <BackgroundGradient />
      </div>
      <section className="relative z-10 flex flex-row w-full max-w-4xl h-[560px] rounded-[2rem] border bg-black/50 backdrop-blur-3xl border-white/[0.08] shadow-2xl overflow-hidden">
        <div className="relative flex-shrink-0 p-6 h-full w-[400px]">
          <div className="relative w-full h-full overflow-hidden rounded-tl-[1rem] drop-shadow-2xl drop-shadow-black rounded-bl-[1rem]">
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

        <div className="relative flex-grow p-12 h-full">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between h-full w-full"
          >
            <div className="relative z-20 w-full">
              {/* step 1: username, email */}
              {step === 1 && (
                <>
                  <div>
                    <h2 className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase">
                      Welcome to Finite
                    </h2>
                    <h1 className="text-white text-4xl font-thin mt-2">
                      Create an account
                    </h1>
                  </div>

                  <div className="mt-10">
                    <div className="flex flex-col gap-4 pb-4">
                      <label className="group flex flex-row items-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-3xl p-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                        <input
                          className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 font-light"
                          type="text"
                          value={form.username}
                          onChange={(e) => {
                            setForm({ ...form, username: e.target.value });
                            setFieldErrors((prev) => ({
                              ...prev,
                              username: "",
                            }));
                          }}
                          placeholder="Username"
                        />
                      </label>
                      {fieldErrors.username && (
                        <p className="text-red-400 text-xs pl-1 -mt-2">
                          {fieldErrors.username}
                        </p>
                      )}
                      <label className="group flex flex-row items-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-3xl p-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                        <input
                          className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 font-light"
                          type="email"
                          value={form.email}
                          onChange={(e) => {
                            setForm({ ...form, email: e.target.value });
                            setFieldErrors((prev) => ({ ...prev, email: "" }));
                          }}
                          placeholder="E-mail"
                        />
                      </label>
                      {fieldErrors.email && (
                        <p className="text-red-400 text-xs pl-1 -mt-2">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* step 2: password */}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase">
                      Welcome to Finite
                    </h2>
                    <h1 className="text-white text-4xl font-thin mt-2">
                      Create your password
                    </h1>
                  </div>

                  <div className="mt-10">
                    <div className="flex flex-col gap-4 pb-4">
                      <label className="group flex flex-row items-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-3xl p-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                        <input
                          className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 font-light"
                          type={passwordVisible ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => {
                            setForm({ ...form, password: e.target.value });
                            setPasswordError("");
                          }}
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
                      {passwordError && (
                        <p className="text-red-400 text-xs pl-1 -mt-2">
                          {passwordError}
                        </p>
                      )}

                      <label className="group flex flex-row items-center bg-white/5 border border-white/10 rounded-xl backdrop-blur-3xl p-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
                        <input
                          className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 font-light"
                          type={passwordVisible ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPasswordError("");
                          }}
                          placeholder="Confirm Password"
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
                    </div>
                  </div>
                </>
              )}

              {/* step 3: interests (for algo) */}
              {step === 3 && (
                <>
                  <div>
                    <h2 className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase">
                      Welcome to Finite
                    </h2>
                    <h1 className="text-white text-4xl font-thin mt-2">
                      Set your time limit
                    </h1>
                  </div>

                  <div className="mt-10">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white">
                        Time Limit
                      </h2>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        Configure your maximum time usage on Finite.
                      </p>
                    </div>

                    <div className="flex flex-row gap-2 mt-4">
                      <button
                        type="button"
                        onClick={decreaseTimeLimit}
                        className="w-fit flex flex-row items-center justify-center px-5 py-2.5 text-sm font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 backdrop-blur-md border border-red-500/20 hover:border-500/40 rounded-xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-red-500/10 group disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4 transition-transform group-hover:scale-110" />
                        5
                      </button>

                      <p className="w-20 flex flex-row items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-white/5 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        {timeLimit}m
                      </p>

                      <button
                        type="button"
                        onClick={increaseTimeLimit}
                        className="w-fit flex flex-row items-center justify-center px-5 py-2.5 text-sm font-bold text-green-400 bg-green-500/5 hover:bg-green-500/10 backdrop-blur-md border border-green-500/20 hover:border-green-500/40 rounded-xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-green-500/10 group disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                        5
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-full mt-auto relative z-20">
              {step !== 1 && (
                <button
                  type="button"
                  onClick={() => step > 1 && setStep(step - 1)}
                  className="text-white/60 font-thin mb-2 block"
                >
                  Previous step
                </button>
              )}

              <button
                type="button"
                onClick={async (e) => {
                  if (step === 1) {
                    const available = await checkAvailability();
                    if (available) setStep(2);
                  } else if (step === 2) {
                    if (!form.password) {
                      setPasswordError("Password is required.");
                      return;
                    }
                    if (form.password.length < 8) {
                      setPasswordError(
                        "Password must be at least 8 characters.",
                      );
                      return;
                    }
                    if (form.password !== confirmPassword) {
                      setPasswordError("Passwords don't match.");
                      return;
                    }
                    setPasswordError("");
                    setStep(3);
                  } else {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                className="w-full flex flex-row justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                {step === 3 ? "Create account" : "Next step"}
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="w-full h-[1px] bg-white/10 mt-8" />

              <p className="text-white/40 text-sm text-center mt-6">
                Already have an account?{" "}
                <Link
                  href="../../auth/login"
                  className="text-primary-muted hover:text-primary-muted font-medium transition-colors"
                >
                  Log in
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
