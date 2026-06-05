import { jsPDF } from "jspdf";

import type { SpecWriterAgentOutput, UserStoryDraft } from "@/lib/schemas";

import { prdDownloadFilename } from "./formatPrdDocument";

const MARGIN = 54;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;
const SECTION_GAP = 10;

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function writeParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
): number {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    y = ensureSpace(doc, y, LINE_HEIGHT);
    doc.text(line, x, y);
    y += LINE_HEIGHT;
  }
  return y;
}

function writeBullets(doc: jsPDF, items: string[], x: number, y: number): number {
  for (const item of items) {
    y = ensureSpace(doc, y, LINE_HEIGHT * 2);
    const lines = doc.splitTextToSize(`• ${item}`, CONTENT_WIDTH - 12) as string[];
    for (const line of lines) {
      y = ensureSpace(doc, y, LINE_HEIGHT);
      doc.text(line, x + 8, y);
      y += LINE_HEIGHT;
    }
    y += 2;
  }
  return y;
}

function writeSection(
  doc: jsPDF,
  heading: string,
  body: string | string[],
  y: number,
): number {
  y = ensureSpace(doc, y, LINE_HEIGHT * 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 30, 60);
  doc.text(heading, MARGIN, y);
  y += LINE_HEIGHT + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 55);

  if (Array.isArray(body)) {
    if (!body.length) {
      y = writeParagraph(doc, "—", MARGIN, y, CONTENT_WIDTH, 10);
    } else {
      y = writeBullets(doc, body, MARGIN, y);
    }
  } else {
    y = writeParagraph(doc, body || "—", MARGIN, y, CONTENT_WIDTH, 10);
  }

  return y + SECTION_GAP;
}

function formatStoriesForPdf(stories: UserStoryDraft[]): string {
  return stories
    .map((s, i) => {
      const ac = s.acceptanceCriteria.map((c) => `  - ${c}`).join("\n");
      return `${i + 1}. ${s.title}\n${s.description}\n${ac}`;
    })
    .join("\n\n");
}

/** Generate and trigger download of a stakeholder-ready PRD PDF. */
export function downloadPrdPdf(prd: SpecWriterAgentOutput): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 20, 50);
  const titleLines = doc.splitTextToSize(prd.prdTitle, CONTENT_WIDTH) as string[];
  for (const line of titleLines) {
    y = ensureSpace(doc, y, 22);
    doc.text(line, MARGIN, y);
    y += 22;
  }

  doc.setDrawColor(155, 120, 220);
  doc.setLineWidth(1);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 18;

  y = writeSection(doc, "Problem statement", prd.problemStatement, y);
  y = writeSection(doc, "Target users", prd.targetUsers, y);
  y = writeSection(doc, "Goals", prd.goals, y);
  y = writeSection(doc, "Non-goals", prd.nonGoals, y);
  y = writeSection(doc, "Proposed solution", prd.proposedSolution, y);
  y = writeSection(doc, "Feature recommendations", prd.featureRecommendations, y);
  y = writeSection(
    doc,
    "User stories",
    prd.userStories.length ? formatStoriesForPdf(prd.userStories) : "—",
    y,
  );
  y = writeSection(doc, "Core requirements", prd.coreRequirements, y);
  y = writeSection(doc, "Success metrics", prd.successMetrics, y);
  y = writeSection(doc, "Launch considerations", prd.launchConsiderations, y);
  y = writeSection(doc, "Risks", prd.risks, y);
  y = writeSection(doc, "Open questions", prd.openQuestions, y);
  y = writeSection(doc, "Next steps", prd.nextSteps, y);
  if (prd.sourceContext.length) {
    writeSection(doc, "Source context & evidence", prd.sourceContext, y);
  }

  doc.save(prdDownloadFilename(prd));
}
