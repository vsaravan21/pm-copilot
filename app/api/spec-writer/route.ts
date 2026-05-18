import { NextResponse } from "next/server";

import { runSpecWriterAgent } from "@/lib/agents/specWriterAgent";
import {
  coerceIntakeOutput,
  coercePrioritizationOutput,
  coerceSynthesisOutput,
  type SpecWriterAgentInput,
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

  const focusedOpportunityId =
    typeof typed.focusedOpportunityId === "string"
      ? typed.focusedOpportunityId.trim() || undefined
      : undefined;

  let intakeOutput: SpecWriterAgentInput["intakeOutput"];
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

  let synthesisOutput: SpecWriterAgentInput["synthesisOutput"];
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

  let prioritizationOutput: SpecWriterAgentInput["prioritizationOutput"];
  if (typed.prioritizationOutput !== undefined && typed.prioritizationOutput !== null) {
    try {
      prioritizationOutput = coercePrioritizationOutput(typed.prioritizationOutput);
    } catch {
      return NextResponse.json(
        {
          error:
            "Field `prioritizationOutput` could not be parsed as Prioritization output",
        },
        { status: 400 },
      );
    }
  }

  const payload: SpecWriterAgentInput = {
    rawInput,
    productName,
    targetUser,
    focusedOpportunityId,
    intakeOutput,
    synthesisOutput,
    prioritizationOutput,
  };

  try {
    const result = await runSpecWriterAgent(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spec Writer Agent failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
