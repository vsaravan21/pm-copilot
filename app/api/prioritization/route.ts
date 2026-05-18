import { NextResponse } from "next/server";

import { runPrioritizationAgent } from "@/lib/agents/prioritizationAgent";
import {
  coerceIntakeOutput,
  coerceSynthesisOutput,
  type PrioritizationAgentInput,
} from "@/lib/schemas";

export async function POST(request: Request) {
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const bodyObj = typeof bodyJson === "object" && bodyJson !== null ? bodyJson : {};
  const typed = bodyObj as Record<string, unknown>;

  const rawInput =
    typeof typed.rawInput === "string"
      ? typed.rawInput.trim() || undefined
      : undefined;

  const productName =
    typeof typed.productName === "string"
      ? typed.productName.trim() || undefined
      : undefined;

  const targetUser =
    typeof typed.targetUser === "string"
      ? typed.targetUser.trim() || undefined
      : undefined;

  let intakeOutput: PrioritizationAgentInput["intakeOutput"];
  if (typed.intakeOutput !== undefined && typed.intakeOutput !== null) {
    try {
      intakeOutput = coerceIntakeOutput(typed.intakeOutput);
    } catch {
      return NextResponse.json(
        { error: "Field `intakeOutput` could not be parsed as Intake output" },
        { status: 400 },
      );
    }
  }

  let synthesisOutput: PrioritizationAgentInput["synthesisOutput"];
  if (typed.synthesisOutput !== undefined && typed.synthesisOutput !== null) {
    try {
      synthesisOutput = coerceSynthesisOutput(typed.synthesisOutput);
    } catch {
      return NextResponse.json(
        { error: "Field `synthesisOutput` could not be parsed as Synthesis output" },
        { status: 400 },
      );
    }
  }

  const payload: PrioritizationAgentInput = {
    rawInput,
    productName,
    targetUser,
    intakeOutput,
    synthesisOutput,
  };

  try {
    const result = await runPrioritizationAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Prioritization Agent failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
