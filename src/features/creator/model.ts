import type { Poll, PollOption } from "@/domain/polls/types";
import { normalizeOptionText, orderOptions } from "@/domain/polls/pollLogic";

export type StarterId = "film" | "pizza" | "date" | "place" | "game" | "driver";
export const starterIds: StarterId[] = ["film", "pizza", "date", "place", "game", "driver"];
export const starterIcons: Record<StarterId, string> = { film: "▣", pizza: "♜", date: "▦", place: "⌖", game: "⚄", driver: "▱" };
export type CreatorPoll = Poll & { poll_options: PollOption[]; template_id?: string | null; template_round?: number | null };
export interface PollTemplate {
  id: string; owner_id: string; source_poll_id: string; name: string; icon: StarterId;
  question: string; option_texts: string[]; rounds_count: number;
  voting_mode: "SINGLE" | "MULTIPLE"; allow_suggestions: boolean; require_approval: boolean;
  show_results_before_voting: boolean; allow_vote_change: boolean;
  schedule_weekday: number | null; schedule_time: string | null; timezone: string;
}
export interface Activity {
  id: string; user_id: string; type: string; poll_id: string; poll_question: string;
  detail: string | null; is_read: boolean; created_at: string;
}
export interface Draft {
  question: string; options: { key: string; text: string }[];
  voting_mode: "SINGLE" | "MULTIPLE"; allow_suggestions: boolean; require_approval: boolean;
  show_results_before_voting: boolean; allow_vote_change: boolean;
  closesAt: string | null; expectedVoters: string; requestId: string; templateId: string | null;
  title: string; history: string | null; winnerText: string | null; excludeWinner: boolean;
  runnerUpTexts: string[]; newTexts: string[];
}
export const newOption = (text = "") => ({ key: crypto.randomUUID(), text });
export function blankDraft(): Draft {
  return { question: "", options: [newOption(), newOption()], voting_mode: "SINGLE", allow_suggestions: false,
    require_approval: true, show_results_before_voting: false, allow_vote_change: true, closesAt: null,
    expectedVoters: "", requestId: crypto.randomUUID(), templateId: null, title: "", history: null,
    winnerText: null, excludeWinner: false, runnerUpTexts: [], newTexts: [] };
}
export function starterDraft(id: StarterId, now = new Date(), locale = "en"): Draft {
  const names = locale === "el" ? ["Βραδιά ταινίας", "Τι θα φάμε;", "Διάλεξε ημερομηνία", "Πού θα βρεθούμε;", "Βραδιά παιχνιδιού", "Ποιος οδηγεί;"] :
    ["Film night", "What are we eating?", "Pick a date", "Where to meet", "Game night", "Who’s driving?"];
  const questions = locale === "el" ? ["Βραδιά ταινίας: τι θα δούμε;", "Βραδιά πίτσας: τι θα παραγγείλουμε;", "Ποια ημερομηνία βολεύει όλους;", "Πού θα βρεθούμε;", "Βραδιά παιχνιδιού: τι θα παίξουμε;", "Ποιος οδηγεί;"] :
    ["Film night: what are we watching?", "Pizza night: what are we ordering?", "Which date works for everyone?", "Where should we meet?", "Game night: what are we playing?", "Who’s driving?"];
  const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() + i + 1); return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }); });
  const choices: Record<StarterId, string[]> = {film: ["Arrival", "Lady Bird", "Spirited Away", "The Grand Budapest Hotel"],
    pizza: locale === "el" ? ["Μαργαρίτα", "Πεπερόνι", "Λαχανικών", "Τέσσερα τυριά"] : ["Margherita", "Pepperoni", "Vegetarian", "Four cheese"], date: dates,
    place: locale === "el" ? ["Στο σπίτι", "Στην καφετέρια", "Στο πάρκο"] : ["At home", "Local café", "The park"],
    game: locale === "el" ? ["Επιτραπέζια", "Χαρτιά", "Βιντεοπαιχνίδια", "Κουίζ"] : ["Board games", "Card games", "Video games", "Trivia"], driver: ["", ""]};
  const hours = { film: 3, pizza: 1, date: 48, place: 2, game: 0, driver: 1 }[id];
  let end = new Date(now.getTime() + hours * 3600000);
  if (id === "game") { end = new Date(now); end.setHours(23, 59, 0, 0); if (end <= now) end.setDate(end.getDate() + 1); }
  return { ...blankDraft(), title: names[starterIds.indexOf(id)], question: questions[starterIds.indexOf(id)], options: choices[id].map(newOption),
    voting_mode: id === "date" || id === "game" ? "MULTIPLE" : "SINGLE", allow_suggestions: true, closesAt: end.toISOString() };
}
function wallParts(instant: number, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant);
  const p = Object.fromEntries(parts.map(({type,value}) => [type, Number(value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}
/** Java time semantics: earlier offset on overlaps, advance across a DST gap. */
export function zonedInstant(wall: number, zone: string) {
  const offsets = new Set<number>();
  for (let h = -36; h <= 36; h += 6) { const probe = wall + h * 3600000; offsets.add(wallParts(probe, zone) - probe); }
  const candidates = [...offsets].map((offset) => wall - offset).sort((a,b) => a-b);
  const exact = candidates.find((c) => wallParts(c, zone) === wall);
  if (exact !== undefined) return exact;
  const after = candidates.filter((c) => wallParts(c, zone) > wall).sort((a,b) => wallParts(a,zone)-wallParts(b,zone));
  if (!after.length) throw new Error("Invalid local time");
  return after[0];
}
export function nextWeekly(weekday: number, time: string, zone: string, now = Date.now()) {
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7 || !/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(time)) throw new Error("Invalid schedule");
  const local = new Date(wallParts(now, zone));
  const [h,m] = time.split(":").map(Number);
  const day = local.getUTCDay() || 7;
  const date = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + (weekday-day+7)%7, h, m);
  let instant = zonedInstant(date, zone);
  if (instant <= now) instant = zonedInstant(date + 7 * 86400000, zone);
  return new Date(instant).toISOString();
}
export function templateDraft(template: PollTemplate, polls: CreatorPoll[], now = Date.now()): Draft {
  const history = polls.filter((p) => (p.template_id === template.id || p.id === template.source_poll_id) && p.status === "CLOSED")
    .sort((a,b) => (b.template_round ?? 1) - (a.template_round ?? 1) || Date.parse(b.closed_at ?? b.created_at) - Date.parse(a.closed_at ?? a.created_at));
  const [latest, previous] = history;
  const options = latest ? orderOptions(latest.poll_options.filter((o) => o.status === "APPROVED")) : [];
  const max = Math.max(0, ...options.map((o) => o.vote_count));
  const leaders = options.filter((o) => o.vote_count === max && max > 0);
  const winner = leaders.length === 1 ? leaders[0].text : null;
  const second = Math.max(0, ...options.filter((o) => o.text !== winner).map((o) => o.vote_count));
  const texts = latest ? options.map((o) => o.text) : template.option_texts;
  const exclude = winner !== null && texts.length > 2;
  const settings = latest ?? template;
  return { ...blankDraft(), question: settings.question, title: template.name + " #" + (template.rounds_count + 1),
    options: texts.filter((t) => !exclude || t !== winner).map(newOption),
    voting_mode: settings.voting_mode ?? "SINGLE", allow_suggestions: settings.allow_suggestions, require_approval: settings.require_approval,
    show_results_before_voting: settings.show_results_before_voting, allow_vote_change: settings.allow_vote_change,
    expectedVoters: latest?.expected_voters?.toString() ?? "", templateId: template.id, winnerText: winner, excludeWinner: exclude,
    closesAt: template.schedule_weekday && template.schedule_time ? nextWeekly(template.schedule_weekday, template.schedule_time, template.timezone, now) : null,
    history: latest?.closed_at ?? null, runnerUpTexts: winner && second > 0 ? options.filter((o) => o.text !== winner && o.vote_count === second).map((o) => o.text) : [],
    newTexts: previous ? texts.filter((t) => !previous.poll_options.some((o) => o.status === "APPROVED" && o.text.toLowerCase() === t.toLowerCase())) : [] };
}
export function validDraft(d: Draft, now = Date.now()) {
  const texts = d.options.map((o) => normalizeOptionText(o.text));
  return Boolean(normalizeOptionText(d.question)) && texts.length >= 2 && texts.length <= 10 && texts.every(Boolean) &&
    new Set(texts.map((t) => t.toLowerCase())).size === texts.length &&
    (d.closesAt === null || Date.parse(d.closesAt) > now) && /^(\d{1,4})?$/.test(d.expectedVoters) &&
    (d.expectedVoters === "" || Number(d.expectedVoters) > 0);
}
export function creationArgs(d: Draft) {
  if (!validDraft(d)) throw new Error("Invalid poll draft");
  return { p_question: normalizeOptionText(d.question), p_options: d.options.map((o) => normalizeOptionText(o.text)),
    p_allow_suggestions: d.allow_suggestions, p_require_approval: d.require_approval, p_show_results_before_voting: d.show_results_before_voting,
    p_allow_vote_change: d.allow_vote_change, p_closes_at: d.closesAt, p_expected_voters: d.expectedVoters ? Number(d.expectedVoters) : null,
    p_request_id: d.requestId, p_voting_mode: d.voting_mode, p_template_id: d.templateId };
}
