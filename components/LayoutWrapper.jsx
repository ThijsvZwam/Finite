"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Sidebar from "./nav/Sidebar";
import Header from "./nav/Header";
import { useTimeTracker } from "../lib/useTimeTracker";

export default function LayoutWrapper({ children, initialUser }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  const { timeUsed, timeLimit, unlimited, showLockoutModal, dismissModal } =
    useTimeTracker();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-black [scrollbar-color:#4b1e75__#000000] scrollbar-thin">
      {!isAuthPage && (
        <Header
          timeUsed={timeUsed}
          timeLimit={timeLimit}
          unlimited={unlimited}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {!isAuthPage && <Sidebar initialUser={initialUser} />}

        <main
          className={`grow flex flex-col overflow-y-auto ${!isAuthPage ? "p-4" : ""}`}
        >
          {children}
        </main>
      </div>
      {showLockoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center">
            <p className="mb-4">
              You've hit your daily time limit. Do you want to continue using
              the website?
            </p>
            <button
              onClick={dismissModal}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
