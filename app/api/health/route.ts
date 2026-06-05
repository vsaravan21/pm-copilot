import { NextResponse } from "next/server";

import { getPublicLLMStatus } from "@/lib/llm/env";

export async function GET() {
  return NextResponse.json(getPublicLLMStatus());
}
