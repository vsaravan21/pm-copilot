import type { DashboardAgentId } from "@/components/DashboardAgentCard";

export type AgentGuide = {
  title: string;
  inputLead: string;
  inputDetail: string;
  howItWorks: string;
  outputPreview: string[];
  standaloneNote: string;
  pipelineNote: string;
};

export const AGENT_GUIDES: Record<DashboardAgentId, AgentGuide> = {
  intake: {
    title: "Intake Agent",
    inputLead: "Messy product notes, interviews, feedback, or brainstorms",
    inputDetail:
      "Paste verbatim material plus optional product name and target user. Works alone—no prior agent output required.",
    howItWorks:
      "Classifies input type and likely PM task, extracts observations, pain points, opportunities, and missing-context questions. Surfaces gaps instead of failing when notes are thin.",
    outputPreview: [
      "Product context summary",
      "Key observations",
      "Potential pain points & opportunities",
      "Missing context questions",
      "Confidence score",
    ],
    standaloneNote: "Start here when you only have raw notes.",
    pipelineNote: "Usually runs first; output feeds Synthesis, Prioritization, and Spec Writer when attached.",
  },
  synthesis: {
    title: "Synthesis Agent",
    inputLead: "Raw notes + Intake Agent output",
    inputDetail:
      "Ingests verbatim notes and, when available, structured Intake JSON to weave narrative insights with evidence anchors.",
    howItWorks:
      "Identifies recurring themes, clusters pain language, articulates user needs with rationale, and surfaces opportunity-level insights tied to excerpts. Uses Intake context when provided but does not require it.",
    outputPreview: [
      "Themes and recurring motifs",
      "User pain summaries",
      "Articulated needs",
      "Feature-level opportunities linked to verbatim evidence",
      "Cross-cutting risks & remaining unknowns",
    ],
    standaloneNote: "Paste interviews, surveys, or notes only—synthesis still runs.",
    pipelineNote: "Attach Intake output from this session for richer product context and observations.",
  },
  prioritization: {
    title: "Prioritization Agent",
    inputLead: "Synthesis insights and/or any mix of product inputs",
    inputDetail:
      "Accepts opportunities, pain points, feature ideas, solutions, bets, roadmap items, stakeholder requests, brainstorm notes, and synthesized themes.",
    howItWorks:
      "Normalizes mixed inputs, classifies each item (opportunity, solution, feature, roadmap item, insight, or unknown), maps solutions back to underlying needs, then scores and ranks with an explicit priorityScore formula.",
    outputPreview: [
      "Ranked items with type, score & underlying problem",
      "Rerank Opportunities loop with change summary",
      "Dimension scores (impact, effort, risk, fit…)",
      "Tradeoffs, assumptions, risks & gaps per item",
      "Recommended next step",
    ],
    standaloneNote: "Paste any product inputs—no Synthesis required.",
    pipelineNote: "Attach Synthesis output to strengthen evidence and classification.",
  },
  spec: {
    title: "Spec Writer Agent",
    inputLead: "Prioritized item and/or your own feature idea",
    inputDetail:
      "Select a ranked item from Prioritization (scores, rationale, risks) and/or paste your own feature, opportunity, solution, or requirements.",
    howItWorks:
      "Generates an editable PRD with problem statement, solution, user stories, requirements, metrics, launch considerations, risks, and next steps. Copy as text or download a stakeholder-ready PDF.",
    outputPreview: [
      "Full PRD draft (not raw JSON)",
      "Refine PRD loop with revision summary",
      "Copy PRD & Download PDF (latest draft)",
      "User stories with acceptance criteria",
    ],
    standaloneNote: "Paste one feature or opportunity—no Prioritization required.",
    pipelineNote: "Select a prioritized item to ground the PRD in ranking context.",
  },
};
