export function Wordmark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local SVG wordmark needs no raster optimization
    <img src="/pickle_logo.svg" alt="Pickle" width={87} height={32} className="h-10 w-auto shrink-0" />
  );
}
