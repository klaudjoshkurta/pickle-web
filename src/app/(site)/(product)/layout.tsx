import { ProductFooter } from "@/app/_components/ProductFooter";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="poll-theme flex min-h-dvh flex-1 flex-col">
      {children}
      <ProductFooter />
    </div>
  );
}
