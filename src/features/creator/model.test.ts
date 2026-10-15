import { describe,expect,it } from "vitest";
import { blankDraft,creationArgs,nextWeekly,starterDraft,starterIds,templateDraft,validDraft,zonedInstant,type CreatorPoll,type PollTemplate } from "./model";
const now=new Date("2026-10-15T12:00:00Z");
const template:PollTemplate={id:"template",owner_id:"owner",source_poll_id:"source",name:"Film night",icon:"film",question:"Old question",option_texts:["A","B","C"],rounds_count:3,voting_mode:"SINGLE",allow_suggestions:true,require_approval:true,show_results_before_voting:false,allow_vote_change:true,schedule_weekday:5,schedule_time:"20:00:00",timezone:"Europe/Athens"};
const round=(id:string,n:number,counts:number[],texts=["A","B","C"]):CreatorPoll=>({id,creator_id:"owner",question:"Round "+n,status:"CLOSED",created_at:now.toISOString(),closed_at:now.toISOString(),winner_option_id:null,expected_voters:12,template_id:"template",template_round:n,allow_suggestions:true,require_approval:true,show_results_before_voting:false,allow_vote_change:true,voting_mode:"MULTIPLE",voter_count:5,poll_options:texts.map((text,i)=>({id:id+i,poll_id:id,text,status:"APPROVED",vote_count:counts[i],suggested_by:null,created_at:now.toISOString(),position:i}))});
describe("creator draft validation and requests",()=>{
  it("starts blank with two rows, no deadline and mobile defaults",()=>{
    const d=blankDraft();expect(d.options.map(o=>o.text)).toEqual(["",""]);expect(d.closesAt).toBeNull();expect(d.allow_suggestions).toBe(false);expect(d.require_approval).toBe(true);expect(d.allow_vote_change).toBe(true);expect(validDraft(d)).toBe(false);
  });
  it("validates the entire ballot draft, not only the nonempty subset",()=>{
    const d=starterDraft("film",now);expect(validDraft(d,now.getTime())).toBe(true);
    expect(validDraft({...d,options:[{key:"a",text:"A"},{key:"b",text:" a "}]},now.getTime())).toBe(false);
    expect(validDraft({...d,options:[{key:"a",text:"A"},{key:"b",text:""}]},now.getTime())).toBe(false);
    expect(validDraft({...d,options:Array.from({length:11},(_,i)=>({key:String(i),text:String(i)}))},now.getTime())).toBe(false);
    expect(validDraft({...d,closesAt:now.toISOString()},now.getTime())).toBe(false);
    expect(validDraft({...d,expectedVoters:"0"},now.getTime())).toBe(false);
  });
  it("preserves retry IDs without changing the draft and normalizes payloads",()=>{
    const d=starterDraft("film",new Date(Date.now()));d.question="  Film   night?  ";d.expectedVoters="12";
    const one=creationArgs(d),two=creationArgs(d);expect(one).toEqual(two);expect(one.p_request_id).toBe(d.requestId);expect(one.p_question).toBe("Film night?");expect(one.p_expected_voters).toBe(12);
  });
  it("seeds all six starters without publishing",()=>{
    expect(starterIds.map(id=>starterDraft(id,now).options.length)).toEqual([4,4,7,3,4,2]);
    expect(starterDraft("date",now).voting_mode).toBe("MULTIPLE");expect(starterDraft("game",now).voting_mode).toBe("MULTIPLE");
    expect(starterDraft("film",now).closesAt).toBe("2026-10-15T15:00:00.000Z");expect(starterDraft("driver",now).options.every(o=>o.text==="")).toBe(true);
  });
});
describe("weekly deadlines and daylight saving",()=>{
  it("uses a strictly future weekly occurrence in the stored timezone",()=>{
    expect(nextWeekly(5,"20:00","Europe/Athens",Date.parse("2026-10-16T17:00:00Z"))).toBe("2026-10-23T17:00:00.000Z");
    expect(nextWeekly(5,"20:00","Europe/Athens",now.getTime())).toBe("2026-10-16T17:00:00.000Z");
  });
  it("selects the earlier overlap offset and advances a nonexistent local time",()=>{
    expect(new Date(zonedInstant(Date.UTC(2026,9,25,3,30),"Europe/Athens")).toISOString()).toBe("2026-10-25T00:30:00.000Z");
    expect(new Date(zonedInstant(Date.UTC(2026,2,29,3,30),"Europe/Athens")).toISOString()).toBe("2026-03-29T01:30:00.000Z");
  });
  it("rejects invalid schedule inputs",()=>{
    expect(()=>nextWeekly(0,"20:00","UTC")).toThrow();expect(()=>nextWeekly(1,"25:00","UTC")).toThrow();expect(()=>nextWeekly(1,"20:00","invalid/timezone")).toThrow();
  });
});
describe("personal template history",()=>{
  it("uses the latest completed round and removes only a unique winner",()=>{
    const d=templateDraft(template,[round("second",2,[3,2,0],["A","B","old"]),round("latest",3,[5,3,1])],now.getTime());
    expect(d.title).toBe("Film night #4");expect(d.question).toBe("Round 3");expect(d.voting_mode).toBe("MULTIPLE");expect(d.options.map(o=>o.text)).toEqual(["B","C"]);expect(d.winnerText).toBe("A");expect(d.runnerUpTexts).toEqual(["B"]);expect(d.newTexts).toEqual(["C"]);expect(d.expectedVoters).toBe("12");
  });
  it("keeps ties and two-option rounds intact",()=>{
    expect(templateDraft(template,[round("tie",3,[4,4,0])],now.getTime()).excludeWinner).toBe(false);
    expect(templateDraft(template,[round("two",3,[4,1],["A","B"])],now.getTime()).options).toHaveLength(2);
  });
  it("falls back to the stored snapshot when no round is complete",()=>{
    const d=templateDraft(template,[],now.getTime());expect(d.question).toBe(template.question);expect(d.options.map(o=>o.text)).toEqual(template.option_texts);expect(d.templateId).toBe(template.id);
  });
});
