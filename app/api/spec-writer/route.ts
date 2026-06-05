import { NextResponse } from "next/server";

import { runSpecWriterAgent } from "@/lib/agents/specWriterAgent";
import { agentErrorResponse } from "@/lib/api/agentRouteResponse";
import { parseSpecWriterAgentInput } from "@/lib/parseAgentHttpBody";

export async function POST(request: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const bodyObj = typeof bodyJson === "object" && bodyJson !== null ? bodyJson : {};
  const typed = bodyObj as Record<string, unknown>;

  const payload = parseSpecWriterAgentInput(typed);

  try {
    const result = await runSpecWriterAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    return agentErrorResponse(error, "Spec Writer Agent");
  }
}
