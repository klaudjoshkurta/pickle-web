export function Wordmark({ className = "h-10" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG wordmark needs no raster optimization
    <img src="/pickle_logo.svg" alt="Pickle" width={87} height={32} className={`${className} w-auto shrink-0`} />
  );
}
