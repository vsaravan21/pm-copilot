import { NextResponse } from "next/server";

import { runIntakeAgent } from "@/lib/agents/intakeAgent";
import { agentErrorResponse } from "@/lib/api/agentRouteResponse";
import { parseIntakeAgentInput } from "@/lib/parseAgentHttpBody";

export async function POST(request: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const bodyObj = typeof bodyJson === "object" && bodyJson !== null ? bodyJson : {};
  const typed = bodyObj as Record<string, unknown>;

  const payload = parseIntakeAgentInput(typed);

  try {
    const result = await runIntakeAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    return agentErrorResponse(error, "Intake Agent");
  }
}
