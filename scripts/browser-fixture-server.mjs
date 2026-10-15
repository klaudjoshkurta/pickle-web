// Local browser smoke-test backend. No real users, credentials, or database writes.
// Run with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55432 and a dummy anon key.
import http from "node:http";
const user={id:"00000000-0000-0000-0000-000000000099",aud:"authenticated",role:"authenticated",email:"fixture@example.invalid",is_anonymous:true,created_at:new Date().toISOString(),app_metadata:{provider:"anonymous",providers:["anonymous"]},user_metadata:{display_name:"Fixture voter"}};
const encoded=value=>Buffer.from(JSON.stringify(value)).toString("base64url");
const token=`${encoded({alg:"HS256",typ:"JWT"})}.${encoded({sub:user.id,aud:"authenticated",role:"authenticated",exp:Math.floor(Date.now()/1000)+86400})}.fixture`;
const session={access_token:token,refresh_token:"fixture-refresh",token_type:"bearer",expires_in:86400,expires_at:Math.floor(Date.now()/1000)+86400,user};
const polls=new Map([1,2].map(n=>{
  const id=`00000000-0000-0000-0000-00000000000${n}`;
  const poll={id,question:n===1?"Single-choice fixture: which film?":"Multi-choice fixture: which dates work?",creator_id:"owner",allow_suggestions:false,require_approval:true,show_results_before_voting:true,allow_vote_change:true,status:"OPEN",created_at:new Date().toISOString(),closed_at:null,winner_option_id:null,expected_voters:null,voting_mode:n===1?"SINGLE":"MULTIPLE",voter_count:3};
  const options=["First","Second","Third"].map((text,index)=>({id:`10000000-0000-0000-0000-0000000000${n}${index}`,poll_id:id,text,status:"APPROVED",vote_count:[2,1,0][index],suggested_by:null,created_at:poll.created_at,position:index}));
  return [id,{poll,options,ballot:[],requests:0}];
}));
http.createServer(async(req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","*");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Content-Type","application/json");if(req.method==="OPTIONS"){res.writeHead(204).end();return;}
  const url=new URL(req.url,"http://127.0.0.1:55432");let body="";for await(const chunk of req) body+=chunk;
  const send=value=>res.end(JSON.stringify(value));
  if(url.pathname==="/auth/v1/signup" || url.pathname==="/auth/v1/token") return send(session);
  if(url.pathname==="/auth/v1/user") return send(user);
  if(url.pathname==="/health") return send([...polls.values()].map(({poll,ballot,requests})=>({id:poll.id,mode:poll.voting_mode,ballot,requests,voters:poll.voter_count})));
  if(url.pathname==="/rest/v1/rpc/cast_ballot") {
    const {p_poll_id,p_option_ids}=JSON.parse(body);const state=polls.get(p_poll_id);
    if(!state || !p_option_ids?.length || new Set(p_option_ids).size!==p_option_ids.length || p_option_ids.some(id=>!state.options.some(o=>o.id===id)) || (state.poll.voting_mode==="SINGLE" && p_option_ids.length!==1)) {res.statusCode=400;return send({message:"Invalid ballot"});}
    if(!state.ballot.length) state.poll.voter_count++;
    state.options.forEach(o=>o.vote_count+=Number(p_option_ids.includes(o.id))-Number(state.ballot.includes(o.id)));
    state.ballot=p_option_ids;state.requests++;return send(null);
  }
  const id=(url.searchParams.get("id")??url.searchParams.get("poll_id")??"").replace(/^eq\./,"");const state=polls.get(id);
  if(state && url.pathname==="/rest/v1/polls") return send([state.poll]);
  if(state && url.pathname==="/rest/v1/poll_options") return send(state.options);
  if(state && url.pathname==="/rest/v1/votes") return send(state.poll.voting_mode==="SINGLE"&&state.ballot.length?[{option_id:state.ballot[0]}]:[]);
  if(state && url.pathname==="/rest/v1/poll_ballots") return send(state.poll.voting_mode==="MULTIPLE"&&state.ballot.length?[{option_ids:state.ballot}]:[]);
  res.statusCode=404;send({message:"Fixture endpoint not found"});
}).listen(55432,"127.0.0.1",()=>console.log("Fixture backend listening on 127.0.0.1:55432"));
