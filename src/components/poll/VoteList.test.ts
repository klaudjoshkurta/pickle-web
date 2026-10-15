import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { VoteList } from "./VoteList";
import { ResultsFooter } from "./ResultsFooter";
import type { PollOption } from "@/lib/types";

const options:PollOption[]=["a","b"].map(id=>({id,poll_id:"poll",text:id,status:"APPROVED",vote_count:2,suggested_by:null,created_at:"2026-01-01T00:00:00Z"}));
function render(multiple:boolean) {
  return renderToStaticMarkup(createElement(LocaleProvider,null,createElement(VoteList,{
    labelledBy:"question",options,selectedIds:multiple?["a","b"]:["a"],multiple,myVoteIds:["a"],
    disabled:false,showResults:true,total:2,userId:"me",onSelect:()=>{},
  })));
}
describe("ballot controls and totals",()=>{
  it("renders one radio selection for single choice",()=>{
    const html=render(false);expect(html).toContain('role="radiogroup"');
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });
  it("renders independently focusable checked checkboxes for multiple choice",()=>{
    const html=render(true);expect(html.match(/role="checkbox"/g)).toHaveLength(2);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2);
    expect(html.match(/tabindex="0"/g)).toHaveLength(2);
    expect(html.match(/100%/g)?.length).toBeGreaterThan(0);
  });
  it("reports people separately from selections",()=>{
    const html=renderToStaticMarkup(createElement(LocaleProvider,null,createElement(ResultsFooter,{total:2,selections:4,standing:{kind:"empty"},live:false})));
    expect(html).toContain("2 voters");expect(html).toContain("4 selections");
  });
});
