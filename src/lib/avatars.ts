export function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/10.x/critters/svg?seed=${encodeURIComponent(seed)}`;
}

export function randomSeeds(count = 6): string[] {
  return Array.from({ length: count }, () => Math.random().toString(36).slice(2, 10));
}
