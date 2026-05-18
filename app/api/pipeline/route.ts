import { NextResponse } from "next/server";

import { runFullPipeline } from "@/lib/pipeline/runFullPipeline";

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

  try {
    const result = await runFullPipeline({ notes, productName, targetUser });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Pipeline failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
