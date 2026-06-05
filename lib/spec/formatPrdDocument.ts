import type { SpecWriterAgentOutput, UserStoryDraft } from "@/lib/schemas";

function bulletBlock(items: string[]): string {
  if (!items.length) return "—";
  return items.map((item) => `• ${item}`).join("\n");
}

function formatUserStories(stories: UserStoryDraft[]): string {
  if (!stories.length) return "—";
  return stories
    .map((story, i) => {
      const ac = story.acceptanceCriteria.length
        ? story.acceptanceCriteria.map((c) => `    - ${c}`).join("\n")
        : "    - (TBD)";
      return `${i + 1}. ${story.title}\n   ${story.description}\n   Acceptance criteria:\n${ac}`;
    })
    .join("\n\n");
}

/** Plain-text PRD for clipboard and PDF source. */
export function formatPrdDocument(prd: SpecWriterAgentOutput): string {
  const sections: [string, string][] = [
    ["Problem statement", prd.problemStatement || "—"],
    ["Target users", bulletBlock(prd.targetUsers)],
    ["Goals", bulletBlock(prd.goals)],
    ["Non-goals", bulletBlock(prd.nonGoals)],
    ["Proposed solution", prd.proposedSolution || "—"],
    ["Feature recommendations", bulletBlock(prd.featureRecommendations)],
    ["User stories", formatUserStories(prd.userStories)],
    ["Core requirements", bulletBlock(prd.coreRequirements)],
    ["Success metrics", bulletBlock(prd.successMetrics)],
    ["Launch considerations", bulletBlock(prd.launchConsiderations)],
    ["Risks", bulletBlock(prd.risks)],
    ["Open questions", bulletBlock(prd.openQuestions)],
    ["Next steps", bulletBlock(prd.nextSteps)],
  ];

  if (prd.sourceContext.length) {
    sections.push(["Source context & evidence", bulletBlock(prd.sourceContext)]);
  }

  const body = sections
    .map(([heading, content]) => `${heading}\n${"─".repeat(heading.length)}\n${content}`)
    .join("\n\n");

  return `${prd.prdTitle}\n${"=".repeat(Math.min(prd.prdTitle.length, 60))}\n\n${body}\n`;
}

export function prdDownloadFilename(prd: SpecWriterAgentOutput): string {
  const slug = prd.prdTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "product-requirements"}.pdf`;
}
