import { NextResponse } from "next/server";

import { runSynthesisAgent } from "@/lib/agents/synthesisAgent";
import {
  coerceIntakeOutput,
  type SynthesisAgentInput,
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
    typeof typed.rawInput === "string" ? typed.rawInput.trim() : "";

  if (!rawInput.length) {
    return NextResponse.json(
      { error: "Field `rawInput` is required and must be a non-empty string" },
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

  let intakeOutput: SynthesisAgentInput["intakeOutput"];
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

  const payload: SynthesisAgentInput = {
    rawInput,
    productName,
    targetUser,
    intakeOutput,
  };

  try {
    const result = await runSynthesisAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synthesis Agent failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
