export function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f3c24a,cde7e0,f6c9b5,d9c7f0,bfe0f5,fbe3c0,e6d5c3,fbdde3&backgroundType=solid`;
}

export function randomSeeds(count = 10): string[] {
  return Array.from({ length: count }, () => Math.random().toString(36).slice(2, 10));
}
