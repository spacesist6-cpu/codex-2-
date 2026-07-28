"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Result = { id: string; student: string; grade: string; subject: string; created_at: string; content: string };
type AgentState = "idle" | "collect" | "write" | "review" | "done";

const demoResults: Result[] = [
  { id: "demo-1", student: "2026-정보-017", grade: "2학년", subject: "정보", created_at: "2026-07-28T09:20:00+09:00", content: "파이썬을 활용한 데이터 정제 과제에서 결측값의 의미를 비교하고 조건에 맞는 처리 방법을 선택함. 반복문과 리스트 자료구조의 관계를 스스로 설명하며 코드의 실행 결과를 검증하는 태도가 돋보임." },
  { id: "demo-2", student: "2026-정보-008", grade: "1학년", subject: "정보", created_at: "2026-07-26T16:10:00+09:00", content: "웹 접근성 조사 활동에서 대체 텍스트와 명도 대비의 필요성을 사례로 정리함. 사용자 입장에서 불편을 발견하고 개선안을 논리적으로 제안하는 문제 해결 과정을 보여 줌." },
];

const supabase: SupabaseClient | null = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : null;

function nowLabel() { return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date()); }

export default function Home() {
  const [active, setActive] = useState("new");
  const [grade, setGrade] = useState("2학년");
  const [subject, setSubject] = useState("정보");
  const [student, setStudent] = useState("2026-정보-017");
  const [keywords, setKeywords] = useState("파이썬으로 CSV 데이터를 불러와 결측값을 처리함\n반복문과 리스트를 활용해 평균을 계산함\n오류가 난 코드를 원인별로 수정하고 실행 결과를 기록함");
  const [model, setModel] = useState("Gemini 3.5 Flash-Lite");
  const [apiKey, setApiKey] = useState("");
  const [agent, setAgent] = useState<AgentState>("idle");
  const [results, setResults] = useState<Result[]>([]);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<Result | null>(null);

  useEffect(() => { loadResults(); }, []);
  async function loadResults() {
    if (supabase) {
      const { data } = await supabase.from("seteuk_results").select("*").order("created_at", { ascending: false });
      if (data) { setResults(data as Result[]); return; }
    }
    setResults(demoResults);
  }

  const activityList = useMemo(() => keywords.split("\n").map((x) => x.trim()).filter(Boolean), [keywords]);
  async function generate() {
    if (!keywords.trim()) return;
    setSaved(false); setAgent("collect");
    await new Promise((r) => setTimeout(r, 650)); setAgent("write");
    await new Promise((r) => setTimeout(r, 850)); setAgent("review");
    await new Promise((r) => setTimeout(r, 700)); setAgent("done");
  }
  const output = activityList.map((item, i) => `${item} 활동에서 관련 개념을 스스로 정리하고 ${i % 2 ? "실행 결과를 비교하며" : "문제 해결 과정을 기록하며"} 과제를 완성함. 코드의 오류 원인을 찾아 수정하는 과정에서 논리적으로 사고하고, 정보 교과의 핵심 개념을 실제 문제에 적용하는 태도를 보임.`);
  async function saveResult() {
    const row = { id: crypto.randomUUID(), student, grade, subject, created_at: new Date().toISOString(), content: output.join("\n\n") };
    if (supabase) await supabase.from("seteuk_results").insert(row);
    setResults((prev) => [row, ...prev]); setSaved(true);
  }
  function download() {
    const text = output.map((x, i) => `[활동 ${String(i + 1).padStart(2, "0")}]\n${x}`).join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${student}-${subject}-세특초안.txt`; a.click(); URL.revokeObjectURL(url);
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span>세특 메이커</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={active === "new" ? "nav-item active" : "nav-item"} onClick={() => { setActive("new"); setSelected(null); }}><span>✦</span> 새 초안 만들기</button>
      <button className={active === "history" ? "nav-item active" : "nav-item"} onClick={() => setActive("history")}><span>◷</span> 저장 내역 <em>{results.length}</em></button>
      <div className="sidebar-bottom"><button className={active === "settings" ? "nav-item active" : "nav-item"} onClick={() => setActive("settings")}><span>⚙</span> 개인 설정</button><div className="user-card"><div className="avatar">담</div><div><b>담당 교사</b><small>정보 교과</small></div><span className="dot" /></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><span className="eyebrow">INFORMATION · STUDENT RECORD</span><h1>{active === "new" ? "세특 문구 초안" : active === "history" ? "저장 내역" : "개인 설정"}</h1></div><div className="connection"><span className="status-dot" /> {supabase ? "Supabase 연결됨" : "데모 모드"}</div></header>
      {active === "settings" && <div className="settings-panel panel"><span className="section-kicker">PREFERENCES</span><h2>생성 환경 설정</h2><p className="muted">개인 API 키와 기본 모델을 지정하면 다음 생성부터 반영됩니다.</p><label>Gemini API Key<input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza••••••••••••••••" type="password" /></label><label>선호 모델<select value={model} onChange={(e) => setModel(e.target.value)}><option>Gemini 3.5 Flash-Lite</option><option>Gemini 2.5 Flash</option><option>Gemini 2.5 Pro</option></select></label><button className="primary small" onClick={() => alert("설정이 저장되었습니다.")}>설정 저장</button></div>}
      {active === "history" && <div className="history-wrap"><div className="history-summary"><div><span className="section-kicker">ARCHIVE</span><h2>지난 결과를 다시 확인하세요</h2></div><span className="count-pill">총 {results.length}건</span></div>{results.map((r) => <button className="history-row" key={r.id} onClick={() => setSelected(r)}><div className="history-icon">TXT</div><div className="history-main"><b>{r.student} <span>·</span> {r.subject}</b><p>{r.content.slice(0, 90)}…</p></div><div className="history-meta"><span>{r.grade}</span><small>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(r.created_at))}</small></div><span className="chevron">›</span></button>)}{selected && <div className="detail panel"><div className="detail-head"><div><span className="section-kicker">SAVED DRAFT</span><h2>{selected.student} · {selected.subject}</h2></div><button className="icon-button" onClick={() => setSelected(null)}>×</button></div><p className="detail-date">{selected.grade} · {nowLabel()}</p><p>{selected.content}</p></div>}</div>}
      {active === "new" && <><div className="intro"><div><span className="section-kicker">3-STEP WORKFLOW</span><p>학생 활동을 입력하면 수집·작성·검토 에이전트가 과목별 문구 초안을 완성합니다.</p></div><div className="agent-steps"><span className={agent === "collect" ? "on" : agent !== "idle" ? "complete" : ""}>01 수집</span><i>→</i><span className={agent === "write" ? "on" : ["review", "done"].includes(agent) ? "complete" : ""}>02 작성</span><i>→</i><span className={agent === "review" ? "on" : agent === "done" ? "complete" : ""}>03 검토</span></div></div><div className="grid"><div className="input-column panel"><span className="section-kicker">INPUT</span><h2>학생 활동 입력</h2><p className="muted">학습 과제별 키워드나 관찰 내용을 줄바꿈으로 구분해 입력하세요.</p><div className="field-row"><label>학년<select value={grade} onChange={(e) => setGrade(e.target.value)}><option>1학년</option><option>2학년</option><option>3학년</option></select></label><label>과목<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label></div><label>학생 식별값<input value={student} onChange={(e) => setStudent(e.target.value)} /></label><label>활동 키워드 / 관찰 내용<textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} rows={8} /></label><div className="input-footer"><span>{activityList.length}개 활동 인식</span><button className="primary" onClick={generate} disabled={agent !== "idle" && agent !== "done"}>{agent !== "idle" && agent !== "done" ? "에이전트 작업 중…" : "초안 생성하기 ✦"}</button></div></div><div className="output-column"><div className="output-header"><div><span className="section-kicker">OUTPUT</span><h2>과목별 세특 초안</h2></div>{agent === "done" && <span className="ready-pill">✓ 검토 완료</span>}</div>{agent === "idle" && <div className="empty-state"><div className="empty-mark">✧</div><h3>아직 생성된 초안이 없습니다</h3><p>왼쪽에 학생 활동을 입력하고<br />초안 생성하기를 눌러보세요.</p></div>}{agent !== "idle" && agent !== "done" && <div className="loading-state"><div className="loader" /><h3>{agent === "collect" ? "활동 내용을 정리하고 있어요" : agent === "write" ? "세특 문구를 작성하고 있어요" : "표현 규정을 점검하고 있어요"}</h3><p>에이전트가 순서대로 작업 중입니다.</p></div>}{agent === "done" && <div className="results-list">{output.map((text, i) => <article className="result-card" key={text}><div className="result-top"><span className="activity-num">활동 {String(i + 1).padStart(2, "0")}</span><span className="reviewed">검토됨 ✓</span></div><p>{text}</p></article>)}<div className="result-actions"><button className="secondary" onClick={download}>↓ 텍스트 다운로드</button><button className="primary" onClick={saveResult}>{saved ? "저장 완료 ✓" : "Supabase에 저장"}</button></div></div>}</div></div></>}
    </section>
  </main>;
}
