"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/features/auth/AuthContext";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <Suspense fallback={<div className="p-6" role="status">Loading…</div>}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </Suspense>
    </LocaleProvider>
  );
}
