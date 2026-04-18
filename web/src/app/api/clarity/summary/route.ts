import { buildMockSummary, buildSummaryUserPayload, parseAiSummaryResult, SUMMARY_SYSTEM } from "@/lib/ai";
import { getOpenAiApiKey } from "@/lib/env";
import type { SummaryRequestBody, SummaryResponseBody } from "@/types/clarity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: SummaryRequestBody;
  try {
    body = (await req.json()) as SummaryRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.session?.intake) {
    return Response.json({ error: "Missing session.intake" }, { status: 400 });
  }

  const sessionPayload = {
    intake: body.session.intake,
    lifestyle: body.session.lifestyle ?? null,
    brainDump: body.session.brainDump ?? { text: "" },
  };

  const key = getOpenAiApiKey();
  if (!key) {
    const summary = buildMockSummary(sessionPayload);
    return Response.json({ summary } satisfies SummaryResponseBody);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SUMMARY_SYSTEM },
          {
            role: "user",
            content: buildSummaryUserPayload(sessionPayload),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[clarity/summary] OpenAI error", res.status, errText);
      const summary = buildMockSummary(sessionPayload);
      return Response.json({ summary: { ...summary, usedMock: true } });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const summary = buildMockSummary(sessionPayload);
      return Response.json({ summary: { ...summary, usedMock: true } });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      const summary = buildMockSummary(sessionPayload);
      return Response.json({ summary: { ...summary, usedMock: true } });
    }

    const summary = parseAiSummaryResult(parsed);
    if (!summary) {
      const fallback = buildMockSummary(sessionPayload);
      return Response.json({ summary: { ...fallback, usedMock: true } });
    }

    return Response.json({ summary } satisfies SummaryResponseBody);
  } catch (e) {
    console.error("[clarity/summary]", e);
    const summary = buildMockSummary(sessionPayload);
    return Response.json({ summary: { ...summary, usedMock: true } });
  }
}
