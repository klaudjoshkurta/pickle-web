import { beforeEach,describe,expect,it,vi } from "vitest";
import { createPoll,closePoll,moderate,markRead,saveTemplate } from "./api";
import { starterDraft } from "./model";
const {rpc,getUser,from,chain}=vi.hoisted(()=>{
  const chain={update:vi.fn(),eq:vi.fn(),then:vi.fn()};
  return {rpc:vi.fn(),getUser:vi.fn(),from:vi.fn(),chain};
});
vi.mock("../supabase",()=>({getSupabase:()=>({rpc,auth:{getUser},from})}));
beforeEach(()=>{vi.clearAllMocks();getUser.mockResolvedValue({data:{user:{id:"owner",is_anonymous:false}},error:null});rpc.mockResolvedValue({data:"poll-id",error:null});from.mockReturnValue(chain);chain.update.mockReturnValue(chain);chain.eq.mockReturnValue(chain);chain.then.mockImplementation((resolve)=>(Promise.resolve({error:null})).then(resolve));});
describe("creator account and RPC boundaries",()=>{
  it("requires a real matching account before creating",async()=>{
    getUser.mockResolvedValue({data:{user:{id:"owner",is_anonymous:true}},error:null});await expect(createPoll(starterDraft("film"),"owner")).rejects.toThrow();expect(rpc).not.toHaveBeenCalled();
    getUser.mockResolvedValue({data:{user:{id:"another",is_anonymous:false}},error:null});await expect(createPoll(starterDraft("film"),"owner")).rejects.toThrow();expect(rpc).not.toHaveBeenCalled();
  });
  it("retries an unchanged draft with one stable creation request ID",async()=>{
    const draft=starterDraft("film");await createPoll(draft,"owner");await createPoll(draft,"owner");expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);expect(rpc.mock.calls[0][0]).toBe("create_poll_v2");
  });
  it("does not mix refreshes or extra creation notifications into creation",async()=>{
    await createPoll(starterDraft("pizza"),"owner");expect(from).not.toHaveBeenCalled();
  });
  it("uses owner-authorized lifecycle RPCs with exact arguments",async()=>{
    await moderate("poll","option",false,"owner");expect(rpc).toHaveBeenCalledWith("moderate_option",{p_poll_id:"poll",p_option_id:"option",p_approve:false});
    await closePoll("poll","owner");expect(rpc).toHaveBeenCalledWith("close_poll",{p_poll_id:"poll"});
    await saveTemplate("poll",{name:" Film ",icon:"film",weekday:5,time:"20:00",timezone:"Europe/Athens"},"owner");expect(rpc).toHaveBeenCalledWith("save_poll_template",{p_poll_id:"poll",p_name:"Film",p_icon:"film",p_weekday:5,p_local_time:"20:00",p_timezone:"Europe/Athens"});
  });
  it("limits notification changes to the active owner",async()=>{
    await markRead("owner");expect(chain.eq).toHaveBeenCalledWith("user_id","owner");expect(chain.eq).toHaveBeenCalledWith("is_read",false);
  });
});
