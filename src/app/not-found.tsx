import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="card mt-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-ink-muted">This page doesn&apos;t exist.</p>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        Go to homepage
      </Link>
    </div>
  );
}
