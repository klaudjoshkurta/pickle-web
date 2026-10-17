import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Header } from "@/components/layout/Header";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-120 px-4 pt-8">
        <div className="card p-8 text-center">
          <h1 className="headline-pop text-3xl">Page not found</h1>
          <p className="mt-2 text-ink-muted">This page doesn&apos;t exist.</p>
          <Link href="/" className={buttonClass("primary", "mt-6")}>
            Go to homepage
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
