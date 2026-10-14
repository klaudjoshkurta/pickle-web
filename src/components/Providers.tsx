"use client";

import { AuthProvider } from "@/lib/auth/AuthContext";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { ToastProvider } from "./ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </LocaleProvider>
  );
}
