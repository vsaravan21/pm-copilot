import {
  coerceIntakeOutput,
  type DetectedPMTask,
  type InputTypeClassification,
  type IntakeAgentOutput,
} from "@/lib/schemas";

/**
 * Parses user message blocks from prompts built via buildIntakeUserPrompt().
 */
export function extractNotesBlock(userContent: string): {
  notes: string;
  productName?: string;
  targetUser?: string;
} {
  const lines = userContent.split(/\r?\n/);
  let productName: string | undefined;
  let targetUser: string | undefined;
  let inNotes = false;
  const notesLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("Product name (from user): ")) {
      productName = line.slice("Product name (from user): ".length).trim();
      continue;
    }
    if (line.startsWith("Target user (from user): ")) {
      targetUser = line.slice("Target user (from user): ".length).trim();
      continue;
    }
    if (line.trim() === "<notes>") {
      inNotes = true;
      continue;
    }
    if (line.trim() === "</notes>") {
      inNotes = false;
      continue;
    }
    if (inNotes) notesLines.push(line);
  }

  const notes = notesLines.join("\n").trim();
  return { notes, productName, targetUser };
}

function heuristicIntake(payload: ReturnType<typeof extractNotesBlock>): IntakeAgentOutput {
  const { notes, productName: pn, targetUser: tu } = payload;
  const text = notes;
  const lower = text.toLowerCase();

  let inputType: InputTypeClassification = "mixed";
  if (
    /\b(interview|participant|moderator|transcript|recording|quotes?)\b/i.test(
      text,
    )
  )
    inputType = "user_interview";
  else if (/\b(bug|crash|broken|doesn'?t work|not working|ticket|zendesk)\b/i.test(text))
    inputType = "feedback";
  else if (/\b(brainstorm|whiteboard|idea dump|sticky notes)\b/i.test(lower))
    inputType = "brainstorm_notes";
  else if (/\b(sync|standup|meeting notes|retro|discussion)\b/i.test(lower))
    inputType = "meeting_notes";

  let detectedTask: DetectedPMTask = "discovery_synthesis";
  if (
    /\b(prioritize|prioritization|impact vs effort|rice)\b/i.test(lower)
  )
    detectedTask = "prioritization";
  else if (/\b(prd|requirements|spec|acceptance criteria|user stor(y|ies))\b/i.test(lower))
    detectedTask = "requirements_drafting";
  else if (/\b(strategy|north star|portfolio|alignment)\b/i.test(lower))
    detectedTask = "strategy";
  else if (/\b(ab test|experiment|hypothesis)\b/i.test(lower))
    detectedTask = "experiment_design";

  const sentences = splitSentences(text);
  const observations = bulletsOrSentences(text, sentences, 8);

  const painKeywords =
    /\b(frustrated|pain|slow|confus|blocked|can't|unable|waiting|billing|pricing|privacy|worried)\b/i;
  const painPoints = sentences
    .filter((s) => painKeywords.test(s))
    .slice(0, 6)
    .map((s) => s.replace(/\s+/g, " ").trim());

  const oppKeywords =
    /\b(if we|opportunity|wish|requested|really want|should (add|have)|could\b|might build)\b/i;
  let opportunities = sentences
    .filter((s) => oppKeywords.test(s))
    .slice(0, 6)
    .map((s) => s.replace(/\s+/g, " ").trim());
  if (!opportunities.length && sentences.length > 0) {
    opportunities = [
      "Validate whether relieving the top-mentioned friction materially improves activation or retention.",
    ];
  }

  const hintedUsers = [...extractQuotedNames(text)];
  const missing: string[] = [];
  if (!pn) missing.push("What product or surface does this relate to?");
  if (!tu) missing.push("Who is the primary user segment and JTBD?");
  if (painPoints.length < 2 && text.length > 140)
    missing.push("Which pain points are most frequent versus one-off anecdotes?");
  if (!/\b(goals?|kpis?|metrics?|north star)\b/i.test(lower))
    missing.push("What success metrics matter for prioritizing these signals?");
  if (!/\btimeline\b|\bconstraints?\b|\bbudget\b/i.test(lower))
    missing.push("What timeline, scope, or platform constraints apply?");

  const richness = Math.min(1, text.length / 2000 + observations.length / 12);
  const confidence = clamp(0.45 + richness * 0.35 + (painPoints.length > 1 ? 0.08 : 0), 0, 1);

  const excerpt = text.slice(0, 120).trim() + (text.length > 120 ? "…" : "");

  return coerceIntakeOutput({
    inputType,
    detectedTask,
    productContext: {
      productNameProvided: pn ?? null,
      targetUserProvided: tu ?? null,
      summary: buildSummary(observations.slice(0, 3)),
      userGroupsHinted: hintedUsers.slice(0, 5),
    },
    keyObservations: observations,
    potentialPainPoints: painPoints.length
      ? painPoints
      : [
          "(No explicit pain language detected — confirm with follow-up prompts or tagging.)",
        ],
    potentialOpportunities: opportunities,
    missingContextQuestions: uniq(missing).slice(0, 8),
    confidence,
    sourceExcerptHint: excerpt || null,
  });
}

export function mockIntakeFromMessages(messages: { role: string; content: string }[]): IntakeAgentOutput {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return heuristicIntake({ notes: "" });
  }
  return heuristicIntake(extractNotesBlock(lastUser.content));
}

function buildSummary(bits: string[]): string {
  if (!bits.length) return "Insufficient detail to summarize — capture more verbatim notes.";
  return bits
    .map((s) => s.replace(/^[•\-\*\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function bulletsOrSentences(
  raw: string,
  sentences: string[],
  limit: number,
): string[] {
  const bullets = raw
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^\s*[-*•]+\s*/, "")
        .replace(/^\s*\d+\.\s*/, "")
        .trim(),
    )
    .filter((l) => l.length > 8 && l.length < 400);
  const merged = uniq([...bullets, ...sentences.map((s) => s.trim())]).filter(
    Boolean,
  );
  return merged.slice(0, limit);
}

function extractQuotedNames(text: string): string[] {
  const re = /"([^"]{2,120})"|'([^']{2,120})'/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    names.push(String(m[1] ?? m[2]).trim());
  }
  return names;
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs.map((x) => x.trim()).filter(Boolean))];
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
