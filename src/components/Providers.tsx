"use client";

import { Suspense } from "react";
import { PollAppearance } from "./PollAppearance";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { ToastProvider } from "./ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <Suspense fallback={<div className="p-6" role="status">Loading…</div>}>
        <PollAppearance>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </PollAppearance>
      </Suspense>
    </LocaleProvider>
  );
}
