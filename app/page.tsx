"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Result = { id: string; student: string; grade: string; subject: string; created_at: string; content: string };
type AgentState = "idle" | "collect" | "write" | "review" | "done" | "error";

const text = {
  brand: "\uC138\uD2B9 \uBA54\uC774\uCEE4", newDraft: "\uC0C8 \uCD08\uC548 \uB9CC\uB4E4\uAE30", history: "\uC800\uC7A5 \uB0B4\uC5ED", settings: "\uAC1C\uC778 \uC124\uC815",
  grade: "\uD559\uB144", subject: "\uACFC\uBAA9", student: "\uD559\uC0DD \uC2DD\uBCC4\uAC12", activity: "\uD65C\uB3D9 \uD0A4\uC6CC\uB4DC / \uAD00\uCC30 \uB0B4\uC6A9",
  input: "\uD559\uC0DD \uD65C\uB3D9 \uC785\uB825", output: "\uACFC\uBAA9\uBCC4 \uC138\uD2B9 \uCD08\uC548", make: "\uCD08\uC548 \uC0DD\uC131\uD558\uAE30", download: "\uD14D\uC2A4\uD2B8 \uB2E4\uC6B4\uB85C\uB4DC", save: "Supabase\uC5D0 \uC800\uC7A5",
  collect: "\uC218\uC9D1", write: "\uC791\uC131", review: "\uAC80\uD1A0", complete: "\uAC80\uD1A0 \uC644\uB8CC", empty: "\uC544\uC9C1 \uC0DD\uC131\uB41C \uCD08\uC548\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
};

const demoResults: Result[] = [
  { id: "demo-1", student: "2026-\uC815\uBCF4-017", grade: "2\uD559\uB144", subject: "\uC815\uBCF4", created_at: "2026-07-28T09:20:00+09:00", content: "\uD30C\uC774\uC36C\uC744 \uD65C\uC6A9\uD55C \uB370\uC774\uD130 \uC815\uC81C \uACFC\uC81C\uC5D0\uC11C \uACB0\uCE21\uAC12\uC758 \uC758\uBBF8\uB97C \uBE44\uAD50\uD558\uACE0 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uCC98\uB9AC \uBC29\uBC95\uC744 \uC120\uD0DD\uD568." },
  { id: "demo-2", student: "2026-\uC815\uBCF4-008", grade: "1\uD559\uB144", subject: "\uC815\uBCF4", created_at: "2026-07-26T16:10:00+09:00", content: "\uC6F9 \uC811\uADFC\uC131 \uC870\uC0AC \uD65C\uB3D9\uC5D0\uC11C \uB300\uCCB4 \uD14D\uC2A4\uD2B8\uC640 \uBA85\uB3C4 \uB300\uBE44\uC758 \uD544\uC694\uC131\uC744 \uC0AC\uB840\uB85C \uC815\uB9AC\uD568." },
];

const supabase: SupabaseClient | null = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null;

export default function Home() {
  const [active, setActive] = useState("new");
  const [grade, setGrade] = useState("2\uD559\uB144");
  const [subject, setSubject] = useState("\uC815\uBCF4");
  const [student, setStudent] = useState("2026-\uC815\uBCF4-017");
  const [keywords, setKeywords] = useState("\uD30C\uC774\uC36C\uC73C\uB85C CSV \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC640 \uACB0\uCE21\uAC12\uC744 \uCC98\uB9AC\uD568\n\uBC18\uBCF5\uBB38\uACFC \uB9AC\uC2A4\uD2B8\uB97C \uD65C\uC6A9\uD574 \uD3C9\uADE0\uC744 \uACC4\uC0B0\uD568\n\uC624\uB958\uAC00 \uB09C \uCF54\uB4DC\uB97C \uC6D0\uC778\uBCC4\uB85C \uC218\uC815\uD558\uACE0 \uC2E4\uD589 \uACB0\uACFC\uB97C \uAE30\uB85D\uD568");
  const [model, setModel] = useState("Gemini 3.5 Flash-Lite");
  const [apiKey, setApiKey] = useState("");
  const [agent, setAgent] = useState<AgentState>("idle");
  const [output, setOutput] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Result | null>(null);
  const activities = useMemo(() => keywords.split("\n").map((x) => x.trim()).filter(Boolean), [keywords]);

  useEffect(() => { void loadResults(); }, []);
  async function loadResults() {
    if (supabase) {
      const { data } = await supabase.from("seteuk_results").select("*").order("created_at", { ascending: false });
      if (data) { setResults(data as Result[]); return; }
    }
    setResults(demoResults);
  }
  async function generate() {
    if (!keywords.trim()) return;
    setError(""); setSaved(false); setAgent("collect");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, model, grade, subject, student, activities }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");
      setAgent("write"); await new Promise((resolve) => setTimeout(resolve, 350)); setAgent("review"); await new Promise((resolve) => setTimeout(resolve, 350)); setOutput(data.results); setAgent("done");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "API request failed"); setAgent("error"); }
  }
  async function saveResult() {
    const row: Result = { id: crypto.randomUUID(), student, grade, subject, created_at: new Date().toISOString(), content: output.join("\n\n") };
    if (supabase) { const { error: dbError } = await supabase.from("seteuk_results").insert(row); if (dbError) { setError(dbError.message); return; } }
    setResults((prev) => [row, ...prev]); setSaved(true);
  }
  function download() { const blob = new Blob([output.join("\n\n")], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${student}-${subject}-seteuk.txt`; link.click(); URL.revokeObjectURL(url); }

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">S</span><span>{text.brand}</span></div><div className="workspace-label">WORKSPACE</div><button className={active === "new" ? "nav-item active" : "nav-item"} onClick={() => setActive("new")}><span>+</span>{text.newDraft}</button><button className={active === "history" ? "nav-item active" : "nav-item"} onClick={() => setActive("history")}><span>H</span>{text.history}<em>{results.length}</em></button><div className="sidebar-bottom"><button className={active === "settings" ? "nav-item active" : "nav-item"} onClick={() => setActive("settings")}><span>S</span>{text.settings}</button><div className="user-card"><div className="avatar">T</div><div><b>\uB2F4\uB2F9 \uAD50\uC0AC</b><small>\uC815\uBCF4 \uAD50\uACFC</small></div><span className="dot" /></div></div></aside><section className="content"><header className="topbar"><div><span className="eyebrow">INFORMATION / STUDENT RECORD</span><h1>{active === "new" ? "\uC138\uD2B9 \uBB38\uAD6C \uCD08\uC548" : active === "history" ? text.history : text.settings}</h1></div><div className="connection"><span className="status-dot" />{supabase ? "Supabase \uC5F0\uACB0\uB428" : "\uB370\uBAA8 \uBAA8\uB4DC"}</div></header>{active === "settings" && <div className="settings-panel panel"><span className="section-kicker">PREFERENCES</span><h2>\uC0DD\uC131 \uD658\uACBD \uC124\uC815</h2><p className="muted">Gemini API Key\uC640 \uC120\uD638 \uBAA8\uB378\uC744 \uC9C0\uC815\uD569\uB2C8\uB2E4. \uC800\uC7A5\uB41C \uD0A4\uB294 \uC774 \uBC88 \uC138\uC158\uC5D0\uC11C\uB9CC \uC0AC\uC6A9\uD569\uB2C8\uB2E4.</p><label>Gemini API Key<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} type="password" placeholder="AIza..." /></label><label>\uC120\uD638 \uBAA8\uB378<select value={model} onChange={(event) => setModel(event.target.value)}><option>Gemini 3.5 Flash-Lite</option><option>Gemini 2.5 Flash</option><option>Gemini 2.5 Pro</option></select></label></div>}{active === "history" && <div className="history-wrap"><div className="history-summary"><div><span className="section-kicker">ARCHIVE</span><h2>\uC800\uC7A5\uB41C \uACB0\uACFC</h2></div><span className="count-pill">\uCD1D {results.length}\uAC74</span></div>{results.map((item) => <button className="history-row" key={item.id} onClick={() => setSelected(item)}><div className="history-icon">TXT</div><div className="history-main"><b>{item.student} / {item.subject}</b><p>{item.content.slice(0, 90)}...</p></div><div className="history-meta"><span>{item.grade}</span><small>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(item.created_at))}</small></div><span className="chevron">&gt;</span></button>)}{selected && <div className="detail panel"><div className="detail-head"><div><span className="section-kicker">SAVED DRAFT</span><h2>{selected.student} / {selected.subject}</h2></div><button className="icon-button" onClick={() => setSelected(null)}>X</button></div><p>{selected.content}</p></div>}</div>}{active === "new" && <><div className="intro"><div><span className="section-kicker">3-STEP WORKFLOW</span><p>\uD65C\uB3D9 \uD0A4\uC6CC\uB4DC\uB97C \uC785\uB825\uD558\uBA74 \uC218\uC9D1, \uC791\uC131, \uAC80\uD1A0 \uC5D0\uC774\uC804\uD2B8\uAC00 \uC2E4\uC81C Gemini API\uB97C \uD1B5\uD574 \uC791\uC5C5\uD569\uB2C8\uB2E4.</p></div><div className="agent-steps"><span className={agent === "collect" ? "on" : agent !== "idle" && agent !== "error" ? "complete" : ""}>01 {text.collect}</span><i>&gt;</i><span className={agent === "write" ? "on" : agent === "review" || agent === "done" ? "complete" : ""}>02 {text.write}</span><i>&gt;</i><span className={agent === "review" ? "on" : agent === "done" ? "complete" : ""}>03 {text.review}</span></div></div><div className="grid"><div className="input-column panel"><span className="section-kicker">INPUT</span><h2>{text.input}</h2><p className="muted">\uD559\uC2B5 \uACFC\uC81C\uBCC4 \uD0A4\uC6CC\uB4DC\uB098 \uAD00\uCC30 \uB0B4\uC6A9\uC744 \uC904\uBC14\uAFC8\uC73C\uB85C \uAD6C\uBD84\uD574 \uC785\uB825\uD558\uC138\uC694.</p><div className="field-row"><label>{text.grade}<select value={grade} onChange={(event) => setGrade(event.target.value)}><option>1\uD559\uB144</option><option>2\uD559\uB144</option><option>3\uD559\uB144</option></select></label><label>{text.subject}<input value={subject} onChange={(event) => setSubject(event.target.value)} /></label></div><label>{text.student}<input value={student} onChange={(event) => setStudent(event.target.value)} /></label><label>{text.activity}<textarea value={keywords} onChange={(event) => setKeywords(event.target.value)} rows={8} /></label><div className="input-footer"><span>{activities.length}\uAC1C \uD65C\uB3D9 \uC778\uC2DD</span><button className="primary" onClick={generate} disabled={agent !== "idle" && agent !== "done" && agent !== "error"}>{agent !== "idle" && agent !== "done" && agent !== "error" ? "\uC0DD\uC131 \uC911..." : text.make}</button></div>{error && <p className="error-message">{error}</p>}</div><div className="output-column"><div className="output-header"><div><span className="section-kicker">OUTPUT</span><h2>{text.output}</h2></div>{agent === "done" && <span className="ready-pill">OK {text.complete}</span>}</div>{agent === "idle" && <div className="empty-state"><div className="empty-mark">+</div><h3>{text.empty}</h3><p>\uC67C\uCABD\uC5D0 \uD65C\uB3D9\uC744 \uC785\uB825\uD558\uACE0<br />{text.make}\uB97C \uB20C\uB7EC\uBCF4\uC138\uC694.</p></div>}{agent !== "idle" && agent !== "done" && agent !== "error" && <div className="loading-state"><div className="loader" /><h3>{agent === "collect" ? "\uD65C\uB3D9 \uB0B4\uC6A9\uC744 \uC815\uB9AC\uD558\uACE0 \uC788\uC5B4\uC694" : agent === "write" ? "\uC138\uD2B9 \uBB38\uAD6C\uB97C \uC0DD\uC131\uD558\uACE0 \uC788\uC5B4\uC694" : "\uD45C\uD604 \uADDC\uC815\uC744 \uAC80\uD1A0\uD558\uACE0 \uC788\uC5B4\uC694"}</h3><p>Gemini API \uC751\uB2F5\uC744 \uAE30\uB2E4\uB9AC\uB294 \uC911\uC785\uB2C8\uB2E4.</p></div>}{agent === "error" && <div className="empty-state"><div className="empty-mark">!</div><h3>API \uC624\uB958</h3><p>\uC124\uC815\uC5D0\uC11C API Key\uC640 \uBAA8\uB378\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.</p></div>}{agent === "done" && <div className="results-list">{output.map((item, index) => <article className="result-card" key={`${item}-${index}`}><div className="result-top"><span className="activity-num">\uD65C\uB3D9 {String(index + 1).padStart(2, "0")}</span><span className="reviewed">OK \uAC80\uD1A0\uB428</span></div><p>{item}</p></article>)}<div className="result-actions"><button className="secondary" onClick={download}>DOWNLOAD {text.download}</button><button className="primary" onClick={saveResult}>{saved ? "\uC800\uC7A5 \uC644\uB8CC" : text.save}</button></div></div>}</div></div></>}</section></main>;
}
