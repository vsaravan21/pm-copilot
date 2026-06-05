import { NextResponse } from "next/server";

import { toAgentHttpError } from "@/lib/llm/errors";

export function agentErrorResponse(error: unknown, agentLabel: string): NextResponse {
  const { message, status } = toAgentHttpError(error, agentLabel);
  return NextResponse.json({ error: message }, { status });
}
