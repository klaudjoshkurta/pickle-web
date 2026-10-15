"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadCreatorData } from "./api";
type Data = Awaited<ReturnType<typeof loadCreatorData>>;
export function useCreatorData(userId:string|null, view="home") {
  const [snapshot,setSnapshot]=useState<{owner:string;view:string;data:Data}|null>(null);
  const [failed,setFailed]=useState<string|null>(null);
  const sequence=useRef(0);
  const refresh=useCallback(async()=>{
    if(!userId) return false;
    const request=++sequence.current;
    try {
      const data=await loadCreatorData(userId);
      if(request!==sequence.current) return false;
      setSnapshot({owner:userId,view,data}); setFailed(null); return true;
    } catch {
      if(request===sequence.current) setFailed(userId);
      return false;
    }
  },[userId,view]);
  useEffect(()=>{
    if(!userId) return;
    void Promise.resolve().then(refresh);
    const requests=sequence;
    const timer=setInterval(()=>{if(document.visibilityState==="visible") void refresh();},15000);
    const visible=()=>{if(document.visibilityState==="visible") void refresh();};
    document.addEventListener("visibilitychange",visible);
    return ()=>{requests.current++;clearInterval(timer);document.removeEventListener("visibilitychange",visible);};
  },[userId,refresh]);
  return {data:snapshot?.owner===userId&&snapshot.view===view ? snapshot.data : null,error:userId!==null&&failed===userId,refresh};
}
