import { NextResponse } from "next/server";

import { runIntakeAgent } from "@/lib/agents/intakeAgent";
import type { IntakeRequestBody } from "@/lib/schemas";

export async function POST(request: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const bodyObj = typeof bodyJson === "object" && bodyJson !== null ? bodyJson : {};
  const typed = bodyObj as Record<string, unknown>;

  const notes =
    typeof typed.notes === "string"
      ? typed.notes.trim()
      : "";

  if (!notes.length) {
    return NextResponse.json(
      { error: "Field `notes` is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  const productName =
    typeof typed.productName === "string"
      ? typed.productName.trim() || undefined
      : undefined;

  const targetUser =
    typeof typed.targetUser === "string"
      ? typed.targetUser.trim() || undefined
      : undefined;

  const payload: IntakeRequestBody = { notes, productName, targetUser };

  try {
    const result = await runIntakeAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Intake Agent failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
