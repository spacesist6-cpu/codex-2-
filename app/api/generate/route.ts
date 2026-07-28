import { NextResponse } from "next/server";

type RequestBody = { apiKey?: string; model?: string; grade?: string; subject?: string; student?: string; activities?: string[] };

function modelId(label: string) { return label.toLowerCase().replace(/\s+/g, "-"); }

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  if (!body.apiKey) return NextResponse.json({ error: "Gemini API Key is required in Personal Settings." }, { status: 400 });
  if (!body.activities?.length) return NextResponse.json({ error: "Enter at least one student activity." }, { status: 400 });
  const prompt = `You are a Korean high-school information subject student-record writing team. Perform three roles: collect and organize activities, draft subject-specific student record sentences, and review them. Return JSON array only. Each item must be {"activity":"short activity summary","draft":"one polished Korean sentence"}. Do not include student identifiers. Avoid definitive claims, rankings, scores, exaggeration, or emotional evaluator language. Use evidence-based observational wording. Grade: ${body.grade}. Subject: ${body.subject}. Activities: ${body.activities.join(" | ")}`;
  const model = modelId(body.model || "Gemini 3.5 Flash-Lite");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(body.apiKey)}`;
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.35 } }) });
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || "Gemini request failed." }, { status: response.status });
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return NextResponse.json({ error: "Gemini returned no generated content." }, { status: 502 });
  try {
    const parsed = JSON.parse(raw) as Array<{ draft?: string }>;
    return NextResponse.json({ results: parsed.map((item) => item.draft || "").filter(Boolean) });
  } catch {
    return NextResponse.json({ results: [raw] });
  }
}
