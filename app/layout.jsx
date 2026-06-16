import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import React from "react";
import LayoutWrapper from "../components/LayoutWrapper";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Finite",
  description: "Finite | Consciously social",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let initialUser = null;
  if (session?.user) {
    const { data } = await supabase
      .from("Users")
      .select("id, username, display_name, avatar_url")
      .eq("id", session.user.id)
      .single();
    initialUser = data;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">
        <LayoutWrapper initialUser={initialUser}>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
