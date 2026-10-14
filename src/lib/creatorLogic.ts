export const DEADLINES = [0, 3600, 86400, 259200, 604800] as const;
export interface PollDraft {
  question: string;
  options: string[];
  allowSuggestions: boolean;
  requireApproval: boolean;
  showResults: boolean;
  allowVoteChange: boolean;
  deadline: number;
  expectedVoters: string;
  requestId: string;
}
export const DRAFT_KEY = "pickle.creator-draft.v1";
export function emptyDraft(): PollDraft {
  return { question: "", options: ["", ""], allowSuggestions: false, requireApproval: true, showResults: false, allowVoteChange: true, deadline: 0, expectedVoters: "", requestId: "" };
}
export function cleanOptions(options: string[]) {
  const seen = new Set<string>();
  return options.map((s) => s.trim()).filter((s) => {
    const key = s.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function validateDraft(draft: PollDraft): "questionRequired" | "optionsRequired" | "expectedInvalid" | null {
  if (!draft.question.trim()) return "questionRequired";
  if (draft.options.length > 10 || cleanOptions(draft.options).length < 2) return "optionsRequired";
  const value = draft.expectedVoters.trim();
  if (value && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 2147483647)) return "expectedInvalid";
  return null;
}
export function restoreDraft(raw: string | null): PollDraft {
  try {
    const d = JSON.parse(raw ?? "null");
    const base = emptyDraft();
    if (!d || typeof d.question !== "string" || !Array.isArray(d.options) || d.options.length < 2 || d.options.length > 10 || !d.options.every((s: unknown) => typeof s === "string")) return base;
    for (const key of ["allowSuggestions", "requireApproval", "showResults", "allowVoteChange"] as const) if (typeof d[key] !== "boolean") return base;
    if (!DEADLINES.some((n) => n === d.deadline) || typeof d.expectedVoters !== "string" || typeof d.requestId !== "string" || (d.requestId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.requestId))) return base;
    return { question: d.question, options: d.options, allowSuggestions: d.allowSuggestions, requireApproval: d.requireApproval, showResults: d.showResults, allowVoteChange: d.allowVoteChange, deadline: d.deadline, expectedVoters: d.expectedVoters, requestId: d.requestId };
  } catch { return emptyDraft(); }
}
export function deadlinePassed(poll: { status: string; closed_at: string | null }, now = Date.now()) {
  return poll.status === "OPEN" && poll.closed_at !== null && Date.parse(poll.closed_at) <= now;
}
