// Temporary public domain until pickle.app is set up.
export const SHARE_BASE = "https://pickle-web-iota.vercel.app/p/";
// TODO: replace with the real Play Store listing once published.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.pickle";

export function pollShareUrl(pollId: string) {
  return `${SHARE_BASE}${pollId}`;
}
