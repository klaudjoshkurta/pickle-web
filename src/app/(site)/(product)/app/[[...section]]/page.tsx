import { Suspense } from "react";
import type { Metadata } from "next";
import { CreatorApp } from "@/features/creator/components/CreatorApp";
export const metadata:Metadata={title:"My Pickle",robots:{index:false}};
export default function Page(){return <Suspense fallback={<p className="p-6" role="status">Loading…</p>}><CreatorApp/></Suspense>;}
