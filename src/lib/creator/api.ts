import { getSupabase } from "../supabase";
import { deadlinePassed } from "../pollLogic";
import { creationArgs, type Activity, type CreatorPoll, type Draft, type PollTemplate, type StarterId } from "./model";

async function requireAccount(expectedId?: string) {
  const {data, error} = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.is_anonymous || data.user.user_metadata?.pickle_account_pending || (expectedId && data.user.id !== expectedId)) throw new Error("Sign in to your creator account.");
  return data.user.id;
}
export async function loadCreatorData(userId: string) {
  const sb = getSupabase();
  const polls: CreatorPoll[] = [];
  for (let offset=0;;offset+=500) {
    const result = await sb.from("polls").select("*,poll_options(*)").eq("creator_id", userId).order("created_at",{ascending:false}).order("id").range(offset,offset+499);
    if (result.error) throw result.error;
    const page = result.data as CreatorPoll[]; polls.push(...page); if(page.length<500) break;
  }
  const expired=polls.filter(p=>deadlinePassed(p));
  if(expired.length){
    for(const poll of expired){const {error}=await sb.rpc("expire_poll",{p_poll_id:poll.id});if(error)throw error;}
    // Read finalized winner/status timestamps without treating a deadline as an early close.
    for(const poll of expired){const fresh=await sb.from("polls").select("*,poll_options(*)").eq("id",poll.id).eq("creator_id",userId).single();if(fresh.error)throw fresh.error;polls[polls.findIndex(p=>p.id===poll.id)]=fresh.data as CreatorPoll;}
  }
  const [templates, notifications] = await Promise.all([
    sb.from("poll_templates").select("*").eq("owner_id", userId).order("updated_at",{ascending:false}).returns<PollTemplate[]>(),
    sb.from("notifications").select("*").eq("user_id", userId).order("created_at",{ascending:false}).returns<Activity[]>(),
  ]);
  if(templates.error) throw templates.error;
  if(notifications.error) throw notifications.error;
  return {polls,templates:templates.data,notifications:notifications.data};
}
export async function createPoll(draft: Draft, owner: string) {
  await requireAccount(owner);
  const {data,error} = await getSupabase().rpc("create_poll_v2", creationArgs(draft));
  if(error) throw error;
  if(typeof data !== "string") throw new Error("Invalid creation response");
  return data;
}
export async function moderate(pollId: string, optionId: string, approve: boolean, owner: string) {
  await requireAccount(owner);
  const {error}=await getSupabase().rpc("moderate_option",{p_poll_id:pollId,p_option_id:optionId,p_approve:approve});
  if(error) throw error;
}
export async function closePoll(pollId: string, owner: string) {
  await requireAccount(owner);
  const {error}=await getSupabase().rpc("close_poll",{p_poll_id:pollId}); if(error) throw error;
}
export interface TemplateSettings { name:string; icon:StarterId; weekday:number|null; time:string|null; timezone:string }
export async function saveTemplate(pollId:string, settings:TemplateSettings, owner:string) {
  await requireAccount(owner);
  const {data,error}=await getSupabase().rpc("save_poll_template",{p_poll_id:pollId,p_name:settings.name.trim(),p_icon:settings.icon,p_weekday:settings.weekday,p_local_time:settings.time,p_timezone:settings.timezone});
  if(error) throw error; return data as string;
}
export async function markRead(userId:string,id?:string) {
  await requireAccount(userId);
  let query=getSupabase().from("notifications").update({is_read:true}).eq("user_id",userId);
  query=id ? query.eq("id",id) : query.eq("is_read",false);
  const {error}=await query; if(error) throw error;
}
export async function recordActivity(userId:string,poll:{id:string;question:string},type:string,detail:string|null=null) {
  const {error}=await getSupabase().from("notifications").insert({user_id:userId,type,poll_id:poll.id,poll_question:poll.question,detail});
  if(error) throw error;
}
