import { NextResponse } from "next/server";

import { runSynthesisAgent } from "@/lib/agents/synthesisAgent";
import { parseSynthesisAgentInput } from "@/lib/parseAgentHttpBody";

export async function POST(request: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const bodyObj = typeof bodyJson === "object" && bodyJson !== null ? bodyJson : {};
  const typed = bodyObj as Record<string, unknown>;

  const payload = parseSynthesisAgentInput(typed);

  try {
    const result = await runSynthesisAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synthesis Agent failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
