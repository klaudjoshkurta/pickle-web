import type { StarterId } from "@/lib/creator/model";
export function TemplateIcon({name}:{name:StarterId}) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name==="film"?<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4m10-8h4m-4 8h4"/></>:name==="pizza"?<><path d="M4 3v6c0 3 6 3 6 0V3M7 3v18M17 3c-4 4-4 8 0 8h2M19 3v18"/></>:name==="date"?<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></>:name==="place"?<><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>:name==="game"?<><rect x="3" y="3" width="18" height="18" rx="3"/>{[[7,7],[17,7],[12,12],[7,17],[17,17]].map(([x,y])=><circle key={x+":"+y} cx={x} cy={y} r=".6" fill="currentColor"/>)}</>:<><rect x="3" y="4" width="18" height="15" rx="3"/><path d="M3 10h18M7 19v2m10-2v2M7 15h1m8 0h1"/></>}
  </svg>;
}
