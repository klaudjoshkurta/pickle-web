export const SHARE_BASE = "https://pickle.app/p/";
// TODO: replace with the real Play Store listing once published.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.pickle";

export function pollShareUrl(pollId: string) {
  return `${SHARE_BASE}${pollId}`;
}
